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
    for (const path of ["/", "/daily-box"]) {
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
      data: { lines: [{ packKey: "poudre-daily-box", recipeKey: "poudre-original", quantity: 1 }] },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("no link to a social network root", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) expect(href).not.toMatch(/^https?:\/\/(www\.)?(instagram|tiktok|pinterest|facebook|x|twitter)\.com\/?$/);
  });
});

test.describe("produit unique, mode réaliste", () => {
  test("only the photoreal renders are shown — no drawn illustration anywhere", async ({ page }) => {
    for (const path of ["/", "/daily-box", "/preparer", "/notre-produit", "/faq", "/page-inexistante"]) {
      await page.goto(path);
      await expect(page.locator("main svg, footer svg, header svg"), path).toHaveCount(0);
      await expect(page.locator("canvas"), path).toHaveCount(0);
      const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => decodeURIComponent((i as HTMLImageElement).currentSrc)));
      for (const src of srcs) expect(src, path).toMatch(/\/renders\/(layers\/)?matocha-(sticks|latte|box|jet|verre|stick|boite)\.png/);
    }
  });

  test("every visual carries the concept mention", async ({ page }) => {
    await page.goto("/");
    /* Hero composition, Daily Box composition, two photos. */
    const frames = page.locator("main figure, main [role=img]");
    await expect(frames).toHaveCount(4);
    for (const f of await frames.all()) await expect(f.getByText("Visuel de concept")).toHaveCount(1);
  });

  test("one product, one price slot, one CTA — no flavour or format left", async ({ page }) => {
    for (const path of ["/", "/daily-box"]) {
      await page.goto(path);
      await expect(page.locator("#acheter")).toHaveCount(1);
      await expect(page.locator("#acheter")).toContainText("Daily Box");
      await expect(page.locator("#acheter")).toContainText("30 sticks de 2 g");
      await expect(page.locator("#acheter")).toContainText("Prix fixé après validation du fournisseur");
      await expect(page.locator("#acheter a, #acheter button")).toHaveCount(1);
      const text = (await page.locator("body").innerText()).toLowerCase();
      for (const word of ["vanille", "fraise", "concentré", "goût", "parfum", "variante", "découverte", "quotidien", "duo"]) {
        expect(text, `${path}: ${word}`).not.toContain(word);
      }
    }
  });

  test("motion design: staged entrance and floating stick, all off in reduced motion", async ({ browser }) => {
    for (const motion of ["no-preference", "reduce"] as const) {
      const ctx = await browser.newContext({ reducedMotion: motion });
      const page = await ctx.newPage();
      await page.goto("/");
      const names = await page.evaluate(() =>
        [".word > span", ".arrive", ".float", ".pop", ".cascade"].map((sel) => getComputedStyle(document.querySelector(sel)!).animationName),
      );
      if (motion === "reduce") expect(names.every((n) => n === "none")).toBe(true);
      else expect(names).toEqual(["matocha-word", "matocha-arrive", "matocha-float", "matocha-pop", "matocha-rise"]);
      /* The title is readable text, not split letters for screen readers. */
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Le matcha, en plus simple.");
      await ctx.close();
    }
  });

  test("sections reveal on scroll, and nothing stays hidden after a fast jump", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/motion-ok/);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(150);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("[data-reveal]:not(.is-in)")].filter((e) => e.getBoundingClientRect().top < innerHeight).length,
    );
    expect(hidden).toBe(0);
  });

  test("without JavaScript every section is visible", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    const invisible = await page.evaluate(() =>
      [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    );
    expect(invisible).toBe(0);
    await ctx.close();
  });

  test("FAQ opens with the keyboard; /preparer says when a combination is untested", async ({ page }) => {
    await page.goto("/");
    const summary = page.locator("#fin summary").first();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fin details").first()).toHaveAttribute("open", "");
    await page.goto("/preparer");
    await page.getByText("Rien de tout ça").click();
    await expect(page.getByText("La poudre a besoin de mouvement.")).toBeVisible();
    await page.getByText("Un fouet").click();
    await expect(page.getByText("Cette combinaison n'a pas encore été testée.")).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("every touch target is at least 44 px (inline text links excepted)", async ({ page }) => {
    for (const path of ["/", "/daily-box", "/preparer", "/faq", "/aide"]) {
      await page.goto(path);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("a[href], button, input, summary, [role=slider], [role=radio]")]
          .filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden" || el.closest("[hidden]") || el.classList.contains("sr-only")) return false;
            const parent = el.parentElement;
            const inline = el.tagName === "A" && parent && ["P", "SPAN"].includes(parent.tagName) && (parent.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 15;
            const r = el.getBoundingClientRect();
            return !inline && r.width > 0 && (r.height < 44 || r.width < 44);
          })
          .map((el) => `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 30)}`),
      );
      expect(small, path).toEqual([]);
    }
  });

  test("nothing overflows horizontally", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });
});
