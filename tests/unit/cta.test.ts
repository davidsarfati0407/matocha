import { beforeEach, describe, expect, it } from "vitest";
import { setupEnv } from "./helpers";
import { getStore } from "@/lib/store";
import { getSiteMode } from "@/lib/mode";
import { baseCatalog, type Company, type Pack, type Proof, type Recipe } from "@/content/catalog";
import { buyBlockers, missingMandatoryInfo, resolveCta } from "@/lib/commerce/cta";

const ok = <T,>(value: T): Proof<T> => ({ value, status: "confirmed", source: "test" });

/** A pack + recipe + company where every condition for "buy" holds. */
function purchasable() {
  const base = baseCatalog.recipes.find((r) => r.key === "poudre-original")!;
  const recipe: Recipe = {
    ...structuredClone(base),
    status: "validated",
    denomination: ok("Thé vert matcha en poudre"),
    ingredients: ok(["Thé vert matcha"]),
    allergens: ok([]),
    nutrition: ok({ "Énergie": "x kJ" }),
    preparation: ok([{ method: "whisk", liquidMl: 80, hot: true, iced: false }]),
    storage: ok("À l'abri de l'humidité"),
    origin: ok("Japon"),
  };
  const pack: Pack = {
    ...structuredClone(baseCatalog.packs.find((p) => p.key === "poudre-quotidien")!),
    commercialStatus: "available",
    price: ok(24),
    netQuantity: ok("30 × 2 g"),
  };
  const company: Pick<Company, "responsibleOperator"> = { responsibleOperator: ok("Matocha SAS") };
  return { recipe, pack, company };
}

describe("resolveCta — buy requires every condition", () => {
  it("returns buy when everything is confirmed and the mode is sale", () => {
    const { recipe, pack, company } = purchasable();
    expect(resolveCta("sale", pack, recipe, company)).toEqual({ kind: "buy", label: "Ajouter au panier" });
    expect(buyBlockers("sale", pack, recipe, company)).toEqual([]);
  });

  it("blocks in prelaunch even when everything else is ready", () => {
    const { recipe, pack, company } = purchasable();
    expect(resolveCta("prelaunch", pack, recipe, company)).toEqual({ kind: "interest", label: "Être prévenu du lancement" });
    expect(buyBlockers("prelaunch", pack, recipe, company)).toEqual(["mode_not_sale"]);
  });

  it.each(["concept", "waitlist", "preorder", "sold_out"] as const)("blocks when the pack is %s", (status) => {
    const { recipe, pack, company } = purchasable();
    pack.commercialStatus = status;
    expect(resolveCta("sale", pack, recipe, company).kind).toBe("interest");
    expect(buyBlockers("sale", pack, recipe, company)).toContain("pack_not_available");
  });

  it("returns none for a retired pack", () => {
    const { recipe, pack, company } = purchasable();
    pack.commercialStatus = "retired";
    expect(resolveCta("sale", pack, recipe, company)).toEqual({ kind: "none" });
  });

  it.each([
    ["to_confirm with a value", { value: 24, status: "to_confirm" } as Proof<number>],
    ["unknown", { value: null, status: "unknown" } as Proof<number>],
    ["confirmed but null", { value: null, status: "confirmed" } as Proof<number>],
    ["confirmed at zero", { value: 0, status: "confirmed" } as Proof<number>],
  ])("blocks when the price is %s", (_, price) => {
    const { recipe, pack, company } = purchasable();
    pack.price = price;
    expect(resolveCta("sale", pack, recipe, company).kind).not.toBe("buy");
    expect(buyBlockers("sale", pack, recipe, company)).toContain("price_not_confirmed");
  });

  it.each(["in_development", "test_track"] as const)("blocks when the recipe is %s", (status) => {
    const { recipe, pack, company } = purchasable();
    recipe.status = status;
    expect(resolveCta("sale", pack, recipe, company).kind).toBe("interest");
  });

  it("offers the tasting interest CTA for a test-track flavour", () => {
    const { recipe, pack, company } = purchasable();
    recipe.status = "test_track";
    expect(resolveCta("sale", pack, recipe, company)).toEqual({ kind: "interest", label: "Je veux goûter celui-ci" });
  });

  it("blocks a flavour that is not in the pack", () => {
    const { recipe, pack, company } = purchasable();
    recipe.id = "fraise";
    expect(buyBlockers("sale", pack, recipe, company)).toContain("recipe_not_in_pack");
  });

  it("blocks a recipe from the other family", () => {
    const { recipe, pack, company } = purchasable();
    recipe.familyId = "concentre";
    expect(buyBlockers("sale", pack, recipe, company)).toContain("recipe_not_in_pack");
  });

  it.each([
    "denomination",
    "ingredients",
    "allergens",
    "nutrition",
    "preparation",
    "storage",
  ] as const)("blocks when mandatory info %s is not confirmed", (field) => {
    const { recipe, pack, company } = purchasable();
    (recipe as Record<string, unknown>)[field] = { value: null, status: "to_confirm" };
    expect(resolveCta("sale", pack, recipe, company).kind).not.toBe("buy");
    expect(missingMandatoryInfo(pack, recipe, company)).toContain(field);
  });

  it("blocks when the net quantity is not confirmed", () => {
    const { recipe, pack, company } = purchasable();
    pack.netQuantity = { value: null, status: "to_confirm" };
    expect(missingMandatoryInfo(pack, recipe, company)).toContain("netQuantity");
  });

  it("blocks when the responsible operator is missing or unconfirmed", () => {
    const { recipe, pack } = purchasable();
    expect(resolveCta("sale", pack, recipe).kind).not.toBe("buy");
    expect(resolveCta("sale", pack, recipe, { responsibleOperator: { value: "X", status: "to_confirm" } }).kind).not.toBe("buy");
  });

  it("requires a confirmed origin once an origin is claimed", () => {
    const { recipe, pack, company } = purchasable();
    recipe.origin = { value: "Japon", status: "to_confirm" };
    expect(missingMandatoryInfo(pack, recipe, company)).toContain("origin");
    recipe.origin = { value: null, status: "unknown" };
    expect(missingMandatoryInfo(pack, recipe, company)).not.toContain("origin");
  });

  it("never allows buying anything in the shipped catalogue, in any mode", () => {
    for (const mode of ["prelaunch", "sale"] as const)
      for (const pack of baseCatalog.packs)
        for (const recipe of baseCatalog.recipes)
          expect(resolveCta(mode, pack, recipe, baseCatalog.company).kind).not.toBe("buy");
  });
});

describe("getSiteMode — server-side lock", () => {
  beforeEach(() => setupEnv());

  const setSale = () =>
    getStore()!.upsert("settings", { id: "site_mode", value: "sale", updated_at: new Date().toISOString() });

  it("is prelaunch without the deployment unlock, even if settings say sale", async () => {
    await setSale();
    expect(await getSiteMode()).toBe("prelaunch");
  });

  it("is prelaunch with the unlock but no storage", async () => {
    setupEnv({ SITE_MODE_SALE_UNLOCK: "true", MATOCHA_STORE: undefined });
    expect(await getSiteMode()).toBe("prelaunch");
  });

  it("is prelaunch with the unlock when settings do not say sale", async () => {
    setupEnv({ SITE_MODE_SALE_UNLOCK: "true" });
    expect(await getSiteMode()).toBe("prelaunch");
  });

  it("is sale only with the unlock AND an approved settings row", async () => {
    setupEnv({ SITE_MODE_SALE_UNLOCK: "true" });
    await setSale();
    expect(await getSiteMode()).toBe("sale");
  });
});
