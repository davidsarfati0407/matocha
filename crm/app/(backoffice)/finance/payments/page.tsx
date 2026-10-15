import type { Metadata } from "next";
import Link from "next/link";
import { Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { CamtImport } from "./client";

export const metadata: Metadata = { title: "Paiements" };

export default async function PaymentsPage() {
  const { ctx, allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what="les paiements" />;
  const supabase = await createClient();
  const { data } = await supabase.from("payments").select("id, amount, received_on, method, reference, invoices(id, number, clients(name))").order("received_on", { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Paiements" subtitle="Encaissements et rapprochement bancaire (relevé camt.054 · connexion bancaire en mode simulé)" />
      <div className="grid gap-4 lg:grid-cols-5">
        {ctx.can("finance", "create") && <CamtImport />}
        <Card title="Derniers encaissements" padded={false} className="lg:col-span-3">
          <ul className="divide-y divide-black/5 text-sm">
            {(data ?? []).map((p) => {
              const inv = p.invoices as unknown as { id: string; number: string; clients: { name: string } } | null;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <span className="min-w-0 truncate">
                    <span className="text-muted">{formatDate(p.received_on)}</span> · {inv ? <Link className="font-mono text-accent" href={`/finance/invoices/${inv.id}`}>{inv.number}</Link> : "non affecté"} · {inv?.clients?.name}
                    {p.reference ? <span className="text-muted"> · {p.reference}</span> : null}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{formatMoney(Number(p.amount))}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
