import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { RiskLevel } from "@/data/city";

export const PILLARS = {
  prediction: { label: "Prediction", color: "text-prediction", bg: "bg-prediction/12", border: "border-prediction/40", dot: "bg-prediction" },
  observation: { label: "Observation", color: "text-observation", bg: "bg-observation/12", border: "border-observation/40", dot: "bg-observation" },
  adaptation: { label: "Adaptation", color: "text-adaptation", bg: "bg-adaptation/12", border: "border-adaptation/40", dot: "bg-adaptation" },
  decision: { label: "Decision", color: "text-decision", bg: "bg-decision/12", border: "border-decision/40", dot: "bg-decision" },
  resource: { label: "Resource Allocation", color: "text-resource", bg: "bg-resource/12", border: "border-resource/40", dot: "bg-resource" },
  baseline: { label: "Baseline", color: "text-muted-foreground", bg: "bg-muted", border: "border-border", dot: "bg-muted-foreground" },
} as const;

export type PillarKey = keyof typeof PILLARS;

export function PillarTag({ kind, className }: { kind: PillarKey; className?: string }) {
  const p = PILLARS[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        p.bg,
        p.border,
        p.color,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", p.dot)} />
      {p.label}
    </span>
  );
}

export const RISK_STYLE: Record<RiskLevel, { label: string; text: string; bg: string; border: string; hex: string }> = {
  low: { label: "Low", text: "text-risk-low", bg: "bg-risk-low/12", border: "border-risk-low/40", hex: "#3fd8ab" },
  moderate: { label: "Moderate", text: "text-risk-moderate", bg: "bg-risk-moderate/14", border: "border-risk-moderate/40", hex: "#f0c033" },
  high: { label: "High", text: "text-risk-high", bg: "bg-risk-high/14", border: "border-risk-high/45", hex: "#f58c3c" },
  severe: { label: "Severe", text: "text-risk-severe", bg: "bg-risk-severe/16", border: "border-risk-severe/50", hex: "#ef4444" },
};

export function RiskBadge({ level, className, size = "md" }: { level: RiskLevel; className?: string; size?: "sm" | "md" }) {
  const s = RISK_STYLE[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-bold uppercase tracking-wider",
        size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-xs",
        s.text,
        s.bg,
        s.border,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  pillar,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  pillar?: PillarKey;
}) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-panel-edge px-4 py-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
              {pillar && <PillarTag kind={pillar} />}
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const toneCls =
    tone === "danger" ? "text-risk-severe" : tone === "warn" ? "text-risk-high" : tone === "good" ? "text-risk-low" : "text-foreground";
  return (
    <div className="panel px-3.5 py-3">
      <div className="label-xs">{label}</div>
      <div className={cn("mt-1 font-mono text-2xl font-semibold leading-none", toneCls)}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Bar({ value, tone = "primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, background: `var(--${tone})` }}
      />
    </div>
  );
}

export function DemoNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-muted-foreground", className)}>
      <span className="font-semibold text-risk-moderate">Prototype / SIH26085 demo.</span> Nadipur is a fictional city.
      All rainfall, sensor, drain and citizen data shown here is synthetic and generated by a scripted simulation. No
      real-world warning should be derived from this screen.
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
