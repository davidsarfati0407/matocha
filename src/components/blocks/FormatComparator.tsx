import { FormatIcon } from "@/components/scenes/HeroScene";
import { ProofValue } from "./ProofValue";
import { packsOf, recipesOf, type Catalog } from "@/content/catalog";
import { fr } from "@/content/i18n/fr";
import { proofText } from "@/lib/proof";
import { familyStatusLabel, pricePerDrink } from "@/lib/view";

/** Short, honest comparison of the two families, generated from the catalogue. */
export function FormatComparator({
  catalog,
  rows: only,
}: {
  catalog: Catalog;
  /** Subset of rows for the short home version; all rows by default. */
  rows?: (keyof typeof fr.formats.rows)[];
}) {
  const cols = catalog.families.map((family) => {
    const recipe = recipesOf(catalog, family.id).find((r) => r.id === "original")!;
    const daily = packsOf(catalog, family.id).find((p) => p.id === "quotidien") ?? packsOf(catalog, family.id)[0];
    const ppd = daily ? pricePerDrink(daily) : null;
    return {
      family,
      cells: {
        preparation: { text: family.gesture.join(" · "), confirmed: true },
        equipment: proofText(family.equipment),
        serving: proofText(recipe.servingTotal, (v) => `${family.servingFormat}, ${v.value} ${v.unit}`),
        composition: proofText(recipe.ingredients, (v) => v.join(", ")),
        uses: { text: fr.formats.uses[family.id], confirmed: true },
        pricePerDrink: ppd ? { text: ppd, confirmed: true } : { text: fr.status.priceAbsent, confirmed: false },
        storage: proofText(recipe.storage),
      },
    };
  });
  const rows = only ?? (Object.keys(fr.formats.rows) as (keyof typeof fr.formats.rows)[]);

  return (
    <>
      {/* Phones: one card per family, same rows, no horizontal scroll. */}
      <div className="grid gap-4 md:hidden">
        {cols.map(({ family, cells }) => (
          <section key={family.id} aria-label={family.name} className="border-2 border-encre/15 bg-lait p-4">
            <h3 className="flex items-center text-xl u-caps">
              <FormatIcon kind={family.formatIcon} className="h-5 w-5" />
              {family.name}
            </h3>
            <p className="mt-1 text-sm">{family.promise}</p>
            {familyStatusLabel(family) && <span className="mt-2 inline-block concept-tag">{familyStatusLabel(family)}</span>}
            <dl className="mt-3 divide-y divide-encre/10">
              {rows.map((row) => (
                <div key={row} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
                  <dt className="font-semibold">{fr.formats.rows[row]}</dt>
                  <dd>
                    <ProofValue value={cells[row]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    <div className="hidden md:block">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{fr.formats.compareCaption}</caption>
        <thead>
          <tr className="border-b-2 border-encre">
            <td className="w-[22%]" />
            {cols.map(({ family }) => (
              <th key={family.id} scope="col" className="py-3 pr-4 align-bottom">
                <span className="flex items-center gap-1 text-xl u-caps">
                  <FormatIcon kind={family.formatIcon} className="h-5 w-5" />
                  {family.name}
                </span>
                <span className="mt-1 block text-sm font-normal">{family.promise}</span>
                {familyStatusLabel(family) && <span className="mt-2 inline-block concept-tag">{familyStatusLabel(family)}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="border-b border-encre/15 align-top">
              <th scope="row" className="py-2.5 pr-4 text-sm font-semibold">
                {fr.formats.rows[row]}
              </th>
              {cols.map(({ family, cells }) => (
                <td key={family.id} className="py-2.5 pr-4 text-[0.95rem]">
                  <ProofValue value={cells[row]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
