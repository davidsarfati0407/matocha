import { site } from "@/data/site";

/** Tiny class-name joiner — no runtime dependency needed. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const priceFormatter = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
});

/**
 * Format a price stored in cents.
 *
 * Node and the browser ship different ICU versions, and fr-FR currency output
 * differs between them only by the space before the symbol (U+00A0 vs U+202F).
 * That difference alone is enough to fail hydration, so every flavour of
 * no-break space is normalised to one.
 */
export function formatPrice(cents: number) {
  return priceFormatter
    .format(cents / 100)
    .replace(/[\u00a0\u202f\u2009]/g, "\u00a0");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a computed SVG coordinate.
 *
 * Node and the browser can disagree on the final digit of Math.sin/Math.cos,
 * which is enough to fail hydration on a trig-generated path. Three decimals
 * is far more precision than any of these marks need.
 */
export function svgRound(value: number) {
  return Math.round(value * 1000) / 1000;
}
