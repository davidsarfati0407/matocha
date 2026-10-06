"use client";

import { motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductStick } from "@/components/brand/ProductStick";
import { Container } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { EASE, viewportOnce } from "@/lib/motion";

/**
 * THE 2G MOMENT.
 *
 * The dose set at poster scale on fresh matcha green, with the three denials
 * overlaid and the product sitting inside the counter of the G. This is the
 * page's loudest typographic beat.
 */
export function BigTwoG() {
  return (
    <section className="texture-powder relative overflow-hidden bg-matcha sec text-black">
      <Container wide className="relative">
        <div className="flex items-start justify-between">
          <MicroMark className="text-black">One stick</MicroMark>
          <MicroMark className="text-black">One serving</MicroMark>
        </div>

        <div className="relative">
          {/* The number */}
          <motion.p
            data-matocha-motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 1, ease: EASE }}
            className="u-caps text-center text-[clamp(9rem,34vw,26rem)] leading-[0.75] tracking-[-0.06em]"
            aria-hidden="true"
          >
            2G
          </motion.p>
          <h2 className="sr-only">
            Two grams of matcha in every stick. No scoop. No scale. No guessing.
          </h2>

          {/* Product, standing in front of the number */}
          <motion.div
            data-matocha-motion
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            /* On a phone the product sits under the numeral instead of on top
               of it — overlapping at 390px hid most of the 2G. */
            className="relative mt-4 flex items-end justify-center gap-6 sm:absolute sm:inset-x-0 sm:bottom-[-6%] sm:mt-0 sm:gap-10"
          >
            <div className="h-[9rem] rotate-[-7deg] drop-shadow-xl sm:h-[13rem] lg:h-[16rem]">
              <ProductStick tone="green" glass="classic" />
            </div>
            <div className="h-[7rem] drop-shadow-xl sm:h-[10rem] lg:h-[12.5rem]">
              <MatochaGlass variant="whisked" liquid="#173D2B" />
            </div>
          </motion.div>
        </div>

        {/* The denials */}
        <motion.ul
          data-matocha-motion
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-2 border-t border-black/20 pt-6 sm:mt-24"
        >
          {["No scoop.", "No scale.", "No guessing."].map((line) => (
            <li key={line} className="text-h3 u-caps">
              {line}
            </li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
