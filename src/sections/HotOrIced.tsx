"use client";

import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { preparations } from "@/data/content";

/**
 * HOT OR ICED — the same 2g stick, two ways.
 * A hard split down the middle: ivory against deep green, warm against cold.
 * The steps come from `data/content.ts` and stay editable.
 */
export function HotOrIced() {
  return (
    <section className="relative">
      <Container wide className="sec-tight">
        <Reveal>
          <EditorialLabel index="06">Two ways</EditorialLabel>
        </Reveal>
        <h2 className="text-h2 u-caps mt-5 max-w-[16ch]">
          <RevealLine>Your matcha.</RevealLine>
          <RevealLine delay={0.08}>Your way.</RevealLine>
        </h2>
      </Container>

      <div className="grid sm:grid-cols-2">
        {preparations.map((prep, index) => (
          <Reveal
            key={prep.title}
            delay={index * 0.1}
            className={
              index === 0
                ? "texture-powder relative overflow-hidden bg-ivory-deep"
                : "relative overflow-hidden bg-green text-ivory"
            }
          >
            <div className="flex h-full flex-col justify-between px-6 py-12 sm:px-10 sm:py-16">
              <div className="flex items-start justify-between">
                <h3 className="text-display u-caps leading-[0.85]">
                  {prep.title}
                </h3>
                <MicroMark className={index === 1 ? "text-ivory" : ""}>
                  0{index + 1}
                </MicroMark>
              </div>

              <div className="my-8 flex justify-center">
                <div className="h-[13rem] sm:h-[16rem]">
                  <MatochaGlass
                    variant={prep.glass}
                    ink={index === 1 ? "#F3EFE5" : undefined}
                  />
                </div>
              </div>

              <div>
                <ol className="border-t border-current/20">
                  {prep.steps.map((step, stepIndex) => (
                    <li
                      key={step}
                      className="flex items-baseline gap-4 border-b border-current/15 py-3"
                    >
                      <span className="u-label opacity-45">0{stepIndex + 1}</span>
                      <span className="text-[1.02rem]">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-note mt-4 opacity-60">{prep.note}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
