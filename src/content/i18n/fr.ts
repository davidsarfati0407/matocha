/**
 * MATOCHA — French copy, the default and only complete language.
 *
 * Interface and editorial strings live here. Product facts do NOT: they come
 * from the catalogue and its Proof fields. English is not shipped until it is
 * complete (see DECISIONS.md), so the language switch stays hidden.
 */

export const fr = {
  meta: {
    siteName: "Matocha",
    titleDefault: "Matocha — Le matcha, en plus simple",
    descriptionPrelaunch:
      "Une dose de matcha dans un stick : vous l'ouvrez, vous la versez, vous la préparez. Matocha est en préparation ; inscrivez-vous pour être prévenu du lancement.",
    descriptionSale:
      "Une dose de matcha dans un stick : vous l'ouvrez, vous la versez, vous la préparez.",
  },

  nav: {
    primary: [
      { label: "La Daily Box", href: "/daily-box" },
      { label: "Comment préparer", href: "/preparer" },
      { label: "Notre produit", href: "/notre-produit" },
      { label: "FAQ", href: "/faq" },
    ],
    shop: { label: "Boutique", href: "/daily-box#acheter" },
    home: "Matocha — accueil",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    skip: "Aller au contenu",
    cart: (doses: number) => `Panier, ${doses} dose${doses > 1 ? "s" : ""}`,
  },

  status: {
    concept: "Visuel de concept",
    pending: "En cours de validation",
    inDevelopment: "En développement",
    prelaunch: "Pré-lancement",
    priceIndicative: "Prix indicatif, non définitif",
    priceAbsent: "Prix fixé après validation du fournisseur",
  },

  hero: {
    title: "Le matcha, en plus simple.",
    subtitle:
      "Une dose de matcha dans un stick. Vous l'ouvrez, vous la versez, vous la préparez en un geste.",
    productShown: "Matcha Original · Daily Box de 30 sticks de 2 g",
    ctaPrelaunch: "Être prévenu du lancement",
    ctaSale: "Ajouter au panier",
    prelaunchLine: "Le premier lot se prépare. Soyez prévenu du lancement.",
  },

  gesture: {
    title: "Ouvrir. Verser. Préparer.",
    intro:
      "Trois gestes, et la portion est déjà mesurée. Le texte et l'image montrent exactement la même chose.",
    hot: "Chaud",
    iced: "Glacé",
    temperature: "Température",
    hotDetail: "Lait ou eau chaude, pas bouillante",
    icedDetail: "Lait froid et glaçons",
    stepPowder: [
      "Déchirez le stick au niveau de l'encoche.",
      "Versez la poudre dans le verre ou la tasse.",
      "Fouettez, moussez ou secouez : la poudre se répartit, la couleur devient uniforme.",
    ],
    volumesPending: "Volumes et temps : en cours de test.",
  },

  product: {
    title: "La Daily Box.",
    intro: "Un seul produit : le Matcha Original en poudre, en sticks de 2 g. Trente sticks par boîte, un par jour.",
    contents: "Contenu",
    price: "Prix",
    perDrink: "par boisson",
    see: "Voir la Daily Box",
  },

  day: {
    title: "Une journée avec Matocha.",
    intro: "Le stick se glisse partout. La préparation, elle, demande toujours de quoi mélanger.",
    scenes: [
      { time: "7 h", place: "Cuisine", text: "Un latte glacé avant de partir, au mousseur.", recipe: "/recettes#latte-glace" },
      { time: "10 h", place: "Bureau", text: "Un stick dans la trousse, un mug d'eau chaude, un fouet.", recipe: "/recettes#matcha-chaud" },
      { time: "13 h", place: "Campus", text: "Le shaker dans le sac, le stick dans la poche.", recipe: "/recettes#shaker" },
      { time: "18 h", place: "Sport", text: "Lait froid, glaçons, shaker : trois secousses franches.", recipe: "/recettes#shaker" },
      { time: "Samedi", place: "Terrasse", text: "Une gorgée, et rien à doser.", recipe: "/recettes#latte-glace" },
    ],
  },

  inside: {
    title: "Ce qu'il y a dedans.",
    intro:
      "Chaque ligne affiche sa valeur, ou « En cours de validation ». Nous ne remplaçons pas une donnée manquante par un badge.",
    rows: {
      composition: "Composition",
      matcha: "Matcha par portion",
      serving: "Portion totale",
      origin: "Origine",
      storage: "Conservation",
      nutrition: "Nutrition",
      allergens: "Allergènes",
      caffeine: "Caféine",
    },
    target: "Objectif",
    suspensionTitle: "Suspension, pas dissolution.",
    suspensionText:
      "La poudre de matcha ne fond pas : ce sont des feuilles broyées très finement. Sans mouvement, elle retombe. C'est pour cela qu'on la fouette, qu'on la mousse ou qu'on la secoue.",
  },

  ritual: {
    title: "Pourquoi c'est plus simple.",
    quote: "Le rituel a sa beauté. Le stick, lui, tient dans une poche.",
    intro: "Comparé pour une seule boisson. On simplifie le geste, pas la culture du thé.",
    traditional: "Rituel traditionnel",
    matocha: "Stick Matocha",
    rows: [
      { label: "Doser", traditional: "Balance ou cuillère, à chaque fois", matocha: "Déjà fait, dans le stick" },
      { label: "Préparer la poudre", traditional: "Tamiser pour éviter les grumeaux", matocha: "Verser directement" },
      { label: "Mélanger", traditional: "Bol et fouet en bambou (chasen)", matocha: "Fouet, mousseur ou shaker" },
      { label: "Emporter", traditional: "Boîte ouverte, cuillère, tamis", matocha: "Un stick fermé dans la poche" },
      { label: "Conserver", traditional: "Boîte entamée, à refermer", matocha: "Chaque dose fermée jusqu'à l'ouverture" },
    ],
  },

  final: {
    faqTitle: "Questions fréquentes",
    allFaq: "Toutes les questions",
    ctaTitle: "Votre dose. Votre tasse. Votre moment.",
    ctaText: "Le premier lot se prépare. Soyez prévenu du lancement.",
  },

  waitlist: {
    label: "Adresse e-mail",
    placeholder: "vous@exemple.fr",
    consentLink: "Politique de confidentialité",
    submit: "Être prévenu du lancement",
    sending: "Envoi…",
    success: "C'est noté. Vous recevrez un e-mail pour confirmer votre inscription.",
    invalid: "Cette adresse e-mail semble incomplète. Vérifiez le @ et le domaine.",
    consentRequired: "Cochez la case pour accepter de recevoir nos e-mails.",
    closed: "Inscriptions bientôt ouvertes.",
    closedDetail:
      "Notre service d'e-mail n'est pas encore branché. Nous ne collectons aucune adresse tant qu'il ne l'est pas.",
    network: "La connexion a échoué. Réessayez dans un instant.",
    generic: "Une erreur est survenue. Réessayez dans un instant.",
  },

  footer: {
    signature: "Votre dose. Votre tasse. Votre moment.",
    help: "Aide",
    legal: "Informations légales",
    language: "Langue",
    languageFr: "Français",
    noSocial: "Nos comptes officiels seront annoncés ici.",
    legalLinks: [
      { label: "Mentions légales", href: "/legal/mentions-legales" },
      { label: "Conditions de vente", href: "/legal/cgv" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
    helpLinks: [
      { label: "Contact", href: "/aide#contact" },
      { label: "Livraison", href: "/aide#livraison" },
      { label: "Retours", href: "/aide#retours" },
      { label: "Recettes", href: "/recettes" },
    ],
  },

  notFound: {
    title: "Cette page s'est renversée.",
    text: "Le lien est cassé ou la page a changé d'adresse.",
    home: "Retour à l'accueil",
    product: "Voir la Daily Box",
  },

  loading: "Chargement",
} as const;

export type Copy = typeof fr;
