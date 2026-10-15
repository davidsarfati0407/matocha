import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, Denied, PageHeader, Tabs } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PoTable } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.purchaseOrders");
  return { title: t("title") };
}

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; tab?: string }> }) {
  const t = await getTranslations("resources.purchaseOrders");
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const sp = await searchParams;
  const tab = sp.tab ?? "orders";
  const supabase = await createClient();
  const [pos, sups] = await Promise.all([
    supabase.from("purchase_orders").select("id, number, status, lines, total_ht, expected_on, received_at, created_at, suppliers(name)").order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, name, country, category, email, lead_time_days").order("name"),
  ]);
  const rows = (pos.data ?? [])
    .map((p) => ({
      id: p.id,
      number: p.number,
      status: p.status,
      supplier: (p.suppliers as unknown as { name: string } | null)?.name ?? "",
      lines: (p.lines as { label: string; quantity: number }[]).map((l) => `${l.label} × ${l.quantity}`).join(" · "),
      total: Number(p.total_ht),
      expected_on: p.expected_on,
    }))
    .filter((p) => !sp.status || p.status === sp.status);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Tabs
        current={tab}
        tabs={[
          { id: "orders", label: t("tabOrders"), href: "?tab=orders", count: (pos.data ?? []).length },
          { id: "suppliers", label: t("tabSuppliers"), href: "?tab=suppliers", count: (sups.data ?? []).length },
        ]}
      />
      {tab === "suppliers" ? (
        <Card padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">{t("col.supplier")}</th>
                <th className="px-3 py-2 font-medium">{t("col.category")}</th>
                <th className="px-3 py-2 font-medium">{t("col.country")}</th>
                <th className="px-3 py-2 font-medium">{t("col.leadTime")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("col.purchases")}</th>
              </tr>
            </thead>
            <tbody>
              {(sups.data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-black/5">
                  <td className="px-5 py-2.5 font-medium">{s.name}</td>
                  <td className="px-3">{s.category}</td>
                  <td className="px-3">{s.country}</td>
                  <td className="px-3">{t("days", { count: s.lead_time_days })}</td>
                  <td className="px-3 text-right tabular-nums">{formatMoney((pos.data ?? []).filter((p) => (p.suppliers as unknown as { name: string } | null)?.name === s.name).reduce((a, p) => a + Number(p.total_ht), 0), "fr", 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <PoTable rows={rows} canEdit={ctx.can("ressources", "update")} />
      )}
    </>
  );
}
