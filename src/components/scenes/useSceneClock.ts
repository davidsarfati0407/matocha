"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Server and first paint assume reduced motion is OFF only after hydration. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Looping clock for a scene. Starts at `start` (the poster frame rendered by
 * the server), runs only while visible, playing, and motion is allowed.
 * Updates at ~30 fps — plenty for flat illustration, and cheap.
 */
export function useSceneClock({
  durationMs,
  start = 0,
  playing,
}: {
  durationMs: number;
  start?: number;
  playing: boolean;
}) {
  const [t, setT] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const run = playing && visible && !reduced;
  const tRef = useRef(start);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      tRef.current = (tRef.current + dt / durationMs) % 1;
      acc += dt;
      if (acc >= 33) {
        acc = 0;
        setT(tRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, durationMs]);

  const reset = (value: number) => {
    tRef.current = value;
    setT(value);
  };

  return { t, ref, reduced, running: run, reset };
}
