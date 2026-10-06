"use client";

import { useEffect, type RefObject } from "react";

/**
 * Writes `--py` on every `[data-depth]` element inside `root`, proportional to
 * how far `root` has scrolled through the viewport. One passive listener,
 * one rAF per frame, only while `root` is on screen. Off in reduced motion.
 */
export function useParallax(
  root: RefObject<HTMLElement | null>,
  strength = 1,
  /** "top": 0 at the top of the page, then follows the scroll (hero — no jolt on load).
      "center": 0 when the block is centred in the viewport (mid-page blocks). */
  origin: "top" | "center" = "center",
) {
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0;
    let visible = true;
    const update = () => {
      raf = 0;
      if (!visible) return;
      const r = el.getBoundingClientRect();
      const k =
        origin === "top"
          ? Math.min(1.5, window.scrollY / window.innerHeight)
          : /* 0 when the block is centred, ±1 at the edges of its travel. */
            (window.innerHeight / 2 - (r.top + r.height / 2)) / (window.innerHeight / 2 + r.height / 2);
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth) || 0;
        layer.style.setProperty("--py", `${(k * depth * strength).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root, strength, origin]);
}
