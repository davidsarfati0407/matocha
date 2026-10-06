/**
 * CTA resolver — the one place that decides whether something can be bought.
 *
 * Pure and unit-tested (tests/unit/cta.test.ts). A button style can never turn
 * a prototype into a product: every component asks this function, and a "buy"
 * answer needs every condition below to hold at once.
 */

import type {
  Company,
  Pack,
  Proof,
  Recipe,
  SiteMode,
} from "@/content/catalog/types";

export type Cta =
  | { kind: "buy"; label: "Ajouter au panier" }
  | { kind: "interest"; label: "Être prévenu du lancement" }
  | { kind: "none" };

export type BlockReason =
  | "mode_not_sale"
  | "pack_not_available"
  | "price_not_confirmed"
  | "recipe_not_validated"
  | "recipe_not_in_pack"
  | "mandatory_info_missing";

const confirmed = (proof: Proof<unknown> | undefined) =>
  !!proof && proof.status === "confirmed" && proof.value !== null;

/**
 * Mandatory food information for distance selling in France (INCO 1169/2011
 * art. 14, as summarised by the DGCCRF). The best-before date can be given at
 * delivery, so it is not part of this list.
 */
export function missingMandatoryInfo(
  pack: Pack,
  recipe: Recipe,
  company?: Pick<Company, "responsibleOperator">,
): string[] {
  const fields: [string, Proof<unknown> | undefined][] = [
    ["denomination", recipe.denomination],
    ["ingredients", recipe.ingredients],
    ["allergens", recipe.allergens],
    ["netQuantity", pack.netQuantity],
    ["nutrition", recipe.nutrition],
    ["preparation", recipe.preparation],
    ["storage", recipe.storage],
    ["responsibleOperator", company?.responsibleOperator],
  ];
  /* Origin is mandatory once it is claimed. */
  if (recipe.origin.value !== null) fields.push(["origin", recipe.origin]);

  return fields.filter(([, proof]) => !confirmed(proof)).map(([name]) => name);
}

export function buyBlockers(
  mode: SiteMode,
  pack: Pack,
  recipe: Recipe,
  company?: Pick<Company, "responsibleOperator">,
): BlockReason[] {
  const reasons: BlockReason[] = [];
  if (mode !== "sale") reasons.push("mode_not_sale");
  if (pack.commercialStatus !== "available") reasons.push("pack_not_available");
  if (!confirmed(pack.price) || (pack.price.value ?? 0) <= 0)
    reasons.push("price_not_confirmed");
  if (recipe.status !== "validated") reasons.push("recipe_not_validated");
  if (
    pack.familyId !== recipe.familyId ||
    !pack.recipeIds.includes(recipe.id)
  )
    reasons.push("recipe_not_in_pack");
  if (missingMandatoryInfo(pack, recipe, company).length > 0)
    reasons.push("mandatory_info_missing");
  return reasons;
}

export function resolveCta(
  mode: SiteMode,
  pack: Pack,
  recipe: Recipe,
  company?: Pick<Company, "responsibleOperator">,
): Cta {
  if (buyBlockers(mode, pack, recipe, company).length === 0) {
    return { kind: "buy", label: "Ajouter au panier" };
  }
  if (pack.commercialStatus === "retired") return { kind: "none" };
  return { kind: "interest", label: "Être prévenu du lancement" };
}
