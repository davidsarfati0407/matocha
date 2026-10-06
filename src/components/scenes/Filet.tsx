"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useSceneClock";

/*
 * LE FILET — the one bold element.
 *
 * A matcha ribbon that leaves the pack in the hero, undulates between the
 * blocks and ends in the last glass. It is a brand motif, never a product
 * demonstration. The path is built from anchor elements carrying
 * `data-filet` (in document order) and drawn as you scroll. Its colour is
 * `--accent`, which the flavour selector changes.
 *
 * Reduced motion: fully drawn, static. Mobile: one gentle undulation per gap.
 */

type Pt = { x: number; y: number };

/*
 * Anchors come in pairs per block, on the same side (top and bottom of a
 * gutter), so the ribbon runs quietly beside the content and only crosses
 * the page in the gap between two blocks — an S-wave between sections.
 */
function buildPath(points: Pt[], mobile: boolean) {
  if (points.length < 2) return "";
  const wiggle = mobile ? 6 : 16;
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dy = b.y - a.y;
    const sameSide = Math.abs(b.x - a.x) < 40;
    if (sameSide) {
      const w = (i % 2 === 0 ? wiggle : -wiggle) * (mobile ? 1 : Math.min(3, dy / 300));
      d += ` C${(a.x + w).toFixed(1)} ${(a.y + dy * 0.35).toFixed(1)} ${(b.x - w).toFixed(1)} ${(b.y - dy * 0.35).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    } else {
      /* Leave and arrive vertically: a smooth S across the gap. */
      const k = Math.max(dy * 0.9, mobile ? 90 : 160);
      d += ` C${a.x.toFixed(1)} ${(a.y + k).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - k).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
  }
  return d;
}

export function Filet() {
  const host = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const [geo, setGeo] = useState({ d: "", w: 0, h: 0, mobile: false });
  const reduced = useReducedMotion();

  /* Measure anchors. */
  useEffect(() => {
    const el = host.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const mobile = window.innerWidth < 768;
      const pts = Array.from(el.querySelectorAll<HTMLElement>("[data-filet]"))
        .filter((a) => a.offsetParent !== null)
        .map((a) => {
          const r = a.getBoundingClientRect();
          return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
        });
      setGeo({ d: buildPath(pts, mobile), w: base.width, h: base.height, mobile });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Draw on scroll. Written straight to the DOM — no re-render per frame. */
  useEffect(() => {
    const p = path.current;
    const el = host.current?.parentElement;
    if (!p || !el || !geo.d) return;
    const length = p.getTotalLength();
    p.style.strokeDasharray = `${length}`;
    if (reduced) {
      p.style.strokeDashoffset = "0";
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      /* The ribbon's head follows a point slightly below the viewport centre. */
      const head = window.innerHeight * 0.62 - rect.top;
      const k = Math.min(1, Math.max(0, head / rect.height));
      p.style.strokeDashoffset = `${length * (1 - k * 1.04)}`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [geo, reduced]);

  return (
    <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {geo.d && (
        <svg width={geo.w} height={geo.h} className="absolute top-0 left-0">
          <path
            ref={path}
            d={geo.d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={geo.mobile ? 7 : 12}
            strokeLinecap="round"
            style={{ transition: "stroke 600ms ease" }}
          />
        </svg>
      )}
    </div>
  );
}

/** Invisible anchor the ribbon passes through. */
export function FiletAnchor({ className }: { className?: string }) {
  return <span data-filet aria-hidden="true" className={`pointer-events-none absolute h-px w-px ${className ?? ""}`} />;
}
