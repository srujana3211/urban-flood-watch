import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useSim } from "@/context/sim";
import { DemoNotice, Panel, PillarTag } from "@/components/kit";
import { ROLES, ZONE_BY_ID } from "@/data/city";
import { clockLabel, recommendationsUpTo } from "@/lib/simulation";

export const Route = createFileRoute("/_ops/decisions")({
  head: () => ({
    meta: [
      { title: "Decision Support — Ranked Actions | Nadipur FloodOps" },
      { name: "description", content: "Role-routed, ranked recommendations with rationale, action window and impact-if-ignored, plus an auditable accept/reject/defer decision log." },
      { property: "og:title", content: "Decision Support — Ranked Actions" },
      { property: "og:description", content: "From risk to a decision an officer can actually sign off." },
    ],
  }),
  component: DecisionsPage,
});

function DecisionsPage() {
  const { tick, decisions, recordDecision, role, snapshot } = useSim();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const recs = recommendationsUpTo(tick);
  const roleLabel = ROLES.find((r) => r.id === role)!;

  const decide = async (recId: string, zoneId: string, decision: string) => {
    await recordDecision(recId, zoneId, decision, notes[recId] ?? "");
    toast.success(`${recId} ${decision}`, { description: `Logged as ${roleLabel.label}` });
  };

  const latestFor = (id: string) => decisions.find((d) => d.recommendation_id === id);

  return (
    <div className="space-y-3">
      <Panel title="What DECISION means here" pillar="decision" subtitle={`Acting as ${roleLabel.label} — ${roleLabel.scope}`}>
        <p className="p-4 text-sm text-muted-foreground">
          Every recommendation states which pillar produced it, who owns it, the action window, and what happens if it is
          ignored. Accepting <b className="text-foreground">REC-02 (desilting D17) before the crew window closes</b> shortens
          the flood in the simulation — decisions here genuinely change the outcome.
        </p>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        {recs.map((r) => {
          const d = latestFor(r.id);
          return (
            <Panel key={r.id} title={`${r.id} · P${r.priority} — ${r.title}`} subtitle={`${r.role} · ${ZONE_BY_ID[r.zoneId]!.name} · act within ${r.windowMinutes} min`} right={<PillarTag kind={r.basis} />}>
              <div className="space-y-2.5 p-3 text-sm">
                <p className="text-muted-foreground">{r.rationale}</p>
                <p className="text-xs text-risk-high">If ignored: {r.impactIfIgnored}</p>
                {r.resourceIds.length > 0 && <p className="font-mono text-xs text-muted-foreground">Units: {r.resourceIds.join(", ")}</p>}
                {d ? (
                  <p className={`text-xs font-semibold uppercase ${d.decision === "accepted" ? "text-risk-low" : d.decision === "rejected" ? "text-risk-severe" : "text-risk-moderate"}`}>
                    {d.decision} by {ROLES.find((x) => x.id === d.officer_role)?.label ?? d.officer_role} at {clockLabel(d.tick)}
                    {d.notes ? ` — ${d.notes}` : ""}
                  </p>
                ) : (
                  <>
                    <input
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Optional note for the audit log"
                      className="w-full rounded border border-panel-edge bg-background px-2 py-1.5 text-xs"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => decide(r.id, r.zoneId, "accepted")} className="rounded bg-risk-low/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-risk-low">Accept</button>
                      <button onClick={() => decide(r.id, r.zoneId, "deferred")} className="rounded bg-risk-moderate/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-risk-moderate">Defer</button>
                      <button onClick={() => decide(r.id, r.zoneId, "rejected")} className="rounded bg-risk-severe/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-risk-severe">Reject</button>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          );
        })}
        {!recs.length && <Panel title="No recommendations yet"><p className="p-6 text-sm text-muted-foreground">Start the demo — the decision pack is generated once adaptation raises Zone A to severe.</p></Panel>}
      </div>

      <Panel title="Decision audit log" subtitle={`${decisions.length} entries · shared across every open screen`}>
        <ul className="max-h-[280px] divide-y divide-panel-edge overflow-y-auto text-xs">
          {decisions.map((d) => (
            <li key={d.id} className="flex flex-wrap justify-between gap-2 px-3 py-1.5">
              <span><b>{d.recommendation_id}</b> {d.decision} · {ROLES.find((x) => x.id === d.officer_role)?.label ?? d.officer_role}</span>
              <span className="text-muted-foreground">{d.zone_id ? ZONE_BY_ID[d.zone_id]?.name : ""} · {clockLabel(d.tick)}{d.notes ? ` · ${d.notes}` : ""}</span>
            </li>
          ))}
          {!decisions.length && <li className="px-3 py-6 text-center text-muted-foreground">No decisions recorded yet.</li>}
        </ul>
      </Panel>
      <p className="px-1 text-xs text-muted-foreground">City severity index {snapshot.citySeverity}</p>
      <DemoNotice className="px-1" />
    </div>
  );
}
