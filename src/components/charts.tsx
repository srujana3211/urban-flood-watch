import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cityRainSeries, SCENARIO, zoneSeries } from "@/lib/simulation";
import { ZONES } from "@/data/city";

const axis = { stroke: "oklch(0.68 0.02 246)", fontSize: 10 };
const grid = "oklch(0.31 0.026 251)";

const tooltipStyle = {
  background: "oklch(0.203 0.024 252)",
  border: "1px solid oklch(0.32 0.03 251)",
  borderRadius: 6,
  fontSize: 12,
};

export function ZoneDepthChart({ zoneId, tick, clearedTick }: { zoneId: string; tick: number; clearedTick: number }) {
  const data = zoneSeries(zoneId, tick, clearedTick);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="2 4" />
        <XAxis dataKey="time" {...axis} interval={11} />
        <YAxis {...axis} unit="cm" />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9fb2c6" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine x={data[SCENARIO.blockageTick]?.time} stroke="var(--observation)" strokeDasharray="3 3" label={{ value: "D17 blocks", fill: "#7fd6ff", fontSize: 10, position: "insideTopLeft" }} />
        <ReferenceLine x={data[SCENARIO.adaptationTick]?.time} stroke="var(--adaptation)" strokeDasharray="3 3" label={{ value: "adapt", fill: "#c58cff", fontSize: 10, position: "insideTopRight" }} />
        <ReferenceLine x={data[tick]?.time} stroke="var(--primary)" />
        <Line type="monotone" dataKey="predicted" name="Un-adapted forecast" stroke="var(--prediction)" dot={false} strokeWidth={2} strokeDasharray="4 3" />
        <Line type="monotone" dataKey="adaptive" name="Adaptive forecast" stroke="var(--adaptation)" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="observed" name="Observed ponding" stroke="var(--observation)" dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ZoneRainChart({ zoneId, tick, clearedTick }: { zoneId: string; tick: number; clearedTick: number }) {
  const data = zoneSeries(zoneId, tick, clearedTick).map((d) => ({
    ...d,
    past: d.tick <= tick ? d.rainfall : null,
    ahead: d.tick >= tick ? d.rainfall : null,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="2 4" />
        <XAxis dataKey="time" {...axis} interval={11} />
        <YAxis {...axis} unit="mm" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="past" name="Observed rainfall" stroke="var(--observation)" fill="var(--observation)" fillOpacity={0.22} strokeWidth={2} />
        <Area type="monotone" dataKey="ahead" name="Nowcast (lead time)" stroke="var(--prediction)" fill="var(--prediction)" fillOpacity={0.12} strokeWidth={2} strokeDasharray="4 3" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CityRainChart({ tick }: { tick: number }) {
  const data = cityRainSeries(tick);
  const codes = ZONES.slice(0, 6).map((z) => z.code);
  const colors = ["var(--risk-severe)", "var(--risk-high)", "var(--decision)", "var(--resource)", "var(--observation)", "var(--prediction)"];
  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="2 4" />
        <XAxis dataKey="time" {...axis} interval={11} />
        <YAxis {...axis} unit="mm" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {codes.map((c, i) => (
          <Line key={c} type="monotone" dataKey={c} name={`Zone ${c}`} stroke={colors[i]} dot={false} strokeWidth={1.8} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RiskBarChart({ data }: { data: { code: string; depth: number; forecast: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="2 4" />
        <XAxis dataKey="code" {...axis} />
        <YAxis {...axis} unit="cm" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="depth" name="Observed ponding" fill="var(--observation)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="forecast" name="Forecast +60 min" fill="var(--adaptation)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
