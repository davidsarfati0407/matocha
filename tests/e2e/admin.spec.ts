import { expect, test } from "@playwright/test";

/** /admin with the development login (impossible in production). */
for (const width of [360, 390, 768, 1440]) {
  test(`admin @${width}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/admin/dev-login", { timeout: 60_000 });
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: `docs/captures/apres/admin-${width}.jpg`, fullPage: true, type: "jpeg", quality: 55 });
    await page.goto("/admin/mode");
    await page.screenshot({ path: `docs/captures/apres/admin-mode-${width}.jpg`, fullPage: true, type: "jpeg", quality: 55 });
    await ctx.close();
  });
}

test("admin refuses anonymous visitors", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin");
  await expect(page).toHaveURL(/connexion/);
  await ctx.close();
});
