import { createFileRoute } from "@tanstack/react-router";
import { DemoNotice, Panel } from "@/components/kit";
import { DATA_READINESS } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/data-readiness")({
  head: () => ({
    meta: [
      { title: "Data Readiness — What Real Deployment Needs | Nadipur FloodOps" },
      { name: "description", content: "Honest layer-by-layer assessment of the data feeds this flood nowcasting system needs, what exists today and where the real gaps are." },
      { property: "og:title", content: "Data Readiness Assessment" },
      { property: "og:description", content: "What is available, what is partial, what is still a gap." },
    ],
  }),
  component: ReadinessPage,
});

const CLS = {
  available: "text-risk-low",
  partial: "text-risk-moderate",
  gap: "text-risk-severe",
} as const;

function ReadinessPage() {
  return (
    <div className="space-y-3">
      <Panel title="Data readiness" subtitle="Prototype behaviour vs what a live municipal deployment requires">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge text-left label-xs">
              <tr>{["Data layer", "Source", "Cadence", "Status", "Note"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {DATA_READINESS.map((d) => (
                <tr key={d.layer} className="border-b border-panel-edge align-top">
                  <td className="px-3 py-2 font-medium">{d.layer}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.source}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.cadence}</td>
                  <td className={`px-3 py-2 font-semibold uppercase ${CLS[d.status]}`}>{d.status}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{d.note}</td>
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
