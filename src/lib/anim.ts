/** Small, dependency-free helpers for the illustrated scenes. */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Progress of `t` inside [a, b], clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const smooth = (x: number) => x * x * (3 - 2 * x);

export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Round for SVG output — avoids hydration mismatches on trig values. */
export const r = (v: number) => Math.round(v * 100) / 100;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear interpolation between two hex colours. */
export function mixColor(a: string, b: string, x: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = clamp01(x);
  const c = (p: number, q: number) =>
    Math.round(lerp(p, q, k)).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

/** Deterministic pseudo-random sequence, identical on server and client. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
