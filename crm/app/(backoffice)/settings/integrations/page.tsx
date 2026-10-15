import { getTranslations } from "next-intl/server";
import { Badge, Card, Denied, PageHeader, btn } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { AI_MODEL, aiConfigured } from "@/lib/ai/assistant";
import { requirePerm } from "@/lib/backoffice/context";
import { providerConfig, providerReady, redirectUri, type Provider } from "@/lib/integrations/providers";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Disconnect, JobRetry, QueueRunner, TestButton } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.integrations");
  return { title: t("metaTitle") };
}

/** Tonalité des badges ; libellés dans settings.integrations.state / .job. */
const B: Record<string, "ok" | "warn" | "muted" | "info" | "danger"> = { connecte: "ok", erreur: "danger", non_configure: "warn", simule: "muted", repli: "info" };
const JOB: Record<string, "ok" | "warn" | "muted" | "info" | "danger"> = { queued: "info", running: "info", done: "ok", error: "warn", dead: "danger" };

/** État réel de chaque intégration : rien n'est présenté comme connecté s'il ne l'est pas. */
export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const t = await getTranslations("settings.integrations");
  const { ctx, allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const sp = await searchParams;
  const supabase = await createClient();
  const [accounts, jobs] = await Promise.all([
    supabase.from("integration_accounts").select("provider, account_email, status, expires_at, last_sync_at, last_error, scopes"),
    supabase.from("sync_jobs").select("id, provider, kind, status, attempts, next_run_at, last_error, created_at, result").order("created_at", { ascending: false }).limit(25),
  ]);
  const acc = new Map((accounts.data ?? []).map((a) => [a.provider, a]));
  const canEdit = ctx.can("organisation", "update");
  const realtime = process.env.NEXT_PUBLIC_REALTIME;
  const kind = (k: string) => (t.has(`kind.${k.replace(/\./g, "_")}`) ? t(`kind.${k.replace(/\./g, "_")}`) : k);
  const others = [
    { nom: t("ai"), usage: t("aiUsage", { model: AI_MODEL }), state: aiConfigured() ? "connecte" : "non_configure" },
    { nom: t("realtime"), usage: realtime === "sse" ? t("realtimeSse") : realtime === "off" ? t("realtimeOff") : t("realtimeSupabase"), state: realtime === "off" ? "repli" : "connecte" },
    ...sectorConfig.integrations.filter((i) => !["google_workspace", "microsoft_365"].includes(i.id)).map((i) => ({ nom: i.nom, usage: i.usage, state: i.mode === "simule" ? "simule" : "connecte" })),
    { nom: t("bank"), usage: t("bankUsage"), state: "simule" },
    { nom: t("storage"), usage: t("storageUsage"), state: "simule" },
  ];
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} actions={canEdit ? <><TestButton /><QueueRunner /></> : undefined} />
      {sp.ok && <p className="mb-4 rounded-xl bg-matcha/15 px-4 py-3 text-sm text-brand">{t("connectedOk", { provider: providerConfig(sp.ok as Provider).label })}</p>}
      {sp.error && <p className="mb-4 rounded-xl bg-[#b3402a]/10 px-4 py-3 text-sm text-[#b3402a]">{t("connectError", { error: decodeURIComponent(sp.error) })}</p>}
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
                  <p className="text-sm text-muted">{p === "microsoft" ? t("microsoftUsage") : t("googleUsage")}</p>
                </div>
                <Badge tone={B[state]}>{t(`state.${state}`)}</Badge>
              </div>
              {a && a.status !== "disconnected" ? (
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">{t("account")}</dt><dd>{a.account_email ?? "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">{t("lastSync")}</dt><dd>{a.last_sync_at ? `${formatDate(a.last_sync_at)} ${formatTime(a.last_sync_at)}` : "—"}</dd></div>
                  {a.last_error && <div className="text-[#b3402a]">{a.last_error}</div>}
                </dl>
              ) : state === "non_configure" ? (
                <p className="mt-3 text-sm text-muted">
                  {t.rich("notConfigured", { vars: p === "microsoft" ? "MICROSOFT_CLIENT_ID / _SECRET / _TENANT_ID" : "GOOGLE_CLIENT_ID / _SECRET", code: (c) => <code>{c}</code>, uri: () => <code className="break-all">{redirectUri(p)}</code> })}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">{t("noAccount")}</p>
              )}
              <p className="mt-2 text-xs text-muted">{t("scopes", { scopes: cfg.scopes.filter((s) => !["openid", "email", "offline_access"].includes(s)).map((s) => s.replace("https://www.googleapis.com/auth/", "")).join(", ") })}</p>
              {canEdit && (
                <div className="mt-3 flex gap-2">
                  {state !== "non_configure" && <a className={btn(state === "connecte" ? "secondary" : "accent")} href={`/api/integrations/${p}/connect`}>{state === "connecte" ? t("reconnect") : t("connect")}</a>}
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
              <Badge tone={B[r.state]}>{t(`state.${r.state}`)}</Badge>
            </div>
          </Card>
        ))}
      </div>
      <Card title={t("queue")} padded={false} action={<span className="text-xs text-muted">{t("queueHint")}</span>}>
        <ul className="divide-y divide-black/5 text-sm">
          {(jobs.data ?? []).map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2">
              <span>
                <span className="text-xs text-muted">{formatDate(j.created_at)} {formatTime(j.created_at)}</span> · {kind(j.kind)} · <span className="text-muted">{j.provider === "mock" ? t("simulated") : j.provider}</span>
                {j.last_error && <span className="block text-xs text-[#b3402a]">{j.last_error} · {t("attempt", { n: j.attempts })}{j.status === "queued" ? ` · ${t("nextAt", { time: formatTime(j.next_run_at) })}` : ""}</span>}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={JOB[j.status]}>{t(`job.${j.status}`)}</Badge>
                {canEdit && ["dead", "error"].includes(j.status) && <JobRetry id={j.id} />}
              </span>
            </li>
          ))}
          {(jobs.data ?? []).length === 0 && <li className="px-5 py-3 text-muted">{t("noJobs")}</li>}
        </ul>
      </Card>
    </>
  );
}
