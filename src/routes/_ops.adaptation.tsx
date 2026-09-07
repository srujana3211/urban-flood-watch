import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { ZoneDepthChart } from "@/components/charts";
import { DemoNotice, Panel, RiskBadge } from "@/components/kit";
import { clockLabel, SCENARIO } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/adaptation")({
  head: () => ({
    meta: [
      { title: "Adaptation — Live Model Self-Correction | Nadipur FloodOps" },
      { name: "description", content: "How the nowcast model assimilates sensor and citizen evidence to infer a drain blockage and re-issue hyperlocal risk within minutes." },
      { property: "og:title", content: "Adaptation — Live Model Self-Correction" },
      { property: "og:description", content: "The system corrects itself mid-event instead of staying wrong." },
    ],
  }),
  component: AdaptationPage,
});

function AdaptationPage() {
  const { snapshot, tick } = useSim();
  const zs = snapshot.zoneById[SCENARIO.zoneId]!;
  const adapted = tick >= SCENARIO.adaptationTick;

  return (
    <div className="space-y-3">
      <Panel title="What ADAPTATION means here" pillar="adaptation">
        <p className="p-4 text-sm text-muted-foreground">
          Adaptation is the loop that closes Prediction and Observation. When observed ponding in Zone A diverges from the
          forecast while drain D17's flow collapses without a matching rainfall spike, the system infers a
          <b className="text-foreground"> physical cause — a blockage — and rewrites the zone's hydraulic parameters live</b>,
          then re-issues risk and recommendations. Nothing here is a manual override.
        </p>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Adaptation state" className="xl:col-span-1">
          <dl className="divide-y divide-panel-edge text-sm">
            {[
              ["Trigger", tick >= SCENARIO.divergenceTick ? `Divergence flagged at ${clockLabel(SCENARIO.divergenceTick)}` : "No divergence detected"],
              ["Evidence", "S03 drain flow 9% · S02 level rising · 7 citizen reports (trust ≥ 0.6)"],
              ["Inference", adapted ? "D17 effective capacity = 30% of design" : "pending"],
              ["Parameter changed", adapted ? "Zone A drainage capacity 35.7 → 12.6 mm/hr" : "—"],
              ["Applied at", adapted ? clockLabel(SCENARIO.adaptationTick) : "—"],
              ["Confidence", `${zs.confidence} ${adapted ? "(restored)" : "(degraded)"}`],
              ["Risk re-issued", adapted ? "HIGH → SEVERE" : "unchanged"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-3 py-2">
                <dt className="label-xs">{k}</dt>
                <dd className="text-right text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Adaptation effect on Zone A" subtitle="Un-adapted forecast vs adaptive forecast vs observed" className="xl:col-span-2" pillar="adaptation">
          <div className="p-2"><ZoneDepthChart zoneId={SCENARIO.zoneId} tick={tick} clearedTick={snapshot.clearedTick} /></div>
        </Panel>
      </div>

      <Panel title="Per-zone adaptation ledger" subtitle="Every zone is monitored for divergence; only Zone A adapts in this scenario">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge text-left label-xs">
              <tr>{["Zone", "Observed", "Un-adapted model", "Divergence", "Adaptive forecast", "Confidence", "Current risk"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {snapshot.zones.map((z) => (
                <tr key={z.zone.id} className={`border-b border-panel-edge ${Math.abs(z.divergence) > 2 ? "bg-adaptation/8" : ""}`}>
                  <td className="px-3 py-1.5 font-medium">{z.zone.code} · {z.zone.name}</td>
                  <td className="px-3 py-1.5 font-mono">{z.depthCm} cm</td>
                  <td className="px-3 py-1.5 font-mono">{z.predictedDepthCm} cm</td>
                  <td className="px-3 py-1.5 font-mono">{z.divergence > 0 ? "+" : ""}{z.divergence} cm</td>
                  <td className="px-3 py-1.5 font-mono text-adaptation">{z.forecastDepthCm} cm</td>
                  <td className="px-3 py-1.5 font-mono">{z.confidence}</td>
                  <td className="px-3 py-1.5"><RiskBadge level={z.risk} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <DemoNotice className="px-1" />
    </div>
  );
}
