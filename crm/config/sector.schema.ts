import { z } from "zod";

/**
 * Schéma de la fiche secteur. Toute la configuration métier (vocabulaire,
 * zones, étapes du dossier, KPI, scénario de démo) passe par ici : aucun
 * composant ne doit coder ces valeurs en dur.
 */

const id = z.string().regex(/^[a-z0-9_]+$/, "identifiant snake_case attendu");
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "couleur hexadécimale attendue");

export const zoneTypeSchema = z.enum([
  "accueil",
  "bar",
  "open_space",
  "studio",
  "reunion",
  "direction",
  "labo",
  "detente",
  "technique",
  "reception",
  "quarantaine",
  "stock",
  "preparation",
  "expedition",
  "echantillotheque",
  "vestiaire",
  "exterieur",
]);

export const zoneSchema = z.object({
  code: z.string().min(2).max(4),
  id,
  nom: z.string(),
  type: zoneTypeSchema,
  aile: z.enum(["bureaux", "atelier", "exterieur"]),
  sol: z.enum(["parquet_clair", "beton_cire", "tatami", "carrelage", "moquette", "resine", "paves", "gazon", "enrobe"]),
  capacite: z.number().int().nonnegative(),
  description: z.string(),
});

export const stageSchema = z.object({
  id,
  libelle: z.string(),
  description: z.string(),
  zone: id.optional(),
  dureeCibleH: z.number().positive(),
});

export const roleSchema = z.object({
  id,
  libelle: z.string(),
  description: z.string(),
  voitSalaires: z.boolean(),
  editePlan: z.boolean(),
});

export const posteSchema = z.object({
  id,
  intitule: z.string(),
  departement: id,
  effectif: z.number().int().positive(),
  zone: id,
  tenue: z.enum(["tablier_vert", "tshirt_ivoire", "chemise", "pull", "gilet_securite", "veste_cuisine"]),
  accessoire: z.enum(["aucun", "tablette", "carton", "scanner", "camera", "fouet", "casque", "classeur"]).default("aucun"),
  brutAnnuelEUR: z.tuple([z.number().int(), z.number().int()]),
  roleApp: id,
});

export const kpiSchema = z.object({
  id,
  libelle: z.string(),
  unite: z.enum(["nombre", "pourcent", "eur"]),
  sousTitre: z.string(),
  source: z.string().describe("vue SQL ou fonction Postgres qui calcule la valeur"),
});

export const liveEventSchema = z.object({
  id,
  t: z.number().nonnegative().describe("seconde après la fin de l'intro"),
  type: z.string(),
  titre: z.string(),
  detail: z.string(),
  zone: id,
  effets: z.array(z.string()),
});

export const sectorConfigSchema = z.object({
  entreprise: z.object({
    nom: z.string(),
    nomCourt: z.string(),
    statutDemo: z.string(),
    secteur: z.string(),
    activite: z.string(),
    villePays: z.string(),
    pays: z.string().length(2),
    langueInterface: z.enum(["fr", "en", "de", "it"]),
    languesSecondaires: z.array(z.enum(["fr", "en", "de", "it"])),
    locale: z.string(),
    fuseau: z.string(),
    devise: z.string().length(3),
    tva: z.object({
      standard: z.number(),
      reduit: z.number(),
      arrondi: z.number().positive(),
      note: z.string(),
    }),
    logo: z.string(),
    couleurs: z.object({
      identite: hex,
      identiteProfonde: hex,
      matcha: hex,
      accent: hex,
      fond: hex,
      fondProfond: hex,
      encre: hex,
    }),
    ambiance: z.string(),
  }),

  vocabulaire: z.record(z.string(), z.object({ singulier: z.string(), pluriel: z.string() })),

  lieux: z
    .array(
      z.object({
        id,
        nom: z.string(),
        adresse: z.string(),
        forme: z.string(),
        surfaceM2: z.number().positive(),
        zones: z.array(zoneSchema).min(3),
      }),
    )
    .min(1)
    .max(3),

  objetMetierCentral: z.object({
    nom: z.string(),
    nomPluriel: z.string(),
    prefixeReference: z.string(),
    etapes: z.array(stageSchema).min(5).max(7),
    objetPhysiqueAssocie: z.string(),
    fluxSecondaire: z.string(),
  }),

  departements: z.array(z.object({ id, nom: z.string() })),
  postes: z.array(posteSchema),

  objetsCliquables: z.object({
    personnes: z.array(z.string()),
    vehicules: z.array(z.string()),
    postesEquipements: z.array(z.string()),
    stock: z.array(z.string()),
    autres: z.array(z.string()),
  }),

  kpisEnTete: z.array(kpiSchema).length(3),
  evenementsLiveDeDemo: z.array(liveEventSchema).min(4).max(6),
  notificationsAmbiance: z.array(z.string()).min(5),
  modulesPrioritaires: z.array(z.enum(["pilotage", "operations", "ressources", "commercial", "finance", "rh", "communication", "ia", "organisation"])),
  integrations: z.array(
    z.object({ id, nom: z.string(), mode: z.enum(["simule", "connecte"]), usage: z.string() }),
  ),
  roles: z.array(roleSchema),
  hud: z.object({ miseEnPage: z.enum(["A", "B", "hybride"]), description: z.string() }),
});

export type SectorConfig = z.infer<typeof sectorConfigSchema>;
