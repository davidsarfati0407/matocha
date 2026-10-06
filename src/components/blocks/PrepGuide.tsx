"use client";

import { useState } from "react";
import type { Drink } from "@/content/drinks";
import type { PrepMethod } from "@/content/catalog/types";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

type Equipment = "whisk" | "frother" | "shaker" | "none";

const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "whisk", label: "Un fouet" },
  { id: "frother", label: "Un mousseur à lait" },
  { id: "shaker", label: "Un shaker" },
  { id: "none", label: "Rien de tout ça" },
];

function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 border px-4 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-matcha-profond",
              value === o.id ? "border-foret bg-foret text-lait" : "border-encre/30 hover:bg-mousse",
            )}
          >
            <input type="radio" className="sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * /preparer — hot or iced → equipment at hand. Output: the validated recipe,
 * or an honest "not tested yet". "Nothing" points to a shaker: the powder
 * needs movement.
 */
export function PrepGuide({ drinks }: { drinks: Drink[] }) {
  const [temp, setTemp] = useState<"hot" | "iced">("iced");
  const [equipment, setEquipment] = useState<Equipment>("frother");

  const method: PrepMethod | null = equipment === "none" ? null : equipment;
  const match = method ? drinks.find((d) => d.temp === temp && d.methods.includes(method)) : undefined;

  return (
    <div className="space-y-8">
      <Choice
        legend="1. Chaud ou glacé ?"
        value={temp}
        onChange={setTemp}
        options={[
          { id: "hot", label: fr.gesture.hot },
          { id: "iced", label: fr.gesture.iced },
        ]}
      />
      <Choice legend="2. Qu'avez-vous sous la main ?" value={equipment} onChange={setEquipment} options={EQUIPMENT} />

      <div aria-live="polite" className="border-2 border-foret bg-lait p-5">
        {!method ? (
          <>
            <p className="text-xl font-semibold">La poudre a besoin de mouvement.</p>
            <p className="mt-2 measure">
              Le matcha ne se dissout pas : sans fouet, mousseur ou shaker, il forme des amas. Le plus simple pour démarrer est un
              shaker, ou un bocal avec un couvercle bien fermé.
            </p>
            <button
              type="button"
              onClick={() => setEquipment("shaker")}
              className="mt-4 min-h-11 border border-encre/30 px-4 text-sm font-semibold hover:bg-mousse"
            >
              Voir avec un shaker
            </button>
          </>
        ) : match && match.status === "validee" && match.measured ? (
          <>
            <p className="text-xl font-semibold">{match.name}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              {match.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm">
              {match.measured.liquidMl} ml · environ {match.measured.timeSec} s
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold">Cette combinaison n&apos;a pas encore été testée.</p>
            {match ? (
              <>
                <p className="mt-2 measure">
                  Voici la méthode prévue pour « {match.name} ». Les volumes et les temps seront publiés après nos tests.
                </p>
                <ol className="mt-3 list-decimal space-y-1 pl-5">
                  {match.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-2 measure">Nous ne recommandons pas cette combinaison tant qu&apos;elle n&apos;a pas été essayée.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
