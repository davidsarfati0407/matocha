import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { Container } from "@/components/ui/Section";
import { recipesOf } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { PENDING_LABEL } from "@/lib/proof";
import type { Proof } from "@/content/catalog/types";

export const metadata: Metadata = {
  title: "Notre produit",
  description: "Ce qu'on sait, et ce qu'on vérifie encore : origine, fabrication, conservation. La transparence plutôt que des badges.",
  alternates: { canonical: "/notre-produit" },
};

type Item = { label: string; proof: Proof<unknown>; known?: string };

export default async function NotreProduitPage() {
  const catalog = await getCatalog();
  const poudre = recipesOf(catalog, "poudre").find((r) => r.id === "original")!;
  const concentre = recipesOf(catalog, "concentre").find((r) => r.id === "original")!;

  const items: Item[] = [
    { label: "Origine du matcha", proof: poudre.origin },
    { label: "Fournisseur et fabricant", proof: { value: null, status: "to_confirm", target: "Fournisseurs en cours d'exploration ; aucun n'est retenu" } },
    { label: "Composition de la poudre Original", proof: poudre.ingredients },
    { label: "Matcha par portion", proof: poudre.matchaPerServingG },
    { label: "Conservation de la poudre", proof: poudre.storage },
    { label: "Formule du concentré", proof: concentre.ingredients, known: undefined },
    { label: "Conservation du concentré", proof: concentre.storage },
    { label: "Caféine par portion", proof: poudre.caffeineMg },
    { label: "Packaging et recyclabilité", proof: { value: null, status: "to_confirm" } },
  ];

  const known = [
    "Matocha est une marque créée par David Sarfati et Gaspard, deux amis qui veulent rendre le matcha plus simple au quotidien.",
    "Deux formats sont développés : une poudre prédosée en stick, prioritaire, et un concentré à verser, en parallèle.",
    "La poudre de matcha ne se dissout pas : elle reste en suspension et demande un fouet, un mousseur ou un shaker.",
    "Le stick en poudre existe déjà chez d'autres marques. Ce que nous voulons construire : un geste vraiment facile, un goût qui donne envie de recommencer, et un premier achat accessible.",
    "Rien n'est en vente aujourd'hui. Le site est en pré-lancement.",
  ];

  return (
    <>
      <PageIntro title="Notre produit" intro="Nous préférons vous dire où nous en sommes plutôt qu'afficher des badges. Cette page évolue à chaque document reçu." />
      <section className="pb-24">
        <Container wide className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl u-caps">Ce qu&apos;on sait</h2>
            <ul className="mt-6 space-y-4">
              {known.map((k) => (
                <li key={k} className="border-l-4 border-matcha pl-4">{k}</li>
              ))}
              {items.filter((i) => i.proof.status === "confirmed").map((i) => (
                <li key={i.label} className="border-l-4 border-matcha pl-4">
                  <strong>{i.label} :</strong> {String(i.proof.value)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl u-caps">Ce qu&apos;on vérifie encore</h2>
            <ul className="mt-6 divide-y divide-encre/15 border-y border-encre/15">
              {items.filter((i) => i.proof.status !== "confirmed").map((i) => (
                <li key={i.label} className="py-3">
                  <p className="font-semibold">{i.label}</p>
                  <p className="pending">{PENDING_LABEL}</p>
                  {i.proof.target && <p className="text-sm">Objectif : {i.proof.target}</p>}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
