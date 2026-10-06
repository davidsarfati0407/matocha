import "server-only";
import { randomUUID } from "node:crypto";
import { escapeHtml, getEmailSender, layout, siteUrl } from "@/lib/email";
import { nowIso, randomToken, sha256 } from "@/lib/ops/crypto";
import { emitWebhook } from "@/lib/ops/webhooks";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "./status";

/** One product: the only interest recorded is the Matcha Original Daily Box. */
export const INTERESTS = ["original"] as const;
export type Interest = (typeof INTERESTS)[number];

export type LeadRow = Row & {
  email: string;
  interests: string[];
  tags: string[];
  source: string | null;
  consent_version: string;
  consent_text: string;
  status: "pending" | "confirmed" | "unsubscribed";
  ip_hash: string | null;
  confirm_token_hash: string | null;
  unsubscribe_token_hash: string;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  last_email_sent_at: string | null;
};

export const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

export const MESSAGES = {
  invalidEmail: "Cette adresse e-mail semble incomplète. Vérifiez le @ et le domaine.",
  consentRequired:
    "Cochez la case de consentement pour que nous puissions vous écrire.",
  notConfigured: "Les inscriptions ouvrent bientôt.",
  badRequest: "La demande n'a pas pu être lue. Réessayez.",
  serverError: "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant.",
  pending: "C'est noté. Vous recevrez un e-mail pour confirmer votre inscription.",
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email: string) {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function hashIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "";
  if (!ip) return null;
  return sha256(`${ip}${process.env.IP_HASH_SALT ?? ""}`);
}

export type SubscribeResult =
  | { ok: true; status: "pending"; httpStatus: 200 }
  | { ok: false; code: "invalid_email" | "consent_required" | "not_configured" | "bad_request" | "server_error"; httpStatus: number; message: string };

async function sendConfirmation(lead: LeadRow, confirmToken: string, unsubscribeToken: string) {
  const sender = getEmailSender();
  if (!sender) throw new Error("no email sender");
  const base = siteUrl();
  const confirmUrl = `${base}/api/waitlist/confirm?token=${encodeURIComponent(confirmToken)}`;
  const unsubscribeUrl = `${base}/api/waitlist/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  await sender.send({
    to: lead.email,
    subject: "Confirmez votre inscription à Matocha",
    text: [
      "Bonjour,",
      "",
      "Merci pour votre intérêt pour Matocha. Pour être prévenu du lancement, confirmez votre adresse :",
      confirmUrl,
      "",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : rien ne vous sera envoyé.",
      "",
      `Se désinscrire : ${unsubscribeUrl}`,
    ].join("\n"),
    html: layout(
      "Confirmez votre inscription",
      [
        "Merci pour votre intérêt pour Matocha. Pour être prévenu du lancement, confirmez votre adresse.",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : rien ne vous sera envoyé.",
      ],
      { href: confirmUrl, label: "Confirmer mon inscription" },
      `<a href="${escapeHtml(unsubscribeUrl)}" style="color:inherit">Se désinscrire en un clic</a>`,
    ),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

async function trackFormError() {
  const store = getStore();
  if (!store) return;
  const windowMs = 10 * 60 * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const id = `form_errors:${bucket}`;
  const threshold = Number(process.env.FORM_ERROR_SPIKE_THRESHOLD ?? 25);
  try {
    const row = await store.get<Row & { count: number }>("rate_limits", id);
    const count = (row?.count ?? 0) + 1;
    await store.upsert("rate_limits", { id, count, window_start: new Date(bucket * windowMs).toISOString() });
    if (count === threshold) {
      await emitWebhook("form.error_spike", { form: "waitlist", errors: count, window_minutes: 10 });
    }
  } catch {
    /* monitoring must never break the form */
  }
}

export async function subscribe(request: Request): Promise<SubscribeResult> {
  if (!isWaitlistOpen()) {
    return { ok: false, code: "not_configured", httpStatus: 503, message: MESSAGES.notConfigured };
  }
  const store = getStore()!;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
    if (!payload || typeof payload !== "object") throw new Error();
  } catch {
    return { ok: false, code: "bad_request", httpStatus: 400, message: MESSAGES.badRequest };
  }

  const email = normaliseEmail(payload.email);
  if (!isValidEmail(email)) {
    await trackFormError();
    return { ok: false, code: "invalid_email", httpStatus: 422, message: MESSAGES.invalidEmail };
  }
  if (payload.consent !== true) {
    await trackFormError();
    return { ok: false, code: "consent_required", httpStatus: 422, message: MESSAGES.consentRequired };
  }

  const interests = Array.isArray(payload.interests)
    ? [...new Set(payload.interests.filter((i): i is Interest => INTERESTS.includes(i as Interest)))]
    : [];
  const source = typeof payload.source === "string" ? payload.source.slice(0, 60) : null;
  const now = nowIso();

  try {
    const existing = await store.findOne<LeadRow>("leads", { email });

    if (existing) {
      const merged = [...new Set([...existing.interests, ...interests])];
      if (existing.status === "confirmed") {
        if (merged.length !== existing.interests.length) {
          await store.update<LeadRow>("leads", existing.id, { interests: merged });
        }
        return { ok: true, status: "pending", httpStatus: 200 };
      }
      const recentlySent =
        existing.last_email_sent_at &&
        Date.now() - new Date(existing.last_email_sent_at).getTime() < RESEND_COOLDOWN_MS;
      if (recentlySent) {
        await store.update<LeadRow>("leads", existing.id, { interests: merged });
        return { ok: true, status: "pending", httpStatus: 200 };
      }
      const confirmToken = randomToken();
      const unsubscribeToken = randomToken();
      const updated = (await store.update<LeadRow>("leads", existing.id, {
        interests: merged,
        status: "pending",
        consent_version: CONSENT_VERSION,
        consent_text: CONSENT_TEXT,
        confirm_token_hash: sha256(confirmToken),
        unsubscribe_token_hash: sha256(unsubscribeToken),
        unsubscribed_at: null,
        last_email_sent_at: now,
      }))!;
      await sendConfirmation(updated, confirmToken, unsubscribeToken);
      return { ok: true, status: "pending", httpStatus: 200 };
    }

    const confirmToken = randomToken();
    const unsubscribeToken = randomToken();
    const lead = await store.insert<LeadRow>("leads", {
      id: randomUUID(),
      email,
      interests,
      tags: [],
      source,
      consent_version: CONSENT_VERSION,
      consent_text: CONSENT_TEXT,
      status: "pending",
      ip_hash: hashIp(request),
      confirm_token_hash: sha256(confirmToken),
      unsubscribe_token_hash: sha256(unsubscribeToken),
      created_at: now,
      confirmed_at: null,
      unsubscribed_at: null,
      last_email_sent_at: now,
    });
    await sendConfirmation(lead, confirmToken, unsubscribeToken);
    return { ok: true, status: "pending", httpStatus: 200 };
  } catch (error) {
    console.error("[waitlist] subscribe failed", error);
    return { ok: false, code: "server_error", httpStatus: 500, message: MESSAGES.serverError };
  }
}

export async function confirmLead(token: string | null) {
  const store = getStore();
  if (!store || !token) return false;
  const lead = await store.findOne<LeadRow>("leads", { confirm_token_hash: sha256(token) });
  if (!lead || lead.status === "unsubscribed") return false;
  if (lead.status === "confirmed") return true;
  await store.update<LeadRow>("leads", lead.id, {
    status: "confirmed",
    confirmed_at: nowIso(),
    confirm_token_hash: null,
  });
  await emitWebhook("lead.confirmed", {
    lead_id: lead.id,
    interests: lead.interests,
    source: lead.source,
    consent_version: lead.consent_version,
  });
  return true;
}

export async function unsubscribeLead(token: string | null) {
  const store = getStore();
  if (!store || !token) return false;
  const lead = await store.findOne<LeadRow>("leads", { unsubscribe_token_hash: sha256(token) });
  if (!lead) return false;
  if (lead.status !== "unsubscribed") {
    await store.update<LeadRow>("leads", lead.id, {
      status: "unsubscribed",
      unsubscribed_at: nowIso(),
      confirm_token_hash: null,
    });
  }
  return true;
}
