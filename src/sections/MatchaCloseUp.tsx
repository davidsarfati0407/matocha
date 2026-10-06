"use client";

import { MatochaGlass, MatochaWave } from "@/components/brand/MatochaGlass";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { brand, sourcingRows } from "@/data/brand";
import { cn } from "@/lib/utils";

/**
 * YES, THE MATCHA STILL MATTERS.
 *
 * A close crop: the liquid fills most of the frame, the glass is cut by the
 * edges, foam texture sits on top. Only confirmed facts appear; unconfirmed
 * sourcing stays marked as such.
 */
export function MatchaCloseUp() {
  const rows = sourcingRows();

  return (
    <section id="our-matcha" className="relative overflow-hidden bg-green text-ivory">
      {/* The crop: liquid, foam, and a glass too big for the frame */}
      <div className="relative grid lg:grid-cols-2">
        <div className="texture-foam relative min-h-[46vh] overflow-hidden bg-matcha lg:min-h-[70vh]">
          <div className="absolute -bottom-[26%] left-1/2 h-[150%] w-[86%] -translate-x-1/2 sm:w-[62%] lg:w-[80%]">
            <MatochaGlass variant="whisked" ink="#173D2B" liquid="#8FBC5C" />
          </div>
          <MicroMark className="absolute top-5 left-5 text-green">
            Whisked, not stirred
          </MicroMark>
        </div>

        <div className="flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-14">
          <Reveal>
            <EditorialLabel index="07" className="text-ivory">
              The matcha
            </EditorialLabel>
          </Reveal>

          <h2 className="text-h2 u-caps mt-5 max-w-[16ch]">
            <RevealLine>Yes,</RevealLine>
            <RevealLine delay={0.06}>the matcha</RevealLine>
            <RevealLine delay={0.12}>still matters.</RevealLine>
          </h2>

          <Reveal delay={0.14}>
            <p className="text-lead mt-6 max-w-[38ch] text-ivory/80">
              Convenience means nothing if what&apos;s inside isn&apos;t
              exceptional.
            </p>

            <MatochaWave className="mt-8 h-4 max-w-[12rem]" color="#79A84B" />

            <ul className="mt-8 grid grid-cols-2 gap-x-6 border-t border-ivory/20">
              {brand.facts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-baseline gap-3 border-b border-ivory/15 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral"
                  />
                  <span className="text-note">{fact}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
              {rows.slice(0, 3).map((row) => (
                <div key={row.label} className="border-t border-ivory/20 py-4">
                  <dt className="u-label text-ivory/55">{row.label}</dt>
                  <dd
                    className={cn(
                      "mt-1.5 text-[1.05rem]",
                      !row.confirmed && "u-serif-it opacity-45",
                    )}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="text-note mt-5 max-w-[44ch] text-ivory/55">
              Supplier selection is still ongoing. Region, cultivar, producer and
              harvest are published here once confirmed — not before.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
