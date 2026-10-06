import { MatochaGlass, type GlassVariant } from "./MatochaGlass";
import { ProductStick } from "./ProductStick";
import { ProductBox } from "./ProductBox";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

export type SceneTone = "ivory" | "green" | "sand";

const GROUND: Record<SceneTone, string> = {
  ivory: "linear-gradient(168deg, #FBF8F1 0%, #F3EFE5 52%, #E4DDCC 100%)",
  sand: "linear-gradient(168deg, #F1EADC 0%, #E7E1D2 54%, #D3C9B3 100%)",
  green: "linear-gradient(168deg, #24593D 0%, #173D2B 55%, #0F2A1E 100%)",
};

/**
 * Stand-in for lifestyle photography.
 *
 * The art direction is daylight, not a filter: a window-light source, a long
 * cast shadow thrown away from it, and the object standing in the light.
 * `lightX`/`lightY` place the window.
 *
 * Swap this component for <Image> once the shoot exists — the frame already
 * reserves its aspect ratio, so nothing will move.
 */
export function LifestyleFrame({
  tone = "ivory",
  label,
  caption,
  ratio = "4 / 5",
  lightX = "72%",
  lightY = "12%",
  subject = "glass",
  glass = "classic",
  className,
}: {
  tone?: SceneTone;
  label?: string;
  caption?: string;
  ratio?: string;
  lightX?: string;
  lightY?: string;
  subject?: "glass" | "stick" | "box" | "none";
  glass?: GlassVariant;
  className?: string;
}) {
  const isDark = tone === "green";
  const lightFromRight = Number.parseFloat(lightX) > 50;

  return (
    <figure
      className={cn(
        "group relative isolate overflow-hidden",
        isDark ? "text-ivory" : "text-black",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{ backgroundImage: GROUND[tone] }}
      />

      {/* Window light */}
      <div
        aria-hidden="true"
        className="light-wash absolute inset-0 -z-10"
        style={{
          ["--light-x" as string]: lightX,
          ["--light-y" as string]: lightY,
          opacity: isDark ? 0.18 : 0.5,
        }}
      />

      {/* Horizon: the edge of a counter, a desk, a sill */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[30%] -z-10 h-px bg-current opacity-15"
      />

      {subject !== "none" && (
        <div className="absolute inset-x-0 bottom-[30%] flex h-[46%] items-end justify-center">
          {/* Cast shadow, thrown away from the light */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 h-[8%] w-[34%] rounded-full bg-black/25 blur-md"
            style={{ transform: `translateX(${lightFromRight ? "-40%" : "40%"})` }}
          />

          {subject === "glass" && (
            <div className="relative h-full">
              <MatochaGlass
                variant={glass}
                ink={isDark ? brand.colors.ivory : brand.colors.black}
              />
            </div>
          )}
          {subject === "stick" && (
            <div className="relative h-full">
              <ProductStick tone={isDark ? "ivory" : "green"} glass={glass} />
            </div>
          )}
          {subject === "box" && (
            <div className="relative w-[54%]">
              <ProductBox className="w-full" />
            </div>
          )}
        </div>
      )}

      {(label || caption) && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
          {label && <span className="u-label opacity-70">{label}</span>}
          {caption && (
            <span className="u-serif-it text-right text-sm opacity-70 sm:text-base">
              {caption}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
