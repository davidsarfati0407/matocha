// Map → back-office : erreurs de transition selon le mode de rendu (argument : "simtest" ou rien).
import { chromium } from "@playwright/test";
const q = process.argv[2] === "simtest" ? "?simtest=1&quality=low" : "";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3000/login?next=" + encodeURIComponent("/map/maison_montreuil" + q));
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForFunction(() => window.__map, null, { timeout: 120000 });
await page.waitForTimeout(5000);
await page.evaluate(() => (window.__marker = 1));
const t0 = Date.now();
await page.getByRole("link", { name: "Commandes du jour" }).first().click();
await page.waitForURL(/shop-orders/);
console.log(q || "rendu continu", "· sans rechargement :", await page.evaluate(() => window.__marker === 1), "·", Date.now() - t0, "ms · erreurs :", errs);
await browser.close();
