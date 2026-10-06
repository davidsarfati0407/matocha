import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { OneStick } from "@/sections/OneStick";
import { BigTwoG } from "@/sections/BigTwoG";
import { HotOrIced } from "@/sections/HotOrIced";
import { WhySticks } from "@/sections/WhySticks";
import { Ritual } from "@/sections/Ritual";
import { Comparison } from "@/sections/Comparison";
import { brand } from "@/data/brand";
import { dailyBox } from "@/data/product";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Why 2g?",
  description:
    "Why MATOCHA portions matcha into individual 2g sticks: an exact dose, sealed freshness, and a format that travels.",
  alternates: { canonical: "/why-sticks" },
};

export default function WhySticksPage() {
  return (
    <>
      <PageHeader
        label="The format"
        lines={[{ text: "One stick." }, { text: "Every morning." }]}
        intro="A tin asks you to weigh, sift and guess. A stick has already answered the question — 2g, sealed, ready."
      />

      <OneStick />
      <BigTwoG />
      <WhySticks />
      <Ritual />
      <HotOrIced />
      <Comparison />

      <section className="border-t border-black/12 sec">
        <Container wide>
          <Reveal className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-h2 u-caps max-w-[14ch]">
                {brand.sticksPerBox} mornings, already measured.
              </h2>
              <p className="text-lead mt-4 opacity-70">
                {dailyBox.name} — {formatPrice(dailyBox.price)}
              </p>
            </div>
            <ButtonLink href="/product">Shop MATOCHA</ButtonLink>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
