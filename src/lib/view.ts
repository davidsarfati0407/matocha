import "server-only";
import { theProduct, type Catalog, type Recipe, type SiteMode } from "@/content/catalog";
import { fr } from "@/content/i18n/fr";
import { resolveCta } from "@/lib/commerce/cta";
import { formatEur, isConfirmed, proofText } from "@/lib/proof";
import type { CartLine } from "@/lib/cart";

const COMMERCIAL_LABEL = {
  concept: "Concept",
  waitlist: "Pré-lancement",
  preorder: "Précommande",
  available: "Disponible",
  sold_out: "Épuisé",
  retired: "Retiré",
} as const;

export type ProductCta =
  | { kind: "buy"; label: string; line: Omit<CartLine, "id" | "quantity"> }
  | { kind: "interest"; label: string; href: string }
  | { kind: "none" };

/**
 * The one product, its one price and its one CTA. The CTA comes from the
 * resolver: "Être prévenu du lancement" in pre-launch, "Ajouter au panier"
 * only once sale mode is on and every condition is confirmed.
 */
export function productView(catalog: Catalog, mode: SiteMode) {
  const { pack, recipe, family } = theProduct(catalog);
  const cta = resolveCta(mode, pack, recipe, catalog.company);
  const unitPrice = isConfirmed(pack.price) && pack.price.value > 0 ? pack.price.value : null;
  const price = unitPrice !== null ? formatEur(unitPrice) : null;
  const perDrink = unitPrice !== null && pack.dosesStatus === "confirmed" ? formatEur(unitPrice / pack.doses) : null;

  const productCta: ProductCta =
    cta.kind === "buy" && unitPrice !== null
      ? {
          kind: "buy",
          label: cta.label,
          line: {
            packKey: pack.key,
            recipeKey: recipe.key,
            name: `${pack.name} ${recipe.name}`,
            dosesPerUnit: pack.doses,
            unitPrice,
          },
        }
      : cta.kind === "interest"
        ? { kind: "interest", label: fr.hero.ctaPrelaunch, href: "#inscription" }
        : { kind: "none" };

  return {
    name: `${pack.name} · ${recipe.name}`,
    packName: pack.name,
    recipeName: recipe.name,
    contents: pack.dosesRange,
    netQuantity: proofText(pack.netQuantity),
    price,
    perDrink,
    statusLabel: COMMERCIAL_LABEL[pack.commercialStatus],
    devLabel: family.devStatus === "validated" ? "" : fr.status.inDevelopment,
    cta: productCta,
  };
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
