"use server";
/** Vues enregistrées des listes (filtres, tri, recherche), personnelles. */
import { createClient } from "@/lib/supabase/server";

export interface ViewState {
  q?: string;
  filters?: Record<string, string>;
  sort?: { key: string; dir: "asc" | "desc" };
}

export async function listViews(module: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("saved_views").select("id, name, filters").eq("module", module).order("created_at");
  return (data ?? []).map((v) => ({ id: v.id as string, name: v.name as string, state: v.filters as ViewState }));
}

export async function saveView(module: string, name: string, state: ViewState) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("saved_views").insert({ module, name, filters: state, user_id: user!.id }).select("id").single();
  return error ? { ok: false as const, error: error.message } : { ok: true as const, id: data.id as string };
}

export async function deleteView(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_views").delete().eq("id", id);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}
