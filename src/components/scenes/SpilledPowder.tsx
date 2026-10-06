"use client";

import { useEffect, useRef, useState } from "react";
import { seeded } from "@/lib/anim";
import { useReducedMotion } from "./useSceneClock";

/** M14 — a tipped stick and a small heap of powder you can sweep with the pointer. */
export function SpilledPowder() {
  const reduced = useReducedMotion();
  const rand = seeded(11);
  const initial = Array.from({ length: 90 }, () => {
    const a = rand() * Math.PI;
    const d = Math.sqrt(rand()) * 70;
    return { x: 250 + Math.cos(a) * d * 1.6, y: 230 - Math.sin(a) * d * 0.45, r: 1.5 + rand() * 2.5 };
  });
  const [grains, setGrains] = useState(initial);
  const svg = useRef<SVGSVGElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => () => void (last.current = null), []);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (reduced || !svg.current) return;
    const rect = svg.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    const prev = last.current ?? { x, y };
    last.current = { x, y };
    const vx = x - prev.x;
    setGrains((gs) =>
      gs.map((g) => {
        const dx = g.x - x;
        const dy = g.y - y;
        return dx * dx + dy * dy < 900 ? { ...g, x: g.x + vx * 0.8 + Math.sign(dx) * 4, y: Math.min(244, g.y + (dy > 0 ? 1 : -1)) } : g;
      }),
    );
  };

  return (
    <svg ref={svg} viewBox="0 0 500 300" className="w-full touch-none" onPointerMove={onMove} aria-hidden="true">
      <line x1="0" y1="246" x2="500" y2="246" stroke="#16241B" strokeWidth="2" opacity="0.4" />
      <g transform="translate(330 160) rotate(74)">
        <rect width="34" height="140" rx="4" fill="#F4F2E6" stroke="#16241B" strokeWidth="3" />
        <rect y="122" width="34" height="18" fill="#1B3B2A" />
        <rect y="0" width="34" height="24" fill="var(--matcha)" />
        <text x="17" y="110" transform="rotate(-90 17 110)" fontSize="13" fontWeight="700" fill="#1B3B2A" fontFamily="var(--font-sans)">
          MATOCHA
        </text>
      </g>
      <g fill="#6E9A2E">
        {grains.map((g, i) => (
          <circle key={i} cx={Math.round(g.x * 10) / 10} cy={Math.round(g.y * 10) / 10} r={g.r} />
        ))}
      </g>
    </svg>
  );
}
