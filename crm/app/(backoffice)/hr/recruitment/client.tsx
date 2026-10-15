"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { Drawer, Modal } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Badge, Button } from "@/components/ui/kit";
import { nowMs } from "@/lib/clock";
import { scoreCandidate } from "@/lib/domain/recruit";
import { report, toast } from "@/lib/ui/toast";
import { addCandidate, hireCandidate, moveCandidate } from "../actions";

// Libellés : hr.recruitment.stages.<id>
const STAGES = ["nouveau", "entretien_1", "entretien_2", "entretien_3", "offre", "embauche", "refuse"].map((id) => ({ id }));
type Opening = { id: string; title: string; criteria: string[]; dept: string };
type Cand = { id: string; full_name: string; email: string | null; source: string | null; score: string | null; stage: string; met: string[] };

const mails = (c: Cand, o: Opening, company: string) => ({
  invite: `Objet : ${o.title} — entretien\n\nBonjour ${c.full_name.split(" ")[0]},\n\nMerci pour votre candidature au poste de ${o.title}. Nous serions ravis d'échanger avec vous : seriez-vous disponible cette semaine pour un entretien de 30 minutes ?\n\nBien cordialement,\nL'équipe ${company}`,
  refus: `Objet : votre candidature — ${o.title}\n\nBonjour ${c.full_name.split(" ")[0]},\n\nMerci pour l'intérêt porté à ${company}. Après étude attentive, nous ne donnerons pas suite à votre candidature pour ce poste. Nous gardons votre profil en tête pour de futures opportunités.\n\nBien cordialement,\nL'équipe ${company}`,
});

export function CandidateBoard({ opening, candidates, canEdit, company }: { opening: Opening; candidates: Cand[]; canEdit: boolean; company: string }) {
  const t = useTranslations("hr.recruitment");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [hire, setHire] = useState<Cand | null>(null);
  const move = (id: string, stage: string) =>
    start(async () => {
      const r = await moveCandidate(id, stage);
      report(r, { undo: r.ok && r.data ? async () => (await moveCandidate(id, r.data!.previous), router.refresh()) : undefined });
      router.refresh();
    });
  const copy = (text: string, title: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    toast({ title, detail: t("copiedDetail"), tone: "info" });
  };
  return (
    <div className="grid gap-2 overflow-x-auto md:grid-cols-7">
      {STAGES.map((s) => (
        <div key={s.id} className="min-w-44 rounded-2xl bg-black/[0.03] p-2">
          <p className="px-1 pb-1 text-xs font-semibold">{t(`stages.${s.id}`)} <span className="text-muted">{candidates.filter((c) => c.stage === s.id).length}</span></p>
          {candidates.filter((c) => c.stage === s.id).map((c) => (
            <article key={c.id} className="card mb-2 p-2.5 text-sm">
              <p className="flex items-center justify-between font-medium">{c.full_name}{c.score && <Badge tone={c.score === "A" ? "ok" : c.score === "B" ? "info" : "muted"}>{c.score}</Badge>}</p>
              <p className="text-[11px] text-muted">{c.source}{c.met.length ? ` · ${t("criteriaMet", { met: c.met.length, total: opening.criteria.length })}` : ""}</p>
              {canEdit && (
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  <select aria-label={t("stage")} className="rounded-lg bg-black/[0.04] px-1" value={c.stage} disabled={pending} onChange={(e) => move(c.id, e.target.value)}>
                    {STAGES.filter((x) => x.id !== "embauche").map((x) => <option key={x.id} value={x.id}>{t(`stages.${x.id}`)}</option>)}
                  </select>
                  {s.id === "nouveau" && <button className="rounded-lg bg-accent/10 px-1.5 text-accent" onClick={() => copy(mails(c, opening, company).invite, t("inviteCopied"))}>{t("invite")}</button>}
                  {!["refuse", "embauche"].includes(s.id) && <button className="rounded-lg px-1.5 ring-1 ring-black/10" onClick={() => copy(mails(c, opening, company).refus, t("rejectCopied"))}>{t("rejectMail")}</button>}
                  {s.id === "offre" && <button className="rounded-lg bg-brand px-1.5 text-ground" onClick={() => setHire(c)}>{t("hire")}</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      ))}
      {hire && <HireModal cand={hire} opening={opening} onClose={() => setHire(null)} />}
    </div>
  );
}

function HireModal({ cand, opening, onClose }: { cand: Cand; opening: Opening; onClose: () => void }) {
  const t = useTranslations("hr.recruitment");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [res, setRes] = useState<string | null>(null);
  return (
    <Modal open onClose={onClose} title={t("hireTitle", { name: cand.full_name })}>
      {res ? (
        <div className="space-y-3 text-sm">
          <p>{t("hireDone")}</p>
          <Link className="font-medium text-accent" href={`/hr/employees/${res}?tab=integration`}>{t("openRecord")}</Link>
        </div>
      ) : (
        <form className="flex flex-col gap-3" action={(fd) => start(async () => { const r = await hireCandidate(cand.id, String(fd.get("key")), String(fd.get("title")), String(fd.get("start")), String(fd.get("contract"))); if (report(r) && r.ok && r.data) { setRes(r.data.id); router.refresh(); } })}>
          <Field label={t("jobTitle")}><Input name="title" defaultValue={opening.title.replace(/\s*\(.*\)$/, "").replace(/\s+—.*$/, "")} required /></Field>
          <Field label={t("jobKey")}><Input name="key" defaultValue={/prépar/i.test(opening.title) ? "preparateur" : "account_manager"} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("contract")}><Select name="contract" defaultValue={/CDD/.test(opening.title) ? "CDD" : "CDI"}><option value="CDI">{t("contracts.CDI")}</option><option value="CDD">{t("contracts.CDD")}</option><option value="alternance">{t("contracts.alternance")}</option><option value="stage">{t("contracts.stage")}</option></Select></Field>
            <Field label={t("startOn")}><Input name="start" type="date" required defaultValue={new Date(nowMs() + 21 * 86400_000).toISOString().slice(0, 10)} /></Field>
          </div>
          <Button variant="accent" disabled={pending}>{t("createRecord")}</Button>
        </form>
      )}
    </Modal>
  );
}

export function AddCandidate({ openings }: { openings: Opening[] }) {
  const t = useTranslations("hr.recruitment");
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState(openings[0]?.id ?? "");
  const [met, setMet] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const o = openings.find((x) => x.id === job);
  const score = useMemo(() => scoreCandidate(o?.criteria ?? [], met), [o, met]);
  return (
    <>
      <Button variant="accent" icon="user-plus" onClick={() => setOpen(true)}>{t("addCandidate")}</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("newApplication")}>
        <form className="flex flex-col gap-4" action={(fd) => start(async () => { if (report(await addCandidate({ job_opening_id: job, full_name: String(fd.get("name")), email: String(fd.get("email") || ""), source: String(fd.get("source") || ""), score, met }))) { setOpen(false); setMet([]); router.refresh(); } })}>
          <Field label={t("opening")}><Select value={job} onChange={(e) => (setJob(e.target.value), setMet([]))}>{openings.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select></Field>
          <Field label={t("fullName")}><Input name="name" required /></Field>
          <Field label={t("email")}><Input name="email" type="email" /></Field>
          <Field label={t("source")}><Input name="source" placeholder={t("sourcePlaceholder")} /></Field>
          <fieldset className="rounded-xl p-3 ring-1 ring-black/10">
            <legend className="px-1 text-[13px] font-medium">{t("criteriaLegend")}</legend>
            {(o?.criteria ?? []).map((c) => (
              <label key={c} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={met.includes(c)} onChange={() => setMet((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))} />{c}</label>
            ))}
            <p className="mt-2 text-sm">{t.rich("scoreLine", { score, b: (c) => <b>{c}</b>, muted: (c) => <span className="text-xs text-muted">{c}</span> })}</p>
          </fieldset>
          <Button variant="accent" disabled={pending}>{t("add")}</Button>
        </form>
      </Drawer>
    </>
  );
}
