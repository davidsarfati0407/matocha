"use client";

import { MotionConfig } from "motion/react";

/**
 * Global motion policy.
 *
 * Reduced motion is honoured in CSS, not here — see the
 * `prefers-reduced-motion` block in globals.css, which neutralises every
 * element carrying `data-matocha-motion`.
 *
 * The reason is hydration. Motion's own `reducedMotion="user"` rewrites
 * transform animations into opacity ones at render time, so a visitor with the
 * setting enabled renders `opacity: 0` where the server rendered
 * `translateY(112%)` — the markup diverges and hydration fails. Worse, letting
 * it switch after hydration strands elements at their offset start position.
 *
 * Pinning it to "never" keeps the props identical on both sides; the
 * stylesheet, which hydration never inspects, does the honest work.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
