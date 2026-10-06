import { expect, test } from "@playwright/test";

test.describe("pré-lancement", () => {
  test("hero title, promise and CTA are in the server HTML (no JS needed)", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("Le matcha, en plus simple.");
    expect(html).toContain("Être prévenu du lancement");
    expect(html).toContain('lang="fr"');
  });

  test("hero stays readable and actionable with JavaScript disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto("/");
    await expect(p.getByRole("heading", { level: 1 })).toHaveText("Le matcha, en plus simple.");
    const cta = p.getByRole("link", { name: "Être prévenu du lancement" }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();
    await ctx.close();
  });

  test("no purchase control exists anywhere in pre-launch", async ({ page }) => {
    for (const path of ["/", "/formats", "/formats/poudre", "/formats/concentre"]) {
      await page.goto(path);
      await expect(page.getByText("Ajouter au panier")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Panier/ })).toHaveCount(0);
      await expect(page.getByText(/39,00|35,10|2[–-]4 jours|franco/i)).toHaveCount(0);
    }
  });

  test("waitlist says it is not open yet instead of faking a confirmation", async ({ page }) => {
    await page.goto("/#inscription");
    await expect(page.getByText("Inscriptions bientôt ouvertes.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Adresse e-mail" })).toHaveCount(0);
  });

  test("checkout API refuses in pre-launch", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      headers: { "Idempotency-Key": "e2e-1" },
      data: { lines: [{ packKey: "poudre-quotidien", recipeKey: "poudre-original", quantity: 1 }] },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("no link to a social network root", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) expect(href).not.toMatch(/^https?:\/\/(www\.)?(instagram|tiktok|pinterest|facebook|x|twitter)\.com\/?$/);
  });
});

test.describe("interactions", () => {
  test("flavour change switches colour, ingredients, status and CTA together", async ({ page }) => {
    await page.goto("/#gout");
    const group = page.getByRole("radiogroup", { name: "Choisir un goût" });
    await group.getByRole("radio", { name: "Fraise" }).click();
    await expect(page.locator("#gout")).toContainText("Piste en test");
    await expect(page.locator("#gout").getByRole("link", { name: "Je veux goûter celui-ci" })).toHaveAttribute("href", /interet=fraise/);
    const accent = await page.evaluate(() => document.documentElement.style.getPropertyValue("--accent"));
    expect(accent).toContain("--rhubarbe");
    await group.getByRole("radio", { name: "Original" }).click();
    await expect(page.locator("#gout")).toContainText("Matcha seul");
  });

  test("the box opens with the exact number of doses of the selected pack", async ({ page }) => {
    await page.goto("/#packs");
    await page.getByRole("button", { name: "Voir la boîte" }).first().click();
    await expect(page.getByText("8 doses dans cette boîte")).toBeVisible();
    const toggle = page.getByRole("button", { name: /la boîte$/ }).filter({ hasText: /Ouvrir|Refermer/ });
    /* Choosing a pack replays the opening… */
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    /* …and the button closes and reopens it. */
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("ritual comparator handle works with the keyboard", async ({ page }) => {
    await page.goto("/#rituel");
    const handle = page.getByRole("slider", { name: "Comparer le rituel et le stick" });
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "55");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "5");
  });

  test("FAQ opens with the keyboard and the dose calculator updates", async ({ page }) => {
    await page.goto("/");
    const summary = page.locator("#fin summary").first();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fin details").first()).toHaveAttribute("open", "");
    const range = page.getByRole("slider", { name: /Matchas par semaine/ });
    await range.fill("12");
    await expect(page.getByText("Pack conseillé").locator("..")).toContainText("Duo");
  });

  test("the gesture shows powder needing a tool, and /preparer says when a combination is untested", async ({ page }) => {
    await page.goto("/preparer");
    await page.getByText("Rien de tout ça").click();
    await expect(page.getByText("La poudre a besoin de mouvement.")).toBeVisible();
    await page.getByText("Un fouet").click();
    await expect(page.getByText("Cette combinaison n'a pas encore été testée.")).toBeVisible();
  });
});
