"use client";

import { useEffect, useRef, useState } from "react";
import { PourStage } from "./drink/PourStage";
import { useReducedMotion } from "./useSceneClock";
import { ProductStick } from "@/components/brand/ProductStick";
import { ButtonLink } from "@/components/ui/Button";
import { fr } from "@/content/i18n/fr";
import { mixColor } from "@/lib/anim";
import { cn } from "@/lib/utils";

export type FlavourOption = {
  key: string;
  id: "original" | "vanille" | "fraise";
  name: string;
  statusLabel: string;
  testTrack: boolean;
  description: string;
  ingredients: { text: string; confirmed: boolean; target?: string };
  accent: string;
  accentToken: string;
  liquidColor: string;
  matterColor: string;
  cta: { label: string; href: string } | null;
};

/** Interpolates a colour towards its target over ~600 ms. */
function useColorTween(target: string) {
  const [color, setColor] = useState(target);
  const from = useRef(target);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 600);
      const c = mixColor(origin, target, 1 - Math.pow(1 - k, 3));
      from.current = c;
      setColor(c);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return reduced ? target : color;
}

/**
 * M05 — LE SÉLECTEUR DE GOÛT.
 * One object per flavour: changing it changes the drink colour, the pack, the
 * accent of Le Filet, the text, the ingredients and the CTA together. It is
 * impossible to show Fraise colours with Original ingredients.
 */
export function FlavourScene({ options }: { options: FlavourOption[] }) {
  const [index, setIndex] = useState(0);
  const o = options[index];
  const liquid = useColorTween(o.liquidColor);
  const matter = useColorTween(o.matterColor);

  /* Le Filet reads --accent from the document. */
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", `var(${o.accentToken})`);
    return () => {
      document.documentElement.style.removeProperty("--accent");
    };
  }, [o.accentToken]);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
      <div className="relative order-2 mx-auto grid w-full max-w-[560px] grid-cols-[1fr_auto] items-end gap-4 lg:order-1 lg:max-w-none">
        <figure className="relative mx-auto aspect-[4/5] w-full max-w-[420px]">
          <PourStage t={0.8} family="poudre" temp="iced" liquidColor={liquid} matterColor={matter} accent={o.accent} className="h-full w-full" />
          <figcaption className="absolute top-2 left-2 concept-tag">{fr.status.concept}</figcaption>
        </figure>
        <div className="h-[clamp(12rem,30vw,20rem)] pb-6">
          <ProductStick accent={o.accent} recipe={o.name} title={`Stick ${o.name}, visuel de concept`} />
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <div role="radiogroup" aria-label="Choisir un goût" className="flex flex-wrap gap-3">
          {options.map((option, i) => (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={i === index}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setIndex((index + 1) % options.length);
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setIndex((index - 1 + options.length) % options.length);
                }
              }}
              tabIndex={i === index ? 0 : -1}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-full border-2 py-2 pr-5 pl-2 font-semibold transition-colors",
                i === index ? "border-foret bg-lait" : "border-transparent bg-lait-profond hover:border-encre/30",
              )}
            >
              <span className="h-8 w-8 rounded-full border border-encre/20" style={{ background: option.accent }} aria-hidden="true" />
              {option.name}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="mt-8">
          <p className="flex items-center gap-3">
            <span className="text-3xl u-caps">{o.name}</span>
            <span className={cn("concept-tag", o.testTrack && "!bg-mousse")}>{o.statusLabel}</span>
          </p>
          <p className="mt-4 measure text-lg">{o.description}</p>
          <dl className="mt-6 border-t border-encre/15 pt-4">
            <dt className="u-label">{fr.flavour.ingredients}</dt>
            <dd className="mt-1">
              {o.ingredients.confirmed ? (
                o.ingredients.text
              ) : (
                <>
                  <span className="pending">{o.ingredients.text}</span>
                  {o.ingredients.target && (
                    <span className="block text-sm">
                      {fr.inside.target} : {o.ingredients.target}
                    </span>
                  )}
                </>
              )}
            </dd>
          </dl>
          {o.cta && (
            <div className="mt-8">
              <ButtonLink href={o.cta.href}>{o.cta.label}</ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
