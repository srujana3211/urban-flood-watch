import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { DemoNotice, Panel } from "@/components/kit";
import { SENSORS, ZONE_BY_ID } from "@/data/city";
import { clockLabel, SCENARIO } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/observation")({
  head: () => ({
    meta: [
      { title: "Observation — Sensors, Drains & Citizen Reports | Nadipur FloodOps" },
      { name: "description", content: "Ground truth feed: 18 field sensors, 22 drain telemetry points and trust-weighted citizen reports, with model divergence flagged live." },
      { property: "og:title", content: "Observation — Ground Truth Feed" },
      { property: "og:description", content: "What the city is actually measuring, right now." },
    ],
  }),
  component: ObservationPage,
});

function ObservationPage() {
  const { snapshot, sensors, drains, reports, liveReports, tick } = useSim();
  const diverging = snapshot.zones.filter((z) => Math.abs(z.divergence) > 2);

  return (
    <div className="space-y-3">
      <Panel title="What OBSERVATION means here" pillar="observation">
        <p className="p-4 text-sm text-muted-foreground">
          Observation is the independent ground truth stream — rain gauges, water-level and drain-flow sensors, CCTV
          indices and trust-weighted citizen reports. It is never used to decide directly; it is used to
          <b className="text-foreground"> test the prediction</b>. Where the two disagree, the divergence is flagged here
          and handed to Adaptation.
        </p>
      </Panel>

      {diverging.length > 0 && (
        <Panel title="⚠ Model / ground divergence" subtitle="Observed ponding differs materially from the un-adapted forecast" pillar="observation">
          <ul className="divide-y divide-panel-edge">
            {diverging.map((z) => (
              <li key={z.zone.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-medium">{z.zone.code} · {z.zone.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  observed {z.depthCm} cm · model {z.predictedDepthCm} cm ·{" "}
                  <b className="text-risk-severe">Δ {z.divergence > 0 ? "+" : ""}{z.divergence} cm</b> · confidence {z.confidence}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Field sensors" subtitle={`${SENSORS.length} devices · ${sensors.filter((s) => s.quality === "good").length} healthy`} pillar="observation">
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {sensors.map((r) => {
                  const s = SENSORS.find((x) => x.id === r.sensorId)!;
                  return (
                    <tr key={r.sensorId} className="border-b border-panel-edge">
                      <td className="px-3 py-1.5 font-medium">{s.id}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{s.type.replace("_", " ")}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{ZONE_BY_ID[s.zoneId]!.name}</td>
                      <td className="px-3 py-1.5 font-mono">{r.quality === "stale" ? "—" : `${r.value} ${s.unit}`}</td>
                      <td className={`px-3 py-1.5 uppercase ${r.quality === "good" ? "text-risk-low" : r.quality === "suspect" ? "text-risk-moderate" : "text-muted-foreground"}`}>{s.health}</td>
                      <td className="px-3 py-1.5">{r.anomaly && <span className="font-semibold text-risk-severe">ANOMALY</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Citizen reports" subtitle={`${reports.length} scripted + ${liveReports.length} submitted in this demo`} pillar="observation">
          <div className="max-h-[360px] divide-y divide-panel-edge overflow-y-auto">
            {liveReports.map((r) => (
              <div key={r.id} className="px-3 py-2">
                <p className="text-sm"><span className="font-semibold text-primary">NEW</span> · {r.report_type} — {ZONE_BY_ID[r.zone_id]?.name ?? r.zone_id}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
                <p className="text-[11px] text-muted-foreground">{r.reporter_name || "Anonymous"} · severity {r.severity} · {r.water_depth_cm ?? "—"} cm · T {clockLabel(r.tick)}</p>
              </div>
            ))}
            {reports.map((r) => (
              <div key={r.id} className="px-3 py-2">
                <p className="text-sm font-medium">{r.type} — {ZONE_BY_ID[r.zoneId]!.name}</p>
                <p className="text-xs text-muted-foreground">{r.text}</p>
                <p className="text-[11px] text-muted-foreground">{r.reporter} · trust {r.trust.toFixed(2)} · {r.status} · T {clockLabel(r.tick)}</p>
              </div>
            ))}
            {!reports.length && !liveReports.length && <p className="px-3 py-8 text-center text-sm text-muted-foreground">No reports yet — start the demo, or file one from the citizen app.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Drain telemetry" subtitle={`Watch D17 from ${clockLabel(SCENARIO.blockageTick)}`} pillar="observation">
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-xs">
            <tbody>
              {drains.map((d) => (
                <tr key={d.drain.id} className={`border-b border-panel-edge ${d.status === "blocked" ? "bg-risk-severe/8" : ""}`}>
                  <td className="px-3 py-1.5 font-medium">{d.drain.name}</td>
                  <td className="px-3 py-1.5 font-mono">flow {d.flowPct}%</td>
                  <td className="px-3 py-1.5 font-mono">level {d.levelCm} cm</td>
                  <td className="px-3 py-1.5 text-muted-foreground">last desilted {d.drain.lastDesilted}</td>
                  <td className={`px-3 py-1.5 font-semibold uppercase ${d.status === "blocked" ? "text-risk-severe" : d.status === "stressed" ? "text-risk-moderate" : "text-risk-low"}`}>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="px-1 text-xs text-muted-foreground">Demo clock: {clockLabel(tick)}</p>
      <DemoNotice className="px-1" />
    </div>
  );
}
