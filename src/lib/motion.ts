import type { Transition, Variants } from "motion/react";

/** House easing — long, soft deceleration. Used everywhere for consistency. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const softSpring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 32,
  mass: 0.9,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: EASE } },
};

/** Parent variant that staggers direct children using `fadeUp`. */
export const stagger = (delayChildren = 0, staggerChildren = 0.09): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

/** Headline lines that rise out of an overflow-hidden mask. */
export const lineMask: Variants = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: 1.05, ease: EASE } },
};

/** Image / block reveal — a wipe that uncovers the composition. */
export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0.6 },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: { duration: 1.1, ease: EASE },
  },
};

/** Default viewport config: fire once, slightly before the block is centred. */
export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
