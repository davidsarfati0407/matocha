// Joue le scénario en simulation accélérée (rendu à la demande) et capture des images.
// node scripts/dev/simtest.mjs <dossier> [durée_s]
import { chromium } from "@playwright/test";
const [, , dir, total = "40"] = process.argv;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 880 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:3000/login?next=" + encodeURIComponent("/map/maison_montreuil?simtest=1"));
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForURL("**/map/**", { timeout: 90000 });
await page.waitForFunction(() => window.__map && window.__render, null, { timeout: 120000 });
const t0 = Date.now();
let k = 0;
while (Date.now() - t0 < Number(total) * 1000) {
  await page.waitForTimeout(5000);
  const state = await page.evaluate(() => {
    const m = window.__map;
    const v = [...m.sim.vehicles.values()].filter((x) => x.id.startsWith("truck")).map((x) => `${x.id.split(":")[1]}@${x.pos.map(Math.round)}`);
    const a = [...m.sim.agents.values()].filter((x) => x.scripted).map((x) => `${x.emp.firstName}@${x.pos.map(Math.round)}`);
    return `sim=${Math.round(m.sim.time)}s camions=[${v}] scripts=[${a}]`;
  });
  console.log(Math.round((Date.now() - t0) / 1000) + "s", state);
  if (++k % 2 === 0) {
    await page.evaluate(() => window.__render());
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${dir}/sim-${k}.png` });
  }
}
console.log("erreurs:", errors.slice(0, 5));
await browser.close();
