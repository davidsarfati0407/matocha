"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PrepStep = { label: string; title: string; text: string; scene: number };

/**
 * Open / Pour / Whisk / Enjoy.
 *
 * Desktop: the scene frame stays in place (CSS sticky, no scroll hijacking)
 * while the steps scroll by; the step crossing the middle of the screen is
 * active, the progress bar fills and the frame cross-fades to its scene.
 * Phones: plain flow, each step with its own scene inline.
 * Reduced motion: no cross-fade, the scenes simply switch.
 *
 * `scenes` are server-rendered renders; the first sets the frame (4:5), the
 * others sit centred in it (a landscape scene stays whole, uncropped). `inline` holds
 * the phone scene of each step (null when a step shares the previous scene).
 */
export function PrepSequence({
  steps,
  scenes,
  inline,
}: {
  steps: PrepStep[];
  scenes: React.ReactNode[];
  inline: (React.ReactNode | null)[];
}) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const scene = steps[active]?.scene ?? 0;

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24">
      <div className="hidden lg:block">
        <div className="sticky top-[14vh]">
          <div className="flex gap-2" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-foret/15">
                <span
                  className={cn("prep-bar block h-full origin-left rounded-full bg-foret", i <= active ? "scale-x-100" : "scale-x-0")}
                />
              </span>
            ))}
          </div>
          <div className="relative mt-6 max-w-[560px]">
            {scenes.map((node, i) => (
              <div
                key={i}
                aria-hidden={i !== scene}
                className={cn("prep-scene", i > 0 && "absolute inset-0 flex items-center", i === scene ? "opacity-100" : "opacity-0")}
              >
                {node}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ol>
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => {
              items.current[i] = el;
            }}
            data-step={i}
            aria-current={i === active ? "step" : undefined}
            className={cn(
              "flex flex-col justify-center py-10 lg:min-h-[72vh] lg:py-0",
              /* Inactive: only the large title dims (60 % keeps 4.2:1 on crème); body text stays at full contrast. */
              i !== active && "lg:[&_h3]:opacity-60",
            )}
          >
            {inline[i] && <div className="mb-8 lg:hidden">{inline[i]}</div>}
            <p className="eyebrow">{s.label}</p>
            <h3 className="prep-step display mt-4">{s.title}</h3>
            <p className="lede mt-5">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
