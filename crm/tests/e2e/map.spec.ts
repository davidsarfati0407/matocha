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

test("map → base : occuper une salle crée une vraie réservation, visible dans le planning du back-office", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("/");
  await page.keyboard.type("Salle Uji");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: /Fiche : Salle Uji/ });
  await expect(panel).toBeVisible();
  const busy = panel.getByRole("button", { name: "Libérer maintenant" });
  if (await busy.isVisible()) {
    await busy.click();
    await expect(panel.getByRole("button", { name: "Occuper 30 min" })).toBeVisible({ timeout: 15_000 });
  }
  await panel.getByRole("button", { name: "Occuper 30 min" }).click();
  await expect(panel.getByText("Occupée", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.goto("/ops/planning?kind=salle");
  await expect(page.getByText("Salle occupée (depuis la map)").first()).toBeVisible();
});

test("glisser-déposer : un véhicule déposé sur une personne de la map lui est affecté en base", async ({ page }) => {
  await openMap(page);
  await page.keyboard.press("/");
  await page.keyboard.type("Vélo-cargo");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("complementary", { name: /Fiche : Vélo-cargo/ });
  await expect(panel).toBeVisible();
  // En simtest la simulation n'avance qu'au rendu : quelques images pour placer les personnes
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => (window as unknown as { __render: () => void }).__render());
    await page.waitForTimeout(400);
  }
  // Position à l'écran d'une personne visible (projection de sa position 3D)
  const target = await page.evaluate(() => {
    type P = { kind: string; entityType: string; entityId: string; label: string; object: unknown };
    const m = (window as unknown as { __map: { world: { pickables: Map<string, P> }; objectPosition: (id: string) => { clone: () => { project: (c: unknown) => { x: number; y: number; z: number } } } | null; camera: unknown; pickAt: (v: unknown) => P | null } }).__map;
    const canvas = document.querySelector("canvas")!.getBoundingClientRect();
    for (const [id, p] of m.world.pickables) {
      if (p.kind !== "person" || !(p.object as { visible: boolean }).visible) continue;
      const pos = m.objectPosition(id);
      if (!pos) continue;
      const v = pos.clone().project(m.camera);
      if (v.z > 1 || Math.abs(v.x) > 0.9 || Math.abs(v.y) > 0.9) continue;
      // on ne garde qu'une personne réellement visible (non masquée) à ce point
      if (m.pickAt({ x: v.x, y: v.y })?.entityId !== p.entityId) continue;
      const x = canvas.left + ((v.x + 1) / 2) * canvas.width;
      const y = canvas.top + ((1 - v.y) / 2) * canvas.height;
      return { x, y, id: p.entityId, label: p.label };
    }
    return null;
  });
  expect(target).not.toBeNull();
  const dt = await page.evaluateHandle(() => new DataTransfer());
  await panel.getByText("⠿ Glisser").dispatchEvent("dragstart", { dataTransfer: dt });
  await page.locator("main").dispatchEvent("dragover", { dataTransfer: dt, clientX: target!.x, clientY: target!.y });
  await page.locator("main").dispatchEvent("drop", { dataTransfer: dt, clientX: target!.x, clientY: target!.y });
  await expect(page.getByText("Affectation enregistrée").first()).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByLabel("Affecter à")).toHaveValue(target!.id, { timeout: 15_000 });
  test.info().annotations.push({ type: "déposé sur", description: target!.label });
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
