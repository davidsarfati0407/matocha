"use client";

import { motion } from "motion/react";
import { LifestyleFrame } from "@/components/brand/LifestyleFrame";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { CtaRail } from "@/components/ui/CtaRail";
import { MicroMark } from "@/components/ui/Annotation";
import { lifestyleScenes } from "@/data/content";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * MATCHA DOESN'T LIVE IN THE KITCHEN.
 *
 * A collage rather than a gallery: frames of different sizes, some overlapping,
 * each stamped with a time. Read together they describe one day, carried.
 */
const LAYOUT = [
  { span: "col-span-7 lg:col-span-4", ratio: "4 / 5", offset: "lg:mt-0", time: "08:12 — Home" },
  { span: "col-span-5 lg:col-span-3", ratio: "1 / 1", offset: "lg:mt-20", time: "11:43 — Desk" },
  { span: "col-span-6 lg:col-span-3", ratio: "3 / 4", offset: "lg:mt-6", time: "13:05 — Window" },
  { span: "col-span-6 lg:col-span-2", ratio: "3 / 4", offset: "lg:mt-28", time: "15:30 — Bag" },
  { span: "col-span-7 lg:col-span-4", ratio: "16 / 11", offset: "lg:-mt-10", time: "19:04 — Away" },
  { span: "col-span-5 lg:col-span-3", ratio: "4 / 5", offset: "lg:mt-10", time: "07:52 — Train" },
] as const;

export function Lifestyle() {
  return (
    <section className="overflow-hidden bg-ivory sec">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <EditorialLabel index="10">Portability</EditorialLabel>
            </Reveal>
            <h2 className="text-h2 u-caps mt-5 max-w-[20ch]">
              <RevealLine>Matcha doesn&apos;t</RevealLine>
              <RevealLine delay={0.07}>live in the kitchen.</RevealLine>
            </h2>
          </div>
          <Reveal delay={0.1} className="max-w-[26ch]">
            <p className="text-note opacity-65">
              Pocket, bag, desk, hotel, train. A stick is 2g and flat, so the
              day decides where it happens.
            </p>
          </Reveal>
        </div>

        {/* Collage — overlapping on desktop, a tight mosaic on mobile */}
        <div className="mt-10 grid grid-cols-12 gap-3 sm:gap-4 lg:mt-14 lg:gap-5">
          {lifestyleScenes.map((scene, index) => {
            const layout = LAYOUT[index];
            return (
              <motion.figure
                key={scene.title}
                data-matocha-motion
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.9,
                  delay: (index % 3) * 0.07,
                  ease: EASE,
                }}
                className={cn("relative", layout.span, layout.offset)}
              >
                <LifestyleFrame
                  tone={scene.tone}
                  lightX={scene.lightX}
                  lightY={scene.lightY}
                  subject={scene.subject}
                  glass={scene.glass}
                  ratio={layout.ratio}
                />
                <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                  <MicroMark>{layout.time}</MicroMark>
                  <span className="u-label hidden opacity-70 sm:inline">
                    {scene.title}
                  </span>
                </figcaption>
              </motion.figure>
            );
          })}
        </div>
      </Container>

      <CtaRail
        className="mt-14"
        label="Thirty servings. Wherever the day goes."
      />
    </section>
  );
}
