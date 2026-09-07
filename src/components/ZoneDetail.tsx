import { useSim } from "@/context/sim";
import { Bar, Panel, RiskBadge, RISK_STYLE } from "@/components/kit";
import { DRAINS, INFRASTRUCTURE, ROADS, SENSORS } from "@/data/city";
import { X } from "lucide-react";

export function ZoneDetail() {
  const { snapshot, selectedZoneId, selectZone, drains, sensors, reports } = useSim();
  const zs = selectedZoneId ? snapshot.zoneById[selectedZoneId] : undefined;

  if (!zs) {
    return (
      <Panel title="Zone detail" subtitle="Select a zone on the map or in the priority list">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No zone selected. Click any zone rectangle on the map to inspect its rainfall, drainage, exposure and
          recommended actions.
        </div>
      </Panel>
    );
  }

  const z = zs.zone;
  const zoneDrains = drains.filter((d) => d.drain.zoneId === z.id);
  const zoneSensors = SENSORS.filter((s) => s.zoneId === z.id);
  const zoneAssets = INFRASTRUCTURE.filter((a) => a.zoneId === z.id);
  const zoneRoads = ROADS.filter((r) => r.zoneId === z.id);
  const zoneReports = reports.filter((r) => r.zoneId === z.id);

  return (
    <Panel
      title={`${z.code} · ${z.name}`}
      subtitle={`${z.ward} · ${z.landuse} · ${z.areaKm2} km² · ${z.population.toLocaleString("en-IN")} residents`}
      right={
        <div className="flex items-center gap-2">
          <RiskBadge level={zs.risk} />
          <button onClick={() => selectZone(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { l: "Rainfall now", v: `${zs.rainfall}`, u: "mm/hr" },
            { l: "Ponding (observed)", v: `${zs.depthCm}`, u: "cm" },
            { l: "Forecast +60 min", v: `${zs.forecastDepthCm}`, u: "cm" },
            { l: "Confidence", v: zs.confidence.toFixed(2), u: "" },
          ].map((s) => (
            <div key={s.l} className="rounded border border-panel-edge px-2.5 py-2">
              <p className="label-xs">{s.l}</p>
              <p className="font-mono text-lg font-semibold">
                {s.v}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">{s.u}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="label-xs">Drainage stress</p>
            <Bar value={zs.drainStress} tone={zs.drainStress > 0.8 ? "risk-severe" : "primary"} />
            <p className="text-xs text-muted-foreground">
              Runoff {(z.runoff * 100).toFixed(0)}% · design capacity {z.drainCapacity} mm/hr · lowness{" "}
              {z.lowLying.toFixed(2)} · {z.historicalFloods} historical incidents
            </p>
          </div>
          <div className="space-y-2">
            <p className="label-xs">Model vs ground</p>
            <p className="font-mono text-sm">
              observed {zs.depthCm} cm · un-adapted model {zs.predictedDepthCm} cm ·{" "}
              <span className={zs.divergence > 2 ? "text-risk-severe" : "text-muted-foreground"}>
                Δ {zs.divergence > 0 ? "+" : ""}
                {zs.divergence} cm
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              People in ponding envelope: <b className="text-foreground">{zs.peopleAtRisk.toLocaleString("en-IN")}</b> ·
              trend {zs.trend}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="label-xs mb-1.5">Drains ({zoneDrains.length})</p>
            <ul className="space-y-1">
              {zoneDrains.map((d) => (
                <li key={d.drain.id} className="flex items-center justify-between rounded border border-panel-edge px-2 py-1 text-xs">
                  <span className="truncate">{d.drain.id} · {d.drain.diameterMm} mm</span>
                  <span
                    className="font-mono font-semibold"
                    style={{ color: d.status === "blocked" ? RISK_STYLE.severe.hex : undefined }}
                  >
                    {d.flowPct}% {d.status === "blocked" && "⚠"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-xs mb-1.5">Sensors ({zoneSensors.length})</p>
            <ul className="space-y-1">
              {zoneSensors.map((s) => {
                const r = sensors.find((x) => x.sensorId === s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between rounded border border-panel-edge px-2 py-1 text-xs">
                    <span className="truncate">{s.id} · {s.type.replace("_", " ")}</span>
                    <span className="font-mono">
                      {r?.quality === "stale" ? "—" : `${r?.value} ${s.unit}`} {r?.anomaly && "⚠"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="label-xs mb-1.5">Critical assets ({zoneAssets.length})</p>
            <ul className="space-y-1 text-xs">
              {zoneAssets.map((a) => (
                <li key={a.id} className="rounded border border-panel-edge px-2 py-1">
                  {a.name} <span className="text-muted-foreground">· {a.criticality}</span>
                </li>
              ))}
              {!zoneAssets.length && <li className="text-muted-foreground">None registered.</li>}
            </ul>
          </div>
          <div>
            <p className="label-xs mb-1.5">Roads ({zoneRoads.length})</p>
            <ul className="space-y-1 text-xs">
              {zoneRoads.map((r) => {
                const flooded = zs.depthCm * (r.class === "underpass" ? 1.5 : 1) * r.vulnerability;
                const closed = r.class === "underpass" ? flooded > 22 : flooded > 16;
                return (
                  <li key={r.id} className="flex justify-between rounded border border-panel-edge px-2 py-1">
                    <span className="truncate">{r.name}</span>
                    <span className={closed ? "font-semibold text-risk-severe" : "text-muted-foreground"}>
                      {closed ? "CLOSED" : `${flooded.toFixed(0)} cm`}
                    </span>
                  </li>
                );
              })}
              {!zoneRoads.length && <li className="text-muted-foreground">None mapped.</li>}
            </ul>
          </div>
        </div>

        {zoneReports.length > 0 && (
          <div>
            <p className="label-xs mb-1.5">Recent citizen reports ({zoneReports.length})</p>
            <ul className="space-y-1">
              {zoneReports.slice(0, 4).map((r) => (
                <li key={r.id} className="rounded border border-panel-edge px-2 py-1.5 text-xs">
                  <span className="font-semibold">{r.type}</span> — {r.text}
                  <span className="block text-[11px] text-muted-foreground">
                    {r.reporter} · trust {r.trust.toFixed(2)} · {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
