// Capture avec sélection : node scripts/dev/select-shot.mjs <sortie> <focus> [attente]
import { chromium } from "@playwright/test";
const [, , out, focus, waitMs = "9000", role = "Direction"] = process.argv;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 960 } });
page.on("pageerror", (e) => console.log("PAGEERR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("ERR", m.text()));
await page.goto("http://localhost:3000/login");
await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
await page.waitForURL("**/map/**", { timeout: 90000 });
await page.evaluate(() => sessionStorage.clear());
await page.goto(`http://localhost:3000/map/maison_montreuil?focus=${focus}`);
await page.waitForSelector('aside[aria-label^="Fiche"]', { timeout: 120000 });
await page.waitForTimeout(Number(waitMs));
await page.screenshot({ path: out });
await browser.close();
