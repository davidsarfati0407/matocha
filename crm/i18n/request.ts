import { readdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { sectorConfig } from "@/config/sector.config";

export const LOCALES = [sectorConfig.entreprise.langueInterface, ...sectorConfig.entreprise.languesSecondaires];
export const LOCALE_COOKIE = "locale";

/**
 * Messages découpés par espace de noms : messages/{langue}/{espace}.json → { espace: {...} }.
 * Un module = un fichier : pas de conflit d'édition, chargement complet par requête.
 */
async function loadMessages(locale: string) {
  const dir = path.join(process.cwd(), "messages", locale);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const entries = await Promise.all(files.map(async (f) => [f.slice(0, -5), (await import(`../messages/${locale}/${f}`)).default] as const));
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = fromCookie && LOCALES.includes(fromCookie as (typeof LOCALES)[number]) ? fromCookie : sectorConfig.entreprise.langueInterface;
  return {
    locale,
    timeZone: sectorConfig.entreprise.fuseau,
    messages: await loadMessages(locale),
  };
});
