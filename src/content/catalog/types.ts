/**
 * MATOCHA — catalogue types.
 *
 * Every fact a visitor could read as a commitment is a `Proof<T>`: it carries
 * its own confirmation status. Components never print a product fact directly;
 * they go through `src/lib/proof.ts`, which shows the value only when it is
 * `confirmed` and "En cours de validation" otherwise.
 */

export type SiteMode = "prelaunch" | "sale";

export type ProofStatus = "confirmed" | "to_confirm" | "unknown";

export type Proof<T> = {
  value: T | null;
  status: ProofStatus;
  /** Internal: document, COA, quote… Never rendered on the public site. */
  source?: string;
  verifiedAt?: string;
  /**
   * Public, clearly-labelled working hypothesis ("Objectif : …"). Shown next to
   * "En cours de validation", never in place of a value.
   */
  target?: string;
};

export type FamilyId = "poudre" | "concentre";
export type RecipeId = "original" | "vanille" | "fraise";

export type Family = {
  id: FamilyId;
  /** Display name. */
  name: string;
  /** Working name used in the brief. */
  workingName: string;
  formatIcon: "stick" | "drop";
  devStatus: "concept" | "prototype" | "in_development" | "validated";
  /** One-line honest promise. */
  promise: string;
  /** The gesture, in order. Same words as the scene shows. */
  gesture: [string, string, string];
  /** Why the gesture is what it is (e.g. suspension, not dissolution). */
  gestureNote: string;
  equipment: Proof<string>;
  servingFormat: string;
};

export type PrepMethod = "whisk" | "frother" | "shaker" | "spoon";

export type PreparationStep = {
  method: PrepMethod;
  /** null until measured in internal tests. */
  liquidMl: number | null;
  hot: boolean;
  iced: boolean;
};

export type RecipeStatus =
  /** The reference recipe, being developed with the supplier. */
  | "in_development"
  /** A flavour idea to test with the waitlist. */
  | "test_track"
  | "validated";

export type Recipe = {
  /** Unique key: `${familyId}-${id}`. */
  key: string;
  id: RecipeId;
  familyId: FamilyId;
  name: string;
  /** CSS custom property carrying the flavour accent. */
  accentToken: "--matcha" | "--vanille" | "--rhubarbe";
  /** Colour of the finished drink in illustrations. */
  liquidColor: string;
  /** Colour of the concentrate / powder itself. */
  matterColor: string;
  description: string;
  denomination: Proof<string>;
  ingredients: Proof<string[]>;
  allergens: Proof<string[]>;
  matchaPerServingG: Proof<number>;
  servingTotal: Proof<{ value: number; unit: "g" | "ml" }>;
  origin: Proof<string>;
  /** Shown only when `proof.status === "confirmed"`. */
  claims: { label: string; proof: Proof<boolean> }[];
  preparation: Proof<PreparationStep[]>;
  storage: Proof<string>;
  nutrition: Proof<Record<string, string>>;
  caffeineMg: Proof<number>;
  status: RecipeStatus;
};

export type CommercialStatus =
  | "concept"
  | "waitlist"
  | "preorder"
  | "available"
  | "sold_out"
  | "retired";

export type PackId = "decouverte" | "quotidien" | "duo";

export type Pack = {
  id: PackId;
  /** Unique key: `${familyId}-${id}`. */
  key: string;
  familyId: FamilyId;
  name: string;
  purpose: string;
  recipeIds: RecipeId[];
  /** Working quantity used to draw the box. Its own status says if it is final. */
  doses: number;
  dosesStatus: ProofStatus;
  /** "6 ou 8", "20 ou 30"… — the range still being decided. */
  dosesRange: string;
  netQuantity: Proof<string>;
  /** TTC, euros. */
  price: Proof<number>;
  commercialStatus: CommercialStatus;
  /** Media manifest ids. */
  media: string[];
};

export type Company = {
  /** Legal name, registration, address of the responsible food operator. */
  responsibleOperator: Proof<string>;
  legalForm: Proof<string>;
  registration: Proof<string>;
  address: Proof<string>;
  publicationDirector: Proof<string>;
  host: Proof<string>;
  contactEmail: Proof<string>;
};

export type Social = { network: string; url: string; handle: string };

export type Catalog = {
  families: Family[];
  recipes: Recipe[];
  packs: Pack[];
  company: Company;
  /** Confirmed accounts only. Empty = nothing rendered. */
  socials: Social[];
  shipping: {
    carrier: Proof<string>;
    delay: Proof<string>;
    rates: Proof<string>;
    freeShippingThresholdEur: Proof<number>;
  };
};
