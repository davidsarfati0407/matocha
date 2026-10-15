import { sectorConfig } from "@/config/sector.config";

const { devise, fuseau } = sectorConfig.entreprise;
/** Locale de formatage : celle du pays (fr-FR) quelle que soit la langue d'interface. */
const regional = (lang: string) => (lang === "fr" ? sectorConfig.entreprise.locale : lang === "en" ? "en-GB" : lang);

export const formatMoney = (v: number, lang = "fr", digits = 2) =>
  new Intl.NumberFormat(regional(lang), { style: "currency", currency: devise, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
export const formatNumber = (v: number, lang = "fr", digits = 0) =>
  new Intl.NumberFormat(regional(lang), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
export const formatPercent = (v: number, lang = "fr", digits = 1) =>
  new Intl.NumberFormat(regional(lang), { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
export const formatDate = (d: string | Date, lang = "fr") =>
  new Intl.DateTimeFormat(regional(lang), { dateStyle: "short", timeZone: fuseau }).format(new Date(d));
export const formatTime = (d: string | Date, lang = "fr") =>
  new Intl.DateTimeFormat(regional(lang), { hour: "2-digit", minute: "2-digit", timeZone: fuseau }).format(new Date(d));
