import { expect, test } from "@playwright/test";

/** Runs against `next dev` with the in-memory store and console e-mail (see playwright.config.ts). */
test.describe("waitlist form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#inscription");
    await expect(page.getByRole("textbox", { name: "Adresse e-mail" })).toBeVisible({ timeout: 60_000 });
    /* The submit button is enabled only once the form is hydrated. */
    await expect(page.getByRole("button", { name: "Être prévenu du lancement" })).toBeEnabled({ timeout: 60_000 });
  });

  test("invalid e-mail shows the precise message, without any celebration", async ({ page }) => {
    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill("david@gmail");
    await page.getByRole("button", { name: "Être prévenu du lancement" }).click();
    await expect(page.locator("#inscription").getByRole("alert")).toHaveText("Cette adresse e-mail semble incomplète. Vérifiez le @ et le domaine.");
    await expect(page.locator(".powder-rain")).toHaveCount(0);
  });

  test("consent box is not pre-checked and is required", async ({ page }) => {
    const consent = page.getByRole("checkbox", { name: /J'accepte/ });
    await expect(consent).not.toBeChecked();
    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill("e2e-consent@example.com");
    await page.getByRole("button", { name: "Être prévenu du lancement" }).click();
    await expect(page.locator("#inscription").getByRole("alert")).toContainText("Cochez la case");
  });

  test("success after the real API answer, then double opt-in message", async ({ page }) => {
    let posts = 0;
    page.on("request", (r) => r.url().endsWith("/api/waitlist") && r.method() === "POST" && posts++);
    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(`e2e-${Date.now()}@example.com`);
    await page.getByRole("checkbox", { name: /J'accepte/ }).check();
    const button = page.getByRole("button", { name: "Être prévenu du lancement" });
    /* Double submission: two quick clicks send a single request. */
    await button.click();
    await button.click({ force: true, timeout: 500 }).catch(() => {});
    await expect(page.locator("#inscription").getByRole("status")).toContainText("Vous recevrez un e-mail pour confirmer votre inscription.");
    await expect(page.locator(".powder-rain")).toHaveCount(1);
    expect(posts).toBe(1);
  });

  test("submitting the same address twice does not duplicate (API)", async ({ request }) => {
    const body = { email: "e2e-dup@example.com", interests: ["poudre"], consent: true, consentVersion: "2026-10-06.v1", source: "e2e" };
    const a = await request.post("/api/waitlist", { data: body });
    const b = await request.post("/api/waitlist", { data: body });
    expect(a.status()).toBe(200);
    expect(b.status()).toBe(200);
    expect((await b.json()).status).toBe("pending");
  });
});
