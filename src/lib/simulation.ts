import {
  DRAINS,
  RESOURCES,
  ROADS,
  SENSORS,
  ZONES,
  ZONE_BY_ID,
  type Drain,
  type RiskLevel,
  type Zone,
} from "@/data/city";

export const TICKS = 72; // 6 hours at 5-minute steps
export const MINUTES_PER_TICK = 5;
const START_HOUR = 14; // 14:00 IST

/** Scripted scenario constants — Zone A (Ashokgarh) / drain D17 */
export const SCENARIO = {
  zoneId: "Z-A",
  drainId: "D17",
  blockageTick: 18,
  divergenceTick: 20,
  firstCitizenReportTick: 22,
  adaptationTick: 26,
  decisionTick: 30,
  dispatchTick: 34,
  arrivalTick: 44,
  clearedTickIfAccepted: 50,
  clearedTickIfNot: 60,
  peakTick: 40,
};

export const RISK_ORDER: RiskLevel[] = ["low", "moderate", "high", "severe"];

export function riskFromDepth(depthCm: number): RiskLevel {
  if (depthCm >= 18) return "severe";
  if (depthCm >= 10) return "high";
  if (depthCm >= 4) return "moderate";
  return "low";
}

export function clockLabel(tick: number): string {
  const total = START_HOUR * 60 + tick * MINUTES_PER_TICK;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const PEAK = 58;
const SIGMA = 8.5;
const BASE_PEAK_TICK = 32;

/** Observed rainfall intensity (mm/hr) for a zone at a tick. */
export function rainfallAt(zone: Zone, tick: number): number {
  const t = tick;
  const drizzle = t >= 4 && t <= 20 ? 2.2 + 1.6 * Math.sin((t - 4) / 3) : 0;
  const centre = BASE_PEAK_TICK + zone.rainOffset;
  const storm = PEAK * zone.rainMult * Math.exp(-((t - centre) ** 2) / (2 * SIGMA * SIGMA));
  return Math.max(0, Number((drizzle + storm).toFixed(1)));
}

/** Nowcast rainfall for lead time — issued at `tick`, valid at `tick + lead`. */
export function nowcastAt(zone: Zone, tick: number, lead: number): number {
  const truth = rainfallAt(zone, tick + lead);
  // deterministic small forecast error that shrinks with shorter lead time
  const bias = Math.sin((zone.lat + tick) * 7.7) * (lead / 12) * 6;
  return Math.max(0, Number((truth + bias).toFixed(1)));
}

function avgSilt(zoneId: string): number {
  const ds = DRAINS.filter((d) => d.zoneId === zoneId);
  return ds.reduce((s, d) => s + d.siltIndex, 0) / Math.max(1, ds.length);
}

const SILT_BY_ZONE: Record<string, number> = Object.fromEntries(
  ZONES.map((z) => [z.id, avgSilt(z.id)]),
);

/** Capacity the network *actually* has (ground truth). */
function actualCapacity(zone: Zone, tick: number, clearedTick: number): number {
  const base = zone.drainCapacity * (1 - SILT_BY_ZONE[zone.id]! * 0.35);
  if (zone.id !== SCENARIO.zoneId) return base;
  if (tick < SCENARIO.blockageTick) return base;
  if (tick >= clearedTick) return zone.drainCapacity * 0.82;
  return zone.drainCapacity * 0.3;
}

/** Capacity the *model* believes it has — this is what adaptation corrects. */
function modelCapacity(zone: Zone, tick: number, clearedTick: number, adapted: boolean): number {
  if (zone.id !== SCENARIO.zoneId) return actualCapacity(zone, tick, clearedTick);
  if (adapted && tick >= SCENARIO.adaptationTick) return actualCapacity(zone, tick, clearedTick);
  return zone.drainCapacity * 0.85;
}

function integrate(zone: Zone, upto: number, capacityFn: (t: number) => number): number[] {
  const conc = 1 + zone.lowLying * 3.8;
  const dt = MINUTES_PER_TICK / 60;
  let depth = 0;
  const out: number[] = [];
  for (let t = 0; t <= upto; t++) {
    const inflow = rainfallAt(zone, t) * zone.runoff;
    const cap = capacityFn(t);
    const net = inflow - cap;
    const delta = net >= 0 ? (net * dt) / 10 : (net * dt * 0.55) / 10;
    depth = Math.max(0, depth + delta * conc);
    out.push(Number(depth.toFixed(2)));
  }
  return out;
}

export interface ZoneState {
  zone: Zone;
  rainfall: number;
  rainfall30: number;
  cumulative: number;
  depthCm: number;
  /** what the un-adapted model would have said */
  predictedDepthCm: number;
  /** the live adaptive forecast for +60 min */
  forecastDepthCm: number;
  risk: RiskLevel;
  predictedRisk: RiskLevel;
  forecastRisk: RiskLevel;
  confidence: number;
  drainStress: number;
  reportCount: number;
  peopleAtRisk: number;
  divergence: number;
  trend: "rising" | "falling" | "steady";
}

export interface SimSnapshot {
  tick: number;
  clock: string;
  phase: string;
  phaseKind: "prediction" | "observation" | "adaptation" | "decision" | "resource" | "baseline";
  zones: ZoneState[];
  zoneById: Record<string, ZoneState>;
  cityRainAvg: number;
  citySeverity: number;
  adaptationApplied: boolean;
  clearedTick: number;
}

export interface AcceptedMap {
  [recId: string]: number; // tick accepted
}

export function computeSnapshot(tick: number, accepted: AcceptedMap = {}): SimSnapshot {
  const desiltAccepted = accepted["REC-02"] !== undefined && accepted["REC-02"]! <= SCENARIO.arrivalTick;
  const clearedTick = desiltAccepted ? SCENARIO.clearedTickIfAccepted : SCENARIO.clearedTickIfNot;

  const zones: ZoneState[] = ZONES.map((zone) => {
    const truth = integrate(zone, Math.min(TICKS, tick + 12), (t) => actualCapacity(zone, t, clearedTick));
    const naive = integrate(zone, Math.min(TICKS, tick + 12), (t) =>
      modelCapacity(zone, t, clearedTick, false),
    );
    const adaptiveModel = integrate(zone, Math.min(TICKS, tick + 12), (t) =>
      modelCapacity(zone, t, clearedTick, true),
    );

    const depth = truth[tick] ?? 0;
    const prev = truth[Math.max(0, tick - 3)] ?? 0;
    const forecast = adaptiveModel[Math.min(TICKS, tick + 12)] ?? depth;
    const predicted = naive[tick] ?? 0;

    let cumulative = 0;
    for (let t = 0; t <= tick; t++) cumulative += (rainfallAt(zone, t) * MINUTES_PER_TICK) / 60;

    const rain = rainfallAt(zone, tick);
    let rain30 = 0;
    for (let t = Math.max(0, tick - 6); t <= tick; t++) rain30 += (rainfallAt(zone, t) * MINUTES_PER_TICK) / 60;

    const divergence = Number((depth - predicted).toFixed(2));
    const isScenario = zone.id === SCENARIO.zoneId;
    const confidenceDrop = isScenario && tick >= SCENARIO.divergenceTick && tick < SCENARIO.adaptationTick ? 0.28 : 0;
    const boost = isScenario && tick >= SCENARIO.adaptationTick ? 0.06 : 0;
    const health = SENSORS.filter((s) => s.zoneId === zone.id);
    const healthy = health.filter((s) => s.health === "online").length / Math.max(1, health.length);
    const confidence = Math.max(
      0.32,
      Math.min(0.97, 0.72 + healthy * 0.18 + boost - confidenceDrop - Math.abs(divergence) * 0.004),
    );

    const cap = actualCapacity(zone, tick, clearedTick);
    const drainStress = Math.min(1, (rain * zone.runoff) / Math.max(1, cap));

    return {
      zone,
      rainfall: rain,
      rainfall30: Number(rain30.toFixed(1)),
      cumulative: Number(cumulative.toFixed(1)),
      depthCm: Number(depth.toFixed(1)),
      predictedDepthCm: Number(predicted.toFixed(1)),
      forecastDepthCm: Number(forecast.toFixed(1)),
      risk: riskFromDepth(depth),
      predictedRisk: riskFromDepth(predicted),
      forecastRisk: riskFromDepth(forecast),
      confidence: Number(confidence.toFixed(2)),
      drainStress: Number(drainStress.toFixed(2)),
      reportCount: scriptedReports(tick).filter((r) => r.zoneId === zone.id).length,
      peopleAtRisk: Math.round(
        zone.population * Math.min(0.42, (depth / 60) * (0.4 + zone.lowLying * 0.5)),
      ),
      divergence,
      trend: depth - prev > 0.4 ? "rising" : prev - depth > 0.4 ? "falling" : "steady",
    };
  });

  const zoneById = Object.fromEntries(zones.map((z) => [z.zone.id, z])) as Record<string, ZoneState>;
  const phase = phaseFor(tick);

  return {
    tick,
    clock: clockLabel(tick),
    phase: phase.label,
    phaseKind: phase.kind,
    zones,
    zoneById,
    cityRainAvg: Number((zones.reduce((s, z) => s + z.rainfall, 0) / zones.length).toFixed(1)),
    citySeverity: Number(
      (zones.reduce((s, z) => s + RISK_ORDER.indexOf(z.risk), 0) / (zones.length * 3)).toFixed(2),
    ),
    adaptationApplied: tick >= SCENARIO.adaptationTick,
    clearedTick,
  };
}

export function phaseFor(tick: number): { label: string; kind: SimSnapshot["phaseKind"] } {
  if (tick < 12) return { label: "Baseline monitoring", kind: "baseline" };
  if (tick < SCENARIO.divergenceTick) return { label: "Prediction — convective cell nowcast", kind: "prediction" };
  if (tick < SCENARIO.adaptationTick) return { label: "Observation — model/ground divergence", kind: "observation" };
  if (tick < SCENARIO.decisionTick) return { label: "Adaptation — D17 blockage inferred", kind: "adaptation" };
  if (tick < SCENARIO.dispatchTick) return { label: "Decision — recommendations issued", kind: "decision" };
  if (tick < 56) return { label: "Resource allocation & response", kind: "resource" };
  return { label: "Recession & post-event learning", kind: "observation" };
}

/* ------------------------------------------------------------------ */
/* Scripted narrative artefacts                                        */
/* ------------------------------------------------------------------ */

export interface TimelineEvent {
  tick: number;
  kind: "prediction" | "observation" | "adaptation" | "decision" | "resource";
  title: string;
  detail: string;
  zoneId?: string;
}

export const TIMELINE: TimelineEvent[] = [
  { tick: 0, kind: "observation", title: "Monitoring window opened", detail: "All 18 field sensors polled. City-wide risk LOW. Pre-monsoon drizzle over west Nadipur.", },
  { tick: 6, kind: "prediction", title: "Radar nowcast: cell forming NW of city", detail: "Convective cell detected 14 km NW, tracking SE at 21 km/h. Lead time to Ashokgarh: ~2 h 10 m.", zoneId: "Z-A" },
  { tick: 12, kind: "prediction", title: "Hyperlocal nowcast issued — Zone A", detail: "Ashokgarh (Z-A) predicted peak intensity 78 mm/hr at 16:20. Predicted ponding 19 cm. Risk forecast: HIGH.", zoneId: "Z-A" },
  { tick: 14, kind: "prediction", title: "Nowcast extended to Z-D, Z-L, Z-B", detail: "Cell footprint widened. Moderate risk forecast for Dhanwada East, Lakshmipuram and Belapur.", },
  { tick: 18, kind: "observation", title: "Drain D17 flow collapses", detail: "S03 drain-flow sensor at D17 reports 9% of design flow while upstream level rises. No corresponding rainfall spike.", zoneId: "Z-A" },
  { tick: 20, kind: "observation", title: "⚠ Divergence flagged", detail: "Observed ponding in Z-A exceeds model by 4.1 cm and widening. Forecast confidence drops to 0.52.", zoneId: "Z-A" },
  { tick: 22, kind: "observation", title: "First citizen reports — Ashokgarh Market", detail: "3 geo-tagged reports of knee-deep water near Market Street. Cross-checked against S02 water level: consistent.", zoneId: "Z-A" },
  { tick: 26, kind: "adaptation", title: "★ Model self-corrects: D17 blockage inferred", detail: "Assimilation of drain-flow + level + 7 citizen reports infers effective capacity of D17 at 30% of design. Zone A hydraulic parameters updated live.", zoneId: "Z-A" },
  { tick: 27, kind: "adaptation", title: "Risk re-issued: HIGH → SEVERE for Zone A", detail: "Adapted forecast: 33 cm ponding by 16:40, Ashokgarh Underpass impassable. Confidence restored to 0.84.", zoneId: "Z-A" },
  { tick: 30, kind: "decision", title: "Decision support pack generated", detail: "5 ranked recommendations delivered to Commissioner, Drainage Engineer, Ward Officer and Traffic Liaison.", zoneId: "Z-A" },
  { tick: 32, kind: "decision", title: "Public alert AL-03 approved", detail: "SMS + app alert to 128,400 residents of Ashokgarh. Schools advised early closure.", zoneId: "Z-A" },
  { tick: 34, kind: "resource", title: "Desilting Unit Alpha dispatched to D17", detail: "ETA 22 min. Pump Set P1 dispatched to Ashokgarh Underpass. Barricade Van B1 en route.", zoneId: "Z-A" },
  { tick: 38, kind: "resource", title: "Underpass barricaded, traffic diverted", detail: "R01 closed at 17:10. Traffic Marshal Squad T1 diverting via MG Road link.", zoneId: "Z-A" },
  { tick: 40, kind: "observation", title: "Peak inundation reached in Zone A", detail: "Underpass gauge 51 cm. 4 critical assets within the affected envelope. No casualties reported.", zoneId: "Z-A" },
  { tick: 44, kind: "resource", title: "Desilting crew on site at D17", detail: "Jetting begun. Obstruction identified as construction debris + silt plug at 1.2 m depth.", zoneId: "Z-A" },
  { tick: 50, kind: "resource", title: "D17 partially cleared — flow restored to 82%", detail: "Water level falling 1.4 cm / 10 min. Zone A downgraded SEVERE → HIGH.", zoneId: "Z-A" },
  { tick: 58, kind: "observation", title: "Zone A downgraded to MODERATE", detail: "Underpass reopened to light vehicles under marshal supervision.", zoneId: "Z-A" },
  { tick: 66, kind: "adaptation", title: "Post-event learning committed", detail: "D17 silt-risk prior raised permanently; desilting SLA for trunk culverts older than 12 months escalated. Model retains corrected Zone A capacity.", zoneId: "Z-A" },
];

export function timelineUpTo(tick: number): TimelineEvent[] {
  return TIMELINE.filter((e) => e.tick <= tick);
}

export interface Alert {
  id: string;
  tick: number;
  level: "advisory" | "warning" | "emergency";
  zoneId: string;
  channel: string;
  audience: string;
  title: string;
  body: string;
}

export const ALERTS: Alert[] = [
  { id: "AL-01", tick: 12, level: "advisory", zoneId: "Z-A", channel: "Control room + ward WhatsApp", audience: "NMC staff (Ward 12)", title: "Heavy rain expected in Ashokgarh within 90 minutes", body: "Nowcast indicates 70–80 mm/hr intensity. Ward teams to stage barricades and check pump readiness." },
  { id: "AL-02", tick: 20, level: "advisory", zoneId: "Z-A", channel: "Internal", audience: "Drainage Engineer", title: "Sensor/model divergence at D17 — verification requested", body: "Observed ponding exceeds forecast. Ward Officer requested to physically verify D17 inlet." },
  { id: "AL-03", tick: 32, level: "warning", zoneId: "Z-A", channel: "SMS + citizen app + PA", audience: "128,400 residents of Ashokgarh", title: "Flood warning — avoid Ashokgarh Underpass and Market Street", body: "Water logging up to 50 cm expected until 18:30. Avoid the railway underpass. Schools advised to close early. Helpline 1916." },
  { id: "AL-04", tick: 34, level: "warning", zoneId: "Z-D", channel: "SMS + citizen app", audience: "Dhanwada East residents", title: "Watch-level advisory for Dhanwada East", body: "Moderate water logging likely on Kalvi Ring Road (West). Plan alternate routes." },
  { id: "AL-05", tick: 38, level: "emergency", zoneId: "Z-A", channel: "Cell broadcast + PA vans", audience: "Ashokgarh Underpass corridor", title: "Ashokgarh Underpass CLOSED", body: "Underpass impassable. Traffic diverted via MG Road link. Do not attempt to cross." },
  { id: "AL-06", tick: 50, level: "advisory", zoneId: "Z-A", channel: "SMS + citizen app", audience: "Ashokgarh residents", title: "Water receding — D17 flow restored", body: "Drain D17 cleared to 82% of design flow. Levels falling. Continue avoiding the underpass until reopened." },
  { id: "AL-07", tick: 58, level: "advisory", zoneId: "Z-A", channel: "Citizen app", audience: "Ashokgarh residents", title: "Underpass reopened under supervision", body: "Light vehicles permitted with marshal supervision. Report any residual water logging in the app." },
];

export function alertsUpTo(tick: number): Alert[] {
  return ALERTS.filter((a) => a.tick <= tick).sort((a, b) => b.tick - a.tick);
}

export interface Recommendation {
  id: string;
  tick: number;
  zoneId: string;
  priority: 1 | 2 | 3;
  role: string;
  title: string;
  rationale: string;
  basis: "prediction" | "observation" | "adaptation";
  resourceIds: string[];
  windowMinutes: number;
  impactIfIgnored: string;
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "REC-01",
    tick: 30,
    zoneId: "Z-A",
    priority: 1,
    role: "Traffic Police Liaison",
    title: "Close and barricade Ashokgarh Railway Underpass (R01)",
    rationale: "Adapted forecast puts underpass water at 51 cm within 50 minutes — above the 30 cm stall threshold for cars.",
    basis: "adaptation",
    resourceIds: ["U09", "U08"],
    windowMinutes: 25,
    impactIfIgnored: "High likelihood of stranded vehicles requiring rescue.",
  },
  {
    id: "REC-02",
    tick: 30,
    zoneId: "Z-A",
    priority: 1,
    role: "Drainage Engineer",
    title: "Dispatch Desilting Unit Alpha to trunk culvert D17",
    rationale: "Inferred effective capacity of D17 is 30% of design. Clearing it is the only lever that shortens the event.",
    basis: "adaptation",
    resourceIds: ["U01"],
    windowMinutes: 30,
    impactIfIgnored: "Ponding persists ~50 minutes longer and peaks higher.",
  },
  {
    id: "REC-03",
    tick: 30,
    zoneId: "Z-A",
    priority: 2,
    role: "Municipal Commissioner",
    title: "Issue public flood warning to Ashokgarh (128,400 residents)",
    rationale: "Severe risk with >2,000 people in the ponding envelope; four critical assets exposed.",
    basis: "adaptation",
    resourceIds: [],
    windowMinutes: 15,
    impactIfIgnored: "Residents commute into the affected corridor unwarned.",
  },
  {
    id: "REC-04",
    tick: 31,
    zoneId: "Z-A",
    priority: 2,
    role: "Ward Officer — Ashokgarh",
    title: "Advise early closure for Ashokgarh Girls High School",
    rationale: "School dispersal at 16:30 coincides with forecast peak; approach road R03 vulnerability 0.7.",
    basis: "prediction",
    resourceIds: [],
    windowMinutes: 20,
    impactIfIgnored: "1,100 students dispersing into peak inundation.",
  },
  {
    id: "REC-05",
    tick: 32,
    zoneId: "Z-A",
    priority: 2,
    role: "Drainage Engineer",
    title: "Stage Pump Set P1 at underpass low point",
    rationale: "1,800 m³/hr dewatering shortens the recession tail once D17 flow is restored.",
    basis: "adaptation",
    resourceIds: ["U03"],
    windowMinutes: 40,
    impactIfIgnored: "Slower drawdown, underpass reopens ~30 minutes later.",
  },
  {
    id: "REC-06",
    tick: 33,
    zoneId: "Z-A",
    priority: 3,
    role: "Control Room Operator",
    title: "Activate Ashokgarh Community Shelter on standby",
    rationale: "Ground-floor dwellings in the market lanes are within the 30 cm envelope.",
    basis: "observation",
    resourceIds: ["U10"],
    windowMinutes: 60,
    impactIfIgnored: "No warm shelter capacity if evacuation becomes necessary.",
  },
  {
    id: "REC-07",
    tick: 34,
    zoneId: "Z-D",
    priority: 3,
    role: "Traffic Police Liaison",
    title: "Post marshals on Kalvi Ring Road (West)",
    rationale: "Dhanwada East forecast to reach moderate ponding; arterial carries diverted underpass traffic.",
    basis: "prediction",
    resourceIds: ["U12"],
    windowMinutes: 45,
    impactIfIgnored: "Diverted traffic meets unmanaged water logging.",
  },
  {
    id: "REC-08",
    tick: 36,
    zoneId: "Z-G",
    priority: 3,
    role: "Control Room Operator",
    title: "Pre-position Water Rescue Team R1 at Gokulnagar Lake Road",
    rationale: "Lake-fringe zone with lowness 0.72 and rising trend; R1 is 7 minutes away.",
    basis: "prediction",
    resourceIds: ["U06"],
    windowMinutes: 60,
    impactIfIgnored: "Rescue response delayed if the lake fringe overtops.",
  },
];

export function recommendationsUpTo(tick: number): Recommendation[] {
  return RECOMMENDATIONS.filter((r) => r.tick <= tick).sort((a, b) => a.priority - b.priority || a.tick - b.tick);
}

export interface ScriptedReport {
  id: string;
  tick: number;
  zoneId: string;
  type: string;
  severity: "low" | "medium" | "high";
  depthCm: number | null;
  text: string;
  reporter: string;
  status: "verified" | "corroborated" | "unverified";
  trust: number;
  lat: number;
  lng: number;
}

const RAW_REPORTS: [number, string, string, ScriptedReport["severity"], number | null, string, string, ScriptedReport["status"], number][] = [
  [22, "Z-A", "Water logging", "medium", 22, "Water above ankles outside the vegetable market, rising quickly.", "R. Deshmukh", "corroborated", 0.72],
  [22, "Z-A", "Blocked drain", "high", null, "The big drain near the culvert is not taking any water at all — it is bubbling back up.", "S. Iqbal", "verified", 0.91],
  [23, "Z-A", "Water logging", "high", 31, "Knee deep near Market Street bus stop.", "Anonymous", "corroborated", 0.64],
  [25, "Z-A", "Vehicle stranded", "high", null, "Two-wheeler stalled at the underpass approach.", "P. Kulkarni", "verified", 0.88],
  [26, "Z-A", "Water logging", "high", 38, "Water entering ground floor shops in the market lane.", "M. Fernandes", "corroborated", 0.79],
  [27, "Z-A", "Blocked drain", "high", null, "Debris and plastic jammed at the culvert mouth for weeks now.", "V. Rao", "verified", 0.85],
  [29, "Z-A", "Water logging", "high", 44, "Underpass almost impassable, autos turning back.", "Anonymous", "corroborated", 0.6],
  [31, "Z-D", "Water logging", "medium", 12, "Ring road service lane collecting water near the school gate.", "K. Bhatt", "unverified", 0.55],
  [33, "Z-E", "Water logging", "low", 7, "Slow puddling near the business corridor signal.", "T. Menon", "unverified", 0.5],
  [35, "Z-A", "Power hazard", "high", null, "Sparking from a street light pole in standing water near the substation lane.", "N. Sharma", "verified", 0.93],
  [37, "Z-G", "Water logging", "medium", 14, "Lake road shoulder submerged.", "A. Pillai", "corroborated", 0.68],
  [39, "Z-A", "Tree fall", "medium", null, "Branch down blocking half the market street.", "Anonymous", "unverified", 0.45],
  [43, "Z-J", "Water logging", "medium", 16, "Causeway edge water rising, people still crossing.", "D. Naik", "corroborated", 0.7],
  [47, "Z-A", "Water logging", "medium", 33, "Water level looks lower than an hour ago near the market.", "R. Deshmukh", "verified", 0.86],
  [55, "Z-A", "Water logging", "low", 14, "Most of the street is clear now, only puddles left.", "S. Iqbal", "verified", 0.9],
  [62, "Z-A", "Damage", "low", null, "Road surface broken near the culvert after the water went down.", "V. Rao", "corroborated", 0.74],
];

export function scriptedReports(tick: number): ScriptedReport[] {
  return RAW_REPORTS.filter(([t]) => t <= tick).map(([t, zoneId, type, severity, depth, text, reporter, status, trust], i) => {
    const z = ZONE_BY_ID[zoneId]!;
    const s = Math.sin((i + 1) * 4.31);
    const c = Math.cos((i + 1) * 7.13);
    return {
      id: `CR-${String(i + 1).padStart(3, "0")}`,
      tick: t,
      zoneId,
      type,
      severity,
      depthCm: depth,
      text,
      reporter,
      status,
      trust,
      lat: z.lat + s * z.size[0] * 0.8,
      lng: z.lng + c * z.size[1] * 0.8,
    };
  }).sort((a, b) => b.tick - a.tick);
}

/* ---------------------------- resources ---------------------------- */

export interface Deployment {
  unitId: string;
  recId: string;
  zoneId: string;
  dispatchTick: number;
  arriveTick: number;
  status: "idle" | "en_route" | "on_site" | "completed";
}

export const DEPLOYMENT_PLAN: Omit<Deployment, "status">[] = [
  { unitId: "U09", recId: "REC-01", zoneId: "Z-A", dispatchTick: 34, arriveTick: 38 },
  { unitId: "U08", recId: "REC-01", zoneId: "Z-A", dispatchTick: 34, arriveTick: 38 },
  { unitId: "U01", recId: "REC-02", zoneId: "Z-A", dispatchTick: 34, arriveTick: 44 },
  { unitId: "U03", recId: "REC-05", zoneId: "Z-A", dispatchTick: 36, arriveTick: 43 },
  { unitId: "U10", recId: "REC-06", zoneId: "Z-A", dispatchTick: 38, arriveTick: 41 },
  { unitId: "U12", recId: "REC-07", zoneId: "Z-D", dispatchTick: 40, arriveTick: 46 },
  { unitId: "U06", recId: "REC-08", zoneId: "Z-G", dispatchTick: 42, arriveTick: 49 },
];

export function deploymentsAt(tick: number, clearedTick: number): Deployment[] {
  return RESOURCES.map((u) => {
    const plan = DEPLOYMENT_PLAN.find((p) => p.unitId === u.id);
    if (!plan || tick < plan.dispatchTick) {
      return { unitId: u.id, recId: "", zoneId: u.homeZoneId, dispatchTick: -1, arriveTick: -1, status: "idle" as const };
    }
    const done = plan.recId === "REC-02" ? tick >= clearedTick : tick >= plan.arriveTick + 14;
    return {
      ...plan,
      status: done ? ("completed" as const) : tick >= plan.arriveTick ? ("on_site" as const) : ("en_route" as const),
    };
  });
}

/* ------------------------------ drains ----------------------------- */

export interface DrainState {
  drain: Drain;
  flowPct: number;
  status: "normal" | "stressed" | "blocked" | "cleared";
  levelCm: number;
}

export function drainStates(tick: number, clearedTick: number): DrainState[] {
  return DRAINS.map((d) => {
    const z = ZONE_BY_ID[d.zoneId]!;
    const rain = rainfallAt(z, tick);
    const load = Math.min(1.4, (rain * z.runoff) / Math.max(6, z.drainCapacity));
    if (d.id === SCENARIO.drainId) {
      if (tick >= clearedTick) {
        return { drain: d, flowPct: Math.round(82 - load * 8), status: "cleared", levelCm: Math.round(40 * load) };
      }
      if (tick >= SCENARIO.blockageTick) {
        return { drain: d, flowPct: Math.max(6, Math.round(30 - load * 18)), status: "blocked", levelCm: Math.round(120 * Math.min(1, load + 0.4)) };
      }
    }
    const base = Math.round((1 - d.siltIndex * 0.55) * 100 - load * 12);
    return {
      drain: d,
      flowPct: Math.max(8, Math.min(100, base)),
      status: base < 45 ? "stressed" : "normal",
      levelCm: Math.round(90 * load * (0.5 + d.siltIndex * 0.6)),
    };
  });
}

/* ----------------------------- sensors ----------------------------- */

export interface SensorReading {
  sensorId: string;
  value: number;
  quality: "good" | "suspect" | "stale";
  anomaly: boolean;
}

export function sensorReadings(tick: number, snap: SimSnapshot, drains: DrainState[]): SensorReading[] {
  return SENSORS.map((s) => {
    const zs = snap.zoneById[s.zoneId]!;
    if (s.health === "offline") return { sensorId: s.id, value: 0, quality: "stale" as const, anomaly: false };
    let value = 0;
    if (s.type === "rain_gauge") value = zs.rainfall;
    else if (s.type === "water_level") value = Number((zs.depthCm * 1.4).toFixed(1));
    else if (s.type === "drain_flow") {
      const d = drains.find((x) => x.drain.zoneId === s.zoneId && (s.zoneId !== SCENARIO.zoneId || x.drain.id === SCENARIO.drainId));
      value = d ? d.flowPct : 60;
    } else value = Math.round(Math.min(100, zs.depthCm * 2.4));
    const anomaly =
      s.zoneId === SCENARIO.zoneId &&
      tick >= SCENARIO.blockageTick &&
      tick < snap.clearedTick &&
      (s.type === "drain_flow" || s.type === "water_level");
    return {
      sensorId: s.id,
      value,
      quality: s.health === "degraded" ? ("suspect" as const) : ("good" as const),
      anomaly,
    };
  });
}

/* ------------------------------ series ----------------------------- */

export function zoneSeries(zoneId: string, tick: number, clearedTick: number) {
  const zone = ZONE_BY_ID[zoneId]!;
  const upto = TICKS;
  const truth = integrate(zone, upto, (t) => actualCapacity(zone, t, clearedTick));
  const naive = integrate(zone, upto, (t) => modelCapacity(zone, t, clearedTick, false));
  const adaptive = integrate(zone, upto, (t) => modelCapacity(zone, t, clearedTick, true));
  return Array.from({ length: upto + 1 }, (_, t) => ({
    tick: t,
    time: clockLabel(t),
    rainfall: rainfallAt(zone, t),
    observed: t <= tick ? truth[t]! : null,
    predicted: naive[t]!,
    adaptive: t >= SCENARIO.adaptationTick ? adaptive[t]! : null,
    future: t > tick,
  }));
}

export function cityRainSeries(tick: number) {
  return Array.from({ length: TICKS + 1 }, (_, t) => {
    const row: Record<string, number | string | null> = { tick: t, time: clockLabel(t) };
    for (const z of ZONES.slice(0, 6)) row[z.code] = t <= tick ? rainfallAt(z, t) : null;
    return row;
  });
}

/* --------------------------- data readiness ------------------------ */

export const DATA_READINESS = [
  { layer: "Radar / satellite nowcast", source: "IMD DWR composite (simulated)", cadence: "5 min", status: "available" as const, note: "Prototype uses a synthetic convective cell; production needs an IMD data-sharing MoU." },
  { layer: "Automatic rain gauges", source: "NMC AWS network", cadence: "1 min", status: "partial" as const, note: "6 of 12 zones instrumented in this demo; gaps filled by interpolation." },
  { layer: "Drain level / flow telemetry", source: "IoT ultrasonic + flow sensors", cadence: "1 min", status: "partial" as const, note: "Only 9 of 22 drains telemetered. D17-class trunk culverts must be prioritised." },
  { layer: "Storm-water network GIS", source: "NMC drainage asset register", cadence: "Static", status: "gap" as const, note: "Invert levels and as-built diameters are the single biggest real-world data gap." },
  { layer: "High-resolution DEM / LiDAR", source: "State survey department", cadence: "Annual", status: "gap" as const, note: "1 m DEM required for credible hyperlocal ponding depth." },
  { layer: "Citizen reports", source: "This citizen app + helpline 1916", cadence: "Continuous", status: "available" as const, note: "Trust-weighted; used for assimilation only above a 0.6 trust score." },
  { layer: "Critical asset register", source: "NMC + health + education depts", cadence: "Quarterly", status: "available" as const, note: "12 assets geocoded in the demo." },
  { layer: "Resource / fleet positions", source: "NMC vehicle GPS", cadence: "30 s", status: "partial" as const, note: "Modelled from home depots and ETA matrices in the prototype." },
  { layer: "Historical flood incidents", source: "Ward complaint archive", cadence: "Static", status: "partial" as const, note: "Used as a susceptibility prior per zone." },
];

export { ROADS, RESOURCES, SENSORS, DRAINS, ZONES };
