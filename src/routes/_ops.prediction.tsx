import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { ZoneRainChart, ZoneDepthChart } from "@/components/charts";
import { DemoNotice, Panel, RiskBadge } from "@/components/kit";
import { nowcastAt, riskFromDepth } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/prediction")({
  head: () => ({
    meta: [
      { title: "Prediction — Hyperlocal Nowcast | Nadipur FloodOps" },
      { name: "description", content: "Zone-level rainfall nowcasts at 15, 30 and 60 minute lead times with predicted ponding depth and forecast confidence." },
      { property: "og:title", content: "Prediction — Hyperlocal Nowcast" },
      { property: "og:description", content: "What the model expects before it happens." },
    ],
  }),
  component: PredictionPage,
});

function PredictionPage() {
  const { snapshot, tick, selectedZoneId } = useSim();
  const focus = selectedZoneId ?? "Z-A";

  return (
    <div className="space-y-3">
      <Panel title="What PREDICTION means here" pillar="prediction">
        <p className="p-4 text-sm text-muted-foreground">
          Prediction is everything the system says <b className="text-foreground">before it is observed</b>: a radar-style
          convective-cell nowcast pushed onto each zone, converted through that zone's runoff and drainage capacity into an
          expected ponding depth and risk class, with a lead time of 15–60 minutes. Prediction alone is not trusted — the
          Observation and Adaptation pages show how it is corrected.
        </p>
      </Panel>

      <Panel title="Zone nowcast board" subtitle="Rainfall intensity forecast by lead time (mm/hr) and predicted risk" pillar="prediction">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge text-left label-xs">
              <tr>{["Zone", "Now", "+15 min", "+30 min", "+60 min", "Predicted ponding", "Forecast risk", "Confidence"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {snapshot.zones.map((z) => (
                <tr key={z.zone.id} className="border-b border-panel-edge">
                  <td className="px-3 py-1.5 font-medium">{z.zone.code} · {z.zone.name}</td>
                  <td className="px-3 py-1.5 font-mono">{z.rainfall}</td>
                  <td className="px-3 py-1.5 font-mono">{nowcastAt(z.zone, tick, 3)}</td>
                  <td className="px-3 py-1.5 font-mono">{nowcastAt(z.zone, tick, 6)}</td>
                  <td className="px-3 py-1.5 font-mono text-prediction">{nowcastAt(z.zone, tick, 12)}</td>
                  <td className="px-3 py-1.5 font-mono">{z.forecastDepthCm} cm</td>
                  <td className="px-3 py-1.5"><RiskBadge level={riskFromDepth(z.forecastDepthCm)} size="sm" /></td>
                  <td className="px-3 py-1.5 font-mono">{z.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title={`Rainfall nowcast — ${snapshot.zoneById[focus]!.zone.name}`} pillar="prediction">
          <div className="p-2"><ZoneRainChart zoneId={focus} tick={tick} clearedTick={snapshot.clearedTick} /></div>
        </Panel>
        <Panel title="Forecast vs reality" subtitle="The gap this page cannot close on its own" pillar="prediction">
          <div className="p-2"><ZoneDepthChart zoneId={focus} tick={tick} clearedTick={snapshot.clearedTick} /></div>
        </Panel>
      </div>
      <DemoNotice className="px-1" />
    </div>
  );
}
