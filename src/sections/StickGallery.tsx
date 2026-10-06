"use client";

import { ProductStick } from "@/components/brand/ProductStick";
import { Reveal } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { CtaRail } from "@/components/ui/CtaRail";
import type { GlassVariant } from "@/components/brand/MatochaGlass";

/**
 * The pack artwork, side by side.
 *
 * These are graphic variations of the same product — the matcha inside every
 * stick is identical. The copy says so plainly, because a row of four designs
 * otherwise reads as four flavours.
 */
const ARTWORK: { name: string; glass: GlassVariant; tone: "green" | "ivory" }[] = [
  { name: "Classic", glass: "classic", tone: "green" },
  { name: "Ice", glass: "ice", tone: "ivory" },
  { name: "Pour", glass: "pour", tone: "green" },
  { name: "Whisk", glass: "whisked", tone: "ivory" },
];

export function StickGallery() {
  return (
    <section className="bg-ivory-deep sec-tight">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <EditorialLabel index="09">Pack artwork</EditorialLabel>
            <h2 className="text-h2 u-caps mt-5 max-w-[16ch]">
              Four covers. One matcha.
            </h2>
          </div>
          <p className="text-note max-w-[34ch] opacity-65">
            The artwork changes across the box. The matcha does not — every
            stick holds the same 2g of the same tea.
          </p>
        </div>
      </Container>

      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:px-8 lg:justify-center lg:px-12">
        {ARTWORK.map((art, index) => (
          <Reveal
            key={art.name}
            delay={index * 0.06}
            className="w-[44vw] shrink-0 snap-center sm:w-[30vw] lg:w-[15rem]"
          >
            <div className="flex h-[38vh] max-h-[24rem] min-h-[16rem] items-end justify-center bg-ivory p-6">
              <div className="h-full drop-shadow-[0_16px_28px_rgba(22,23,19,0.18)]">
                <ProductStick tone={art.tone} glass={art.glass} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="u-label">{art.name}</span>
              <span className="u-label opacity-40">0{index + 1}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <CtaRail className="mt-10" label="Same matcha. Four covers." />
    </section>
  );
}
