// Edge Function : simulateur de démo côté serveur (à planifier avec pg_cron toutes les 15 s à 1 min).
// Elle se connecte avec le compte de démo « direction » et appelle demo_step('ambient'),
// qui passe par les mêmes tables que l'application. Sans effet si l'organisation n'est pas en mode démo.
// Déploiement : supabase functions deploy demo-simulator ; secrets DEMO_EMAIL / DEMO_PASSWORD.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const AMBIENT = [
  "Stock bas : cartons d'expédition S",
  "Avis client 5★ reçu",
  "Salle Uji réservée pour 14 h",
  "Ticket SAV résolu",
  "Relevé de température de l'échantillothèque : OK",
];

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { error: authError } = await supabase.auth.signInWithPassword({ email: Deno.env.get("DEMO_EMAIL")!, password: Deno.env.get("DEMO_PASSWORD")! });
  if (authError) return new Response(authError.message, { status: 401 });
  const text = AMBIENT[Math.floor(Math.random() * AMBIENT.length)];
  const { error } = await supabase.rpc("demo_step", { step: "ambient", params: { text } });
  return new Response(error ? error.message : "ok", { status: error ? 400 : 200 });
});
