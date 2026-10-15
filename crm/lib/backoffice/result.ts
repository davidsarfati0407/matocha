/** Résultat des actions serveur (types partagés serveur/client). */
export type Ok<T = unknown> = { ok: true; message?: string; data?: T };
export type Fail = { ok: false; error: string };
export type ActionResult<T = unknown> = Ok<T> | Fail;

/** Erreur Supabase → message lisible, dans la langue de l'utilisateur (côté serveur uniquement). */
export async function fail(e: { message: string; code?: string } | null | undefined): Promise<Fail> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("ui");
  if (e?.code === "42501") return { ok: false, error: t("forbidden") };
  if (e?.code === "23505") return { ok: false, error: t("duplicate") };
  return { ok: false, error: e?.message ?? t("unknownError") };
}
