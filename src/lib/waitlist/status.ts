import "server-only";
import { getEmailSender } from "@/lib/email";
import { getStore } from "@/lib/store";

/**
 * Formspree form id (free plan), e.g. "xyzabcde" from https://formspree.io/f/xyzabcde.
 * Used only when the full pipeline (Supabase + Resend) is not configured.
 */
export function formspreeId(): string | null {
  const id = process.env.FORMSPREE_FORM_ID?.trim();
  return id && /^[a-zA-Z0-9]+$/.test(id) ? id : null;
}

/** Double opt-in: our own store AND e-mail sender. */
export function hasDoubleOptIn(): boolean {
  return getStore() !== null && getEmailSender() !== null;
}

/**
 * The waitlist is open when addresses can really be kept: either the double
 * opt-in pipeline, or Formspree as the free fallback. Otherwise the form
 * renders "Inscriptions bientôt ouvertes" and never a fake confirmation.
 */
export function isWaitlistOpen(): boolean {
  return hasDoubleOptIn() || formspreeId() !== null;
}

/** Bump when the consent text changes; stored with each lead. */
export const CONSENT_VERSION = "2026-10-06.v2";

export const CONSENT_TEXT =
  "J'accepte de recevoir des e-mails de Matocha sur le lancement de la Daily Box. Je peux me désinscrire à tout moment, en un clic.";
