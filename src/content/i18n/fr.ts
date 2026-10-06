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
      { label: "Les formats", href: "/formats" },
      { label: "Comment préparer", href: "/preparer" },
      { label: "Notre produit", href: "/notre-produit" },
      { label: "FAQ", href: "/faq" },
    ],
    shop: { label: "Boutique", href: "/formats/poudre#packs" },
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
    testTrack: "Piste en test",
    prelaunch: "Pré-lancement",
    priceIndicative: "Prix indicatif, non définitif",
    priceAbsent: "Prix fixé après validation du fournisseur",
  },

  hero: {
    title: "Le matcha, en plus simple.",
    subtitle:
      "Une dose de matcha dans un stick. Vous l'ouvrez, vous la versez, vous la préparez en un geste.",
    formatShown: "Format présenté",
    ctaPrelaunch: "Être prévenu du lancement",
    ctaSale: "Découvrir les packs",
    ctaSecondary: "Voir le geste",
    prelaunchLine: "Le premier lot se prépare. Soyez prévenu du lancement.",
  },

  gesture: {
    title: "Ouvrir. Verser. Préparer.",
    intro:
      "Trois gestes, et la portion est déjà mesurée. Le texte et l'image montrent exactement la même chose.",
    hot: "Chaud",
    iced: "Glacé",
    format: "Format",
    temperature: "Température",
    hotDetail: "Lait ou eau chaude, pas bouillante",
    icedDetail: "Lait froid et glaçons",
    stepPowder: [
      "Déchirez le stick au niveau de l'encoche.",
      "Versez la poudre dans le verre ou la tasse.",
      "Fouettez, moussez ou secouez : la poudre se répartit, la couleur devient uniforme.",
    ],
    stepConcentrate: [
      "Déchirez le haut du sachet.",
      "Versez le concentré dans le lait.",
      "Quelques tours de cuillère, et la couleur s'uniformise.",
    ],
    volumesPending: "Volumes et temps : en cours de test.",
  },

  formats: {
    title: "Deux formats, une marque.",
    intro:
      "La poudre est notre priorité. Le concentré est développé en parallèle et n'arrivera qu'après ses propres tests.",
    compareCaption: "Comparer les deux formats",
    rows: {
      preparation: "Préparation",
      equipment: "Matériel",
      serving: "Portion",
      composition: "Composition",
      uses: "Usages",
      pricePerDrink: "Prix par boisson",
      storage: "Conservation",
    },
    uses: {
      poudre: "Maison, bureau, campus. Avec un shaker en déplacement.",
      concentre: "Partout où une cuillère suffit, si la formule le permet.",
    },
    packsTitle: "Les packs",
    packsIntro:
      "Les quantités et les prix seront fixés après les devis fournisseurs. Rien n'est en vente aujourd'hui.",
    doses: "doses",
    seeFamily: "Voir la fiche",
  },

  box: {
    open: "Ouvrir la boîte",
    close: "Refermer la boîte",
    choose: "Choisir un pack",
    countLabel: (n: number) => `${n} doses dans cette boîte`,
  },

  dose: {
    title: "Ma dose",
    intro: "Combien de matchas buvez-vous par semaine ? On calcule le pack qui vous irait.",
    perWeek: "Matchas par semaine",
    perMonth: "Doses par mois",
    advice: "Pack conseillé",
    lasts: "Durée d'un pack",
    days: (n: number) => (n >= 14 ? `environ ${Math.round(n / 7)} semaines` : `environ ${n} jours`),
    pricePerDrink: "Prix par boisson",
  },

  flavour: {
    title: "À votre goût.",
    intro:
      "Original d'abord. Vanille et Fraise sont des pistes : dites-nous si elles vous donnent envie, on les développera dans cet ordre.",
    ingredients: "Ingrédients",
    status: "Statut",
    interestTest: "Je veux goûter celui-ci",
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
    loupeTitle: "Sous la loupe",
    hotspots: {
      powder: "La poudre",
      pack: "Le sachet",
      seal: "La soudure",
      batch: "Le lot",
    },
    suspensionTitle: "Suspension, pas dissolution.",
    suspensionText:
      "La poudre de matcha ne fond pas : ce sont des feuilles broyées très finement. Sans mouvement, elle retombe. Remuez la boîte ci-contre pour le voir.",
    suspensionHint: "Glissez le doigt ou la souris dans le verre pour remuer.",
    suspensionStill: "Au repos, la poudre retombe.",
  },

  ritual: {
    title: "Pourquoi c'est plus simple.",
    quote: "Le rituel a sa beauté. Le stick, lui, tient dans une poche.",
    intro: "Comparé pour une seule boisson. On simplifie le geste, pas la culture du thé.",
    traditional: "Rituel traditionnel",
    matocha: "Stick Matocha",
    handle: "Comparer le rituel et le stick",
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
    interests: "Ce qui vous intéresse",
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
    formats: "Voir les formats",
    sweep: "Passez la souris sur la poudre pour la balayer.",
  },

  loading: "Chargement",
} as const;

export type Copy = typeof fr;
