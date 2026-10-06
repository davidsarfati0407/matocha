"use client";

import { useCart } from "@/lib/cart";
import { fr } from "@/content/i18n/fr";

/** Cart button (sale mode only): counts doses, not items. */
export function CartButton() {
  const { doses, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={fr.nav.cart(doses)}
      className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold"
    >
      Panier <span className="tabular-nums">({doses})</span>
    </button>
  );
}
