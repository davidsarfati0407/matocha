import type { Metadata } from "next";
import Link from "next/link";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { Marquee } from "@/components/ui/Marquee";
import { Ritual } from "@/sections/Ritual";
import { HotOrIced } from "@/sections/HotOrIced";
import { WhySticks } from "@/sections/WhySticks";
import { SpecSheet } from "@/sections/SpecSheet";
import { Subscription } from "@/sections/Subscription";
import { StickGallery } from "@/sections/StickGallery";
import { marqueeItems } from "@/data/content";
import { brand, sourcingRows } from "@/data/brand";
import { dailyBox } from "@/data/product";
import { faq } from "@/data/faq";
import { site } from "@/data/site";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${dailyBox.name} — ${brand.sticksPerBox} × ${brand.servingWeight}${brand.servingUnit} matcha sticks`,
  description:
    "The MATOCHA Daily Box: 30 individually sealed 2g sticks of 100% Japanese matcha. No sugar, no flavourings, no additives.",
  alternates: { canonical: "/product" },
  openGraph: {
    type: "website",
    title: `${dailyBox.name} — ${site.name}`,
    description: dailyBox.description[0],
    url: `${site.url}/product`,
  },
};

/**
 * Product structured data. `availability` follows `brand.availability` — it
 * stays PreOrder until the first production run has actually shipped.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: dailyBox.name,
  description: dailyBox.description[0],
  brand: { "@type": "Brand", name: site.name },
  offers: {
    "@type": "Offer",
    price: (dailyBox.price / 100).toFixed(2),
    priceCurrency: brand.currency,
    availability:
      brand.availability === "in-stock"
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    url: `${site.url}/product`,
  },
};

export default function ProductPage() {
  const rows = sourcingRows();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-24 lg:pt-32">
        <Container wide>
          <nav aria-label="Breadcrumb" className="u-label opacity-50">
            <Link href="/" className="transition-opacity hover:opacity-100">
              Home
            </Link>
            <span className="px-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{dailyBox.shortName}</span>
          </nav>

          <div className="mt-8 grid gap-12 lg:mt-12 lg:grid-cols-12 lg:gap-14">
            {/* min-w-0: the gallery's full-bleed mobile rail uses negative
                margins, which would otherwise widen the shared grid column
                and push the buy panel off-screen. */}
            <div className="min-w-0 lg:col-span-7">
              <ProductGallery />
            </div>

            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <BuyBox product={dailyBox} />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <section className="mt-24 border-y border-black/10 bg-ivory-deep py-5 sm:mt-32">
        <Marquee items={marqueeItems} duration={62} separatorClassName="text-coral" />
      </section>

      {/* Description */}
      <section className="sec">
        <Container wide>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <EditorialLabel index="02">The product</EditorialLabel>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="text-h2 u-caps max-w-[16ch]">
                <RevealLine>{brand.sticksPerBox} mornings.</RevealLine>
                <RevealLine delay={0.08}>One box.</RevealLine>
              </h2>
              <Reveal delay={0.1}>
                {dailyBox.description.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lead mt-6 max-w-[52ch] opacity-75"
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* What's inside */}
      <section className="on-green bg-green py-24 text-ivory sm:py-32">
        <Container wide>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <EditorialLabel index="03" className="text-ivory">
                  What&apos;s inside
                </EditorialLabel>
                <h2 className="text-h2 u-caps mt-8 max-w-[10ch]">
                  In the box.
                </h2>
              </Reveal>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal>
                <ul className="border-t border-ivory/20">
                  {dailyBox.whatsInside.map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-5 border-b border-ivory/20 py-5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral"
                      />
                      <span className="text-lead">{item}</span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-12 grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                  {dailyBox.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="border-t border-ivory/20 py-4"
                    >
                      <dt className="u-label opacity-55">{spec.label}</dt>
                      <dd className="mt-2">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Why 2g / portability */}
      <WhySticks />

      {/* Preparation */}
      <Ritual />

      {/* Hot or iced */}
      <HotOrIced />

      {/* Pack artwork */}
      <StickGallery />

      {/* Sourcing + freshness */}
      <section className="relative overflow-hidden sec">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[6%] -right-[8%] h-[58%] w-[30%]"
        >
          <MatochaGlass variant="classic" className="opacity-[0.12]" />
        </div>

        <Container wide className="relative">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <EditorialLabel index="05">Sourcing</EditorialLabel>
                <h2 className="text-h2 u-caps mt-8 max-w-[12ch]">
                  Where it comes from.
                </h2>

                <dl className="mt-10 grid grid-cols-2 gap-x-8">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="border-t border-black/15 py-5"
                    >
                      <dt className="u-label opacity-55">{row.label}</dt>
                      <dd
                        className={cn(
                          "mt-2 text-lg",
                          !row.confirmed && "u-serif-it opacity-45",
                        )}
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 max-w-[46ch] text-sm leading-relaxed opacity-60">
                  We will not publish a region, a cultivar or a harvest date
                  until the producer is confirmed and we have tasted the lot
                  ourselves.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <Reveal delay={0.1}>
                <EditorialLabel index="06">Freshness</EditorialLabel>
                <h2 className="text-h2 u-caps mt-8 max-w-[12ch]">
                  Sealed until you open it.
                </h2>
                {dailyBox.freshness.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lead mt-6 max-w-[44ch] opacity-75"
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Shipping */}
      <section className="border-t border-black/12 sec-tight">
        <Container wide>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <EditorialLabel index="07">Shipping</EditorialLabel>
              </Reveal>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
              <Reveal>
                <p className="u-label opacity-55">Dispatch</p>
                <p className="mt-3 text-[1.05rem]">{site.shipping.origin}</p>
              </Reveal>
              <Reveal delay={0.06}>
                <p className="u-label opacity-55">Delivery</p>
                <p className="mt-3 text-[1.05rem]">{site.shipping.delivery}</p>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="u-label opacity-55">Free over</p>
                <p className="mt-3 text-[1.05rem]">
                  {brand.freeShippingThreshold !== null
                    ? formatPrice(brand.freeShippingThreshold)
                    : "—"}
                </p>
              </Reveal>
            </div>
          </div>
          <p className="mt-10 text-sm opacity-55">{site.shipping.note}</p>
        </Container>
      </section>

      {/* Specification */}
      <SpecSheet />

      {/* Subscription */}
      <Subscription />

      {/* FAQ */}
      <section
        id="faq"
        className="border-t border-black/12 sec"
      >
        <Container wide>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <EditorialLabel index="08">Questions</EditorialLabel>
                <h2 className="text-h2 u-caps mt-8 max-w-[10ch]">
                  Good to know.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Accordion
                items={faq.map((item) => ({
                  question: item.question,
                  answer: <p>{item.answer}</p>,
                }))}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Room for the mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
