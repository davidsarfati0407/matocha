/** Tiny class-name joiner — no runtime dependency needed. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a computed SVG coordinate. Node and the browser can disagree on the
 * last digit of Math.sin/Math.cos, which is enough to fail hydration.
 */
export function svgRound(value: number) {
  return Math.round(value * 1000) / 1000;
}
