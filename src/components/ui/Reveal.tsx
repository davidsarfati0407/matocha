"use client";

import { motion } from "motion/react";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Entrance primitives.
 *
 * None of these branch on `useReducedMotion()`: the props below render
 * identically on the server and on the client, and <MotionProvider> drops the
 * transform half of each animation for visitors who ask for reduced motion.
 */

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distance travelled on the y axis, in px. */
  y?: number;
  as?: "div" | "span" | "li" | "section" | "figure";
};

/** Section-level entrance: a short rise with a fade. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = "div",
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      data-matocha-motion
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

/**
 * A headline line that rises out of a mask. Wrap one line of text per
 * instance — the mask only works on a single line box.
 */
export function RevealLine({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={cn("block overflow-hidden pb-[0.08em]", className)}>
      <motion.span
        data-matocha-motion
        className="block"
        initial={{ y: "112%" }}
        whileInView={{ y: "0%" }}
        viewport={viewportOnce}
        transition={{ duration: 1.05, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Clip-wipe used for image blocks and product compositions. */
export function RevealImage({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      data-matocha-motion
      className={className}
      initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0.7 }}
      whileInView={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 1.15, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
