import { expect, test } from "@playwright/test";

/** §14.6 — Slow 3G: the hero stays readable and clickable before the scenes arrive. */
test("hero is readable and clickable on slow 3G", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
  });
  const start = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible({ timeout: 15_000 });
  const textMs = Date.now() - start;
  const cta = page.getByRole("link", { name: "Être prévenu du lancement" }).first();
  await expect(cta).toBeInViewport();
  /* The 600 ms entrance moves the title by design: measure once it has settled. */
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const box = await h1.boundingBox();
  await page.waitForLoadState("load", { timeout: 60_000 });
  const after = await h1.boundingBox();
  expect(Math.abs((after?.y ?? 0) - (box?.y ?? 0)), "the title does not move when media arrive").toBeLessThan(2);
  await cta.click();
  await expect(page).toHaveURL(/#inscription/);
  test.info().annotations.push({ type: "slow-3g-title-visible-ms", description: String(textMs) });
  await ctx.close();
});
