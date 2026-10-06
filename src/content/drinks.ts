import type { FamilyId, PrepMethod } from "./catalog/types";

/**
 * Drink recipes made WITH a format. Each has its own test status: a recipe is
 * only "validée" once volumes and times have been measured in internal tests.
 */
export type Drink = {
  id: string;
  name: string;
  families: FamilyId[];
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
    families: ["poudre", "concentre"],
    temp: "iced",
    methods: ["frother", "shaker", "spoon"],
    liquids: ["Lait", "Boisson végétale"],
    steps: [
      "Versez la dose dans un verre avec un fond de lait.",
      "Mélangez jusqu'à ce que la couleur soit uniforme (mousseur ou shaker pour la poudre, cuillère pour le concentré).",
      "Ajoutez les glaçons, puis complétez avec le lait froid.",
    ],
    status: "a_tester",
    measured: null,
  },
  {
    id: "matcha-chaud",
    name: "Matcha chaud",
    families: ["poudre"],
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
    families: ["poudre", "concentre"],
    temp: "hot",
    methods: ["whisk", "frother", "spoon"],
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
    families: ["poudre"],
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
