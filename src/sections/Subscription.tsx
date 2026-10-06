"use client";

import { motion } from "motion/react";
import { ProductBox } from "@/components/brand/ProductBox";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { dailyBox, subscription, subscriptionPrice } from "@/data/product";
import { useCart } from "@/lib/cart";
import { EASE, viewportOnce } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";

/**
 * YOUR DAILY MATCHA. ON REPEAT.
 *
 * The rhythm is shown with the thing that actually repeats — the box, arriving
 * month after month — rather than with a field of small symbols.
 *
 * Recurring billing is not connected. The CTA adds a subscription-flagged line
 * so a real plan can be mapped to it later without touching this section.
 */
const DELIVERIES = [
  { month: "Month 01", note: "Ships at launch" },
  { month: "Month 02", note: "Same day, every month" },
  { month: "Month 03", note: "Pause or cancel anytime" },
];

export function Subscription() {
  const { add } = useCart();
  const saving = dailyBox.price - subscriptionPrice;

  return (
    <section id="subscription" className="bg-coral sec text-black">
      <Container wide>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left: the offer */}
          <div className="lg:col-span-7">
            <Reveal>
              <EditorialLabel index="12">Subscription</EditorialLabel>
            </Reveal>

            <h2 className="text-h2 u-caps mt-5 max-w-[18ch]">
              <RevealLine>Your daily matcha.</RevealLine>
              <RevealLine delay={0.08}>On repeat.</RevealLine>
            </h2>

            <Reveal delay={0.1}>
              <p className="text-lead mt-6 max-w-[34ch] opacity-80">
                {brand.sticksPerBox} sticks. {brand.sticksPerBox} servings. One
                delivery a month, and {formatPrice(saving)} off every box.
              </p>
            </Reveal>

            {/* The rhythm: the box arriving, month after month */}
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
              {DELIVERIES.map((delivery, index) => (
                <motion.div
                  key={delivery.month}
                  data-matocha-motion
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.12,
                    ease: EASE,
                  }}
                  className="relative"
                >
                  <div className="flex items-end justify-between border-b border-black/25 pb-2">
                    <span className="u-label">{delivery.month}</span>
                    <MicroMark className="text-black">0{index + 1}</MicroMark>
                  </div>

                  {/* Barely-there fade: deep green at low opacity over coral
                      turns muddy, so the recession stays almost imperceptible
                      and the arrows carry the sequence instead. */}
                  <div className="mt-4 px-1" style={{ opacity: 1 - index * 0.06 }}>
                    <ProductBox className="w-full" />
                  </div>

                  <p className="text-note mt-3 opacity-65">{delivery.note}</p>

                  {/* The arrow that makes it a loop */}
                  {index < DELIVERIES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="u-caps absolute top-[42%] -right-3 hidden text-lg opacity-40 sm:block"
                    >
                      →
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <MicroMark className="text-black">
                {brand.sticksPerBox} × {brand.servingWeight}
                {brand.servingUnit} per delivery
              </MicroMark>
              <MicroMark className="text-black">No commitment</MicroMark>
              <MicroMark className="text-black">Skip a month anytime</MicroMark>
            </div>
          </div>

          {/* Right: the plan */}
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <div className="border border-black/25 bg-ivory p-7 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="u-label opacity-55">{subscription.title}</p>
                  <p className="text-h3 u-caps mt-3">{dailyBox.name}</p>
                </div>
                <span className="u-label bg-coral px-2 py-1 text-black">
                  −{Math.round(brand.subscriptionDiscount * 100)}%
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-baseline gap-3">
                <span className="text-h2 tabular-nums">
                  {formatPrice(subscriptionPrice)}
                </span>
                <span className="text-base line-through opacity-45">
                  {formatPrice(dailyBox.price)}
                </span>
                <span className="u-label opacity-60">/ month</span>
              </div>

              <ul className="mt-7 border-t border-black/20">
                {subscription.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 border-b border-black/15 py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-green"
                    />
                    <span className="text-[1.02rem]">{benefit}</span>
                  </li>
                ))}
              </ul>

              <AddToCartButton
                variant="solid"
                className="mt-7"
                onAdd={() => add(dailyBox, "subscription", 1)}
              >
                {subscription.cta}
              </AddToCartButton>

              <p className="mt-4 text-xs leading-relaxed opacity-60">
                {subscription.billingEnabled
                  ? "Billed monthly. Pause or cancel from your account at any time."
                  : "Subscriptions open with the first production run — add one to your bag and we will confirm before anything is billed."}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
