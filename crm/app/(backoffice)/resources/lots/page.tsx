import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { LotsTable } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.lots");
  return { title: t("title") };
}

export default async function LotsPage() {
  const t = await getTranslations("resources.lots");
  const { allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const { data } = await supabase.from("lots").select("id, number, quantity, status, best_before, received_at, coa_ok, retained_samples, stock_items(reference, name), suppliers(name)").order("received_at", { ascending: false, nullsFirst: true });
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
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
