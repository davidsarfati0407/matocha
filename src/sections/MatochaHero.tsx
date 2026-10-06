"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductBox } from "@/components/brand/ProductBox";
import { ProductStick } from "@/components/brand/ProductStick";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Annotation, CurvedArrow, MicroMark } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/*
 * HERO — a full campaign rather than one object on a field.
 *
 * Layers, back to front:
 *   1. the oversized glass, cropped by the right edge, rising on load
 *   2. the pack and three sticks
 *   3. annotations tying the composition to real facts
 *   4. the campaign line
 *   5. a deep-green strip closing the section
 *
 * Load sequence, ~1.3s: matcha rises in the glass, then the line, then the
 * product, then the annotations.
 */
const HEADLINE = ["Matcha.", "Made simple."];

export function MatochaHero() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const glassY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const productY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ivory pt-24 lg:pt-[92px]"
    >
      {/* The glass, cropped by the right edge */}
      <motion.div
        aria-hidden="true"
        style={{ y: glassY }}
        className="pointer-events-none absolute right-[-10%] bottom-[19%] w-[46vw] max-w-none sm:right-[-6%] sm:w-[38vw] lg:right-[-3%] lg:bottom-[13%] lg:w-[30vw]"
      >
        <MatochaGlass variant="classic" rise className="h-full w-full" />
      </motion.div>

      <Container wide className="relative flex flex-1 flex-col">
        {/* Top rail of facts */}
        <motion.div
          data-matocha-motion
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-black/10 pb-4"
        >
          <span className="u-label flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
            {brand.sticksPerBox} × {brand.servingWeight}
            {brand.servingUnit.toUpperCase()}
          </span>
          <MicroMark>100% Japanese matcha</MicroMark>
          <MicroMark className="hidden sm:inline">No sugar</MicroMark>
          <MicroMark className="hidden sm:inline">No additives</MicroMark>
          <MicroMark className="ml-auto hidden lg:inline">
            {brand.netWeight}
            {brand.servingUnit} total — {formatPrice(brand.price)}
          </MicroMark>
        </motion.div>

        <div className="grid flex-1 items-center gap-6 pt-6 lg:grid-cols-12">
          <div className="relative z-20 lg:col-span-7">
            <h1 className="u-caps text-[clamp(3rem,10vw,9rem)] leading-[0.84]">
              {HEADLINE.map((line, index) => (
                <span key={line} className="block overflow-hidden pb-[0.04em]">
                  <motion.span
                    data-matocha-motion
                    className="block"
                    initial={{ y: "112%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.9,
                      delay: 0.6 + index * 0.09,
                      ease: EASE,
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.95, ease: EASE }}
              className="mt-7 max-w-md"
            >
              <p className="text-lead opacity-75">
                Premium Japanese matcha.
                <br />
                Perfectly portioned into {brand.servingWeight}
                {brand.servingUnit} sticks.
              </p>

              <p className="u-caps mt-4 text-sm opacity-45">
                One stick. One serving. No measuring.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/product" className="w-full sm:w-auto">
                  Shop MATOCHA
                </ButtonLink>
                <ButtonLink
                  href="/why-sticks"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Why sticks?
                </ButtonLink>
              </div>
            </motion.div>
          </div>

          {/* Pack and sticks */}
          <motion.div
            style={{ y: productY }}
            className="relative z-10 h-[30svh] min-h-[220px] lg:col-span-5 lg:h-[46vh]"
          >
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
              className="absolute bottom-[2%] left-0 w-[48%] sm:w-[54%]"
            >
              <ProductBox className="w-full" />
            </motion.div>

            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
              className="absolute bottom-[-2%] left-[46%] flex h-full w-[38%] items-end gap-[6%] sm:left-[40%] sm:w-[46%]"
            >
              {(["classic", "ice", "whisked"] as const).map((glass, index) => (
                <div
                  key={glass}
                  /* The third stick only appears once there is room for it. */
                  className={
                    index === 2
                      ? "hidden drop-shadow-[0_16px_26px_rgba(22,23,19,0.22)] sm:block"
                      : "drop-shadow-[0_16px_26px_rgba(22,23,19,0.22)]"
                  }
                  style={{
                    transform: `rotate(${[-8, 3, 9][index]}deg)`,
                    height: ["72%", "62%", "54%"][index],
                    marginBottom: `${index * 6}px`,
                  }}
                >
                  <ProductStick
                    tone={index === 1 ? "ivory" : "green"}
                    glass={glass}
                  />
                </div>
              ))}
            </motion.div>

            {/* Annotations */}
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
            >
              {/* Wrapped: <Annotation> sets its own display, so a `hidden`
                  passed through className would not win. */}
              <span className="absolute top-[6%] -left-[6%] hidden lg:block">
                <Annotation>{brand.sticksPerBox} sticks</Annotation>
              </span>
              <span className="absolute top-[30%] right-[2%] hidden lg:block">
                <Annotation from="right">
                  {brand.servingWeight}
                  {brand.servingUnit} each
                </Annotation>
              </span>
              <div className="absolute -top-[2%] left-[34%] hidden h-8 w-12 opacity-45 lg:block">
                <CurvedArrow />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Container>

      {/* The hero closes on a strip of deep green — the first colour break,
          and the line the product appears to stand on. */}
      <div className="relative z-10 mt-8 bg-green py-3.5 text-ivory">
        <Container wide>
          <div className="flex items-center justify-between gap-4">
            <MicroMark className="text-ivory">
              {brand.address.city}, {brand.address.country}
            </MicroMark>
            <span className="u-caps hidden text-sm sm:block">
              {brand.campaignLine}
            </span>
            <MicroMark className="text-ivory">
              01 / {brand.sticksPerBox}
            </MicroMark>
          </div>
        </Container>
      </div>
    </section>
  );
}
