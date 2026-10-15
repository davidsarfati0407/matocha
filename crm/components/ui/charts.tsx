"use client";
/**
 * Graphiques (Recharts) selon la méthode dataviz : une seule échelle, traits de
 * 2 px, aplat à 10 %, barres ≤ 24 px aux extrémités arrondies, grille fine,
 * survol par défaut. Palette validée (scripts dataviz) : série 1 #5e8f3e,
 * série 2 #2a78d6 — toutes les vérifications passent sur fond blanc.
 */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const SERIES = ["#5e8f3e", "#2a78d6"] as const;
const GRID = "#ebe8e1";
const AXIS = { fontSize: 11, fill: "#64707a" };

type Fmt = (v: number) => string;

function Tip({ active, payload, label, fmt, labelFmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; fmt: Fmt; labelFmt?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/10">
      <p className="mb-1 font-semibold text-ink">{labelFmt ? labelFmt(String(label)) : label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink/80">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name} : <span className="font-semibold tabular-nums text-ink">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({ data, x, y, name, fmt, labelFmt, height = 220 }: { data: Record<string, unknown>[]; x: string; y: string; name: string; fmt: Fmt; labelFmt?: (l: string) => string; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`${name} : courbe`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={labelFmt} minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={64} />
          <Tooltip content={<Tip fmt={fmt} labelFmt={labelFmt} />} cursor={{ stroke: "#9aa1a6", strokeWidth: 1 }} />
          <Area type="monotone" dataKey={y} name={name} stroke={SERIES[0]} strokeWidth={2} fill={SERIES[0]} fillOpacity={0.1} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Columns({ data, x, y, name, fmt, labelFmt, height = 200 }: { data: Record<string, unknown>[]; x: string; y: string; name: string; fmt: Fmt; labelFmt?: (l: string) => string; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`${name} : histogramme`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={labelFmt} minTickGap={16} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={48} />
          <Tooltip content={<Tip fmt={fmt} labelFmt={labelFmt} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey={y} name={name} fill={SERIES[0]} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PairedBars({ data, x, a, b, fmt, labelFmt, height = 240 }: { data: Record<string, unknown>[]; x: string; a: { key: string; name: string }; b: { key: string; name: string }; fmt: Fmt; labelFmt?: (l: string) => string; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`${a.name} et ${b.name}`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={labelFmt} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={64} />
          <Tooltip content={<Tip fmt={fmt} labelFmt={labelFmt} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#24261F" }} />
          <Bar dataKey={a.key} name={a.name} fill={SERIES[0]} maxBarSize={24} radius={[4, 4, 0, 0]} />
          <Bar dataKey={b.key} name={b.name} fill={SERIES[1]} maxBarSize={24} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
