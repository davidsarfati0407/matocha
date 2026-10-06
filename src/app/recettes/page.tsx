import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { Container } from "@/components/ui/Section";
import { DRINK_STATUS_LABEL, drinks } from "@/content/drinks";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Recettes",
  description: "Les boissons qu'on prépare avec Matocha, et le statut de test de chacune.",
  alternates: { canonical: "/recettes" },
};

const METHOD: Record<string, string> = { whisk: "fouet", frother: "mousseur", shaker: "shaker", spoon: "cuillère" };

export default async function RecettesPage() {
  const catalog = await getCatalog();
  const famName = (id: string) => catalog.families.find((f) => f.id === id)?.name ?? id;
  return (
    <>
      <PageIntro
        title="Recettes"
        intro="Chaque recette porte son statut. Tant qu'elle n'est pas validée par nos tests, nous donnons la méthode, pas de volumes ni de temps."
      />
      <section className="pb-24">
        <Container wide>
          <ul className="grid gap-6 md:grid-cols-2">
            {drinks.map((d) => (
              <li key={d.id} id={d.id} className="scroll-mt-24 border-2 border-encre/15 bg-lait p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-2xl u-caps">{d.name}</h2>
                  <span className="concept-tag">{DRINK_STATUS_LABEL[d.status]}</span>
                </div>
                <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
                  <dt className="font-semibold">Formats</dt>
                  <dd>{d.families.map(famName).join(", ")}</dd>
                  <dt className="font-semibold">Matériel</dt>
                  <dd>{d.methods.map((m) => METHOD[m]).join(", ")}</dd>
                  <dt className="font-semibold">Liquides</dt>
                  <dd>{d.liquids.join(", ")}</dd>
                  <dt className="font-semibold">Volumes</dt>
                  <dd className={d.measured ? "" : "pending"}>{d.measured ? `${d.measured.liquidMl} ml` : "En cours de test"}</dd>
                </dl>
                <ol className="mt-4 list-decimal space-y-1 pl-5">
                  {d.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
