"use client";

import { useEffect, useRef, useState } from "react";
import { FiletAnchor } from "./Filet";
import { useReducedMotion } from "./useSceneClock";

const INK = "#16241B";

/**
 * M09 — LA DERNIÈRE GORGÉE. Le Filet ends in this glass, which fills with the
 * scroll progress through the last block; a straw appears once it is full.
 * The CTA beside it never waits for the animation.
 */
export function FinalGlass() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [fill, setFill] = useState(0.15);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const k = (window.innerHeight - r.top) / (window.innerHeight * 0.9 + r.height * 0.3);
      setFill(Math.min(1, Math.max(0.12, k)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const top = 70;
  const bottom = 380;
  const shown = reduced ? 1 : fill;
  const level = bottom - (bottom - top - 20) * shown;
  const full = shown > 0.97;

  return (
    <div ref={ref} className="relative mx-auto aspect-[3/4] w-full max-w-[340px]">
      <FiletAnchor className="top-[42%] left-1/2" />
      <svg viewBox="0 0 300 400" className="relative z-10 h-full w-full" aria-hidden="true">
        <defs>
          <clipPath id="final-glass">
            <path d="M44 64 L68 380 L232 380 L256 64 Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#final-glass)">
          <rect x="0" y="0" width="300" height="400" fill="#fff" opacity="0.4" />
          <path d={`M30 ${level} C90 ${level - 8} 150 ${level + 8} 270 ${level - 2} L270 400 L30 400 Z`} fill="var(--liquid)" style={{ transition: "d 200ms linear" }} />
          <path d={`M30 ${level} C90 ${level - 8} 150 ${level + 8} 270 ${level - 2} L270 ${level + 14} L30 ${level + 14} Z`} fill="#E9EFCF" opacity="0.8" />
        </g>
        <g style={{ transition: "transform 600ms cubic-bezier(.16,1,.3,1), opacity 400ms", transform: full ? "translateY(0)" : "translateY(-40px)", opacity: full ? 1 : 0 }}>
          <path d="M176 30 L150 300" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d="M176 30 L150 300" stroke="#F4F2E6" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 12" />
        </g>
        <path d="M36 60 L62 386 L238 386 L264 60" fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        <ellipse cx="150" cy="60" rx="114" ry="12" fill="none" stroke={INK} strokeWidth="6" />
      </svg>
    </div>
  );
}
