import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/media/Photo";
import { ProductCard } from "@/components/blocks/ProductCard";
import { FaqList, faqJsonLd } from "@/components/blocks/FaqList";
import { ProofValue } from "@/components/blocks/ProofValue";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { faq } from "@/content/faq";
import { fr } from "@/content/i18n/fr";
import { theProduct } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site-url";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import { insideRows, productView } from "@/lib/view";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const { recipe, family } = theProduct(catalog);
  const product = productView(catalog, mode);
  const homeFaq = faq.filter((f) => f.home);
  const waitlistOpen = isWaitlistOpen();

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: "Matocha", url: SITE_URL, slogan: fr.hero.title },
    faqJsonLd(homeFaq),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------------------------------------------------- 1. Hero */}
      <section aria-labelledby="hero-title" className="pt-24 pb-12 lg:pt-28 lg:pb-20">
        <Container wide className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{fr.hero.productShown}</span>
              {mode !== "sale" && <span className="concept-tag">{fr.status.prelaunch}</span>}
            </p>
            <h1 id="hero-title" className="mt-5 text-5xl u-caps max-w-[12ch]">
              {fr.hero.title}
            </h1>
            <p className="mt-6 max-w-[40ch] text-lg">{fr.hero.subtitle}</p>
            {mode !== "sale" && <p className="mt-3 max-w-[40ch]">{fr.hero.prelaunchLine}</p>}
            <div className="mt-8">
              {product.cta.kind === "buy" ? (
                <ButtonLink href="/daily-box#acheter">{fr.hero.ctaSale}</ButtonLink>
              ) : (
                <ButtonLink href="#inscription">{fr.hero.ctaPrelaunch}</ButtonLink>
              )}
            </div>
          </div>
          <Photo
            id="matocha-latte"
            priority
            kenBurns
            parallax
            sizes="(min-width: 1024px) 45vw, 100vw"
            ratio="aspect-[4/5] lg:aspect-auto lg:h-[min(76vh,720px)]"
          />
        </Container>
      </section>

      {/* ---------------------------------------------------- 2. Le geste */}
      <section id="geste" aria-labelledby="geste-title" className="sec">
        <Container wide className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 id="geste-title" className="text-4xl u-caps">{fr.gesture.title}</h2>
            <p className="mt-4 measure text-lg">{fr.gesture.intro}</p>
            <ol className="mt-8 space-y-4">
              {family.gesture.map((step, i) => (
                <li key={step} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-encre/15 pt-4">
                  <span className="font-serif text-4xl leading-none">{i + 1}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{step}</h3>
                    <p className="mt-1 measure">{fr.gesture.stepPowder[i]}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm">{fr.gesture.volumesPending}</p>
          </div>
          <Photo id="matocha-sticks" parallax sizes="(min-width: 1024px) 45vw, 100vw" />
        </Container>
      </section>

      {/* ---------------------------------------------------- 3. La Daily Box */}
      <section id="produit" aria-labelledby="produit-title" className="sec">
        <Container wide className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Photo id="matocha-box" parallax sizes="(min-width: 1024px) 45vw, 100vw" />
          <div>
            <h2 id="produit-title" className="text-4xl u-caps">{fr.product.title}</h2>
            <p className="mt-4 measure text-lg">{fr.product.intro}</p>
            <ProductCard product={product} className="mt-8" />
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------- 4. Une journée */}
      <section id="journee" aria-labelledby="journee-title" className="sec">
        <Container wide className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="lg:order-2">
            <h2 id="journee-title" className="text-4xl u-caps">{fr.day.title}</h2>
            <p className="mt-4 measure text-lg">{fr.day.intro}</p>
            <ul className="mt-8 divide-y divide-encre/15 border-y border-encre/15">
              {fr.day.scenes.map((scene) => (
                <li key={scene.time} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 py-3">
                  <span className="font-serif text-3xl">{scene.time}</span>
                  <div>
                    <p>
                      <span className="font-semibold">{scene.place}</span> — {scene.text}
                    </p>
                    <Link
                      href={scene.recipe}
                      className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-matcha decoration-2 underline-offset-4"
                    >
                      La recette
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Photo id="matocha-jet" parallax sizes="(min-width: 1024px) 45vw, 100vw" className="lg:order-1" />
        </Container>
      </section>

      {/* ---------------------------------------------------- 5. Ce qu'il y a dedans */}
      <section id="dedans" aria-labelledby="dedans-title" className="sec">
        <Container wide className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 id="dedans-title" className="text-4xl u-caps">{fr.inside.title}</h2>
            <p className="mt-4 measure text-lg">{fr.inside.intro}</p>
            <h3 className="mt-10 text-2xl u-caps">{fr.inside.suspensionTitle}</h3>
            <p className="mt-3 measure">{fr.inside.suspensionText}</p>
            <TextLink href="/preparer" className="mt-2">
              Comment préparer
            </TextLink>
          </div>
          <dl className="self-start divide-y divide-encre/15 border-y border-encre/15">
            {insideRows(recipe).map((row) => (
              <div key={row.key} className="grid grid-cols-[10rem_1fr] gap-4 py-3">
                <dt className="font-semibold">{row.label}</dt>
                <dd>
                  <ProofValue value={row} />
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ---------------------------------------------------- 6. Plus simple */}
      <section id="rituel" aria-labelledby="rituel-title" className="sec bg-mousse/45">
        <Container wide>
          <h2 id="rituel-title" className="text-4xl u-caps">{fr.ritual.title}</h2>
          <p className="mt-4 max-w-[44ch] font-serif text-3xl leading-tight">« {fr.ritual.quote} »</p>
          <p className="mt-4 measure">{fr.ritual.intro}</p>
          {/* Phones: one card per step, both answers stacked. */}
          <dl className="mt-8 divide-y divide-encre/15 border-y border-encre/15 md:hidden">
            {fr.ritual.rows.map((row) => (
              <div key={row.label} className="py-3 text-sm">
                <dt className="font-semibold">{row.label}</dt>
                <dd className="mt-1 grid grid-cols-[8.5rem_1fr] gap-2">
                  <span className="font-medium">{fr.ritual.traditional}</span>
                  <span>{row.traditional}</span>
                </dd>
                <dd className="mt-1 grid grid-cols-[8.5rem_1fr] gap-2">
                  <span className="font-medium">{fr.ritual.matocha}</span>
                  <span>{row.matocha}</span>
                </dd>
              </div>
            ))}
          </dl>
          <table className="mt-8 hidden w-full border-collapse text-left md:table">
            <caption className="sr-only">Étapes pour une boisson</caption>
            <thead>
              <tr className="border-b-2 border-encre">
                <td />
                <th scope="col" className="py-2 pr-3">
                  {fr.ritual.traditional}
                </th>
                <th scope="col" className="py-2">
                  {fr.ritual.matocha}
                </th>
              </tr>
            </thead>
            <tbody>
              {fr.ritual.rows.map((row) => (
                <tr key={row.label} className="border-b border-encre/15 align-top">
                  <th scope="row" className="py-3 pr-3 font-semibold">
                    {row.label}
                  </th>
                  <td className="py-3 pr-3">{row.traditional}</td>
                  <td className="py-3">{row.matocha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </section>

      {/* ---------------------------------------------------- 7. FAQ + CTA */}
      <section id="fin" aria-labelledby="faq-title" className="sec">
        <Container wide className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 id="faq-title" className="text-4xl u-caps">{fr.final.faqTitle}</h2>
            <div className="mt-8">
              <FaqList items={homeFaq} />
            </div>
            <TextLink href="/faq" className="mt-4">
              {fr.final.allFaq}
            </TextLink>
          </div>
          <div id="inscription" className="scroll-mt-24">
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
        </Container>
      </section>
    </>
  );
}
