"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductStick } from "@/components/brand/ProductStick";
import { MatochaPattern } from "@/components/brand/MatochaPattern";
import { ButtonLink } from "@/components/ui/Button";
import { MicroMark } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { comparison } from "@/data/content";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * THE OLD ROUTINE / THE MATOCHA ROUTINE.
 *
 * Not a table. The old routine is a staircase that indents with every step;
 * the MATOCHA routine is three moves, each shown with the object it involves —
 * the stick, the pour, the whisked glass. The travelling glass crosses the
 * section from left to right as you scroll.
 */
/** What each move actually involves — method only, no timing claims. */
const MOVE_NOTES = ["One 2g stick", "About 60ml", "Whisk or frother"];

export function Comparison() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const glassX = useTransform(scrollYProgress, [0, 1], ["2%", "76%"]);
  const glassTilt = useTransform(scrollYProgress, [0, 1], [-8, 8]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden sec"
    >
      {/* The travelling glass */}
      <motion.div
        aria-hidden="true"
        style={{ left: glassX, rotate: glassTilt }}
        className="pointer-events-none absolute top-6 h-32 w-32 opacity-[0.14] sm:h-44 sm:w-44"
      >
        <MatochaGlass variant="classic" className="h-full w-full" />
      </motion.div>

      <Container wide className="relative">
        <Reveal>
          <EditorialLabel index="11">The difference</EditorialLabel>
        </Reveal>

        <h2 className="text-h2 u-caps mt-5 max-w-[22ch]">
          <RevealLine>The old routine.</RevealLine>
          <RevealLine delay={0.08}>The MATOCHA routine.</RevealLine>
        </h2>

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-2 lg:gap-8">
          {/* The staircase */}
          <div>
            <div className="flex items-baseline justify-between border-b border-black/20 pb-4">
              <h3 className="u-label opacity-55">{comparison.old.label}</h3>
              <span className="u-label opacity-55">
                {comparison.old.steps.length} steps
              </span>
            </div>

            <ol className="mt-8">
              {comparison.old.steps.map((step, index) => (
                <motion.li
                  key={step}
                  data-matocha-motion
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.7, delay: index * 0.08, ease: EASE }}
                  className="flex items-baseline gap-4 py-3 sm:py-4"
                  style={{ paddingLeft: `${index * 1.7}rem` }}
                >
                  <span className="u-label w-6 shrink-0 tabular-nums opacity-40">
                    0{index + 1}
                  </span>
                  <span className="text-h3 u-caps font-normal opacity-45">
                    {step}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mx-1 hidden h-px flex-1 bg-black/15 sm:block"
                  />
                </motion.li>
              ))}
            </ol>

            <p className="mt-8 max-w-[34ch] text-sm leading-relaxed opacity-55">
              A tin, a scoop, a sifter and a flat surface — before every single
              cup, and left behind the moment you travel.
            </p>

            {/* Closes the column at roughly the height of the green block,
                and names what the old routine asks you to own. */}
            <div className="mt-8 border-t border-black/20 pt-5">
              <p className="u-label opacity-45">What it asks you to own</p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {["Tin", "Scoop", "Sifter", "Whisk", "Flat surface"].map(
                  (item) => (
                    <li key={item} className="u-label opacity-70">
                      {item}
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-5 max-w-[30ch] text-sm leading-relaxed opacity-45">
                None of which fit in a bag.
              </p>
            </div>
          </div>

          {/* Three moves, each with the object it involves */}
          <div className="on-green relative overflow-hidden bg-green p-7 text-ivory sm:p-10 lg:p-12">
            <div aria-hidden="true" className="absolute inset-0">
              <MatochaPattern color="#F3EFE5" opacity={0.05} scale={0.75} />
            </div>

            <div className="relative">
              <div className="flex items-baseline justify-between border-b border-ivory/25 pb-4">
                <h3 className="u-label opacity-70">{comparison.matocha.label}</h3>
                <span className="u-label opacity-70">
                  {comparison.matocha.steps.length} steps
                </span>
              </div>

              <ol className="mt-6">
                {comparison.matocha.steps.map((step, index) => (
                  <motion.li
                    key={step}
                    data-matocha-motion
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{
                      duration: 0.8,
                      delay: 0.1 + index * 0.1,
                      ease: EASE,
                    }}
                    className="flex items-center gap-4 border-b border-ivory/15 py-4 sm:gap-6 sm:py-5"
                  >
                    <span className="u-label w-6 shrink-0 tabular-nums opacity-45">
                      0{index + 1}
                    </span>

                    <span className="flex-1">
                      <span className="text-h2 u-caps block leading-none">
                        {step}
                      </span>
                      <span className="u-label mt-2 block opacity-55">
                        {MOVE_NOTES[index]}
                      </span>
                    </span>

                    {/* The object for this move */}
                    <span className="h-16 w-14 shrink-0 sm:h-20 sm:w-16">
                      {index === 0 ? (
                        <span className="flex h-full items-center justify-center">
                          <span className="block h-full rotate-[-10deg]">
                            <ProductStick tone="ivory" torn glass="empty" />
                          </span>
                        </span>
                      ) : (
                        <MatochaGlass
                          variant={index === 1 ? "pour" : "whisked"}
                          ink="#F3EFE5"
                        />
                      )}
                    </span>
                  </motion.li>
                ))}
              </ol>

              <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-ivory/70">
                One stick, torn open. The measuring already happened — long
                before the box reached your kitchen.
              </p>

              {/* Close on the product */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/25 pt-5">
                <div>
                  <p className="u-caps text-sm">{brand.productName}</p>
                  <MicroMark className="mt-1.5 block text-ivory">
                    {brand.sticksPerBox} × {brand.servingWeight}
                    {brand.servingUnit} — {formatPrice(brand.price)}
                  </MicroMark>
                </div>
                <ButtonLink href="/product" size="md" variant="ivory">
                  Shop MATOCHA
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
