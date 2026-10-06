import { expect, test } from "@playwright/test";

test("every internal link on the main pages answers", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of ["/", "/daily-box", "/preparer", "/recettes", "/notre-produit", "/faq", "/aide", "/legal/mentions-legales"]) {
    await page.goto(path);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    hrefs.forEach((h) => seen.add(h.split("#")[0].split("?")[0] || "/"));
  }
  for (const href of seen) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test("v1 English routes redirect with 301", async ({ request }) => {
  const map: Record<string, string> = {
    "/product": "/daily-box",
    "/why-sticks": "/daily-box",
    "/formats": "/daily-box",
    "/formats/poudre": "/daily-box",
    "/formats/concentre": "/daily-box",
    "/our-matcha": "/notre-produit",
    "/shipping": "/aide#livraison",
    "/legal": "/legal/mentions-legales",
  };
  for (const [from, to] of Object.entries(map)) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(res.headers()["location"]).toBe(to);
  }
});

test("SEO: journal is noindex, FAQ has FAQPage schema, sitemap lists French routes", async ({ request }) => {
  expect(await (await request.get("/journal")).text()).toContain('name="robots" content="noindex');
  expect(await (await request.get("/faq")).text()).toContain('"@type":"FAQPage"');
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/daily-box");
  expect(sitemap).not.toContain("/formats");
  expect(sitemap).not.toContain("/journal");
  expect(sitemap).not.toContain("/product");
});
