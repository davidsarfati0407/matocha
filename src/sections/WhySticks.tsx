"use client";

import { motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { CtaRail } from "@/components/ui/CtaRail";
import { stickBenefits } from "@/data/content";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * WHY STICKS — the same glass in three states instead of three icons.
 */
export function WhySticks() {
  return (
    <section id="why-sticks" className="sec">
      <Container wide>
        <Reveal>
          <EditorialLabel index="04">Why sticks</EditorialLabel>
        </Reveal>

        <h2 className="text-h2 u-caps mt-5 max-w-[18ch]">
          <RevealLine>One stick.</RevealLine>
          <RevealLine delay={0.08}>Wherever the day goes.</RevealLine>
        </h2>

        <ul className="mt-16 grid border-t border-black/15 sm:grid-cols-3 lg:mt-24">
          {stickBenefits.map((benefit, index) => (
            <motion.li
              key={benefit.title}
              data-matocha-motion
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.85, delay: index * 0.1, ease: EASE }}
              className="group border-b border-black/15 pt-8 pb-10 sm:border-r sm:border-b-0 sm:border-black/15 sm:pr-7 sm:pl-7 sm:first:pl-0 sm:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="u-label opacity-45">{benefit.kicker}</span>
                <span className="u-label tabular-nums opacity-30">
                  0{index + 1}
                </span>
              </div>

              {/* One object, three states — no icon set */}
              <div className="mt-8 h-32 w-32 transition-transform duration-700 ease-[var(--ease-matocha)] group-hover:-translate-y-1 sm:h-36 sm:w-36">
                <MatochaGlass variant={benefit.glass} />
              </div>

              <h3 className="text-h3 u-caps mt-8 max-w-[12ch]">
                {benefit.title}
              </h3>
              <p className="text-lead mt-3 max-w-[26ch] opacity-75">
                {benefit.body}
              </p>
              <p className="mt-4 max-w-[30ch] text-sm leading-relaxed opacity-55">
                {benefit.detail}
              </p>
            </motion.li>
          ))}
        </ul>
      </Container>

      <CtaRail
        className="mt-12"
        label="One stick. One serving. No measuring."
      />
    </section>
  );
}
