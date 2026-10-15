import { chromium } from "@playwright/test";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:3000/login");
await page.getByRole("button", { name: /^Direction/ }).click();
await page.waitForURL("**/map/**", { timeout: 90000 });
await page.waitForTimeout(8000);
console.log(await page.evaluate(() => {
  const m = window.__map; const i = m.renderer.info;
  let meshes = 0; m.scene.traverse((o) => { if (o.isMesh && o.visible) meshes++; });
  return JSON.stringify({ calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, meshes, pick: m.world.pickMeshes.length });
}));
await browser.close();
