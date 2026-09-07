import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { ZoneDetail } from "@/components/ZoneDetail";
import { DemoNotice, Panel, RiskBadge } from "@/components/kit";
import { INFRASTRUCTURE, ROADS } from "@/data/city";

export const Route = createFileRoute("/_ops/zones")({
  head: () => ({
    meta: [
      { title: "Zones, Drains & Assets — Nadipur FloodOps" },
      { name: "description", content: "Directory of 12 municipal zones, 22 storm-water drains, 18 field sensors, 12 critical assets and 10 monitored road segments." },
      { property: "og:title", content: "Zones, Drains & Assets — Nadipur FloodOps" },
      { property: "og:description", content: "The asset register behind the flood nowcasting prototype." },
    ],
  }),
  component: ZonesPage,
});

function ZonesPage() {
  const { snapshot, drains, selectZone } = useSim();

  return (
    <div className="space-y-3">
      <Panel title="Zone register" subtitle={`${snapshot.zones.length} zones · click a row to open its detail panel`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge text-left">
              <tr className="label-xs">
                {["Zone", "Ward", "Land use", "Pop.", "Runoff", "Capacity", "Rain", "Ponding", "+60m", "Risk"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.zones.map((z) => (
                <tr key={z.zone.id} className="cursor-pointer border-b border-panel-edge hover:bg-accent/40" onClick={() => selectZone(z.zone.id)}>
                  <td className="px-3 py-1.5 font-medium">{z.zone.code} · {z.zone.name}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{z.zone.ward}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{z.zone.landuse}</td>
                  <td className="px-3 py-1.5 font-mono">{(z.zone.population / 1000).toFixed(0)}k</td>
                  <td className="px-3 py-1.5 font-mono">{(z.zone.runoff * 100).toFixed(0)}%</td>
                  <td className="px-3 py-1.5 font-mono">{z.zone.drainCapacity}</td>
                  <td className="px-3 py-1.5 font-mono">{z.rainfall}</td>
                  <td className="px-3 py-1.5 font-mono">{z.depthCm}</td>
                  <td className="px-3 py-1.5 font-mono">{z.forecastDepthCm}</td>
                  <td className="px-3 py-1.5"><RiskBadge level={z.risk} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Storm-water drains" subtitle={`${drains.length} assets · flow as % of design`}>
          <div className="max-h-[380px] overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {drains.map((d) => (
                  <tr key={d.drain.id} className="border-b border-panel-edge">
                    <td className="px-3 py-1.5 font-medium">{d.drain.name}</td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{d.drain.diameterMm} mm</td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">silt {d.drain.siltIndex.toFixed(2)}</td>
                    <td className="px-3 py-1.5 font-mono">{d.flowPct}%</td>
                    <td className={`px-3 py-1.5 font-semibold uppercase ${d.status === "blocked" ? "text-risk-severe" : d.status === "stressed" ? "text-risk-moderate" : "text-risk-low"}`}>{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Critical infrastructure" subtitle={`${INFRASTRUCTURE.length} registered assets`} pillar="decision">
            <ul className="max-h-[180px] overflow-y-auto divide-y divide-panel-edge text-xs">
              {INFRASTRUCTURE.map((a) => {
                const zs = snapshot.zoneById[a.zoneId]!;
                const exposed = zs.depthCm > 12;
                return (
                  <li key={a.id} className="flex justify-between px-3 py-1.5">
                    <span>{a.name} <span className="text-muted-foreground">· {a.type.replace("_", " ")}</span></span>
                    <span className={exposed ? "font-semibold text-risk-severe" : "text-muted-foreground"}>{exposed ? "EXPOSED" : "clear"}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Monitored roads" subtitle={`${ROADS.length} segments`} pillar="decision">
            <ul className="max-h-[180px] overflow-y-auto divide-y divide-panel-edge text-xs">
              {ROADS.map((r) => {
                const zs = snapshot.zoneById[r.zoneId]!;
                const flooded = zs.depthCm * (r.class === "underpass" ? 1.5 : 1) * r.vulnerability;
                const closed = r.class === "underpass" ? flooded > 22 : flooded > 16;
                return (
                  <li key={r.id} className="flex justify-between px-3 py-1.5">
                    <span>{r.name} <span className="text-muted-foreground">· {r.class}</span></span>
                    <span className={closed ? "font-semibold text-risk-severe" : "text-muted-foreground"}>{closed ? "CLOSED" : `${flooded.toFixed(0)} cm`}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      <ZoneDetail />
      <DemoNotice className="px-1" />
    </div>
  );
}
