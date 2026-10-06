"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useSceneClock";

/*
 * LE FILET — the one bold element.
 *
 * A matcha ribbon that leaves the pack in the hero, undulates between the
 * blocks and ends in the last glass. It is a brand motif, never a product
 * demonstration. The path runs through anchor elements carrying
 * `data-filet` (in document order); its colour is `--accent`, which the
 * flavour selector changes.
 *
 * Performance: the ribbon is cut into one small SVG per segment instead of a
 * single page-tall layer. Drawing on scroll only repaints the segment being
 * drawn, so the browser keeps rasterising freshly revealed content on fast
 * scroll jumps.
 *
 * Reduced motion: fully drawn, static. Below 768 px it is not rendered: a
 * 16 px gutter cannot hold it without running over the text.
 */

type Pt = { x: number; y: number };
type Segment = { d: string; left: number; top: number; width: number; height: number; y0: number; y1: number };

const STROKE = 12;
const MIN_WIDTH = 768;

/*
 * Anchors come in pairs per block, on the same side (top and bottom of a
 * gutter), so the ribbon runs quietly beside the content and only crosses
 * the page in the gap between two blocks — an S-wave between sections.
 */
function buildSegments(points: Pt[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dy = b.y - a.y;
    const sameSide = Math.abs(b.x - a.x) < 40;
    let c1: Pt;
    let c2: Pt;
    if (sameSide) {
      const w = (i % 2 === 0 ? 16 : -16) * Math.min(3, dy / 300);
      c1 = { x: a.x + w, y: a.y + dy * 0.35 };
      c2 = { x: b.x - w, y: b.y - dy * 0.35 };
    } else {
      /* Leave and arrive vertically: a smooth S across the gap. */
      const k = Math.max(dy * 0.9, 160);
      c1 = { x: a.x, y: a.y + k };
      c2 = { x: b.x, y: b.y - k };
    }
    /* A cubic stays inside the hull of its control points. */
    const xs = [a.x, b.x, c1.x, c2.x];
    const ys = [a.y, b.y, c1.y, c2.y];
    const left = Math.floor(Math.min(...xs) - STROKE);
    const top = Math.floor(Math.min(...ys) - STROKE);
    const width = Math.ceil(Math.max(...xs) + STROKE) - left;
    const height = Math.ceil(Math.max(...ys) + STROKE) - top;
    const f = (p: Pt) => `${(p.x - left).toFixed(1)} ${(p.y - top).toFixed(1)}`;
    segments.push({ d: `M${f(a)} C${f(c1)} ${f(c2)} ${f(b)}`, left, top, width, height, y0: a.y, y1: b.y });
  }
  return segments;
}

export function Filet() {
  const host = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const reduced = useReducedMotion();

  /* Measure anchors; rebuild on resize. */
  useEffect(() => {
    const el = host.current?.parentElement;
    if (!el) return;
    const measure = () => {
      if (window.innerWidth < MIN_WIDTH) {
        setSegments([]);
        return;
      }
      const base = el.getBoundingClientRect();
      const pts = Array.from(el.querySelectorAll<HTMLElement>("[data-filet]"))
        .filter((a) => a.offsetParent !== null)
        .map((a) => {
          const r = a.getBoundingClientRect();
          return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
        });
      setSegments(buildSegments(pts));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Draw on scroll, segment by segment, writing straight to the DOM. */
  useEffect(() => {
    const el = host.current?.parentElement;
    if (!el || segments.length === 0) return;
    const lengths = paths.current.map((p) => p?.getTotalLength() ?? 0);
    const drawn = lengths.map(() => -1);
    paths.current.forEach((p, i) => {
      if (!p) return;
      p.style.strokeDasharray = `${lengths[i]}`;
      p.style.strokeDashoffset = reduced ? "0" : `${lengths[i]}`;
    });
    if (reduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      /* The ribbon's head follows a point slightly below the viewport centre. */
      const head = window.innerHeight * 0.62 - el.getBoundingClientRect().top;
      segments.forEach((s, i) => {
        const p = paths.current[i];
        if (!p) return;
        const k = Math.min(1, Math.max(0, (head - s.y0) / Math.max(1, s.y1 - s.y0)));
        /* Only touch a segment whose drawn length actually changed. */
        const q = Math.round(k * 200) / 200;
        if (q === drawn[i]) return;
        drawn[i] = q;
        p.style.strokeDashoffset = `${lengths[i] * (1 - q)}`;
      });
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
  }, [segments, reduced]);

  return (
    <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block">
      {segments.map((s, i) => (
        <svg
          key={`${i}-${s.top}-${s.left}`}
          width={s.width}
          height={s.height}
          className="absolute overflow-visible"
          style={{ left: s.left, top: s.top }}
        >
          <path
            ref={(node) => {
              paths.current[i] = node;
            }}
            d={s.d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            style={{ transition: "stroke 600ms ease" }}
          />
        </svg>
      ))}
    </div>
  );
}

/** Invisible anchor the ribbon passes through. */
export function FiletAnchor({ className }: { className?: string }) {
  return <span data-filet aria-hidden="true" className={`pointer-events-none absolute h-px w-px ${className ?? ""}`} />;
}
