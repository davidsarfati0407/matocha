"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { faq } from "@/data/faq";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * FAQ.
 *
 * The glass on the left fills as questions open and empties when they all
 * close — the panel is never a blank column, and the interaction is the same
 * object doing the work everywhere else on the site.
 */
export function Faq({ index = "14" }: { index?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  /* Empty when nothing is open; fuller the further down the list you are. */
  const fill =
    openIndex === null ? 0.08 : 0.28 + (openIndex / (faq.length - 1)) * 0.5;

  return (
    <section id="faq" className="bg-green sec text-ivory">
      <Container wide>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Title + the reactive glass */}
          <div className="lg:col-span-4">
            <Reveal>
              <EditorialLabel index={index} className="text-ivory">
                Questions
              </EditorialLabel>
            </Reveal>
            <h2 className="text-h2 u-caps mt-5 max-w-[10ch]">
              <RevealLine>Good</RevealLine>
              <RevealLine delay={0.08}>to know.</RevealLine>
            </h2>

            <div className="mt-10 hidden h-64 items-end lg:flex">
              <div className="h-full">
                <MatochaGlass
                  variant="classic"
                  fill={fill}
                  ink="#F3EFE5"
                  className="transition-none"
                />
              </div>
            </div>
            <MicroMark className="mt-4 hidden text-ivory lg:block">
              {openIndex === null
                ? "Ask something"
                : `${openIndex + 1} / ${faq.length}`}
            </MicroMark>
          </div>

          {/* Questions */}
          <div className="lg:col-span-7 lg:col-start-6">
            <div className="border-t border-ivory/20">
              {faq.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={item.question} className="border-b border-ivory/20">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left"
                      >
                        <span className="u-caps max-w-[24ch] text-[1.15rem] sm:text-[1.35rem]">
                          {item.question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="relative mt-1.5 block h-4 w-4 shrink-0"
                        >
                          <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
                          <span
                            className={cn(
                              "absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-[var(--ease-matocha)]",
                              isOpen ? "scale-y-0" : "scale-y-100",
                            )}
                          />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          data-matocha-motion
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-[56ch] pb-6 text-ivory/75">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
