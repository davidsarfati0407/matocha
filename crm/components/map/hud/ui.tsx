"use client";
/** Primitives d'interface de la map : icônes, pastilles de statut, jauges. */
import type { ReactNode } from "react";

const ICONS: Record<string, string> = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Zm4.3 13a2 2 0 0 0 3.4 0",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  rotl: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5",
  rotr: "M21 12a9 9 0 1 1-3-6.7L21 8m0-5v5h-5",
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  play: "M7 4v16l13-8z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-14v4m0 12v4M2 12h4m12 0h4",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  x: "M18 6 6 18M6 6l12 12",
  chevron: "m9 18 6-6-6-6",
  down: "m6 9 6 6 6-6",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2",
  layers: "m12 2 10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  mail: "M4 4h16v16H4zM4 6l8 7 8-7",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z",
  cup: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2m4-2v2m4-2v2",
  check: "M20 6 9 17l-5-5",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  undo: "M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13",
  redo: "M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8",
  trash: "M3 6h18M8 6V4h8v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
};

export function Icon({ name, size = 16, className = "" }: { name: keyof typeof ICONS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICONS[name] ?? ICONS.box} />
    </svg>
  );
}

export const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  au_poste: { label: "Au poste", cls: "bg-[#2f8f5b]/12 text-[#2f8f5b]", dot: "bg-[#2f8f5b]" },
  reunion: { label: "En réunion", cls: "bg-[#3D5A80]/12 text-[#3D5A80]", dot: "bg-[#3D5A80]" },
  pause: { label: "En pause", cls: "bg-[#c98a12]/15 text-[#a36f0c]", dot: "bg-[#c98a12]" },
  teletravail: { label: "Télétravail", cls: "bg-[#79A84B]/20 text-[#173D2B]", dot: "bg-[#79A84B]" },
  deplacement: { label: "En déplacement", cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  absent: { label: "Absent", cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  pas_badge: { label: "Pas encore badgé", cls: "bg-[#E07A5F]/12 text-[#c2573c]", dot: "bg-[#E07A5F]" },
  parti: { label: "Parti", cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  ok: { label: "OK", cls: "bg-[#2f8f5b]/12 text-[#2f8f5b]", dot: "bg-[#2f8f5b]" },
  warn: { label: "Alerte", cls: "bg-[#c98a12]/15 text-[#a36f0c]", dot: "bg-[#c98a12]" },
  accent: { label: "", cls: "bg-[#E07A5F]/12 text-[#c2573c]", dot: "bg-[#E07A5F]" },
  muted: { label: "", cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
};

export function Pill({ tone, children }: { tone: keyof typeof STATUS | string; children?: ReactNode }) {
  const s = STATUS[tone] ?? STATUS.muted;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {children ?? s.label}
    </span>
  );
}

export function Bar({ value, tone = "brand", className = "" }: { value: number; tone?: "brand" | "accent" | "warn" | "ok"; className?: string }) {
  const color = { brand: "bg-brand", accent: "bg-accent", warn: "bg-warn", ok: "bg-ok" }[tone];
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-black/8 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-700`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-1.5 mt-4 flex items-baseline justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink">{children}</h3>
      {aside && <span className="text-[11px] text-muted">{aside}</span>}
    </div>
  );
}

export function Ring({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`${Math.round(value * 100)} %`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .8s" }} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="fill-ink text-[11px] font-semibold">
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

export const panel = "rounded-2xl bg-white/92 shadow-[0_1px_2px_rgb(22_23_19/0.05),0_8px_24px_rgb(22_23_19/0.08)] ring-1 ring-black/5 backdrop-blur";
