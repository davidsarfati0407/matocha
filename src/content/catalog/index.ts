/**
 * MATOCHA — the catalogue, single source of truth.
 *
 * One product: Matcha Original in powder, a 2 g stick, sold in the Daily Box
 * of 30 sticks. The product definition (2 g per stick, 30 sticks, 60 g net)
 * was confirmed by David on 6 October 2026. Everything else — price,
 * composition, origin, nutrition — stays `to_confirm` until documented.
 *
 * The Ops API can override textual fields and propose confirmations; those
 * overrides are merged at read time by `src/lib/catalog.ts`.
 */

import type { Catalog, Company, Family, Pack, Proof, Recipe } from "./types";

export * from "./types";

/** Shorthand for an unconfirmed field. */
const pending = <T,>(target?: string): Proof<T> => ({
  value: null,
  status: "to_confirm",
  ...(target ? { target } : {}),
});

const unknown = <T,>(): Proof<T> => ({ value: null, status: "unknown" });

/** Facts of the product definition, confirmed by David. */
const DEFINITION = {
  status: "confirmed",
  source: "Définition produit validée par David Sarfati (6 octobre 2026)",
  verifiedAt: "2026-10-06",
} as const;

/* ---------------------------------------------------------------- product */

export const families: Family[] = [
  {
    id: "poudre",
    name: "Matcha Original",
    workingName: "Poudre prédosée",
    formatIcon: "stick",
    devStatus: "in_development",
    promise: "La dose est prête. À vous de la préparer.",
    gesture: ["Ouvrir", "Verser", "Préparer"],
    gestureNote:
      "La poudre de matcha ne se dissout pas : elle reste en suspension. Un fouet, un mousseur ou un shaker la répartit dans la boisson.",
    equipment: {
      value: "Fouet, mousseur ou shaker",
      status: "confirmed",
      source: "Propriété physique du matcha en poudre (suspension)",
    },
    servingFormat: "Stick de poudre",
  },
];

export const recipes: Recipe[] = [
  {
    key: "poudre-original",
    id: "original",
    familyId: "poudre",
    name: "Matcha Original",
    accentToken: "--matcha",
    liquidColor: "#A9C46A",
    matterColor: "#6E9A2E",
    description: "Le goût du matcha, tel quel.",
    denomination: pending(),
    ingredients: pending("Matcha seul, à confirmer sur le lot retenu"),
    allergens: pending(),
    matchaPerServingG: pending("À confirmer avec la composition du lot retenu"),
    servingTotal: { value: { value: 2, unit: "g" }, ...DEFINITION },
    origin: pending("Japon, à confirmer avec le fournisseur retenu"),
    claims: [
      { label: "Sans sucre ajouté", proof: pending() },
      { label: "Sans arômes ajoutés", proof: pending() },
    ],
    preparation: {
      value: [
        { method: "whisk", liquidMl: null, hot: true, iced: true },
        { method: "frother", liquidMl: null, hot: true, iced: true },
        { method: "shaker", liquidMl: null, hot: false, iced: true },
      ],
      status: "to_confirm",
      target: "Volumes et temps mesurés pendant nos tests internes",
    },
    storage: pending("À l'abri de l'humidité, de la lumière et de la chaleur"),
    nutrition: pending(),
    caffeineMg: unknown(),
    status: "in_development",
  },
];

export const packs: Pack[] = [
  {
    id: "daily-box",
    key: "poudre-daily-box",
    familyId: "poudre",
    name: "Daily Box",
    purpose: "30 sticks de 2 g, un par jour.",
    recipeIds: ["original"],
    doses: 30,
    dosesStatus: "confirmed",
    dosesRange: "30 sticks de 2 g",
    netQuantity: { value: "60 g (30 × 2 g)", ...DEFINITION },
    price: pending(),
    commercialStatus: "waitlist",
    media: ["matocha-box"],
  },
];

/* ----------------------------------------------------------------- company */

export const company: Company = {
  responsibleOperator: pending(),
  legalForm: pending(),
  registration: pending(),
  address: pending(),
  publicationDirector: pending(),
  host: {
    value: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    status: "confirmed",
    source: "Hébergement actuel du site",
  },
  contactEmail: pending(),
};

export const baseCatalog: Catalog = {
  families,
  recipes,
  packs,
  company,
  socials: [],
  shipping: {
    carrier: pending(),
    delay: pending(),
    rates: pending(),
    freeShippingThresholdEur: pending(),
  },
};

/* ----------------------------------------------------------------- lookups */

export function findFamily(catalog: Catalog, id: Family["id"]) {
  const family = catalog.families.find((f) => f.id === id);
  if (!family) throw new Error(`Unknown family ${id}`);
  return family;
}

export function recipesOf(catalog: Catalog, familyId: Family["id"]) {
  return catalog.recipes.filter((r) => r.familyId === familyId);
}

export function packsOf(catalog: Catalog, familyId: Family["id"]) {
  return catalog.packs.filter((p) => p.familyId === familyId);
}

export function findRecipe(catalog: Catalog, familyId: Family["id"], id: Recipe["id"]) {
  return catalog.recipes.find((r) => r.familyId === familyId && r.id === id);
}

/** The one product the site sells: the Daily Box of Matcha Original. */
export function theProduct(catalog: Catalog) {
  const pack = catalog.packs.find((p) => p.key === "poudre-daily-box") ?? catalog.packs[0];
  const recipe = catalog.recipes.find((r) => r.key === "poudre-original") ?? catalog.recipes[0];
  const family = findFamily(catalog, "poudre");
  return { pack, recipe, family };
}
