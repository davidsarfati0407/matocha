import type { Metadata } from "next";
import { Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "./table";

export const metadata: Metadata = { title: "Factures" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what="les factures" />;
  const status = (await searchParams).status;
  const supabase = await createClient();
  await supabase.rpc("refresh_overdue"); // échéances dépassées → « échue » (sans effet si rôle en lecture)
  const { data } = await supabase.from("invoices").select("id, number, kind, status, issued_on, due_on, total_ht, total_ttc, paid_amount, clients(name), work_orders(number)").order("number", { ascending: false });
  const all = (data ?? []).map((i) => ({ id: i.id, number: i.number, kind: i.kind, status: i.status, issued: i.issued_on, due: i.due_on, ht: Number(i.total_ht), ttc: Number(i.total_ttc), paid: Number(i.paid_amount), client: (i.clients as unknown as { name: string } | null)?.name ?? "", wo: (i.work_orders as unknown as { number: string } | null)?.number ?? "" }));
  const open = all.filter((i) => ["sent", "partial", "overdue"].includes(i.status) && i.kind !== "avoir");
  const overdue = all.filter((i) => i.status === "overdue");
  const rows = status ? all.filter((i) => i.status === status) : all;
  return (
    <>
      <PageHeader title="Factures" subtitle="Créées depuis les commandes livrées, sans ressaisie · PDF + XML Factur-X" />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Encours client" value={formatMoney(open.reduce((s, i) => s + i.ttc - i.paid, 0), "fr", 0)} sub={`${open.length} facture(s) ouverte(s)`} icon="bank" href="?status=sent" />
        <Stat label="Échu" value={formatMoney(overdue.reduce((s, i) => s + i.ttc - i.paid, 0), "fr", 0)} tone={overdue.length ? "danger" : undefined} sub={`${overdue.length} facture(s) · relances →`} icon="bell" href="/finance/dunning" />
        <Stat label="Encaissé" value={formatMoney(all.reduce((s, i) => s + (i.kind === "avoir" ? 0 : i.paid), 0), "fr", 0)} icon="check" href="/finance/payments" />
      </div>
      <InvoicesTable rows={rows} />
    </>
  );
}
