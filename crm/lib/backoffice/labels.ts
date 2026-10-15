/** Libellés et tonalités des statuts, partagés entre pages serveur et composants client. */
type Tone = "ok" | "warn" | "danger" | "info" | "muted" | "brand";

export const LOT_STATUS: Record<string, [Tone, string]> = { attendu: ["info", "Attendu"], quarantaine: ["warn", "Quarantaine"], libere: ["ok", "Libéré"], bloque: ["danger", "Bloqué"], epuise: ["muted", "Épuisé"] };
export const ASSET_TYPE: Record<string, string> = { vehicule: "Véhicule", equipement: "Équipement", salle: "Salle", poste_informatique: "Poste informatique", machine: "Machine", imprimante: "Imprimante", serveur: "Serveur", mobilier: "Mobilier" };
export const ASSET_STATUS: Record<string, [Tone, string]> = { ok: ["ok", "OK"], en_service: ["info", "En service"], maintenance: ["warn", "Maintenance"], panne: ["danger", "En panne"], hors_service: ["muted", "Hors service"] };
