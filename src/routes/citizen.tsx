import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useSim } from "@/context/sim";
import { DemoNotice, RiskBadge } from "@/components/kit";
import { ZONES, ZONE_BY_ID } from "@/data/city";
import { alertsUpTo, clockLabel } from "@/lib/simulation";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Nadipur Flood Alerts — Citizen App" },
      { name: "description", content: "Check flood risk in your neighbourhood, read live municipal warnings and report water logging directly to the Nadipur flood control room." },
      { property: "og:title", content: "Nadipur Flood Alerts — Citizen App" },
      { property: "og:description", content: "Local flood risk and one-tap water-logging reports." },
    ],
  }),
  component: CitizenPage,
});

function CitizenPage() {
  const { snapshot, tick, submitReport } = useSim();
  const [zone, setZone] = useState(ZONES[0]!.id);
  const [type, setType] = useState("water_logging");
  const [severity, setSeverity] = useState("moderate");
  const [depth, setDepth] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const zs = snapshot.zoneById[zone]!;
  const alerts = alertsUpTo(tick).filter((a) => a.zoneId === zone || a.zoneId === "ALL").slice(0, 4);

  const send = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!desc.trim()) {
      toast.error("Please describe what you are seeing.");
      return;
    }
    setBusy(true);
    const { error } = await submitReport({
      zone_id: zone,
      report_type: type,
      severity,
      water_depth_cm: depth ? Number(depth) : null,
      description: desc.trim(),
      reporter_name: name.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("Could not send report", { description: error });
      return;
    }
    toast.success("Report sent to the flood control room");
    setDesc("");
    setDepth("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-panel-edge px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight">Nadipur Flood Alerts</h1>
            <p className="text-[11px] text-muted-foreground">Nadipur Municipal Corporation · citizen service (demo)</p>
          </div>
          <Link to="/" className="rounded border border-panel-edge px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">Control room</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 p-4">
        <section className="rounded-lg border border-panel-edge bg-card p-4">
          <label className="label-xs" htmlFor="zone">Your area</label>
          <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm">
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
          </select>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RiskBadge level={zs.risk} />
            <span className="font-mono text-sm">{zs.depthCm} cm water · {zs.rainfall} mm/hr rain</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Stay alert and avoid low-lying stretches and underpasses during heavy rain.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Updated {clockLabel(tick)} (demo clock)</p>
        </section>

        <section className="rounded-lg border border-panel-edge bg-card">
          <h2 className="border-b border-panel-edge px-4 py-2 text-sm font-semibold">Alerts for {ZONE_BY_ID[zone]!.name}</h2>
          <ul className="divide-y divide-panel-edge">
            {alerts.map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{a.level} · {clockLabel(a.tick)}</p>
              </li>
            ))}
            {!alerts.length && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No active alerts for your area.</li>}
          </ul>
        </section>

        <form onSubmit={send} className="space-y-3 rounded-lg border border-panel-edge bg-card p-4">
          <h2 className="text-sm font-semibold">Report water logging</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-xs" htmlFor="type">What are you seeing?</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm">
                {["water_logging", "blocked_drain", "road_impassable", "property_flooding", "person_stranded"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs" htmlFor="sev">How bad is it?</label>
              <select id="sev" value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm">
                {["minor", "moderate", "serious", "emergency"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs" htmlFor="depth">Water depth (cm, optional)</label>
              <input id="depth" inputMode="numeric" value={depth} onChange={(e) => setDepth(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="label-xs" htmlFor="name">Your name (optional)</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="label-xs" htmlFor="desc">Details</label>
            <textarea id="desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Knee-deep water outside Ashokgarh Market, autos not able to pass." className="mt-1 w-full rounded border border-panel-edge bg-background px-3 py-2 text-sm" />
          </div>
          <button disabled={busy} className="w-full rounded bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
            {busy ? "Sending…" : "Send report to control room"}
          </button>
          <p className="text-[11px] text-muted-foreground">Your report appears instantly on the municipal Observation screen and feeds the model's adaptation loop.</p>
        </form>

        <DemoNotice />
      </main>
    </div>
  );
}
