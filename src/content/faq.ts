/**
 * FAQ — answers stay factual. Anything that depends on unconfirmed data says so.
 * `home: true` marks the six questions shown on the home page.
 */

export type FaqEntry = {
  id: string;
  question: string;
  answer: string[];
  topic: "preparation" | "produit" | "commande";
  home?: boolean;
};

export const faq: FaqEntry[] = [
  {
    id: "comment-preparer",
    topic: "preparation",
    home: true,
    question: "Comment prépare-t-on un stick ?",
    answer: [
      "Ouvrez le stick, versez la poudre, puis mélangez avec un fouet, un mousseur à lait ou un shaker.",
      "Les volumes de liquide et les temps de préparation sont en cours de test. Nous les publierons sur la page Comment préparer dès qu'ils seront validés.",
    ],
  },
  {
    id: "sans-fouet",
    topic: "preparation",
    home: true,
    question: "Faut-il vraiment un fouet ?",
    answer: [
      "Un fouet, un mousseur ou un shaker. Le matcha ne se dissout pas : ce sont des feuilles broyées très finement qui restent en suspension. Sans mouvement, la poudre forme des amas et retombe.",
    ],
  },
  {
    id: "liquides",
    topic: "preparation",
    home: true,
    question: "Avec quels liquides ?",
    answer: [
      "Eau, lait ou boisson végétale : nous testons ces combinaisons une par une. Tant qu'une combinaison n'est pas testée, nous ne la recommandons pas.",
    ],
  },
  {
    id: "chaud-froid",
    topic: "preparation",
    home: true,
    question: "Chaud ou glacé ?",
    answer: [
      "Les deux sont prévus. Pour un matcha chaud, on évite l'eau bouillante. Pour un latte glacé, on mélange d'abord, puis on ajoute les glaçons.",
    ],
  },
  {
    id: "sucre",
    topic: "produit",
    question: "Y a-t-il du sucre ?",
    answer: [
      "La composition de la recette Original n'est pas encore confirmée sur le lot retenu. La présence ou non de sucre sera indiquée sur la fiche produit, avec la liste des ingrédients, dès qu'elle sera vérifiée.",
    ],
  },
  {
    id: "allergenes",
    topic: "produit",
    question: "Quels allergènes ?",
    answer: [
      "La liste des allergènes dépend de la recette et du site de fabrication. Elle sera affichée sur chaque fiche avant toute vente.",
    ],
  },
  {
    id: "origine",
    topic: "produit",
    home: true,
    question: "D'où vient le matcha ?",
    answer: [
      "Le fournisseur est en cours de sélection. L'origine sera indiquée avec les documents du lot retenu, pas avant. La page Notre produit liste ce que nous savons et ce que nous vérifions encore.",
    ],
  },
  {
    id: "conservation",
    topic: "produit",
    question: "Comment le conserver ?",
    answer: [
      "Le matcha craint l'humidité, la lumière, l'air et la chaleur. Chaque dose reste fermée jusqu'à l'ouverture. La durée de conservation sera indiquée une fois les tests du fabricant terminés.",
    ],
  },
  {
    id: "quand",
    topic: "commande",
    home: true,
    question: "Quand pourra-t-on commander ?",
    answer: [
      "Pas encore : le premier lot se prépare. Inscrivez-vous pour être prévenu du lancement. Nous n'annonçons pas de date tant que la production n'est pas engagée.",
    ],
  },
  {
    id: "livraison",
    topic: "commande",
    question: "Livraison et frais de port ?",
    answer: [
      "Le transporteur, les délais et les tarifs seront publiés sur la page Aide avant l'ouverture des commandes.",
    ],
  },
  {
    id: "abonnement",
    topic: "commande",
    question: "Y aura-t-il un abonnement ?",
    answer: [
      "Pas au lancement. Un abonnement ne sera proposé qu'après avoir validé le produit, le réachat et la fiabilité des livraisons.",
    ],
  },
];
