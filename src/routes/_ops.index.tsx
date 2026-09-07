import { createFileRoute, Link } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { MapView } from "@/components/map/MapView";
import { ZoneDetail } from "@/components/ZoneDetail";
import { CityRainChart } from "@/components/charts";
import { DemoNotice, Panel, PillarTag, RiskBadge, Stat } from "@/components/kit";
import { alertsUpTo, recommendationsUpTo, RISK_ORDER, timelineUpTo } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/")({
  head: () => ({
    meta: [
      { title: "Command Centre — Nadipur FloodOps (SIH26085 prototype)" },
      { name: "description", content: "Live municipal flood command centre: city risk, hyperlocal map, ranked priorities, alerts and response status for the fictional city of Nadipur." },
      { property: "og:title", content: "Nadipur FloodOps Command Centre" },
      { property: "og:description", content: "Hyperlocal urban flood nowcasting and municipal decision support prototype." },
    ],
  }),
  component: CommandCentre,
});

function CommandCentre() {
  const { snapshot, tick, reports, liveReports, deployments, selectZone } = useSim();
  const ranked = [...snapshot.zones].sort(
    (a, b) => RISK_ORDER.indexOf(b.risk) - RISK_ORDER.indexOf(a.risk) || b.forecastDepthCm - a.forecastDepthCm,
  );
  const alerts = alertsUpTo(tick);
  const recs = recommendationsUpTo(tick);
  const events = timelineUpTo(tick).slice(-4).reverse();
  const active = deployments.filter((d) => d.status === "en_route" || d.status === "on_site").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="City clock" value={snapshot.clock} hint={snapshot.phase} />
        <Stat label="Zones at severe risk" value={snapshot.zones.filter((z) => z.risk === "severe").length} tone="danger" hint={`of ${snapshot.zones.length} zones`} />
        <Stat label="Peak rainfall" value={Math.max(...snapshot.zones.map((z) => z.rainfall)).toFixed(0)} unit="mm/hr" tone="warn" />
        <Stat label="People in envelope" value={snapshot.zones.reduce((s, z) => s + z.peopleAtRisk, 0).toLocaleString("en-IN")} />
        <Stat label="Citizen reports" value={reports.length + liveReports.length} hint={`${liveReports.length} from this demo's app`} />
        <Stat label="Units deployed" value={active} tone="good" hint={`${deployments.length} in fleet`} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Hyperlocal flood map" subtitle="Click a zone for its detail panel" className="xl:col-span-2" pillar="observation">
          <div className="h-[460px]">
            <MapView />
          </div>
        </Panel>

        <Panel title="Zone priority list" subtitle="Ranked by adapted risk, then forecast depth" pillar="decision">
          <ul className="max-h-[460px] overflow-y-auto">
            {ranked.map((z, i) => (
              <li key={z.zone.id}>
                <button
                  onClick={() => selectZone(z.zone.id)}
                  className="flex w-full items-center gap-2 border-b border-panel-edge px-3 py-2 text-left hover:bg-accent/40"
                >
                  <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {z.zone.code} · {z.zone.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {z.rainfall} mm/hr · {z.depthCm} cm now · {z.forecastDepthCm} cm in 60m · conf {z.confidence}
                    </span>
                  </span>
                  <RiskBadge level={z.risk} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Top recommendations" subtitle="Ranked decision support" right={<Link to="/decisions" className="text-xs text-primary">Open →</Link>} pillar="decision">
          <ul className="divide-y divide-panel-edge">
            {recs.slice(0, 4).map((r) => (
              <li key={r.id} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent px-1.5 py-px font-mono text-[10px]">P{r.priority}</span>
                  <span className="text-sm font-medium">{r.title}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{r.role} · {r.rationale}</p>
              </li>
            ))}
            {!recs.length && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No recommendations yet — start the demo.</li>}
          </ul>
        </Panel>

        <Panel title="Latest alerts" right={<Link to="/alerts" className="text-xs text-primary">Open →</Link>} pillar="decision">
          <ul className="divide-y divide-panel-edge">
            {alerts.slice(0, 4).map((a) => (
              <li key={a.id} className="px-3 py-2">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.level.toUpperCase()} · {a.audience}</p>
              </li>
            ))}
            {!alerts.length && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No alerts issued yet.</li>}
          </ul>
        </Panel>

        <Panel title="Recent events" right={<Link to="/timeline" className="text-xs text-primary">Open →</Link>}>
          <ul className="divide-y divide-panel-edge">
            {events.map((e) => (
              <li key={`${e.tick}-${e.title}`} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <PillarTag kind={e.kind} />
                </div>
                <p className="mt-1 text-sm font-medium">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.detail}</p>
              </li>
            ))}
            {!events.length && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Press Start to run the scenario.</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Rainfall by zone" subtitle="Observed intensity, six most affected zones" className="xl:col-span-2" pillar="observation">
          <div className="p-2">
            <CityRainChart tick={tick} />
          </div>
        </Panel>
        <ZoneDetail />
      </div>

      <DemoNotice className="px-1" />
    </div>
  );
}
