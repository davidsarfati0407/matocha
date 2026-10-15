/**
 * Génère supabase/seed.sql à partir de la fiche secteur.
 *
 *   pnpm db:seed:gen
 *
 * - Identifiants déterministes (UUID dérivés d'un nom) : les liens profonds
 *   restent stables d'une réinitialisation à l'autre.
 * - Dates relatives à « aujourd'hui » évaluées AU MOMENT DU SEED (fonctions
 *   app.local_ts / app.local_date) : la démo est toujours fraîche.
 * - Les historiques volumineux (badges, commandes en ligne) sont produits en SQL
 *   (generate_series) pour sauter les week-ends du jour d'exécution réel.
 * - Toutes les personnes, entreprises, plaques et numéros sont FICTIFS.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sectorConfig as C } from "../config/sector.config";
import { computeTotals } from "../lib/domain/money";

// ------------------------------------------------------------------ outils
type Raw = { raw: string };
type Val = string | number | boolean | null | undefined | Raw | string[];
type Row = Record<string, Val>;

const raw = (s: string): Raw => ({ raw: s });
const uid = (key: string) => {
  const h = createHash("sha1").update(`matocha:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lit = (v: Val): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "object" && !Array.isArray(v)) return v.raw;
  if (Array.isArray(v)) return `array[${v.map(q).join(",")}]::text[]`;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return q(v);
};
const json = (o: unknown) => raw(`${q(JSON.stringify(o))}::jsonb`);
const ts = (day: number, hm: string) => raw(`app.local_ts(${day}, ${q(hm)})`);
const date = (day: number) => raw(`app.local_date(${day})`);
const rel = (minutes: number) => raw(`now() + interval '${minutes} minutes'`);

// PRNG déterministe (mulberry32)
let seed = 20261015;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const between = (a: number, b: number) => a + rnd() * (b - a);
const hm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.round(minutes % 60)).padStart(2, "0")}`;

const out: string[] = [];
const sql = (s: string) => out.push(s.trim() + "\n");
function insert(table: string, rows: Row[]) {
  if (!rows.length) return;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    out.push(
      `insert into public.${table} (${cols.join(", ")}) values\n` +
        chunk.map((r) => `  (${cols.map((c) => (c in r ? lit(r[c]) : "default")).join(", ")})`).join(",\n") +
        ";\n",
    );
  }
}

// ------------------------------------------------------------------ organisation
const ORG = uid("org");
const site = C.lieux[0];
const SITE = uid(`site:${site.id}`);
const DEMO_PASSWORD = "matocha-demo";

sql(`-- =====================================================================
-- SEED DE DÉMONSTRATION — ${C.entreprise.nom}
-- ${C.entreprise.statutDemo}
-- Généré par scripts/gen-seed.ts depuis config/sector.config.ts : ne pas éditer à la main.
-- Toutes les personnes, entreprises, plaques et numéros sont fictifs.
-- =====================================================================
select set_config('app.seeding', 'on', false);
`);

insert("orgs", [
  {
    id: ORG,
    slug: "matocha",
    name: C.entreprise.nomCourt,
    legal_name: C.entreprise.nom,
    country: C.entreprise.pays,
    locale: C.entreprise.locale,
    timezone: C.entreprise.fuseau,
    currency: C.entreprise.devise,
    vat_standard: C.entreprise.tva.standard,
    vat_reduced: C.entreprise.tva.reduit,
    rounding: C.entreprise.tva.arrondi,
    demo_mode: true,
    settings: json({ daily_revenue_target: C.objectifCaJournalierHT, pickup_time: "15:00", demo_notice: C.entreprise.statutDemo }),
  },
]);

// Rôles et matrice de droits
const ALL_ACTIONS = ["read", "create", "update", "delete", "export"] as const;
insert(
  "roles",
  C.roles.map((r) => ({ id: uid(`role:${r.id}`), org_id: ORG, key: r.id, label: r.libelle, description: r.description, sees_salaries: r.voitSalaires, edits_plan: r.editePlan })),
);
insert(
  "permissions",
  C.roles.flatMap((r) =>
    Object.entries(r.droits).flatMap(([module, actions]) =>
      (actions === "*" ? ALL_ACTIONS : actions).map((a) => ({ org_id: ORG, role_id: uid(`role:${r.id}`), module, action: a })),
    ),
  ),
);

insert("sites", [{ id: SITE, org_id: ORG, slug: site.id, name: site.nom, address: site.adresse, timezone: C.entreprise.fuseau, surface_m2: site.surfaceM2 }]);
const Z = (key: string) => uid(`zone:${key}`);
insert(
  "zones",
  site.zones.map((z) => ({ id: Z(z.id), org_id: ORG, site_id: SITE, key: z.id, code: z.code, name: z.nom, type: z.type, wing: z.aile, floor_material: z.sol, capacity: z.capacite, description: z.description })),
);
insert("floor_plans", [{ id: uid("plan:v1"), org_id: ORG, site_id: SITE, version: 1, status: "draft", layout: json({ generated: false, note: "Plan généré en phase 2 depuis la fiche secteur" }) }]);
insert("departments", C.departements.map((d) => ({ id: uid(`dept:${d.id}`), org_id: ORG, key: d.id, name: d.nom })));

// ------------------------------------------------------------------ collaborateurs (fictifs)
const NAMES: Record<string, [string, string][]> = {
  fondateur: [["Hugo", "Marchal"]],
  dg: [["Claire", "Ostrowski"]],
  head_brand: [["Inès", "Belkacem"]],
  createur: [["Léo", "Garnier"], ["Maëlle", "Tran"]],
  monteur: [["Sacha", "Lemoine"]],
  designer: [["Jade", "Morel"]],
  community: [["Yanis", "Haddad"]],
  ecom_manager: [["Camille", "Vasseur"]],
  media_buyer: [["Théo", "Brunet"]],
  crm_manager: [["Sarah", "Cohen"]],
  dev_shop: [["Antoine", "Nakamura"]],
  head_sales: [["Julien", "Mercier"]],
  account_manager: [["Nadia", "Benali"], ["Romain", "Faure"]],
  service_client: [["Lucie", "Perrin"], ["Moussa", "Diallo"]],
  qualite: [["Hélène", "Roussel"]],
  sourcing: [["Kenji", "Watanabe"]],
  rd: [["Emma", "Lefèvre"]],
  head_logistique: [["Karim", "Saïdi"]],
  preparateur: [["Manon", "Girard"], ["Bastien", "Roy"], ["Aïcha", "Koné"], ["Lucas", "Fontaine"]],
  receptionnaire: [["David", "Pereira"]],
  daf: [["Olivier", "Chevalier"]],
  comptable: [["Nathalie", "Blanc"]],
  rh: [["Sophie", "Lambert"]],
  barista: [["Chloé", "Martin"], ["Tomás", "Rivera"]],
};
const SKILLS: Record<string, string[]> = {
  fondateur: ["Vision produit", "Sourcing Japon", "Contenu fondateur"],
  dg: ["Pilotage", "Finance", "Organisation"],
  head_brand: ["Direction artistique", "Plateforme de marque", "Partenariats"],
  createur: ["TikTok", "Tournage", "Scénarisation"],
  monteur: ["Montage", "Motion design", "Étalonnage"],
  designer: ["Packaging", "Illustration", "Figma"],
  community: ["Community management", "UGC", "Modération"],
  ecom_manager: ["Boutique en ligne", "Conversion", "Merchandising"],
  media_buyer: ["Meta Ads", "TikTok Ads", "Attribution"],
  crm_manager: ["E-mailing", "Segmentation", "Rétention"],
  dev_shop: ["Liquid", "TypeScript", "Intégrations"],
  head_sales: ["Négociation", "CHR", "Grands comptes"],
  account_manager: ["Prospection", "Suivi de comptes", "Dégustation"],
  service_client: ["Relation client", "SAV", "Anglais"],
  qualite: ["HACCP", "Traçabilité", "Étiquetage"],
  sourcing: ["Japonais", "Négociation fournisseurs", "Dégustation"],
  rd: ["Analyse sensorielle", "Recettes", "Préparation barista"],
  head_logistique: ["Gestion d'entrepôt", "Transporteurs", "Planification"],
  preparateur: ["Préparation de commandes", "Contrôle qualité", "Emballage soigné"],
  receptionnaire: ["CACES 1", "Réception", "Inventaire"],
  daf: ["Contrôle de gestion", "Trésorerie", "Levée de fonds"],
  comptable: ["Comptabilité", "TVA", "Rapprochement"],
  rh: ["Paie", "Recrutement", "Droit social"],
  barista: ["Préparation matcha", "Accueil", "Latte art"],
};
const SKIN = ["#F2D3B8", "#E8BF9A", "#C98E64", "#A86B45", "#7A4A2E", "#F5DCC6"];
const HAIR = ["#1E1A17", "#3B2A20", "#6B4A2F", "#A57A4C", "#D9B77A", "#2B2B2B"];

type Emp = { id: string; key: string; poste: (typeof C.postes)[number]; first: string; last: string; idx: number };
const employees: Emp[] = [];
for (const poste of C.postes) {
  const names = NAMES[poste.id] ?? [];
  if (names.length !== poste.effectif) throw new Error(`noms manquants pour ${poste.id}`);
  names.forEach(([first, last], i) => employees.push({ id: uid(`emp:${poste.id}:${i}`), key: `${poste.id}:${i}`, poste, first, last, idx: employees.length }));
}
const E = (posteId: string, i = 0) => {
  const e = employees.find((x) => x.key === `${posteId}:${i}`);
  if (!e) throw new Error(`collaborateur inconnu ${posteId}:${i}`);
  return e;
};
const managerOf: Record<string, string> = {
  fondateur: "", dg: "fondateur", head_brand: "dg", createur: "head_brand", monteur: "head_brand", designer: "head_brand", community: "head_brand",
  ecom_manager: "dg", media_buyer: "ecom_manager", crm_manager: "ecom_manager", dev_shop: "ecom_manager",
  head_sales: "dg", account_manager: "head_sales", service_client: "ecom_manager",
  qualite: "dg", sourcing: "fondateur", rd: "sourcing", head_logistique: "dg", preparateur: "head_logistique", receptionnaire: "head_logistique",
  daf: "dg", comptable: "daf", rh: "dg", barista: "head_brand",
};
const FEMALE = new Set(["Claire", "Inès", "Maëlle", "Jade", "Camille", "Sarah", "Nadia", "Lucie", "Hélène", "Emma", "Manon", "Aïcha", "Nathalie", "Sophie", "Chloé"]);
/** « Préparateur·rice » → Préparatrice / Préparateur ; « Chargé·e » → Chargée / Chargé. */
const genderTitle = (t: string, f: boolean) =>
  t.replace(/(\p{L}+)·(\p{L}+)/gu, (_, base: string, suf: string) => {
    if (!f) return base;
    if (suf === "rice" && base.endsWith("teur")) return base.slice(0, -4) + "trice";
    if (suf === "ère" && base.endsWith("er")) return base.slice(0, -2) + "ère";
    if (suf === "se" && base.endsWith("eur")) return base.slice(0, -3) + "euse";
    return base + suf;
  });
const empEmail = (e: Emp) => `${slug(e.first)}.${slug(e.last)}@matocha.demo`;
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

const empRows: Row[] = employees.map((e, n) => {
  const hiredYearsAgo = e.poste.id === "fondateur" ? 3.2 : e.poste.id === "dg" ? 2.6 : between(0.1, 2.8);
  return {
    id: e.id,
    org_id: ORG,
    site_id: SITE,
    department_id: uid(`dept:${e.poste.departement}`),
    manager_id: null,
    home_zone_id: Z(e.poste.zone),
    first_name: e.first,
    last_name: e.last,
    job_key: e.poste.id,
    job_title: genderTitle(e.poste.intitule, FEMALE.has(e.first)),
    email: empEmail(e),
    phone: `+33 6 ${String(10 + n).padStart(2, "0")} ${String(20 + ((n * 7) % 70)).padStart(2, "0")} ${String(30 + ((n * 13) % 60)).padStart(2, "0")} ${String(40 + ((n * 17) % 50)).padStart(2, "0")}`,
    contract_type: e.poste.id === "preparateur" && e.key.endsWith(":3") ? "CDD" : "CDI",
    work_rate: e.key === "service_client:1" ? 0.8 : 1,
    hired_on: date(-Math.round(hiredYearsAgo * 365)),
    skills: SKILLS[e.poste.id],
    avatar_color: pick(["#173D2B", "#79A84B", "#E07A5F", "#3D5A80", "#8E7DBE", "#C9A227", "#5C6B73"]),
    appearance: json({
      skin: SKIN[n % SKIN.length],
      hair: HAIR[(n * 5) % HAIR.length],
      hairStyle: n % 3 === 0 ? "long" : n % 3 === 1 ? "court" : "chignon",
      outfit: e.poste.tenue,
      accessory: e.poste.accessoire,
    }),
    leave_balance_days: Math.round(between(4, 22) * 2) / 2,
    overtime_hours: Math.round(between(0, 14) * 4) / 4,
  };
});
insert("employees", empRows);
// Managers après insertion (auto-référence)
for (const e of employees) {
  const m = managerOf[e.poste.id];
  if (m) sql(`update public.employees set manager_id = ${q(E(m).id)} where id = ${q(e.id)};`);
}

// Salaires (table protégée) — historique : augmentation il y a ~1 an pour les anciens
const salaryRows: Row[] = [];
for (const e of employees) {
  const [lo, hi] = e.poste.brutAnnuelEUR;
  const current = Math.round(between(lo, hi) / 500) * 500;
  salaryRows.push({ org_id: ORG, employee_id: e.id, effective_from: date(-120), gross_annual: current, months: 12, bonus_target: ["direction", "ventes", "growth"].includes(e.poste.departement) ? Math.round(current * 0.08 / 500) * 500 : 0 });
  if (rnd() > 0.4) salaryRows.push({ org_id: ORG, employee_id: e.id, effective_from: date(-485), gross_annual: Math.round((current * 0.95) / 500) * 500, months: 12, bonus_target: 0, note: "Avant revue annuelle" });
}
insert("employee_salaries", salaryRows);

// ------------------------------------------------------------------ comptes de démo (auth)
sql(`-- Comptes de démo : mot de passe commun « ${DEMO_PASSWORD} »`);
for (const r of C.roles) {
  const userId = uid(`user:${r.id}`);
  const emp = r.compteDemo.poste ? E(r.compteDemo.poste) : null;
  const fullName = emp ? `${emp.first} ${emp.last}` : `Lecture seule (${C.entreprise.nomCourt})`;
  sql(`insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', ${q(userId)}, 'authenticated', 'authenticated', ${q(r.compteDemo.email)},
  extensions.crypt(${q(DEMO_PASSWORD)}, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', ${q(JSON.stringify({ full_name: fullName }))}, now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (${q(userId)}, ${q(userId)}, ${q(JSON.stringify({ sub: userId, email: r.compteDemo.email, email_verified: true }))}, 'email', now(), now(), now());`);
  insert("profiles", [{ user_id: userId, org_id: ORG, role_id: uid(`role:${r.id}`), full_name: fullName, locale: "fr", employee_id: emp?.id ?? null }]);
}

// ------------------------------------------------------------------ équipements, salles, véhicules
type AssetDef = { key: string; type: string; name: string; zone: string; status?: string; emp?: Emp; specs?: object; telemetry?: object; maint?: number; cost?: number };
const assets: AssetDef[] = [
  { key: "salle_uji", type: "salle", name: "Salle Uji", zone: "salle_uji", specs: { places: 8, equipement: ["Écran 75\"", "Visio", "Tableau blanc"] } },
  { key: "salle_shizuoka", type: "salle", name: "Salle Shizuoka", zone: "salle_shizuoka", specs: { places: 4, equipement: ["Écran 55\"", "Visio"] } },
  { key: "utilitaire", type: "vehicule", name: "Utilitaire électrique", zone: "parking", specs: { plaque: "FM-284-QT", energie: "électrique", charge_utile_kg: 900 }, telemetry: { km: 18420, batterie: 0.76, en_charge: true }, maint: 38, cost: 41800 },
  { key: "velo_cargo", type: "vehicule", name: "Vélo-cargo de livraison", zone: "parking", specs: { energie: "électrique assistée", charge_utile_kg: 120 }, telemetry: { km: 3210, batterie: 0.54 }, maint: 12, cost: 6900 },
  ...[1, 2, 3, 4].map((n) => ({ key: `table_pack_${n}`, type: "machine", name: `Table de pack ${n}`, zone: "preparation", specs: { imprimante_etiquettes: true, scanner: true }, telemetry: { colis_jour: 0 } })),
  { key: "imprimante_etiquettes", type: "imprimante", name: "Imprimante d'étiquettes transporteur", zone: "expedition", telemetry: { rouleau: 0.42, etiquettes_jour: 0 } },
  { key: "balance_labo", type: "equipement", name: "Balance de précision (labo)", zone: "labo", specs: { precision_g: 0.01 }, maint: 60 },
  { key: "balance_controle", type: "equipement", name: "Balance de contrôle", zone: "quarantaine", specs: { precision_g: 0.1 }, maint: 45 },
  { key: "thermoscelleuse", type: "machine", name: "Thermoscelleuse", zone: "preparation", telemetry: { temperature_c: 165, cycles_jour: 0 }, maint: 21 },
  { key: "transpalette", type: "equipement", name: "Transpalette électrique", zone: "quai", telemetry: { batterie: 0.88 }, maint: 90 },
  { key: "set_tournage", type: "equipement", name: "Set de tournage", zone: "studio", specs: { camera: "Hybride plein format", lumiere: "2 softbox + 1 tube" } },
  { key: "machine_matcha", type: "machine", name: "Machine à matcha du bar", zone: "bar", telemetry: { boissons_jour: 0, eau_l: 3.2 }, maint: 14 },
  { key: "imprimante_mfp", type: "imprimante", name: "Imprimante multifonction", zone: "technique", telemetry: { bacs: [{ nom: "A4", niveau: 0.62 }, { nom: "A3", niveau: 0.18 }], toner: { noir: 0.44, cyan: 0.71, magenta: 0.12, jaune: 0.58 }, pages_jour: 0, cout_page: 0.012 } },
  { key: "baie_serveur", type: "serveur", name: "Baie serveur & réseau", zone: "technique", telemetry: { cpu: 0.21, temperature_c: 24.5 } },
  { key: "armoire_echantillons", type: "equipement", name: "Armoire de l'échantillothèque", zone: "echantillotheque", telemetry: { temperature_c: 17.8, humidite: 0.41, boites: 27 } },
  { key: "badgeuse", type: "equipement", name: "Badgeuse d'accueil", zone: "accueil" },
];
const officeZones = new Set(["open_space", "direction", "accueil", "studio", "labo"]);
const APPS = ["crm", "tableur", "design", "code", "terminal", "visio", "mail"];
for (const e of employees.filter((x) => officeZones.has(x.poste.zone))) {
  assets.push({
    key: `pc_${e.key.replace(":", "_")}`,
    type: "poste_informatique",
    name: `Poste ${e.first} ${e.last[0]}.`,
    zone: e.poste.zone,
    emp: e,
    specs: { modele: e.poste.id === "monteur" || e.poste.id === "designer" ? "Station 32 Go" : "Portable 16 Go", os: "macOS" },
    telemetry: { session: "active", app: e.poste.id === "dev_shop" ? "code" : e.poste.id === "designer" ? "design" : pick(APPS), cpu: Math.round(between(0.05, 0.6) * 100) / 100, ram: Math.round(between(0.3, 0.8) * 100) / 100, maj_en_attente: rnd() > 0.8 },
  });
}
const A = (key: string) => uid(`asset:${key}`);
insert(
  "assets",
  assets.map((a) => ({
    id: A(a.key), org_id: ORG, site_id: SITE, zone_id: Z(a.zone), type: a.type, key: a.key, name: a.name, status: a.status ?? "ok",
    assigned_employee_id: a.emp?.id ?? null, specs: json(a.specs ?? {}), telemetry: json(a.telemetry ?? {}),
    next_maintenance_on: a.maint ? date(a.maint) : null, purchase_cost: a.cost ?? null,
  })),
);

// ------------------------------------------------------------------ agenda et présence du jour
// Statuts visés : majorité au poste, réunions en cours, pauses, télétravail, congés, déplacement, retard.
const LATE = E("preparateur", 0); // arrive pendant la démo
const REMOTE = E("dev_shop");
const ON_LEAVE = E("designer");
const TRAVEL = E("sourcing");
const PAUSE_NOW = [E("service_client", 1), E("preparateur", 1)];
const MEETING_UJI = [E("head_brand"), E("ecom_manager"), E("media_buyer"), E("crm_manager")];
const MEETING_SHZ = [E("head_sales")];
const SHOOTING = [E("createur", 1), E("monteur")];

const badges: Row[] = [];
for (const e of employees) {
  if ([LATE, REMOTE, ON_LEAVE, TRAVEL].includes(e)) continue;
  const atelier = ["preparation", "quai", "quarantaine"].includes(e.poste.zone);
  const start = atelier ? between(6 * 60 + 50, 7 * 60 + 25) : e.poste.zone === "bar" ? between(7 * 60 + 40, 8 * 60) : between(8 * 60, 9 * 60 + 35);
  badges.push({ org_id: ORG, employee_id: e.id, kind: "in", reader: "accueil", at: ts(0, hm(start)), source: "badgeuse" });
}
for (const [i, e] of PAUSE_NOW.entries()) badges.push({ org_id: ORG, employee_id: e.id, kind: "pause_start", reader: "detente", at: rel(-(9 - i * 5)), source: "badgeuse" });
insert("badge_events", badges);

// Historique de 30 jours (jours ouvrés du jour d'exécution) : entrée, pause, retour, sortie
sql(`-- Historique de badges : 30 jours ouvrés, horaires pseudo-aléatoires stables
insert into public.badge_events (org_id, employee_id, kind, reader, at, source)
select ${q(ORG)}, e.id, k.kind::app.badge_kind, k.reader,
       app.local_ts(-d, '00:00') + make_interval(mins => k.base + (abs(hashtext(e.id::text || d || k.kind)) % k.spread)), 'badgeuse'
from public.employees e
cross join generate_series(1, 30) as d
cross join (values ('in', 'accueil', 440, 110), ('pause_start', 'detente', 735, 40), ('pause_end', 'detente', 790, 30), ('out', 'accueil', 1030, 105))
     as k(kind, reader, base, spread)
where e.org_id = ${q(ORG)}
  and extract(isodow from app.local_date(-d)) < 6
  and abs(hashtext(e.id::text || d)) % 23 <> 0;  -- ~4 % d'absences ponctuelles
`);

const cal: Row[] = [];
const calEv = (key: string, r: Row) => cal.push({ id: uid(`cal:${key}`), org_id: ORG, ...r });
calEv("uji_now", { owner_id: MEETING_UJI[0].id, resource_id: A("salle_uji"), type: "reunion", title: "Revue hebdo des campagnes", starts_at: rel(-25), ends_at: rel(35), attendees: raw(`array[${MEETING_UJI.map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("shz_now", { owner_id: MEETING_SHZ[0].id, resource_id: A("salle_shizuoka"), type: "client", title: "Visio réassort — Hôtel des Tilleuls", starts_at: rel(-10), ends_at: rel(20), attendees: raw(`array[${q(MEETING_SHZ[0].id)}]::uuid[]`) });
calEv("tournage_now", { owner_id: SHOOTING[0].id, resource_id: A("set_tournage"), type: "tournage", title: "Tournage « Open. Pour. Whisk. » — 6 vidéos", starts_at: rel(-50), ends_at: rel(70), attendees: raw(`array[${SHOOTING.map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("remote", { owner_id: REMOTE.id, type: "teletravail", title: "Télétravail", starts_at: ts(0, "00:00"), ends_at: ts(0, "23:59") });
calEv("travel", { owner_id: TRAVEL.id, type: "deplacement", title: "Salon professionnel du thé — Lyon", starts_at: ts(0, "06:30"), ends_at: ts(0, "21:00") });
calEv("discovery", { owner_id: E("head_brand").id, resource_id: A("salle_uji"), type: "reunion", title: "Point lancement Discovery Box", starts_at: ts(0, "14:00"), ends_at: ts(0, "15:00"), attendees: raw(`array[${[E("head_brand"), E("fondateur"), E("ecom_manager"), E("designer")].map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("degustation", { owner_id: E("rd").id, type: "focus", title: "Dégustation à l'aveugle — lot L2026-10C", starts_at: ts(0, "16:00"), ends_at: ts(0, "17:00"), attendees: raw(`array[${[E("rd"), E("qualite"), E("fondateur")].map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("comex", { owner_id: E("dg").id, resource_id: A("salle_uji"), type: "reunion", title: "Comité de direction", starts_at: ts(1, "09:30"), ends_at: ts(1, "11:00"), attendees: raw(`array[${[E("dg"), E("fondateur"), E("daf"), E("head_brand"), E("head_sales"), E("head_logistique")].map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("rdv_kissa", { owner_id: E("account_manager", 0).id, type: "client", title: "Rendez-vous Kissa Mori — formation barista", starts_at: ts(1, "15:00"), ends_at: ts(1, "17:00") });
calEv("entretien", { owner_id: E("rh").id, resource_id: A("salle_shizuoka"), type: "reunion", title: "Entretien — candidat préparateur (2e tour)", starts_at: ts(0, "11:30"), ends_at: ts(0, "12:15"), attendees: raw(`array[${[E("rh"), E("head_logistique")].map((e) => q(e.id)).join(",")}]::uuid[]`) });
calEv("livraison_hinoki", { owner_id: E("receptionnaire").id, resource_id: A("utilitaire"), type: "livraison", title: "Livraison Café Hinoki (utilitaire)", starts_at: ts(0, "13:30"), ends_at: ts(0, "14:30") });
for (let d = 1; d <= 4; d++) {
  calEv(`standup_${d}`, { owner_id: E("head_logistique").id, type: "reunion", title: "Brief préparation du jour", starts_at: ts(d, "07:15"), ends_at: ts(d, "07:30") });
  calEv(`shoot_${d}`, { owner_id: E("createur", d % 2).id, resource_id: A("set_tournage"), type: "tournage", title: "Session de tournage", starts_at: ts(d, "10:00"), ends_at: ts(d, "12:00") });
}
insert("calendar_events", cal);
insert("asset_bookings", [
  { org_id: ORG, asset_id: A("utilitaire"), employee_id: E("receptionnaire").id, title: "Livraison Café Hinoki", starts_at: ts(0, "13:30"), ends_at: ts(0, "14:30") },
  { org_id: ORG, asset_id: A("velo_cargo"), employee_id: E("account_manager", 1).id, title: "Tournée échantillons Paris 3e/4e", starts_at: ts(1, "10:00"), ends_at: ts(1, "13:00") },
  { org_id: ORG, asset_id: A("salle_uji"), employee_id: E("head_brand").id, title: "Point lancement Discovery Box", starts_at: ts(0, "14:00"), ends_at: ts(0, "15:00") },
]);

// Congés : un en cours, trois à valider, historique
const leaves: Row[] = [
  { employee_id: ON_LEAVE.id, type: "conges", starts_on: date(-2), ends_on: date(3), days: 4, status: "approved", approver_id: E("head_brand").id, decided_at: ts(-20, "10:12") },
  { employee_id: E("account_manager", 1).id, type: "conges", starts_on: date(21), ends_on: date(25), days: 5, status: "pending", comment: "Vacances de la Toussaint" },
  { employee_id: E("service_client", 0).id, type: "rtt", starts_on: date(9), ends_on: date(9), days: 1, status: "pending" },
  { employee_id: E("preparateur", 3).id, type: "conges", starts_on: date(14), ends_on: date(15), days: 2, status: "pending", comment: "Déménagement" },
  { employee_id: E("monteur").id, type: "conges", starts_on: date(-40), ends_on: date(-33), days: 6, status: "approved", approver_id: E("head_brand").id, decided_at: ts(-70, "09:00") },
  { employee_id: E("comptable").id, type: "formation", starts_on: date(-12), ends_on: date(-12), days: 1, status: "approved", approver_id: E("daf").id, decided_at: ts(-30, "14:00") },
  { employee_id: E("barista", 1).id, type: "maladie", starts_on: date(-8), ends_on: date(-7), days: 2, status: "approved", approver_id: E("rh").id, decided_at: ts(-8, "08:30") },
];
insert("leave_requests", leaves.map((l) => ({ org_id: ORG, ...l })));

// ------------------------------------------------------------------ catalogue, clients, commercial
const R = C.entreprise.tva.reduit;
const S = C.entreprise.tva.standard;
const catalog = [
  { sku: "DB30", name: "Daily Box — 30 sticks × 2 g", unit: "boîte", price: 25.5, cost: 14.2, vat: R },
  { sku: "DB10", name: "Discovery Box — 10 sticks × 2 g", unit: "boîte", price: 10.2, cost: 5.4, vat: R },
  { sku: "DB60", name: "Value Box — 60 sticks × 2 g", unit: "boîte", price: 49, cost: 27.1, vat: R },
  { sku: "VR250", name: "Matcha cérémonie — vrac 250 g", unit: "sachet", price: 62, cost: 34, vat: R },
  { sku: "VR1K", name: "Matcha barista — vrac 1 kg", unit: "sachet", price: 118, cost: 61, vat: R },
  { sku: "VERRE", name: "Verre MATOCHA", unit: "pièce", price: 9.9, cost: 3.1, vat: S },
  { sku: "FOUET", name: "Fouet électrique", unit: "pièce", price: 14.9, cost: 5.8, vat: S },
  { sku: "COFFRET", name: "Coffret cadeau (Daily Box + verre + fouet)", unit: "coffret", price: 52, cost: 25.4, vat: S },
  { sku: "PLV", name: "Présentoir comptoir", unit: "pièce", price: 35, cost: 12, vat: S },
  { sku: "FORM", name: "Formation barista matcha (2 h)", unit: "session", price: 180, cost: 60, vat: S },
  { sku: "PORT", name: "Livraison palette", unit: "forfait", price: 45, cost: 38, vat: S },
];
const CI = (sku: string) => uid(`catalog:${sku}`);
const cat = (sku: string) => catalog.find((c) => c.sku === sku)!;
insert("catalog_items", catalog.map((c) => ({ id: CI(c.sku), org_id: ORG, sku: c.sku, name: c.name, unit: c.unit, unit_price: c.price, unit_cost: c.cost, vat_rate: c.vat })));

const clients = [
  { k: "hinoki", name: "Café Hinoki", segment: "Café", city: "Paris 11e", contact: ["Mathilde Aubry", "Gérante"], lang: "fr", owner: ["account_manager", 0], sat: 5 },
  { k: "tilleuls", name: "Hôtel des Tilleuls", segment: "Hôtel", city: "Paris 6e", contact: ["Pierre-Alain Dussart", "Directeur F&B"], lang: "fr", owner: ["head_sales", 0], sat: 4 },
  { k: "koen", name: "Maison Kōen", segment: "Concept store", city: "Lyon 2e", contact: ["Aiko Bernard", "Acheteuse"], lang: "fr", owner: ["account_manager", 1], sat: 5 },
  { k: "ondine", name: "Studio Pilates Ondine", segment: "Bien-être", city: "Paris 17e", contact: ["Ondine Carrel", "Fondatrice"], lang: "fr", owner: ["account_manager", 0], sat: 4 },
  { k: "canal", name: "La Brûlerie du Canal", segment: "Café torréfacteur", city: "Paris 10e", contact: ["Malik Ferrand", "Associé"], lang: "fr", owner: ["account_manager", 1], sat: 3 },
  { k: "belvedere", name: "Hôtel Belvédère", segment: "Hôtel", city: "Annecy", contact: ["Laura Steiner", "Responsable achats"], lang: "fr", owner: ["head_sales", 0], sat: 4 },
  { k: "seve", name: "Atelier Sève", segment: "Épicerie fine", city: "Bordeaux", contact: ["Julie Dorval", "Gérante"], lang: "fr", owner: ["account_manager", 1], sat: 5 },
  { k: "altair", name: "Altaïr Conseil", segment: "Cadeaux d'entreprise", city: "La Défense", contact: ["Benoît Schaller", "Office manager"], lang: "fr", owner: ["head_sales", 0], sat: null },
  { k: "kissa", name: "Kissa Mori", segment: "Salon de thé", city: "Paris 3e", contact: ["Yuna Leclerc", "Cheffe barista"], lang: "fr", owner: ["account_manager", 0], sat: 5 },
  { k: "zen", name: "Le Comptoir Zen", segment: "Coffee shops (3 adresses)", city: "Lille", contact: ["Thomas Delvaux", "Directeur des opérations"], lang: "fr", owner: ["head_sales", 0], sat: 4 },
  { k: "shala", name: "Yoga Shala Marais", segment: "Bien-être", city: "Paris 4e", contact: ["Priya Morin", "Gérante"], lang: "en", owner: ["account_manager", 1], sat: null },
  { k: "verlaine", name: "Verlaine & Associés", segment: "Cadeaux d'entreprise", city: "Paris 8e", contact: ["Agnès Roche", "Assistante de direction"], lang: "fr", owner: ["account_manager", 0], sat: 4 },
  { k: "p_ines", name: "Inès Valadier", segment: "Abonnée fidèle", city: "Nantes", contact: null, lang: "fr", owner: ["service_client", 0], sat: 5, particulier: true },
  { k: "p_mark", name: "Mark Ellison", segment: "Abonné (UK)", city: "Londres", contact: null, lang: "en", owner: ["service_client", 1], sat: 4, particulier: true },
] as const;
const CL = (k: string) => uid(`client:${k}`);
insert(
  "clients",
  clients.map((c, i) => ({
    id: CL(c.k), org_id: ORG, kind: "particulier" in c ? "particulier" : "entreprise", segment: c.segment, name: c.name,
    email: `contact@${slug(c.name)}.example`, phone: `+33 1 ${40 + i} ${10 + i * 3} ${20 + i * 2} ${30 + i}`, city: c.city, language: c.lang,
    preferred_channel: i % 3 === 0 ? "telephone" : "email", owner_id: E(c.owner[0], c.owner[1]).id, satisfaction: c.sat,
    last_contact_at: ts(-[2, 1, 6, 12, 34, 9, 18, 3, 1, 5, 41, 22, 15, 60][i], "10:00"),
    internal_note: c.k === "canal" ? "Sensible au prix ; préfère les commandes groupées en début de mois." : null,
  })),
);
insert(
  "contacts",
  clients.filter((c) => c.contact).map((c) => ({ org_id: ORG, client_id: CL(c.k), full_name: c.contact![0], role: c.contact![1], email: `${slug(c.contact![0].split(" ")[0])}@${slug(c.name)}.example`, language: c.lang, is_primary: true })),
);

const deals = [
  { k: "belvedere_saison", client: "belvedere", title: "Carte hiver — matcha latte au bar", stage: "chaud", value: 6800, p: 0.7, owner: "head_sales", close: 10 },
  { k: "altair_noel", client: "altair", title: "Coffrets de fin d'année (220 collaborateurs)", stage: "chaud", value: 11440, p: 0.6, owner: "head_sales", close: 20 },
  { k: "zen_3shops", client: "zen", title: "Référencement 3 coffee shops", stage: "tiede", value: 9200, p: 0.4, owner: "head_sales", close: 30 },
  { k: "shala", client: "shala", title: "Vente au comptoir + ateliers", stage: "froid", value: 1800, p: 0.15, owner: "account_manager", close: 45 },
  { k: "verlaine", client: "verlaine", title: "Cadeaux clients 2027", stage: "tiede", value: 4200, p: 0.35, owner: "account_manager", close: 40 },
  { k: "koen_retail", client: "koen", title: "Corner retail Discovery Box", stage: "gagne", value: 3100, p: 1, owner: "account_manager", close: -6 },
  { k: "canal_vrac", client: "canal", title: "Passage au vrac barista 1 kg", stage: "perdu", value: 2400, p: 0, owner: "account_manager", close: -12 },
  { k: "tilleuls_reassort", client: "tilleuls", title: "Réassort trimestriel", stage: "gagne", value: 2950, p: 1, owner: "head_sales", close: 0 },
];
insert("deals", deals.map((d) => ({ id: uid(`deal:${d.k}`), org_id: ORG, client_id: CL(d.client), title: d.title, stage: d.stage, value: d.value, probability: d.p, owner_id: E(d.owner, d.owner === "account_manager" ? 1 : 0).id, expected_close_on: date(d.close), source: pick(["Salon", "Instagram", "Recommandation", "Formulaire web"]) })));

// Devis : lignes → totaux calculés par la couche domaine (mêmes règles que l'application)
type QL = [sku: string, qty: number];
const quotes: { k: string; client: string; status: string; issued: number; lines: QL[]; discount?: number; deal?: string; owner: [string, number] }[] = [
  { k: "Q-2026-0141", client: "belvedere", status: "opened", issued: -4, lines: [["VR1K", 6], ["DB30", 40], ["VERRE", 48], ["FORM", 1]], deal: "belvedere_saison", owner: ["head_sales", 0] },
  { k: "Q-2026-0142", client: "altair", status: "sent", issued: -2, lines: [["COFFRET", 220], ["PORT", 2]], discount: 0.08, deal: "altair_noel", owner: ["head_sales", 0] },
  { k: "Q-2026-0143", client: "zen", status: "draft", issued: 0, lines: [["VR1K", 9], ["DB30", 60], ["PLV", 3], ["FORM", 3]], deal: "zen_3shops", owner: ["head_sales", 0] },
  { k: "Q-2026-0139", client: "verlaine", status: "sent", issued: -9, lines: [["COFFRET", 60], ["DB10", 120]], deal: "verlaine", owner: ["account_manager", 0] },
  { k: "Q-2026-0137", client: "shala", status: "expired", issued: -38, lines: [["DB30", 12], ["DB10", 30], ["PLV", 1]], owner: ["account_manager", 1] },
  { k: "Q-2026-0135", client: "canal", status: "rejected", issued: -15, lines: [["VR1K", 10]], deal: "canal_vrac", owner: ["account_manager", 1] },
  { k: "Q-2026-0144", client: "tilleuls", status: "accepted", issued: -1, lines: [["DB30", 60], ["VR250", 8], ["VERRE", 24]], deal: "tilleuls_reassort", owner: ["head_sales", 0] },
  { k: "Q-2026-0138", client: "koen", status: "accepted", issued: -7, lines: [["DB10", 150], ["DB30", 50], ["PLV", 2]], deal: "koen_retail", owner: ["account_manager", 1] },
  { k: "Q-2026-0140", client: "hinoki", status: "accepted", issued: -3, lines: [["VR1K", 4], ["DB30", 20]], owner: ["account_manager", 0] },
  { k: "Q-2026-0136", client: "kissa", status: "accepted", issued: -10, lines: [["VR250", 10], ["FORM", 1]], owner: ["account_manager", 0] },
  { k: "Q-2026-0133", client: "seve", status: "accepted", issued: -16, lines: [["DB30", 36], ["DB10", 48], ["VERRE", 12]], owner: ["account_manager", 1] },
  { k: "Q-2026-0131", client: "ondine", status: "accepted", issued: -21, lines: [["DB30", 24], ["FOUET", 6]], owner: ["account_manager", 0] },
];
const quoteTotals = new Map<string, ReturnType<typeof computeTotals>>();
for (const qt of quotes) {
  const t = computeTotals(qt.lines.map(([sku, qty]) => ({ quantity: qty, unitPrice: cat(sku).price, unitCost: cat(sku).cost, vatRate: cat(sku).vat })), { discountPct: qt.discount, rounding: C.entreprise.tva.arrondi });
  quoteTotals.set(qt.k, t);
}
insert(
  "quotes",
  quotes.map((qt) => {
    const t = quoteTotals.get(qt.k)!;
    const st = qt.status;
    return {
      id: uid(`quote:${qt.k}`), org_id: ORG, number: qt.k, client_id: CL(qt.client), deal_id: qt.deal ? uid(`deal:${qt.deal}`) : null, status: st,
      issued_on: date(qt.issued), valid_until: date(qt.issued + 30), discount_pct: qt.discount ?? 0, total_ht: t.ht, total_vat: t.vat, total_ttc: t.ttc,
      sent_at: st === "draft" ? null : ts(qt.issued, "11:20"), opened_at: ["opened", "accepted"].includes(st) ? ts(qt.issued + 1, "09:05") : null,
      accepted_at: st === "accepted" ? ts(Math.min(qt.issued + 1, 0), "08:40") : null, owner_id: E(qt.owner[0], qt.owner[1]).id,
    };
  }),
);
insert(
  "quote_lines",
  quotes.flatMap((qt) => qt.lines.map(([sku, qty], i) => ({ org_id: ORG, quote_id: uid(`quote:${qt.k}`), catalog_item_id: CI(sku), label: cat(sku).name, quantity: qty, unit_price: cat(sku).price, unit_cost: cat(sku).cost, vat_rate: cat(sku).vat, position: i }))),
);

// ------------------------------------------------------------------ commandes pro (objet central)
const stages = C.objetMetierCentral.etapes.map((s) => s.id);
type WO = { n: string; quote?: string; client: string; title: string; stage: string; status?: string; blocked?: string; object: string; owner: [string, number]; zone?: string; budget: number; due: [number, string]; received: number; progress: number };
const wos: WO[] = [
  { n: "CP-24-0612", quote: "Q-2026-0144", client: "tilleuls", title: "Réassort trimestriel", stage: "confirmee", object: "3 cartons · ~14 kg", owner: ["head_logistique", 0], budget: 3, due: [1, "15:00"], received: 0, progress: 0.05 },
  { n: "CP-24-0611", client: "zen", title: "Échantillons 3 coffee shops", stage: "confirmee", object: "1 carton · 2 kg", owner: ["head_logistique", 0], budget: 1, due: [2, "15:00"], received: 0, progress: 0 },
  { n: "CP-24-0608", quote: "Q-2026-0138", client: "koen", title: "Corner retail Discovery Box", stage: "preparation", object: "Palette · 6 cartons", owner: ["preparateur", 2], zone: "preparation", budget: 4, due: [0, "15:00"], received: -2, progress: 0.55 },
  { n: "CP-24-0609", client: "seve", title: "Réassort épicerie — Daily Box", stage: "preparation", status: "attente", blocked: "Cartons S en rupture — livraison fournisseur demain 9 h", object: "4 cartons", owner: ["preparateur", 3], zone: "preparation", budget: 2, due: [0, "15:00"], received: -1, progress: 0.3 },
  { n: "CP-24-0607", quote: "Q-2026-0140", client: "hinoki", title: "Vrac barista + Daily Box", stage: "controle", object: "2 cartons · 9,6 kg", owner: ["qualite", 0], zone: "quarantaine", budget: 2.5, due: [0, "13:30"], received: -3, progress: 0.7 },
  { n: "CP-24-0605", quote: "Q-2026-0136", client: "kissa", title: "Vrac cérémonie + formation", stage: "expedition", object: "1 carton · 3 kg", owner: ["head_logistique", 0], zone: "expedition", budget: 1.5, due: [0, "15:00"], received: -6, progress: 0.85 },
  { n: "CP-24-0604", client: "belvedere", title: "Échantillons carte hiver", stage: "expedition", object: "1 colis · 1,2 kg", owner: ["head_logistique", 0], zone: "expedition", budget: 0.5, due: [0, "15:00"], received: -2, progress: 0.9 },
  { n: "CP-24-0601", quote: "Q-2026-0133", client: "seve", title: "Commande d'ouverture", stage: "livree", object: "3 cartons", owner: ["head_logistique", 0], budget: 2.5, due: [-10, "15:00"], received: -14, progress: 0.95 },
  { n: "CP-24-0598", quote: "Q-2026-0131", client: "ondine", title: "Daily Box + fouets", stage: "livree", object: "2 cartons", owner: ["head_logistique", 0], budget: 1.5, due: [-16, "15:00"], received: -19, progress: 0.95 },
  { n: "CP-24-0590", client: "tilleuls", title: "Réassort mensuel", stage: "facturee", status: "termine", object: "3 cartons", owner: ["head_logistique", 0], budget: 3, due: [-28, "15:00"], received: -31, progress: 1 },
];
const WOID = (n: string) => uid(`wo:${n}`);
const woAmount = (w: WO) => (w.quote ? quoteTotals.get(w.quote)! : { ht: Math.round(between(300, 900)), ttc: 0 });
insert(
  "work_orders",
  wos.map((w) => {
    const t = woAmount(w);
    return {
      id: WOID(w.n), org_id: ORG, site_id: SITE, number: w.n, client_id: CL(w.client), quote_id: w.quote ? uid(`quote:${w.quote}`) : null, title: w.title,
      physical_object: w.object, stage: w.stage, progress: w.progress, status: w.status ?? "en_cours", blocked_reason: w.blocked ?? null,
      owner_id: E(w.owner[0], w.owner[1]).id, zone_id: w.zone ? Z(w.zone) : null, hours_budget: w.budget, due_at: ts(w.due[0], w.due[1]), received_at: ts(w.received, "09:30"),
      amount_ht: t.ht, amount_ttc: t.ttc || Math.round(t.ht * (1 + R) * 100) / 100,
    };
  }),
);
// Historique horodaté des étapes
const stageRows: Row[] = [];
for (const w of wos) {
  const upTo = stages.indexOf(w.stage);
  for (let i = 0; i <= upTo; i++) {
    const dayIn = Math.min(0, w.received + i);
    const leftDay = Math.min(0, w.received + i + 1);
    stageRows.push({
      org_id: ORG, work_order_id: WOID(w.n), stage: stages[i],
      entered_at: i === 0 ? ts(w.received, "09:30") : ts(dayIn, hm(8 * 60 + i * 50)),
      left_at: i === upTo ? null : ts(leftDay, hm(8 * 60 + (i + 1) * 50)),
      actor_id: E(w.owner[0], w.owner[1]).id,
    });
  }
}
insert("work_order_stages", stageRows);
// Check-lists et tâches
const STEPS = ["Réserver le stock (FEFO)", "Picking et vérification des lots", "Pesée et photo du colis", "Étiquette transporteur", "Preuve de livraison"];
for (const w of wos) {
  const done = Math.max(0, stages.indexOf(w.stage));
  insert("checklists", [{ org_id: ORG, work_order_id: WOID(w.n), title: "Contrôle de la commande", items: json(STEPS.map((label, i) => ({ label, done: i < done, done_at: null, progress: i === done ? Math.round(w.progress * 100) : null }))) }]);
}
insert("tasks", [
  { org_id: ORG, work_order_id: WOID("CP-24-0609"), title: "Relancer le fournisseur de cartons S", status: "doing", progress: 0.5, assignee_id: E("head_logistique").id, due_on: date(0) },
  { org_id: ORG, work_order_id: WOID("CP-24-0607"), title: "Joindre le certificat d'analyse du lot", status: "todo", assignee_id: E("qualite").id, due_on: date(0) },
  { org_id: ORG, work_order_id: WOID("CP-24-0608"), title: "Ajouter 2 présentoirs au colis", status: "done", progress: 1, assignee_id: E("preparateur", 2).id, due_on: date(0) },
  { org_id: ORG, work_order_id: WOID("CP-24-0612"), title: "Confirmer le créneau de livraison hôtel", status: "todo", assignee_id: E("account_manager", 0).id, due_on: date(1) },
]);
// Heures passées (préparation, contrôle)
const timeRows: Row[] = [];
for (const w of wos) {
  const steps = stages.indexOf(w.stage);
  if (steps < 1) continue;
  const used = w.budget * between(0.35, 1.05) * Math.min(1, steps / 3);
  const who = w.stage === "controle" ? E("qualite") : E(w.owner[0], w.owner[1]);
  timeRows.push({ org_id: ORG, employee_id: who.id, work_order_id: WOID(w.n), worked_on: date(Math.min(0, w.received + 1)), hours: Math.max(0.25, Math.round(used * 4) / 4), billable: false, note: "Préparation" });
}
timeRows.push({ org_id: ORG, employee_id: E("rd").id, work_order_id: WOID("CP-24-0605"), worked_on: date(-1), hours: 2, billable: true, note: "Formation barista Kissa Mori" });
insert("time_entries", timeRows);

// ------------------------------------------------------------------ commandes en ligne (flux agrégé, SQL)
sql(`-- Commandes en ligne des particuliers : 30 jours d'historique (+ jour en cours jusqu'à « maintenant »)
create temporary table _names (k int, first text, last text, city text);
insert into _names values
 (0,'Alice','Martin','Paris'),(1,'Baptiste','Durand','Lyon'),(2,'Clara','Petit','Marseille'),(3,'Diane','Leroy','Toulouse'),
 (4,'Elias','Moreau','Nantes'),(5,'Fanny','Simon','Bordeaux'),(6,'Gabriel','Laurent','Lille'),(7,'Hana','Michel','Paris'),
 (8,'Ilyes','Garcia','Montpellier'),(9,'Jeanne','David','Rennes'),(10,'Kevin','Bertrand','Strasbourg'),(11,'Léa','Roux','Paris'),
 (12,'Mehdi','Vincent','Nice'),(13,'Noémie','Fournier','Grenoble'),(14,'Oscar','Morel','Paris'),(15,'Pauline','Girard','Lyon'),
 (16,'Quentin','André','Dijon'),(17,'Rose','Mercier','Angers'),(18,'Samuel','Dupont','Paris'),(19,'Taïna','Lambert','Brest'),
 (20,'Ugo','Bonnet','Annecy'),(21,'Victoire','François','Paris'),(22,'Wassim','Martinez','Reims'),(23,'Yasmine','Legrand','Tours');

with days as (
  select d, app.local_ts(-d, '00:00') as d0,
         -- volume : croissance douce, creux le week-end, bruit stable
         greatest(40, round((128 + (30 - d) * 0.9) * case when extract(isodow from app.local_date(-d)) >= 6 then 0.72 else 1 end
                            + (abs(hashtext('vol' || d)) % 30) - 15))::int as n
  from generate_series(1, 30) d
), orders as (
  select d, i,
         d0 + make_interval(secs => (abs(hashtext('t' || d || '-' || i)) % 86400)) as ordered_at,
         abs(hashtext('b' || d || '-' || i)) % 100 as basket,
         abs(hashtext('c' || d || '-' || i)) % 24 as who
  from days, generate_series(1, n) i
), priced as (
  select *, case when basket < 52 then 39.90 when basket < 70 then 14.90 when basket < 82 then 74.90
                 when basket < 94 then 35.91 else 54.80 end as ttc,
            case when basket < 82 then 1 when basket < 94 then 1 else 2 end as items,
            case when basket between 82 and 93 then 'abonnement' else 'boutique' end as channel
  from orders
)
insert into public.shop_orders (org_id, number, channel, customer_name, city, items, total_ht, total_ttc, status, pack_station, ordered_at, packed_at, shipped_at, ship_deadline)
select ${q(ORG)},
       'W' || to_char(ordered_at at time zone 'Europe/Paris', 'YYMMDD') || '-' || lpad(i::text, 4, '0'),
       channel, n.first || ' ' || left(n.last, 1) || '.', n.city, items,
       round(ttc / ${1 + R}, 2), ttc,
       case when d >= 3 then 'livree' else 'expediee' end,
       1 + (abs(hashtext('s' || d || '-' || i)) % 4),
       ordered_at,
       dl - interval '50 minutes',
       case when abs(hashtext('late' || d || '-' || i)) % 100 < 4 then dl + interval '1 day' else dl - interval '20 minutes' end,
       dl
from priced
join _names n on n.k = priced.who
cross join lateral (
  -- commande avant 13 h : expédiée à l'enlèvement de 15 h le jour même, sinon le lendemain
  select case when (ordered_at at time zone 'Europe/Paris')::time < '13:00'
              then app.local_ts(-d, '15:00') else app.local_ts(-d + 1, '15:00') end as dl
) x;

-- Jour en cours : volume au prorata de l'heure, aucune commande dans le futur
with b as (select app.local_ts(0, '00:00') as d0, now() as t1),
     n as (select greatest(3, round(165 * extract(epoch from (t1 - d0)) / 86400.0))::int as n from b),
     orders as (
       select i, b.d0 + (b.t1 - b.d0) * ((abs(hashtext('today-' || i)) % 10000) / 10000.0) as ordered_at,
              abs(hashtext('tb' || i)) % 100 as basket, abs(hashtext('tc' || i)) % 24 as who
       from b, n, generate_series(1, n.n) i)
insert into public.shop_orders (org_id, number, channel, customer_name, city, items, total_ht, total_ttc, status, pack_station, ordered_at, packed_at, ship_deadline)
select ${q(ORG)}, 'W' || to_char(now() at time zone 'Europe/Paris', 'YYMMDD') || '-' || lpad(i::text, 4, '0'),
       case when basket between 82 and 93 then 'abonnement' else 'boutique' end,
       nm.first || ' ' || left(nm.last, 1) || '.', nm.city,
       case when basket >= 94 then 2 else 1 end,
       round(p.ttc / ${1 + R}, 2), p.ttc,
       case when ordered_at < now() - interval '3 hours' then 'emballee'
            when ordered_at < now() - interval '1 hour' then 'preparation' else 'payee' end,
       1 + (abs(hashtext('ts' || i)) % 4), ordered_at,
       case when ordered_at < now() - interval '3 hours' then ordered_at + interval '2 hours' end,
       case when (ordered_at at time zone 'Europe/Paris')::time < '13:00' then app.local_ts(0, '15:00') else app.local_ts(1, '15:00') end
from orders
join _names nm on nm.k = orders.who
cross join lateral (select case when basket < 52 then 39.90 when basket < 70 then 14.90 when basket < 82 then 74.90
                                 when basket < 94 then 35.91 else 54.80 end as ttc) p;
drop table _names;
`);

// ------------------------------------------------------------------ fournisseurs, stock, lots
const suppliers = [
  { k: "midori", name: "Chaen Midori (fictif)", country: "JP", category: "Matcha", lead: 45 },
  { k: "cartonnages", name: "Cartonnages du Val (fictif)", country: "FR", category: "Emballages", lead: 5 },
  { k: "lumen", name: "Verrerie Lumen (fictif)", country: "FR", category: "Verres", lead: 21 },
  { k: "fouets", name: "Atelier Fouets & Co (fictif)", country: "PT", category: "Accessoires", lead: 18 },
  { k: "imprim", name: "Imprimerie Clairval (fictif)", country: "FR", category: "Cartes et stickers", lead: 7 },
];
const SU = (k: string) => uid(`supplier:${k}`);
insert("suppliers", suppliers.map((s) => ({ id: SU(s.k), org_id: ORG, name: s.name, country: s.country, category: s.category, email: `commandes@${slug(s.name)}.example`, lead_time_days: s.lead })));

const stock = [
  { ref: "MT-DB30", name: "Daily Box 30 × 2 g", cat: "Produit fini", qty: 1840, min: 600, loc: "A-01", sup: "midori", sku: "DB30", cost: 14.2 },
  { ref: "MT-DB10", name: "Discovery Box 10 × 2 g", cat: "Produit fini", qty: 160, min: 300, loc: "A-02", sup: "midori", sku: "DB10", cost: 5.4 },
  { ref: "MT-DB60", name: "Value Box 60 × 2 g", cat: "Produit fini", qty: 420, min: 150, loc: "A-03", sup: "midori", sku: "DB60", cost: 27.1 },
  { ref: "MT-VR250", name: "Matcha cérémonie vrac 250 g", cat: "Produit fini", qty: 64, min: 30, loc: "A-04", sup: "midori", sku: "VR250", cost: 34 },
  { ref: "MT-VR1K", name: "Matcha barista vrac 1 kg", cat: "Produit fini", qty: 22, min: 10, loc: "A-05", sup: "midori", sku: "VR1K", cost: 61 },
  { ref: "MT-STK", name: "Sticks 2 g (vrac pour coffrets)", cat: "Semi-fini", qty: 5200, min: 2000, loc: "B-01", sup: "midori", cost: 0.42 },
  { ref: "ACC-VERRE", name: "Verre MATOCHA", cat: "Accessoire", qty: 380, min: 150, loc: "B-02", sup: "lumen", sku: "VERRE", cost: 3.1 },
  { ref: "ACC-FOUET", name: "Fouet électrique", cat: "Accessoire", qty: 45, min: 80, loc: "B-03", sup: "fouets", sku: "FOUET", cost: 5.8, onOrder: true },
  { ref: "ACC-COFFRET", name: "Coffret cadeau (vide)", cat: "Accessoire", qty: 120, min: 60, loc: "B-04", sup: "cartonnages", cost: 4.2 },
  { ref: "EMB-CART-S", name: "Carton d'expédition S", cat: "Emballage", qty: 310, min: 400, loc: "C-01", sup: "cartonnages", cost: 0.38 },
  { ref: "EMB-CART-M", name: "Carton d'expédition M", cat: "Emballage", qty: 900, min: 300, loc: "C-02", sup: "cartonnages", cost: 0.52 },
  { ref: "EMB-CALAGE", name: "Calage papier (rouleau)", cat: "Emballage", qty: 18, min: 6, loc: "C-03", sup: "cartonnages", cost: 21 },
  { ref: "EMB-CARTE", name: "Carte manuscrite", cat: "Emballage", qty: 2400, min: 500, loc: "C-04", sup: "imprim", cost: 0.09 },
  { ref: "EMB-STICKER", name: "Sticker verre MATOCHA", cat: "Emballage", qty: 3100, min: 800, loc: "D-01", sup: "imprim", cost: 0.04 },
  { ref: "EMB-ETIQ", name: "Étiquettes transporteur (rouleau)", cat: "Emballage", qty: 14, min: 8, loc: "D-02", sup: "imprim", cost: 11.5 },
  { ref: "PLV-PRES", name: "Présentoir comptoir", cat: "PLV", qty: 34, min: 10, loc: "D-03", sup: "cartonnages", sku: "PLV", cost: 12 },
];
const ST = (ref: string) => uid(`stock:${ref}`);
insert(
  "stock_items",
  stock.map((s) => ({ id: ST(s.ref), org_id: ORG, catalog_item_id: s.sku ? CI(s.sku) : null, supplier_id: SU(s.sup), reference: s.ref, name: s.name, category: s.cat, quantity: s.qty, min_quantity: s.min, location: s.loc, zone_id: Z("stock"), unit_cost: s.cost, on_order: s.onOrder ?? false })),
);
const lots = [
  { n: "L2026-05A", ref: "MT-DB30", qty: 0, rec: -150, ddm: 300, status: "epuise", coa: true, samples: 3 },
  { n: "L2026-07A", ref: "MT-DB30", qty: 1240, rec: -88, ddm: 430, status: "libere", coa: true, samples: 3 },
  { n: "L2026-09B", ref: "MT-DB30", qty: 600, rec: -27, ddm: 495, status: "libere", coa: true, samples: 3 },
  { n: "L2026-09C", ref: "MT-DB10", qty: 160, rec: -27, ddm: 495, status: "libere", coa: true, samples: 3 },
  { n: "L2026-08V", ref: "MT-VR1K", qty: 22, rec: -60, ddm: 300, status: "libere", coa: true, samples: 2 },
  { n: "L2026-10C", ref: "MT-DB30", qty: 2400, rec: null, ddm: 540, status: "attendu", coa: null, samples: 0 },
];
insert(
  "lots",
  lots.map((l) => ({ id: uid(`lot:${l.n}`), org_id: ORG, stock_item_id: ST(l.ref), supplier_id: SU("midori"), number: l.n, quantity: l.qty, received_at: l.rec === null ? null : ts(l.rec, "10:15"), best_before: date(l.ddm), status: l.status, coa_ok: l.coa, retained_samples: l.samples })),
);
const moves: Row[] = [];
for (let d = 29; d >= 1; d--) {
  moves.push({ org_id: ORG, stock_item_id: ST("MT-DB30"), lot_id: uid(`lot:${d > 27 ? "L2026-07A" : "L2026-09B"}`), kind: "sortie", quantity: Math.round(between(60, 95)), reason: "Commandes du jour", at: ts(-d, "15:05") });
  if (d % 3 === 0) moves.push({ org_id: ORG, stock_item_id: ST("EMB-CART-S"), kind: "sortie", quantity: Math.round(between(150, 220)), reason: "Consommation expédition", at: ts(-d, "15:10") });
}
moves.push({ org_id: ORG, stock_item_id: ST("MT-DB30"), lot_id: uid("lot:L2026-09B"), kind: "entree", quantity: 2400, reason: "Réception lot L2026-09B", at: ts(-27, "10:15") });
moves.push({ org_id: ORG, stock_item_id: ST("EMB-CART-S"), kind: "entree", quantity: 1500, reason: "Réception commande cartons", at: ts(-12, "09:00") });
moves.push({ org_id: ORG, stock_item_id: ST("MT-DB30"), kind: "inventaire", quantity: 1840, reason: "Inventaire tournant allée A", at: ts(-1, "17:30") });
insert("stock_movements", moves);
insert("purchase_orders", [
  { org_id: ORG, supplier_id: SU("midori"), number: "PO-2026-031", status: "in_transit", lines: json([{ stock_item_id: ST("MT-DB30"), label: "Daily Box 30 × 2 g — lot L2026-10C", quantity: 2400, unit_cost: 14.2 }]), total_ht: 34080, expected_on: date(0) },
  { org_id: ORG, supplier_id: SU("fouets"), number: "PO-2026-032", status: "confirmed", lines: json([{ stock_item_id: ST("ACC-FOUET"), label: "Fouet électrique", quantity: 300, unit_cost: 5.8 }]), total_ht: 1740, expected_on: date(6) },
  { org_id: ORG, supplier_id: SU("cartonnages"), number: "PO-2026-033", status: "sent", lines: json([{ stock_item_id: ST("EMB-CART-S"), label: "Carton d'expédition S", quantity: 2000, unit_cost: 0.38 }]), total_ht: 760, expected_on: date(1) },
  { org_id: ORG, supplier_id: SU("lumen"), number: "PO-2026-028", status: "received", lines: json([{ stock_item_id: ST("ACC-VERRE"), label: "Verre MATOCHA", quantity: 500, unit_cost: 3.1 }]), total_ht: 1550, expected_on: date(-20), received_at: ts(-19, "10:30") },
]);

// ------------------------------------------------------------------ finance
const invoices: { n: string; client: string; wo?: string; quote?: string; status: string; issued: number; due: number; ht: number; paid?: number }[] = [
  { n: "F-2026-0418", client: "tilleuls", wo: "CP-24-0590", status: "sent", issued: -27, due: 3, ht: 1680 },
  { n: "F-2026-0421", client: "seve", wo: "CP-24-0601", quote: "Q-2026-0133", status: "sent", issued: -9, due: 21, ht: quoteTotals.get("Q-2026-0133")!.ht },
  { n: "F-2026-0422", client: "ondine", wo: "CP-24-0598", quote: "Q-2026-0131", status: "paid", issued: -15, due: 15, ht: quoteTotals.get("Q-2026-0131")!.ht },
  { n: "F-2026-0409", client: "canal", status: "overdue", issued: -52, due: -22, ht: 1240 },
  { n: "F-2026-0411", client: "zen", status: "overdue", issued: -45, due: -15, ht: 2310 },
  { n: "F-2026-0414", client: "verlaine", status: "overdue", issued: -38, due: -8, ht: 980 },
  { n: "F-2026-0415", client: "belvedere", status: "partial", issued: -34, due: -4, ht: 3150, paid: 1500 },
  { n: "F-2026-0401", client: "hinoki", status: "paid", issued: -70, due: -40, ht: 860 },
  { n: "F-2026-0403", client: "kissa", status: "paid", issued: -66, due: -36, ht: 1420 },
  { n: "F-2026-0405", client: "koen", status: "paid", issued: -60, due: -30, ht: 2140 },
  { n: "F-2026-0407", client: "tilleuls", status: "paid", issued: -57, due: -27, ht: 1590 },
  { n: "F-2026-0412", client: "altair", status: "paid", issued: -41, due: -11, ht: 4380 },
  { n: "F-2026-0416", client: "seve", status: "paid", issued: -31, due: -1, ht: 720 },
];
const invRows: Row[] = [];
const invLines: Row[] = [];
const payRows: Row[] = [];
for (const inv of invoices) {
  const t = computeTotals([{ quantity: 1, unitPrice: inv.ht, vatRate: R }]);
  const paid = inv.status === "paid" ? t.ttc : inv.paid ?? 0;
  invRows.push({ id: uid(`inv:${inv.n}`), org_id: ORG, number: inv.n, client_id: CL(inv.client), work_order_id: inv.wo ? WOID(inv.wo) : null, quote_id: inv.quote ? uid(`quote:${inv.quote}`) : null, status: inv.status, issued_on: date(inv.issued), due_on: date(inv.due), total_ht: t.ht, total_vat: t.vat, total_ttc: t.ttc, paid_amount: paid });
  invLines.push({ org_id: ORG, invoice_id: uid(`inv:${inv.n}`), label: inv.wo ? `Commande ${inv.wo}` : "Commande pro — produits MATOCHA", quantity: 1, unit_price: inv.ht, vat_rate: R });
  if (paid > 0) payRows.push({ org_id: ORG, invoice_id: uid(`inv:${inv.n}`), amount: paid, received_on: date(Math.min(-1, inv.due - 3)), method: "virement", reference: `VIR ${inv.n}` });
}
insert("invoices", invRows);
insert("invoice_lines", invLines);
insert("payments", payRows);
insert("dunning_steps", [
  { org_id: ORG, invoice_id: uid("inv:F-2026-0409"), level: 1, sent_at: ts(-15, "09:00"), due_at: ts(-15, "09:00") },
  { org_id: ORG, invoice_id: uid("inv:F-2026-0409"), level: 2, sent_at: ts(-5, "09:00"), due_at: ts(-5, "09:00") },
  { org_id: ORG, invoice_id: uid("inv:F-2026-0409"), level: 3, due_at: ts(0, "09:00") },
  { org_id: ORG, invoice_id: uid("inv:F-2026-0411"), level: 1, sent_at: ts(-8, "09:00"), due_at: ts(-8, "09:00") },
  { org_id: ORG, invoice_id: uid("inv:F-2026-0411"), level: 2, due_at: ts(0, "09:00") },
  { org_id: ORG, invoice_id: uid("inv:F-2026-0414"), level: 1, due_at: ts(0, "09:00") },
]);
insert("expenses", [
  { org_id: ORG, employee_id: TRAVEL.id, spent_on: date(-1), category: "Transport", label: "Train Paris–Lyon (salon)", amount_ttc: 118.4, vat_amount: 10.76, status: "submitted" },
  { org_id: ORG, employee_id: E("account_manager", 0).id, spent_on: date(-3), category: "Repas client", label: "Déjeuner Kissa Mori", amount_ttc: 64.5, vat_amount: 5.86, status: "submitted" },
  { org_id: ORG, employee_id: E("createur", 0).id, spent_on: date(-6), category: "Accessoires tournage", label: "Fond papier ivoire", amount_ttc: 89, vat_amount: 14.83, status: "approved", approver_id: E("head_brand").id },
  { org_id: ORG, employee_id: E("head_sales").id, spent_on: date(-12), category: "Transport", label: "Taxi rendez-vous Hôtel des Tilleuls", amount_ttc: 32.2, vat_amount: 2.93, status: "reimbursed", approver_id: E("daf").id },
  { org_id: ORG, employee_id: E("rd").id, spent_on: date(-2), category: "Fournitures", label: "Lait d'avoine (tests recettes)", amount_ttc: 24.6, vat_amount: 1.28, status: "submitted" },
]);
insert(
  "cash_forecast",
  Array.from({ length: 8 }, (_, w) => ({ org_id: ORG, week_start: raw(`date_trunc('week', app.local_date(${w * 7}))::date`), inflow: Math.round(between(48000, 66000)), outflow: Math.round(between(41000, 58000) + (w === 1 ? 34080 : 0)), note: w === 1 ? "Paiement lot L2026-10C" : null })),
);

// ------------------------------------------------------------------ communication
const threads = [
  { k: "belvedere", subject: "Re: Devis carte hiver — quantités", client: "belvedere", status: "awaiting_reply", days: -3, msgs: [["in", "Laura Steiner", "Bonjour, pourriez-vous ajuster le devis à 8 kg de vrac barista et ajouter 2 sessions de formation ? Merci !"]] },
  { k: "canal_relance", subject: "Facture F-2026-0409 — relance", client: "canal", status: "open", days: -5, msgs: [["out", "Nathalie Blanc", "Bonjour, sauf erreur de notre part la facture F-2026-0409 reste impayée…"]] },
  { k: "hinoki_livraison", subject: "Livraison de cet après-midi", client: "hinoki", wo: "CP-24-0607", status: "answered", days: 0, msgs: [["in", "Mathilde Aubry", "On vous attend vers 14 h, l'entrée de service est rue de la Roquette."], ["out", "Karim Saïdi", "Parfait, le colis part du contrôle qualité dans l'heure."]] },
  { k: "shala_en", subject: "Matcha workshop for our students", client: "shala", status: "awaiting_reply", days: -41, msgs: [["in", "Priya Morin", "Hi! We'd love to host a matcha tasting for our yoga students. Do you offer that?"]] },
  { k: "koen_photos", subject: "Photos du corner Discovery Box", client: "koen", status: "awaiting_reply", days: -1, msgs: [["in", "Aiko Bernard", "Voici les photos du corner, pouvez-vous nous envoyer 2 présentoirs supplémentaires ?"]] },
  { k: "interne_lot", subject: "Lot L2026-10C — arrivée aujourd'hui", status: "open", channel: "interne", days: 0, msgs: [["in", "Hélène Roussel", "Le porteur est annoncé ce matin. Quarantaine prévue, dégustation à 16 h."]] },
] as const;
for (const t of threads) {
  const tid = uid(`thread:${t.k}`);
  insert("threads", [{ id: tid, org_id: ORG, channel: "channel" in t ? t.channel : "email", subject: t.subject, client_id: "client" in t ? CL(t.client) : null, work_order_id: "wo" in t ? WOID(t.wo) : null, status: t.status, last_message_at: ts(t.days, "10:30") }]);
  insert("messages", t.msgs.map(([dir, from, body], i) => ({ org_id: ORG, thread_id: tid, direction: dir, from_name: from, body, language: t.k === "shala_en" ? "en" : "fr", sent_at: ts(t.days, hm(9 * 60 + i * 40)) })));
}
insert("messages", [{ org_id: ORG, thread_id: uid("thread:belvedere"), direction: "out", from_name: "Brouillon IA", body: "Bonjour Laura, merci pour votre retour. Je vous envoie le devis ajusté : 8 kg de vrac barista et 2 sessions de formation…", is_ai_draft: true }]);
insert("documents", [
  { org_id: ORG, entity_type: "lots", entity_id: uid("lot:L2026-09B"), name: "Certificat d'analyse L2026-09B.pdf", kind: "coa" },
  { org_id: ORG, entity_type: "quotes", entity_id: uid("quote:Q-2026-0141"), name: "Devis Q-2026-0141.pdf", kind: "devis" },
  { org_id: ORG, entity_type: "clients", entity_id: CL("tilleuls"), name: "Contrat cadre Hôtel des Tilleuls.pdf", kind: "contrat" },
  { org_id: ORG, entity_type: "employees", entity_id: E("preparateur", 3).id, name: "Contrat CDD.pdf", kind: "contrat" },
]);
insert("notifications", [
  { org_id: ORG, kind: "stock_bas", title: "Stock bas : Carton d'expédition S", body: "310 en stock pour un minimum de 400.", entity_type: "stock_items", entity_id: ST("EMB-CART-S"), created_at: rel(-90) },
  { org_id: ORG, kind: "conges", title: "3 demandes de congés à valider", entity_type: "leave_requests", created_at: rel(-60) },
  { org_id: ORG, kind: "relance", title: "3 factures échues à relancer", entity_type: "invoices", created_at: rel(-45) },
  { org_id: ORG, kind: "devis", title: "Hôtel Belvédère a ouvert le devis Q-2026-0141", entity_type: "quotes", entity_id: uid("quote:Q-2026-0141"), created_at: rel(-30) },
  { org_id: ORG, kind: "avis", title: "Avis client 5★ : « enfin un matcha qui se prépare au bureau »", created_at: rel(-12) },
]);

// ------------------------------------------------------------------ RH : revues, formations, recrutement, onboarding
insert("reviews", [
  { org_id: ORG, employee_id: E("preparateur", 2).id, reviewer_id: E("head_logistique").id, scheduled_on: date(12), status: "planned", objectives: json([{ titre: "Taux d'erreur de préparation < 0,5 %", poids: 0.5 }]) },
  { org_id: ORG, employee_id: E("createur", 0).id, reviewer_id: E("head_brand").id, scheduled_on: date(-40), status: "done", objectives: json([{ titre: "30 vidéos / mois", atteint: true }]), summary: "Très bonne progression sur le format court ; viser plus de tests d'accroche." },
]);
insert("trainings", [
  { org_id: ORG, employee_id: E("receptionnaire").id, title: "Recyclage CACES 1", provider: "Organisme fictif", starts_on: date(18), hours: 7, cost: 390 },
  { org_id: ORG, employee_id: E("qualite").id, title: "HACCP — mise à jour", provider: "Organisme fictif", starts_on: date(-60), hours: 14, cost: 650, status: "done" },
]);
insert("job_openings", [
  { id: uid("job:prep"), org_id: ORG, title: "Préparateur·rice de commandes (CDD 6 mois)", department_id: uid("dept:logistique"), criteria: json(["Expérience entrepôt", "Rigueur", "Disponible 7 h"]), status: "open", opened_on: date(-18) },
  { id: uid("job:am"), org_id: ORG, title: "Chargé·e de comptes pros — Lyon", department_id: uid("dept:ventes"), criteria: json(["Réseau CHR", "Dégustation", "Permis B"]), status: "open", opened_on: date(-9) },
]);
insert("candidates", [
  { org_id: ORG, job_opening_id: uid("job:prep"), full_name: "Kevin Marchetti", source: "Indeed", score: "A", stage: "entretien_2", ai_summary: json({ forts: ["3 ans en e-commerce"], faibles: [], a_verifier: ["Disponibilité 7 h"] }) },
  { org_id: ORG, job_opening_id: uid("job:prep"), full_name: "Laura Pinto", source: "Candidature spontanée", score: "B", stage: "entretien_1" },
  { org_id: ORG, job_opening_id: uid("job:prep"), full_name: "Ibrahim Sow", source: "France Travail", score: "B", stage: "nouveau" },
  { org_id: ORG, job_opening_id: uid("job:am"), full_name: "Margaux Delorme", source: "LinkedIn", score: "A", stage: "entretien_1" },
  { org_id: ORG, job_opening_id: uid("job:am"), full_name: "Hugo Bailly", source: "Cooptation", score: "C", stage: "refuse" },
  { org_id: ORG, job_opening_id: uid("job:am"), full_name: "Selma Aït", source: "LinkedIn", score: "B", stage: "nouveau" },
]);
insert("onboarding_tasks", ["Remise du badge et du tablier", "Formation sécurité entrepôt", "Binôme 3 jours avec un préparateur", "Point à 1 mois"].map((title, i) => ({ org_id: ORG, employee_id: E("preparateur", 3).id, title, due_on: date(-20 + i * 9), done_at: i < 3 ? ts(-20 + i * 9, "17:00") : null })));

// ------------------------------------------------------------------ pilotage
const automations = [
  ["Stock sous le minimum → bon de commande brouillon", { type: "threshold", table: "stock_items", field: "quantity", below: "min_quantity" }, [{ type: "create_purchase_order_draft" }, { type: "notify", role: "operations" }]],
  ["Lot reçu → quarantaine + tâche de contrôle", { type: "event", event: "lot.quarantaine" }, [{ type: "create_task", assignee_role: "qualite", title: "Contrôler le lot" }]],
  ["DDM < 90 jours → alerte qualité", { type: "date", table: "lots", field: "best_before", within_days: 90 }, [{ type: "notify", role: "operations" }]],
  ["Devis ouvert sans réponse 3 j → relance pré-rédigée", { type: "date", table: "quotes", field: "opened_at", after_days: 3 }, [{ type: "ai_draft_email", template: "relance_devis" }]],
  ["Devis accepté → commande pro créée", { type: "event", event: "quote.accepted" }, [{ type: "create_work_order" }]],
  ["Commande livrée → facture brouillon", { type: "event", event: "work_order.stage", to: "livree" }, [{ type: "create_invoice_draft" }]],
  ["Facture échue → relance niveau suivant", { type: "date", table: "invoices", field: "due_on", after_days: 1 }, [{ type: "dunning_next_level" }]],
  ["Compte pro sans contact 30 j → rappel relation", { type: "date", table: "clients", field: "last_contact_at", after_days: 30 }, [{ type: "create_task", assignee: "owner" }]],
  ["Commande en ligne non expédiée à 15 h → alerte", { type: "date", table: "shop_orders", field: "ship_deadline", after_minutes: 0 }, [{ type: "notify", role: "operations" }]],
  ["Demande de congé → notification au manager", { type: "event", event: "leave.pending" }, [{ type: "notify", target: "manager" }]],
] as const;
insert("automations", automations.map(([name, trigger, actions]) => ({ org_id: ORG, name, enabled: true, trigger: json(trigger), actions: json(actions) })));
insert("reports", [{ org_id: ORG, name: "Rapport hebdomadaire de direction", schedule: "0 7 * * 1", recipients: [empEmail(E("dg")), empEmail(E("fondateur"))], definition: json({ kpis: C.kpisEnTete.map((k) => k.id) }) }]);

// Fil d'activité récent (le reste viendra des triggers et du simulateur)
const activity: Row[] = [
  ...badges.filter((b) => b.kind === "in").map((b) => ({ org_id: ORG, type: "badge.in", entity: "employees", entity_id: b.employee_id, payload: json({ reader: "accueil" }), at: b.at })),
  { org_id: ORG, type: "quote.accepted", entity: "quotes", entity_id: uid("quote:Q-2026-0144"), payload: json({ number: "Q-2026-0144", client: "Hôtel des Tilleuls" }), at: ts(0, "08:40") },
  { org_id: ORG, type: "work_order.created", entity: "work_orders", entity_id: WOID("CP-24-0612"), payload: json({ number: "CP-24-0612" }), at: ts(0, "08:41") },
  { org_id: ORG, type: "work_order.stage", entity: "work_orders", entity_id: WOID("CP-24-0607"), payload: json({ number: "CP-24-0607", from: "preparation", to: "controle" }), at: rel(-35) },
  { org_id: ORG, type: "stock.low", entity: "stock_items", entity_id: ST("EMB-CART-S"), payload: json({ quantity: 310, min: 400 }), at: rel(-90) },
];
for (const e of PAUSE_NOW) activity.push({ org_id: ORG, type: "badge.pause_start", entity: "employees", entity_id: e.id, payload: json({ reader: "detente" }), at: rel(-8) });
insert("activity_events", activity);

sql(`select set_config('app.seeding', 'off', false);`);

const target = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));
writeFileSync(target, out.join("\n"));
console.log(`seed.sql écrit (${employees.length} collaborateurs, ${clients.length} comptes, ${wos.length} commandes pro, ${quotes.length} devis, ${stock.length} références).`);
