"use client";

import { useCart } from "@/lib/cart";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

/**
 * M11 — the cart icon is a small box that fills with doses. It counts doses,
 * not items. On each add a stick drops into it.
 */
export function CartButton() {
  const { doses, open, pulse } = useCart();

  const fill = Math.min(1, doses / 30);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={fr.nav.cart(doses)}
      className="relative flex h-11 items-center gap-2 px-2 text-sm font-semibold"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        {/* Re-keyed on each add, so the CSS drop animation replays. */}
        <g key={pulse} className={cn(pulse > 0 && "cart-drop")} opacity="0">
          <rect x="13" y="0" width="6" height="14" rx="1.5" fill="var(--matcha)" stroke="var(--encre)" strokeWidth="1.2" />
        </g>
        <rect x="4" y="11" width="24" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y={r(27 - 14 * fill)} width="20" height={r(14 * fill)} fill="var(--matcha)" />
      </svg>
      <span className="tabular-nums">{doses}</span>
    </button>
  );
}

function r(v: number) {
  return Math.round(v * 100) / 100;
}
