import { brand } from "@/data/brand";
import { ProductStick } from "./ProductStick";
import type { GlassVariant } from "./MatochaGlass";
import { cn } from "@/lib/utils";

/**
 * The thirty sticks, laid out as a tray.
 *
 * The colourway runs six green then one ivory, so the tray reads as weeks: each
 * pale pack closes a run of seven. With thirty sticks that marks four full
 * weeks and leaves two over — which is what a box actually holds.
 *
 * The glass printed on each pack cycles separately through its states, so the
 * tray reads as one family in four moods rather than thirty identical wrappers.
 * Every cell carries the stick's own 132:520 aspect, which is what gives the
 * rows a definite height — the sticks are SVG and have no intrinsic size.
 */
const WEEK = 7;
const CYCLE: GlassVariant[] = ["classic", "ice", "pour", "whisked"];

export function StickTray({
  className,
  count = brand.sticksPerBox,
  columns = 30,
  mobileColumns = 15,
  tone,
}: {
  className?: string;
  count?: number;
  columns?: number;
  /** Columns below 640px — a 30-wide tray is unreadable on a phone. */
  mobileColumns?: number;
  /** Forces one colourway — used when the tray sits on a green ground. */
  tone?: "green" | "ivory";
}) {
  return (
    <div
      className={cn("stick-tray grid gap-1 sm:gap-1.5", className)}
      style={
        {
          "--tray-d": columns,
          "--tray-m": mobileColumns,
        } as React.CSSProperties
      }
      role="img"
      aria-label={`${count} sticks of ${brand.servingWeight}${brand.servingUnit}, one serving each`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex aspect-[132/520] items-center justify-center"
        >
          <ProductStick
            tone={tone ?? (index % WEEK === WEEK - 1 ? "ivory" : "green")}
            glass={CYCLE[index % CYCLE.length]}
          />
        </div>
      ))}
    </div>
  );
}
