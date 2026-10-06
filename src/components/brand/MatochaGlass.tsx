"use client";

import { useId } from "react";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

/*
 * THE MATOCHA GLASS
 *
 * The brand's one figurative object: a short, slightly wide tumbler, drawn
 * with a heavy outline and flat colour. The silhouette is deliberately not
 * symmetrical — the left wall falls a little straighter than the right, the rim
 * sits a touch off-level — so it reads as drawn rather than plotted.
 *
 * Every variant shares this silhouette. Only what happens inside changes.
 *
 * The liquid's surface is never a flat line: it is a wave, and that wave is the
 * second brand asset (see <MatochaWave />).
 */

export type GlassVariant =
  | "classic"
  | "pour"
  | "ice"
  | "whisked"
  | "empty";

/** How full each variant sits, 0 (empty) → 1 (at the rim). */
const VARIANT_FILL: Record<GlassVariant, number> = {
  classic: 0.66,
  pour: 0.3,
  ice: 0.72,
  whisked: 0.66,
  empty: 0.09,
};

/* Geometry. The interior path is the outline inset by the stroke. */
const OUTLINE =
  "M36 47 C37 97 43 149 50 178 C52 190 60 196 72 196 L129 196 C141 196 148 189 150 177 C157 148 162 96 164 47";
const INTERIOR =
  "M42 50 C43 98 49 148 56 175 C58 185 63 189 72 189 L128 189 C137 189 142 185 144 175 C151 148 157 98 158 50 Z";

const LIQUID_TOP = 62;
const LIQUID_BOTTOM = 194;

/** The signature surface: two uneven crests, never level. */
function wavePath(y: number) {
  return [
    `M28 ${y + 2}`,
    `C 48 ${y - 9}, 66 ${y + 7}, 92 ${y + 1}`,
    `C 118 ${y - 6}, 140 ${y + 9}, 172 ${y - 1}`,
    `L 172 ${LIQUID_BOTTOM + 8}`,
    `L 28 ${LIQUID_BOTTOM + 8}`,
    "Z",
  ].join(" ");
}

export function MatochaGlass({
  variant = "classic",
  className,
  ink = brand.colors.black,
  liquid = brand.colors.matcha,
  /** Overrides the variant's fill level, 0 → 1. */
  fill,
  /** Plays the liquid-rise animation once on mount. */
  rise = false,
  /**
   * Plays a short wave once on mount. Change the element's `key` to replay it —
   * this is how the add-to-cart interaction is triggered.
   */
  pulse = false,
  title,
}: {
  variant?: GlassVariant;
  className?: string;
  ink?: string;
  liquid?: string;
  fill?: number;
  rise?: boolean;
  pulse?: boolean;
  /** Supply only when the glass carries meaning; otherwise it stays decorative. */
  title?: string;
}) {
  const level = fill ?? VARIANT_FILL[variant];
  const surfaceY = LIQUID_TOP + (1 - level) * (LIQUID_BOTTOM - LIQUID_TOP);
  /* Unique per instance: several glasses share a page, and a duplicated
     clipPath id makes the liquid spill outside the vessel. */
  const clipId = `glass-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 200 220"
      className={cn("h-full w-full", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      {title && <title>{title}</title>}

      <defs>
        <clipPath id={clipId}>
          <path d={INTERIOR} />
        </clipPath>
      </defs>

      {/* Liquid, clipped to the inside of the glass */}
      <g clipPath={`url(#${clipId})`}>
        <g
          className={cn(rise && "glass-rise", pulse && "glass-pulse")}
          style={{ transformBox: "view-box", transformOrigin: "center" }}
        >
          <path d={wavePath(surfaceY)} fill={liquid} />

          {/* Whisked: foam sitting on the surface */}
          {variant === "whisked" && (
            <g stroke={brand.colors.ivory} strokeWidth="3" strokeLinecap="round">
              <path d={`M52 ${surfaceY - 4} q 12 -7 24 -1`} opacity="0.9" />
              <path d={`M92 ${surfaceY - 8} q 14 -6 26 0`} opacity="0.75" />
              <path d={`M126 ${surfaceY + 2} q 10 -6 20 -2`} opacity="0.6" />
              <circle cx="72" cy={surfaceY + 6} r="2.4" fill={brand.colors.ivory} stroke="none" opacity="0.7" />
              <circle cx="116" cy={surfaceY + 11} r="1.8" fill={brand.colors.ivory} stroke="none" opacity="0.55" />
            </g>
          )}

          {/* Ice: three cubes, none of them square */}
          {variant === "ice" && (
            <g>
              <rect
                x="58" y={surfaceY - 6} width="34" height="32" rx="6"
                fill={brand.colors.ivory} fillOpacity="0.92"
                stroke={ink} strokeWidth="4"
                transform={`rotate(-11 75 ${surfaceY + 10})`}
              />
              <rect
                x="104" y={surfaceY + 6} width="30" height="29" rx="6"
                fill={brand.colors.ivory} fillOpacity="0.92"
                stroke={ink} strokeWidth="4"
                transform={`rotate(9 119 ${surfaceY + 20})`}
              />
              <rect
                x="76" y={surfaceY + 30} width="27" height="26" rx="5"
                fill={brand.colors.ivory} fillOpacity="0.88"
                stroke={ink} strokeWidth="4"
                transform={`rotate(-4 89 ${surfaceY + 43})`}
              />
            </g>
          )}
        </g>
      </g>

      {/* Pouring stream, entering from above the rim */}
      {variant === "pour" && (
        <g>
          <path
            d="M104 -6 C102 22, 96 34, 99 52 C100 60, 104 66, 103 74"
            stroke={liquid}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="122" cy="42" r="4.5" fill={liquid} />
          <circle cx="86" cy="66" r="3" fill={liquid} />
        </g>
      )}

      {/* The vessel, drawn over the liquid */}
      <path
        d={OUTLINE}
        stroke={ink}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rim — a shallow ellipse, sitting fractionally off level */}
      <ellipse
        cx="100"
        cy="47"
        rx="64"
        ry="9.5"
        stroke={ink}
        strokeWidth="7"
        transform="rotate(-1 100 47)"
      />

      {/* Heavy base */}
      <path
        d="M64 196 L136 196"
        stroke={ink}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The liquid wave on its own — a rule, a divider, a section marker.
 * Same crests as the glass surface, so the two read as one system.
 */
export function MatochaWave({
  className,
  color = brand.colors.matcha,
  strokeWidth = 6,
}: {
  className?: string;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 24"
      className={cn("w-full", className)}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 14 C 26 2, 48 22, 74 13 C 100 4, 122 24, 148 13 C 168 5, 184 16, 198 11"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
