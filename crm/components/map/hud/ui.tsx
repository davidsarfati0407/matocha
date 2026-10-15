"use client";
/** Primitives d'interface de la map : icônes, pastilles de statut, jauges. */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

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
  cart: "M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6M9 21h.01M18 21h.01",
  timer: "M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  badge: "M3 5h18v14H3zM7 9h4M7 13h6M15 9h2v2h-2z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  "user-plus": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-3v6m3-3h-6",
  bank: "M3 21h18M5 21V10m14 11V10M9 21v-7m6 7v-7M2 10l10-7 10 7z",
  receipt: "M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2zM9 8h6m-6 4h6",
  tool: "M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5L13 5z",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.1-1.2L14.5 3h-5l-.3 2.6a7.4 7.4 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.1 1.2l.3 2.6h5l.3-2.6a7.4 7.4 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  plug: "M9 2v6m6-6v6M6 8h12v4a6 6 0 0 1-12 0zm6 10v4",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  calendar: "M4 5h16v16H4zM16 3v4M8 3v4M4 10h16",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  download: "M12 3v12m0 0-4-4m4 4 4-4M4 21h16",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  send: "m22 2-7 20-4-9-9-4zM22 2 11 13",
  menu: "M3 6h18M3 12h18M3 18h18",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  "arrow-left": "M19 12H5m7-7-7 7 7 7",
};

export function Icon({ name, size = 16, className = "" }: { name: keyof typeof ICONS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICONS[name] ?? ICONS.box} />
    </svg>
  );
}

/** Couleurs des pastilles ; libellés traduits au rendu (status.presence.* ou map.pill.*). */
export const STATUS: Record<string, { cls: string; dot: string }> = {
  au_poste: { cls: "bg-[#2f8f5b]/12 text-[#2f8f5b]", dot: "bg-[#2f8f5b]" },
  reunion: { cls: "bg-[#3D5A80]/12 text-[#3D5A80]", dot: "bg-[#3D5A80]" },
  pause: { cls: "bg-[#c98a12]/15 text-[#a36f0c]", dot: "bg-[#c98a12]" },
  teletravail: { cls: "bg-[#79A84B]/20 text-[#173D2B]", dot: "bg-[#79A84B]" },
  deplacement: { cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  absent: { cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  pas_badge: { cls: "bg-[#E07A5F]/12 text-[#c2573c]", dot: "bg-[#E07A5F]" },
  parti: { cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
  ok: { cls: "bg-[#2f8f5b]/12 text-[#2f8f5b]", dot: "bg-[#2f8f5b]" },
  warn: { cls: "bg-[#c98a12]/15 text-[#a36f0c]", dot: "bg-[#c98a12]" },
  accent: { cls: "bg-[#E07A5F]/12 text-[#c2573c]", dot: "bg-[#E07A5F]" },
  muted: { cls: "bg-black/5 text-[#64707a]", dot: "bg-[#64707a]" },
};

/** Clé de libellé (traducteur racine) d'une pastille ; vide pour les tons purement décoratifs. */
const PRESENCE = new Set(["au_poste", "reunion", "pause", "teletravail", "deplacement", "absent", "pas_badge", "parti"]);
export const statusKey = (tone: string) => (PRESENCE.has(tone) ? `status.presence.${tone}` : tone === "ok" || tone === "warn" ? `map.pill.${tone}` : null);

export function Pill({ tone, children }: { tone: keyof typeof STATUS | string; children?: ReactNode }) {
  const t = useTranslations();
  const s = STATUS[tone] ?? STATUS.muted;
  const key = children == null ? statusKey(tone) : null;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {children ?? (key ? t(key) : "")}
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
