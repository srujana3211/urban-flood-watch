import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { DemoNotice, Panel, PillarTag } from "@/components/kit";
import { clockLabel, TIMELINE } from "@/lib/simulation";
import { ZONE_BY_ID } from "@/data/city";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_ops/timeline")({
  head: () => ({
    meta: [
      { title: "Event Timeline — Zone A / D17 Scenario | Nadipur FloodOps" },
      { name: "description", content: "The full six-hour scenario: nowcast, drain blockage, divergence, model self-correction, decisions, dispatch, peak and recovery." },
      { property: "og:title", content: "Event Timeline — Zone A / D17 Scenario" },
      { property: "og:description", content: "One continuous story from prediction to recovery." },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const { tick, seek } = useSim();
  return (
    <div className="space-y-3">
      <Panel title="Scenario timeline" subtitle="Click any entry to jump the shared demo clock to that moment">
        <ol className="p-3">
          {TIMELINE.map((e) => {
            const past = e.tick <= tick;
            return (
              <li key={`${e.tick}-${e.title}`} className="relative border-l border-panel-edge pl-5">
                <span className={cn("absolute -left-[5px] top-3 size-2.5 rounded-full", past ? "bg-primary" : "bg-muted")} />
                <button onClick={() => seek(e.tick)} className={cn("w-full py-2.5 text-left", !past && "opacity-45")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{clockLabel(e.tick)}</span>
                    <PillarTag kind={e.kind} />
                    {e.zoneId && <span className="text-[11px] text-muted-foreground">{ZONE_BY_ID[e.zoneId]!.name}</span>}
                  </div>
                  <p className="mt-1 text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.detail}</p>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
      <DemoNotice className="px-1" />
    </div>
  );
}
