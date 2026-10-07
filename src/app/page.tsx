import type { Metadata } from "next";
import { LoopVideo } from "@/components/media/LoopVideo";
import { Render } from "@/components/media/Render";
import { ParallaxRoot } from "@/components/motion/ParallaxRoot";
import { PrepSequence } from "@/components/motion/PrepSequence";
import { ProductCard } from "@/components/blocks/ProductCard";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { fr } from "@/content/i18n/fr";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site-url";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import { productView } from "@/lib/view";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const s = fr.scenes;
const delay = (d: number) => ({ "--d": `${d}s` }) as React.CSSProperties;

/* Steps 1 and 2 share the pouring scene; whisking and the latte have their own. */
const PREP_SCENE = [0, 0, 1, 2];
const FRAME = "(min-width: 1024px) 560px, 100vw";
const PHONE = "calc(100vw - 40px)";

/*
 * Home, v2 direction: the canonical forest-green pack, lime and green
 * fields alternating with cream. Renders are concepts (AI), shown sharp:
 * every frame is sized so its width × DPR stays within the master where
 * possible (see docs/DECISIONS.md, B26).
 *
 *   hero         matocha-v2-hero (phones: own crop)     lime
 *   préparer     poudre · swirl · latte, sticky frame   cream
 *   dedans       —                                      forêt
 *   daily box    matocha-v2-marketing, sticky (desktop) lime / cream
 *   partout      —                                      lime
 *   fin          sign-up                                forêt
 */
export default async function HomePage() {
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const product = productView(catalog, mode);
  const sale = mode === "sale";
  const waitlistOpen = isWaitlistOpen();

  const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: "Matocha", url: SITE_URL, slogan: fr.hero.title };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ------------------------------------------------------------ Hero */}
      <section aria-labelledby="hero-title" className="bg-mousse text-foret">
        <ParallaxRoot
          origin="top"
          className="mx-auto grid max-w-[1600px] items-center gap-10 px-5 pt-28 pb-16 sm:px-8 lg:min-h-svh lg:grid-cols-[5fr_7fr] lg:gap-14 lg:px-12 lg:pt-32 lg:pb-20"
        >
          <div>
            <p className="cascade eyebrow text-foret" style={delay(0)}>
              {s.hero.label}
              {!sale && (
                <span className="ml-3 inline-block concept-tag align-middle whitespace-nowrap normal-case tracking-normal">
                  {fr.status.prelaunch}
                </span>
              )}
            </p>
            <h1 id="hero-title" className="cascade display display-xl mt-6 max-w-[11ch]" style={delay(0.08)}>
              {fr.hero.title}
            </h1>
            <p className="cascade lede mt-7 text-foret" style={delay(0.2)}>
              {s.hero.line}
            </p>
            <div className="cascade mt-10" style={delay(0.32)}>
              {product.cta.kind === "buy" ? (
                <ButtonLink href="#acheter">{fr.hero.ctaSale}</ButtonLink>
              ) : (
                <ButtonLink href="#inscription">{fr.hero.ctaPrelaunch}</ButtonLink>
              )}
            </div>
          </div>
          {/* Scroll drift: 8 px per viewport, 12 px at most; no zoom, no rotation. */}
          <div data-depth="8" className="parallax">
            <div className="cascade" style={delay(0.15)}>
              <LoopVideo label={fr.status.concept}>
                <Render
                  id="matocha-v2-hero"
                  mobileCrop="mobile"
                  priority
                  tag="top-left"
                  sizes="(min-width: 1600px) 860px, (min-width: 1024px) 56vw, 100vw"
                  mobileSizes={PHONE}
                />
              </LoopVideo>
            </div>
          </div>
        </ParallaxRoot>
      </section>

      {/* -------------------------------------------------------- Préparer */}
      <section id="preparer" aria-labelledby="prep-title" className="bg-lait py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <p data-reveal className="eyebrow">
            {s.prep.label}
          </p>
          <h2 id="prep-title" data-reveal style={delay(0.08)} className="display mt-5">
            {s.prep.title}
          </h2>
          <div className="mt-10 lg:mt-4">
            <PrepSequence
              steps={s.prep.steps.map((step, i) => ({ ...step, scene: PREP_SCENE[i] }))}
              scenes={[
                <Render key="poudre" id="matocha-v2-poudre" sizes={FRAME} />,
                <Render key="swirl" id="matocha-v2-swirl" sizes={FRAME} className="w-full" />,
                <Render key="latte" id="matocha-v2-latte" sizes={FRAME} />,
              ]}
              inline={[
                <Render key="poudre" id="matocha-v2-poudre" sizes={PHONE} />,
                null,
                <Render key="swirl" id="matocha-v2-swirl" sizes={PHONE} />,
                <Render key="latte" id="matocha-v2-latte" sizes={PHONE} />,
              ]}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Dedans */}
      <section aria-labelledby="ingredient-title" className="on-dark bg-foret py-28 text-lait lg:py-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <p data-reveal className="eyebrow text-mousse">
            {s.ingredient.label}
          </p>
          <h2 id="ingredient-title" data-reveal style={delay(0.08)} className="display mt-5 max-w-[16ch]">
            {s.ingredient.title}
          </h2>
          <p data-reveal style={delay(0.16)} className="lede mt-6 max-w-[46ch]">
            {s.ingredient.line}
          </p>
          <div data-reveal style={delay(0.24)} className="mt-6">
            <TextLink href="/notre-produit">{s.ingredient.link}</TextLink>
          </div>
        </div>
      </section>

      {/* ----------------------------------- La Daily Box (canonical pack) */}
      <section id="daily-box" aria-labelledby="box-title" className="bg-lait lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center bg-mousse px-5 py-16 sm:px-8 lg:sticky lg:top-0 lg:h-svh lg:py-0">
          <Render
            id="matocha-v2-marketing"
            sizes="(min-width: 1024px) 560px, 100vw"
            mobileSizes={PHONE}
            className="w-full max-w-[560px] lg:w-[min(560px,calc((100svh-9rem)*0.8))]"
          />
        </div>
        <div>
          <h2 id="box-title" className="sr-only">
            {fr.product.title}
          </h2>
          {s.box.beats.map((beat, i) => (
            <div key={beat} className="flex items-center px-5 py-10 sm:px-8 lg:min-h-[70svh] lg:px-16 lg:py-0 xl:px-24">
              <div>
                {i === 0 && (
                  <p data-reveal className="eyebrow mb-5">
                    {s.box.label}
                  </p>
                )}
                <p data-reveal style={delay(0.06)} className="display">
                  {beat}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center px-5 pt-6 pb-20 sm:px-8 lg:min-h-svh lg:px-16 lg:py-24 xl:px-24">
            <div data-reveal className="w-full max-w-md">
              <ProductCard product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Partout */}
      <section aria-labelledby="partout-title" className="bg-mousse py-28 text-foret lg:py-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <p data-reveal className="eyebrow text-foret">
            {s.everywhere.label}
          </p>
          <h2 id="partout-title" data-reveal style={delay(0.08)} className="display display-xl mt-5">
            {s.everywhere.title}
          </h2>
          <p data-reveal style={delay(0.16)} className="lede mt-6 text-foret">
            {s.everywhere.line}
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- Fin */}
      <section id="inscription" aria-labelledby="fin-title" className="on-dark flex min-h-[90svh] items-center bg-foret py-28 text-lait">
        <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
          <p data-reveal className="eyebrow text-mousse">
            {sale ? s.final.labelSale : s.final.label}
          </p>
          <h2 id="fin-title" data-reveal style={delay(0.08)} className="display mx-auto mt-5 max-w-[14ch]">
            {fr.final.ctaTitle}
          </h2>
          <p data-reveal style={delay(0.16)} className="lede mx-auto mt-6">
            {sale ? fr.meta.descriptionSale : fr.final.ctaText}
          </p>
          <div data-reveal style={delay(0.24)} className="mx-auto mt-12 max-w-md text-left">
            {sale ? (
              <ButtonLink href="#acheter" variant="light" full>
                {fr.product.see}
              </ButtonLink>
            ) : (
              <WaitlistForm
                open={waitlistOpen}
                consentText={CONSENT_TEXT}
                consentVersion={CONSENT_VERSION}
                source="home"
                tone="dark"
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
