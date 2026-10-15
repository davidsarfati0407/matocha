import { getTranslations } from "next-intl/server";
import { Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ExportPicker } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.privacy");
  return { title: t("metaTitle") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("settings.privacy");
  const { allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const [emps, reveals, profiles] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name").order("last_name"),
    supabase.from("audit_log").select("id, row_id, actor, at").eq("action", "reveal").order("at", { ascending: false }).limit(50),
    supabase.from("profiles").select("user_id, full_name"),
  ]);
  const who = new Map((profiles.data ?? []).map((p) => [p.user_id, p.full_name]));
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("access")}>
          <p className="mb-3 text-sm text-muted">{t("accessHint")}</p>
          <ExportPicker people={(emps.data ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))} />
        </Card>
        <Card title={t("registry")}>
          {/* Contenu du registre : données de l'entreprise (non traduites) */}
          <ul className="space-y-2 text-sm">
            <li><b>Badgeuse</b> · présence et temps de travail · conservation 1 an · base : obligation légale</li>
            <li><b>Paie</b> · salaires, accès RH et direction seulement, consultation journalisée · 5 ans</li>
            <li><b>Clients pros</b> · contacts et historique · 3 ans après le dernier contact</li>
            <li><b>Candidats</b> · CV et évaluations · 2 ans, puis suppression</li>
            <li><b>Assistant IA</b> · questions traitées par Anthropic (hébergement selon contrat), aucune donnée envoyée sans clé configurée</li>
          </ul>
          <p className="mt-3 text-xs text-muted">Hébergement cible : Supabase région UE (Francfort ou Zurich). Données de cette démo : fictives.</p>
        </Card>
        <Card title={t("reveals")} className="lg:col-span-2">
          {(reveals.data ?? []).length === 0 ? <p className="text-sm text-muted">{t("noReveals")}</p> : (
            <ul className="text-sm">{(reveals.data ?? []).map((r) => <li key={r.id} className="py-1"><span className="text-muted">{formatDate(r.at)} {formatTime(r.at)}</span> · {t("revealed", { who: who.get(r.actor ?? "") ?? "?" })}</li>)}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
