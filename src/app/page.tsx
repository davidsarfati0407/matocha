import type { Metadata } from "next";
import { MatochaHero } from "@/sections/MatochaHero";
import { BrandStrip } from "@/sections/BrandStrip";
import { DailyBox } from "@/sections/DailyBox";
import { WhatsInTheBox } from "@/sections/WhatsInTheBox";
import { OneStick } from "@/sections/OneStick";
import { BigTwoG } from "@/sections/BigTwoG";
import { WhySticks } from "@/sections/WhySticks";
import { Ritual } from "@/sections/Ritual";
import { HotOrIced } from "@/sections/HotOrIced";
import { BrandBreak } from "@/sections/BrandBreak";
import { MatchaCloseUp } from "@/sections/MatchaCloseUp";
import { SpecSheet } from "@/sections/SpecSheet";
import { StickGallery } from "@/sections/StickGallery";
import { Lifestyle } from "@/sections/Lifestyle";
import { Comparison } from "@/sections/Comparison";
import { Subscription } from "@/sections/Subscription";
import { Waitlist } from "@/sections/Waitlist";
import { Faq } from "@/sections/Faq";
import { brand } from "@/data/brand";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "MATOCHA — Premium Japanese Matcha Sticks",
  description: site.description,
  alternates: { canonical: "/" },
};

/** Organisation data. Only claims we can stand behind. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  slogan: brand.campaignLine,
  description: site.description,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.address.city,
    addressCountry: "FR",
  },
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Product",
      name: brand.productName,
      description: `${brand.sticksPerBox} × ${brand.servingWeight}${brand.servingUnit} premium Japanese matcha sticks`,
    },
  },
};

/*
 * Section rhythm — the page alternates ground colour so a full-page scroll
 * reads as bands rather than one long ivory field:
 *
 *   ivory → black → ivory → green → ivory-deep → matcha → ivory → black
 *   → split → green → green/matcha → ivory → ivory-deep → ivory → coral
 *   → black → green
 */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MatochaHero />
      <BrandStrip />
      <DailyBox />
      <WhatsInTheBox />
      <OneStick />
      <BigTwoG />
      <WhySticks />
      <Ritual />
      <HotOrIced />
      <BrandBreak />
      <MatchaCloseUp />
      <SpecSheet />
      <StickGallery />
      <Lifestyle />
      <Comparison />
      <Subscription />
      <Waitlist />
      <Faq />
    </>
  );
}
