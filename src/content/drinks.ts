import type { PrepMethod } from "./catalog/types";

/**
 * Drink recipes made with a Matocha stick. Each has its own test status: a recipe is
 * only "validée" once volumes and times have been measured in internal tests.
 */
export type Drink = {
  id: string;
  name: string;
  temp: "hot" | "iced";
  methods: PrepMethod[];
  liquids: string[];
  steps: string[];
  status: "a_tester" | "en_test" | "validee";
  /** Measured values, filled in once validated. */
  measured: { liquidMl: number; timeSec: number } | null;
};

export const drinks: Drink[] = [
  {
    id: "latte-glace",
    name: "Latte glacé",
    temp: "iced",
    methods: ["frother", "shaker"],
    liquids: ["Lait", "Boisson végétale"],
    steps: [
      "Versez la poudre du stick dans un verre avec un fond de lait.",
      "Mélangez au mousseur ou au shaker jusqu'à ce que la couleur soit uniforme.",
      "Ajoutez les glaçons, puis complétez avec le lait froid.",
    ],
    status: "a_tester",
    measured: null,
  },
  {
    id: "matcha-chaud",
    name: "Matcha chaud",
    temp: "hot",
    methods: ["whisk", "frother"],
    liquids: ["Eau chaude, pas bouillante"],
    steps: [
      "Versez la dose dans une tasse.",
      "Ajoutez un peu d'eau chaude, pas bouillante.",
      "Fouettez en zigzag jusqu'à une mousse fine, puis complétez à votre goût.",
    ],
    status: "a_tester",
    measured: null,
  },
  {
    id: "latte-chaud",
    name: "Latte chaud",
    temp: "hot",
    methods: ["whisk", "frother"],
    liquids: ["Lait chaud", "Boisson végétale chaude"],
    steps: [
      "Versez la dose dans une tasse.",
      "Ajoutez un peu de lait chaud et mélangez jusqu'à une couleur uniforme.",
      "Complétez avec le lait chaud, moussé si vous le souhaitez.",
    ],
    status: "a_tester",
    measured: null,
  },
  {
    id: "shaker",
    name: "Au shaker, à emporter",
    temp: "iced",
    methods: ["shaker"],
    liquids: ["Lait froid", "Eau froide"],
    steps: [
      "Versez la dose dans le shaker avec le liquide froid.",
      "Fermez bien et secouez franchement.",
      "Ajoutez des glaçons si vous en avez.",
    ],
    status: "a_tester",
    measured: null,
  },
];

export const DRINK_STATUS_LABEL: Record<Drink["status"], string> = {
  a_tester: "À tester",
  en_test: "En test",
  validee: "Validée",
};
