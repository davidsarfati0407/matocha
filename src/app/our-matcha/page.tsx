import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MatchaCloseUp } from "@/sections/MatchaCloseUp";
import { SpecSheet } from "@/sections/SpecSheet";
import { Faq } from "@/sections/Faq";
import { brand } from "@/data/brand";

export const metadata: Metadata = {
  title: "Our matcha",
  description:
    "100% Japanese matcha, 2g per serving, no sugar, no flavourings, no additives. Sourcing details are published as they are confirmed.",
  alternates: { canonical: "/our-matcha" },
};

export default function OurMatchaPage() {
  return (
    <>
      <PageHeader
        label="Our matcha"
        lines={[{ text: "The matcha" }, { text: "matters." }]}
        intro="Convenience means nothing if the matcha isn't exceptional. Everything we can state today is on this page — and nothing we cannot."
      />

      <MatchaCloseUp />
      <SpecSheet />

      <section className="sec">
        <Container wide>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <h2 className="text-h2 u-caps max-w-[13ch]">
                  What we can say today.
                </h2>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.08}>
                <p className="text-lead max-w-[48ch] opacity-75">
                  Every MATOCHA stick holds {brand.servingWeight}
                  {brand.servingUnit} of 100% Japanese matcha and nothing else.
                  No sugar, no flavourings, no additives — the ingredient list is
                  one line long:{" "}
                  <span className="u-serif-it">{brand.ingredients}</span>
                </p>
                <p className="text-lead mt-6 max-w-[48ch] opacity-75">
                  The producer for our first run is still being selected. Until
                  that is settled and we have tasted the lot, we will not print a
                  region, a cultivar, a harvest date or a grade on this site.
                  When it is confirmed, this page changes first.
                </p>

                <ButtonLink href="/product" className="mt-10">
                  See the Daily Box
                </ButtonLink>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <Faq index="03" />
    </>
  );
}
