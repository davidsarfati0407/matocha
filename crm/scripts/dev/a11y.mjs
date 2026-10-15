// Audit d'accessibilité (axe-core, règles WCAG 2.1 A/AA) des pages principales du back-office.
// node scripts/dev/a11y.mjs [rôle] [--json fichier]
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const role = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "Direction";
const PAGES = ["/login", "/dashboard", "/ops/work-orders", "/ops/work-orders?view=kanban", "/ops/planning", "/ops/time", "/resources/stock", "/resources/lots", "/crm/clients", "/crm/pipeline", "/crm/quotes", "/crm/quotes/new", "/crm/calendar", "/finance/invoices", "/finance/payments", "/finance/dunning", "/finance/treasury", "/hr/employees", "/hr/presence", "/hr/leaves", "/hr/salaries", "/hr/recruitment", "/comms/inbox", "/ai", "/settings", "/settings/roles", "/settings/integrations", "/settings/automations", "/settings/security"];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login");
const loginScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
const report = [];
for (const p of PAGES) {
  let r = loginScan;
  if (p !== "/login") {
    await page.goto("http://localhost:3000" + p);
    await page.waitForLoadState("networkidle");
    r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  }
  const v = r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, targets: x.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
  report.push({ page: p, violations: v });
  console.log(`${v.length ? "✗" : "✓"} ${p}${v.length ? " — " + v.map((x) => `${x.id}(${x.impact}, ${x.n})`).join(", ") : ""}`);
}
const i = process.argv.indexOf("--json");
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(report, null, 2));
await browser.close();
