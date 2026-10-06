/**
 * Editorial copy for the homepage sections.
 * Campaign lines live in `brand.ts`; section-specific copy lives here.
 */

import type { GlassVariant } from "@/components/brand/MatochaGlass";

export const marqueeItems = [
  "Matcha. Made simple.",
  "30 × 2g",
  "100% Japanese matcha",
  "No sugar",
  "No additives",
];

/** Why sticks — each benefit gets a state of the same glass. */
export const stickBenefits: {
  glass: GlassVariant;
  /** Short category shown above the heading — must not repeat the title. */
  kicker: string;
  title: string;
  body: string;
  detail: string;
}[] = [
  {
    glass: "classic",
    kicker: "The dose",
    title: "Perfectly portioned",
    body: "2g in every stick.",
    detail:
      "The measuring happened before the box reached you — the same matcha, the same strength, every time.",
  },
  {
    glass: "whisked",
    kicker: "Freshness",
    title: "Fresh by design",
    body: "Each serving stays sealed until you open it.",
    detail:
      "Air is what dulls matcha. Thirty sealed sticks mean nothing sits open on a shelf losing colour.",
  },
  {
    glass: "ice",
    kicker: "Portability",
    title: "Goes anywhere",
    body: "Desk. Bag. Hotel. Train. Repeat.",
    detail:
      "A stick is 2g and flat. It fits where a tin, a scoop and a sifter never will.",
  },
];

/** Preparation — the glass fills across the three steps. */
export const ritualSteps: {
  step: string;
  title: string;
  body: string;
  glass: GlassVariant;
}[] = [
  { step: "01", title: "Open", body: "Tear one 2g stick.", glass: "empty" },
  { step: "02", title: "Pour", body: "Add water.", glass: "pour" },
  {
    step: "03",
    title: "Whisk",
    body: "Whisk and drink straight or over ice.",
    glass: "whisked",
  },
];

export const comparison = {
  old: {
    label: "The old routine",
    steps: ["Tin", "Spoon", "Measure", "Close", "Carry"],
  },
  matocha: {
    label: "The MATOCHA routine",
    steps: ["Tear", "Pour", "Whisk"],
  },
} as const;

/**
 * Lifestyle scenes. Art direction is daylight — window light, long shadows,
 * quiet rooms. `lightX`/`lightY` place the light source inside each frame;
 * `subject` picks what stands in the frame.
 */
export const lifestyleScenes: {
  title: string;
  caption: string;
  tone: "ivory" | "green" | "sand";
  lightX: string;
  lightY: string;
  subject: "glass" | "stick" | "box";
  glass?: GlassVariant;
}[] = [
  {
    title: "Kitchen counter",
    caption: "07:15 — before anything else",
    tone: "ivory",
    lightX: "78%",
    lightY: "8%",
    subject: "glass",
    glass: "classic",
  },
  {
    title: "Beside the laptop",
    caption: "11:40 — between two calls",
    tone: "sand",
    lightX: "22%",
    lightY: "14%",
    subject: "glass",
    glass: "whisked",
  },
  {
    title: "Iced, by the window",
    caption: "Long shadow, cold glass",
    tone: "green",
    lightX: "68%",
    lightY: "18%",
    subject: "glass",
    glass: "ice",
  },
  {
    title: "In the bag",
    caption: "Side pocket, flat, unbroken",
    tone: "sand",
    lightX: "40%",
    lightY: "10%",
    subject: "stick",
  },
  {
    title: "Hotel table",
    caption: "Room 704 — kettle, cup, stick",
    tone: "ivory",
    lightX: "85%",
    lightY: "22%",
    subject: "box",
  },
  {
    title: "Train table",
    caption: "07:52 — northbound",
    tone: "green",
    lightX: "12%",
    lightY: "16%",
    subject: "stick",
  },
];

/**
 * HOT / ICED. Preparation steps stay here so they can be corrected without
 * touching the section. No claim is made beyond method.
 */
export const preparations: {
  title: string;
  glass: GlassVariant;
  steps: string[];
  note: string;
}[] = [
  {
    title: "Hot",
    glass: "whisked",
    steps: [
      "Tear one 2g stick into your glass",
      "Add about 60ml of hot — not boiling — water",
      "Whisk until smooth, then top up to taste",
    ],
    note: "Add hot milk instead of water for a latte.",
  },
  {
    title: "Iced",
    glass: "ice",
    steps: [
      "Tear one 2g stick into your glass",
      "Add a splash of water and whisk smooth",
      "Fill with ice, then cold water or milk",
    ],
    note: "Whisking before the ice keeps it from clumping.",
  },
];
