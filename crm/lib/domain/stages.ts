/** Étapes de l'objet central (depuis la fiche secteur) : transitions et emplacement physique associé. */
import { sectorConfig } from "@/config/sector.config";

export const STAGES = sectorConfig.objetMetierCentral.etapes;
export const stageIndex = (id: string) => STAGES.findIndex((s) => s.id === id);
export const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.libelle ?? id;
export const nextStage = (id: string) => STAGES[stageIndex(id) + 1]?.id ?? null;
/** Espace où se trouve physiquement le dossier à cette étape (null = hors site). */
export const stageZone = (id: string) => STAGES.find((s) => s.id === id)?.zone ?? null;
/** On avance d'une étape à la fois ; un retour en arrière est permis (correction). La facturation passe par la facture. */
export function canMove(from: string, to: string) {
  const a = stageIndex(from);
  const b = stageIndex(to);
  if (a < 0 || b < 0 || a === b) return false;
  if (to === "facturee") return false;
  return b === a + 1 || b < a;
}
/** Avancement par défaut à l'entrée d'une étape. */
export const stageProgress = (id: string) => Math.round(((stageIndex(id) + 0.5) / STAGES.length) * 100) / 100;

/** Deux créneaux se chevauchent-ils ? (bornes ISO) */
export const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start < b.end && b.start < a.end;
