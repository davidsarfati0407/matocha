import type { Metadata } from "next";
import { Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { LotsTable } from "./table";

export const metadata: Metadata = { title: "Lots & traçabilité" };

export default async function LotsPage() {
  const { allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what="les lots" />;
  const supabase = await createClient();
  const { data } = await supabase.from("lots").select("id, number, quantity, status, best_before, received_at, coa_ok, retained_samples, stock_items(reference, name), suppliers(name)").order("received_at", { ascending: false, nullsFirst: true });
  return (
    <>
      <PageHeader title="Lots & traçabilité" subtitle="Chaque lot : réception, contrôle qualité, échantillons retenus, clients livrés" />
      <LotsTable
        rows={(data ?? []).map((l) => ({
          id: l.id,
          number: l.number,
          item: (l.stock_items as unknown as { name: string } | null)?.name ?? "",
          supplier: (l.suppliers as unknown as { name: string } | null)?.name ?? "",
          quantity: Number(l.quantity),
          status: l.status,
          best_before: l.best_before,
          received_at: l.received_at,
          coa: l.coa_ok,
        }))}
      />
    </>
  );
}
