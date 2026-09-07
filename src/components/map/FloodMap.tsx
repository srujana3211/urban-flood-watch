import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, Rectangle, TileLayer, Tooltip } from "react-leaflet";
import { CITY, INFRASTRUCTURE, ROADS, SENSORS, ZONE_BY_ID } from "@/data/city";
import { RISK_STYLE } from "@/components/kit";
import { useSim } from "@/context/sim";
import type { LayerState } from "./layers";

const DRAIN_COLOR: Record<string, string> = {
  normal: "#3fd8ab",
  stressed: "#f0c033",
  blocked: "#ef4444",
  cleared: "#4dc3ff",
};

export default function FloodMap({
  layers,
  onSelectZone,
  selectedZoneId,
}: {
  layers: LayerState;
  onSelectZone: (id: string | null) => void;
  selectedZoneId: string | null;
}) {
  const { snapshot, drains, sensors, reports, liveReports, deployments } = useSim();

  return (
    <MapContainer center={CITY.center} zoom={13} className="h-full w-full" zoomControl scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors — demo basemap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {layers.zones &&
        snapshot.zones.map((zs) => {
          const z = zs.zone;
          const bounds: [[number, number], [number, number]] = [
            [z.lat - z.size[0], z.lng - z.size[1]],
            [z.lat + z.size[0], z.lng + z.size[1]],
          ];
          const color = RISK_STYLE[zs.risk].hex;
          const selected = selectedZoneId === z.id;
          return (
            <Rectangle
              key={z.id}
              bounds={bounds}
              pathOptions={{
                color,
                weight: selected ? 3 : 1.4,
                fillOpacity: zs.risk === "low" ? 0.1 : 0.2,
                fillColor: color,
                dashArray: selected ? undefined : "4 3",
              }}
              eventHandlers={{ click: () => onSelectZone(selected ? null : z.id) }}
            >
              <Tooltip direction="center" permanent={selected} opacity={0.95}>
                <span className="font-mono text-[11px]">
                  <b>
                    {z.code} · {z.name}
                  </b>
                  <br />
                  {zs.risk.toUpperCase()} · {zs.depthCm} cm · {zs.rainfall} mm/hr
                </span>
              </Tooltip>
            </Rectangle>
          );
        })}

      {layers.rainfall &&
        snapshot.zones.map((zs) => {
          const z = zs.zone;
          const intensity = Math.min(1, zs.rainfall / 80);
          if (intensity < 0.05) return null;
          return (
            <Rectangle
              key={`rain-${z.id}`}
              bounds={[
                [z.lat - z.size[0] * 0.92, z.lng - z.size[1] * 0.92],
                [z.lat + z.size[0] * 0.92, z.lng + z.size[1] * 0.92],
              ]}
              pathOptions={{ stroke: false, fillColor: "#4d7dff", fillOpacity: 0.08 + intensity * 0.4 }}
              interactive={false}
            />
          );
        })}

      {layers.roads &&
        ROADS.map((r) => {
          const zs = snapshot.zoneById[r.zoneId]!;
          const flooded = zs.depthCm * (r.class === "underpass" ? 1.5 : 1) * r.vulnerability;
          const closed = r.class === "underpass" ? flooded > 22 : flooded > 16;
          return (
            <Polyline
              key={r.id}
              positions={r.path}
              pathOptions={{
                color: closed ? "#ef4444" : flooded > 8 ? "#f0c033" : "#8aa0b8",
                weight: r.class === "arterial" ? 4 : 3,
                opacity: 0.9,
                dashArray: closed ? "6 4" : undefined,
              }}
            >
              <Tooltip>
                <span className="text-[11px]">
                  <b>{r.name}</b>
                  <br />
                  {closed ? "CLOSED — impassable" : flooded > 8 ? "Caution — water logging" : "Open"} ·{" "}
                  {flooded.toFixed(0)} cm
                </span>
              </Tooltip>
            </Polyline>
          );
        })}

      {layers.drains &&
        drains.map((d) => (
          <CircleMarker
            key={d.drain.id}
            center={[d.drain.lat, d.drain.lng]}
            radius={d.status === "blocked" ? 9 : 5}
            pathOptions={{
              color: DRAIN_COLOR[d.status]!,
              fillColor: DRAIN_COLOR[d.status]!,
              fillOpacity: 0.75,
              weight: d.status === "blocked" ? 3 : 1.5,
            }}
          >
            <Tooltip>
              <span className="text-[11px]">
                <b>{d.drain.name}</b>
                <br />
                Flow {d.flowPct}% of design · level {d.levelCm} cm
                <br />
                Status: {d.status.toUpperCase()} · silt index {d.drain.siltIndex.toFixed(2)}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.sensors &&
        sensors.map((r) => {
          const sensor = SENSORS.find((x) => x.id === r.sensorId);
          if (!sensor) return null;
          return (
            <CircleMarker
              key={r.sensorId}
              center={[sensor.lat, sensor.lng]}
              radius={4}
              pathOptions={{
                color: r.quality === "stale" ? "#6b7a8f" : r.anomaly ? "#ef4444" : "#4dc3ff",
                fillColor: r.quality === "stale" ? "#6b7a8f" : r.anomaly ? "#ef4444" : "#4dc3ff",
                fillOpacity: 0.9,
                weight: 1,
              }}
            >
              <Tooltip>
                <span className="text-[11px]">
                  <b>{sensor.name}</b>
                  <br />
                  {r.quality === "stale" ? "No data (offline)" : `${r.value} ${sensor.unit}`}
                  {r.anomaly && <><br />⚠ anomalous vs model</>}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}

      {layers.infrastructure &&
        INFRASTRUCTURE.map((a) => {
          const zs = snapshot.zoneById[a.zoneId]!;
          const exposed = zs.depthCm > 12;
          return (
            <CircleMarker
              key={a.id}
              center={[a.lat, a.lng]}
              radius={6}
              pathOptions={{
                color: exposed ? "#ef4444" : "#e9eef5",
                fillColor: exposed ? "#ef4444" : "#e9eef5",
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Tooltip>
                <span className="text-[11px]">
                  <b>{a.name}</b>
                  <br />
                  {a.type.replace("_", " ")} · criticality {a.criticality}
                  <br />
                  {exposed ? "⚠ inside ponding envelope" : "Not currently exposed"}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}

      {layers.reports &&
        reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={r.severity === "high" ? 7 : 5}
            pathOptions={{ color: "#f0c033", fillColor: "#f0c033", fillOpacity: 0.55, weight: 1 }}
          >
            <Tooltip>
              <span className="text-[11px]">
                <b>Citizen report · {r.type}</b>
                <br />
                {r.text}
                <br />
                {r.reporter} · trust {r.trust.toFixed(2)} · {r.status}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.reports &&
        liveReports.map((r, i) => {
          const z = ZONE_BY_ID[r.zone_id];
          if (!z) return null;
          const off = Math.sin((i + 1) * 3.7);
          return (
            <CircleMarker
              key={r.id}
              center={[z.lat + off * z.size[0] * 0.6, z.lng + Math.cos((i + 1) * 2.9) * z.size[1] * 0.6]}
              radius={7}
              pathOptions={{ color: "#ffffff", fillColor: "#f0c033", fillOpacity: 0.8, weight: 2 }}
            >
              <Tooltip>
                <span className="text-[11px]">
                  <b>New citizen report · {r.report_type}</b>
                  <br />
                  {r.description}
                  <br />
                  {r.reporter_name || "Anonymous"} · {r.severity}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}

      {layers.resources &&
        deployments
          .filter((d) => d.status !== "idle")
          .map((d) => {
            const z = ZONE_BY_ID[d.zoneId]!;
            return (
              <CircleMarker
                key={d.unitId}
                center={[z.lat - z.size[0] * 0.5, z.lng + z.size[1] * 0.5]}
                radius={6}
                pathOptions={{ color: "#3fd8ab", fillColor: "#3fd8ab", fillOpacity: 0.65, weight: 2 }}
              >
                <Tooltip>
                  <span className="text-[11px]">
                    <b>{d.unitId}</b> — {d.status.replace("_", " ")}
                    <br />
                    Tasked to {z.name} ({d.recId})
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
    </MapContainer>
  );
}
