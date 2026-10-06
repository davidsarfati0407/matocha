"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ProductBox } from "@/components/brand/ProductBox";
import { ProductStick } from "@/components/brand/ProductStick";
import { StickTray } from "@/components/brand/StickTray";
import { LifestyleFrame } from "@/components/brand/LifestyleFrame";
import { brand } from "@/data/brand";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Product gallery. Each shot is a composed SVG/CSS mockup standing in for
 * photography — swap the render functions for <Image> once the shoot exists;
 * the frames already reserve a 4:5 box, so nothing will shift.
 */
const SHOTS: { id: string; label: string; render: () => React.ReactNode }[] = [
  {
    id: "pack",
    label: "The box",
    render: () => (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ivory-deep p-8 sm:p-14">
        <div className="absolute -right-[14%] -bottom-[16%] h-[62%] w-[42%]">
          <MatochaGlass variant="classic" className="opacity-[0.16]" />
        </div>
        <ProductBox className="relative w-[82%]" />
      </div>
    ),
  },
  {
    id: "open",
    label: "Opened",
    render: () => (
      <div className="flex h-full w-full items-end justify-center overflow-hidden bg-green p-8 pb-0 sm:p-14 sm:pb-0">
        <ProductBox open className="w-[86%] translate-y-[6%]" />
      </div>
    ),
  },
  {
    id: "thirty",
    label: "30 sticks",
    render: () => (
      <div className="flex h-full w-full flex-col justify-center bg-ivory px-5 py-8 sm:px-8">
        <StickTray columns={10} />
        <div className="mt-5 flex items-center justify-between">
          <span className="u-label opacity-45">
            {brand.sticksPerBox} sticks
          </span>
          <span className="u-label opacity-45">
            {brand.netWeight}
            {brand.servingUnit} total
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "serving",
    label: "One serving",
    render: () => (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-green p-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[80%]">
            <MatochaGlass variant="whisked" ink="#F3EFE5" className="opacity-[0.18]" />
          </div>
        </div>
        <div className="relative h-[76%] rotate-[-10deg] drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <ProductStick tone="ivory" torn glass="pour" />
        </div>
        <span className="u-label absolute bottom-6 left-6 text-ivory/70">
          {brand.servingWeight}
          {brand.servingUnit} — exactly one matcha
        </span>
      </div>
    ),
  },
  {
    id: "in-use",
    label: "In use",
    render: () => (
      <LifestyleFrame
        tone="ivory"
        ratio="4 / 5"
        label="Kitchen counter"
        caption="07:15 — before anything else"
        lightX="78%"
        lightY="8%"
        className="h-full w-full"
      />
    ),
  },
];

export function ProductGallery() {
  const [active, setActive] = useState(0);

  return (
    <div className="lg:flex lg:gap-4">
      {/* Thumbnails — desktop only */}
      <div className="hidden shrink-0 flex-col gap-3 lg:flex">
        {SHOTS.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={shot.label}
            aria-current={active === index}
            className={cn(
              "relative h-24 w-20 overflow-hidden transition-opacity duration-400",
              active === index ? "opacity-100" : "opacity-45 hover:opacity-80",
            )}
          >
            {/* Captions are illegible at thumbnail size — hide the text only. */}
            <div className="pointer-events-none h-full w-full [&_figcaption]:hidden [&>*]:h-full [&>div>span]:hidden">
              {shot.render()}
            </div>
            <span
              className={cn(
                "absolute inset-0 border transition-colors duration-400",
                active === index ? "border-black/60" : "border-transparent",
              )}
            />
          </button>
        ))}
      </div>

      {/* Main frame — desktop */}
      <div className="relative hidden aspect-4/5 w-full overflow-hidden lg:block">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={SHOTS[active].id}
            data-matocha-motion
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {SHOTS[active].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile: full-bleed swipe rail */}
      <div className="lg:hidden">
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
          {SHOTS.map((shot) => (
            <div
              key={shot.id}
              className="aspect-4/5 w-[86vw] shrink-0 snap-center overflow-hidden sm:w-[62vw]"
            >
              {shot.render()}
            </div>
          ))}
        </div>
        <p className="u-label mt-3 opacity-45">Swipe — {SHOTS.length} views</p>
      </div>
    </div>
  );
}
