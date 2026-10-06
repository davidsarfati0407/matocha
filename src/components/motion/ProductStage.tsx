import { Layer } from "./Layer";
import { ParallaxRoot } from "./ParallaxRoot";
import { fr } from "@/content/i18n/fr";

/*
 * The Daily Box composition, from the box render cut in two layers: the box
 * rises when the section scrolls in, the stick slides in beside it with a
 * slight bounce, then floats. Depth parallax on scroll.
 */
export function ProductStage() {
  return (
    <ParallaxRoot
      className="relative isolate aspect-[5/6] w-full overflow-hidden bg-[radial-gradient(75%_65%_at_50%_40%,#f8f7ee_0%,var(--lait-profond)_100%)]"
      role="img"
      aria-label={`${fr.status.concept} : la Daily Box Matocha et un stick.`}
    >
      <div aria-hidden="true" className="absolute inset-x-0 bottom-[8%] h-[6%]">
        <div className="absolute left-[12%] h-full w-[62%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(22,36,27,0.32),transparent)]" />
      </div>
      <div data-depth="20" className="parallax absolute bottom-[10%] left-[12%] h-[72%]" aria-hidden="true">
        <div data-reveal="image" className="h-full">
          <Layer id="layer-boite" sizes="(min-width: 1024px) 28vw, 60vw" className="h-full w-auto drop-shadow-[0_20px_26px_rgba(22,36,27,0.18)]" />
        </div>
      </div>
      <div data-depth="55" className="parallax absolute bottom-[12%] left-[66%] h-[62%]" aria-hidden="true">
        <div data-reveal style={{ "--d": "0.25s" } as React.CSSProperties} className="h-full">
          <div className="float h-full" style={{ "--d": "0.8s" } as React.CSSProperties}>
            <Layer id="layer-stick" sizes="(min-width: 1024px) 10vw, 22vw" className="h-full w-auto drop-shadow-[0_18px_20px_rgba(22,36,27,0.2)]" />
          </div>
        </div>
      </div>
      <span className="absolute top-2 left-2 concept-tag">{fr.status.concept}</span>
    </ParallaxRoot>
  );
}
