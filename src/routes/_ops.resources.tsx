import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { DemoNotice, Panel, Stat } from "@/components/kit";
import { RESOURCES, ZONE_BY_ID } from "@/data/city";
import { clockLabel } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/resources")({
  head: () => ({
    meta: [
      { title: "Resource Allocation — Crews, Pumps & Barricades | Nadipur FloodOps" },
      { name: "description", content: "Municipal fleet status, dispatch queue and ETA matrix showing which unit is tasked to which zone against which recommendation." },
      { property: "og:title", content: "Resource Allocation — Crews, Pumps & Barricades" },
      { property: "og:description", content: "Turning accepted decisions into units on the ground." },
    ],
  }),
  component: ResourcesPage,
});

const STATUS_CLS: Record<string, string> = {
  idle: "text-muted-foreground",
  en_route: "text-risk-moderate",
  on_site: "text-primary",
  completed: "text-risk-low",
};

function ResourcesPage() {
  const { deployments, snapshot } = useSim();
  const counts = (s: string) => deployments.filter((d) => d.status === s).length;

  return (
    <div className="space-y-3">
      <Panel title="What RESOURCE ALLOCATION means here" pillar="resource">
        <p className="p-4 text-sm text-muted-foreground">
          Allocation is the last mile: an accepted decision becomes a named unit, a destination zone, an ETA and a
          completion state. Scarcity is explicit — there are 12 units for 12 zones, so the ranking on the Decision page is
          what decides who gets the desilting crew first.
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Idle" value={counts("idle")} />
        <Stat label="En route" value={counts("en_route")} tone="warn" />
        <Stat label="On site" value={counts("on_site")} />
        <Stat label="Completed" value={counts("completed")} tone="good" />
      </div>

      <Panel title="Fleet & dispatch board" subtitle={`${RESOURCES.length} units · D17 clearance projected at ${clockLabel(snapshot.clearedTick)}`} pillar="resource">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge text-left label-xs">
              <tr>{["Unit", "Type", "Capacity", "Crew", "Home", "Tasked to", "Against", "Dispatched", "ETA", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {deployments.map((d) => {
                const u = RESOURCES.find((x) => x.id === d.unitId)!;
                return (
                  <tr key={d.unitId} className="border-b border-panel-edge">
                    <td className="px-3 py-1.5 font-medium">{u.id}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{u.type}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{u.name}</td>
                    <td className="px-3 py-1.5 font-mono">{u.crew}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{ZONE_BY_ID[u.homeZoneId]!.name}</td>
                    <td className="px-3 py-1.5">{d.status === "idle" ? "—" : ZONE_BY_ID[d.zoneId]!.name}</td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{d.recId || "—"}</td>
                    <td className="px-3 py-1.5 font-mono">{d.dispatchTick >= 0 ? clockLabel(d.dispatchTick) : "—"}</td>
                    <td className="px-3 py-1.5 font-mono">{d.arriveTick >= 0 ? clockLabel(d.arriveTick) : "—"}</td>
                    <td className={`px-3 py-1.5 font-semibold uppercase ${STATUS_CLS[d.status]}`}>{d.status.replace("_", " ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Response ETA matrix" subtitle="Minutes from home depot to key zones">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              {RESOURCES.map((u) => (
                <tr key={u.id} className="border-b border-panel-edge">
                  <td className="px-3 py-1.5 font-medium">{u.id} · {u.type}</td>
                  {Object.entries(u.etaMinutesTo).map(([z, m]) => (
                    <td key={z} className="px-3 py-1.5 font-mono text-muted-foreground">{ZONE_BY_ID[z]!.code}: {m}m</td>
                  ))}
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
