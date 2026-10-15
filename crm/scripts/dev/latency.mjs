// Latence écriture en base → événement reçu dans le navigateur (flux /api/realtime).
// node scripts/dev/latency.mjs [n]
import { chromium } from "@playwright/test";
import pg from "pg";
const N = Number(process.argv[2] ?? 10);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/login?next=/dashboard");
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
await page.evaluate(() => new Promise((ok) => {
  window.__got = [];
  const es = new EventSource("/api/realtime");
  es.addEventListener("ready", () => ok(null));
  es.addEventListener("activity", (m) => window.__got.push({ t: Date.now(), d: JSON.parse(m.data) }));
}));
const { rows: [emp] } = await db.query("select id, org_id from employees limit 1");
const lat = [];
for (let i = 0; i < N; i++) {
  const t0 = Date.now();
  await db.query("insert into badge_events (org_id, employee_id, kind, reader, source) values ($1, $2, 'pause_start', 'test-latence', 'manuel') ", [emp.org_id, emp.id]);
  await db.query("delete from badge_events where reader = 'test-latence'");
  const got = await page.waitForFunction((k) => window.__got.length > k && window.__got[k].t, i, { timeout: 5000 }).then((h) => h.jsonValue()).catch(() => null);
  lat.push(got ? got - t0 : null);
}
lat.sort((a, b) => a - b);
console.log("latences (ms) :", lat.join(", "), "· médiane", lat[Math.floor(N / 2)], "· max", lat.at(-1));
await browser.close();
await db.end();
