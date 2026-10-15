import { nowMs } from "@/lib/clock";
import type { Metadata } from "next";
import { Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { AssetsTable } from "./table";

export const metadata: Metadata = { title: "Équipements & salles" };

export default async function AssetsPage() {
  const { allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what="les équipements" />;
  const supabase = await createClient();
  const { data } = await supabase.from("assets").select("id, key, name, type, status, next_maintenance_on, zones(name), employees:assigned_employee_id(first_name, last_name)").order("type").order("name");
  const in30 = new Date(nowMs() + 30 * 86400_000).toISOString().slice(0, 10);
  const rows = (data ?? []).map((a) => {
    const e = a.employees as unknown as { first_name: string; last_name: string } | null;
    return { id: a.id, name: a.name, type: a.type, status: a.status, zone: (a.zones as unknown as { name: string } | null)?.name ?? "", assigned: e ? `${e.first_name} ${e.last_name}` : "", next: a.next_maintenance_on };
  });
  const soon = rows.filter((r) => r.next && r.next <= in30).length;
  return (
    <>
      <PageHeader title="Équipements & salles" subtitle="Parc, affectations, maintenance préventive et réservations" />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Équipements" value={formatNumber(rows.length)} icon="tool" />
        <Stat label="Maintenance sous 30 jours" value={formatNumber(soon)} tone={soon ? "warn" : undefined} icon="clock" />
        <Stat label="Hors service / en panne" value={formatNumber(rows.filter((r) => ["panne", "hors_service", "maintenance"].includes(r.status)).length)} icon="bell" />
      </div>
      <AssetsTable rows={rows} />
    </>
  );
}
