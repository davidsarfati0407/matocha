import { expect, test, type Page } from "@playwright/test";

/** Échoue si la console du navigateur affiche une erreur. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function loginAs(page: Page, roleLabel: string) {
  await page.goto("/login?next=%2Ftech");
  await page.getByRole("button", { name: new RegExp(`^${roleLabel}`) }).click();
  await page.waitForURL("**/tech");
}

test("une page privée redirige vers la connexion", async ({ page }) => {
  await page.goto("/tech");
  await expect(page).toHaveURL(/\/login\?next=%2Ftech/);
});

test("direction : KPI, présence, salaires révélables", async ({ page }) => {
  const errors = watchConsole(page);
  await loginAs(page, "Direction");
  await expect(page.getByRole("heading", { name: "Page technique — phase 1" })).toBeVisible();
  await expect(page.getByText("Commandes du jour")).toBeVisible();
  await expect(page.getByText("Manon Girard")).toBeVisible();
  await page.getByRole("button", { name: /Révéler/ }).first().click();
  await expect(page.getByTitle("Révélé (journalisé)").first()).toContainText("€");
  await page.waitForLoadState("networkidle"); // hydratation terminée avant la capture
  await page.screenshot({ path: "test-results/phase1-direction.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("collaborateur : salaires masqués côté serveur", async ({ page }) => {
  const errors = watchConsole(page);
  await loginAs(page, "Collaborateur");
  await expect(page.getByText("Ligne masquée côté serveur")).toBeVisible();
  await expect(page.getByRole("button", { name: /Révéler/ })).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toMatch(/gross_annual/);
  await page.waitForLoadState("networkidle"); // hydratation terminée avant la capture
  await page.screenshot({ path: "test-results/phase1-collaborateur.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("changement de langue FR → EN", async ({ page }) => {
  await loginAs(page, "RH");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Technical page — phase 1" })).toBeVisible();
  await page.getByRole("button", { name: "fr", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Page technique — phase 1" })).toBeVisible();
});

test("page de connexion", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/login");
  await expect(page.getByText("Comptes de démonstration")).toBeVisible();
  await page.waitForLoadState("networkidle"); // hydratation terminée avant la capture
  await page.screenshot({ path: "test-results/phase1-login.png" });
  expect(errors).toEqual([]);
});
