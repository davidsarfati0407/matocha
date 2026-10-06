/** A typed API error: code is stable for agents, message is French for humans. */
export class OpsError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new OpsError(404, "not_found", `${what} introuvable.`);
export const invalid = (message: string, details?: unknown) =>
  new OpsError(422, "validation_error", message, details);
