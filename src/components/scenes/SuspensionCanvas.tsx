"use client";

import { useEffect, useRef, useState } from "react";
import { fr } from "@/content/i18n/fr";
import { seeded } from "@/lib/anim";
import { useReducedMotion } from "./useSceneClock";

/**
 * M07 — SUSPENSION, PAS DISSOLUTION.
 * Particles in a glass of milk. Left alone they sink and settle; stirred with
 * a finger or the mouse they spread through the liquid. That is honestly why
 * matcha powder needs a whisk, a frother or a shaker.
 */
export function SuspensionCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"still" | "stirring">("still");
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = canvas.current;
    if (!el || reduced) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = 320;
    const H = 360;
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.scale(dpr, dpr);

    const rand = seeded(42);
    const parts = Array.from({ length: 220 }, () => ({
      x: 70 + rand() * 180,
      y: H - 40 - rand() * 30,
      vx: 0,
      vy: 0,
      r: 1.2 + rand() * 1.8,
    }));
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, last: 0 };
    let raf = 0;
    let visible = true;
    let stirring = false;

    const toLocal = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      pointer.vx = p.x - pointer.x;
      pointer.vy = p.y - pointer.y;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
      pointer.last = performance.now();
    };
    const onLeave = () => (pointer.active = false);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    /* Inside of the glass: a trapezoid. */
    const left = (y: number) => 52 + (y / H) * 18;
    const right = (y: number) => W - 52 - (y / H) * 18;
    const top = 70;
    const bottom = H - 22;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const now = performance.now();
      const live = pointer.active && now - pointer.last < 120;
      if (live !== stirring) {
        stirring = live;
        setState(live ? "stirring" : "still");
      }

      ctx.clearRect(0, 0, W, H);
      /* Milk */
      let spread = 0;
      for (const p of parts) spread += bottom - p.y;
      const tint = Math.min(1, spread / parts.length / 140);
      ctx.fillStyle = `rgb(${Math.round(245 - 76 * tint)}, ${Math.round(242 - 46 * tint)}, ${Math.round(230 - 124 * tint)})`;
      ctx.beginPath();
      ctx.moveTo(left(top), top);
      ctx.lineTo(right(top), top);
      ctx.lineTo(right(bottom), bottom);
      ctx.lineTo(left(bottom), bottom);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#6E9A2E";
      for (const p of parts) {
        if (live) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 4200) {
            const k = 1 - d2 / 4200;
            p.vx += pointer.vx * 0.09 * k + (dy / 60) * k * 1.4;
            p.vy += pointer.vy * 0.09 * k - (dx / 60) * k * 1.4 - 0.4 * k;
          }
        }
        p.vy += 0.035; /* gravity: it sinks */
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > bottom - p.r) {
          p.y = bottom - p.r;
          p.vy *= -0.2;
        }
        if (p.y < top + 4) {
          p.y = top + 4;
          p.vy = Math.abs(p.vy);
        }
        const l = left(p.y) + p.r;
        const rr = right(p.y) - p.r;
        if (p.x < l) {
          p.x = l;
          p.vx = Math.abs(p.vx);
        }
        if (p.x > rr) {
          p.x = rr;
          p.vx = -Math.abs(p.vx);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Glass outline */
      ctx.strokeStyle = "#16241B";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(46, 40);
      ctx.lineTo(left(bottom) - 4, bottom + 6);
      ctx.lineTo(right(bottom) + 4, bottom + 6);
      ctx.lineTo(W - 46, 40);
      ctx.stroke();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          { label: "Au repos : la poudre retombe au fond.", settled: true },
          { label: "Fouettée : elle se répartit dans le lait.", settled: false },
        ].map((s) => (
          <figure key={s.label}>
            <svg viewBox="0 0 160 180" className="w-full" aria-hidden="true">
              <path d="M26 20 L38 168 L122 168 L134 20" fill={s.settled ? "#F5F2E6" : "#A9C46A"} stroke="#16241B" strokeWidth="3" />
              {s.settled && <rect x="38" y="152" width="84" height="14" fill="#6E9A2E" />}
            </svg>
            <figcaption>{s.label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <figure>
      <canvas
        ref={canvas}
        className="aspect-[8/9] w-full max-w-[360px] cursor-grab touch-none"
        role="img"
        aria-label="Verre de lait avec des particules de matcha. Sans mouvement, elles retombent ; en remuant, elles se répartissent."
      />
      <figcaption className="mt-2 text-sm" aria-live="polite">
        {state === "stirring" ? "Vous remuez : la poudre se répartit." : `${fr.inside.suspensionStill} ${fr.inside.suspensionHint}`}
      </figcaption>
    </figure>
  );
}
