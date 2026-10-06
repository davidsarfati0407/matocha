import type { Metadata } from "next";
import { HeroScene } from "@/components/scenes/HeroScene";
import { GestureScene } from "@/components/scenes/GestureScene";
import { PackChooser } from "@/components/scenes/PackChooser";
import { DoseCalculator } from "@/components/scenes/DoseCalculator";
import { FlavourScene } from "@/components/scenes/FlavourScene";
import { DayScene } from "@/components/scenes/DayScene";
import { LoupeScene } from "@/components/scenes/LoupeScene";
import { SuspensionCanvas } from "@/components/scenes/SuspensionCanvas";
import { RitualCompare } from "@/components/scenes/RitualCompare";
import { FinalGlass } from "@/components/scenes/FinalGlass";
import { Filet, FiletAnchor } from "@/components/scenes/Filet";
import { FormatComparator } from "@/components/blocks/FormatComparator";
import { FaqList, faqJsonLd } from "@/components/blocks/FaqList";
import { ProofValue } from "@/components/blocks/ProofValue";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { faq } from "@/content/faq";
import { fr } from "@/content/i18n/fr";
import { findRecipe } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site-url";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import {
  calcPacks,
  flavourOptions,
  gestureFamilies,
  heroVariants,
  insideRows,
  loupeHotspots,
  packCards,
  ACCENT_HEX,
} from "@/lib/view";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* Gutter anchors for Le Filet: two per block on one side; it crosses sides
   only in the gap between blocks. */
const L = "left-2 lg:left-6";
const R = "right-2 lg:right-6";

function Block({
  id,
  side,
  className,
  children,
  labelledBy,
}: {
  id: string;
  side: "left" | "right";
  className?: string;
  children: React.ReactNode;
  labelledBy: string;
}) {
  const pos = side === "left" ? L : R;
  return (
    <section id={id} aria-labelledby={labelledBy} className={`sec relative z-10 ${className ?? ""}`}>
      <FiletAnchor className={`top-8 ${pos}`} />
      {children}
      <FiletAnchor className={`bottom-8 ${pos}`} />
    </section>
  );
}

export default async function HomePage() {
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const sale = mode === "sale";
  const original = findRecipe(catalog, "poudre", "original")!;
  const homeFaq = faq.filter((f) => f.home);
  const waitlistOpen = isWaitlistOpen();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Matocha",
      url: SITE_URL,
      slogan: fr.hero.title,
    },
    faqJsonLd(homeFaq),
  ];

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Filet />

      {/* ---------------------------------------------------- 1. Hero (M01) */}
      <section aria-labelledby="hero-title" className="relative z-10 pt-24 pb-12 lg:pt-28 lg:pb-20">
        <Container wide className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{fr.hero.formatShown} :</span>
              <span>Poudre · {fr.status.concept}</span>
              {!sale && <span className="concept-tag">{fr.status.prelaunch}</span>}
            </p>
            <h1 id="hero-title" className="mt-5 text-5xl u-caps max-w-[12ch]">
              {fr.hero.title}
            </h1>
            <p className="mt-6 max-w-[40ch] text-lg">{fr.hero.subtitle}</p>
            {!sale && <p className="mt-3 max-w-[40ch]">{fr.hero.prelaunchLine}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={sale ? "/formats/poudre#packs" : "#inscription"}>
                {sale ? fr.hero.ctaSale : fr.hero.ctaPrelaunch}
              </ButtonLink>
              <ButtonLink href="#geste" variant="outline">
                {fr.hero.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            {/* The ribbon leaves the pack, top right of the scene. */}
            <FiletAnchor className="top-[14%] left-[62%]" />
            <HeroScene variants={heroVariants(catalog)} />
          </div>
        </Container>
        <FiletAnchor className={`bottom-2 ${R}`} />
      </section>

      {/* ---------------------------------------------------- 2. Le geste (M02) */}
      <Block id="geste" side="left" labelledBy="geste-title" className="lg:pt-12! lg:pb-0!">
        <Container wide>
          <GestureScene
            families={gestureFamilies(catalog)}
            header={
              <>
                <h2 id="geste-title" className="text-4xl u-caps">{fr.gesture.title}</h2>
                <p className="mt-3 measure text-lg">{fr.gesture.intro}</p>
              </>
            }
          />
        </Container>
      </Block>

      {/* ---------------------------------------------------- 3. Formats & packs (M03 + M04) */}
      <Block id="formats" side="right" labelledBy="formats-title">
        <Container wide>
          <h2 id="formats-title" className="text-4xl u-caps">{fr.formats.title}</h2>
          <p className="mt-4 measure text-lg">{fr.formats.intro}</p>
          <div className="mt-8">
            <FormatComparator catalog={catalog} rows={["preparation", "equipment", "composition", "pricePerDrink"]} />
            <TextLink href="/formats" className="mt-4 inline-block">
              Le comparatif complet
            </TextLink>
          </div>
          <h3 id="packs" className="mt-12 text-3xl u-caps">{fr.formats.packsTitle}</h3>
          <p className="mt-3 measure">{fr.formats.packsIntro}</p>
          <div className="mt-8">
            <PackChooser packs={packCards(catalog, mode, "poudre")} accent={ACCENT_HEX[original.accentToken]} />
          </div>
          <div className="mt-8">
            <DoseCalculator packs={calcPacks(catalog)} />
          </div>
        </Container>
      </Block>

      {/* ---------------------------------------------------- 4. À votre goût (M05) */}
      <Block id="gout" side="left" labelledBy="gout-title">
        <Container wide>
          <h2 id="gout-title" className="text-4xl u-caps">{fr.flavour.title}</h2>
          <p className="mt-4 measure text-lg">{fr.flavour.intro}</p>
          <div className="mt-10">
            <FlavourScene options={flavourOptions(catalog, mode)} />
          </div>
        </Container>
      </Block>

      {/* ---------------------------------------------------- 5. Une journée (M06) */}
      <Block id="journee" side="right" labelledBy="journee-title" className="lg:pt-12! lg:pb-0!">
        <Container wide>
          <DayScene
            header={
              <div>
                <h2 id="journee-title" className="text-4xl u-caps">{fr.day.title}</h2>
                <p className="mt-3 measure text-lg">{fr.day.intro}</p>
              </div>
            }
          />
        </Container>
      </Block>

      {/* ---------------------------------------------------- 6. Dedans (M07) */}
      <Block id="dedans" side="left" labelledBy="dedans-title">
        <Container wide>
          <h2 id="dedans-title" className="text-4xl u-caps">{fr.inside.title}</h2>
          <p className="mt-4 measure text-lg">{fr.inside.intro}</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="sr-only">{fr.inside.loupeTitle}</h3>
              <LoupeScene hotspots={loupeHotspots(catalog, original)} />
              <div className="mt-8 grid items-center gap-6 sm:grid-cols-[1fr_minmax(0,220px)] [&>figure]:mx-auto [&>figure]:w-full [&>figure]:max-w-[220px]">
                <div>
                  <h3 className="text-2xl u-caps">{fr.inside.suspensionTitle}</h3>
                  <p className="mt-3">{fr.inside.suspensionText}</p>
                  <TextLink href="/preparer" className="mt-4 inline-block">
                    Comment préparer
                  </TextLink>
                </div>
                <SuspensionCanvas />
              </div>
            </div>
            <dl className="self-start divide-y divide-encre/15 border-y border-encre/15">
              {insideRows(original).map((row) => (
                <div key={row.key} className="grid grid-cols-[10rem_1fr] gap-4 py-3">
                  <dt className="font-semibold">{row.label}</dt>
                  <dd>
                    <ProofValue value={row} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </Block>

      {/* ---------------------------------------------------- 7. Plus simple (M08) */}
      <Block id="rituel" side="right" labelledBy="rituel-title" className="bg-mousse/45">
        <Container wide>
          <h2 id="rituel-title" className="text-4xl u-caps">{fr.ritual.title}</h2>
          <p className="mt-4 max-w-[44ch] font-serif text-3xl leading-tight">« {fr.ritual.quote} »</p>
          <p className="mt-4 measure">{fr.ritual.intro}</p>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <RitualCompare />
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <caption className="sr-only">Étapes pour une boisson</caption>
                <thead>
                  <tr className="border-b-2 border-encre">
                    <td />
                    <th scope="col" className="py-2 pr-3">{fr.ritual.traditional}</th>
                    <th scope="col" className="py-2">{fr.ritual.matocha}</th>
                  </tr>
                </thead>
                <tbody>
                  {fr.ritual.rows.map((row) => (
                    <tr key={row.label} className="border-b border-encre/15 align-top">
                      <th scope="row" className="py-3 pr-3 font-semibold">{row.label}</th>
                      <td className="py-3 pr-3">{row.traditional}</td>
                      <td className="py-3">{row.matocha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Block>

      {/* ---------------------------------------------------- 8. FAQ + CTA (M09) */}
      {/* The ribbon comes down the right gutter and ends in the last glass. */}
      <section id="fin" aria-labelledby="faq-title" className="sec relative z-10">
        <Container wide className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 id="faq-title" className="text-4xl u-caps">{fr.final.faqTitle}</h2>
            <div className="mt-8">
              <FaqList items={homeFaq} />
            </div>
            <TextLink href="/faq" className="mt-6 inline-block">
              {fr.final.allFaq}
            </TextLink>
          </div>
          <div id="inscription" className="grid gap-8 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_200px]">
            <div>
              <h2 className="text-3xl u-caps">{fr.final.ctaTitle}</h2>
              <p className="mt-3 text-lg">{fr.final.ctaText}</p>
              <WaitlistForm
                open={waitlistOpen}
                consentText={CONSENT_TEXT}
                consentVersion={CONSENT_VERSION}
                source="home"
                className="mt-6"
              />
            </div>
            <div className="mx-auto w-48 sm:w-52 xl:w-full">
              <FinalGlass />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
