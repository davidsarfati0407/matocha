"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "./useSceneClock";

/*
 * M03 — OUVRE LA BOÎTE.
 * The box opens and the sticks rise in their real arrangement: a fan for a
 * small pack, upright rows for a daily box, two boxes for the Duo. The number
 * drawn is always exactly the pack's `doses`.
 */

const FORET = "#1B3B2A";
const LAIT = "#F4F2E6";
const INK = "#16241B";

function OneBox({
  doses,
  open,
  accent,
  name,
  x,
  w,
}: {
  doses: number;
  open: boolean;
  accent: string;
  name: string;
  x: number;
  w: number;
}) {
  const fan = doses <= 12;
  const inner = w - 24;
  const sticks = Array.from({ length: doses }, (_, i) => {
    if (fan) {
      const k = doses === 1 ? 0 : i / (doses - 1) - 0.5;
      return {
        x: x + w / 2 - 9 + k * inner * 0.7,
        rot: k * 34,
        rise: 112 - Math.abs(k) * 26,
        width: 18,
      };
    }
    const width = Math.max(4, inner / doses - 1.2);
    return { x: x + 12 + i * (inner / doses), rot: 0, rise: 86 + (i % 2) * 6, width };
  });

  return (
    <g>
      {/* Back wall */}
      <rect x={x} y="140" width={w} height="22" fill="#0F2419" />
      {/* Sticks, hidden behind the front until the box opens */}
      {sticks.map((s, i) => (
        <g
          key={i}
          style={{
            transform: open ? `translateY(-${s.rise}px) rotate(${s.rot}deg)` : "translateY(0px) rotate(0deg)",
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            transition: `transform 700ms cubic-bezier(.16,1,.3,1) ${open ? 120 + i * (fan ? 45 : 12) : 0}ms`,
          }}
        >
          <rect x={s.x} y="170" width={s.width} height="120" rx={Math.min(3, s.width / 3)} fill={LAIT} stroke={INK} strokeWidth={fan ? 1.6 : 0.8} />
          <rect x={s.x} y="170" width={s.width} height="12" fill={FORET} />
          <rect x={s.x} y="262" width={s.width} height="18" fill={accent} />
        </g>
      ))}
      {/* Front face */}
      <rect x={x} y="160" width={w} height="140" rx="3" fill={FORET} stroke={INK} strokeWidth="2" />
      <path
        d={`M${x} 214 C${x + w * 0.25} 196 ${x + w * 0.4} 236 ${x + w * 0.6} 214 C${x + w * 0.78} 196 ${x + w * 0.9} 232 ${x + w} 216`}
        fill="none"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x={x + 16} y="190" fontFamily="var(--font-sans)" fontWeight="700" fontSize="22" letterSpacing="-0.5" fill={LAIT}>
        MATOCHA
      </text>
      <rect x={x} y="262" width={w} height="38" fill={accent} />
      <text x={x + 16} y="286" fontFamily="var(--font-sans)" fontWeight="700" fontSize="12" letterSpacing="1.2" fill={INK}>
        {name.toUpperCase()}
      </text>
      {/* Lid */}
      <g
        style={{
          transform: open ? "translateY(-118px) rotate(-7deg)" : "translateY(0) rotate(0deg)",
          transformBox: "fill-box",
          transformOrigin: "0% 100%",
          opacity: open ? 0.0 : 1,
          transition: "transform 600ms cubic-bezier(.16,1,.3,1), opacity 400ms ease 200ms",
        }}
      >
        <rect x={x - 4} y="132" width={w + 8} height="40" rx="3" fill="#24503A" stroke={INK} strokeWidth="2" />
        <text x={x + w / 2} y="157" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="600" fontSize="10" letterSpacing="2" fill={LAIT}>
          OUVRIR ICI
        </text>
      </g>
    </g>
  );
}

export function BoxScene({
  doses,
  accent,
  packName,
  className,
}: {
  doses: number;
  accent: string;
  packName: string;
  className?: string;
}) {
  const [openState, setOpen] = useState(false);
  const id = useId();
  const reduced = useReducedMotion();

  /* Changing pack closes the box, then the effect replays the opening. */
  const [shownDoses, setShownDoses] = useState(doses);
  if (shownDoses !== doses) {
    setShownDoses(doses);
    setOpen(false);
  }
  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setOpen(true), 260);
    return () => window.clearTimeout(t);
  }, [doses, reduced]);

  /* Reduced motion: shown open, the button still toggles it. */
  const [reducedClosed, setReducedClosed] = useState(false);
  const open = reduced ? !reducedClosed : openState;
  const toggle = () => (reduced ? setReducedClosed((v) => !v) : setOpen((v) => !v));

  const boxes = doses > 30 ? [Math.ceil(doses / 2), Math.floor(doses / 2)] : [doses];
  const w = boxes.length === 2 ? 170 : 260;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 -20 400 330"
        className="h-auto w-full"
        role="img"
        aria-labelledby={`${id}-t`}
      >
        <title id={`${id}-t`}>{`Boîte ${packName} ${open ? "ouverte" : "fermée"} : ${doses} doses`}</title>
        <ellipse cx="200" cy="304" rx="180" ry="10" fill={INK} opacity="0.12" />
        {boxes.map((n, i) => (
          <OneBox
            key={`${i}-${n}`}
            doses={n}
            open={open}
            accent={accent}
            name={packName}
            w={w}
            x={boxes.length === 2 ? 20 + i * 190 : 70}
          />
        ))}
      </svg>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="mt-3 min-h-11 border border-encre/30 px-4 text-sm font-semibold hover:bg-mousse"
      >
        {open ? "Refermer la boîte" : "Ouvrir la boîte"}
      </button>
    </div>
  );
}
