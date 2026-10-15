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

test("devis accepté → commande pro → étapes → heures facturables → facture → paiement lettré (camt.054), sans ressaisie", async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await login(page, "Direction", "/crm/quotes");
  await page.getByRole("row", { name: /Q-2026-0141/ }).click();
  await page.getByRole("button", { name: /Accepté → créer la commande/ }).click();
  await expect(page.getByText(/créée automatiquement/).first()).toBeVisible();
  const woLink = page.getByRole("link", { name: /^Commande CP-24-/ });
  const woNumber = (await woLink.textContent())!.replace("Commande ", "").trim();
  await woLink.click();
  await page.waitForURL(/\/ops\/work-orders\//);
  for (const stage of ["Préparation", "Contrôle", "Expédition", "Livrée"]) {
    await page.getByRole("button", { name: `Passer à « ${stage} »` }).click();
    await expect(page.getByText(`Étape : ${stage}`).first()).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Facturer" })).toBeVisible();
  await page.getByRole("navigation", { name: "Onglets" }).getByRole("link", { name: /^Heures/ }).click();
  await page.getByLabel("Heures").fill("1.5");
  await page.getByLabel("Note").fill("Formation sur site");
  await page.getByText("Facturable au client").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Formation sur site/).first()).toBeVisible();
  await page.getByRole("button", { name: "Facturer" }).click();
  await page.waitForURL(/\/finance\/invoices\//);
  await expect(page.getByText(/Prestations \(1,5 h\)/)).toBeVisible();
  await expect(page.getByRole("link", { name: woNumber })).toBeVisible();
  const invNumber = (await page.locator("h1 .font-mono").textContent())!.trim();
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(/Factur-X \(e-mail simulé\)/)).toBeVisible();
  await page.goto("/finance/payments");
  await page.getByRole("button", { name: "Relevé d'exemple" }).click();
  await expect(page.getByText(/par référence|par montant/).first()).toBeVisible();
  await expect(page.getByText("à affecter")).toBeVisible();
  await page.getByRole("button", { name: /Lettrer \d+ paiement/ }).click();
  await expect(page.getByText(/paiement\(s\) lettré/)).toBeVisible();
  await page.goto("/finance/invoices?status=paid");
  await expect(page.getByRole("row").filter({ hasText: invNumber })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/bo-invoice-paid.png", caret: "initial" });
  expect(errors).toEqual([]);
});
