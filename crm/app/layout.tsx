import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { sectorConfig } from "@/config/sector.config";
import "./globals.css";

const c = sectorConfig.entreprise.couleurs;

export const metadata: Metadata = {
  title: { default: `${sectorConfig.entreprise.nomCourt} · Maison`, template: `%s · ${sectorConfig.entreprise.nomCourt}` },
  description: sectorConfig.entreprise.activite,
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const tokens = {
    "--brand": c.identite,
    "--brand-deep": c.identiteProfonde,
    "--matcha": c.matcha,
    "--accent": c.accent,
    "--accent-ui": c.accentTexte,
    "--ground": c.fond,
    "--ground-deep": c.fondProfond,
    "--ink": c.encre,
  } as CSSProperties;
  return (
    <html lang={locale} style={tokens} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
