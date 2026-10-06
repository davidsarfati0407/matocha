"use client";

import { useState } from "react";
import { ProductBox } from "@/components/brand/ProductBox";
import { StickTray } from "@/components/brand/StickTray";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ButtonLink } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Reveal, RevealImage, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { brand } from "@/data/brand";
import { dailyBox } from "@/data/product";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

/**
 * 30 MATCHAS. ZERO GUESSWORK. — the pack, the glass it becomes, and the thirty
 * sticks laid out in a tray.
 */
export function DailyBox() {
  const [quantity, setQuantity] = useState(1);
  const { add } = useCart();

  return (
    <section id="product" className="sec">
      <Container wide>
        <Reveal>
          <EditorialLabel index="01">Daily Box</EditorialLabel>
        </Reveal>

        <h2 className="text-h2 u-caps mt-5 max-w-[20ch]">
          <RevealLine>{brand.sticksPerBox} matchas.</RevealLine>
          <RevealLine delay={0.08}>Zero guesswork.</RevealLine>
        </h2>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <RevealImage className="lg:col-span-7">
            {/* The box, and what it becomes, side by side */}
            <div className="relative flex items-end justify-center gap-[4%] overflow-hidden bg-ivory-deep px-6 pt-16 sm:px-10 sm:pt-24">
              <div className="relative w-[62%] max-w-[26rem] translate-y-[8%]">
                <ProductBox open className="w-full" />
              </div>
              <div className="relative w-[26%] translate-y-[6%]">
                <MatochaGlass variant="classic" />
              </div>
            </div>

            {/* Thirty sticks: sunrise on the left, sunset on the right */}
            <div className="mt-3 bg-green px-4 py-6 sm:px-7 sm:py-8">
              <StickTray />
              <div className="mt-5 flex items-center justify-between">
                <span className="u-label text-ivory/50">
                  {brand.sticksPerBox} × {brand.servingWeight}
                  {brand.servingUnit}
                </span>
                <span className="u-label text-ivory/50">
                  {brand.netWeight}
                  {brand.servingUnit} total
                </span>
              </div>
            </div>
          </RevealImage>

          <div className="lg:col-span-5 lg:pt-6">
            <Reveal>
              <h3 className="text-h2 u-caps">{dailyBox.name}</h3>
              <p className="u-serif-it mt-3 text-xl opacity-70">
                {brand.sticksPerBox} × {brand.servingWeight}
                {brand.servingUnit} — {brand.netWeight}
                {brand.servingUnit} total
              </p>

              <p className="text-h3 mt-7 tabular-nums">
                {formatPrice(dailyBox.price)}
              </p>

              <p className="text-lead mt-8 max-w-[38ch] opacity-75">
                One stick contains one perfectly portioned serving of matcha.
              </p>
              <p className="u-caps mt-4 text-lg opacity-55">
                At home. At work. On the move.
              </p>

              <dl className="mt-10 border-t border-black/15">
                {dailyBox.specs.slice(0, 4).map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-6 border-b border-black/15 py-3.5"
                  >
                    <dt className="u-label opacity-55">{spec.label}</dt>
                    <dd className="text-sm">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <QuantitySelector value={quantity} onChange={setQuantity} />
                <AddToCartButton
                  full={false}
                  className="w-full sm:flex-1"
                  onAdd={() => add(dailyBox, "one-time", quantity)}
                >
                  Add to cart — {formatPrice(dailyBox.price * quantity)}
                </AddToCartButton>
              </div>

              <ButtonLink
                href="/product"
                variant="outline"
                full
                className="mt-3"
              >
                See the box
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
