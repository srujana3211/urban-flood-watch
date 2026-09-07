import { createFileRoute } from "@tanstack/react-router";
import { useSim } from "@/context/sim";
import { DemoNotice, Panel } from "@/components/kit";
import { ZONE_BY_ID } from "@/data/city";
import { alertsUpTo, clockLabel } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Warnings — Nadipur FloodOps" },
      { name: "description", content: "Issued advisories, warnings and emergency broadcasts with channel, audience size and the evidence that triggered each one." },
      { property: "og:title", content: "Alerts & Warnings — Nadipur FloodOps" },
      { property: "og:description", content: "Who was told what, when and how." },
    ],
  }),
  component: AlertsPage,
});

const LEVEL: Record<string, string> = {
  advisory: "border-risk-moderate/40 bg-risk-moderate/10 text-risk-moderate",
  warning: "border-risk-high/45 bg-risk-high/10 text-risk-high",
  emergency: "border-risk-severe/50 bg-risk-severe/12 text-risk-severe",
};

function AlertsPage() {
  const { tick } = useSim();
  const alerts = alertsUpTo(tick);
  return (
    <div className="space-y-3">
      <Panel title="Alert ledger" subtitle={`${alerts.length} issued so far in this run`} pillar="decision">
        <ul className="divide-y divide-panel-edge">
          {alerts.map((a) => (
            <li key={a.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${LEVEL[a.level]}`}>{a.level}</span>
                <span className="font-mono text-xs text-muted-foreground">{a.id} · {clockLabel(a.tick)} · {ZONE_BY_ID[a.zoneId]!.name}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Channel: {a.channel} · Audience: {a.audience}</p>
            </li>
          ))}
          {!alerts.length && <li className="px-3 py-10 text-center text-sm text-muted-foreground">No alerts issued yet — start the demo.</li>}
        </ul>
      </Panel>
      <DemoNotice className="px-1" />
    </div>
  );
}
