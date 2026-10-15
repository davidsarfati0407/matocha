import { sectorConfigSchema, type SectorConfig } from "./sector.schema";

/**
 * Fiche secteur — MATOCHA (démo).
 *
 * La marque est réelle (ce dépôt), mais l'entreprise représentée ici est une
 * PROJECTION FICTIVE à l'an 3 : équipe, locaux, clients, montants et noms sont
 * inventés pour la démonstration. Aujourd'hui, MATOCHA est un projet porté par
 * son fondateur, avant le premier lot de production.
 */
const config: SectorConfig = {
  entreprise: {
    nom: "MATOCHA SAS",
    nomCourt: "MATOCHA",
    statutDemo: "Projection fictive an 3 — données de démonstration",
    secteur: "Marque DTC de matcha premium (e-commerce alimentaire + vente aux pros)",
    activite:
      "Matcha japonais premium en sticks de 2 g. Vente en ligne aux particuliers (boîte de 30, abonnement) et aux professionnels (cafés, hôtels, concept stores, cadeaux d'entreprise).",
    villePays: "Montreuil (Grand Paris), France",
    pays: "FR",
    langueInterface: "fr",
    languesSecondaires: ["en"],
    locale: "fr-FR",
    fuseau: "Europe/Paris",
    devise: "EUR",
    tva: {
      standard: 0.2,
      reduit: 0.055,
      arrondi: 0.01,
      note: "Thé (denrée alimentaire) au taux réduit de 5,5 % ; accessoires (verre, fouet) à 20 %. À faire confirmer par l'expert-comptable.",
    },
    logo: "existant — composant MatochaLogo du site",
    couleurs: {
      identite: "#173D2B",
      identiteProfonde: "#0F2A1E",
      matcha: "#79A84B",
      accent: "#E07A5F",
      fond: "#F3EFE5",
      fondProfond: "#E7E1D2",
      encre: "#161713",
    },
    ambiance:
      "Japonais minimal chaleureux : bois clair type hinoki, enduit ivoire, béton ciré, tatamis, verre fin, bambous. Vert profond pour la marque, corail pour l'interaction.",
  },

  vocabulaire: {
    workOrder: { singulier: "commande pro", pluriel: "commandes pro" },
    client: { singulier: "compte", pluriel: "comptes" },
    clientParticulier: { singulier: "client", pluriel: "clients" },
    devis: { singulier: "devis", pluriel: "devis" },
    lot: { singulier: "lot", pluriel: "lots" },
    colis: { singulier: "colis", pluriel: "colis" },
    employe: { singulier: "collaborateur", pluriel: "collaborateurs" },
    zone: { singulier: "espace", pluriel: "espaces" },
  },

  lieux: [
    {
      id: "maison_montreuil",
      nom: "Maison MATOCHA",
      adresse: "14 rue des Glycines, 93100 Montreuil (adresse fictive)",
      forme:
        "Ancienne usine en L réhabilitée : aile bureaux & studio (verrière), aile atelier & expédition (sheds), cour intérieure plantée de bambous entre les deux, angle coupé côté rue avec le bar à matcha vitré.",
      surfaceM2: 1450,
      zones: [
        { code: "BAR", id: "bar", nom: "Bar à matcha & showroom", type: "bar", aile: "bureaux", sol: "parquet_clair", capacite: 14, description: "Accueil des visiteurs et des pros, dégustation, comptoir en bois, étagère des boîtes." },
        { code: "ACC", id: "accueil", nom: "Accueil", type: "accueil", aile: "bureaux", sol: "parquet_clair", capacite: 4, description: "Badgeuse, banque d'accueil, salle d'attente visiteurs." },
        { code: "OS", id: "open_space", nom: "Open space", type: "open_space", aile: "bureaux", sol: "parquet_clair", capacite: 16, description: "Marketing, e-commerce, ventes pros, service client, finance." },
        { code: "STU", id: "studio", nom: "Studio contenu", type: "studio", aile: "bureaux", sol: "beton_cire", capacite: 5, description: "Tournage TikTok/Instagram : fond infini ivoire, softbox, caméra sur trépied, plan de travail." },
        { code: "UJI", id: "salle_uji", nom: "Salle Uji", type: "reunion", aile: "bureaux", sol: "tatami", capacite: 8, description: "Grande salle de réunion, écran mural, table basse en bois." },
        { code: "SHZ", id: "salle_shizuoka", nom: "Salle Shizuoka", type: "reunion", aile: "bureaux", sol: "moquette", capacite: 4, description: "Petite salle / visio." },
        { code: "DIR", id: "direction", nom: "Bureau direction", type: "direction", aile: "bureaux", sol: "parquet_clair", capacite: 2, description: "Bureau du fondateur et de la DG." },
        { code: "LAB", id: "labo", nom: "Labo dégustation & R&D", type: "labo", aile: "bureaux", sol: "carrelage", capacite: 4, description: "Dégustation à l'aveugle, grille de notation, balance de précision, nouvelles recettes." },
        { code: "DET", id: "detente", nom: "Espace détente", type: "detente", aile: "bureaux", sol: "parquet_clair", capacite: 10, description: "Cuisine, ping-pong, canapés, machine à café pour les irréductibles." },
        { code: "TEC", id: "technique", nom: "Local technique", type: "technique", aile: "bureaux", sol: "resine", capacite: 1, description: "Baie serveur, imprimante multifonction." },
        { code: "QUA", id: "quai", nom: "Quai de réception", type: "reception", aile: "atelier", sol: "beton_cire", capacite: 3, description: "Arrivée des lots du Japon et des consommables, déchargement des palettes." },
        { code: "QC", id: "quarantaine", nom: "Quarantaine & contrôle qualité", type: "quarantaine", aile: "atelier", sol: "resine", capacite: 3, description: "Lots bloqués jusqu'à validation : COA, pesée, test d'ouverture, dégustation." },
        { code: "STK", id: "stock", nom: "Stock", type: "stock", aile: "atelier", sol: "resine", capacite: 2, description: "Rayonnages A à D : boîtes, sticks, coffrets, accessoires, consommables d'emballage. Local tempéré, relevé de température." },
        { code: "PRE", id: "preparation", nom: "Préparation des commandes", type: "preparation", aile: "atelier", sol: "beton_cire", capacite: 8, description: "Quatre tables de pack, imprimante d'étiquettes, carte manuscrite." },
        { code: "EXP", id: "expedition", nom: "Expédition", type: "expedition", aile: "atelier", sol: "beton_cire", capacite: 3, description: "Colis triés par transporteur, palettes pros filmées, enlèvement à 15 h." },
        { code: "ECH", id: "echantillotheque", nom: "Échantillothèque", type: "echantillotheque", aile: "atelier", sol: "resine", capacite: 1, description: "3 boîtes scellées par lot, conservées jusqu'à DDM + 6 mois, armoire à température suivie." },
        { code: "VES", id: "vestiaire", nom: "Vestiaire atelier", type: "vestiaire", aile: "atelier", sol: "carrelage", capacite: 6, description: "Casiers, tabliers verts." },
        { code: "COU", id: "cour", nom: "Cour aux bambous", type: "exterieur", aile: "exterieur", sol: "paves", capacite: 20, description: "Cour intérieure plantée, tables extérieures, vélos." },
        { code: "PAR", id: "parking", nom: "Cour de service & parking", type: "exterieur", aile: "exterieur", sol: "enrobe", capacite: 6, description: "Utilitaire électrique, vélo-cargo, place camion transporteur." },
        { code: "RUE", id: "rue", nom: "Rue des Glycines", type: "exterieur", aile: "exterieur", sol: "enrobe", capacite: 0, description: "Circulation de fond, trottoir, arbres d'alignement." },
      ],
    },
  ],

  objetMetierCentral: {
    nom: "commande pro",
    nomPluriel: "commandes pro",
    prefixeReference: "CP",
    etapes: [
      { id: "confirmee", libelle: "Confirmée", description: "Devis signé ou réassort validé ; stock réservé.", zone: "open_space", dureeCibleH: 4 },
      { id: "preparation", libelle: "Préparation", description: "Picking par lot (FEFO) et mise en carton.", zone: "preparation", dureeCibleH: 6 },
      { id: "controle", libelle: "Contrôle", description: "Pesée, vérification des lots et des DDM, photo du colis.", zone: "quarantaine", dureeCibleH: 2 },
      { id: "expedition", libelle: "Expédition", description: "Étiquette transporteur, enlèvement à quai.", zone: "expedition", dureeCibleH: 4 },
      { id: "livree", libelle: "Livrée", description: "Preuve de livraison reçue.", dureeCibleH: 48 },
      { id: "facturee", libelle: "Facturée", description: "Facture émise, paiement suivi jusqu'à encaissement.", dureeCibleH: 24 },
    ],
    objetPhysiqueAssocie: "les colis ou la palette de la commande, visibles sur les tables de pack, au contrôle puis au quai",
    fluxSecondaire:
      "Commandes en ligne des particuliers (DTC) : volume agrégé, visible en direct sur les tables de pack et dans les KPI, sans fiche dossier individuelle sur la map.",
  },

  departements: [
    { id: "direction", nom: "Direction" },
    { id: "marque", nom: "Marque & contenu" },
    { id: "growth", nom: "Growth & e-commerce" },
    { id: "ventes", nom: "Ventes pros" },
    { id: "service_client", nom: "Service client" },
    { id: "produit", nom: "Produit & qualité" },
    { id: "logistique", nom: "Logistique" },
    { id: "finance_rh", nom: "Finance & RH" },
    { id: "bar", nom: "Bar & showroom" },
  ],

  postes: [
    { id: "fondateur", intitule: "Fondateur & président", departement: "direction", effectif: 1, zone: "direction", tenue: "pull", accessoire: "aucun", brutAnnuelEUR: [85000, 95000], roleApp: "direction" },
    { id: "dg", intitule: "Directrice générale", departement: "direction", effectif: 1, zone: "direction", tenue: "chemise", accessoire: "tablette", brutAnnuelEUR: [80000, 90000], roleApp: "direction" },
    { id: "head_brand", intitule: "Responsable marque", departement: "marque", effectif: 1, zone: "open_space", tenue: "pull", accessoire: "aucun", brutAnnuelEUR: [55000, 62000], roleApp: "manager" },
    { id: "createur", intitule: "Créateur·rice de contenu", departement: "marque", effectif: 2, zone: "studio", tenue: "tshirt_ivoire", accessoire: "camera", brutAnnuelEUR: [36000, 42000], roleApp: "employe" },
    { id: "monteur", intitule: "Monteur vidéo", departement: "marque", effectif: 1, zone: "studio", tenue: "tshirt_ivoire", accessoire: "casque", brutAnnuelEUR: [36000, 40000], roleApp: "employe" },
    { id: "designer", intitule: "Designer graphique", departement: "marque", effectif: 1, zone: "open_space", tenue: "pull", accessoire: "aucun", brutAnnuelEUR: [38000, 44000], roleApp: "employe" },
    { id: "community", intitule: "Community manager", departement: "marque", effectif: 1, zone: "open_space", tenue: "tshirt_ivoire", accessoire: "aucun", brutAnnuelEUR: [34000, 38000], roleApp: "employe" },
    { id: "ecom_manager", intitule: "Responsable e-commerce", departement: "growth", effectif: 1, zone: "open_space", tenue: "chemise", accessoire: "aucun", brutAnnuelEUR: [50000, 58000], roleApp: "manager" },
    { id: "media_buyer", intitule: "Media buyer", departement: "growth", effectif: 1, zone: "open_space", tenue: "pull", accessoire: "aucun", brutAnnuelEUR: [42000, 50000], roleApp: "employe" },
    { id: "crm_manager", intitule: "Chargée CRM & e-mailing", departement: "growth", effectif: 1, zone: "open_space", tenue: "chemise", accessoire: "aucun", brutAnnuelEUR: [38000, 44000], roleApp: "employe" },
    { id: "dev_shop", intitule: "Développeur boutique", departement: "growth", effectif: 1, zone: "open_space", tenue: "tshirt_ivoire", accessoire: "casque", brutAnnuelEUR: [48000, 56000], roleApp: "employe" },
    { id: "head_sales", intitule: "Responsable ventes pros", departement: "ventes", effectif: 1, zone: "open_space", tenue: "chemise", accessoire: "tablette", brutAnnuelEUR: [52000, 60000], roleApp: "commercial" },
    { id: "account_manager", intitule: "Chargé·e de comptes pros", departement: "ventes", effectif: 2, zone: "open_space", tenue: "chemise", accessoire: "aucun", brutAnnuelEUR: [36000, 42000], roleApp: "commercial" },
    { id: "service_client", intitule: "Conseiller·ère service client", departement: "service_client", effectif: 2, zone: "open_space", tenue: "tshirt_ivoire", accessoire: "casque", brutAnnuelEUR: [27000, 30000], roleApp: "employe" },
    { id: "qualite", intitule: "Responsable qualité & conformité", departement: "produit", effectif: 1, zone: "quarantaine", tenue: "veste_cuisine", accessoire: "classeur", brutAnnuelEUR: [46000, 52000], roleApp: "manager" },
    { id: "sourcing", intitule: "Responsable sourcing Japon", departement: "produit", effectif: 1, zone: "labo", tenue: "pull", accessoire: "aucun", brutAnnuelEUR: [48000, 55000], roleApp: "manager" },
    { id: "rd", intitule: "Chargée R&D & dégustation", departement: "produit", effectif: 1, zone: "labo", tenue: "veste_cuisine", accessoire: "fouet", brutAnnuelEUR: [36000, 41000], roleApp: "employe" },
    { id: "head_logistique", intitule: "Responsable logistique", departement: "logistique", effectif: 1, zone: "preparation", tenue: "gilet_securite", accessoire: "tablette", brutAnnuelEUR: [42000, 48000], roleApp: "operations" },
    { id: "preparateur", intitule: "Préparateur·rice de commandes", departement: "logistique", effectif: 4, zone: "preparation", tenue: "tablier_vert", accessoire: "scanner", brutAnnuelEUR: [23000, 25500], roleApp: "employe" },
    { id: "receptionnaire", intitule: "Réceptionnaire / cariste", departement: "logistique", effectif: 1, zone: "quai", tenue: "gilet_securite", accessoire: "carton", brutAnnuelEUR: [25000, 27500], roleApp: "employe" },
    { id: "daf", intitule: "Directeur administratif & financier", departement: "finance_rh", effectif: 1, zone: "open_space", tenue: "chemise", accessoire: "aucun", brutAnnuelEUR: [65000, 75000], roleApp: "finance" },
    { id: "comptable", intitule: "Comptable", departement: "finance_rh", effectif: 1, zone: "open_space", tenue: "pull", accessoire: "classeur", brutAnnuelEUR: [36000, 41000], roleApp: "finance" },
    { id: "rh", intitule: "Responsable RH & office manager", departement: "finance_rh", effectif: 1, zone: "accueil", tenue: "chemise", accessoire: "aucun", brutAnnuelEUR: [42000, 48000], roleApp: "rh" },
    { id: "barista", intitule: "Barista & hôte·sse showroom", departement: "bar", effectif: 2, zone: "bar", tenue: "tablier_vert", accessoire: "fouet", brutAnnuelEUR: [24000, 27000], roleApp: "employe" },
  ],

  objetsCliquables: {
    personnes: ["collaborateurs (24 postes, 32 personnes)", "visiteurs pros au bar", "livreurs et chauffeurs transporteurs", "candidat en entretien"],
    vehicules: ["utilitaire électrique MATOCHA", "vélo-cargo de livraison Paris", "camion du transporteur (enlèvement 15 h)", "porteur d'arrivage des lots", "circulation de fond sur la rue"],
    postesEquipements: [
      "postes informatiques (écran animé selon l'application)",
      "tables de pack ×4 avec imprimante d'étiquettes",
      "balances de précision (labo, contrôle)",
      "thermoscelleuse",
      "transpalette électrique",
      "set de tournage (caméra, softbox, fond infini)",
      "machine à matcha et fouets électriques du bar",
      "imprimante multifonction",
      "baie serveur",
      "armoire de l'échantillothèque (température en direct)",
    ],
    stock: ["rayonnages A à D (Daily Box, Discovery Box, coffrets, accessoires, consommables d'emballage)", "palettes de lots en quarantaine", "colis prêts à partir"],
    autres: ["badgeuse", "salles Uji et Shizuoka", "écran mural « ventes en direct »", "table de ping-pong", "céramique de Tokoname (œuvre décorative, fictive)"],
  },

  kpisEnTete: [
    { id: "commandes_jour", libelle: "Commandes du jour", unite: "nombre", sousTitre: "en ligne + pros · vs hier", source: "kpi_orders_today()" },
    { id: "expedie_avant_15h", libelle: "Expédiées à temps", unite: "pourcent", sousTitre: "avant l'enlèvement de 15 h · 30 j", source: "kpi_shipped_on_time()" },
    { id: "ca_jour", libelle: "CA du jour", unite: "eur", sousTitre: "HT · objectif journalier", source: "kpi_revenue_today()" },
  ],

  evenementsLiveDeDemo: [
    { id: "arrivee_preparatrice", t: 6, type: "badge.entree", titre: "Arrivée · Préparation", detail: "Une préparatrice arrive à pied par la cour, badge à l'accueil et rejoint la table de pack 3 ; son scanner s'allume.", zone: "preparation", effets: ["marche", "badge_event", "kpi:presence"] },
    { id: "arrivage_lot", t: 18, type: "lot.recu", titre: "Lot reçu du Japon", detail: "Le porteur recule à quai, le cariste décharge une palette au transpalette ; le lot passe en quarantaine.", zone: "quai", effets: ["vehicule_arrivee", "marche_arriere", "stock_movement", "notification"] },
    { id: "etape_controle", t: 30, type: "commande_pro.etape", titre: "Commande pro au contrôle", detail: "La commande d'un café partenaire (fictif) passe de Préparation à Contrôle : le colis glisse vers la balance, la responsable qualité pèse.", zone: "quarantaine", effets: ["work_order_stage", "suivi_stepper", "tableau"] },
    { id: "pause_matcha", t: 42, type: "badge.pause", titre: "Pause matcha", detail: "Un créateur de contenu badge sa pause, traverse la cour et commande au bar ; puis ping-pong. La fiche « Espace détente » se met à jour.", zone: "detente", effets: ["marche", "pose_cafe", "pose_jeu", "badge_event"] },
    { id: "devis_signe", t: 55, type: "devis.signe", titre: "Devis signé", detail: "Un hôtel parisien (fictif) signe son devis de réassort : la commande pro est créée, le KPI CA du jour monte.", zone: "open_space", effets: ["kpi_flash:ca_jour", "work_order_cree", "notification"] },
    { id: "enlevement_15h", t: 68, type: "expedition.enlevement", titre: "Enlèvement transporteur", detail: "Le camion du transporteur arrive en cour de service, les colis du jour sont chargés, il repart ; « Expédiées à temps » se met à jour.", zone: "expedition", effets: ["vehicule_arrivee", "vehicule_depart", "kpi_flash:expedie_avant_15h"] },
  ],

  notificationsAmbiance: [
    "Pic de commandes : +38 en 10 min après la vidéo TikTok du matin",
    "Stock bas : cartons d'expédition S (seuil 400)",
    "Avis client 5★ : « enfin un matcha qui se prépare au bureau »",
    "Salle Uji réservée 14 h – 15 h · point lancement Discovery Box",
    "Ticket SAV résolu : colis abîmé, renvoi effectué",
    "Échantillothèque : relevé de température OK (17,8 °C)",
    "Abonnement : 12 nouveaux abonnés aujourd'hui",
    "Paiement reçu : facture pro réglée par virement",
  ],

  modulesPrioritaires: ["pilotage", "operations", "ressources", "commercial", "finance", "rh", "communication", "ia", "organisation"],

  integrations: [
    { id: "google_workspace", nom: "Google Workspace (Gmail, Agenda, Drive)", mode: "simule", usage: "Messagerie, agendas, documents par compte pro." },
    { id: "microsoft_365", nom: "Microsoft 365 (Outlook, Teams, OneDrive)", mode: "simule", usage: "Alternative branchable, même interface d'adaptateur." },
    { id: "boutique_en_ligne", nom: "Boutique en ligne (commandes DTC)", mode: "simule", usage: "Flux des commandes particuliers et des abonnements, via adaptateur." },
    { id: "transporteur", nom: "Transporteur (étiquettes, suivi)", mode: "simule", usage: "Étiquettes et preuves de livraison." },
  ],

  roles: [
    { id: "direction", libelle: "Direction", description: "Accès complet, salaires inclus.", voitSalaires: true, editePlan: true, droits: { pilotage: "*", communication: "*", commercial: "*", operations: "*", rh: "*", salaires: "*", finance: "*", ressources: "*", ia: "*", organisation: "*", plan: "*" }, compteDemo: { email: "direction@matocha.demo", poste: "fondateur" } },
    { id: "admin", libelle: "Administrateur", description: "Paramètres, plan 3D, utilisateurs. Pas les salaires.", voitSalaires: false, editePlan: true, droits: { pilotage: "*", communication: "*", commercial: "*", operations: "*", rh: ["read"], finance: ["read"], ressources: "*", ia: "*", organisation: "*", plan: "*" }, compteDemo: { email: "admin@matocha.demo", poste: "dev_shop" } },
    { id: "rh", libelle: "RH", description: "Collaborateurs, présences, congés, salaires, recrutement.", voitSalaires: true, editePlan: false, droits: { pilotage: ["read"], communication: ["read", "create", "update"], rh: "*", salaires: "*", operations: ["read"], ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "rh@matocha.demo", poste: "rh" } },
    { id: "finance", libelle: "Finance", description: "Factures, paiements, frais, trésorerie, masse salariale agrégée.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read", "export"], communication: ["read", "create", "update"], commercial: ["read", "export"], operations: ["read"], finance: "*", ressources: ["read"], rh: ["read"], ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "finance@matocha.demo", poste: "daf" } },
    { id: "operations", libelle: "Opérations", description: "Commandes pro, stock, lots, expéditions, équipements.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read"], communication: ["read", "create", "update"], commercial: ["read"], operations: "*", ressources: "*", ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "operations@matocha.demo", poste: "head_logistique" } },
    { id: "commercial", libelle: "Commercial", description: "Comptes, pipeline, devis, commandes pro.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read"], communication: "*", commercial: "*", operations: ["read", "create", "update"], ressources: ["read"], finance: ["read"], ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "commercial@matocha.demo", poste: "head_sales" } },
    { id: "manager", libelle: "Manager", description: "Son équipe : présences, congés à valider, heures.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read"], communication: ["read", "create", "update"], operations: ["read", "update"], rh: ["read"], ressources: ["read"], ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "manager@matocha.demo", poste: "head_brand" } },
    { id: "employe", libelle: "Collaborateur", description: "Ses propres données, map, annuaire.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read"], communication: ["read", "create"], operations: ["read"], ressources: ["read"], ia: ["read", "create"], plan: ["read"] }, compteDemo: { email: "employe@matocha.demo", poste: "preparateur" } },
    { id: "lecture", libelle: "Lecture seule", description: "Map et tableaux de bord, sans données personnelles sensibles.", voitSalaires: false, editePlan: false, droits: { pilotage: ["read"], plan: ["read"] }, compteDemo: { email: "lecture@matocha.demo" } },
  ],

  objectifCaJournalierHT: 9000,

  hud: {
    miseEnPage: "hybride",
    description:
      "Barre supérieure pleine largeur (A) + rail gauche fin de raccourcis d'espaces (B) ; 3 KPI en haut à gauche ; fiche à droite ; suivi de commande pro en dock bas-centre ; tableau à onglets (Préparation · Équipe · Commandes pro · Stock) en bas à droite.",
  },
};

export const sectorConfig = sectorConfigSchema.parse(config);
export default sectorConfig;
