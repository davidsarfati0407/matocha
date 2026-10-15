// Capture d'une page du back-office : node scripts/dev/bo-shot.mjs <sortie.png> <chemin> [rôle] [hauteur]
import { chromium } from "@playwright/test";
const [, , out, path, role = "Direction", height = "1000"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: Number(height) } });
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`${m.type()}: ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(`http://localhost:3000/login?next=${encodeURIComponent(path)}`);
await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: true });
console.log(logs.slice(0, 15).join("\n") || "console propre");
await browser.close();
