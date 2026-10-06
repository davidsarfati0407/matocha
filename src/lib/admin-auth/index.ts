import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEmailSender, layout, siteUrl } from "@/lib/email";
import { hmacHex, nowIso, randomToken, safeEqual, sha256 } from "@/lib/ops/crypto";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";

/**
 * Back-office authentication: e-mail magic link restricted to ADMIN_EMAILS.
 *
 * - The link token is HMAC-signed (ADMIN_SESSION_SECRET), valid 15 minutes,
 *   and single-use (its hash is recorded and burnt on first use).
 * - The session cookie is a random value + HMAC, httpOnly, Secure in
 *   production, SameSite=Lax. Only its SHA-256 is stored.
 */

export const SESSION_COOKIE = "matocha_admin";
const LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionRow = Row & {
  kind: "link" | "session";
  email: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) return null;
  return s;
}

export function isAdminAuthConfigured() {
  return !!getStore() && !!secret() && adminEmails().length > 0;
}

const sign = (value: string) => `${value}.${hmacHex(secret()!, value)}`;

function unsign(signed: string | undefined | null): string | null {
  const s = secret();
  if (!s || !signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  return safeEqual(signed.slice(i + 1), hmacHex(s, value)) ? value : null;
}

/** Always resolves the same way, whether or not the address is allowed. */
export async function requestMagicLink(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const store = getStore();
  const sender = getEmailSender();
  if (!store || !secret() || !sender || !adminEmails().includes(email)) return;

  const nonce = randomToken(24);
  const expires = Date.now() + LINK_TTL_MS;
  const token = sign(`${Buffer.from(email).toString("base64url")}:${expires}:${nonce}`);
  await store.insert<SessionRow>("admin_sessions", {
    id: randomUUID(),
    kind: "link",
    email,
    token_hash: sha256(nonce),
    expires_at: new Date(expires).toISOString(),
    used_at: null,
    created_at: nowIso(),
  });
  const url = `${siteUrl()}/admin/connexion/verifier?token=${encodeURIComponent(token)}`;
  await sender.send({
    to: email,
    subject: "Votre lien de connexion au back-office Matocha",
    text: `Pour vous connecter au back-office Matocha, ouvrez ce lien (valable 15 minutes, une seule fois) :\n${url}\n\nSi vous n'avez rien demandé, ignorez ce message.`,
    html: layout(
      "Connexion au back-office",
      ["Ce lien est valable 15 minutes et ne fonctionne qu'une fois.", "Si vous n'avez rien demandé, ignorez ce message."],
      { href: url, label: "Me connecter" },
    ),
  });
}

async function startSession(email: string) {
  const store = getStore()!;
  const value = randomToken(32);
  await store.insert<SessionRow>("admin_sessions", {
    id: randomUUID(),
    kind: "session",
    email,
    token_hash: sha256(value),
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    used_at: null,
    created_at: nowIso(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Verifies a magic link and opens a session. Returns false if invalid. */
export async function consumeMagicLink(token: string | null) {
  const store = getStore();
  const payload = unsign(token);
  if (!store || !payload) return false;
  const [emailB64, expires, nonce] = payload.split(":");
  if (!emailB64 || !expires || !nonce || Number(expires) < Date.now()) return false;
  const email = Buffer.from(emailB64, "base64url").toString();
  if (!adminEmails().includes(email)) return false;
  const row = await store.findOne<SessionRow>("admin_sessions", { token_hash: sha256(nonce), kind: "link" });
  if (!row || row.used_at) return false;
  await store.update<SessionRow>("admin_sessions", row.id, { used_at: nowIso() });
  await startSession(email);
  return true;
}

/** Development/test only: opens a session for the first allowed e-mail. */
export async function devLogin() {
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_DEV_LOGIN !== "true") return false;
  const [email] = adminEmails();
  if (!email || !getStore() || !secret()) return false;
  await startSession(email);
  return true;
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = getStore();
  if (!store || !secret()) return null;
  const jar = await cookies();
  const value = unsign(jar.get(SESSION_COOKIE)?.value);
  if (!value) return null;
  const row = await store.findOne<SessionRow>("admin_sessions", { token_hash: sha256(value), kind: "session" });
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) return null;
  if (!adminEmails().includes(row.email)) return null;
  return { email: row.email };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/connexion");
  return session;
}

export async function logout() {
  const store = getStore();
  const jar = await cookies();
  const value = unsign(jar.get(SESSION_COOKIE)?.value);
  if (store && value) {
    const row = await store.findOne<SessionRow>("admin_sessions", { token_hash: sha256(value), kind: "session" });
    if (row) await store.update<SessionRow>("admin_sessions", row.id, { used_at: nowIso() });
  }
  jar.delete(SESSION_COOKIE);
}
