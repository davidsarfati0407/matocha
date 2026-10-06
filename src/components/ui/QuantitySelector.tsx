"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Quantity control. Tap targets are 48px+ on every breakpoint, and the digit
 * rolls in the direction of the change.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 12,
  size = "lg",
  tone = "dark",
  label = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "lg";
  tone?: "dark" | "light";
  label?: string;
}) {

  const dimensions =
    size === "lg"
      ? "h-14 sm:h-16 min-w-[9.5rem] text-base"
      : "h-11 min-w-[7rem] text-sm";

  const border = tone === "dark" ? "border-black/25" : "border-ivory/30";

  const button =
    "flex h-full flex-1 items-center justify-center text-lg leading-none transition-opacity duration-300 hover:opacity-100 disabled:opacity-25 opacity-70";

  return (
    <div
      className={cn(
        "inline-flex select-none items-stretch border",
        border,
        dimensions,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <span aria-hidden="true">–</span>
      </button>

      <span
        className="relative flex w-10 items-center justify-center overflow-hidden tabular-nums"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            data-matocha-motion
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>

      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
