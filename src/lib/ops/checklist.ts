import "server-only";
import { buyBlockers } from "@/lib/commerce/cta";
import { isPaymentConfigured } from "@/lib/commerce/provider";
import { isShippingConfigured } from "@/lib/commerce/shipping";
import { getCatalog } from "@/lib/catalog";
import { getSetting } from "./settings";

export type ChecklistItem = { id: string; label: string; ok: boolean; detail?: string };

/**
 * Blocking checklist for prelaunch → sale. Evaluated on the server when the
 * change request is approved — the admin UI only displays it.
 */
export async function saleChecklist(): Promise<{ ok: boolean; items: ChecklistItem[] }> {
  const catalog = await getCatalog();
  const c = catalog.company;
  const companyFields: [string, { status: string; value: unknown }][] = [
    ["opérateur responsable", c.responsibleOperator],
    ["forme juridique", c.legalForm],
    ["immatriculation", c.registration],
    ["adresse", c.address],
  ];
  const missingCompany = companyFields
    .filter(([, p]) => p.status !== "confirmed" || p.value === null)
    .map(([label]) => label);

  const sellable = catalog.packs.filter((pack) =>
    pack.recipeIds.some((rid) => {
      const recipe = catalog.recipes.find((r) => r.familyId === pack.familyId && r.id === rid);
      return recipe && buyBlockers("sale", pack, recipe, c).length === 0;
    }),
  );

  const legalComplete = (await getSetting<boolean>("legal_pages_complete")) === true;
  const shippingFlag = (await getSetting<boolean>("shipping_configured")) === true;

  const items: ChecklistItem[] = [
    {
      id: "company",
      label: "Société renseignée et confirmée",
      ok: missingCompany.length === 0,
      detail: missingCompany.length ? `Manque : ${missingCompany.join(", ")}` : undefined,
    },
    {
      id: "legal_pages",
      label: "Pages légales complètes (mentions, CGV, confidentialité, cookies)",
      ok: legalComplete,
      detail: legalComplete ? undefined : "Réglage legal_pages_complete absent ou faux",
    },
    {
      id: "sellable_pack",
      label: "Au moins un pack disponible, prix et infos alimentaires confirmés",
      ok: sellable.length > 0,
      detail: sellable.length ? sellable.map((p) => p.key).join(", ") : "Aucun pack ne passe le résolveur d'achat",
    },
    {
      id: "payment",
      label: "Paiement configuré (Stripe)",
      ok: isPaymentConfigured(),
      detail: isPaymentConfigured() ? undefined : "STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET requis",
    },
    {
      id: "shipping",
      label: "Livraison configurée",
      ok: isShippingConfigured(shippingFlag),
      detail: shippingFlag ? undefined : "Réglage shipping_configured absent ou faux",
    },
  ];
  return { ok: items.every((i) => i.ok), items };
}
