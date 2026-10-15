/** Libellés et tonalités des statuts, partagés entre pages serveur et composants client. */
type Tone = "ok" | "warn" | "danger" | "info" | "muted" | "brand";

export const LOT_STATUS: Record<string, [Tone, string]> = { attendu: ["info", "Attendu"], quarantaine: ["warn", "Quarantaine"], libere: ["ok", "Libéré"], bloque: ["danger", "Bloqué"], epuise: ["muted", "Épuisé"] };
export const ASSET_TYPE: Record<string, string> = { vehicule: "Véhicule", equipement: "Équipement", salle: "Salle", poste_informatique: "Poste informatique", machine: "Machine", imprimante: "Imprimante", serveur: "Serveur", mobilier: "Mobilier" };
export const ASSET_STATUS: Record<string, [Tone, string]> = { ok: ["ok", "OK"], en_service: ["info", "En service"], maintenance: ["warn", "Maintenance"], panne: ["danger", "En panne"], hors_service: ["muted", "Hors service"] };
export const QUOTE_STATUS: Record<string, [Tone, string]> = { draft: ["muted", "Brouillon"], sent: ["info", "Envoyé"], opened: ["brand", "Ouvert"], accepted: ["ok", "Accepté"], rejected: ["danger", "Refusé"], expired: ["muted", "Expiré"] };
export const INVOICE_STATUS: Record<string, [Tone, string]> = { draft: ["muted", "Brouillon"], sent: ["info", "Envoyée"], paid: ["ok", "Payée"], partial: ["warn", "Partielle"], overdue: ["danger", "Échue"], cancelled: ["muted", "Annulée"] };
export const DEAL_STAGES: { id: string; label: string }[] = [
  { id: "froid", label: "Froid" },
  { id: "tiede", label: "Tiède" },
  { id: "chaud", label: "Chaud" },
  { id: "gagne", label: "Gagné" },
  { id: "perdu", label: "Perdu" },
];
