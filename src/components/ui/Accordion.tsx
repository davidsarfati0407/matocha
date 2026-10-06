"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type AccordionEntry = {
  question: string;
  answer: React.ReactNode;
};

/**
 * Editorial disclosure list — hairline rules, no boxes, no chevrons.
 * The toggle is a plus that becomes a minus.
 */
export function Accordion({
  items,
  className,
  tone = "dark",
  defaultOpen = null,
}: {
  items: AccordionEntry[];
  className?: string;
  tone?: "dark" | "light";
  defaultOpen?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const rule = tone === "dark" ? "border-black/15" : "border-ivory/20";

  return (
    <div className={cn("border-t", rule, className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className={cn("border-b", rule)}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="group flex w-full items-start justify-between gap-6 py-6 text-left sm:py-8"
              >
                <span className="text-h3 max-w-[26ch] font-medium tracking-[-0.02em] sm:max-w-none">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="relative mt-2 block h-4 w-4 shrink-0"
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
                  key="panel"
                  data-matocha-motion
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="text-lead max-w-[58ch] pb-8 opacity-70">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
