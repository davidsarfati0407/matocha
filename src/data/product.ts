/**
 * Product catalogue — a thin, typed view over `brand.ts`.
 * Prices are in cents and formatted with Intl at render time.
 */

import { brand, sourcingRows, subscriptionPrice } from "./brand";

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  kicker: string;
  /** Price in cents, one-time purchase. */
  price: number;
  subscriptionDiscount: number;
  subscriptionInterval: string;
  sticks: number;
  gramsPerStick: number;
  totalGrams: number;
  description: string[];
  specs: { label: string; value: string }[];
  whatsInside: string[];
  preparation: { step: string; title: string; body: string }[];
  freshness: string[];
  ingredients: string;
};

export const dailyBox: Product = {
  slug: "daily-box",
  name: brand.productName,
  shortName: "Daily Box",
  kicker: `${brand.sticksPerBox} × ${brand.servingWeight}${brand.servingUnit} premium Japanese matcha sticks`,
  price: brand.price,
  subscriptionDiscount: brand.subscriptionDiscount,
  subscriptionInterval: brand.subscriptionInterval,
  sticks: brand.sticksPerBox,
  gramsPerStick: brand.servingWeight,
  totalGrams: brand.netWeight,

  description: [
    "Each MATOCHA stick contains exactly 2g of matcha. No scoop. No scale. No guessing.",
    "Thirty sticks. Thirty mornings. Tear one open, add water, whisk — at home, at your desk, or halfway across the world.",
  ],

  specs: [
    { label: "Contents", value: "30 sticks × 2g" },
    { label: "Net weight", value: "60g" },
    { label: "Origin", value: brand.sourcing.origin ?? "To be confirmed" },
    { label: "Sugar", value: "None" },
    { label: "Flavourings", value: "None" },
    { label: "Additives", value: "None" },
  ],

  whatsInside: [
    "30 individually sealed 2g sticks",
    "60g of 100% Japanese matcha in total",
    "One recyclable outer box",
    "Nothing else — no sugar, no flavourings, no additives",
  ],

  preparation: [
    {
      step: "01",
      title: "Open",
      body: "Tear one 2g stick. The portion is already measured.",
    },
    {
      step: "02",
      title: "Pour",
      body: "About 60ml of hot — not boiling — water.",
    },
    {
      step: "03",
      title: "Whisk",
      body: "Whisk until smooth, then drink straight or top with milk.",
    },
  ],

  freshness: [
    "Matcha fades once it meets air. A tin starts ageing the day you open it.",
    "Every MATOCHA serving stays sealed until the moment you drink it, so the thirtieth morning is made from powder as fresh as the first.",
  ],

  ingredients: brand.ingredients,
};

export const products: Product[] = [dailyBox];

export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);

export { subscriptionPrice, sourcingRows };

export const subscription = {
  title: "Monthly subscription",
  cadence: `${brand.sticksPerBox} sticks. ${brand.sticksPerBox} mornings.`,
  interval: brand.subscriptionInterval,
  benefits: brand.subscriptionBenefits,
  cta: "Start my subscription",
  billingEnabled: brand.subscriptionBillingEnabled,
};
