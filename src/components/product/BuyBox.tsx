"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AddToCartButton } from "./AddToCartButton";
import { StickyAddToCart } from "./StickyAddToCart";
import { StickyPurchaseBar } from "./StickyPurchaseBar";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { EditorialLabel } from "@/components/ui/Section";
import { brand, servingPrice } from "@/data/brand";
import {
  dailyBox,
  subscription,
  subscriptionPrice,
  type Product,
} from "@/data/product";
import { site } from "@/data/site";
import { useCart, type PurchaseMode } from "@/lib/cart";
import { EASE } from "@/lib/motion";
import { cn, formatPrice } from "@/lib/utils";

export function BuyBox({ product = dailyBox }: { product?: Product }) {
  const [mode, setMode] = useState<PurchaseMode>("one-time");
  const [quantity, setQuantity] = useState(1);
  const { add } = useCart();

  const unit = mode === "subscription" ? subscriptionPrice : product.price;
  const total = unit * quantity;

  const options: {
    id: PurchaseMode;
    title: string;
    detail: string;
    price: number;
    badge?: string;
  }[] = [
    {
      id: "one-time",
      title: "One-time purchase",
      detail: `${product.sticks} sticks — ${product.totalGrams}g`,
      price: product.price,
    },
    {
      id: "subscription",
      title: "Monthly subscription",
      detail: subscription.cadence,
      price: subscriptionPrice,
      badge: `Save ${Math.round(product.subscriptionDiscount * 100)}%`,
    },
  ];

  return (
    <div>
      <EditorialLabel index="01">Daily Box</EditorialLabel>
      <h1 className="text-h2 u-caps mt-5">{product.name}</h1>
      <p className="u-serif-it mt-3 text-xl opacity-70">{product.kicker}</p>

      <div className="mt-6 flex flex-wrap items-baseline gap-4">
        <span className="text-h3 tabular-nums">{formatPrice(unit)}</span>
        {mode === "subscription" && (
          <span className="text-base line-through opacity-45">
            {formatPrice(product.price)}
          </span>
        )}
        <span className="u-label opacity-50">
          {formatPrice(servingPrice)} / morning
        </span>
      </div>

      {/* Purchase options */}
      <fieldset className="mt-9">
        <legend className="u-label opacity-55">Purchase options</legend>
        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const selected = mode === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-4 border p-4 transition-colors duration-400 sm:p-5",
                  selected
                    ? "border-black/60 bg-white/40"
                    : "border-black/18 hover:border-black/35",
                )}
              >
                <input
                  type="radio"
                  name="purchase-mode"
                  value={option.id}
                  checked={selected}
                  onChange={() => setMode(option.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                    selected ? "border-green" : "border-black/35",
                  )}
                >
                  <motion.span
                    className="block h-2 w-2 rounded-full bg-green"
                    initial={false}
                    animate={{ scale: selected ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                </span>

                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{option.title}</span>
                    {option.badge && (
                      <span className="u-label bg-coral px-2 py-1 text-black">
                        {option.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm opacity-60">
                    {option.detail}
                  </span>
                </span>

                <span className="shrink-0 tabular-nums">
                  {formatPrice(option.price)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Quantity + add to cart */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantitySelector value={quantity} onChange={setQuantity} />
        <AddToCartButton
          full={false}
          className="w-full sm:min-w-[14rem] sm:flex-1"
          onAdd={() => add(product, mode, quantity)}
        >
          {mode === "subscription" ? subscription.cta : "Add to cart"} —{" "}
          {formatPrice(total)}
        </AddToCartButton>
      </div>

      {/* Highlights — the three reasons, before the fine print */}
      <ul className="mt-8 grid grid-cols-3 border-y border-black/15">
        {[
          [`${brand.servingWeight}${brand.servingUnit}`, "Per stick"],
          [`${brand.sticksPerBox}`, "Servings"],
          ["0", "Additives"],
        ].map(([value, label]) => (
          <li key={label} className="border-r border-black/12 py-4 last:border-r-0">
            <p className="text-h3 u-caps">{value}</p>
            <p className="u-label mt-1.5 opacity-50">{label}</p>
          </li>
        ))}
      </ul>

      <ul className="mt-6 space-y-2 text-sm opacity-65">
        <li>
          {site.shipping.origin}. {site.shipping.delivery}.
        </li>
        {brand.freeShippingThreshold !== null && (
          <li>Free shipping over {formatPrice(brand.freeShippingThreshold)}.</li>
        )}
        <li>{product.ingredients}</li>
      </ul>

      {mode === "subscription" && !subscription.billingEnabled && (
        <p className="mt-4 max-w-[46ch] text-xs leading-relaxed opacity-55">
          Recurring billing opens with the first production run. Nothing is
          charged until we confirm your first delivery.
        </p>
      )}

      <StickyAddToCart
        product={product}
        mode={mode}
        quantity={quantity}
        total={total}
      />
      <StickyPurchaseBar
        product={product}
        mode={mode}
        quantity={quantity}
        total={total}
      />
    </div>
  );
}
