"use client";

import { motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductStick } from "@/components/brand/ProductStick";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { ritualSteps } from "@/data/content";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * OPEN. POUR. WHISK.
 *
 * A staggered sequence on almost-black: oversized step numerals behind the
 * artwork, the stick tearing, powder falling, the glass filling. Each frame
 * sits a little lower than the last so the eye travels down the page rather
 * than across three equal columns.
 */
const OFFSETS = ["lg:mt-0", "lg:mt-16", "lg:mt-32"];

export function Ritual() {
  return (
    <section id="ritual" className="relative overflow-hidden bg-black sec text-ivory">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <EditorialLabel index="05" className="text-ivory">
                The ritual
              </EditorialLabel>
            </Reveal>
            <h2 className="text-h2 u-caps mt-5">
              <RevealLine>Open.</RevealLine>
              <RevealLine delay={0.06}>Pour.</RevealLine>
              <RevealLine delay={0.12}>Whisk.</RevealLine>
            </h2>
          </div>

          <Reveal delay={0.1} className="max-w-[28ch]">
            <p className="text-note text-ivory/65">
              Three movements, the same every time. Nothing to weigh, nothing to
              put back in a cupboard.
            </p>
          </Reveal>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3 lg:mt-16 lg:gap-6">
          {ritualSteps.map((step, index) => (
            <motion.li
              key={step.step}
              data-matocha-motion
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, delay: index * 0.12, ease: EASE }}
              className={cn("relative", OFFSETS[index])}
            >
              {/* Oversized numeral behind the artwork */}
              <span
                aria-hidden="true"
                className="u-caps pointer-events-none absolute -top-6 -left-2 z-0 text-[7rem] leading-none text-ivory/[0.07] sm:text-[9rem] lg:text-[11rem]"
              >
                {step.step}
              </span>

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-ivory/20 pb-3">
                  <span className="u-label">{step.title}</span>
                  <MicroMark className="text-ivory">{step.step}</MicroMark>
                </div>

                <div className="relative mt-6 flex aspect-4/5 items-center justify-center overflow-hidden bg-ivory/[0.05] p-6">
                  {index === 0 && (
                    <>
                      <div className="h-[86%] rotate-[-10deg] drop-shadow-2xl">
                        <ProductStick tone="green" torn glass="empty" />
                      </div>
                      {/* powder escaping the torn top */}
                      <span aria-hidden="true" className="absolute top-[22%] left-[58%] flex flex-col gap-2">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="block rounded-full bg-matcha"
                            style={{
                              width: `${6 - i}px`,
                              height: `${6 - i}px`,
                              marginLeft: `${i * 7}px`,
                              opacity: 0.9 - i * 0.2,
                            }}
                          />
                        ))}
                      </span>
                    </>
                  )}

                  {index === 1 && (
                    <div className="h-[88%]">
                      <MatochaGlass variant="pour" ink="#F3EFE5" />
                    </div>
                  )}

                  {index === 2 && (
                    <div className="h-[88%]">
                      <MatochaGlass variant="whisked" ink="#F3EFE5" />
                    </div>
                  )}
                </div>

                <p className="text-lead mt-5 max-w-[24ch] text-ivory/75">
                  {step.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
