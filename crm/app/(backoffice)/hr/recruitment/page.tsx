import type { Metadata } from "next";
import { Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { AddCandidate, CandidateBoard } from "./client";

export const metadata: Metadata = { title: "Recrutement" };

export default async function RecruitmentPage() {
  const { ctx, allowed } = await requirePerm("rh");
  if (!allowed) return <Denied what="le recrutement" />;
  const supabase = await createClient();
  const [jobs, cands] = await Promise.all([
    supabase.from("job_openings").select("id, title, criteria, status, opened_on, departments(name)").order("opened_on", { ascending: false }),
    supabase.from("candidates").select("id, job_opening_id, full_name, email, source, score, ai_summary, stage, created_at").order("created_at"),
  ]);
  const openings = (jobs.data ?? []).map((j) => ({ id: j.id, title: j.title, criteria: j.criteria as string[], dept: (j.departments as unknown as { name: string } | null)?.name ?? "", opened: j.opened_on ? formatDate(j.opened_on) : "" }));
  return (
    <>
      <PageHeader title="Recrutement" subtitle="Postes ouverts, candidats par étape, score A/B/C sur les critères du poste, e-mails pré-rédigés" actions={ctx.can("rh", "create") ? <AddCandidate openings={openings} /> : undefined} />
      {openings.map((o) => (
        <section key={o.id} className="mb-6">
          <h2 className="mb-1 text-base font-semibold">{o.title}</h2>
          <p className="mb-3 text-xs text-muted">{o.dept} · ouvert le {o.opened} · critères : {o.criteria.join(", ")}</p>
          <CandidateBoard opening={o} candidates={(cands.data ?? []).filter((c) => c.job_opening_id === o.id).map((c) => ({ ...c, met: ((c.ai_summary as { criteres_remplis?: string[] } | null)?.criteres_remplis ?? []) }))} canEdit={ctx.can("rh", "update")} company={ctx.orgName} />
        </section>
      ))}
    </>
  );
}
