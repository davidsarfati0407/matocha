import type { Proof } from "@/content/catalog/types";

export const PENDING_LABEL = "En cours de validation";

export function isConfirmed<T>(proof: Proof<T>): proof is Proof<T> & { value: T } {
  return proof.status === "confirmed" && proof.value !== null;
}

/**
 * Text for a Proof field. The value is shown only once confirmed; otherwise the
 * pending label, followed by the public hypothesis when there is one.
 */
export function proofText<T>(
  proof: Proof<T>,
  format: (value: T) => string = (v) => String(v),
): { text: string; confirmed: boolean; target?: string } {
  if (isConfirmed(proof)) return { text: format(proof.value), confirmed: true };
  return { text: PENDING_LABEL, confirmed: false, target: proof.target };
}

export function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(value)
    .replace(/[   ]/g, " ");
}
