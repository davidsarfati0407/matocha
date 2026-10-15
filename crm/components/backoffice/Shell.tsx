"use client";
import { backOfficeHref } from "@/lib/map/links";
/** Coque du back-office : barre latérale groupée, en-tête (fil d'Ariane, ⌘K, notifications, IA), bouton Map. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/map/hud/ui";
import { useTranslations } from "next-intl";
import { setLocale } from "@/app/(tech)/tech/actions";
import { listNotifications, markNotificationsRead, searchAll, type SearchHit } from "@/app/(backoffice)/_actions/shell";
import { AiPanel } from "./AiPanel";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: string; count: number }[];
}

const STATUS_DOT: Record<string, string> = { au_poste: "bg-ok", reunion: "bg-[#3D5A80]", pause: "bg-warn", teletravail: "bg-matcha" };

export function Shell({ nav, user, mapHref, demoNotice, unread, canAi, segments, locale, locales, children }: { nav: NavGroup[]; user: { name: string; role: string; status: string | null }; mapHref: string; demoNotice: string; unread: number; canAi: boolean; segments: Record<string, string>; locale: string; locales: string[]; children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  const tAll = useTranslations();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [ai, setAi] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const segs = pathname.split("/").filter(Boolean);
  const crumbs = segs.map((s, i) => ({ href: "/" + segs.slice(0, i + 1).join("/"), label: segments[s] ?? (s.length > 20 ? segments.record : decodeURIComponent(s)) }));
  const status = user.status && STATUS_DOT[user.status] ? [tAll(`status.presence.${user.status}` as never), STATUS_DOT[user.status]] : null;

  return (
    <div className="flex min-h-dvh">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 p-3 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`} aria-label={t("mainNav")}>
        <div className="card flex h-full flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
            <Logo size={32} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">MATOCHA</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{t("backOffice")}</p>
            </div>
          </div>
          <Link href={mapHref} className="mx-3 my-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ground hover:bg-brand-deep">
            <Icon name="map" size={15} /> {t("map")}
          </Link>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {nav.map((g) => (
              <div key={g.label} className="mt-3">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{g.label}</p>
                {g.items.map((i) => {
                  const active = pathname === i.href || (i.href !== "/settings" && pathname.startsWith(i.href + "/")) || (i.href === "/settings" && pathname === "/settings");
                  return (
                    <Link key={i.href} href={i.href} onClick={() => setMenu(false)} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] ${active ? "bg-accent/10 font-semibold text-ink" : "text-ink/80 hover:bg-black/[0.04]"}`}>
                      <Icon name={i.icon} size={15} className={active ? "text-accent" : "text-muted"} />
                      <span className="flex-1 truncate">{i.label}</span>
                      {i.count > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{i.count}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2.5 border-t border-black/5 p-3">
            <span className="relative grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              {status && <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${status[1]}`} />}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted">
                {user.role}
                {status ? ` · ${status[0]}` : ""}
              </p>
            </div>
            <div role="group" aria-label={t("language")} className="flex rounded-lg bg-black/[0.04] p-0.5 text-[10px] font-semibold uppercase">
              {locales.map((l) => (
                <button key={l} aria-pressed={l === locale} onClick={async () => (await setLocale(l), router.refresh())} className={`rounded-md px-1.5 py-0.5 ${l === locale ? "bg-white shadow-sm" : "text-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
            <form action="/auth/signout" method="post">
              <button aria-label={t("signOut")} title={t("signOut")} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink">
                <Icon name="external" size={14} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      {menu && <div className="fixed inset-0 z-30 bg-ink/20 lg:hidden" onClick={() => setMenu(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 bg-ground/80 px-4 py-3 backdrop-blur sm:px-6">
          <button aria-label={t("menu")} onClick={() => setMenu(true)} className="grid size-9 place-items-center rounded-xl ring-1 ring-black/10 lg:hidden">
            <Icon name="menu" size={16} />
          </button>
          <nav aria-label={t("breadcrumb")} className="min-w-0 flex-1 truncate text-sm">
            <ol className="flex items-center gap-1.5 truncate">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5 truncate">
                  {i > 0 && <span className="text-muted">/</span>}
                  {i === crumbs.length - 1 ? <span className="truncate font-semibold">{c.label}</span> : <Link href={c.href} className="truncate text-muted hover:text-ink">{c.label}</Link>}
                </li>
              ))}
            </ol>
          </nav>
          <button onClick={() => setPalette(true)} className="hidden h-9 items-center gap-2 rounded-xl bg-white px-3 text-sm text-muted ring-1 ring-black/10 hover:text-ink sm:flex">
            <Icon name="search" size={14} /> {t("search")} <kbd className="rounded bg-black/5 px-1 text-[10px]">⌘K</kbd>
          </button>
          <Bell unread={unread} />
          {canAi && (
            <button onClick={() => setAi(!ai)} aria-pressed={ai} className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ring-1 ring-black/10 ${ai ? "bg-ink text-white" : "bg-white hover:bg-black/[0.03]"}`}>
              <Icon name="sparkles" size={15} /> {t("assistant")}
            </button>
          )}
        </header>
        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 px-4 pb-10 pt-2 sm:px-6">{children}</main>
          {ai && <AiPanel onClose={() => setAi(false)} />}
        </div>
        <p className="pb-3 text-center text-[10px] text-muted">{demoNotice}</p>
      </div>
      {palette && <CommandPalette onClose={() => setPalette(false)} nav={nav} />}
    </div>
  );
}

const QUICK = [
  { key: "newQuote", href: "/crm/quotes/new" },
  { key: "leaves", href: "/hr/leaves?status=pending" },
  { key: "invoice", href: "/finance/invoices?status=draft" },
  { key: "dunning", href: "/finance/dunning" },
  { key: "reorder", href: "/resources/stock?tab=low" },
  { key: "time", href: "/ops/time" },
] as const;

function CommandPalette({ onClose, nav }: { onClose: () => void; nav: NavGroup[] }) {
  const router = useRouter();
  const t = useTranslations("shell");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const t = setTimeout(() => void searchAll(q).then(setHits), 160);
    return () => clearTimeout(t);
  }, [q]);
  const n = q.toLowerCase();
  const pages = nav.flatMap((g) => g.items.map((i) => ({ group: t("palette.goTo"), label: i.label, sub: g.label, href: i.href })));
  const quick = QUICK.map((x) => ({ group: t("palette.actions"), label: t(`quick.${x.key}`), sub: t(`quick.${x.key}Sub`), href: x.href }));
  const results = [...quick.filter((x) => !n || x.label.toLowerCase().includes(n)), ...hits, ...pages.filter((p) => n && p.label.toLowerCase().includes(n))].slice(0, 30);
  const go = (h: string) => {
    onClose();
    router.push(h);
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/25 p-4 pt-[12vh]" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={t("palette.label")} className="card w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <label className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
          <Icon name="search" size={16} className="text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") setActive((a) => Math.min(results.length - 1, a + 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
              if (e.key === "Enter" && results[active]) go(results[active].href);
            }}
            placeholder={t("palette.placeholder")}
            aria-label={t("palette.input")}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
        <ul className="max-h-[55vh] overflow-y-auto p-1.5" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.href}:${i}`}>
              {(i === 0 || results[i - 1].group !== r.group) && <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{r.group}</p>}
              <button role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r.href)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm ${i === active ? "bg-accent/10" : ""}`}>
                <span className="truncate font-medium">{r.label}</span>
                <span className="truncate text-xs text-muted">{r.sub}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="p-4 text-sm text-muted">{t("palette.none")}</li>}
        </ul>
      </div>
    </div>
  );
}

function Bell({ unread }: { unread: number }) {
  const t = useTranslations("shell");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Awaited<ReturnType<typeof listNotifications>>>([]);
  const [count, setCount] = useState(unread);
  return (
    <div className="relative">
      <button
        aria-label={t("bell.label", { count })}
        onClick={async () => {
          setOpen(!open);
          if (!open) {
            setItems(await listNotifications());
            await markNotificationsRead();
            setCount(0);
          }
        }}
        className="relative grid size-9 place-items-center rounded-xl bg-white ring-1 ring-black/10"
      >
        <Icon name="bell" size={16} />
        {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{count}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 top-11 z-30 max-h-[60vh] w-80 overflow-y-auto p-1.5">
          {items.length === 0 && <p className="p-3 text-sm text-muted">{t("bell.none")}</p>}
          {items.map((n) => (
            <Link key={n.id} onClick={() => setOpen(false)} href={n.entity_type?.startsWith("/") ? n.entity_type : n.entity_type && n.entity_id ? backOfficeHref(n.entity_type, n.entity_id) : "#"} className="block rounded-lg px-2.5 py-2 hover:bg-black/[0.03]">
              <p className="text-[13px] font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-muted">{n.body}</p>}
              <p className="text-[10px] text-muted">{new Date(n.created_at).toLocaleString(undefined, { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
