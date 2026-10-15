/**
 * Chiffrement des jetons OAuth (AES-256-GCM, clé de 32 octets en base64 dans
 * INTEGRATIONS_ENCRYPTION_KEY). Format : v1.<iv>.<tag>.<chiffré> en base64url.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(raw = process.env.INTEGRATIONS_ENCRYPTION_KEY) {
  if (!raw) throw new Error("INTEGRATIONS_ENCRYPTION_KEY manquante (32 octets en base64 : openssl rand -base64 32)");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("INTEGRATIONS_ENCRYPTION_KEY doit faire 32 octets (base64)");
  return k;
}

export function encryptSecret(plain: string, rawKey?: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(rawKey), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptSecret(token: string, rawKey?: string) {
  const [v, iv, tag, ct] = token.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("secret chiffré illisible");
  const d = createDecipheriv("aes-256-gcm", key(rawKey), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}
