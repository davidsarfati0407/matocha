import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { TimeBoard } from "./board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ops.time");
  return { title: t("title") };
}

export default async function TimePage() {
  const t = await getTranslations("ops.time");
  const ctx = await getCtx();
  const supabase = await createClient();
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);
  const [wos, entries] = await Promise.all([
    supabase.from("work_orders").select("id, number, title, clients(name)").not("stage", "in", "(facturee)").order("number", { ascending: false }),
    ctx.employeeId ? supabase.from("time_entries").select("id, work_order_id, worked_on, hours, billable, note, invoice_id").eq("employee_id", ctx.employeeId).gte("worked_on", weekStart).order("worked_on") : Promise.resolve({ data: [] }),
  ]);
  return (
    <>
      <PageHeader title={t("heading")} subtitle={t("subtitle")} />
      {!ctx.employeeId ? (
        <Card>{t("noEmployee")}</Card>
      ) : (
        <TimeBoard
          weekStart={weekStart}
          workOrders={(wos.data ?? []).map((w) => ({ id: w.id, label: `${w.number} · ${(w.clients as unknown as { name: string } | null)?.name ?? ""}` }))}
          entries={(entries.data ?? []).map((e) => ({ ...e, hours: Number(e.hours) }))}
        />
      )}
    </>
  );
}
