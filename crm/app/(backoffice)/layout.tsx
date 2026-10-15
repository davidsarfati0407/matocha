import { Shell } from "@/components/backoffice/Shell";
import { getCtx } from "@/lib/backoffice/context";
import { NAV } from "@/lib/backoffice/nav";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/Toaster";
import { sectorConfig } from "@/config/sector.config";

export default async function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const supabase = await createClient();
  const [{ data: counters }, presence] = await Promise.all([
    supabase.rpc("backoffice_counters"),
    ctx.employeeId ? supabase.from("presence_status").select("status").eq("employee_id", ctx.employeeId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const c = (counters ?? {}) as Record<string, number>;
  const todo = (c.quotes_to_send ?? 0) + (c.leaves_pending ?? 0) + (c.dunning_due ?? 0) + (c.stock_low ?? 0) + (c.wo_alerts ?? 0) + (c.expenses_pending ?? 0);
  const nav = NAV.map((g) => ({
    label: g.label,
    items: g.items
      .filter((i) => ctx.can(i.module) && (!i.requiresSalaries || ctx.role.seesSalaries))
      .map((i) => ({ href: i.href, label: i.label, icon: i.icon, count: i.counter === "todo" ? todo : i.counter ? c[i.counter] ?? 0 : 0 })),
  })).filter((g) => g.items.length);
  return (
    <Shell
      nav={nav}
      user={{ name: ctx.fullName, role: ctx.role.label, status: (presence.data as { status?: string } | null)?.status ?? null }}
      mapHref={`/map/${sectorConfig.lieux[0].id}`}
      demoNotice={sectorConfig.entreprise.statutDemo}
      unread={c.notifications ?? 0}
      canAi={ctx.can("ia")}
    >
      {children}
      <Toaster />
    </Shell>
  );
}
