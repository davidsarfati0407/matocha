import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SaleShell } from "@/components/commerce/SaleShell";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { fr } from "@/content/i18n/fr";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

/* Kept from v1: Archivo carries the identity (tight caps), Instrument Serif
   only for numerals and quotes. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

/* Catalogue overrides and the site mode are re-read at most every 5 minutes;
   approvals in /admin revalidate immediately. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const mode = await getSiteMode();
  const description =
    mode === "sale" ? fr.meta.descriptionSale : fr.meta.descriptionPrelaunch;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: fr.meta.titleDefault, template: `%s — Matocha` },
    description,
    applicationName: "Matocha",
    alternates: { canonical: "/" },
    /* Images come from opengraph-image.tsx / twitter-image.tsx (the latte render). */
    openGraph: {
      type: "website",
      siteName: "Matocha",
      title: fr.meta.shareTitle,
      description,
      locale: "fr_FR",
      url: "/",
    },
    twitter: { card: "summary_large_image", title: fr.meta.shareTitle, description },
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f1de",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [mode, catalog] = await Promise.all([getSiteMode(), getCatalog()]);
  const sale = mode === "sale";

  return (
    <html
      lang="fr"
      className={`${archivo.variable} ${instrument.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Before first paint: section reveals start hidden only if JS runs and
            the visitor has not asked for reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-ok')",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ScrollReveal />
        <SaleShell enabled={sale} header={(cart) => <Header sale={sale} cartSlot={cart} />}>
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer catalog={catalog} />
        </SaleShell>
      </body>
    </html>
  );
}
