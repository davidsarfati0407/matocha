"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/data/product";
import { useCart, type PurchaseMode } from "@/lib/cart";
import { EASE } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";

/**
 * Mobile-only purchase bar. It appears once the in-page buy button has
 * scrolled away, so the two never compete, and sits above the safe area on
 * iPhone.
 */
export function StickyAddToCart({
  product,
  mode,
  quantity,
  total,
}: {
  product: Product;
  mode: PurchaseMode;
  quantity: number;
  total: number;
}) {
  const { add } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 620);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-matocha-motion
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.45, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/12 bg-ivory/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="u-caps truncate text-xs font-semibold">
                {product.shortName}
              </p>
              <p className="text-sm tabular-nums opacity-65">
                {formatPrice(total)}
                {mode === "subscription" && " / month"}
              </p>
            </div>
            <AddToCartButton
              full={false}
              className="h-12 shrink-0 px-6 sm:h-12 sm:px-6"
              onAdd={() => add(product, mode, quantity)}
            >
              Add to cart
            </AddToCartButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
