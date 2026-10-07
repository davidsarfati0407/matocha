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

  test("link previews: Open Graph and Twitter tags with the latte card", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain('<meta property="og:title" content="MATOCHA - Matcha. Made simple."/>');
    expect(html).toContain('<meta name="twitter:title" content="MATOCHA - Matcha. Made simple."/>');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(html).toMatch(/<meta property="og:description" content="[^"]{40,}"/);
    const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const tw = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];
    expect(og).toBeTruthy();
    expect(tw).toBeTruthy();
    for (const url of [og!, tw!]) {
      const res = await request.get(new URL(url).pathname + new URL(url).search);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
    }
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
  test("only the v2 renders are shown — no drawn illustration anywhere", async ({ page }) => {
    for (const path of ["/", "/daily-box", "/preparer", "/notre-produit", "/faq", "/page-inexistante"]) {
      await page.goto(path);
      await expect(page.locator("main svg, footer svg, header svg"), path).toHaveCount(0);
      await expect(page.locator("canvas"), path).toHaveCount(0);
      const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src") ?? ""));
      for (const src of srcs) expect(src, path).toMatch(/^\/renders\/v2\/matocha-v2-(hero|marketing|poudre|swirl|latte)-[a-z]+-\d+\.jpg$/);
    }
  });

  test("each scene has its own render; only the canonical pack repeats, in the buy block", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const seen = new Map<string, string>();
    for (const path of ["/", "/daily-box", "/preparer", "/notre-produit", "/faq", "/recettes", "/aide", "/journal", "/page-inexistante"]) {
      await page.goto(path);
      /* Rendered images only (the phone copies of the preparation scenes are display:none here). */
      const ids = await page.locator("main img").evaluateAll((imgs) =>
        imgs.filter((i) => i.getBoundingClientRect().width > 0).map((i) => (i.getAttribute("src") ?? "").match(/(matocha-v2-[a-z]+)-/)?.[1] ?? "?"),
      );
      expect(new Set(ids).size, path).toBe(ids.length);
      for (const id of ids) {
        if (id !== "matocha-v2-marketing") expect(seen.get(id), `${id} on ${path}, already on ${seen.get(id)}`).toBeUndefined();
        seen.set(id, path);
      }
    }
    expect([...seen].filter(([, p]) => p === "/").map(([id]) => id)).toEqual([
      "matocha-v2-hero",
      "matocha-v2-poudre",
      "matocha-v2-swirl",
      "matocha-v2-latte",
    ]);
  });

  test("renders are responsive pictures: AVIF + WebP, never wider than the master, box reserved", async ({ page }) => {
    await page.goto("/");
    const pictures = await page.locator("main picture").evaluateAll((ps) =>
      ps.map((p) => ({
        types: [...p.querySelectorAll("source")].map((s) => s.getAttribute("type")),
        widths: [...p.querySelectorAll("source")].flatMap((s) => (s.getAttribute("srcset") ?? "").split(", ").map((c) => Number(c.split(" ")[1]?.replace("w", "")))),
        img: { w: Number(p.querySelector("img")!.getAttribute("width")), h: Number(p.querySelector("img")!.getAttribute("height")), loading: p.querySelector("img")!.getAttribute("loading") },
      })),
    );
    expect(pictures.length).toBeGreaterThan(0);
    for (const p of pictures) {
      expect(p.types).toContain("image/avif");
      expect(p.types).toContain("image/webp");
      expect(p.img.w).toBeGreaterThan(0);
      expect(p.img.h).toBeGreaterThan(0);
      for (const w of p.widths) expect(w).toBeLessThanOrEqual(1672);
    }
    /* Only the hero loads eagerly. */
    expect(pictures.filter((p) => p.img.loading === "eager")).toHaveLength(1);
  });

  test("every visible render carries the concept mention", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const frames = page.locator("main figure:visible");
    expect(await frames.count()).toBeGreaterThanOrEqual(5);
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

  test("motion: hero entrance once, no zoom, all off in reduced motion", async ({ browser }) => {
    for (const motion of ["no-preference", "reduce"] as const) {
      const ctx = await browser.newContext({ reducedMotion: motion });
      const page = await ctx.newPage();
      await page.goto("/");
      const names = await page.evaluate(() => [...document.querySelectorAll(".cascade")].map((el) => getComputedStyle(el).animationName));
      const durations = await page.evaluate(() => [...document.querySelectorAll(".cascade")].map((el) => parseFloat(getComputedStyle(el).animationDuration)));
      if (motion === "reduce") expect(names.every((n) => n === "none")).toBe(true);
      else {
        expect(names.every((n) => n === "matocha-rise")).toBe(true);
        expect(durations.every((d) => d >= 0.5 && d <= 0.7)).toBe(true);
      }
      /* No looping zoom or filter on any render. */
      const zoomOrFilter = await page.evaluate(() =>
        [...document.querySelectorAll("main img")].filter((i) => {
          const cs = getComputedStyle(i);
          return cs.animationName !== "none" || cs.filter !== "none" || /scale/.test(cs.transform);
        }).length,
      );
      expect(zoomOrFilter).toBe(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Le matcha, en plus simple.");
      await ctx.close();
    }
  });

  test("the Daily Box stays in place while its lines scroll by", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const box = page.locator("#daily-box figure");
    await page.locator("#daily-box").evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
    await page.waitForTimeout(200);
    const before = await box.boundingBox();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(400);
    const after = await box.boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 1))).toBeLessThan(2);
    await expect(page.getByText("Un par jour.")).toBeInViewport();
  });

  test("hero drift is 12 px at most", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    for (const y of [300, 900, 2700]) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(120);
      const py = await page.evaluate(() => parseFloat(document.querySelector<HTMLElement>("[data-depth]")!.style.getPropertyValue("--py") || "0"));
      expect(Math.abs(py)).toBeLessThanOrEqual(12);
    }
  });

  test("preparation: steps activate on scroll, progress fills, scene changes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const step = (i: number) => page.locator(`[data-step="${i}"]`);
    for (const [i, scene] of [[0, "poudre"], [2, "swirl"], [3, "latte"]] as const) {
      await step(i).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el as HTMLElement).offsetHeight / 2 - innerHeight / 2));
      await page.waitForTimeout(500);
      await expect(step(i)).toHaveAttribute("aria-current", "step");
      const shown = page.locator('.prep-scene[aria-hidden="false"] img');
      await expect(shown).toHaveAttribute("src", new RegExp(`matocha-v2-${scene}-`));
      await expect(page.locator(".prep-bar.scale-x-100")).toHaveCount(i + 1);
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
    await page.goto("/faq");
    const summary = page.locator("main summary").first();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("main details").first()).toHaveAttribute("open", "");
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

  test("preparation is a plain flow on phones: no sticky frame, one scene per step", async ({ page }) => {
    await page.goto("/#preparer");
    await expect(page.locator(".prep-scene").first()).toBeHidden();
    const inline = await page.locator("[data-step] img").evaluateAll((imgs) => imgs.map((i) => (i.getAttribute("src") ?? "").match(/matocha-v2-([a-z]+)-/)?.[1]));
    expect(inline).toEqual(["poudre", "swirl", "latte"]);
  });

  test("the waitlist honeypot is out of reach for people", async ({ page }) => {
    await page.goto("/");
    const trap = page.locator("input[name=website]");
    if ((await trap.count()) === 0) return; /* form closed in this environment */
    await expect(trap).toHaveAttribute("tabindex", "-1");
    await expect(trap).not.toBeInViewport();
  });
});
