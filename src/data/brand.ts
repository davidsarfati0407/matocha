/**
 * MATOCHA — central brand configuration.
 *
 * This is the single source of truth for commercial, sourcing and identity
 * values. `site.ts`, `product.ts` and `content.ts` all derive from it, so a
 * price or a sourcing field is changed here and nowhere else.
 *
 * Anything not yet confirmed is `null` — never a placeholder string that could
 * be mistaken for a claim. The UI renders "To be confirmed" for nulls.
 */

export const brand = {
  brandName: "MATOCHA",
  shortName: "MATOCHA",
  tagline: "Matcha. Made simple.",
  campaignLine: "Matcha. Made simple.",

  /** Secondary lines, reused across sections. */
  lines: {
    proposition: ["One stick.", "One serving.", "No measuring."],
    poster: ["One stick.", "One matcha."],
    posterAlt: ["Matcha,", "wherever."],
    ritual: ["Open.", "Pour.", "Whisk."],
    guesswork: ["30 matchas.", "Zero guesswork."],
  },

  /* ----------------------------------------------------------- identity */

  colors: {
    /** Primary brand colour. Dominates the site. */
    green: "#173D2B",
    /** Depth: shadows, pack sides, layered greens. */
    greenDeep: "#0F2A1E",
    /** The liquid. Fresh matcha — this is the colour that says "matcha". */
    matcha: "#79A84B",
    /** Page ground. */
    ivory: "#F3EFE5",
    /** Warm neutral for placeholder photography and quiet blocks. */
    ivoryDeep: "#E7E1D2",
    /** Type colour on ivory, and the outline of every illustration. */
    black: "#161713",
    /** The one unexpected accent. Used sparingly — never for body text. */
    coral: "#E07A5F",
  },

  /** Outline and liquid colours for the glass illustration. */
  glass: {
    ink: "#161713",
    liquid: "#79A84B",
  },

  /* ------------------------------------------------------------ product */

  productName: "MATOCHA Daily Box",
  servingWeight: 2,
  servingUnit: "g",
  sticksPerBox: 30,
  netWeight: 60,
  /** Price in cents. */
  price: 3900,
  subscriptionDiscount: 0.1,
  subscriptionInterval: "Every month",

  /** Ingredient statement — regulated copy, keep literal. */
  ingredients: "100% Japanese green tea powder (matcha).",

  /** Confirmed product facts. Nothing here is aspirational. */
  facts: [
    "100% Japanese matcha",
    "2g per stick",
    "No sugar",
    "No flavourings",
    "No additives",
  ],

  /* ------------------------------------------------------------ sourcing
   * EDITABLE. Supplier selection is still ongoing. Everything unconfirmed
   * stays `null` — do not fill these in until they are verified.
   */
  sourcing: {
    origin: "Japan" as string | null,
    region: null as string | null,
    cultivar: null as string | null,
    producer: null as string | null,
    farm: null as string | null,
    harvest: null as string | null,
    organic: null as boolean | null,
  },

  /** "preorder" until the first production run ships, then "in-stock". */
  availability: "preorder" as "preorder" | "in-stock" | "sold-out",

  /* ------------------------------------------------------------ commerce */

  currency: "EUR",
  locale: "fr-FR",
  /** Free-shipping threshold in cents. `null` hides the indicator. */
  freeShippingThreshold: 5000,

  subscriptionBenefits: ["Save 10%", "Pause anytime", "Cancel anytime"],
  /** Recurring billing is not connected yet. */
  subscriptionBillingEnabled: false,

  address: { city: "Paris", country: "France" },
  contactEmail: "hello@matocha.com",
  url: "https://matocha.com",
} as const;

/** Label + value pairs for the sourcing block, with nulls made explicit. */
export type SourcingRow = { label: string; value: string; confirmed: boolean };

export function sourcingRows(): SourcingRow[] {
  const { origin, region, cultivar, producer, harvest } = brand.sourcing;
  const rows: [string, string | null][] = [
    ["Origin", origin],
    ["Region", region],
    ["Cultivar", cultivar],
    ["Producer", producer],
    ["Harvest", harvest],
  ];

  return rows.map(([label, value]) => ({
    label,
    value: value ?? "To be confirmed",
    confirmed: value !== null,
  }));
}

export const subscriptionPrice = Math.round(
  brand.price * (1 - brand.subscriptionDiscount),
);

/** Price of a single serving, in cents. */
export const servingPrice = Math.round(brand.price / brand.sticksPerBox);
