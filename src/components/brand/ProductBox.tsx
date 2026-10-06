"use client";

import { useId } from "react";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

/*
 * The MATOCHA DAILY BOX.
 *
 * Deep matcha green carton, one large confident glass, the wordmark, and the
 * two facts that matter: 30 × 2G, 100% Japanese matcha. Nothing else — this is
 * a box meant to be left out on a counter.
 *
 * Replace with photography by swapping this component at the section level:
 * every caller treats it as a plain block with a fixed aspect.
 */
export function ProductBox({
  className,
  open = false,
}: {
  className?: string;
  open?: boolean;
}) {
  /* Unique per instance. With fixed ids, the first definition in the document
     wins — and if that instance sits in a display:none column, the filter and
     gradient references break and the box vanishes. */
  const uid = useId().replace(/:/g, "");
  const faceId = `box-face-${uid}`;
  const shadowId = `box-shadow-${uid}`;
  const clipId = `box-glass-${uid}`;

  const green = brand.colors.green;
  const deep = brand.colors.greenDeep;
  const ivory = brand.colors.ivory;
  const matcha = brand.colors.matcha;

  /* The glass, scaled up for the pack front. */
  const body =
    "M-58 -74 C-56 -18 -47 34 -38 61 C-35 71 -26 78 -13 78 L13 78 C26 78 34 71 37 61 C46 34 55 -18 57 -74";
  const interior =
    "M-50 -68 C-48 -16 -40 32 -32 56 C-29 65 -22 70 -13 70 L13 70 C22 70 29 65 32 56 C40 32 48 -16 50 -68 Z";

  return (
    <svg
      viewBox="0 0 460 560"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`${brand.productName} — ${brand.sticksPerBox} sticks of ${brand.servingWeight}${brand.servingUnit}`}
    >
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0%" stopColor="#1C4A34" />
          <stop offset="58%" stopColor={green} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow
            dx="0"
            dy="26"
            stdDeviation="26"
            floodColor={deep}
            floodOpacity="0.3"
          />
        </filter>
        <clipPath id={clipId}>
          <path d={interior} transform="translate(226 330)" />
        </clipPath>
      </defs>

      {/* Sticks standing in an opened pack */}
      {open && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${88 + i * 54} ${40 - (i % 2) * 16})`}>
              <rect
                width="40"
                height="122"
                rx="4"
                fill={i % 2 === 0 ? green : ivory}
              />
              <rect
                width="40"
                height="15"
                fill={deep}
                opacity={i % 2 === 0 ? 0.4 : 0.16}
              />
            </g>
          ))}
        </g>
      )}

      <g filter={`url(#${shadowId})`}>
        {/* Lid plane */}
        <path d="M62 150 L390 150 L436 106 L108 106 Z" fill="#1C4A34" />
        {/* Right side */}
        <path d="M390 150 L436 106 L436 484 L390 528 Z" fill={deep} />
        {/* Front face */}
        <path d="M62 150 L390 150 L390 528 L62 528 Z" fill={`url(#${faceId})`} />

        {/* The glass, large and confident */}
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M150 344 C182 330 208 352 232 342 C256 332 282 356 316 344 L316 420 L150 420 Z"
            fill={matcha}
          />
        </g>
        <g transform="translate(226 330)">
          <path
            d={body}
            stroke={ivory}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <ellipse
            cx="0"
            cy="-74"
            rx="58"
            ry="9"
            stroke={ivory}
            strokeWidth="9"
            fill="none"
          />
          <path
            d="M-22 78 L22 78"
            stroke={ivory}
            strokeWidth="13"
            strokeLinecap="round"
          />
        </g>

        {/* Print */}
        <text
          x="96"
          y="212"
          fill={ivory}
          fontFamily="var(--font-sans)"
          fontSize="34"
          letterSpacing="-1"
          fontWeight="600"
        >
          MATOCHA
        </text>
        <text
          x="96"
          y="240"
          fill={ivory}
          fontFamily="var(--font-sans)"
          fontSize="12"
          letterSpacing="4.2"
          opacity="0.7"
        >
          MATCHA
        </text>

        <text
          x="96"
          y="482"
          fill={ivory}
          fontFamily="var(--font-sans)"
          fontSize="18"
          letterSpacing="2.4"
          fontWeight="600"
        >
          {brand.sticksPerBox} × {brand.servingWeight}
          {brand.servingUnit.toUpperCase()}
        </text>
        <text
          x="96"
          y="504"
          fill={ivory}
          fontFamily="var(--font-sans)"
          fontSize="10.5"
          letterSpacing="2"
          opacity="0.6"
        >
          100% JAPANESE MATCHA
        </text>
        <text
          x="356"
          y="504"
          textAnchor="end"
          fill={ivory}
          fontFamily="var(--font-sans)"
          fontSize="10.5"
          letterSpacing="2"
          opacity="0.6"
        >
          NET {brand.netWeight}G
        </text>
      </g>
    </svg>
  );
}
