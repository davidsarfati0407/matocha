import type { Metadata } from "next";
import { Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { NewDeal, PipelineBoard } from "./board";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what="le pipeline" />;
  const supabase = await createClient();
  const [deals, clients] = await Promise.all([
    supabase.from("deals").select("id, title, stage, value, probability, expected_close_on, source, client_id, clients(name), employees:owner_id(first_name)").order("value", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const rows = (deals.data ?? []).map((d) => ({ id: d.id, title: d.title, stage: d.stage, value: Number(d.value), probability: Number(d.probability), close: d.expected_close_on, client: (d.clients as unknown as { name: string } | null)?.name ?? "", clientId: d.client_id, owner: (d.employees as unknown as { first_name: string } | null)?.first_name ?? "" }));
  const open = rows.filter((r) => !["gagne", "perdu"].includes(r.stage));
  return (
    <>
      <PageHeader title="Pipeline" subtitle="Glissez une carte pour changer d'étape · la probabilité suit l'étape" actions={ctx.can("commercial", "create") ? <NewDeal clients={clients.data ?? []} /> : undefined} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Pipeline ouvert" value={formatMoney(open.reduce((s, r) => s + r.value, 0), "fr", 0)} sub={`${open.length} opportunité(s)`} icon="chart" />
        <Stat label="Pondéré" value={formatMoney(open.reduce((s, r) => s + r.value * r.probability, 0), "fr", 0)} sub="valeur × probabilité" icon="zap" />
        <Stat label="Gagné" value={formatMoney(rows.filter((r) => r.stage === "gagne").reduce((s, r) => s + r.value, 0), "fr", 0)} icon="check" />
      </div>
      <PipelineBoard rows={rows} canEdit={ctx.can("commercial", "update")} />
    </>
  );
}
