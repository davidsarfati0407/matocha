"use client";

import { useEffect, useRef, useState } from "react";
import { PourStage, STEP_FRAMES, type StageTemp } from "./drink/PourStage";
import { FormatIcon } from "./HeroScene";
import { useReducedMotion } from "./useSceneClock";
import type { FamilyId, PrepMethod } from "@/content/catalog/types";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

export type GestureFamily = {
  id: FamilyId;
  name: string;
  status: string;
  steps: [string, string, string];
  stepTexts: readonly string[];
  /** Methods planned for this family, from the recipe's preparation Proof. */
  methods: { method: PrepMethod; hot: boolean; iced: boolean }[];
  liquidColor: string;
  matterColor: string;
  accent: string;
};

const METHOD_LABEL: Record<PrepMethod, string> = {
  whisk: "au fouet",
  frother: "au mousseur",
  shaker: "au shaker",
  spoon: "à la cuillère",
};

/** Scroll progress 0→1 of an element through the viewport (desktop pin). */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setP(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
  return p;
}

export function GestureScene({ families, header }: { families: GestureFamily[]; header?: React.ReactNode }) {
  const [familyIndex, setFamilyIndex] = useState(0);
  const [temp, setTemp] = useState<StageTemp>("iced");
  const reduced = useReducedMotion();
  const pin = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(pin, !reduced);
  const f = families[familyIndex];

  const method =
    f.methods.find((m) => (temp === "hot" ? m.hot : m.iced))?.method ?? f.methods[0]?.method;
  /* Scroll covers Ouvrir → Préparer and stops on the finished drink. */
  const t = reduced ? STEP_FRAMES[2] : Math.min(0.78, progress * 0.82);
  const active = t < 0.14 ? 0 : t < 0.4 ? 1 : 2;

  const stage = (time: number, cls: string) => (
    <PourStage
      t={time}
      family={f.id}
      temp={temp}
      method={method}
      liquidColor={f.liquidColor}
      matterColor={f.matterColor}
      accent={f.accent}
      className={cls}
    />
  );

  const controls = (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <div role="group" aria-label={fr.gesture.format} className="flex gap-2">
        {families.map((option, i) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={i === familyIndex}
            onClick={() => setFamilyIndex(i)}
            className={cn(
              "min-h-11 border px-3 text-sm font-semibold",
              i === familyIndex ? "border-foret bg-foret text-lait" : "border-encre/30 hover:bg-mousse",
            )}
          >
            <FormatIcon kind={option.id === "poudre" ? "stick" : "drop"} />
            {option.name}
          </button>
        ))}
      </div>
      <div role="group" aria-label={fr.gesture.temperature} className="flex gap-2">
        {(["hot", "iced"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={temp === value}
            onClick={() => setTemp(value)}
            className={cn(
              "min-h-11 border px-3 text-sm font-semibold",
              temp === value ? "border-foret bg-foret text-lait" : "border-encre/30 hover:bg-mousse",
            )}
          >
            {value === "hot" ? fr.gesture.hot : fr.gesture.iced}
          </button>
        ))}
      </div>
    </div>
  );

  const stepList = (variant: "pinned" | "plain") => (
    <ol className="mt-6 space-y-4">
      {f.steps.map((step, i) => (
        <li
          key={step}
          className={cn(
            "grid grid-cols-[3rem_1fr] gap-x-4 border-t border-encre/15 pt-4 transition-opacity duration-300",
            variant === "pinned" && !reduced && i !== active && "opacity-45",
          )}
          aria-current={variant === "pinned" && i === active ? "step" : undefined}
        >
          <span className="font-serif text-4xl leading-none">{i + 1}</span>
          <div>
            <h3 className="text-xl font-semibold">{step}</h3>
            <p className="mt-1 measure">
              {i === 2 && method
                ? `${f.stepTexts[2]} (${METHOD_LABEL[method]})`
                : f.stepTexts[i]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );

  const meta = (
    <p className="mt-6 text-sm">
      {temp === "hot" ? fr.gesture.hotDetail : fr.gesture.icedDetail}. {fr.gesture.volumesPending}
      {f.status && <span className="ml-2 concept-tag">{f.status}</span>}
    </p>
  );

  return (
    /* Desktop: a short pin (115vh) that is always passable; the heading pins
       with the scene. Mobile: three swipeable cards, no pinning. */
    <div ref={pin} className={cn("relative", !reduced && "lg:h-[115vh]")}>
      <div
        className={cn(
          "lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16",
          !reduced && "lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)]",
        )}
      >
        <div>
          {header}
          <div className="mt-6">{controls}</div>
          <div className="hidden lg:block">{stepList("pinned")}</div>
          <div className="lg:hidden">
            <MobileCards labels={f.steps} texts={f.stepTexts} render={(i) => stage(STEP_FRAMES[i], "h-full w-full")} />
          </div>
          {meta}
        </div>
        <figure className="relative mx-auto hidden aspect-[4/5] h-[min(74vh,620px)] lg:block">
          {stage(t, "h-full w-full")}
          <figcaption className="absolute top-2 left-2 concept-tag">{fr.status.concept}</figcaption>
        </figure>
      </div>
    </div>
  );
}

function MobileCards({
  labels,
  texts,
  render,
}: {
  labels: readonly string[];
  texts: readonly string[];
  render: (i: number) => React.ReactNode;
}) {
  const track = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setCurrent(Math.round(el.scrollLeft / (el.firstElementChild?.clientWidth || el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mt-6">
      <ol
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto px-4"
        aria-label="Les trois étapes"
      >
        {labels.map((label, i) => (
          <li key={label} className="w-full shrink-0 snap-start pr-3 sm:w-1/2" aria-roledescription="étape">
            <div className="relative aspect-[4/5] w-full bg-lait-profond">
              {render(i)}
              <span className="absolute top-2 left-2 concept-tag">{fr.status.concept}</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold">
              <span className="mr-2 font-serif text-2xl">{i + 1}</span>
              {label}
            </h3>
            <p className="mt-1">{texts[i]}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex justify-center gap-2">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-label={`Étape ${i + 1} : ${label}`}
            aria-current={i === current ? "step" : undefined}
            onClick={() =>
              track.current?.scrollTo({ left: i * (track.current.firstElementChild?.clientWidth || track.current.clientWidth), behavior: "smooth" })
            }
            className="flex h-11 w-11 items-center justify-center"
          >
            <span className={cn("block h-2 rounded-full transition-all", i === current ? "w-6 bg-foret" : "w-2 bg-encre/30")} />
          </button>
        ))}
      </div>
    </div>
  );
}
