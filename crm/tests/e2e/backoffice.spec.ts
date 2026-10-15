/**
 * Parcours clés du back-office (phase 3). Pré-requis : base réinitialisée.
 * Chaque test vérifie aussi l'absence d'erreur console.
 */
import { expect, test, type Page } from "@playwright/test";

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource.*(401|403)/.test(m.text()) && errors.push(m.text()));
  return errors;
}

export async function login(page: Page, role: string, path: string) {
  await page.goto(`/login?next=${encodeURIComponent(path)}`);
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  await page.waitForURL((u) => u.pathname === path.split("?")[0]);
}

test("stock bas → réapprovisionnement en un clic → envoi → réception : lot en quarantaine puis libéré", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "Opérations", "/resources/stock");
  await page.getByRole("link", { name: /Stock bas/ }).click();
  const row = page.getByRole("row", { name: /MT-DB10/ });
  await row.getByRole("button", { name: /Commander 440/ }).click();
  await page.waitForURL(/purchase-orders\?status=draft/);
  await expect(page.getByText(/bon\(s\) de commande préparé/)).toBeVisible();
  const po = page.getByRole("row", { name: /Discovery Box 10 × 2 g × 440/ });
  await po.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(/envoi simulé/)).toBeVisible();
  await page.goto("/resources/purchase-orders");
  await page.getByRole("row", { name: /Discovery Box 10 × 2 g × 440/ }).getByRole("button", { name: "Réceptionner" }).click();
  await expect(page.getByText(/en quarantaine/)).toBeVisible();
  const lot = (await page.getByText(/lot\(s\) L\d{4}-\d{2}[A-Z]/).textContent())!.match(/L\d{4}-\d{2}[A-Z]/)![0];
  await page.goto("/resources/lots");
  await page.getByRole("row", { name: new RegExp(lot) }).click();
  await expect(page.getByText("Quarantaine").first()).toBeVisible();
  await page.getByRole("button", { name: "Libérer le lot" }).click();
  await expect(page.getByText(/Lot libéré/)).toBeVisible();
  await page.goto("/resources/stock?tab=low");
  await expect(page.getByRole("row", { name: /MT-DB10/ })).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/bo-stock-after.png", caret: "initial" });
  expect(errors).toEqual([]);
});
