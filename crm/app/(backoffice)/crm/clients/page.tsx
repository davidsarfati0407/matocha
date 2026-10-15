import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { ClientsTable, NewClient } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("crm");
  return { title: t("clients.title") };
}

export default async function ClientsPage() {
  const t = await getTranslations("crm");
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what={t("deniedClients")} />;
  const supabase = await createClient();
  const [clients, invoices, deals] = await Promise.all([
    supabase.from("clients").select("id, kind, segment, name, email, city, satisfaction, last_contact_at, employees:owner_id(first_name, last_name)").order("name"),
    supabase.from("invoices").select("client_id, total_ht, status, total_ttc, paid_amount").neq("status", "cancelled"),
    supabase.from("deals").select("client_id, value, probability, stage").not("stage", "in", "(gagne,perdu)"),
  ]);
  const ca = new Map<string, number>();
  const due = new Map<string, number>();
  for (const i of invoices.data ?? []) {
    ca.set(i.client_id, (ca.get(i.client_id) ?? 0) + Number(i.total_ht));
    due.set(i.client_id, (due.get(i.client_id) ?? 0) + Math.max(0, Number(i.total_ttc) - Number(i.paid_amount)));
  }
  const pipe = new Map<string, number>();
  for (const d of deals.data ?? []) pipe.set(d.client_id, (pipe.get(d.client_id) ?? 0) + Number(d.value) * Number(d.probability));
  const rows = (clients.data ?? []).map((c) => {
    const o = c.employees as unknown as { first_name: string; last_name: string } | null;
    return { id: c.id, name: c.name, kind: c.kind, segment: c.segment ?? "", city: c.city ?? "", owner: o ? `${o.first_name} ${o.last_name}` : "", satisfaction: c.satisfaction, last: c.last_contact_at, ca: ca.get(c.id) ?? 0, due: due.get(c.id) ?? 0, pipe: pipe.get(c.id) ?? 0 };
  });
  return (
    <>
      <PageHeader title={t("clients.title")} subtitle={t("clients.subtitle")} actions={ctx.can("commercial", "create") ? <NewClient /> : undefined} />
      <ClientsTable rows={rows} />
    </>
  );
}
