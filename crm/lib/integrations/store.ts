import "server-only";
/**
 * Comptes connectés, jetons chiffrés (rafraîchis automatiquement), choix du connecteur,
 * file de synchronisation (traitement, reprise, abandon). Côté serveur uniquement.
 */
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "./crypto";
import { googleConnector } from "./google";
import { microsoftConnector } from "./microsoft";
import { mockConnector } from "./mock";
import { refreshTokens, type TokenSet } from "./oauth";
import { appUrl, type Provider } from "./providers";
import { HttpError, MAX_ATTEMPTS, backoffMs, isPermanent } from "./queue";
import type { Connector, MailInput } from "./types";

type Admin = ReturnType<typeof createAdminClient>;
export interface Account {
  id: string;
  org_id: string;
  provider: Provider;
  account_email: string | null;
  status: string;
  expires_at: string | null;
  cursors: Record<string, string>;
  connected_by: string | null;
}

export async function saveTokens(db: Admin, orgId: string, provider: Provider, t: TokenSet, email: string | null, userId: string | null) {
  const { data: acc, error } = await db
    .from("integration_accounts")
    .upsert({ org_id: orgId, provider, account_email: email, status: "connected", scopes: (t.scope ?? "").split(" ").filter(Boolean), expires_at: new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString(), last_error: null, connected_by: userId, cursors: {}, updated_at: new Date().toISOString() }, { onConflict: "org_id,provider" })
    .select("id")
    .single();
  if (error) throw error;
  const { error: e2 } = await db.from("integration_secrets").upsert({ account_id: acc.id, access_token_enc: encryptSecret(t.access_token), refresh_token_enc: t.refresh_token ? encryptSecret(t.refresh_token) : null, updated_at: new Date().toISOString() });
  if (e2) throw e2;
  return acc.id as string;
}

/** Jeton d'accès valide (rafraîchi si nécessaire) ; marque le compte en erreur si le rafraîchissement échoue. */
async function accessToken(db: Admin, acc: Account): Promise<string> {
  const { data: sec } = await db.from("integration_secrets").select("access_token_enc, refresh_token_enc").eq("account_id", acc.id).single();
  if (!sec) throw new Error("secret introuvable");
  if (acc.expires_at && Date.parse(acc.expires_at) > Date.now() + 120_000) return decryptSecret(sec.access_token_enc);
  if (!sec.refresh_token_enc) throw new Error("jeton expiré et pas de jeton de rafraîchissement : reconnectez le compte");
  try {
    const t = await refreshTokens(acc.provider, decryptSecret(sec.refresh_token_enc));
    await db.from("integration_secrets").update({ access_token_enc: encryptSecret(t.access_token), ...(t.refresh_token ? { refresh_token_enc: encryptSecret(t.refresh_token) } : {}), updated_at: new Date().toISOString() }).eq("account_id", acc.id);
    acc.expires_at = new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString();
    await db.from("integration_accounts").update({ expires_at: acc.expires_at, status: "connected", last_error: null }).eq("id", acc.id);
    return t.access_token;
  } catch (e) {
    await db.from("integration_accounts").update({ status: "error", last_error: (e as Error).message.slice(0, 500) }).eq("id", acc.id);
    throw e;
  }
}

export function connectorFor(db: Admin, acc: Account | null): Connector {
  if (!acc || acc.status === "disconnected") return mockConnector();
  const token = () => accessToken(db, acc);
  return acc.provider === "microsoft" ? microsoftConnector(token) : googleConnector(token);
}

/** Compte actif de l'organisation (Microsoft d'abord, puis Google) ou null → connecteur simulé. */
export async function activeAccount(db: Admin, orgId: string, prefer?: Provider): Promise<Account | null> {
  const { data } = await db.from("integration_accounts").select("id, org_id, provider, account_email, status, expires_at, cursors, connected_by").eq("org_id", orgId).neq("status", "disconnected");
  const list = (data ?? []) as Account[];
  return list.find((a) => a.provider === prefer) ?? list.find((a) => a.provider === "microsoft") ?? list[0] ?? null;
}

// ---------------------------------------------------------------- file de synchronisation
export async function enqueue(orgId: string, kind: string, payload: Record<string, unknown>, opts: { userId?: string | null; runNow?: boolean } = {}) {
  const db = createAdminClient();
  const acc = await activeAccount(db, orgId);
  const { data, error } = await db.from("sync_jobs").insert({ org_id: orgId, provider: acc?.provider ?? "mock", kind, payload, created_by: opts.userId ?? null }).select("id").single();
  if (error) throw error;
  if (opts.runNow !== false) await processJobs({ ids: [data.id] });
  const { data: job } = await db.from("sync_jobs").select("id, status, provider, result, last_error").eq("id", data.id).single();
  return job as { id: string; status: string; provider: string; result: Record<string, unknown> | null; last_error: string | null };
}

type Job = { id: string; org_id: string; provider: string; kind: string; payload: Record<string, unknown>; attempts: number };

/** Traite les tâches dues (ou celles listées). Renvoie le bilan. */
export async function processJobs(opts: { ids?: string[]; limit?: number } = {}) {
  const db = createAdminClient();
  let q = db.from("sync_jobs").select("id, org_id, provider, kind, payload, attempts").eq("status", "queued").lte("next_run_at", new Date().toISOString()).order("next_run_at").limit(opts.limit ?? 20);
  if (opts.ids) q = q.in("id", opts.ids);
  const { data: due } = await q;
  const report = { done: 0, retry: 0, dead: 0 };
  for (const job of (due ?? []) as Job[]) {
    // Réservation atomique : une seule exécution par tâche, même avec plusieurs workers
    const { data: claimed } = await db.from("sync_jobs").update({ status: "running", attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq("id", job.id).eq("status", "queued").select("id");
    if (!claimed?.length) continue;
    try {
      const acc = job.provider === "mock" ? null : await activeAccount(db, job.org_id, job.provider as Provider);
      const result = await runJob(db, job, acc);
      await db.from("sync_jobs").update({ status: "done", result: { ...result, simulated: !acc }, last_error: null, updated_at: new Date().toISOString() }).eq("id", job.id);
      if (acc) await db.from("integration_accounts").update({ last_sync_at: new Date().toISOString() }).eq("id", acc.id);
      report.done++;
    } catch (e) {
      const status = e instanceof HttpError ? e.status : undefined;
      const attempts = job.attempts + 1;
      const dead = isPermanent(status) || attempts >= MAX_ATTEMPTS;
      await db.from("sync_jobs").update({ status: dead ? "dead" : "queued", next_run_at: new Date(Date.now() + backoffMs(attempts)).toISOString(), last_error: `${status ?? ""} ${(e as Error).message}`.trim().slice(0, 500), updated_at: new Date().toISOString() }).eq("id", job.id);
      if (dead) report.dead++;
      else report.retry++;
    }
  }
  return report;
}

const notifyUrl = (p: Provider) => `${appUrl()}/api/integrations/${p}/notify`;

async function runJob(db: Admin, job: Job, acc: Account | null): Promise<Record<string, unknown>> {
  const c = connectorFor(db, acc);
  const p = job.payload;
  switch (job.kind) {
    case "connection.test":
      return await c.testConnection();
    case "mail.send":
      return await c.sendMail({ to: p.to as string[], subject: String(p.subject), html: String(p.html), attachments: p.attachments as MailInput["attachments"] });
    case "mail.draft":
      return await c.createDraft({ to: p.to as string[], subject: String(p.subject), html: String(p.html) });
    case "calendar.push": {
      const { data: ev } = await db.from("calendar_events").select("id, title, starts_at, ends_at, attendees, online_meeting, client_id, clients:client_id(email)").eq("id", String(p.event_id)).single();
      if (!ev) throw new HttpError("rendez-vous introuvable", 404);
      const { data: emps } = await db.from("employees").select("email").in("id", ev.attendees ?? []);
      const clientEmail = (ev.clients as unknown as { email: string | null } | null)?.email;
      const r = await c.pushEvent({ localId: ev.id, title: ev.title, startsAt: ev.starts_at, endsAt: ev.ends_at, onlineMeeting: ev.online_meeting, attendees: [...(emps ?? []).map((e) => e.email).filter(Boolean), clientEmail].filter(Boolean) as string[] });
      await db.from("calendar_events").update({ external_source: acc?.provider ?? "simule", external_id: r.externalId, join_url: r.joinUrl ?? null }).eq("id", ev.id);
      return r;
    }
    case "calendar.delta": {
      if (!acc) return { events: 0 };
      const { events, cursor } = await c.calendarDelta(acc.cursors.calendar);
      const { data: owner } = await db.from("profiles").select("employee_id").eq("user_id", acc.connected_by ?? "").maybeSingle();
      let n = 0;
      for (const e of events) {
        if (e.removed) {
          await db.from("calendar_events").delete().eq("org_id", acc.org_id).eq("external_source", acc.provider).eq("external_id", e.externalId);
          continue;
        }
        if (!e.startsAt || !e.endsAt || e.endsAt <= e.startsAt) continue;
        const { data: ex } = await db.from("calendar_events").select("id").eq("org_id", acc.org_id).eq("external_id", e.externalId).maybeSingle();
        if (ex) await db.from("calendar_events").update({ title: e.title, starts_at: e.startsAt, ends_at: e.endsAt }).eq("id", ex.id);
        else await db.from("calendar_events").insert({ org_id: acc.org_id, owner_id: owner?.employee_id ?? null, type: "reunion", title: e.title || "(sans titre)", starts_at: e.startsAt, ends_at: e.endsAt, external_source: acc.provider, external_id: e.externalId });
        n++;
      }
      await db.from("integration_accounts").update({ cursors: { ...acc.cursors, calendar: cursor } }).eq("id", acc.id);
      return { events: n };
    }
    case "mail.delta": {
      if (!acc) return { messages: 0 };
      const { messages, cursor } = await c.mailDelta(acc.cursors.mail);
      let n = 0;
      for (const m of messages) {
        const { data: dup } = await db.from("messages").select("id").eq("external_id", m.externalId).maybeSingle();
        if (dup) continue;
        const { data: client } = await db.from("clients").select("id").eq("org_id", acc.org_id).ilike("email", m.from).maybeSingle();
        let { data: thread } = await db.from("threads").select("id").eq("org_id", acc.org_id).eq("subject", m.subject.replace(/^(re|tr|fw|fwd)\s*:\s*/i, "")).maybeSingle();
        if (!thread) ({ data: thread } = await db.from("threads").insert({ org_id: acc.org_id, channel: "email", subject: m.subject || "(sans objet)", client_id: client?.id ?? null, status: "awaiting_reply", last_message_at: m.receivedAt }).select("id").single());
        await db.from("messages").insert({ org_id: acc.org_id, thread_id: thread!.id, direction: "in", from_name: m.fromName, body: m.preview, sent_at: m.receivedAt, external_id: m.externalId });
        await db.from("threads").update({ status: "awaiting_reply", last_message_at: m.receivedAt }).eq("id", thread!.id);
        n++;
      }
      await db.from("integration_accounts").update({ cursors: { ...acc.cursors, mail: cursor } }).eq("id", acc.id);
      return { messages: n };
    }
    case "files.folder": {
      const r = await c.ensureFolder(p.path as string[]);
      await db.from("documents").insert({ org_id: job.org_id, entity_type: String(p.entity_type), entity_id: String(p.entity_id), name: `Dossier partagé · ${(p.path as string[]).join(" / ")}`, kind: "dossier", external_url: r.url });
      return r;
    }
    case "subscriptions.create": {
      if (!acc) return { subscriptions: 0 };
      let n = 0;
      for (const kind of ["calendar", "mail"] as const) {
        const state = randomBytes(18).toString("base64url");
        const s = await c.subscribe(kind, notifyUrl(acc.provider), state);
        if (s) {
          await db.from("integration_subscriptions").insert({ account_id: acc.id, resource: s.resource, external_id: s.externalId, client_state: state, expires_at: s.expiresAt });
          n++;
        }
      }
      return { subscriptions: n };
    }
    case "subscriptions.renew": {
      const soon = new Date(Date.now() + 24 * 3600_000).toISOString();
      const { data: subs } = await db.from("integration_subscriptions").select("id, account_id, resource, external_id, client_state").lt("expires_at", soon);
      let n = 0;
      for (const s of subs ?? []) {
        const { data: a } = await db.from("integration_accounts").select("id, org_id, provider, account_email, status, expires_at, cursors, connected_by").eq("id", s.account_id).single();
        if (!a || a.status === "disconnected") continue;
        const r = await connectorFor(db, a as Account).renew(s.external_id, s.resource, notifyUrl(a.provider as Provider), s.client_state);
        await db.from("integration_subscriptions").update({ external_id: r.externalId, expires_at: r.expiresAt }).eq("id", s.id);
        n++;
      }
      return { renewed: n };
    }
    default:
      throw new HttpError(`type de tâche inconnu : ${job.kind}`, 400);
  }
}
