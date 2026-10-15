// Évalue une expression dans une page du back-office : node scripts/dev/eval.mjs <chemin> "<expr>" [rôle]
import { chromium } from "@playwright/test";
const [, , path, expr, role = "Direction"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERR", e.message));
await page.goto(`http://localhost:3000/login?next=${encodeURIComponent(path)}`);
await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2500);
console.log(await page.evaluate(expr));
await browser.close();
