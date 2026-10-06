"use client";

import { useRef, useState } from "react";
import { fr } from "@/content/i18n/fr";

const INK = "#16241B";

/** Traditional tools, drawn with respect: scale, sieve, bowl, chasen. */
function Traditional() {
  return (
    <g fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <rect x="12" y="214" width="84" height="24" rx="4" fill="#E6E2D2" />
      <rect x="26" y="196" width="56" height="18" rx="3" fill="#fff" />
      <text x="54" y="209" textAnchor="middle" fontSize="12" fill={INK} stroke="none" fontFamily="var(--font-sans)">
        2,0
      </text>
      <ellipse cx="80" cy="120" rx="40" ry="10" fill="#fff" />
      <path d="M40 120 L60 150 L100 150 L120 120" />
      <path d="M120 120 L160 104" />
      <path d="M100 236 C100 286 210 286 210 236 Z" fill="#2E4A36" />
      <ellipse cx="155" cy="236" rx="55" ry="10" fill="#A9C46A" />
      <g transform="translate(176 120) scale(0.85)">
        <rect x="-8" y="-60" width="16" height="70" rx="6" fill="#C9A978" />
        <path d="M-8 10 C-30 40 -26 90 0 104 C26 90 30 40 8 10 M-3 10 C-12 50 -8 90 0 104 M3 10 C12 50 8 90 0 104" />
      </g>
    </g>
  );
}

function Stick() {
  return (
    <g strokeLinejoin="round">
      <g transform="translate(262 112) rotate(-8)">
        <rect width="34" height="140" rx="4" fill="#F4F2E6" stroke={INK} strokeWidth="3" />
        <rect width="34" height="18" rx="4" fill="#1B3B2A" />
        <rect y="112" width="34" height="28" fill="var(--matcha)" />
        <text x="17" y="96" transform="rotate(-90 17 96)" fontSize="13" fontWeight="700" fill="#1B3B2A" fontFamily="var(--font-sans)">
          MATOCHA
        </text>
      </g>
      <g transform="translate(330 104)">
        <rect x="0" y="26" width="76" height="140" rx="12" fill="#fff" fillOpacity="0.55" stroke={INK} strokeWidth="3" />
        <rect x="5" y="80" width="66" height="82" rx="8" fill="#A9C46A" />
        <rect x="-3" y="0" width="82" height="32" rx="7" fill="#1B3B2A" stroke={INK} strokeWidth="3" />
      </g>
    </g>
  );
}

/**
 * M08 — LE COMPARATEUR RITUEL. A before/after slider with a real keyboard
 * handle (role="slider", arrows, Home/End).
 */
export function RitualCompare() {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);

  const fromPointer = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.round(Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100))));
  };

  return (
    <div>
      <div
        ref={box}
        className="relative aspect-[16/9] w-full touch-none overflow-hidden select-none"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientX)}
      >
        <div className="absolute inset-0 bg-lait-profond">
          <svg viewBox="0 0 440 300" className="h-full w-full" role="img" aria-label="Objets du rituel traditionnel : balance, tamis, bol, fouet en bambou.">
            <Traditional />
          </svg>
          <span className="absolute bottom-3 left-3 rounded-sm bg-lait px-2 py-1 text-sm font-semibold">{fr.ritual.traditional}</span>
        </div>
        <div className="absolute inset-0 bg-mousse" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <svg viewBox="0 0 440 300" className="h-full w-full" role="img" aria-label="Un stick Matocha et un shaker.">
            <Stick />
          </svg>
          <span className="absolute right-3 bottom-3 rounded-sm bg-lait px-2 py-1 text-sm font-semibold">{fr.ritual.matocha}</span>
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={fr.ritual.handle}
          aria-valuemin={5}
          aria-valuemax={95}
          aria-valuenow={pos}
          aria-valuetext={`${pos} % rituel traditionnel`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 5;
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos((p) => Math.max(5, p - step));
            else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos((p) => Math.min(95, p + step));
            else if (e.key === "Home") setPos(5);
            else if (e.key === "End") setPos(95);
            else return;
            e.preventDefault();
          }}
          className="absolute inset-y-0 -ml-[22px] flex w-11 cursor-ew-resize items-center justify-center"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-foret" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-foret text-lait" aria-hidden="true">
            ⇆
          </span>
        </div>
        <span className="absolute top-2 left-2 concept-tag">Visuel de concept</span>
      </div>
    </div>
  );
}
