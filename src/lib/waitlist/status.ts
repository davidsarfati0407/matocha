import "server-only";
import { getEmailSender } from "@/lib/email";
import { getStore } from "@/lib/store";

/**
 * The waitlist is open only when a real store AND a real e-mail sender are
 * configured, so double opt-in can actually happen. Otherwise the form renders
 * "Inscriptions bientôt ouvertes" and never a fake confirmation.
 */
export function isWaitlistOpen(): boolean {
  return getStore() !== null && getEmailSender() !== null;
}

/** Bump when the consent text changes; stored with each lead. */
export const CONSENT_VERSION = "2026-10-06.v1";

export const CONSENT_TEXT =
  "J'accepte de recevoir des e-mails de Matocha sur le lancement et les goûts en test. Je peux me désinscrire à tout moment, en un clic.";
