/** Résultat des actions serveur (partagé serveur/client). */
export type Ok<T = unknown> = { ok: true; message?: string; data?: T };
export type Fail = { ok: false; error: string };
export type ActionResult<T = unknown> = Ok<T> | Fail;

/** Erreur Supabase → message lisible (droits refusés = message clair). */
export function fail(e: { message: string; code?: string } | null | undefined): Fail {
  if (e?.code === "42501") return { ok: false, error: "Votre rôle ne permet pas cette action." };
  if (e?.code === "23505") return { ok: false, error: "Cet élément existe déjà." };
  return { ok: false, error: e?.message ?? "Erreur inconnue" };
}
