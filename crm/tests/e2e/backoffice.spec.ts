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
  await expect(page.getByText(/Facture envoyée à .*\(mode simulé/)).toBeVisible();
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
  // un clic avant l'hydratation du fil est perdu : on réessaie jusqu'à voir le brouillon
  await expect(async () => {
    await page.getByRole("button", { name: "Proposer un brouillon" }).click();
    await expect(page.getByText(/Modèle \(IA non configurée\)|Rédigé par l'IA/)).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 60_000 });
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

/** Code TOTP (RFC 6238, SHA-1, 6 chiffres, 30 s) à partir d'une clé base32. */
async function totp(secret: string, at = Date.now()) {
  const { createHmac } = await import("node:crypto");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

test("double authentification : activation par QR/clé, code exigé à la connexion, puis désactivation", async ({ page, browser }) => {
  test.setTimeout(240_000);
  // État propre : aucun facteur TOTP résiduel sur le compte de test (API d'administration Supabase)
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321", process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: users } = await admin.auth.admin.listUsers();
  const u = users.users.find((x) => x.email === "lecture@matocha.demo")!;
  const { data: fs } = await admin.auth.admin.mfa.listFactors({ userId: u.id });
  for (const f of fs?.factors ?? []) expect((await admin.auth.admin.mfa.deleteFactor({ userId: u.id, id: f.id })).error).toBeNull();
  const errors = watchErrors(page);
  await login(page, "Lecture seule", "/settings/security");
  await page.getByRole("button", { name: "Activer" }).click();
  const secret = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("Code de vérification").fill(await totp(secret));
  await page.getByRole("button", { name: "Vérifier et activer" }).click();
  await expect(page.getByText("Double authentification activée")).toBeVisible();

  // Nouvelle session : le mot de passe ne suffit plus
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto("/login?next=/dashboard");
  await p2.getByRole("button", { name: /^Lecture seule/ }).click();
  await p2.waitForURL(/\/login\/mfa/);
  const api = await p2.request.get("/api/realtime");
  expect(api.status()).toBe(401); // les API aussi exigent le code
  // Nouveau créneau de 30 s pour éviter de rejouer le code déjà utilisé
  await p2.waitForTimeout(30_000 - (Date.now() % 30_000) + 500);
  await p2.getByLabel("Code").fill(await totp(secret));
  await p2.getByRole("button", { name: "Vérifier" }).click();
  await p2.waitForURL(/\/dashboard/);
  await ctx2.close();

  page.on("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Désactiver" }).click();
  await expect(page.getByText("Double authentification désactivée")).toBeVisible();
  expect(errors).toEqual([]);
});

test("langue : bascule FR → EN (navigation, page, titre, html lang) puis retour FR", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, "Direction", "/finance/invoices");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.getByRole("group", { name: "Langue" }).getByRole("button", { name: "en" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Invoices", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: /^Today/ }).first()).toBeVisible();
  await expect(page).toHaveTitle(/Invoices/);
  await page.goto("/ops/planning");
  await expect(page.getByRole("region", { name: /Resource schedule/ })).toBeVisible();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "fr" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("region", { name: /Planning des ressources/ })).toBeVisible();
  expect(errors).toEqual([]);
});
