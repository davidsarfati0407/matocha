import "server-only";
import { randomUUID } from "node:crypto";
import type { CommercialStatus, Recipe } from "@/content/catalog/types";
import { getCatalog } from "@/lib/catalog";
import { getShippingProvider } from "@/lib/commerce/shipping";
import { getSiteMode } from "@/lib/mode";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import type { LeadRow } from "@/lib/waitlist/service";
import { audit } from "./audit";
import { authenticate, requireScope } from "./auth";
import { createChangeRequest, type ChangeRequestRow } from "./changes";
import { saleChecklist } from "./checklist";
import { nowIso, sha256 } from "./crypto";
import { OpsError, invalid, notFound } from "./errors";
import { lookupIdempotent, requireIdempotencyKey, saveIdempotent } from "./idempotency";
import { patchOverride } from "./overrides";
import { enforceRateLimit } from "./rate-limit";
import { revalidateSite } from "./revalidate";
import type { Scope } from "./scopes";
import type { ApiTokenRow } from "./tokens";

/* =========================================================================
 * The Ops service layer. REST (/api/ops/v1) and MCP (/mcp) both call
 * `executeOperation`, so auth, scopes, rate limiting, idempotency and audit
 * behave identically whichever protocol the agent uses.
 * ======================================================================= */

export type Args = Record<string, unknown>;

export type OpResult = {
  status: number;
  body: unknown;
  contentType?: string;
  before?: unknown;
  after?: unknown;
};

type Ctx = { token: ApiTokenRow | null; actor: string };

export type Operation = {
  name: string;
  description: string;
  /** "public" = no token. */
  scope: Scope | "public";
  write: boolean;
  /** JSON Schema of `args`, exposed to MCP clients. */
  input: Record<string, unknown>;
  run: (args: Args, ctx: Ctx) => Promise<OpResult>;
};

/* -------------------------------------------------------------- helpers */

const store = () => {
  const s = getStore();
  if (!s) throw new OpsError(503, "storage_not_configured", "Le stockage n'est pas configuré.");
  return s;
};

const str = (v: unknown, name: string, max = 2000) => {
  if (typeof v !== "string" || !v.trim()) throw invalid(`Champ « ${name} » requis (texte).`);
  if (v.length > max) throw invalid(`Champ « ${name} » trop long (${max} max).`);
  return v.trim();
};

const optStr = (v: unknown, name: string, max = 2000) =>
  v === undefined || v === null ? undefined : str(v, name, max);

const obj = (v: unknown, name: string) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw invalid(`Champ « ${name} » requis (objet).`);
  return v as Record<string, unknown>;
};

const accepted = (cr: ChangeRequestRow, extra: Record<string, unknown> = {}): OpResult => ({
  status: 202,
  body: {
    change_request: { id: cr.id, kind: cr.kind, target: cr.target, status: cr.status },
    message: "Demande créée. Elle sera appliquée après validation humaine dans /admin.",
    ...extra,
  },
  after: { change_request: cr.id },
});

const PROOF_FIELDS = [
  "denomination",
  "ingredients",
  "allergens",
  "matchaPerServingG",
  "servingTotal",
  "origin",
  "preparation",
  "storage",
  "nutrition",
  "caffeineMg",
] as const;
type ProofField = (typeof PROOF_FIELDS)[number];
const TEXT_FIELDS = ["description"] as const;

const COMMERCIAL: CommercialStatus[] = ["concept", "waitlist", "preorder", "available", "sold_out", "retired"];

async function recipeByKey(key: string) {
  const catalog = await getCatalog();
  const recipe = catalog.recipes.find((r) => r.key === key);
  if (!recipe) throw notFound(`Recette « ${key} »`);
  return recipe;
}

async function packByKey(key: string) {
  const catalog = await getCatalog();
  const pack = catalog.packs.find((p) => p.key === key);
  if (!pack) throw notFound(`Pack « ${key} »`);
  return pack;
}

const TAG_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;

const publicLead = (l: LeadRow) => ({
  id: l.id,
  email: l.email,
  interests: l.interests,
  tags: l.tags ?? [],
  source: l.source,
  confirmed_at: l.confirmed_at,
  consent_version: l.consent_version,
});

const csvCell = (value: unknown) => {
  const s = Array.isArray(value) ? value.join("|") : String(value ?? "");
  /* Neutralise spreadsheet formulas. */
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

type OrderRow = Row & {
  status: "pending" | "paid" | "payment_failed" | "refunded" | "shipped";
  email: string | null;
  amount_total_cents: number | null;
  currency: string | null;
  lines: unknown;
  checkout_session_id: string | null;
  payment_intent_id: string | null;
  created_at: string;
  paid_at: string | null;
};

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);

async function plausibleVisits(days: number): Promise<Record<string, number> | null> {
  const key = process.env.PLAUSIBLE_API_KEY;
  const site = process.env.PLAUSIBLE_SITE_ID;
  if (!key || !site) return null;
  try {
    const url = `https://plausible.io/api/v1/stats/timeseries?site_id=${encodeURIComponent(site)}&period=custom&date=${encodeURIComponent(
      `${new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)},${new Date().toISOString().slice(0, 10)}`,
    )}&metrics=visitors`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return null;
    const json = (await response.json()) as { results: { date: string; visitors: number }[] };
    return Object.fromEntries(json.results.map((r) => [r.date, r.visitors]));
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------- operations */

const idParam = { id: { type: "string", description: "Identifiant (clé)" } };

export const OPERATIONS: Operation[] = [
  {
    name: "health",
    description: "État de l'API et mode du site.",
    scope: "public",
    write: false,
    input: { type: "object", properties: {} },
    run: async () => ({
      status: 200,
      body: {
        ok: true,
        api: "matocha-ops",
        version: "v1",
        mode: await getSiteMode(),
        storage: getStore()?.kind ?? null,
        time: nowIso(),
      },
    }),
  },

  /* ------------------------------------------------------------ catalog */
  {
    name: "catalog_get",
    description: "Lire le catalogue complet : familles, recettes (goûts), packs, société.",
    scope: "catalog:read",
    write: false,
    input: { type: "object", properties: {} },
    run: async () => ({ status: 200, body: await getCatalog() }),
  },
  {
    name: "catalog_pack_get",
    description: "Lire un pack par sa clé (ex. poudre-decouverte).",
    scope: "catalog:read",
    write: false,
    input: { type: "object", properties: idParam, required: ["id"] },
    run: async (args) => ({ status: 200, body: await packByKey(str(args.id, "id", 80)) }),
  },
  {
    name: "catalog_recipe_patch",
    description:
      "Modifier les textes d'une recette ou proposer des valeurs de champs Proof, qui restent « to_confirm ». Ne confirme jamais rien.",
    scope: "catalog:write",
    write: true,
    input: {
      type: "object",
      properties: {
        ...idParam,
        fields: {
          type: "object",
          description:
            "description (texte) et/ou champs Proof { value?, target? } : denomination, ingredients, allergens, matchaPerServingG, servingTotal, origin, preparation, storage, nutrition, caffeineMg.",
        },
      },
      required: ["id", "fields"],
    },
    run: async (args) => {
      const key = str(args.id, "id", 80);
      const recipe = await recipeByKey(key);
      const fields = obj(args.fields, "fields");
      const patch: Record<string, unknown> = {};
      const before: Record<string, unknown> = {};
      for (const [name, raw] of Object.entries(fields)) {
        if ((TEXT_FIELDS as readonly string[]).includes(name)) {
          patch[name] = str(raw, name, 1000);
        } else if ((PROOF_FIELDS as readonly string[]).includes(name)) {
          const proof = obj(raw, name);
          if (proof.status !== undefined && proof.status !== "to_confirm") {
            throw new OpsError(
              422,
              "confirmation_requires_validation",
              "Un champ ne peut pas être confirmé par PATCH. Utilisez POST /catalog/recipes/:id/proofs.",
            );
          }
          patch[name] = {
            value: proof.value ?? null,
            status: "to_confirm",
            ...(typeof proof.target === "string" ? { target: proof.target.slice(0, 300) } : {}),
          };
        } else {
          throw invalid(`Champ « ${name} » non modifiable.`);
        }
        before[name] = recipe[name as keyof Recipe];
      }
      if (Object.keys(patch).length === 0) throw invalid("Aucun champ à modifier.");
      await patchOverride("recipe", key, patch);
      await revalidateSite();
      return { status: 200, body: { ok: true, recipe: key, updated: Object.keys(patch) }, before, after: patch };
    },
  },
  {
    name: "catalog_recipe_proof_confirm",
    description:
      "Demander la confirmation d'un champ Proof avec sa source (COA, devis…). Crée une demande de validation humaine.",
    scope: "catalog:write",
    write: true,
    input: {
      type: "object",
      properties: {
        ...idParam,
        field: { type: "string", enum: [...PROOF_FIELDS] },
        value: { description: "Valeur à confirmer" },
        source: { type: "string", description: "Document de preuve (interne)" },
        verifiedAt: { type: "string", description: "Date AAAA-MM-JJ" },
      },
      required: ["id", "field", "value", "source"],
    },
    run: async (args, ctx) => {
      const key = str(args.id, "id", 80);
      const recipe = await recipeByKey(key);
      const field = str(args.field, "field", 40) as ProofField;
      if (!PROOF_FIELDS.includes(field)) throw invalid(`Champ Proof inconnu : ${field}.`);
      if (args.value === undefined || args.value === null) throw invalid("Champ « value » requis.");
      const source = str(args.source, "source", 500);
      const cr = await createChangeRequest({
        kind: "recipe.proof",
        target: key,
        summary: `Confirmer ${field} de ${key}`,
        payload: { field, value: args.value, source, verifiedAt: optStr(args.verifiedAt, "verifiedAt", 10) },
        before: recipe[field],
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return accepted(cr);
    },
  },
  {
    name: "catalog_pack_price",
    description: "Proposer un prix TTC en euros pour un pack. Validation humaine obligatoire.",
    scope: "catalog:write",
    write: true,
    input: {
      type: "object",
      properties: { ...idParam, price: { type: "number", exclusiveMinimum: 0 }, source: { type: "string" } },
      required: ["id", "price"],
    },
    run: async (args, ctx) => {
      const key = str(args.id, "id", 80);
      const pack = await packByKey(key);
      const price = Number(args.price);
      if (!Number.isFinite(price) || price <= 0 || price > 10_000) throw invalid("Prix invalide (euros TTC > 0).");
      const cr = await createChangeRequest({
        kind: "pack.price",
        target: key,
        summary: `Prix de ${key} → ${price.toFixed(2)} € TTC`,
        payload: { price: Math.round(price * 100) / 100, source: optStr(args.source, "source", 500) ?? null },
        before: pack.price,
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return accepted(cr);
    },
  },
  {
    name: "catalog_pack_status",
    description:
      "Changer le statut commercial d'un pack. Le passage à « available » crée une demande de validation ; les autres statuts s'appliquent directement.",
    scope: "catalog:write",
    write: true,
    input: {
      type: "object",
      properties: { ...idParam, status: { type: "string", enum: COMMERCIAL } },
      required: ["id", "status"],
    },
    run: async (args, ctx) => {
      const key = str(args.id, "id", 80);
      const pack = await packByKey(key);
      const status = str(args.status, "status", 20) as CommercialStatus;
      if (!COMMERCIAL.includes(status)) throw invalid(`Statut inconnu : ${status}.`);
      if (status === "available") {
        const cr = await createChangeRequest({
          kind: "pack.status",
          target: key,
          summary: `Rendre ${key} disponible à la vente`,
          payload: { status },
          before: pack.commercialStatus,
          requestedBy: ctx.actor,
          tokenId: ctx.token?.id ?? null,
        });
        return accepted(cr);
      }
      await patchOverride("pack", key, { commercialStatus: status });
      await revalidateSite();
      return {
        status: 200,
        body: { ok: true, pack: key, commercialStatus: status },
        before: { commercialStatus: pack.commercialStatus },
        after: { commercialStatus: status },
      };
    },
  },

  /* ------------------------------------------------------------ content */
  {
    name: "content_list",
    description: "Lister les blocs de contenu (brouillons FAQ, bandeau d'annonce, textes de sections).",
    scope: "content:read",
    write: false,
    input: { type: "object", properties: { status: { type: "string", enum: ["draft", "published"] } } },
    run: async (args) => {
      const status = args.status === "draft" || args.status === "published" ? args.status : undefined;
      const rows = await store().list("content_blocks", {
        filter: status ? { status } : undefined,
        orderBy: { column: "updated_at", ascending: false },
      });
      return { status: 200, body: { items: rows } };
    },
  },
  {
    name: "content_create",
    description: "Créer un brouillon de bloc de contenu. La publication passe par content_publish.",
    scope: "content:write",
    write: true,
    input: {
      type: "object",
      properties: {
        key: { type: "string", description: "Ex. faq.livraison, announcement.home" },
        kind: { type: "string", enum: ["faq", "announcement", "section"] },
        title: { type: "string" },
        body: { type: "string", description: "Texte en français (Markdown simple)" },
        locale: { type: "string", enum: ["fr"] },
      },
      required: ["key", "kind", "body"],
    },
    run: async (args, ctx) => {
      const kind = str(args.kind, "kind", 20);
      if (!["faq", "announcement", "section"].includes(kind)) throw invalid("kind : faq, announcement ou section.");
      const now = nowIso();
      const row = await store().insert("content_blocks", {
        id: randomUUID(),
        key: str(args.key, "key", 80),
        kind,
        title: optStr(args.title, "title", 200) ?? null,
        body: str(args.body, "body", 10_000),
        locale: "fr",
        status: "draft",
        created_by: ctx.actor,
        created_at: now,
        updated_at: now,
        published_at: null,
      });
      return { status: 201, body: row, after: row };
    },
  },
  {
    name: "content_publish",
    description: "Demander la publication d'un brouillon. Validation humaine obligatoire.",
    scope: "content:write",
    write: true,
    input: { type: "object", properties: idParam, required: ["id"] },
    run: async (args, ctx) => {
      const id = str(args.id, "id", 80);
      const block = await store().get<Row & { key: string; status: string }>("content_blocks", id);
      if (!block) throw notFound("Bloc de contenu");
      const cr = await createChangeRequest({
        kind: "content.publish",
        target: id,
        summary: `Publier le bloc « ${block.key} »`,
        payload: {},
        before: { status: block.status },
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return accepted(cr);
    },
  },

  /* -------------------------------------------------------------- leads */
  {
    name: "leads_list",
    description: "Lister les inscrits confirmés de la liste d'attente.",
    scope: "leads:read",
    write: false,
    input: {
      type: "object",
      properties: { tag: { type: "string" }, interest: { type: "string" } },
    },
    run: async (args) => {
      let leads = await store().list<LeadRow>("leads", {
        filter: { status: "confirmed" },
        orderBy: { column: "confirmed_at", ascending: false },
      });
      if (typeof args.tag === "string") leads = leads.filter((l) => (l.tags ?? []).includes(args.tag as string));
      if (typeof args.interest === "string") leads = leads.filter((l) => l.interests.includes(args.interest as string));
      return { status: 200, body: { count: leads.length, items: leads.map(publicLead) } };
    },
  },
  {
    name: "leads_export",
    description: "Exporter les inscrits confirmés en CSV.",
    scope: "leads:read",
    write: false,
    input: { type: "object", properties: {} },
    run: async () => {
      const leads = await store().list<LeadRow>("leads", {
        filter: { status: "confirmed" },
        orderBy: { column: "confirmed_at", ascending: true },
      });
      const header = ["email", "interests", "tags", "source", "confirmed_at", "consent_version"];
      const lines = leads.map((l) =>
        [l.email, l.interests, l.tags ?? [], l.source, l.confirmed_at, l.consent_version].map(csvCell).join(","),
      );
      return {
        status: 200,
        body: [header.join(","), ...lines].join("\n") + "\n",
        contentType: "text/csv; charset=utf-8",
      };
    },
  },
  {
    name: "leads_tags",
    description: "Ajouter ou retirer des tags sur un inscrit.",
    scope: "leads:write",
    write: true,
    input: {
      type: "object",
      properties: {
        ...idParam,
        add: { type: "array", items: { type: "string" } },
        remove: { type: "array", items: { type: "string" } },
      },
      required: ["id"],
    },
    run: async (args) => {
      const id = str(args.id, "id", 80);
      const lead = await store().get<LeadRow>("leads", id);
      if (!lead) throw notFound("Inscrit");
      const list = (v: unknown, name: string) => {
        if (v === undefined) return [];
        if (!Array.isArray(v)) throw invalid(`« ${name} » doit être une liste.`);
        return v.map((t) => {
          if (typeof t !== "string" || !TAG_RE.test(t)) throw invalid(`Tag invalide : ${String(t)} (a-z, 0-9, : _ -).`);
          return t;
        });
      };
      const add = list(args.add, "add");
      const remove = list(args.remove, "remove");
      if (!add.length && !remove.length) throw invalid("Rien à modifier : add ou remove requis.");
      const before = lead.tags ?? [];
      const tags = [...new Set([...before, ...add])].filter((t) => !remove.includes(t));
      await store().update<LeadRow>("leads", id, { tags });
      return { status: 200, body: { id, tags }, before: { tags: before }, after: { tags } };
    },
  },

  /* ------------------------------------------------------------- orders */
  {
    name: "orders_list",
    description: "Lister les commandes.",
    scope: "orders:read",
    write: false,
    input: { type: "object", properties: { status: { type: "string" } } },
    run: async (args) => {
      const rows = await store().list<OrderRow>("orders", {
        filter: typeof args.status === "string" ? { status: args.status } : undefined,
        orderBy: { column: "created_at", ascending: false },
      });
      return { status: 200, body: { count: rows.length, items: rows } };
    },
  },
  {
    name: "orders_get",
    description: "Lire une commande.",
    scope: "orders:read",
    write: false,
    input: { type: "object", properties: idParam, required: ["id"] },
    run: async (args) => {
      const order = await store().get<OrderRow>("orders", str(args.id, "id", 80));
      if (!order) throw notFound("Commande");
      const shipments = await store().list("shipments", { filter: { order_id: order.id } });
      return { status: 200, body: { ...order, shipments } };
    },
  },
  {
    name: "orders_shipment_create",
    description:
      "Créer l'expédition d'une commande payée. Sans connecteur transporteur, carrier et trackingNumber sont requis (saisie manuelle).",
    scope: "orders:write",
    write: true,
    input: {
      type: "object",
      properties: { ...idParam, carrier: { type: "string" }, trackingNumber: { type: "string" }, trackingUrl: { type: "string" } },
      required: ["id"],
    },
    run: async (args) => {
      const id = str(args.id, "id", 80);
      const order = await store().get<OrderRow>("orders", id);
      if (!order) throw notFound("Commande");
      if (order.status !== "paid") {
        throw new OpsError(409, "order_not_paid", "Seule une commande payée peut être expédiée.");
      }
      const provider = getShippingProvider();
      if (!provider.configured && (!args.carrier || !args.trackingNumber)) {
        throw invalid("Aucun transporteur connecté : renseignez carrier et trackingNumber.");
      }
      const shipment = await store().insert("shipments", {
        id: randomUUID(),
        order_id: id,
        mode: provider.configured ? provider.kind : "manual",
        carrier: optStr(args.carrier, "carrier", 80) ?? null,
        tracking_number: optStr(args.trackingNumber, "trackingNumber", 120) ?? null,
        tracking_url: optStr(args.trackingUrl, "trackingUrl", 500) ?? null,
        created_at: nowIso(),
      });
      await store().update<OrderRow>("orders", id, { status: "shipped" });
      return { status: 201, body: shipment, before: { status: order.status }, after: { status: "shipped", shipment } };
    },
  },
  {
    name: "orders_refund_request",
    description: "Demander un remboursement (total ou partiel). Validation humaine obligatoire.",
    scope: "orders:write",
    write: true,
    input: {
      type: "object",
      properties: { ...idParam, amount_cents: { type: "integer", minimum: 1 }, reason: { type: "string" } },
      required: ["id", "reason"],
    },
    run: async (args, ctx) => {
      const id = str(args.id, "id", 80);
      const order = await store().get<OrderRow>("orders", id);
      if (!order) throw notFound("Commande");
      if (!["paid", "shipped"].includes(order.status)) {
        throw new OpsError(409, "order_not_refundable", "Cette commande n'est pas remboursable dans son état actuel.");
      }
      const amount = args.amount_cents === undefined ? undefined : Number(args.amount_cents);
      if (amount !== undefined && (!Number.isInteger(amount) || amount <= 0 || amount > (order.amount_total_cents ?? 0))) {
        throw invalid("amount_cents invalide.");
      }
      const cr = await createChangeRequest({
        kind: "order.refund",
        target: id,
        summary: `Rembourser la commande ${id}${amount ? ` (${(amount / 100).toFixed(2)} €)` : " (total)"}`,
        payload: { amount_cents: amount ?? null, reason: str(args.reason, "reason", 500) },
        before: { status: order.status },
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return accepted(cr);
    },
  },

  /* -------------------------------------------------------------- media */
  {
    name: "media_incoming",
    description:
      "Déposer un asset (URL de fichier déjà hébergé) avec statut et licence. La publication demande une validation humaine.",
    scope: "media:write",
    write: true,
    input: {
      type: "object",
      properties: {
        id: { type: "string", description: "Identifiant du manifest, ex. hero-pour-poudre-desktop" },
        family: { type: "string", enum: ["poudre", "concentre"] },
        recipe: { type: "string", enum: ["original", "vanille", "fraise"] },
        status: { type: "string", enum: ["real", "concept"] },
        kind: { type: "string", enum: ["video", "image", "rive", "lottie", "model3d"] },
        source: { type: "string" },
        license: { type: "object" },
        files: { type: "object", description: "{ desktop, mobile, poster } — URLs" },
        alt: { type: "string" },
        decorative: { type: "boolean" },
        usedIn: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
      required: ["id", "status", "kind", "source", "license", "files"],
    },
    run: async (args, ctx) => {
      const id = str(args.id, "id", 120);
      const status = str(args.status, "status", 10);
      if (!["real", "concept"].includes(status)) throw invalid("status : real ou concept.");
      const license = obj(args.license, "license");
      if (license.commercialUse !== true) {
        throw invalid("La licence doit autoriser l'usage commercial (license.commercialUse = true).");
      }
      const files = obj(args.files, "files");
      for (const [k, v] of Object.entries(files)) {
        if (typeof v !== "string" || !/^https:\/\//.test(v)) throw invalid(`files.${k} doit être une URL https.`);
      }
      if (args.decorative !== true && !optStr(args.alt, "alt", 300)) {
        throw invalid("Texte alternatif requis pour un média non décoratif.");
      }
      const now = nowIso();
      const rowId = `${id}:${sha256(JSON.stringify(files)).slice(0, 8)}`;
      const media = await store().upsert("media_items", {
        id: rowId,
        manifest_id: id,
        family: args.family ?? null,
        recipe: args.recipe ?? null,
        status,
        kind: str(args.kind, "kind", 20),
        source: str(args.source, "source", 200),
        license,
        files,
        alt: args.alt ?? "",
        decorative: args.decorative === true,
        used_in: Array.isArray(args.usedIn) ? args.usedIn : [],
        notes: args.notes ?? "",
        publish_status: "pending_review",
        submitted_by: ctx.actor,
        created_at: now,
        updated_at: now,
      });
      const cr = await createChangeRequest({
        kind: "media.publish",
        target: rowId,
        summary: `Publier le média « ${id} » (${status})`,
        payload: { manifest_id: id },
        before: null,
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return { ...accepted(cr, { media }), after: { media: rowId, change_request: cr.id } };
    },
  },

  /* ---------------------------------------------------------- analytics */
  {
    name: "analytics_summary",
    description: "Visites, inscriptions, confirmations, commandes payées et chiffre d'affaires par jour.",
    scope: "analytics:read",
    write: false,
    input: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 90 } } },
    run: async (args) => {
      const days = Math.min(90, Math.max(1, Number(args.days ?? 30) || 30));
      const leads = await store().list<LeadRow>("leads");
      const orders = await store().list<OrderRow>("orders");
      const visits = await plausibleVisits(days);
      const series = Array.from({ length: days }, (_, i) => {
        const date = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
        const paid = orders.filter((o) => day(o.paid_at) === date && ["paid", "shipped", "refunded"].includes(o.status));
        return {
          date,
          visits: visits ? (visits[date] ?? 0) : null,
          signups: leads.filter((l) => day(l.created_at) === date).length,
          confirmations: leads.filter((l) => day(l.confirmed_at) === date).length,
          orders_paid: paid.length,
          revenue_cents: paid.reduce((s, o) => s + (o.amount_total_cents ?? 0), 0),
        };
      });
      return {
        status: 200,
        body: {
          days,
          visits_source: visits ? "plausible" : null,
          visits_note: visits
            ? undefined
            : "Visites non disponibles : renseignez PLAUSIBLE_API_KEY et PLAUSIBLE_SITE_ID (Vercel Analytics n'expose pas d'API de lecture).",
          totals: {
            confirmed_leads: leads.filter((l) => l.status === "confirmed").length,
            pending_leads: leads.filter((l) => l.status === "pending").length,
          },
          series,
        },
      };
    },
  },

  /* ----------------------------------------------------------- settings */
  {
    name: "settings_mode_propose",
    description:
      "Proposer un changement de mode du site (prelaunch → sale ou retour). Toujours soumis à validation humaine et, pour « sale », à la checklist bloquante.",
    scope: "settings:propose",
    write: true,
    input: {
      type: "object",
      properties: { mode: { type: "string", enum: ["sale", "prelaunch"] }, reason: { type: "string" } },
      required: ["mode"],
    },
    run: async (args, ctx) => {
      const mode = str(args.mode, "mode", 20);
      if (mode !== "sale" && mode !== "prelaunch") throw invalid("mode : sale ou prelaunch.");
      const checklist = mode === "sale" ? await saleChecklist() : null;
      const cr = await createChangeRequest({
        kind: "settings.mode",
        target: "site_mode",
        summary: `Passer le site en mode ${mode === "sale" ? "vente" : "pré-lancement"}`,
        payload: { mode, reason: optStr(args.reason, "reason", 500) ?? null },
        before: await getSiteMode(),
        requestedBy: ctx.actor,
        tokenId: ctx.token?.id ?? null,
      });
      return accepted(cr, { checklist });
    },
  },
  {
    name: "change_request_get",
    description: "Suivre une demande de validation (statut, décision, erreur).",
    scope: "catalog:read",
    write: false,
    input: { type: "object", properties: idParam, required: ["id"] },
    run: async (args, ctx) => {
      const cr = await store().get<ChangeRequestRow>("change_requests", str(args.id, "id", 80));
      if (!cr || (ctx.token && cr.token_id && cr.token_id !== ctx.token.id)) throw notFound("Demande");
      return { status: 200, body: cr };
    },
  },
];

const BY_NAME = new Map(OPERATIONS.map((op) => [op.name, op]));
export const getOperation = (name: string) => BY_NAME.get(name);

/* ------------------------------------------------------------ pipeline */

export type ExecuteInput = {
  name: string;
  args: Args;
  authorization: string | null;
  idempotencyKey: string | null;
  /** For the audit log. */
  method: string;
  route: string;
};

export type ExecuteResult = OpResult & { replayed?: boolean; headers?: Record<string, string> };

const errorBody = (e: OpsError) => ({
  error: { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) },
});

export async function executeOperation(input: ExecuteInput): Promise<ExecuteResult> {
  const op = getOperation(input.name);
  if (!op) return { status: 404, body: errorBody(new OpsError(404, "unknown_operation", "Opération inconnue.")) };

  if (op.scope === "public") {
    try {
      return await op.run(input.args, { token: null, actor: "public" });
    } catch (e) {
      const err = e instanceof OpsError ? e : new OpsError(500, "internal_error", "Erreur interne.");
      return { status: err.status, body: errorBody(err) };
    }
  }

  let token: ApiTokenRow | null = null;
  let idemKey: string | null = null;
  const fingerprint = sha256(`${op.name}:${JSON.stringify(input.args)}`);
  let result: ExecuteResult;

  try {
    token = await authenticate(input.authorization);
    requireScope(token, op.scope);
    await enforceRateLimit(token.id);

    if (op.write) {
      idemKey = requireIdempotencyKey(input.idempotencyKey);
      const previous = await lookupIdempotent(token.id, idemKey, fingerprint);
      if (previous) {
        return { status: previous.status, body: previous.body, replayed: true, headers: { "Idempotent-Replayed": "true" } };
      }
    }

    result = await op.run(input.args, { token, actor: `token:${token.name}` });
  } catch (e) {
    const err =
      e instanceof OpsError
        ? e
        : (console.error(`[ops] ${op.name} failed`, e), new OpsError(500, "internal_error", "Erreur interne."));
    result = {
      status: err.status,
      body: errorBody(err),
      headers:
        err.status === 429 && err.details && typeof err.details === "object"
          ? { "Retry-After": String((err.details as { retry_after_seconds: number }).retry_after_seconds) }
          : undefined,
    };
  }

  if (token && idemKey && result.status < 500) {
    await saveIdempotent(token.id, idemKey, fingerprint, { status: result.status, body: result.body });
  }

  {
    await audit({
      actor: token ? `token:${token.name}` : "anonymous",
      token_id: token?.id ?? null,
      action: op.name,
      method: input.method,
      route: input.route,
      status: result.status,
      before: op.write ? (result.before ?? null) : null,
      after: op.write ? (result.after ?? null) : null,
    });
  }
  return result;
}
