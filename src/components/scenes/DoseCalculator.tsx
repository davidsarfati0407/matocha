"use client";

import { useId, useState } from "react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

export type CalcPack = {
  key: string;
  name: string;
  doses: number;
  dosesRange: string;
  /** Only present when the price is confirmed. */
  pricePerDrink: string | null;
};

/**
 * M04 — MA DOSE. A useful tool, not a sales tactic: no urgency, no stock
 * counter. The price per drink appears only for a confirmed price.
 */
export function DoseCalculator({ packs }: { packs: CalcPack[] }) {
  const [perWeek, setPerWeek] = useState(5);
  const [temp, setTemp] = useState<"hot" | "iced">("iced");
  const id = useId();

  const perMonth = Math.round((perWeek * 30) / 7);
  const sorted = [...packs].sort((a, b) => a.doses - b.doses);
  const advice =
    perWeek <= 3 ? sorted[0] : perWeek <= 10 ? sorted[Math.min(1, sorted.length - 1)] : sorted[sorted.length - 1];
  const lastsDays = Math.max(1, Math.round((advice.doses / perWeek) * 7));
  const remaining = Math.max(0, 1 - 7 / lastsDays);

  return (
    <div className="grid gap-6 border border-encre/15 bg-lait p-5 sm:p-6 lg:grid-cols-[1fr_1.7fr_auto] lg:items-center">
      <div>
        <h3 className="text-2xl u-caps">{fr.dose.title}</h3>
        <p className="mt-2 text-sm">{fr.dose.intro}</p>

      </div>
      <div>
        <label htmlFor={`${id}-range`} className="block font-semibold">
          {fr.dose.perWeek} : <span className="tabular-nums">{perWeek}</span>
        </label>
        <input
          id={`${id}-range`}
          type="range"
          min={1}
          max={14}
          value={perWeek}
          onChange={(e) => setPerWeek(Number(e.target.value))}
          aria-valuetext={`${perWeek} matchas par semaine`}
          className="mt-3 h-11 w-full accent-[var(--foret)]"
        />
        <div role="group" aria-label={fr.gesture.temperature} className="mt-3 flex gap-2">
          {(["hot", "iced"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={temp === v}
              onClick={() => setTemp(v)}
              className={cn(
                "min-h-11 border px-3 text-sm font-semibold",
                temp === v ? "border-foret bg-foret text-lait" : "border-encre/30 hover:bg-mousse",
              )}
            >
              {v === "hot" ? fr.gesture.hot : fr.gesture.iced}
            </button>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" aria-live="polite">
          <div>
            <dt className="text-sm">{fr.dose.perMonth}</dt>
            <dd className="text-2xl tabular-nums">{perMonth}</dd>
          </div>
          <div>
            <dt className="text-sm">{fr.dose.advice}</dt>
            <dd className="text-xl font-semibold">{advice.name}</dd>
            <dd className="text-sm">{advice.dosesRange}</dd>
          </div>
          <div>
            <dt className="text-sm">{fr.dose.lasts}</dt>
            <dd className="text-lg">{fr.dose.days(lastsDays)}</dd>
          </div>
          <div>
            <dt className="text-sm">{fr.dose.pricePerDrink}</dt>
            <dd className={cn("text-lg", !advice.pricePerDrink && "pending")}>
              {advice.pricePerDrink ?? fr.status.priceAbsent}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs">
          Calcul fait avec {advice.doses} doses, la quantité de travail du pack {advice.name} ; elle sera confirmée avec le fournisseur.
        </p>
      </div>

      <div className="flex items-end justify-center gap-4" aria-hidden="true">
        <div className="h-36 w-28">
          <MatochaGlass
            variant={temp === "iced" ? "ice" : "whisked"}
            fill={0.15 + (perWeek / 14) * 0.8}
            liquid="#A9C46A"
            ink="#16241B"
          />
        </div>
        <div className="flex h-28 w-10 flex-col justify-end border-2 border-encre bg-lait-profond">
          <div className="bg-foret transition-[height] duration-500" style={{ height: `${remaining * 100}%` }} />
          <span className="sr-only">Boîte restante après une semaine</span>
        </div>
      </div>
    </div>
  );
}
