/**
 * MATOCHA — the catalogue, single source of truth.
 *
 * Nothing in here is a commercial fact until its `status` says `confirmed`.
 * The demo values of v1 (30 × 2 g, 39 €, Japan, "100 % matcha") are recorded
 * as `target` hypotheses where useful and never as values.
 *
 * The Ops API can override textual fields and propose confirmations; those
 * overrides are merged at read time by `src/lib/catalog.ts`.
 */

import type {
  Catalog,
  Company,
  Family,
  Pack,
  Proof,
  Recipe,
} from "./types";

export * from "./types";

/** Shorthand for an unconfirmed field. */
const pending = <T,>(target?: string): Proof<T> => ({
  value: null,
  status: "to_confirm",
  ...(target ? { target } : {}),
});

const unknown = <T,>(): Proof<T> => ({ value: null, status: "unknown" });

/* ---------------------------------------------------------------- families */

export const families: Family[] = [
  {
    id: "poudre",
    name: "Original Poudre",
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
  {
    id: "concentre",
    name: "Original Concentré",
    workingName: "Concentré liquide ou pâte",
    formatIcon: "drop",
    devStatus: "concept",
    promise: "Ouvrez. Versez. Mélangez.",
    gesture: ["Ouvrir", "Verser", "Mélanger"],
    gestureNote:
      "Objectif de développement : une portion liquide qui se mélange à la cuillère. La formule n'est pas encore définie.",
    equipment: pending("Une cuillère, si la formule le permet"),
    servingFormat: "Sachet de concentré",
  },
];

/* ----------------------------------------------------------------- recipes */

const COLORS = {
  original: { liquid: "#A9C46A", matter: "#6E9A2E" },
  vanille: { liquid: "#CFD39A", matter: "#B9B067" },
  fraise: { liquid: "#B7C377", matter: "#E2718C" },
} as const;

function recipe(
  familyId: Recipe["familyId"],
  id: Recipe["id"],
  overrides: Partial<Recipe>,
): Recipe {
  const isPowder = familyId === "poudre";
  return {
    key: `${familyId}-${id}`,
    id,
    familyId,
    name: { original: "Original", vanille: "Vanille", fraise: "Fraise" }[id],
    accentToken: (
      { original: "--matcha", vanille: "--vanille", fraise: "--rhubarbe" } as const
    )[id],
    liquidColor: COLORS[id].liquid,
    matterColor: COLORS[id].matter,
    description: "",
    denomination: pending(),
    ingredients: pending(),
    allergens: pending(),
    matchaPerServingG: pending(),
    servingTotal: pending(),
    origin: pending(),
    claims: [],
    preparation: isPowder
      ? {
          value: [
            { method: "whisk", liquidMl: null, hot: true, iced: true },
            { method: "frother", liquidMl: null, hot: true, iced: true },
            { method: "shaker", liquidMl: null, hot: false, iced: true },
          ],
          status: "to_confirm",
          target: "Volumes et temps mesurés pendant nos tests internes",
        }
      : {
          value: [{ method: "spoon", liquidMl: null, hot: true, iced: true }],
          status: "to_confirm",
          target: "Geste visé ; dépend de la formule",
        },
    storage: pending(),
    nutrition: pending(),
    caffeineMg: unknown(),
    status: "test_track",
    ...overrides,
  };
}

export const recipes: Recipe[] = [
  recipe("poudre", "original", {
    status: "in_development",
    description:
      "Le goût du matcha, tel quel. C'est la recette de référence, celle qu'on met au point en premier.",
    ingredients: pending("Matcha seul, à confirmer sur le lot retenu"),
    matchaPerServingG: pending("Autour de 2 g, à confirmer"),
    servingTotal: pending(),
    origin: pending("Japon, à confirmer avec le fournisseur retenu"),
    storage: pending("À l'abri de l'humidité, de la lumière et de la chaleur"),
    claims: [
      { label: "Sans sucre ajouté", proof: pending() },
      { label: "Sans arômes ajoutés", proof: pending() },
    ],
  }),
  recipe("poudre", "vanille", {
    description:
      "Une piste plus douce. On veut savoir si elle vous donne envie avant de la développer.",
  }),
  recipe("poudre", "fraise", {
    description:
      "Une piste gourmande, pensée pour les lattes glacés. Elle reste à tester.",
  }),
  recipe("concentre", "original", {
    status: "in_development",
    description:
      "Le même goût de départ, sous forme de concentré à verser. Formule, portion et conservation sont encore à définir.",
    preparation: {
      value: [{ method: "spoon", liquidMl: null, hot: true, iced: true }],
      status: "to_confirm",
      target: "Geste visé ; dépend de la formule",
    },
    storage: pending("Dépend de la formule et du procédé"),
  }),
  recipe("concentre", "vanille", {
    description: "Piste en test, uniquement si le concentré Original est validé.",
  }),
  recipe("concentre", "fraise", {
    description: "Piste en test, uniquement si le concentré Original est validé.",
  }),
];

/* ------------------------------------------------------------------- packs */

function pack(
  familyId: Pack["familyId"],
  id: Pack["id"],
  overrides: Partial<Pack> & Pick<Pack, "doses" | "dosesRange">,
): Pack {
  return {
    key: `${familyId}-${id}`,
    id,
    familyId,
    name: { decouverte: "Découverte", quotidien: "Quotidien", duo: "Duo" }[id],
    purpose: "",
    recipeIds: ["original"],
    dosesStatus: "to_confirm",
    netQuantity: pending(),
    price: pending(),
    commercialStatus: "waitlist",
    media: [`pack-${id}-${familyId}`],
    ...overrides,
  };
}

export const packs: Pack[] = [
  pack("poudre", "decouverte", {
    doses: 8,
    dosesRange: "6 ou 8 doses",
    purpose: "Pour goûter sans engager une grosse première commande.",
  }),
  pack("poudre", "quotidien", {
    doses: 30,
    dosesRange: "20 ou 30 doses",
    purpose: "Pour celles et ceux qui en boivent presque tous les jours.",
  }),
  pack("poudre", "duo", {
    doses: 60,
    dosesRange: "Deux boîtes Quotidien",
    purpose: "Deux boîtes, pour la maison et le bureau, ou à partager.",
  }),
  pack("concentre", "decouverte", {
    doses: 6,
    dosesRange: "À définir avec la formule",
    purpose: "Le premier pack du concentré, quand il sera validé.",
    commercialStatus: "concept",
  }),
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

export function findRecipe(
  catalog: Catalog,
  familyId: Family["id"],
  id: Recipe["id"],
) {
  return catalog.recipes.find((r) => r.familyId === familyId && r.id === id);
}
