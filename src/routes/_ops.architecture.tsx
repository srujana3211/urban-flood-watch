import { createFileRoute } from "@tanstack/react-router";
import { DemoNotice, Panel, PillarTag } from "@/components/kit";

export const Route = createFileRoute("/_ops/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture — Adaptive Flood Nowcasting | Nadipur FloodOps" },
      { name: "description", content: "End-to-end architecture: ingestion, hyperlocal nowcast model, assimilation and adaptation loop, decision engine and dispatch layer." },
      { property: "og:title", content: "System Architecture" },
      { property: "og:description", content: "How prediction, observation, adaptation, decision and dispatch fit together." },
    ],
  }),
  component: ArchPage,
});

const STAGES = [
  { kind: "prediction" as const, title: "1 · Ingest & Predict", items: ["Radar/satellite nowcast composite", "AWS rain gauges", "Storm-cell advection to 60 min", "Zone runoff + drainage capacity model", "→ predicted ponding depth, risk, confidence"] },
  { kind: "observation" as const, title: "2 · Observe", items: ["Drain level & flow IoT telemetry", "Water-level sensors, CCTV indices", "Trust-weighted citizen reports", "Health scoring: good / suspect / stale", "→ independent ground truth stream"] },
  { kind: "adaptation" as const, title: "3 · Assimilate & Adapt", items: ["Divergence detector (observed vs model)", "Cause inference (blockage vs rainfall)", "Live parameter rewrite per zone", "Confidence recovery + risk re-issue", "→ adaptive forecast"] },
  { kind: "decision" as const, title: "4 · Decide", items: ["Zone priority ranking (risk × exposure)", "Role-routed recommendations", "Action window + impact-if-ignored", "Accept / defer / reject with audit log", "→ signed municipal decision"] },
  { kind: "resource" as const, title: "5 · Allocate & Alert", items: ["Unit matching by capability + ETA", "Dispatch, arrival and completion states", "Public alerts by channel & audience", "Feedback of field state into observation", "→ closed loop"] },
];

function ArchPage() {
  return (
    <div className="space-y-3">
      <Panel title="System architecture" subtitle="Five stages, one closed loop — the adaptation stage is what makes it different from a static forecast dashboard">
        <div className="grid gap-3 p-3 xl:grid-cols-5 lg:grid-cols-3 sm:grid-cols-2">
          {STAGES.map((s) => (
            <div key={s.title} className="rounded-lg border border-panel-edge bg-background/40 p-3">
              <PillarTag kind={s.kind} />
              <p className="mt-2 text-sm font-semibold">{s.title}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {s.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-panel-edge px-4 py-3 text-xs text-muted-foreground">
          Stage 5 feeds back into Stage 2: field completion (D17 cleared) restores drain flow, which the observation layer
          detects, which lowers adaptive risk. That feedback is live in this demo.
        </p>
      </Panel>

      <Panel title="Prototype implementation" subtitle="What is real in this build">
        <ul className="space-y-1.5 p-4 text-sm text-muted-foreground">
          <li>• Deterministic 72-tick (6 hour) hydrological simulation running in the browser, identical for every viewer.</li>
          <li>• Shared cloud state for the demo clock, so the command centre and the citizen app stay in step across devices.</li>
          <li>• Live cloud persistence + realtime sync for citizen reports and the decision audit log.</li>
          <li>• OpenStreetMap base layer with municipal zone, drain, sensor, report, asset, road and unit overlays.</li>
          <li>• All city data is fictional and generated for demonstration only.</li>
        </ul>
      </Panel>
      <DemoNotice className="px-1" />
    </div>
  );
}
