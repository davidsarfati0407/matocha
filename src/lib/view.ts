import "server-only";
import {
  findFamily,
  packsOf,
  recipesOf,
  type Catalog,
  type Family,
  type Pack,
  type Recipe,
  type SiteMode,
} from "@/content/catalog";
import { fr } from "@/content/i18n/fr";
import { resolveCta } from "@/lib/commerce/cta";
import { formatEur, isConfirmed, proofText } from "@/lib/proof";
import type { FlavourOption } from "@/components/scenes/FlavourScene";
import type { GestureFamily } from "@/components/scenes/GestureScene";
import type { CalcPack } from "@/components/scenes/DoseCalculator";
import type { Hotspot } from "@/components/scenes/LoupeScene";
import type { PackCard } from "@/components/scenes/PackChooser";

/** Accent token → hex, for SVG fills that cannot read CSS variables everywhere. */
export const ACCENT_HEX: Record<Recipe["accentToken"], string> = {
  "--matcha": "#8DB33A",
  "--vanille": "#EBD7A8",
  "--rhubarbe": "#E2718C",
};

export function familyStatusLabel(family: Family) {
  switch (family.devStatus) {
    case "validated":
      return "";
    default:
      return fr.status.inDevelopment;
  }
}

export function recipeStatusLabel(recipe: Recipe) {
  if (recipe.status === "test_track") return fr.status.testTrack;
  if (recipe.status === "in_development") return fr.status.inDevelopment;
  return "";
}

export function ctaHref(kind: "buy" | "interest" | "none", recipe: Recipe) {
  if (kind === "interest")
    return recipe.status === "test_track" ? `/?interet=${recipe.id}#inscription` : "/#inscription";
  return `/formats/${recipe.familyId}#packs`;
}

export function heroVariants(catalog: Catalog) {
  return catalog.families.map((family) => {
    const recipe = recipesOf(catalog, family.id).find((r) => r.id === "original")!;
    return {
      family: family.id,
      label: family.name,
      status: family.id === "poudre" ? "" : `Concentré — ${fr.status.inDevelopment.toLowerCase()}`,
      liquidColor: recipe.liquidColor,
      matterColor: recipe.matterColor,
      accent: ACCENT_HEX[recipe.accentToken],
    };
  });
}

export function gestureFamilies(catalog: Catalog): GestureFamily[] {
  return catalog.families.map((family) => {
    const recipe = recipesOf(catalog, family.id).find((r) => r.id === "original")!;
    return {
      id: family.id,
      name: family.name,
      status: family.id === "poudre" ? "" : `Concentré — ${fr.status.inDevelopment.toLowerCase()}`,
      steps: family.gesture,
      stepTexts: family.id === "poudre" ? fr.gesture.stepPowder : fr.gesture.stepConcentrate,
      methods: (recipe.preparation.value ?? []).map(({ method, hot, iced }) => ({ method, hot, iced })),
      liquidColor: recipe.liquidColor,
      matterColor: recipe.matterColor,
      accent: ACCENT_HEX[recipe.accentToken],
    };
  });
}

export function flavourOptions(catalog: Catalog, mode: SiteMode, familyId: Family["id"] = "poudre"): FlavourOption[] {
  const pack = packsOf(catalog, familyId)[0];
  return recipesOf(catalog, familyId).map((recipe) => {
    /* A flavour outside the pack can never be bought from here: the resolver
       blocks it (recipe_not_in_pack) and falls back to an interest CTA. */
    const cta = pack ? resolveCta(mode, pack, recipe, catalog.company) : { kind: "none" as const };
    return {
      key: recipe.key,
      id: recipe.id,
      name: recipe.name,
      statusLabel: recipeStatusLabel(recipe),
      testTrack: recipe.status === "test_track",
      description: recipe.description,
      ingredients: proofText(recipe.ingredients, (v) => v.join(", ")),
      accent: ACCENT_HEX[recipe.accentToken],
      accentToken: recipe.accentToken,
      liquidColor: recipe.liquidColor,
      matterColor: recipe.matterColor,
      cta: cta.kind === "none" ? null : { label: cta.label, href: ctaHref(cta.kind, recipe) },
    };
  });
}

export function pricePerDrink(pack: Pack) {
  return isConfirmed(pack.price) && pack.dosesStatus === "confirmed"
    ? formatEur(pack.price.value / pack.doses)
    : null;
}

export function calcPacks(catalog: Catalog): CalcPack[] {
  return packsOf(catalog, "poudre").map((p) => ({
    key: p.key,
    name: p.name,
    doses: p.doses,
    dosesRange: p.dosesRange,
    pricePerDrink: pricePerDrink(p),
  }));
}

export function insideRows(recipe: Recipe) {
  const rows = [
    ["composition", proofText(recipe.ingredients, (v) => v.join(", "))],
    ["matcha", proofText(recipe.matchaPerServingG, (v) => `${v.toLocaleString("fr-FR")} g`)],
    ["serving", proofText(recipe.servingTotal, (v) => `${v.value.toLocaleString("fr-FR")} ${v.unit}`)],
    ["origin", proofText(recipe.origin)],
    ["storage", proofText(recipe.storage)],
    ["nutrition", proofText(recipe.nutrition, (v) => Object.entries(v).map(([k, val]) => `${k} : ${val}`).join(" · "))],
    ["allergens", proofText(recipe.allergens, (v) => (v.length ? v.join(", ") : "Aucun"))],
    ["caffeine", proofText(recipe.caffeineMg, (v) => `${v} mg par portion`)],
  ] as const;
  return rows.map(([key, value]) => ({ key, label: fr.inside.rows[key], ...value }));
}

export function loupeHotspots(catalog: Catalog, recipe: Recipe): Hotspot[] {
  const ingredients = proofText(recipe.ingredients, (v) => v.join(", "));
  const storage = proofText(recipe.storage);
  const operator = proofText(catalog.company.responsibleOperator);
  return [
    { id: "powder", label: fr.inside.hotspots.powder, x: 18, y: 84, value: ingredients.text, confirmed: ingredients.confirmed, target: ingredients.target },
    { id: "pack", label: fr.inside.hotspots.pack, x: 40, y: 66, value: "Matériau et barrière du film : en cours de validation avec le fabricant.", confirmed: false },
    { id: "seal", label: fr.inside.hotspots.seal, x: 76, y: 30, value: storage.text, confirmed: storage.confirmed, target: storage.target },
    { id: "batch", label: fr.inside.hotspots.batch, x: 84, y: 58, value: operator.confirmed ? `Lot et DDM imprimés à la fabrication. Opérateur : ${operator.text}` : "Lot et date de durabilité minimale : imprimés à la fabrication. Fabricant en cours de sélection.", confirmed: false },
  ];
}

export function poudre(catalog: Catalog) {
  return findFamily(catalog, "poudre");
}

const COMMERCIAL_LABEL: Record<Pack["commercialStatus"], string> = {
  concept: "Concept",
  waitlist: "Pré-lancement",
  preorder: "Précommande",
  available: "Disponible",
  sold_out: "Épuisé",
  retired: "Retiré",
};

export function packCards(catalog: Catalog, mode: SiteMode, familyId: Family["id"]): PackCard[] {
  const original = recipesOf(catalog, familyId).find((r) => r.id === "original")!;
  return packsOf(catalog, familyId).map((pack) => {
    const cta = resolveCta(mode, pack, original, catalog.company);
    const price = isConfirmed(pack.price) ? formatEur(pack.price.value) : null;
    return {
      key: pack.key,
      name: pack.name,
      purpose: pack.purpose,
      doses: pack.doses,
      dosesRange: pack.dosesRange,
      dosesConfirmed: pack.dosesStatus === "confirmed",
      price,
      pricePerDrink: pricePerDrink(pack),
      statusLabel: COMMERCIAL_LABEL[pack.commercialStatus],
      cta:
        cta.kind === "buy" && isConfirmed(pack.price)
          ? {
              kind: "buy",
              label: cta.label,
              line: {
                packKey: pack.key,
                recipeKey: original.key,
                name: `${pack.name} ${original.name}`,
                dosesPerUnit: pack.doses,
                unitPrice: pack.price.value,
              },
            }
          : cta.kind === "interest"
            ? { kind: "interest", label: cta.label, href: ctaHref("interest", original) }
            : { kind: "none" },
    };
  });
}
