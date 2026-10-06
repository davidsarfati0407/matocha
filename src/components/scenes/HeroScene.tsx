"use client";

import { useState } from "react";
import { PourStage, STEP_FRAMES } from "./drink/PourStage";
import { useSceneClock } from "./useSceneClock";
import type { FamilyId } from "@/content/catalog/types";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

type Variant = {
  family: FamilyId;
  label: string;
  status: string;
  liquidColor: string;
  matterColor: string;
  accent: string;
};

const POSTER_T = 0.77;

/**
 * M01 — LE VERSEMENT.
 *
 * The media slot is reserved at a fixed aspect ratio, so nothing moves when
 * the scene (or, later, the real video) arrives. Until a real film exists in
 * the manifest, this is a clearly-marked conceptual illustration.
 */
export function HeroScene({ variants }: { variants: Variant[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const { t, ref, reduced, reset } = useSceneClock({
    durationMs: 8000,
    start: POSTER_T,
    playing,
  });
  const v = variants[index];

  const stage = (time: number, cls?: string) => (
    <PourStage
      t={time}
      family={v.family}
      temp="iced"
      liquidColor={v.liquidColor}
      matterColor={v.matterColor}
      accent={v.accent}
      className={cls}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <figure
        ref={ref}
        className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-auto lg:h-[min(72vh,680px)] rounded-[2px] bg-[radial-gradient(70%_60%_at_60%_30%,#fbfaf2_0%,var(--lait-profond)_100%)]"
        aria-label={`${fr.status.concept} : ${v.label}`}
      >
        <div className="absolute inset-x-[4%] top-[2%] bottom-[2%]">
          {stage(reduced ? POSTER_T : t, "h-full w-full")}
        </div>

        {reduced && (
          <ol className="absolute right-3 bottom-12 left-3 grid grid-cols-3 gap-2" aria-label="Le geste en trois images">
            {fr.gesture.stepPowder.map((_, i) => (
              <li key={i} className="rounded-sm border border-encre/15 bg-lait/90 p-1">
                {stage(STEP_FRAMES[i], "h-20 w-full")}
                <span className="block text-center text-xs font-semibold">
                  {i + 1}. {(v.family === "poudre" ? ["Ouvrir", "Verser", "Préparer"] : ["Ouvrir", "Verser", "Mélanger"])[i]}
                </span>
              </li>
            ))}
          </ol>
        )}

        <figcaption className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="concept-tag">{fr.status.concept}</span>
          {v.status && <span className="concept-tag">{v.status}</span>}
        </figcaption>

        {!reduced && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="absolute right-3 bottom-3 flex h-11 items-center gap-2 rounded-full bg-lait/90 px-3 text-xs font-semibold"
            aria-pressed={!playing}
          >
            {playing ? "Mettre en pause" : "Lire l'animation"}
          </button>
        )}
      </figure>

      {variants.length > 1 && (
        <div role="group" aria-label="Format montré dans l'animation" className="flex gap-2">
          {variants.map((option, i) => (
            <button
              key={option.family}
              type="button"
              aria-pressed={i === index}
              onClick={() => {
                setIndex(i);
                reset(0);
              }}
              className={cn(
                "min-h-11 border px-4 text-sm font-semibold transition-colors",
                i === index ? "border-foret bg-foret text-lait" : "border-encre/30 hover:bg-mousse",
              )}
            >
              <FormatIcon kind={option.family === "poudre" ? "stick" : "drop"} /> {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The FORMAT cue: a stick or a drop. Never coloured by flavour. */
export function FormatIcon({ kind, className }: { kind: "stick" | "drop"; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("mr-1 inline-block h-4 w-4 align-[-3px]", className)} aria-hidden="true">
      {kind === "stick" ? (
        <rect x="5.5" y="1" width="5" height="14" rx="1.2" fill="currentColor" />
      ) : (
        <path d="M8 1.5 C5 6 3.5 8.5 3.5 10.5 a4.5 4.5 0 0 0 9 0 C12.5 8.5 11 6 8 1.5 Z" fill="currentColor" />
      )}
    </svg>
  );
}
