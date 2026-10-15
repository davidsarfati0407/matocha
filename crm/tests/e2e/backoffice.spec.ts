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

test("congé validé en un clic (solde décompté), puis annulé depuis la notification (solde recrédité)", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "RH", "/hr/leaves");
  const card = page.locator("section.card").filter({ hasText: "Romain Faure" });
  await expect(card).toContainText("solde 19,0 j");
  await card.getByRole("button", { name: "Valider" }).click();
  await expect(page.getByText(/Congé validé/)).toBeVisible();
  await page.goto("/hr/employees");
  await expect(page.getByRole("row", { name: /Romain Faure/ })).toContainText("14,0 j");
  await page.goto("/hr/leaves");
  await expect(page.locator("section.card").filter({ hasText: "Romain Faure" })).toHaveCount(0);
  // Annulation : la décision repasse en attente et le trigger recrédite le solde
  await page.locator("section.card").filter({ hasText: "Lucas Fontaine" }).getByRole("button", { name: "Valider" }).click();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByText(/Décision annulée/)).toBeVisible();
  await page.goto("/hr/employees");
  await expect(page.getByRole("row", { name: /Lucas Fontaine/ })).toContainText("7,0 j");
  expect(errors).toEqual([]);
});

test("⌘K : recherche d'un compte puis action « nouveau devis » pré-rempli", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "Commercial", "/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(page.getByLabel("Commande ou recherche")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  await page.getByLabel("Commande ou recherche").fill("Hinoki");
  await page.getByRole("option", { name: /Nouveau devis pour Café Hinoki/ }).click();
  await page.waitForURL(/\/crm\/quotes\/new\?client=/);
  await expect(page.getByText(/Pré-rempli avec la dernière commande acceptée \(Q-2026-0140/)).toBeVisible();
  await expect(page.getByLabel("Quantité").first()).toHaveValue("4");
  expect(errors).toEqual([]);
});

test("assistant IA : honnête sans clé (aucune réponse simulée), et droits filtrés côté serveur", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "Collaborateur", "/ai");
  await expect(page.getByText(/Assistant non configuré|Connecté ·/).first()).toBeVisible();
  await page.goto("/hr/salaries");
  await expect(page.getByText(/ne permet pas|pas accès|Accès/).first()).toBeVisible();
  await page.goto("/finance/invoices");
  await expect(page.getByRole("row", { name: /F-2026-/ })).toHaveCount(0);
  await page.goto("/finance/expenses");
  await expect(page.getByRole("heading", { name: "Notes de frais" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("intégrations : un envoi passe par la file (connecteur simulé, affiché comme tel), test de connexion", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "Direction", "/comms/inbox");
  await page.getByRole("link", { name: /Yoga Shala Marais/ }).click();
  await page.getByRole("button", { name: "Proposer un brouillon" }).click();
  await expect(page.getByText(/Modèle \(IA non configurée\)|Rédigé par l'IA/)).toBeVisible();
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(/Réponse envoyée à .* \(mode simulé\)/)).toBeVisible();
  await page.goto("/settings/integrations");
  await expect(page.getByText("Envoi d'e-mail").first()).toBeVisible();
  await expect(page.getByText("Microsoft 365").first()).toBeVisible();
  await expect(page.getByText(/Non configuré|Mode simulé/).first()).toBeVisible();
  await page.getByRole("button", { name: "Tester la connexion" }).click();
  await expect(page.getByText(/Test réussi \(mode simulé/)).toBeVisible();
  expect(errors).toEqual([]);
});
