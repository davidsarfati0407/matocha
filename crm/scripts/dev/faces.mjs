// Aller-retour back-office → map → back-office sans rechargement ; vérifie les erreurs console.
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];

let step = "init";
page.on("pageerror", (e) => errs.push(`[${step}] ${e.message}`));
page.on("console", (m) => m.type() === "error" && errs.push(`[${step}] ${m.text()}`));
await page.goto("http://localhost:3000/login?next=/dashboard");
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForURL(/dashboard/);
await page.waitForLoadState("networkidle");
await page.evaluate(() => { window.__marker = 1; const o = document.startViewTransition?.bind(document); window.__vt = 0; if (o) document.startViewTransition = (...a) => { window.__vt++; return o(...a); }; });
step = "vers-map";
const sim = process.argv[2] === "simtest";
if (sim) await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((x) => x.textContent?.includes("Map vivante")); a.href += "?simtest=1&quality=low"; });
await page.getByRole("link", { name: "Map vivante" }).click();
await page.waitForFunction(() => window.__map, null, { timeout: 120000 });
const kept = await page.evaluate(() => ({ marker: window.__marker, vt: window.__vt }));
await page.waitForTimeout(6000);
step = "vers-bo";
await page.getByRole("link", { name: "Commandes du jour" }).first().click();
await page.waitForURL(/shop-orders/);
const back = await page.evaluate(() => ({ marker: window.__marker, vt: window.__vt }));
console.log("vers la map :", kept, "· retour back-office :", back, "· erreurs :", errs);
await browser.close();
