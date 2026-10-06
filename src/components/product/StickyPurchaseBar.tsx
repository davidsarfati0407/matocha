"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AddToCartButton } from "./AddToCartButton";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Container } from "@/components/ui/Section";
import { brand } from "@/data/brand";
import type { Product } from "@/data/product";
import { useCart, type PurchaseMode } from "@/lib/cart";
import { EASE } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";

/**
 * Desktop purchase bar. It arrives once the main buy panel has scrolled past,
 * so the two never compete, and keeps the product, the price and the action
 * within reach for the rest of the page.
 */
export function StickyPurchaseBar({
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
    const onScroll = () => setVisible(window.scrollY > 880);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-matocha-motion
          initial={{ y: "-110%" }}
          animate={{ y: 0 }}
          exit={{ y: "-110%" }}
          transition={{ duration: 0.45, ease: EASE }}
          className="fixed inset-x-0 top-[74px] z-40 hidden border-b border-black/10 bg-ivory/95 backdrop-blur-md lg:block"
        >
          <Container wide>
            <div className="flex items-center justify-between gap-6 py-3">
              <div className="flex items-center gap-4">
                <span className="block h-10 w-10 shrink-0">
                  <MatochaGlass variant="classic" />
                </span>
                <div>
                  <p className="u-caps text-sm font-semibold">{product.name}</p>
                  <p className="u-label mt-1 opacity-55">
                    {brand.sticksPerBox} × {brand.servingWeight}
                    {brand.servingUnit.toUpperCase()} —{" "}
                    {mode === "subscription" ? "Subscription" : "One-time"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <p className="text-h3 tabular-nums">{formatPrice(total)}</p>
                <AddToCartButton
                  full={false}
                  className="h-12 px-7 sm:h-12 sm:px-7"
                  onAdd={() => add(product, mode, quantity)}
                >
                  Add to cart
                </AddToCartButton>
              </div>
            </div>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
