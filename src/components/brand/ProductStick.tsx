"use client";

import { useId } from "react";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";
import type { GlassVariant } from "./MatochaGlass";

/*
 * A 2g MATOCHA stick.
 *
 * The pack carries the glass, printed small. Different sticks in a box show
 * different states of it — classic, iced, pouring, whisked — so a tray reads as
 * one family rather than thirty identical wrappers.
 */

/* Two colourways only — deep green and ivory. There is no pale-green pack. */
export type StickTone = "green" | "ivory";

const TONES: Record<
  StickTone,
  { base: string; shade: string; crimp: string; ink: string; liquid: string }
> = {
  green: {
    base: brand.colors.green,
    shade: brand.colors.greenDeep,
    crimp: "#12331F",
    ink: brand.colors.ivory,
    liquid: brand.colors.matcha,
  },
  ivory: {
    base: brand.colors.ivory,
    shade: "#CFC7B4",
    crimp: brand.colors.ivoryDeep,
    ink: brand.colors.black,
    liquid: brand.colors.matcha,
  },
};

const LEVELS: Record<GlassVariant, number> = {
  classic: 0.6,
  whisked: 0.6,
  ice: 0.68,
  pour: 0.3,
  empty: 0.1,
};

/**
 * The glass reduced to what survives at pack scale: silhouette, liquid, rim.
 * Drawn inline rather than reusing <MatochaGlass /> because the stroke weights
 * have to be tuned for a 40px-wide print area.
 */
function PrintedGlass({
  cx,
  cy,
  ink,
  liquid,
  variant,
  uid,
}: {
  cx: number;
  cy: number;
  ink: string;
  liquid: string;
  variant: GlassVariant;
  uid: string;
}) {
  const top = -14;
  const bottom = 26;
  const surface = top + (1 - LEVELS[variant]) * (bottom - top);
  const body =
    "M-19 -18 C-18 0 -15 16 -12 23 C-11 26 -8 27 -5 27 L5 27 C8 27 11 26 12 23 C15 16 18 0 19 -18";

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <defs>
        <clipPath id={`pg-${uid}`}>
          <path d={`${body} Z`} />
        </clipPath>
      </defs>

      <g clipPath={`url(#pg-${uid})`}>
        <path
          d={`M-24 ${surface + 1} C-14 ${surface - 4} -6 ${surface + 3} 2 ${surface} C10 ${surface - 3} 18 ${surface + 4} 26 ${surface} L26 30 L-24 30 Z`}
          fill={liquid}
        />
        {variant === "ice" && (
          <>
            <rect
              x="-13"
              y={surface - 1}
              width="11"
              height="10"
              rx="2"
              fill={brand.colors.ivory}
              opacity="0.9"
            />
            <rect
              x="2"
              y={surface + 5}
              width="10"
              height="9"
              rx="2"
              fill={brand.colors.ivory}
              opacity="0.9"
            />
          </>
        )}
      </g>

      {variant === "pour" && (
        <path
          d="M1 -34 C0 -28 -2 -24 -1 -19"
          stroke={liquid}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      )}

      <path
        d={body}
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse
        cx="0"
        cy="-18"
        rx="19"
        ry="3.4"
        stroke={ink}
        strokeWidth="3"
        fill="none"
      />
      <path d="M-7 27 L7 27" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
    </g>
  );
}

export function ProductStick({
  tone = "green",
  className,
  torn = false,
  glass = "classic",
}: {
  tone?: StickTone;
  className?: string;
  torn?: boolean;
  /** Which state of the glass this pack carries. */
  glass?: GlassVariant;
}) {
  const t = TONES[tone];
  /* Unique per instance — see the note in ProductBox. */
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 132 520"
      className={cn("h-full w-auto", className)}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={t.shade} stopOpacity="0.9" />
          <stop offset="16%" stopColor={t.shade} stopOpacity="0.22" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="82%" stopColor={t.shade} stopOpacity="0.3" />
          <stop offset="100%" stopColor={t.shade} stopOpacity="0.92" />
        </linearGradient>

        <clipPath id={`clip-${uid}`}>
          {torn ? (
            <path d="M8 34 L20 26 L32 36 L44 27 L56 37 L68 28 L80 38 L92 29 L104 37 L116 28 L124 34 L124 509 A7 7 0 0 1 117 516 L15 516 A7 7 0 0 1 8 509 Z" />
          ) : (
            <rect x="8" y="4" width="116" height="512" rx="7" />
          )}
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect x="8" y="4" width="116" height="512" fill={t.base} />
        <rect
          x="8"
          y="4"
          width="116"
          height="512"
          fill={`url(#sheen-${uid})`}
        />

        {/* Crimped seals */}
        {!torn && <rect x="8" y="4" width="116" height="46" fill={t.crimp} />}
        <rect x="8" y="470" width="116" height="46" fill={t.crimp} />

        <PrintedGlass
          cx={66}
          cy={torn ? 118 : 134}
          ink={t.ink}
          liquid={t.liquid}
          variant={glass}
          uid={uid}
        />

        {/* Wordmark running up the length */}
        <text
          transform="rotate(-90 66 318)"
          x="66"
          y="318"
          textAnchor="middle"
          fill={t.ink}
          fontSize="25"
          letterSpacing="0.5"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          MATOCHA
        </text>

        <text
          x="66"
          y="424"
          textAnchor="middle"
          fill={t.ink}
          fontSize="12"
          letterSpacing="4"
          fontWeight="500"
          opacity="0.72"
          fontFamily="var(--font-sans)"
        >
          MATCHA
        </text>

        <text
          x="66"
          y="452"
          textAnchor="middle"
          fill={t.ink}
          fontSize="16"
          letterSpacing="2"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          2G
        </text>

        <text
          x="66"
          y="500"
          textAnchor="middle"
          fill={t.ink}
          fontSize="7.5"
          letterSpacing="1.2"
          opacity="0.6"
          fontFamily="var(--font-sans)"
        >
          100% JAPANESE MATCHA
        </text>
      </g>

      {/* Tear notch */}
      {!torn && <path d="M9 60 L20 54 L9 48 Z" fill={t.shade} opacity="0.6" />}

      <rect
        x="8"
        y="4"
        width="116"
        height="512"
        rx="7"
        fill="none"
        stroke={t.shade}
        strokeOpacity="0.3"
      />
    </svg>
  );
}
