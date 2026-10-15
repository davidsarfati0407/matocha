/**
 * Tonalités et CLÉS de traduction des statuts (espace « status » des messages), partagées
 * serveur/client. Afficher avec le traducteur racine : t(QUOTE_STATUS[s][1]).
 */
type Tone = "ok" | "warn" | "danger" | "info" | "muted" | "brand";

export const LOT_STATUS: Record<string, [Tone, string]> = { attendu: ["info", "status.lot.attendu"], quarantaine: ["warn", "status.lot.quarantaine"], libere: ["ok", "status.lot.libere"], bloque: ["danger", "status.lot.bloque"], epuise: ["muted", "status.lot.epuise"] };
export const ASSET_TYPE: Record<string, string> = Object.fromEntries(["vehicule", "equipement", "salle", "poste_informatique", "machine", "imprimante", "serveur", "mobilier"].map((k) => [k, `status.assetType.${k}`]));
export const ASSET_STATUS: Record<string, [Tone, string]> = { ok: ["ok", "status.asset.ok"], en_service: ["info", "status.asset.en_service"], maintenance: ["warn", "status.asset.maintenance"], panne: ["danger", "status.asset.panne"], hors_service: ["muted", "status.asset.hors_service"] };
export const QUOTE_STATUS: Record<string, [Tone, string]> = { draft: ["muted", "status.quote.draft"], sent: ["info", "status.quote.sent"], opened: ["brand", "status.quote.opened"], accepted: ["ok", "status.quote.accepted"], rejected: ["danger", "status.quote.rejected"], expired: ["muted", "status.quote.expired"] };
export const INVOICE_STATUS: Record<string, [Tone, string]> = { draft: ["muted", "status.invoice.draft"], sent: ["info", "status.invoice.sent"], paid: ["ok", "status.invoice.paid"], partial: ["warn", "status.invoice.partial"], overdue: ["danger", "status.invoice.overdue"], cancelled: ["muted", "status.invoice.cancelled"] };
export const DEAL_STAGES: { id: string; label: string }[] = [
  { id: "froid", label: "status.deal.froid" },
  { id: "tiede", label: "status.deal.tiede" },
  { id: "chaud", label: "status.deal.chaud" },
  { id: "gagne", label: "status.deal.gagne" },
  { id: "perdu", label: "status.deal.perdu" },
];
export const PRESENCE: Record<string, string> = Object.fromEntries(["au_poste", "reunion", "pause", "teletravail", "deplacement", "absent", "pas_badge", "parti"].map((k) => [k, `status.presence.${k}`]));
export const LEAVE_TYPE: Record<string, string> = Object.fromEntries(["conges", "rtt", "maladie", "formation", "sans_solde", "parental"].map((k) => [k, `status.leaveType.${k}`]));
export const LEAVE_STATUS: Record<string, [Tone, string]> = { pending: ["warn", "status.leave.pending"], approved: ["ok", "status.leave.approved"], rejected: ["danger", "status.leave.rejected"], cancelled: ["muted", "status.leave.cancelled"] };
