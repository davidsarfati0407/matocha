import "server-only";
import type { SiteMode } from "@/content/catalog/types";
import { getStore } from "@/lib/store";
import type { SettingRow } from "@/lib/store/types";

/**
 * Site mode, decided on the server only.
 *
 * "sale" requires BOTH:
 *  1. the deployment to allow it (`SITE_MODE_SALE_UNLOCK=true`), and
 *  2. the `settings.site_mode` row to be "sale" — written only when a human
 *     approves a `change_request` whose blocking checklist passed
 *     (see src/lib/ops/checklist.ts).
 *
 * Any error, missing storage or missing flag resolves to "prelaunch".
 */
export async function getSiteMode(): Promise<SiteMode> {
  if (process.env.SITE_MODE_SALE_UNLOCK !== "true") return "prelaunch";
  const store = getStore();
  if (!store) return "prelaunch";
  try {
    const row = await store.get<SettingRow>("settings", "site_mode");
    return row?.value === "sale" ? "sale" : "prelaunch";
  } catch {
    return "prelaunch";
  }
}
