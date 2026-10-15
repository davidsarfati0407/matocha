import type { Metadata } from "next";
import { Badge, Card, Denied, PageHeader, btn } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { AI_MODEL, aiConfigured } from "@/lib/ai/assistant";
import { requirePerm } from "@/lib/backoffice/context";
import { providerConfig, providerReady, redirectUri, type Provider } from "@/lib/integrations/providers";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Disconnect, JobRetry, QueueRunner, TestButton } from "./client";

export const metadata: Metadata = { title: "Intégrations" };

const B: Record<string, ["ok" | "warn" | "muted" | "info" | "danger", string]> = { connecte: ["ok", "Connecté"], erreur: ["danger", "Erreur"], non_configure: ["warn", "Non configuré"], simule: ["muted", "Mode simulé"], repli: ["info", "Sondage 1 s (repli)"] };
const JOB: Record<string, ["ok" | "warn" | "muted" | "info" | "danger", string]> = { queued: ["info", "En file"], running: ["info", "En cours"], done: ["ok", "Fait"], error: ["warn", "Erreur"], dead: ["danger", "Abandonné"] };
const KIND: Record<string, string> = { "mail.send": "Envoi d'e-mail", "mail.draft": "Brouillon", "calendar.push": "Rendez-vous → agenda", "calendar.delta": "Synchro agenda", "mail.delta": "Synchro boîte de réception", "files.folder": "Dossier partagé", "subscriptions.create": "Abonnements webhooks", "subscriptions.renew": "Renouvellement des abonnements", "connection.test": "Test de connexion" };

/** État réel de chaque intégration : rien n'est présenté comme connecté s'il ne l'est pas. */
export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what="les intégrations" />;
  const sp = await searchParams;
  const supabase = await createClient();
  const [accounts, jobs] = await Promise.all([
    supabase.from("integration_accounts").select("provider, account_email, status, expires_at, last_sync_at, last_error, scopes"),
    supabase.from("sync_jobs").select("id, provider, kind, status, attempts, next_run_at, last_error, created_at, result").order("created_at", { ascending: false }).limit(25),
  ]);
  const acc = new Map((accounts.data ?? []).map((a) => [a.provider, a]));
  const canEdit = ctx.can("organisation", "update");
  const realtime = process.env.NEXT_PUBLIC_REALTIME;
  const others = [
    { nom: "Assistant IA (Claude)", usage: `Questions sur les données, brouillons de réponse · modèle ${AI_MODEL}`, state: aiConfigured() ? "connecte" : "non_configure" },
    { nom: "Temps réel", usage: realtime === "sse" ? "Flux SSE alimenté par Postgres LISTEN/NOTIFY (< 1 s)" : realtime === "off" ? "Sondage toutes les secondes" : "Supabase Realtime (< 1 s)", state: realtime === "off" ? "repli" : "connecte" },
    ...sectorConfig.integrations.filter((i) => !["google_workspace", "microsoft_365"].includes(i.id)).map((i) => ({ nom: i.nom, usage: i.usage, state: i.mode === "simule" ? "simule" : "connecte" })),
    { nom: "Banque (relevés camt.054)", usage: "Import de fichier réel ; connexion bancaire directe non branchée", state: "simule" },
    { nom: "Stockage de fichiers", usage: "Justificatifs déposés ; les dossiers partagés passent par OneDrive / Drive une fois connectés", state: "simule" },
  ];
  return (
    <>
      <PageHeader title="Intégrations" subtitle="Chaque connecteur passe par le même adaptateur : le brancher ne change pas les écrans. Sans compte connecté, tout passe par le connecteur simulé." actions={canEdit ? <><TestButton /><QueueRunner /></> : undefined} />
      {sp.ok && <p className="mb-4 rounded-xl bg-matcha/15 px-4 py-3 text-sm text-brand">Compte {providerConfig(sp.ok as Provider).label} connecté : première synchronisation lancée.</p>}
      {sp.error && <p className="mb-4 rounded-xl bg-[#b3402a]/10 px-4 py-3 text-sm text-[#b3402a]">Connexion impossible : {decodeURIComponent(sp.error)}</p>}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        {(["microsoft", "google"] as Provider[]).map((p) => {
          const cfg = providerConfig(p);
          const a = acc.get(p);
          const state = a?.status === "connected" ? "connecte" : a?.status === "error" ? "erreur" : providerReady(p) ? "simule" : "non_configure";
          return (
            <Card key={p}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{cfg.label}</p>
                  <p className="text-sm text-muted">{p === "microsoft" ? "Outlook (courrier, brouillons), Agenda + réunions Teams, OneDrive · webhooks Graph + requêtes delta" : "Gmail, Google Agenda + Meet (notifications push), Drive · courrier synchronisé par la file (Pub/Sub non requis)"}</p>
                </div>
                <Badge tone={B[state][0]}>{B[state][1]}</Badge>
              </div>
              {a && a.status !== "disconnected" ? (
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Compte</dt><dd>{a.account_email ?? "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Dernière synchro</dt><dd>{a.last_sync_at ? `${formatDate(a.last_sync_at)} ${formatTime(a.last_sync_at)}` : "—"}</dd></div>
                  {a.last_error && <div className="text-[#b3402a]">{a.last_error}</div>}
                </dl>
              ) : state === "non_configure" ? (
                <p className="mt-3 text-sm text-muted">
                  Renseignez {p === "microsoft" ? "MICROSOFT_CLIENT_ID / _SECRET / _TENANT_ID" : "GOOGLE_CLIENT_ID / _SECRET"} et INTEGRATIONS_ENCRYPTION_KEY dans <code>.env.local</code>. URI de redirection à déclarer : <code className="break-all">{redirectUri(p)}</code>
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">Application configurée, aucun compte connecté : le connecteur simulé est utilisé.</p>
              )}
              <p className="mt-2 text-xs text-muted">Périmètres demandés : {cfg.scopes.filter((s) => !["openid", "email", "offline_access"].includes(s)).map((s) => s.replace("https://www.googleapis.com/auth/", "")).join(", ")}</p>
              {canEdit && (
                <div className="mt-3 flex gap-2">
                  {state !== "non_configure" && <a className={btn(state === "connecte" ? "secondary" : "accent")} href={`/api/integrations/${p}/connect`}>{state === "connecte" ? "Reconnecter" : "Connecter"}</a>}
                  {a && a.status !== "disconnected" && <Disconnect provider={p} />}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {others.map((r) => (
          <Card key={r.nom}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.nom}</p>
                <p className="text-sm text-muted">{r.usage}</p>
              </div>
              <Badge tone={B[r.state][0]}>{B[r.state][1]}</Badge>
            </div>
          </Card>
        ))}
      </div>
      <Card title="File de synchronisation" padded={false} action={<span className="text-xs text-muted">reprise automatique : 30 s, 1, 2, 4, 8 min… abandon après 6 essais</span>}>
        <ul className="divide-y divide-black/5 text-sm">
          {(jobs.data ?? []).map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2">
              <span>
                <span className="text-xs text-muted">{formatDate(j.created_at)} {formatTime(j.created_at)}</span> · {KIND[j.kind] ?? j.kind} · <span className="text-muted">{j.provider === "mock" ? "simulé" : j.provider}</span>
                {j.last_error && <span className="block text-xs text-[#b3402a]">{j.last_error} · essai {j.attempts}{j.status === "queued" ? ` · prochain à ${formatTime(j.next_run_at)}` : ""}</span>}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={JOB[j.status][0]}>{JOB[j.status][1]}</Badge>
                {canEdit && ["dead", "error"].includes(j.status) && <JobRetry id={j.id} />}
              </span>
            </li>
          ))}
          {(jobs.data ?? []).length === 0 && <li className="px-5 py-3 text-muted">Aucune tâche pour l'instant.</li>}
        </ul>
      </Card>
    </>
  );
}
