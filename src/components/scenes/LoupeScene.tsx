"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  value: string;
  confirmed: boolean;
  target?: string;
};

/**
 * M07 — SOUS LA LOUPE. A macro of the open stick; each point of interest is a
 * real button. The same content is also listed as plain text by the caller,
 * so nothing lives only behind a hover.
 */
export function LoupeScene({ hotspots }: { hotspots: Hotspot[] }) {
  const [active, setActive] = useState<string | null>(null);
  const current = hotspots.find((h) => h.id === active);

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(60%_60%_at_50%_45%,#fbfaf2,var(--lait-profond))]">
        <svg viewBox="0 40 500 330" className="h-full w-full" aria-hidden="true">
          {/* Open stick, lying down, powder spilling at its mouth */}
          <g transform="rotate(-14 250 200)">
            <rect x="60" y="150" width="330" height="96" rx="8" fill="#F4F2E6" stroke="#16241B" strokeWidth="3" />
            <rect x="340" y="150" width="50" height="96" fill="#1B3B2A" />
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={i} x1={346 + i * 5} y1="152" x2={346 + i * 5} y2="244" stroke="#2A5039" strokeWidth="1.5" />
            ))}
            <path d="M60 150 L52 166 L60 182 L50 198 L60 214 L52 230 L60 246" fill="none" stroke="#16241B" strokeWidth="3" />
            <text x="120" y="212" fontFamily="var(--font-sans)" fontWeight="700" fontSize="44" fill="#1B3B2A" letterSpacing="-1">
              MATOCHA
            </text>
            <path d="M80 238 C130 222 170 250 220 236 C270 222 300 248 336 238" fill="none" stroke="var(--matcha)" strokeWidth="7" strokeLinecap="round" />
          </g>
          <path d="M30 330 C40 290 80 270 120 300 C150 322 120 350 70 350 C44 350 28 344 30 330 Z" fill="#6E9A2E" />
          {[48, 66, 92, 110, 136, 154].map((x, i) => (
            <circle key={x} cx={x} cy={290 - (i % 3) * 14} r={2 + (i % 2)} fill="#6E9A2E" />
          ))}
        </svg>

        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setActive(active === h.id ? null : h.id)}
            aria-expanded={active === h.id}
            aria-controls="loupe-fiche"
            className={cn(
              "absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-lait text-sm font-bold shadow-sm transition-colors",
              active === h.id ? "bg-foret text-lait" : "bg-matcha text-encre hover:bg-mousse",
            )}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            <span className="sr-only">{h.label}</span>
            <span aria-hidden="true">+</span>
          </button>
        ))}
        <span className="absolute top-2 left-2 concept-tag">Visuel de concept</span>
      </div>

      <div id="loupe-fiche" aria-live="polite" className="min-h-24 border-x border-b border-encre/15 bg-lait p-4">
        {current ? (
          <>
            <p className="font-semibold">{current.label}</p>
            <p className={cn("mt-1", !current.confirmed && "pending")}>{current.value}</p>
            {current.target && <p className="mt-1 text-sm">Objectif : {current.target}</p>}
          </>
        ) : (
          <p className="text-sm">Touchez un point pour ouvrir sa fiche.</p>
        )}
      </div>
    </div>
  );
}
