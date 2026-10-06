"use client";

import { useState } from "react";
import { BoxScene } from "./BoxScene";
import { ButtonLink } from "@/components/ui/Button";
import { AddToCart } from "@/components/commerce/AddToCart";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

export type PackCard = {
  key: string;
  name: string;
  purpose: string;
  doses: number;
  dosesRange: string;
  dosesConfirmed: boolean;
  price: string | null;
  pricePerDrink: string | null;
  statusLabel: string;
  cta:
    | { kind: "buy"; label: string; line: { packKey: string; recipeKey: string; name: string; dosesPerUnit: number; unitPrice: number } }
    | { kind: "interest"; label: string; href: string }
    | { kind: "none" };
};

/** Pack cards generated from the catalogue, plus the M03 box for the selected one. */
export function PackChooser({ packs, accent }: { packs: PackCard[]; accent: string }) {
  const [index, setIndex] = useState(packs.length > 1 ? 1 : 0);
  const selected = packs[index];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div className="mx-auto w-full max-w-md">
        <BoxScene doses={selected.doses} accent={accent} packName={selected.name} />
        <p className="mt-2 text-sm">
          {fr.box.countLabel(selected.doses)}
          {!selected.dosesConfirmed && " — quantité de travail, à confirmer."}
        </p>
      </div>

      <ul className="grid gap-3" aria-label={fr.formats.packsTitle}>
        {packs.map((pack, i) => (
          <li key={pack.key}>
            <article
              className={cn(
                "grid gap-3 border-2 bg-lait p-4 transition-colors sm:grid-cols-[1fr_auto] sm:items-center",
                i === index ? "border-foret" : "border-encre/15",
              )}
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl u-caps">{pack.name}</h3>
                  <span className="concept-tag">{pack.statusLabel}</span>
                </div>
                <p className="mt-1 text-sm">{pack.purpose}</p>
                <p className="mt-2 text-sm">
                  <strong>{pack.dosesRange}</strong>
                  {" · "}
                  <span className={cn(!pack.price && "pending")}>{pack.price ?? fr.status.priceAbsent}</span>
                  {pack.pricePerDrink && ` · ${pack.pricePerDrink} par boisson`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  className="min-h-11 border border-encre/30 px-4 text-sm font-semibold hover:bg-mousse"
                >
                  {i === index ? "Boîte affichée" : "Voir la boîte"}
                </button>
                {pack.cta.kind === "interest" && (
                  <ButtonLink href={pack.cta.href} size="md">
                    {pack.cta.label}
                  </ButtonLink>
                )}
                {pack.cta.kind === "buy" && <AddToCart line={pack.cta.line} label={pack.cta.label} />}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
