"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "./useSceneClock";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

const INK = "#16241B";
const LAIT = "#F4F2E6";
const FORET = "#1B3B2A";
const DRINK = "#A9C46A";

/** The same stick, travelling from scene to scene. */
function MiniStick({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect width="22" height="92" rx="3" fill={LAIT} stroke={INK} strokeWidth="2" />
      <rect width="22" height="12" rx="3" fill={FORET} />
      <rect y="72" width="22" height="20" fill="var(--matcha)" />
      <text x="11" y="64" transform="rotate(-90 11 64)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-sans)" fill={FORET}>
        MATOCHA
      </text>
    </g>
  );
}

function Glass({ x, y, ice = false, h = 110 }: { x: number; y: number; ice?: boolean; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M4 ${h * 0.22} L10 ${h - 4} L62 ${h - 4} L68 ${h * 0.22} Z`} fill={DRINK} />
      <path d={`M4 ${h * 0.22} C10 ${h * 0.19} 62 ${h * 0.25} 68 ${h * 0.22}`} stroke={LAIT} strokeWidth="4" fill="none" />
      {ice && (
        <g fill="#fff" fillOpacity="0.7" stroke={INK} strokeWidth="1.5">
          <rect x="14" y={h * 0.24} width="18" height="16" rx="4" />
          <rect x="36" y={h * 0.3} width="18" height="16" rx="4" />
        </g>
      )}
      <path d={`M0 0 L8 ${h} L64 ${h} L72 0`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    </g>
  );
}

function Shaker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="22" width="58" height="108" rx="10" fill="#fff" fillOpacity="0.55" stroke={INK} strokeWidth="3" />
      <rect x="4" y="60" width="50" height="66" rx="6" fill={DRINK} />
      <rect x="-2" y="0" width="62" height="26" rx="6" fill={FORET} stroke={INK} strokeWidth="3" />
    </g>
  );
}

const ART: Record<number, React.ReactNode> = {
  /* 7 h — kitchen: window light, glass, frother, stick on the counter. */
  0: (
    <>
      <rect x="40" y="20" width="120" height="110" fill="#fff" opacity="0.55" />
      <line x1="100" y1="20" x2="100" y2="130" stroke={INK} strokeWidth="2" opacity="0.3" />
      <line x1="0" y1="210" x2="320" y2="210" stroke={INK} strokeWidth="2" opacity="0.4" />
      <Glass x={120} y={100} ice />
      <g transform="translate(206 70) rotate(12)">
        <rect x="-6" y="0" width="12" height="60" rx="5" fill={FORET} />
        <rect x="-1" y="60" width="2" height="66" fill={INK} />
        <circle cx="0" cy="128" r="6" fill="none" stroke={INK} strokeWidth="2" />
      </g>
      <MiniStick x={112} y={176} rot={78} />
    </>
  ),
  /* 10 h — desk: laptop edge, mug, whisk. */
  1: (
    <>
      <path d="M10 150 L150 150 L170 196 L-10 196 Z" fill="#cfd2c6" stroke={INK} strokeWidth="2.5" />
      <line x1="0" y1="210" x2="320" y2="210" stroke={INK} strokeWidth="2" opacity="0.4" />
      <g transform="translate(190 120)">
        <path d="M0 0 L6 88 L58 88 L64 0 Z" fill={LAIT} stroke={INK} strokeWidth="3" />
        <path d="M64 20 C88 20 88 60 62 60" fill="none" stroke={INK} strokeWidth="3" />
        <ellipse cx="32" cy="4" rx="28" ry="5" fill={DRINK} />
      </g>
      <MiniStick x={262} y={112} rot={8} />
    </>
  ),
  /* 13 h — campus: pencil case, stick, shaker. */
  2: (
    <>
      <line x1="0" y1="210" x2="320" y2="210" stroke={INK} strokeWidth="2" opacity="0.4" />
      <rect x="20" y="150" width="150" height="54" rx="20" fill="#d8c9a3" stroke={INK} strokeWidth="2.5" />
      <path d="M30 152 L160 152" stroke={INK} strokeWidth="2" strokeDasharray="5 4" />
      <MiniStick x={70} y={96} rot={-18} />
      <Shaker x={210} y={76} />
    </>
  ),
  /* 18 h — sport: gym bag, shaker, ice. */
  3: (
    <>
      <line x1="0" y1="210" x2="320" y2="210" stroke={INK} strokeWidth="2" opacity="0.4" />
      <path d="M10 200 C10 140 40 120 120 120 C200 120 210 140 210 200 Z" fill={FORET} stroke={INK} strokeWidth="2.5" />
      <path d="M70 122 C70 80 150 80 150 122" fill="none" stroke={INK} strokeWidth="5" />
      <MiniStick x={120} y={110} rot={20} />
      <Shaker x={236} y={76} />
    </>
  ),
  /* Saturday — terrace: iced glass, sun, a sip. */
  4: (
    <>
      <circle cx="250" cy="50" r="26" fill="#f2d98b" />
      <line x1="0" y1="210" x2="320" y2="210" stroke={INK} strokeWidth="2" opacity="0.4" />
      <Glass x={130} y={92} ice h={118} />
      <path d="M186 92 L214 30" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <MiniStick x={122} y={186} rot={82} />
    </>
  ),
};

/**
 * M06 — UNE JOURNÉE AVEC MATOCHA.
 * Desktop: the vertical scroll drives a short horizontal pass (no capture: the
 * pin is ~180vh and always passable). Mobile: native swipe. Reduced motion: a
 * static grid. Every scene is illustration (concept) until the shoot exists.
 */
export function DayScene({ header }: { header?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [shift, setShift] = useState(0);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = () => setDesktop(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const pinned = desktop && !reduced;

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrap.current;
      const tr = track.current;
      if (!el || !tr) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setShift(p * Math.max(0, tr.scrollWidth - tr.clientWidth));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pinned]);

  const cards = fr.day.scenes.map((scene, i) => (
    <li
      key={scene.time}
      className={cn(
        "shrink-0 snap-start",
        reduced ? "w-full" : "w-[82%] sm:w-[46%] lg:w-[30vw] lg:max-w-[420px]",
      )}
    >
      <figure className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(170deg,#fbfaf2,var(--lait-profond))]">
        <svg viewBox="0 0 320 230" className="h-full w-full" aria-hidden="true">
          {ART[i]}
        </svg>
        <span className="absolute top-2 left-2 concept-tag">{fr.status.concept}</span>
      </figure>
      <p className="mt-3 flex items-baseline gap-3">
        <span className="font-serif text-3xl">{scene.time}</span>
        <span className="font-semibold">{scene.place}</span>
      </p>
      <p className="mt-1">{scene.text}</p>
      <Link href={scene.recipe} className="mt-2 inline-block text-sm font-semibold underline decoration-matcha decoration-2 underline-offset-4">
        La recette
      </Link>
    </li>
  ));

  if (reduced) {
    return (
      <>
        {header}
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{cards}</ol>
      </>
    );
  }

  return (
    <div ref={wrap} className={cn(pinned && "h-[120vh]")}>
      <div className={cn(pinned && "sticky top-[72px] flex h-[calc(100vh-72px)] flex-col justify-center overflow-hidden")}>
        {header}
        <ol
          ref={track}
          aria-label="Cinq moments de la journée"
          className={cn(
            "mt-8 flex gap-6",
            pinned ? "w-full" : "no-scrollbar -mx-4 snap-x snap-mandatory overflow-x-auto px-4",
          )}
          style={pinned ? { transform: `translateX(${-shift}px)` } : undefined}
        >
          {cards}
        </ol>
      </div>
    </div>
  );
}
