import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { DEFAULT_LAYERS, LAYER_META, type LayerState } from "./layers";
import { useSim } from "@/context/sim";
import { RISK_STYLE } from "@/components/kit";
import { cn } from "@/lib/utils";
import { Layers3 } from "lucide-react";

const FloodMap = lazy(() => import("./FloodMap"));

function Skeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-muted/40 text-xs text-muted-foreground">
      Loading Nadipur basemap…
    </div>
  );
}

export function MapView({ className }: { className?: string }) {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [panelOpen, setPanelOpen] = useState(true);
  const { selectedZoneId, selectZone } = useSim();

  const toggle = (k: keyof LayerState) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded", className)}>
      <ClientOnly fallback={<Skeleton />}>
        <Suspense fallback={<Skeleton />}>
          <FloodMap layers={layers} onSelectZone={selectZone} selectedZoneId={selectedZoneId} />
        </Suspense>
      </ClientOnly>

      <div className="pointer-events-none absolute left-2 top-2 z-[1000] flex max-w-[240px] flex-col gap-2">
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className="pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded border border-panel-edge bg-panel/95 px-2 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur"
        >
          <Layers3 className="size-3.5" /> Layers
        </button>
        {panelOpen && (
          <div className="pointer-events-auto rounded border border-panel-edge bg-panel/95 p-2 backdrop-blur">
            {LAYER_META.map((m) => (
              <label key={m.key} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={layers[m.key]}
                  onChange={() => toggle(m.key)}
                  className="mt-0.5 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium leading-tight">{m.label}</span>
                  <span className="block text-[10px] leading-tight text-muted-foreground">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-6 left-2 z-[1000] rounded border border-panel-edge bg-panel/95 px-2.5 py-2 backdrop-blur">
        <p className="label-xs mb-1">Zone risk</p>
        <div className="flex flex-col gap-1">
          {(["low", "moderate", "high", "severe"] as const).map((r) => (
            <span key={r} className="flex items-center gap-1.5 text-[11px]">
              <span className="size-2.5 rounded-sm" style={{ background: RISK_STYLE[r].hex }} />
              {RISK_STYLE[r].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
