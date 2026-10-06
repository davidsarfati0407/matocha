import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { CartProvider } from "@/lib/cart";
import { site } from "@/data/site";
import "./globals.css";

/* UI + body. Variable weights keep this to a single file. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/* Editorial serif, used for accents and selected headline words. */
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "MATOCHA — Premium Japanese Matcha Sticks",
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "matcha",
    "Japanese matcha",
    "matcha sticks",
    "matcha stick",
    "premium matcha",
    "matcha France",
    "matcha Paris",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "MATOCHA — Premium Japanese Matcha Sticks",
    description: site.description,
    url: site.url,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MATOCHA — Premium Japanese Matcha Sticks",
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f1ece1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <MotionProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
