"use client";

import { motion } from "motion/react";
import { ProductStick } from "@/components/brand/ProductStick";
import { MatochaPattern } from "@/components/brand/MatochaPattern";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { Annotation, CurvedArrow } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * THIS LITTLE STICK IS THE WHOLE POINT.
 *
 * One pack, standing tall, annotated like a product plate. The pattern sits
 * behind it so the block never reads as an object floating in a void.
 */
const LABELS = [
  { text: "2g", side: "left", top: "12%" },
  { text: "One serving", side: "right", top: "32%" },
  { text: "Sealed fresh", side: "left", top: "56%" },
  { text: "Take it anywhere", side: "right", top: "76%" },
] as const;

export function OneStick() {
  return (
    <section className="relative overflow-hidden bg-ivory-deep sec">
      <div aria-hidden="true" className="absolute inset-0">
        <MatochaPattern color="#161713" opacity={0.05} scale={0.9} />
      </div>

      <Container wide className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Reveal>
              <EditorialLabel index="03">The format</EditorialLabel>
            </Reveal>

            <h2 className="text-h2 u-caps mt-5 max-w-[18ch]">
              <RevealLine>This little stick</RevealLine>
              <RevealLine delay={0.08}>is the whole point.</RevealLine>
            </h2>

            <Reveal delay={0.12}>
              <div className="mt-8 space-y-1">
                {[
                  `${brand.servingWeight}${brand.servingUnit} of Japanese matcha.`,
                  "Already measured.",
                  "Already portioned.",
                  "Ready when you are.",
                ].map((line) => (
                  <p key={line} className="text-lead opacity-75">
                    {line}
                  </p>
                ))}
              </div>

              <ButtonLink href="/product" className="mt-8">
                Shop the Daily Box
              </ButtonLink>
            </Reveal>
          </div>

          {/* The stick, standing, annotated */}
          <div className="relative lg:col-span-6 lg:col-start-7">
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 1, ease: EASE }}
              className="relative mx-auto flex h-[46vh] max-h-[30rem] min-h-[20rem] items-center justify-center"
            >
              <div className="h-full drop-shadow-[0_24px_44px_rgba(22,23,19,0.24)]">
                <ProductStick tone="green" glass="classic" />
              </div>

              {/* Annotations are positioned by a wrapper so the component
                  itself stays layout-agnostic. */}
              {LABELS.map((label) => (
                <span
                  key={label.text}
                  className="absolute hidden sm:block"
                  style={{
                    top: label.top,
                    ...(label.side === "left"
                      ? { right: "58%" }
                      : { left: "58%" }),
                  }}
                >
                  <Annotation from={label.side} length="2.25rem">
                    {label.text}
                  </Annotation>
                </span>
              ))}

              <span className="absolute -bottom-2 left-[8%] hidden h-10 w-16 opacity-40 sm:block">
                <CurvedArrow flip />
              </span>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
