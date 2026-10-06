import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/waitlist/route";
import { GET as confirm } from "@/app/api/waitlist/confirm/route";
import { POST as unsubscribe } from "@/app/api/waitlist/unsubscribe/route";
import { consoleOutbox } from "@/lib/email";
import { getStore } from "@/lib/store";
import type { LeadRow } from "@/lib/waitlist/service";
import { CONSENT_VERSION } from "@/lib/waitlist/status";
import { setupEnv } from "./helpers";

const submit = (body: unknown, ip = "203.0.113.7") =>
  POST(
    new Request("https://matocha.test/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

const valid = { email: "Lea@Example.fr ", interests: ["original", "poudre", "hack"], consent: true, consentVersion: CONSENT_VERSION, source: "home" };

beforeEach(() => setupEnv());

describe("POST /api/waitlist", () => {
  it("stores a pending lead and sends one confirmation e-mail", async () => {
    const res = await submit(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: "pending" });
    const [lead] = await getStore()!.list<LeadRow>("leads");
    expect(lead.email).toBe("lea@example.fr");
    expect(lead.interests).toEqual(["original"]);
    expect(lead.status).toBe("pending");
    expect(lead.consent_version).toBe(CONSENT_VERSION);
    expect(lead.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(lead)).not.toContain("203.0.113.7");
    expect(consoleOutbox()).toHaveLength(1);
    expect(consoleOutbox()[0].headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("rejects an invalid e-mail with the French message", async () => {
    const res = await submit({ ...valid, email: "lea@example" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("invalid_email");
    expect(body.message).toBe("Cette adresse e-mail semble incomplète. Vérifiez le @ et le domaine.");
    expect(await getStore()!.list("leads")).toHaveLength(0);
  });

  it("requires explicit consent", async () => {
    const res = await submit({ ...valid, consent: false });
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("consent_required");
  });

  it("answers 503 and stores nothing when e-mail is not configured", async () => {
    setupEnv({ MATOCHA_EMAIL: undefined });
    const res = await submit(valid);
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("not_configured");
    expect(await getStore()!.list("leads")).toHaveLength(0);
  });

  it("answers 503 when storage is not configured", async () => {
    setupEnv({ MATOCHA_STORE: undefined });
    const res = await submit(valid);
    expect(res.status).toBe(503);
  });

  it("handles double submission without duplicates or a second e-mail", async () => {
    await submit(valid);
    const again = await submit({ ...valid, interests: ["original"] });
    expect(again.status).toBe(200);
    const leads = await getStore()!.list<LeadRow>("leads");
    expect(leads).toHaveLength(1);
    expect(leads[0].interests).toEqual(["original"]);
    expect(consoleOutbox()).toHaveLength(1);
  });

  it("confirms with the e-mailed link and unsubscribes in one click", async () => {
    await submit(valid);
    const text = consoleOutbox()[0].text;
    const confirmUrl = text.match(/https:\/\/\S+\/api\/waitlist\/confirm\?token=\S+/)![0];
    const unsubUrl = text.match(/https:\/\/\S+\/api\/waitlist\/unsubscribe\?token=\S+/)![0];

    const res = await confirm(new Request(confirmUrl));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/inscription/confirmee");
    expect((await getStore()!.list<LeadRow>("leads"))[0].status).toBe("confirmed");

    const bad = await confirm(new Request("https://matocha.test/api/waitlist/confirm?token=nope"));
    expect(bad.headers.get("location")).toContain("/inscription/erreur");

    const out = await unsubscribe(new Request(unsubUrl, { method: "POST" }));
    expect(out.status).toBe(200);
    expect((await getStore()!.list<LeadRow>("leads"))[0].status).toBe("unsubscribed");
  });
});
