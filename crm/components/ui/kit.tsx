/**
 * Primitives du design system « corporate calme » (serveur ou client) :
 * boutons, badges, cartes, en-têtes de page, tuiles KPI, états vides.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/map/hud/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-ground hover:bg-brand-deep",
  accent: "bg-accent text-white hover:brightness-95",
  secondary: "bg-white text-ink ring-1 ring-black/10 hover:bg-black/[0.03]",
  ghost: "text-ink hover:bg-black/[0.05]",
  danger: "bg-white text-[#b3402a] ring-1 ring-[#b3402a]/30 hover:bg-[#b3402a]/5",
};
export const btn = (v: Variant = "secondary", size: "sm" | "md" = "md") =>
  `inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm"} ${VARIANT[v]}`;

export function Button({ variant = "secondary", size = "md", icon, children, className = "", ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md"; icon?: string }) {
  return (
    <button className={`${btn(variant, size)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 15} />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "secondary", size = "md", icon, children, className = "" }: { href: string; variant?: Variant; size?: "sm" | "md"; icon?: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${btn(variant, size)} ${className}`}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 15} />}
      {children}
    </Link>
  );
}

const TONES = {
  ok: "bg-[#2f8f5b]/12 text-[#25734a]",
  warn: "bg-[#c98a12]/15 text-[#8a5d08]",
  danger: "bg-[#E07A5F]/14 text-[#b3402a]",
  info: "bg-[#3D5A80]/12 text-[#3D5A80]",
  muted: "bg-black/[0.05] text-[#5b666e]",
  brand: "bg-brand/10 text-brand",
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = "muted", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function Card({ children, className = "", title, action, padded = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; padded?: boolean }) {
  return (
    <section className={`card ${padded ? "p-5" : ""} ${className}`}>
      {(title || action) && (
        <header className={`mb-3 flex items-center justify-between gap-3 ${padded ? "" : "px-5 pt-4"}`}>
          {title && <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink/80">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, kicker }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; kicker?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {kicker && <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{kicker}</p>}
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, sub, tone, href, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "warn" | "danger"; href?: string; icon?: string }) {
  const inner = (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon name={icon} size={17} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        <p className={`text-2xl font-semibold tracking-tight ${tone === "danger" ? "text-[#b3402a]" : tone === "warn" ? "text-[#8a5d08]" : ""}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted">{sub}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition hover:-translate-y-0.5">
      {inner}
    </Link>
  ) : (
    <div className="card p-4">{inner}</div>
  );
}

export function Empty({ title, hint, action, icon = "box" }: { title: string; hint?: string; action?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-ground text-brand">
        <Icon name={icon} size={20} />
      </span>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Denied({ what }: { what?: string }) {
  const t = useTranslations("ui");
  return (
    <div className="card mx-auto mt-10 max-w-md">
      <Empty icon="lock" title={t("denied")} hint={t("deniedHint", { what: what ?? t("thisPage") })} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`} />;
}

export function Dl({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,auto)_1fr] gap-x-6 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 font-medium">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tabs({ tabs, current }: { tabs: { id: string; label: string; href: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Onglets" className="mb-4 flex gap-1 overflow-x-auto border-b border-black/10">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={t.id === current ? "page" : undefined} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${t.id === current ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-black/[0.06] px-1.5 text-[11px]">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Jauge ; `value` est une fraction de 0 à 1. `label` : nom accessible (sinon « n % »). */
export function Progress({ value, tone = "brand", className = "", label }: { value: number; tone?: "brand" | "accent" | "warn" | "danger" | "ok"; className?: string; label?: string }) {
  const c = { brand: "bg-brand", accent: "bg-accent", warn: "bg-warn", danger: "bg-[#b3402a]", ok: "bg-ok" }[tone];
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-black/[0.07] ${className}`} role="progressbar" aria-label={label ?? `${Math.round(value * 100)} %`} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}
