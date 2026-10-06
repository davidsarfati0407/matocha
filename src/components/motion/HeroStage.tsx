import { Layer } from "./Layer";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

/*
 * The hero composition, built only from layers cut out of the renders:
 * the iced latte (from matocha-latte.png) and the stick (from matocha-box.png).
 *
 *   0.20s  the glass rises with a light bounce
 *   0.55s  the stick follows, tilted, then floats continuously
 *   1.00s  the "2 g" badge pops in
 *
 * Each layer sits in its own `data-depth` wrapper, so on scroll the text and
 * the two objects drift at different speeds (see ParallaxRoot).
 */
export function HeroStage({ servingLabel, className }: { servingLabel: string | null; className?: string }) {
  return (
    <figure
      className={cn(
        "relative isolate aspect-[5/6] w-full overflow-hidden rounded-[2px] bg-[radial-gradient(75%_65%_at_60%_40%,#f8f7ee_0%,var(--lait-profond)_100%)] lg:aspect-auto lg:h-[min(76vh,720px)]",
        className,
      )}
      aria-label={`${fr.status.concept} : un stick Matocha et un matcha latte glacé.`}
    >
      {/* Floor shadows */}
      <div data-depth="10" className="parallax absolute inset-x-0 bottom-[7%] h-[6%]" aria-hidden="true">
        <div
          className="cascade absolute left-[40%] h-full w-[50%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(22,36,27,0.35),transparent)]"
          style={{ "--d": "0.4s" } as React.CSSProperties}
        />
        <div className="absolute left-[8%] h-full w-[34%]" style={{ "--d": "1.4s" } as React.CSSProperties}>
          <div className="float-shadow h-full w-full rounded-[50%] bg-[radial-gradient(closest-side,rgba(22,36,27,0.3),transparent)]" />
        </div>
      </div>

      {/* The iced latte */}
      <div data-depth="28" className="parallax absolute bottom-[9%] left-[38%] h-[84%]" aria-hidden="true">
        <div className="arrive h-full" style={{ "--d": "0.2s" } as React.CSSProperties}>
          <Layer
            id="layer-verre"
            priority
            sizes="(min-width: 1024px) 22vw, 45vw"
            className="h-full w-auto drop-shadow-[0_18px_24px_rgba(22,36,27,0.18)]"
          />
        </div>
      </div>

      {/* The stick, in front, floating */}
      <div data-depth="60" className="parallax absolute bottom-[13%] left-[13%] h-[72%]" aria-hidden="true">
        <div className="arrive h-full" style={{ "--d": "0.55s", "--r0": "-16deg", "--r1": "-9deg" } as React.CSSProperties}>
          <div className="float h-full" style={{ "--d": "1.6s" } as React.CSSProperties}>
            <Layer
              id="layer-stick"
              priority
              sizes="(min-width: 1024px) 12vw, 25vw"
              className="h-full w-auto drop-shadow-[0_22px_22px_rgba(22,36,27,0.22)]"
            />
          </div>
        </div>
      </div>

      {/* The badge */}
      {servingLabel && (
        <div data-depth="70" className="parallax absolute top-[8%] left-[6%]">
          <span
            className="pop inline-flex h-16 w-16 items-center justify-center rounded-full bg-foret text-lg font-semibold text-lait shadow-lg sm:h-20 sm:w-20 sm:text-xl"
            style={{ "--d": "1.05s" } as React.CSSProperties}
          >
            {servingLabel}
          </span>
        </div>
      )}

      <figcaption className="absolute top-2 left-2 concept-tag">{fr.status.concept}</figcaption>
    </figure>
  );
}
