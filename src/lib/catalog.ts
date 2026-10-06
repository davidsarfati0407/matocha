import "server-only";
import { baseCatalog, type Catalog } from "@/content/catalog";
import { getStore } from "@/lib/store";
import type { CatalogOverrideRow } from "@/lib/store/types";

/** Deep merge of plain objects; arrays and Proof objects are replaced whole. */
function merge<T>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key];
    const isPlain = (v: unknown) =>
      !!v && typeof v === "object" && !Array.isArray(v);
    /* A Proof is replaced as a unit so a status and its value never desync. */
    const isProof = isPlain(value) && "status" in (value as object);
    out[key] =
      isPlain(current) && isPlain(value) && !isProof
        ? merge(current, value as Record<string, unknown>)
        : value;
  }
  return out as T;
}

export function applyOverrides(
  catalog: Catalog,
  overrides: CatalogOverrideRow[],
): Catalog {
  const next: Catalog = structuredClone(catalog);
  for (const o of overrides) {
    switch (o.entity) {
      case "recipe":
        next.recipes = next.recipes.map((r) => (r.key === o.key ? merge(r, o.patch) : r));
        break;
      case "pack":
        next.packs = next.packs.map((p) => (p.key === o.key ? merge(p, o.patch) : p));
        break;
      case "family":
        next.families = next.families.map((f) => (f.id === o.key ? merge(f, o.patch) : f));
        break;
      case "company":
        next.company = merge(next.company, o.patch);
        break;
      case "shipping":
        next.shipping = merge(next.shipping, o.patch);
        break;
      case "socials":
        if (Array.isArray(o.patch.items)) next.socials = o.patch.items as Catalog["socials"];
        break;
    }
  }
  return next;
}

/**
 * The live catalogue: the typed base, plus overrides approved through the Ops
 * API. Falls back to the base catalogue if storage is absent or unreachable —
 * the base is the most conservative state, so failing closed is safe.
 */
export async function getCatalog(): Promise<Catalog> {
  const store = getStore();
  if (!store) return baseCatalog;
  try {
    const overrides = await store.list<CatalogOverrideRow>("catalog_overrides");
    return applyOverrides(baseCatalog, overrides);
  } catch (error) {
    console.error("[catalog] overrides unavailable, using base catalogue", error);
    return baseCatalog;
  }
}
