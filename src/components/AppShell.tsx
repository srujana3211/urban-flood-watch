import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardCheck,
  Database,
  Gauge,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Network,
  ScrollText,
  Smartphone,
  Truck,
  Layers,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { SimControls } from "@/components/SimControls";
import { useSim } from "@/context/sim";
import { ROLES } from "@/data/city";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Command Centre", icon: LayoutDashboard, group: "Overview" },
  { to: "/map", label: "Live Flood Map", icon: MapIcon, group: "Overview" },
  { to: "/zones", label: "Zones & Assets", icon: Layers, group: "Overview" },
  { to: "/prediction", label: "Prediction", icon: BrainCircuit, group: "Pipeline" },
  { to: "/observation", label: "Observation", icon: Activity, group: "Pipeline" },
  { to: "/adaptation", label: "Adaptation", icon: Gauge, group: "Pipeline" },
  { to: "/decisions", label: "Decision Support", icon: ClipboardCheck, group: "Pipeline" },
  { to: "/resources", label: "Resource Allocation", icon: Truck, group: "Pipeline" },
  { to: "/alerts", label: "Alerts & Warnings", icon: AlertTriangle, group: "Operations" },
  { to: "/timeline", label: "Event Timeline", icon: ScrollText, group: "Operations" },
  { to: "/data-readiness", label: "Data Readiness", icon: Database, group: "System" },
  { to: "/architecture", label: "System Architecture", icon: Network, group: "System" },
] as const;

const GROUPS = ["Overview", "Pipeline", "Operations", "System"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, setRole, snapshot } = useSim();
  const [open, setOpen] = useState(false);

  const severe = snapshot.zones.filter((z) => z.risk === "severe").length;

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-panel-edge bg-panel transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-panel-edge px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded bg-primary/15 text-primary">
              <Activity className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">Nadipur FloodOps</p>
              <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">SIH26085 prototype</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {GROUPS.map((g) => (
            <div key={g} className="mb-3">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{g}</p>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "mb-0.5 flex items-center gap-2.5 rounded px-2 py-1.5 text-[13px] font-medium transition",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <n.icon className={cn("size-4 shrink-0", active && "text-primary")} />
                    <span className="truncate">{n.label}</span>
                    {n.to === "/alerts" && severe > 0 && (
                      <span className="ml-auto rounded bg-risk-severe/20 px-1.5 text-[10px] font-bold text-risk-severe">
                        {severe}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-panel-edge p-3">
          <Link
            to="/citizen"
            className="flex items-center gap-2 rounded border border-panel-edge px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <Smartphone className="size-4" />
            Open Citizen App
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-panel-edge bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 px-3 py-2 lg:px-5">
            <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <SimControls />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="hidden shrink-0 rounded border border-panel-edge bg-panel px-2 py-1.5 text-xs font-medium md:block"
              aria-label="Acting role"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t border-panel-edge bg-risk-moderate/8 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-risk-moderate lg:px-5">
            Demo simulation — fictional city of Nadipur. Not a live warning system.
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 lg:p-5">{children}</main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
