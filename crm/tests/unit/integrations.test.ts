import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import { googleConnector, rfc822 } from "@/lib/integrations/google";
import { microsoftConnector } from "@/lib/integrations/microsoft";
import { refreshTokens } from "@/lib/integrations/oauth";
import { backoffMs, isPermanent } from "@/lib/integrations/queue";

const KEY = Buffer.alloc(32, 7).toString("base64");

/** fetch simulé : enregistre les appels et renvoie les réponses prévues dans l'ordre. */
function fakeFetch(responses: { status?: number; body?: unknown }[]) {
  const calls: { url: string; method: string; headers: Record<string, string>; body: unknown }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? "GET", headers: init.headers as Record<string, string>, body: typeof init.body === "string" ? (init.body.startsWith("{") ? JSON.parse(init.body) : init.body) : init.body });
    const r = responses.shift() ?? { status: 200, body: {} };
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}
const tok = async () => "jeton";

describe("chiffrement des jetons", () => {
  it("aller-retour, IV aléatoire, falsification détectée", () => {
    const a = encryptSecret("refresh-123", KEY);
    expect(a).not.toContain("refresh-123");
    expect(encryptSecret("refresh-123", KEY)).not.toBe(a);
    expect(decryptSecret(a, KEY)).toBe("refresh-123");
    const parts = a.split(".");
    parts[3] = Buffer.from("autre").toString("base64url");
    expect(() => decryptSecret(parts.join("."), KEY)).toThrow();
    expect(() => decryptSecret(a, Buffer.alloc(32, 8).toString("base64"))).toThrow();
  });
});

describe("file de synchronisation", () => {
  it("reprise exponentielle plafonnée, erreurs définitives", () => {
    expect([1, 2, 3, 4].map(backoffMs)).toEqual([30_000, 60_000, 120_000, 240_000]);
    expect(backoffMs(30)).toBe(6 * 3600_000);
    expect(isPermanent(403)).toBe(true);
    expect(isPermanent(401)).toBe(false); // jeton expiré : on rafraîchit et on réessaie
    expect(isPermanent(429)).toBe(false);
    expect(isPermanent(503)).toBe(false);
  });
});

describe("Microsoft Graph", () => {
  it("envoi : /me/sendMail avec pièce jointe fileAttachment, HTML, jeton porteur", async () => {
    const { f, calls } = fakeFetch([{ status: 202 }]);
    await microsoftConnector(tok, f).sendMail({ to: ["a@ex.fr"], subject: "Devis", html: "<p>x</p>", attachments: [{ name: "Q.pdf", contentType: "application/pdf", base64: "JVBERi0=" }] });
    expect(calls[0].url).toBe("https://graph.microsoft.com/v1.0/me/sendMail");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].headers.authorization).toBe("Bearer jeton");
    const msg = (calls[0].body as { message: { toRecipients: unknown; attachments: { "@odata.type": string }[] } }).message;
    expect(msg.toRecipients).toEqual([{ emailAddress: { address: "a@ex.fr" } }]);
    expect(msg.attachments[0]["@odata.type"]).toBe("#microsoft.graph.fileAttachment");
  });
  it("rendez-vous : réunion Teams et idempotence (transactionId)", async () => {
    const { f, calls } = fakeFetch([{ body: { id: "ev1", onlineMeeting: { joinUrl: "https://teams/x" } } }]);
    const r = await microsoftConnector(tok, f).pushEvent({ localId: "loc-1", title: "Dégustation", startsAt: "2026-10-20T08:00:00.000Z", endsAt: "2026-10-20T09:00:00.000Z", attendees: ["c@ex.fr"], onlineMeeting: true });
    const b = calls[0].body as Record<string, unknown>;
    expect(b.transactionId).toBe("loc-1");
    expect(b.onlineMeetingProvider).toBe("teamsForBusiness");
    expect(b.start).toEqual({ dateTime: "2026-10-20T08:00:00.000", timeZone: "UTC" });
    expect(r).toEqual({ externalId: "ev1", joinUrl: "https://teams/x" });
  });
  it("delta : suit nextLink puis garde le deltaLink comme curseur", async () => {
    const { f, calls } = fakeFetch([
      { body: { value: [{ id: "1", subject: "A", start: { dateTime: "2026-10-20T08:00:00.0000000" }, end: { dateTime: "2026-10-20T09:00:00.0000000" } }], "@odata.nextLink": "https://graph.microsoft.com/v1.0/next" } },
      { body: { value: [{ id: "2", "@removed": { reason: "deleted" } }], "@odata.deltaLink": "https://graph.microsoft.com/v1.0/delta?token=z" } },
    ]);
    const r = await microsoftConnector(tok, f).calendarDelta();
    expect(calls[1].url).toBe("https://graph.microsoft.com/v1.0/next");
    expect(r.cursor).toBe("https://graph.microsoft.com/v1.0/delta?token=z");
    expect(r.events[0]).toMatchObject({ externalId: "1", startsAt: "2026-10-20T08:00:00Z" });
    expect(r.events[1].removed).toBe(true);
  });
  it("erreur HTTP remontée avec son statut (pour la reprise)", async () => {
    const { f } = fakeFetch([{ status: 429, body: { error: { message: "Too many requests" } } }]);
    await expect(microsoftConnector(tok, f).testConnection()).rejects.toMatchObject({ status: 429 });
  });
});

describe("Google", () => {
  it("RFC 822 : en-têtes encodés, pièce jointe en multipart/mixed", () => {
    const raw = Buffer.from(rfc822({ to: ["a@ex.fr"], subject: "Facture é", html: "<p>ok</p>", attachments: [{ name: "F.pdf", contentType: "application/pdf", base64: "JVBERi0=" }] }), "base64url").toString("utf8");
    expect(raw).toContain("To: a@ex.fr");
    expect(raw).toContain("Subject: =?UTF-8?B?");
    expect(raw).toMatch(/multipart\/mixed; boundary="matocha-/);
    expect(raw).toContain('filename="F.pdf"');
  });
  it("agenda : Meet demandé avec requestId stable et invitations envoyées", async () => {
    const { f, calls } = fakeFetch([{ body: { id: "g1", hangoutLink: "https://meet/x" } }]);
    const r = await googleConnector(tok, f).pushEvent({ localId: "loc-2", title: "Point", startsAt: "2026-10-20T08:00:00Z", endsAt: "2026-10-20T09:00:00Z", attendees: ["c@ex.fr"], onlineMeeting: true });
    expect(calls[0].url).toContain("/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all");
    expect((calls[0].body as { conferenceData: { createRequest: { requestId: string } } }).conferenceData.createRequest.requestId).toBe("loc-2");
    expect(r.joinUrl).toBe("https://meet/x");
  });
  it("courrier : sans push Gmail (Pub/Sub), pas d'abonnement mail ; curseur = historyId", async () => {
    const { f } = fakeFetch([{ body: { historyId: "777" } }]);
    const c = googleConnector(tok, f);
    expect(await c.subscribe("mail", "https://x", "s")).toBeNull();
    expect((await c.mailDelta()).cursor).toBe("777");
  });
});

describe("OAuth", () => {
  it("rafraîchissement : grant refresh_token en x-www-form-urlencoded", async () => {
    process.env.GOOGLE_CLIENT_ID = "cid";
    process.env.GOOGLE_CLIENT_SECRET = "sec";
    const { f, calls } = fakeFetch([{ body: { access_token: "a2", expires_in: 3599 } }]);
    const t = await refreshTokens("google", "r1", f);
    expect(calls[0].url).toBe("https://oauth2.googleapis.com/token");
    const form = new URLSearchParams(String(calls[0].body));
    expect(form.get("grant_type")).toBe("refresh_token");
    expect(form.get("refresh_token")).toBe("r1");
    expect(form.get("client_secret")).toBe("sec");
    expect(t.access_token).toBe("a2");
  });
  it("échec explicite si le fournisseur refuse", async () => {
    const { f } = fakeFetch([{ status: 400, body: { error: "invalid_grant" } }]);
    await expect(refreshTokens("google", "bad", f)).rejects.toThrow(/invalid_grant/);
  });
});
