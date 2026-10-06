import { expect, test } from "@playwright/test";

/** §14.1 — captures at 360/390/768/1440, normal and reduced motion. Each capture is reviewed by hand. */
const PAGES = [
  { name: "home", path: "/" },
  { name: "daily-box", path: "/daily-box" },
  { name: "preparer", path: "/preparer" },
  { name: "faq", path: "/faq" },
  { name: "404", path: "/cette-page-nexiste-pas" },
];
const WIDTHS = [360, 390, 768, 1440];

for (const motion of ["normal", "reduce"] as const) {
  for (const page of PAGES) {
    for (const width of WIDTHS) {
      test(`${page.name} @${width} ${motion}`, async ({ browser }) => {
        const ctx = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
        });
        const p = await ctx.newPage();
        const errors: string[] = [];
        p.on("pageerror", (e) => errors.push(e.message));
        p.on("console", (m) => {
          if (m.type() === "error" && !/404 \(Not Found\)/.test(m.text())) errors.push(m.text());
        });
        await p.goto(page.path, { waitUntil: "networkidle" });
        await expect(p.locator("h1").first()).toBeVisible();
        /* Let scroll-driven scenes lay out across the page. */
        await p.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 30));
          }
          window.scrollTo(0, 0);
        });
        await p.waitForTimeout(300);
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(1);
        await p.screenshot({
          path: `docs/captures/apres/${page.name}-${width}-${motion}.jpg`,
          fullPage: true,
          type: "jpeg",
          quality: 55,
        });
        expect(errors).toEqual([]);
        await ctx.close();
      });
    }
  }
}
