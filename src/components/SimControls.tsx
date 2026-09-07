import { Pause, Play, RotateCcw, Radio } from "lucide-react";
import { useSim } from "@/context/sim";
import { PillarTag } from "@/components/kit";
import { TICKS } from "@/lib/simulation";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 2, 4, 8];

export function SimControls({ compact = false }: { compact?: boolean }) {
  const { tick, running, speed, play, pause, reset, setSpeed, seek, snapshot, connected } = useSim();

  return (
    <div className={cn("flex flex-wrap items-center gap-3", compact && "gap-2")}>
      <div className="flex items-center gap-1">
        <button
          onClick={running ? pause : play}
          className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          title="Reset demo"
          className="inline-flex items-center gap-1.5 rounded border border-panel-edge px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          {!compact && "Reset"}
        </button>
      </div>

      <div className="flex items-center gap-1 rounded border border-panel-edge p-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={cn(
              "rounded px-2 py-1 font-mono text-[11px] font-semibold transition",
              speed === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}×
          </button>
        ))}
      </div>

      <div className="flex min-w-[180px] flex-1 items-center gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">{snapshot.clock}</span>
        <input
          type="range"
          min={0}
          max={TICKS}
          value={tick}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          T+{String(tick * 5).padStart(3, "0")}m
        </span>
      </div>

      <PillarTag kind={snapshot.phaseKind} />
      {!compact && <span className="hidden text-xs text-muted-foreground lg:inline">{snapshot.phase}</span>}
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest",
          connected ? "text-risk-low" : "text-muted-foreground",
        )}
        title={connected ? "Shared demo state synced across all open screens" : "Connecting to shared demo state"}
      >
        <Radio className="size-3" />
        {connected ? "Shared" : "Local"}
      </span>
    </div>
  );
}
