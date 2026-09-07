import { createFileRoute } from "@tanstack/react-router";
import { MapView } from "@/components/map/MapView";
import { ZoneDetail } from "@/components/ZoneDetail";
import { DemoNotice, Panel } from "@/components/kit";

export const Route = createFileRoute("/_ops/map")({
  head: () => ({
    meta: [
      { title: "Live Flood Map — Nadipur FloodOps" },
      { name: "description", content: "Interactive hyperlocal flood map with zone risk, rainfall, drains, sensors, citizen reports, critical assets, roads and deployed units." },
      { property: "og:title", content: "Live Flood Map — Nadipur FloodOps" },
      { property: "og:description", content: "Controllable map layers over a fictional Indian city flood scenario." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="space-y-3">
      <Panel title="Live flood map" subtitle="Toggle layers from the control at top-left. Click a zone to inspect it." pillar="observation">
        <div className="h-[62vh] min-h-[420px]">
          <MapView />
        </div>
      </Panel>
      <ZoneDetail />
      <DemoNotice className="px-1" />
    </div>
  );
}
