"use client";

import { motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductBox } from "@/components/brand/ProductBox";
import { ProductStick } from "@/components/brand/ProductStick";
import { StickTray } from "@/components/brand/StickTray";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { Annotation, MicroMark } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * WHAT'S IN THE BOX?
 *
 * An editorial product diagram: the pack at the centre, the thirty sticks
 * fanned behind it, the glass it becomes at the side, and annotations carrying
 * the numbers. Abundance without rendering thirty packs at full detail.
 */
export function WhatsInTheBox() {
  return (
    <section className="texture-powder relative overflow-hidden bg-green sec text-ivory">
      <Container wide className="relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <EditorialLabel index="02" className="text-ivory">
                The box
              </EditorialLabel>
            </Reveal>
            <h2 className="text-h2 u-caps mt-5 max-w-[16ch]">
              <RevealLine>What&apos;s</RevealLine>
              <RevealLine delay={0.08}>in the box?</RevealLine>
            </h2>
          </div>

          <Reveal delay={0.12} className="hidden max-w-[26ch] lg:block">
            <p className="text-note text-ivory/70">
              One outer box, thirty sealed sticks, and nothing else. No scoop,
              no sifter, no tin to close again.
            </p>
          </Reveal>
        </div>

        {/* The composition */}
        <div className="relative mt-12 pt-6 lg:mt-14">
          {/* Thirty sticks, fanned across the back */}
          <motion.div
            data-matocha-motion
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 1, ease: EASE }}
            className="absolute inset-x-0 top-0 opacity-30"
          >
            <StickTray columns={30} mobileColumns={15} tone="ivory" />
          </motion.div>

          <div className="relative grid items-end gap-6 sm:grid-cols-12">
            {/* Loose sticks, left */}
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              className="col-span-3 hidden h-56 items-end justify-center gap-3 sm:flex lg:h-72"
            >
              <div className="h-[74%] rotate-[-12deg]">
                <ProductStick tone="ivory" glass="pour" />
              </div>
              <div className="h-full rotate-[4deg]">
                <ProductStick tone="ivory" glass="classic" />
              </div>
            </motion.div>

            {/* The pack, centre */}
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 1, delay: 0.15, ease: EASE }}
              className="relative col-span-12 sm:col-span-6"
            >
              <ProductBox open className="w-full drop-shadow-2xl" />

              <span className="absolute top-[10%] -left-2 hidden lg:block">
                <Annotation tone="light">Opened</Annotation>
              </span>
              <span className="absolute top-[46%] -right-4 hidden lg:block">
                <Annotation tone="light" from="right">
                  {brand.netWeight}
                  {brand.servingUnit} total
                </Annotation>
              </span>
            </motion.div>

            {/* The glass it becomes, right */}
            <motion.div
              data-matocha-motion
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
              className="col-span-3 hidden h-56 items-end justify-center sm:flex lg:h-72"
            >
              <div className="h-[86%]">
                <MatochaGlass variant="whisked" ink="#F3EFE5" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* The numbers */}
        <Reveal delay={0.1}>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-ivory/25 sm:grid-cols-4">
            {[
              ["Contents", `${brand.sticksPerBox} sticks`],
              ["Per stick", `${brand.servingWeight}${brand.servingUnit}`],
              ["Total", `${brand.netWeight}${brand.servingUnit}`],
              ["Ingredients", "100% matcha"],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-ivory/15 py-5 pr-4 last:border-r-0">
                <dt className="u-label text-ivory/55">{label}</dt>
                <dd className="text-h3 u-caps mt-2">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-3 flex items-center justify-between">
          <MicroMark className="text-ivory">MATOCHA®</MicroMark>
          <MicroMark className="text-ivory">Daily Box</MicroMark>
        </div>
      </Container>
    </section>
  );
}
