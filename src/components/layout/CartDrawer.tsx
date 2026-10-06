"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductStick } from "@/components/brand/ProductStick";
import { Button, ButtonLink } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { dailyBox } from "@/data/product";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { EASE, softSpring } from "@/lib/motion";
import { clamp, formatPrice } from "@/lib/utils";

/**
 * Checkout is not connected to a payment provider yet. Rather than a dead
 * button, the CTA says what happens next. Local state lives here so it resets
 * whenever the drawer unmounts.
 */
function CheckoutAction() {
  const [notice, setNotice] = useState(false);

  return (
    <>
      <Button full className="mt-5" onClick={() => setNotice(true)}>
        Checkout
      </Button>

      <AnimatePresence>
        {notice && (
          <motion.p
            data-matocha-motion
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden text-center text-xs leading-relaxed opacity-70"
          >
            <span className="block pt-3">
              Checkout opens with the first production run. Join the list to be
              notified.
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}

export function CartDrawer() {
  const { isOpen, close, lines, subtotal, setQuantity, remove } = useCart();
  const count = lines.reduce((total, line) => total + line.quantity, 0);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const threshold = site.freeShippingThreshold;
  const remaining = threshold ? Math.max(0, threshold - subtotal) : 0;
  const progress = threshold ? clamp((subtotal / threshold) * 100, 0, 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
          aria-label="Cart"
        >
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          />

          <motion.aside
            data-matocha-motion
            className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col overflow-hidden bg-ivory shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={softSpring}
          >
            {/* The glass behind the panel fills as the bag does. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-[-8%] right-[-14%] w-[58%] transition-opacity duration-700"
              style={{ opacity: count > 0 ? 0.14 : 0.07 }}
            >
              <MatochaGlass variant={count > 0 ? "classic" : "empty"} />
            </div>

            <header className="relative flex items-center justify-between border-b border-black/12 px-5 py-5 sm:px-7">
              <h2 className="u-label font-semibold">Your bag ({count})</h2>
              <button
                type="button"
                onClick={close}
                className="u-label -mr-2 px-2 py-2 font-semibold opacity-60 transition-opacity hover:opacity-100"
              >
                Close
              </button>
            </header>

            {/* Free-shipping progress — threshold lives in data/brand.ts */}
            {threshold !== null && count > 0 && (
              <div className="relative border-b border-black/12 px-5 py-4 sm:px-7">
                <p className="text-sm opacity-75">
                  {remaining > 0 ? (
                    <>
                      <span className="font-medium">
                        {formatPrice(remaining)}
                      </span>{" "}
                      away from free shipping
                    </>
                  ) : (
                    "Free shipping unlocked"
                  )}
                </p>
                <div className="mt-3 h-[3px] w-full bg-black/12">
                  <motion.div
                    className="h-full bg-coral"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.7, ease: EASE }}
                  />
                </div>
              </div>
            )}

            <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-7 py-16 text-center">
                  <div className="h-32 w-32">
                    <MatochaGlass variant="empty" />
                  </div>
                  <div>
                    <p className="text-h3 u-caps mx-auto max-w-[10ch]">
                      Your glass is empty.
                    </p>
                  </div>
                  <ButtonLink href="/product" size="md" onClick={close}>
                    Shop matcha
                  </ButtonLink>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.id}
                        layout
                        data-matocha-motion
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="overflow-hidden border-b border-black/10 last:border-b-0"
                      >
                        <div className="flex gap-4 py-6">
                          <div className="flex h-28 w-20 shrink-0 items-center justify-center bg-ivory-deep">
                            <div className="h-24 py-2">
                              <ProductStick
                                tone={
                                  line.mode === "subscription"
                                    ? "ivory"
                                    : "green"
                                }
                                glass="classic"
                              />
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="u-caps text-sm font-semibold">
                                  {line.name}
                                </p>
                                <p className="mt-1 text-xs opacity-60">
                                  {line.mode === "subscription"
                                    ? `Subscription · ${dailyBox.subscriptionInterval.toLowerCase()}`
                                    : "One-time purchase"}
                                </p>
                              </div>
                              <p className="text-sm tabular-nums">
                                {formatPrice(line.unitPrice * line.quantity)}
                              </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                              <QuantitySelector
                                size="sm"
                                value={line.quantity}
                                onChange={(next) => setQuantity(line.id, next)}
                                min={1}
                              />
                              <button
                                type="button"
                                onClick={() => remove(line.id)}
                                className="u-label opacity-50 transition-opacity hover:opacity-100"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="relative border-t border-black/12 px-5 py-5 sm:px-7">
                <div className="flex items-baseline justify-between">
                  <span className="u-label opacity-60">Subtotal</span>
                  <span className="text-h3 tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs opacity-55">
                  Taxes included. {site.shipping.delivery}.
                </p>

                <CheckoutAction />
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
