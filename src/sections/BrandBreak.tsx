"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Container } from "@/components/ui/Section";
import { brand } from "@/data/brand";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * The campaign poster.
 *
 * Deep green ground, one enormous glass, two words. An advertisement rather
 * than a section — nothing else on the page is allowed to be this loud.
 */
export function BrandBreak() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  /* The glass drifts as the section passes. */
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section
      ref={ref}
      className="on-green relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden bg-green py-24 text-ivory sm:py-32"
    >
      {/* The object stands whole here — this is the one place it is not
          cropped, so the silhouette reads at full size. */}
      <motion.div
        aria-hidden="true"
        style={{ y }}
        className="pointer-events-none w-[54vw] max-w-[26rem] shrink-0 sm:w-[38vw] lg:w-[24vw]"
      >
        <motion.div
          data-matocha-motion
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.3, ease: EASE }}
        >
          <MatochaGlass variant="classic" ink="#F3EFE5" className="h-full w-full" />
        </motion.div>
      </motion.div>

      <Container wide className="relative mt-10 sm:mt-14">
        <h2 className="text-poster u-caps text-center">
          {brand.lines.poster.map((line, index) => (
            <span key={line} className="block overflow-hidden pb-[0.03em]">
              <motion.span
                data-matocha-motion
                className="block"
                initial={{ y: "110%" }}
                whileInView={{ y: "0%" }}
                viewport={viewportOnce}
                transition={{
                  duration: 1,
                  delay: 0.15 + index * 0.1,
                  ease: EASE,
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
      </Container>
    </section>
  );
}
