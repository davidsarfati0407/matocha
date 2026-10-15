/** Règles de la file de synchronisation : délai de reprise exponentiel, abandon après 6 essais. */
export const MAX_ATTEMPTS = 6;

/** Délai avant le prochain essai : 30 s, 1 min, 2 min, 4 min, 8 min… plafonné à 6 h. */
export function backoffMs(attempt: number) {
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), 6 * 3600_000);
}

/** Erreur définitive (inutile de réessayer) : droits refusés, ressource introuvable, requête invalide. */
export function isPermanent(status?: number) {
  return status !== undefined && [400, 403, 404, 410, 422].includes(status);
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
