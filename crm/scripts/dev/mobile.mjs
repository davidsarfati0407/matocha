import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3000/login?next=/dashboard");
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
for (const p of ["/dashboard", "/ops/work-orders", "/crm/clients", "/crm/quotes/new", "/finance/invoices", "/hr/leaves", "/resources/stock", "/comms/inbox", "/settings/roles", "/ops/planning"]) {
  await page.goto("http://localhost:3000" + p);
  await page.waitForLoadState("networkidle");
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(p, w > 392 ? `DÉBORDE ${w}px` : "ok");
  if (p === "/dashboard" || p === "/finance/invoices") await page.screenshot({ path: process.argv[2] + p.replaceAll("/", "_") + ".png" });
}
console.log("erreurs", errs);
await browser.close();
