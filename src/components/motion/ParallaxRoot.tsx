"use client";

import { useRef } from "react";
import { useParallax } from "./useParallax";

/** Wraps server-rendered markup; children with `data-depth` drift at their own speed on scroll. */
export function ParallaxRoot({
  children,
  className,
  strength = 1,
  origin = "center",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strength?: number; origin?: "top" | "center" }) {
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref, strength, origin);
  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
