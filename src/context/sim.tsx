import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeSnapshot,
  deploymentsAt,
  drainStates,
  scriptedReports,
  sensorReadings,
  TICKS,
  type AcceptedMap,
  type SimSnapshot,
} from "@/lib/simulation";
import type { RoleId } from "@/data/city";

export interface LiveReport {
  id: string;
  zone_id: string;
  report_type: string;
  severity: string;
  water_depth_cm: number | null;
  description: string | null;
  reporter_name: string | null;
  tick: number;
  status: string;
  trust_score: number;
  created_at: string;
}

export interface DecisionRow {
  id: string;
  recommendation_id: string;
  zone_id: string | null;
  decision: string;
  officer_role: string;
  notes: string | null;
  tick: number;
  created_at: string;
}

interface SimContextValue {
  tick: number;
  running: boolean;
  speed: number;
  snapshot: SimSnapshot;
  drains: ReturnType<typeof drainStates>;
  sensors: ReturnType<typeof sensorReadings>;
  deployments: ReturnType<typeof deploymentsAt>;
  reports: ReturnType<typeof scriptedReports>;
  liveReports: LiveReport[];
  decisions: DecisionRow[];
  accepted: AcceptedMap;
  role: RoleId;
  selectedZoneId: string | null;
  setRole: (r: RoleId) => void;
  selectZone: (id: string | null) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (s: number) => void;
  seek: (t: number) => void;
  submitReport: (input: {
    zone_id: string;
    report_type: string;
    severity: string;
    water_depth_cm: number | null;
    description: string;
    reporter_name: string;
  }) => Promise<{ error: string | null }>;
  recordDecision: (recId: string, zoneId: string, decision: string, notes: string) => Promise<void>;
  connected: boolean;
}

const SimContext = createContext<SimContextValue | null>(null);

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used inside <SimProvider>");
  return ctx;
}

export function SimProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [role, setRole] = useState<RoleId>("commissioner");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [connected, setConnected] = useState(false);
  const writeGuard = useRef(0);

  /* ---------------- shared state sync ---------------- */
  const pushState = useCallback(
    async (patch: { tick?: number; running?: boolean; speed?: number }) => {
      writeGuard.current = Date.now();
      await supabase.from("sim_state").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", "demo");
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("sim_state").select("*").eq("id", "demo").maybeSingle();
      if (cancelled || !data) return;
      setTick(data.tick ?? 0);
      setRunning(data.running ?? false);
      setSpeedState(Number(data.speed ?? 1));
      setConnected(true);
    })();

    void (async () => {
      const [{ data: reps }, { data: decs }] = await Promise.all([
        supabase.from("citizen_reports").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("decision_log").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (cancelled) return;
      setLiveReports((reps ?? []) as LiveReport[]);
      setDecisions((decs ?? []) as DecisionRow[]);
    })();

    const channel = supabase
      .channel("sih-demo")
      .on("postgres_changes", { event: "*", schema: "public", table: "sim_state" }, (payload) => {
        const row = payload.new as { tick: number; running: boolean; speed: number };
        if (Date.now() - writeGuard.current < 1200) return;
        setTick(row.tick);
        setRunning(row.running);
        setSpeedState(Number(row.speed));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "citizen_reports" }, (payload) => {
        setLiveReports((p) => [payload.new as LiveReport, ...p]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "decision_log" }, (payload) => {
        setDecisions((p) => [payload.new as DecisionRow, ...p]);
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  /* ---------------- local clock ---------------- */
  useEffect(() => {
    if (!running) return;
    const interval = Math.max(120, 1400 / speed);
    const id = window.setInterval(() => {
      setTick((t) => {
        if (t >= TICKS) {
          setRunning(false);
          void pushState({ running: false, tick: TICKS });
          return TICKS;
        }
        const next = t + 1;
        if (next % 3 === 0 || next === TICKS) void pushState({ tick: next });
        return next;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [running, speed, pushState]);

  const play = useCallback(() => {
    setRunning(true);
    void pushState({ running: true });
  }, [pushState]);
  const pause = useCallback(() => {
    setRunning(false);
    void pushState({ running: false, tick });
  }, [pushState, tick]);
  const reset = useCallback(() => {
    setRunning(false);
    setTick(0);
    void pushState({ running: false, tick: 0 });
  }, [pushState]);
  const setSpeed = useCallback(
    (s: number) => {
      setSpeedState(s);
      void pushState({ speed: s });
    },
    [pushState],
  );
  const seek = useCallback(
    (t: number) => {
      setTick(t);
      void pushState({ tick: t });
    },
    [pushState],
  );

  /* ---------------- derived ---------------- */
  const accepted: AcceptedMap = useMemo(() => {
    const map: AcceptedMap = {};
    for (const d of decisions) {
      if (d.decision === "accepted" && (map[d.recommendation_id] === undefined || d.tick < map[d.recommendation_id]!)) {
        map[d.recommendation_id] = d.tick;
      }
    }
    return map;
  }, [decisions]);

  const snapshot = useMemo(() => computeSnapshot(tick, accepted), [tick, accepted]);
  const drains = useMemo(() => drainStates(tick, snapshot.clearedTick), [tick, snapshot.clearedTick]);
  const sensors = useMemo(() => sensorReadings(tick, snapshot, drains), [tick, snapshot, drains]);
  const deployments = useMemo(() => deploymentsAt(tick, snapshot.clearedTick), [tick, snapshot.clearedTick]);
  const reports = useMemo(() => scriptedReports(tick), [tick]);

  const submitReport = useCallback<SimContextValue["submitReport"]>(
    async (input) => {
      const { error } = await supabase.from("citizen_reports").insert({
        ...input,
        tick,
        status: "unverified",
        trust_score: 0.6,
      });
      return { error: error?.message ?? null };
    },
    [tick],
  );

  const recordDecision = useCallback<SimContextValue["recordDecision"]>(
    async (recId, zoneId, decision, notes) => {
      const roleLabel = role;
      await supabase.from("decision_log").insert({
        recommendation_id: recId,
        zone_id: zoneId,
        decision,
        officer_role: roleLabel,
        notes,
        tick,
      });
    },
    [role, tick],
  );

  const value: SimContextValue = {
    tick,
    running,
    speed,
    snapshot,
    drains,
    sensors,
    deployments,
    reports,
    liveReports,
    decisions,
    accepted,
    role,
    selectedZoneId,
    setRole,
    selectZone: setSelectedZoneId,
    play,
    pause,
    reset,
    setSpeed,
    seek,
    submitReport,
    recordDecision,
    connected,
  };

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}
