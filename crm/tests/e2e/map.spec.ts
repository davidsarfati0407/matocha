/**
 * Parcours de la Map vivante. Sans GPU, le rendu est logiciel et très lent :
 * on utilise ?simtest=1 (simulation à pas fixe, rendu à la demande) et
 * ?quality=low. Pré-requis : base réinitialisée (pnpm devstack:reset ou db:reset).
 */
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const MAP = "/map/maison_montreuil";
const Q = "simtest=1&quality=low";

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

async function openMap(page: Page, role = "Direction", path = `${MAP}?${Q}`) {
  await page.goto(`/login?next=${encodeURIComponent(path)}`);
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  await page.waitForURL(/\/map\//);
  await page.waitForFunction(() => (window as unknown as { __map?: unknown }).__map, null, { timeout: 120_000 });
  await expect(page.getByText("Commandes du jour")).toBeVisible();
}

test("la map se charge avec ses KPI, son tableau et sans erreur console", async ({ page }) => {
  const errors = watchErrors(page);
  await openMap(page);
  await expect(page.getByRole("tab", { name: /Préparation/ })).toBeVisible();
  await expect(page.getByText(/Suivi commande pro/)).toBeVisible();
  await page.evaluate(() => (window as unknown as { __render: () => void }).__render());
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/map-overview.png" });
  expect(errors).toEqual([]);
});

test("recherche « / » → vol vers la personne et fiche avec salaire révélable (direction)", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("/");
  await page.keyboard.type("Aïcha");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: "Fiche : Aïcha Koné" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Préparatrice de commandes")).toBeVisible();
  await panel.getByRole("button", { name: /Révéler/ }).click();
  await expect(panel.getByTitle("Révélé (journalisé)")).toContainText("€");
  await page.getByRole("button", { name: "Fiche complète" }).first().click();
  await expect(page.getByRole("dialog", { name: /Fiche complète/ })).toBeVisible();
  await expect(page.getByText("Pointage de la semaine")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("un collaborateur ne voit pas la ligne salaire", async ({ page }) => {
  await openMap(page, "Collaborateur");
  await page.keyboard.press("/");
  await page.keyboard.type("Karim");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: /Fiche : Karim/ });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Salaire brut annuel")).toHaveCount(0);
});

test("lien profond : back-office → « Voir sur la map » sélectionne l'objet", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("/");
  await page.keyboard.type("CP-24-0607");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: /Fiche : .*Café Hinoki/ });
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: /Back-office/ }).click();
  await expect(page).toHaveURL(/\/ops\/work-orders\//);
  await expect(page.getByRole("heading", { name: "CP-24-0607" })).toBeVisible();
  const href = await page.getByRole("link", { name: "Voir sur la map" }).getAttribute("href");
  await page.goto(`${href}&${Q}`);
  await expect(page.getByRole("complementary", { name: /Fiche : .*Café Hinoki/ })).toBeVisible({ timeout: 120_000 });
});

test("une modification faite hors de la map (étape d'une commande) s'y voit en quelques secondes", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("/");
  await page.keyboard.type("CP-24-0609");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: /Fiche : .*Atelier Sève/ });
  await expect(panel).toBeVisible();
  // Le « back-office » : l'API Supabase avec le compte opérations (mêmes règles et droits)
  const api = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  await api.auth.signInWithPassword({ email: "operations@matocha.demo", password: "matocha-demo" });
  const { data: zone } = await api.from("zones").select("id").eq("key", "quarantaine").single();
  const t0 = Date.now();
  const { error } = await api.from("work_orders").update({ stage: "controle", zone_id: zone!.id }).eq("number", "CP-24-0609");
  expect(error).toBeNull();
  await expect(page.getByRole("complementary", { name: /Fiche : .*Atelier Sève/ }).getByText("commande pro · Contrôle")).toBeVisible({ timeout: 15_000 });
  console.log(`Délai back-office → map : ${Date.now() - t0} ms (mode sondage 1 s, rendu logiciel)`);
});

test("visite guidée (T) puis arrêt (Échap)", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("t");
  await expect(page.getByText("Visite guidée", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Visite guidée", { exact: true })).toHaveCount(0);
});

test("éditeur de plan : ajouter un objet puis publier une nouvelle version (admin)", async ({ page }) => {
  await openMap(page, "Administrateur");
  await page.getByRole("button", { name: "Modifier le plan" }).click();
  const editor = page.getByRole("complementary", { name: "Éditeur de plan" });
  await expect(editor).toBeVisible();
  await editor.getByRole("button", { name: "Plante", exact: true }).click();
  await expect(editor.getByText(/ed_plant_/)).toBeVisible();
  await editor.getByRole("button", { name: "+15°" }).click();
  await editor.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText(/Plan publié \(version \d+\)/)).toBeVisible();
});
