"use client";

import { useState } from "react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

/**
 * Add to cart.
 *
 * On success the liquid inside the small glass waves once — about 460ms. The
 * animation is CSS and plays on mount, so remounting the glass with a new key
 * replays it. No checkmark, no confetti.
 */
export function AddToCartButton({
  onAdd,
  children,
  full = true,
  className,
  variant = "solid",
}: {
  onAdd: () => void;
  children: React.ReactNode;
  full?: boolean;
  className?: string;
  variant?: "solid" | "ivory";
}) {
  const [pours, setPours] = useState(0);

  const palette =
    variant === "solid"
      ? "bg-green text-ivory"
      : "bg-ivory text-black";

  return (
    <button
      type="button"
      onClick={() => {
        setPours((value) => value + 1);
        onAdd();
      }}
      className={cn(
        "group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden px-8 sm:h-16 sm:px-10",
        "u-label font-semibold whitespace-nowrap transition-colors duration-500 ease-[var(--ease-matocha)]",
        palette,
        variant === "solid" ? "hover:text-black" : "hover:text-black",
        full && "w-full",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-bottom scale-y-0 bg-coral transition-transform duration-500 ease-[var(--ease-matocha)] group-hover:scale-y-100"
      />
      <span className="relative z-10 block h-5 w-5 shrink-0">
        <MatochaGlass
          key={pours}
          variant="classic"
          pulse={pours > 0}
          ink={variant === "solid" ? brand.colors.ivory : brand.colors.black}
        />
      </span>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
