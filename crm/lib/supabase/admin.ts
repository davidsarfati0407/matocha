import "server-only";
/** Client « service » (contourne la RLS) : réservé aux tâches serveur qui l'exigent (secrets d'intégration, file). */
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante (côté serveur uniquement)");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
