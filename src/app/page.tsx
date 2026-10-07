import type { Metadata } from "next";
import { SceneImage } from "@/components/media/SceneImage";
import { ParallaxRoot } from "@/components/motion/ParallaxRoot";
import { SplitWords } from "@/components/motion/SplitWords";
import { ProductCard } from "@/components/blocks/ProductCard";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { fr } from "@/content/i18n/fr";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site-url";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import { productView } from "@/lib/view";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const s = fr.scenes;
const delay = (d: number) => ({ "--d": `${d}s` }) as React.CSSProperties;

/** Label, short title, one line. Each part reveals in turn. */
function SceneText({
  label,
  title,
  line,
  id,
  className,
  children,
}: {
  label: string;
  title: string;
  line?: string;
  id: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p data-reveal className="eyebrow">
        {label}
      </p>
      <h2 id={id} data-reveal style={delay(0.08)} className="display mt-5">
        {title}
      </h2>
      {line && (
        <p data-reveal style={delay(0.16)} className="lede mt-6">
          {line}
        </p>
      )}
      {children}
    </div>
  );
}

/*
 * The home is a scroll narrative, one idea and one render per screen. Every
 * render appears once on the whole site (see media-manifest.json → usedIn).
 *
 *   hero          matocha-sticks       split, title word by word, ken burns
 *   le geste      matocha-poudre       split, parallax text / image
 *   la mousse     matocha-swirl        full bleed, ken burns
 *   chaud/glacé   matocha-latte-verse  split, parallax
 *   ingrédient    matocha-texture      full-bleed background
 *   daily box     matocha-box          sticky: the box stays, the lines scroll
 *   partout       matocha-jet          full bleed, ken burns
 *   fin           —                    forêt, the sign-up
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
      <section aria-labelledby="hero-title">
        <ParallaxRoot origin="top" strength={1.6} className="grid min-h-svh lg:grid-cols-2">
          <div data-depth="-24" className="parallax flex flex-col justify-center px-6 pt-32 pb-14 sm:px-10 lg:px-16 lg:py-32 xl:px-24">
            <p className="cascade eyebrow" style={delay(0)}>
              {s.hero.label}
              {!sale && (
                <span className="ml-3 inline-block concept-tag align-middle whitespace-nowrap normal-case tracking-normal">
                  {fr.status.prelaunch}
                </span>
              )}
            </p>
            <h1 id="hero-title" className="display display-xl mt-6 max-w-[11ch]">
              <SplitWords text={fr.hero.title} />
            </h1>
            <p className="cascade lede mt-7" style={delay(0.5)}>
              {s.hero.line}
            </p>
            <div className="cascade mt-10" style={delay(0.65)}>
              {product.cta.kind === "buy" ? (
                <ButtonLink href="#acheter">{fr.hero.ctaSale}</ButtonLink>
              ) : (
                <ButtonLink href="#inscription">{fr.hero.ctaPrelaunch}</ButtonLink>
              )}
            </div>
          </div>
          <SceneImage
            id="matocha-sticks"
            priority
            kenBurns
            depth={40}
            crop="50% 45%"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="arrive-soft h-[64svh] lg:h-auto"
          />
        </ParallaxRoot>
      </section>

      {/* -------------------------------------------------------- Le geste */}
      <section aria-labelledby="geste-title">
        <ParallaxRoot className="grid min-h-svh lg:grid-cols-2">
          <SceneImage
            id="matocha-poudre"
            reveal
            depth={36}
            crop="55% 50%"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-[80svh] lg:h-auto"
          />
          <div data-depth="-20" className="parallax flex items-center px-6 py-24 sm:px-10 lg:px-16 xl:px-24">
            <SceneText id="geste-title" label={s.gesture.label} title={s.gesture.title} line={s.gesture.line} />
          </div>
        </ParallaxRoot>
      </section>

      {/* ------------------------------------------------------- La mousse */}
      <section aria-labelledby="mousse-title" className="relative flex min-h-svh flex-col lg:block">
        <div className="relative z-10 px-6 pt-28 pb-12 sm:px-10 lg:absolute lg:top-0 lg:left-0 lg:max-w-[46%] lg:px-16 lg:pt-40 xl:px-24">
          <SceneText id="mousse-title" label={s.foam.label} title={s.foam.title} line={s.foam.line} />
        </div>
        <SceneImage
          id="matocha-swirl"
          kenBurns
          crop="72% 50%"
          cropLg="50% 50%"
          sizes="100vw"
          className="min-h-[70svh] flex-1 lg:absolute lg:inset-0 lg:min-h-0"
        />
      </section>

      {/* ------------------------------------------------- Chaud ou glacé */}
      <section aria-labelledby="temperature-title">
        <ParallaxRoot className="grid min-h-svh lg:grid-cols-2">
          <div data-depth="-20" className="parallax flex items-center px-6 pt-28 pb-14 sm:px-10 lg:px-16 lg:py-24 xl:px-24">
            <SceneText id="temperature-title" label={s.temperature.label} title={s.temperature.title} line={s.temperature.line} />
          </div>
          <SceneImage
            id="matocha-latte-verse"
            reveal
            depth={36}
            crop="60% 50%"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-[80svh] lg:h-auto"
          />
        </ParallaxRoot>
      </section>

      {/* ------------------------------------------------------ Ingrédient */}
      <section aria-labelledby="ingredient-title" className="relative flex min-h-svh flex-col lg:block">
        <SceneImage
          id="matocha-texture"
          kenBurns
          crop="78% 50%"
          cropLg="50% 50%"
          sizes="100vw"
          className="order-2 min-h-[60svh] flex-1 lg:absolute lg:inset-0 lg:min-h-0"
        />
        {/* Desktop: a cream veil on the left keeps the line readable over the powder. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-lait via-lait/80 to-transparent lg:block"
        />
        <div className="relative z-10 px-6 pt-28 pb-12 sm:px-10 lg:flex lg:min-h-svh lg:max-w-[48%] lg:items-center lg:px-16 lg:py-32 xl:px-24">
          <SceneText id="ingredient-title" label={s.ingredient.label} title={s.ingredient.title} line={s.ingredient.line}>
            <div data-reveal style={delay(0.24)} className="mt-6">
              <TextLink href="/notre-produit">{s.ingredient.link}</TextLink>
            </div>
          </SceneText>
        </div>
      </section>

      {/* ------------------------------------- La Daily Box (sticky product) */}
      <section id="daily-box" aria-labelledby="box-title" className="relative lg:grid lg:grid-cols-2">
        <div className="sticky top-0 h-svh">
          <SceneImage id="matocha-box" crop="50% 55%" sizes="(min-width: 1024px) 50vw, 100vw" className="h-full" />
        </div>
        {/* Phones: the lines scroll over the box on frosted cards. */}
        <div className="relative z-10">
          <h2 id="box-title" className="sr-only">
            {fr.product.title}
          </h2>
          {s.box.beats.map((beat, i) => (
            <div key={beat} className="flex min-h-[80svh] items-end px-5 pb-8 sm:px-10 lg:min-h-svh lg:items-center lg:px-16 lg:pb-0 xl:px-24">
              <div className="beat-card">
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
          <div className="flex min-h-svh items-center px-5 py-24 sm:px-10 lg:px-16 xl:px-24">
            <div data-reveal className="w-full max-w-md">
              <ProductCard product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Partout */}
      <section aria-labelledby="partout-title" className="relative isolate flex min-h-svh items-end overflow-hidden text-lait">
        <div className="absolute inset-0 -z-10">
          <SceneImage id="matocha-jet" kenBurns crop="50% 50%" cropLg="50% 8%" sizes="100vw" className="h-full" />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-foret-profond/85 via-foret-profond/35 to-transparent" />
        <SceneText
          id="partout-title"
          label={s.everywhere.label}
          title={s.everywhere.title}
          line={s.everywhere.line}
          className="on-dark px-6 pb-20 sm:px-10 lg:px-16 lg:pb-28 xl:px-24 [&_.eyebrow]:text-mousse"
        />
      </section>

      {/* -------------------------------------------------------------- Fin */}
      <section id="inscription" aria-labelledby="fin-title" className="on-dark flex min-h-svh scroll-mt-0 items-center bg-foret py-28 text-lait">
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
          <div data-reveal style={delay(0.24)} className={cn("mx-auto mt-12 max-w-md text-left")}>
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
