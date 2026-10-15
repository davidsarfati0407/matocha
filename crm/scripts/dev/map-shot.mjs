// Capture de la map pour contrôle visuel : node scripts/dev/map-shot.mjs <sortie.png> [attente_ms] [role] [chemin]
import { chromium } from "@playwright/test";
const [, , out = "map.png", waitMs = "9000", role = "Direction", path = "/"] = process.argv;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 960 } });
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto("http://localhost:3000/login");
await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
await page.waitForURL("**/map/**", { timeout: 90000 });
if (path !== "/") await page.goto(`http://localhost:3000${path}`);
await page.waitForTimeout(Number(waitMs));
await page.screenshot({ path: out });
console.log(logs.slice(0, 30).join("\n") || "console propre");
await browser.close();
