"use server";
/** Actions des ressources : stock, lots, achats, équipements. Droits appliqués par la RLS. */
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { reorderQuantity } from "@/lib/domain/stock";
import { createClient } from "@/lib/supabase/server";

/** Réapprovisionnement en un clic : un bon brouillon par fournisseur, quantités calculées par le domaine. */
export async function reorder(ids: string[]): Promise<ActionResult<{ id: string; number: string }[]>> {
  const t = await getTranslations("resources.actions");
  const supabase = await createClient();
  const { data: items, error: e1 } = await supabase.from("stock_items").select("id, quantity, min_quantity, on_order, supplier_id").in("id", ids);
  if (e1) return fail(e1);
  const lines = (items ?? []).map((i) => ({ stock_item_id: i.id, quantity: reorderQuantity({ quantity: Number(i.quantity), minQuantity: Number(i.min_quantity), onOrder: i.on_order }) })).filter((l) => l.quantity > 0);
  if (!lines.length) return { ok: false, error: t("nothingToOrder") };
  const { data, error } = await supabase.rpc("reorder_stock", { items: lines });
  if (error) return fail(error);
  const pos = data as { id: string; number: string }[];
  revalidatePath("/resources", "layout");
  return { ok: true, message: t("reorderDone", { count: pos.length, numbers: pos.map((p) => p.number).join(", ") }), data: pos };
}

export async function setPurchaseOrderStatus(id: string, status: "sent" | "confirmed" | "in_transit" | "cancelled"): Promise<ActionResult> {
  const t = await getTranslations("resources.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/resources/purchase-orders");
  return { ok: true, message: status === "sent" ? t("poSent") : t("poUpdated") };
}

export async function receivePurchaseOrder(id: string): Promise<ActionResult> {
  const t = await getTranslations("resources.actions");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("receive_purchase_order", { po: id });
  if (error) return fail(error);
  revalidatePath("/resources", "layout");
  const lots = data as { number: string }[];
  return { ok: true, message: t("received", { lots: lots.map((l) => l.number).join(", ") }) };
}

export async function qualityDecision(lotId: string, release: boolean, notes?: string): Promise<ActionResult> {
  const t = await getTranslations("resources.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("lots").update({ status: release ? "libere" : "bloque", coa_ok: release, qc_notes: notes || null }).eq("id", lotId);
  if (error) return fail(error);
  revalidatePath("/resources/lots", "layout");
  return { ok: true, message: release ? t("lotReleased") : t("lotBlocked") };
}

export async function countStock(id: string, quantity: number): Promise<ActionResult> {
  const t = await getTranslations("resources.actions");
  if (!(quantity >= 0)) return { ok: false, error: t("invalidQuantity") };
  const supabase = await createClient();
  const { error } = await supabase.from("stock_movements").insert({ stock_item_id: id, kind: "inventaire", quantity, reason: "Inventaire tournant" });
  if (error) return fail(error);
  revalidatePath("/resources/stock", "layout");
  return { ok: true, message: t("countSaved") };
}

export async function setAssetStatus(id: string, status: string, nextMaintenance?: string): Promise<ActionResult> {
  const t = await getTranslations("resources.actions");
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (nextMaintenance) patch.next_maintenance_on = nextMaintenance;
  const { error } = await supabase.from("assets").update(patch).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/resources/assets", "layout");
  return { ok: true, message: t("assetUpdated") };
}
