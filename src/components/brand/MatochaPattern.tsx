"use client";

import { useId } from "react";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

/*
 * The MATOCHA pattern.
 *
 * A tile built from the brand's own parts — the glass silhouette, the liquid
 * wave, and the 2G mark — offset row to row so the repeat never reads as a
 * grid. Used as a band between sections, behind the footer and inside the cart.
 */
export function MatochaPattern({
  className,
  color = brand.colors.ivory,
  opacity = 0.16,
  scale = 1,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  /** Tile size multiplier. Larger reads as graphic, smaller as texture. */
  scale?: number;
}) {
  const id = `pattern-${useId().replace(/:/g, "")}`;
  const size = 120 * scale;

  return (
    <svg
      className={cn("h-full w-full", className)}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={id}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke={color}
            strokeWidth={2.2 * scale}
            strokeLinecap="round"
            transform={`scale(${scale})`}
          >
            {/* Glass, top-left */}
            <path d="M14 22 C14.5 36 16 50 18 58 C18.6 61 21 63 24 63 L38 63 C41 63 43 61 43.6 58 C46 50 47.5 36 48 22" />
            <ellipse cx="31" cy="22" rx="17" ry="2.6" />
            <path d="M22 63 L40 63" strokeWidth={3.4 * scale} />

            {/* Wave, bottom-right */}
            <path d="M66 92 C74 86 82 98 90 92 C98 86 104 96 112 91" />

            {/* Wave, top-right */}
            <path d="M70 30 C78 24 86 36 94 30" opacity="0.75" />
          </g>

          {/* 2G, bottom-left */}
          <text
            x={12 * scale}
            y={100 * scale}
            fill={color}
            fontFamily="var(--font-sans)"
            fontSize={15 * scale}
            fontWeight="600"
            letterSpacing={1 * scale}
          >
            2G
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * A thin band of the pattern, used to close one section and open the next.
 */
export function PatternBand({
  className,
  color,
  background = "bg-black",
  opacity = 0.22,
}: {
  className?: string;
  color?: string;
  background?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-16 overflow-hidden sm:h-20", background, className)}
    >
      <MatochaPattern color={color} opacity={opacity} scale={0.8} />
    </div>
  );
}
