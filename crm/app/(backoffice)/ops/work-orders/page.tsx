import type { Metadata } from "next";
import { Denied, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { budgetAlertLevel } from "@/lib/domain/money";
import { nowMs } from "@/lib/clock";
import { createClient } from "@/lib/supabase/server";
import { WorkOrdersView, type WoRow } from "./view";

export const metadata: Metadata = { title: "Commandes pro" };

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; alert?: string }> }) {
  const { ctx, allowed } = await requirePerm("operations");
  if (!allowed) return <Denied what="les opérations" />;
  const sp = await searchParams;
  const supabase = await createClient();
  const [wos, hours, clients] = await Promise.all([
    supabase.from("work_orders").select("id, number, title, stage, status, progress, hours_budget, due_at, received_at, amount_ttc, blocked_reason, client_id, clients(name), owner:owner_id(first_name, last_name)").order("number", { ascending: false }),
    supabase.from("time_entries").select("work_order_id, hours"),
    ctx.can("commercial") ? supabase.from("clients").select("id, name").eq("kind", "entreprise").order("name") : Promise.resolve({ data: [] }),
  ]);
  const used = new Map<string, number>();
  for (const h of hours.data ?? []) if (h.work_order_id) used.set(h.work_order_id, (used.get(h.work_order_id) ?? 0) + Number(h.hours));
  const now = nowMs();
  let rows: WoRow[] = (wos.data ?? []).map((w) => {
    const u = used.get(w.id) ?? 0;
    const owner = w.owner as unknown as { first_name: string; last_name: string } | null;
    return {
      id: w.id,
      number: w.number,
      title: w.title,
      client: (w.clients as unknown as { name: string } | null)?.name ?? "—",
      stage: w.stage,
      status: w.status,
      progress: Number(w.progress),
      hoursUsed: u,
      hoursBudget: Number(w.hours_budget),
      level: budgetAlertLevel(u, Number(w.hours_budget)),
      dueAt: w.due_at,
      late: Boolean(w.due_at && Date.parse(w.due_at) < now && !["livree", "facturee"].includes(w.stage)),
      amountTtc: Number(w.amount_ttc),
      owner: owner ? `${owner.first_name} ${owner.last_name}` : "—",
      blocked: w.blocked_reason,
    };
  });
  if (sp.alert) rows = rows.filter((r) => !["livree", "facturee"].includes(r.stage) && (r.level >= 80 || r.late || r.status === "attente"));
  const V = sectorConfig.vocabulaire.workOrder;
  return (
    <>
      <PageHeader title={V.pluriel[0].toUpperCase() + V.pluriel.slice(1)} subtitle={`${rows.length} ${V.pluriel}${sp.alert ? " en alerte (budget ≥ 80 %, retard ou attente)" : ""} · créées automatiquement à l'acceptation d'un devis`} />
      <WorkOrdersView rows={rows} view={sp.view === "kanban" ? "kanban" : "liste"} clients={(clients.data ?? []) as { id: string; name: string }[]} canCreate={ctx.can("operations", "create")} />
    </>
  );
}
