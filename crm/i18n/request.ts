import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { sectorConfig } from "@/config/sector.config";

export const LOCALES = [sectorConfig.entreprise.langueInterface, ...sectorConfig.entreprise.languesSecondaires];
export const LOCALE_COOKIE = "locale";

export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = fromCookie && LOCALES.includes(fromCookie as (typeof LOCALES)[number]) ? fromCookie : sectorConfig.entreprise.langueInterface;
  return {
    locale,
    timeZone: sectorConfig.entreprise.fuseau,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
