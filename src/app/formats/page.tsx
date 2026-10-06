import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/blocks/PageIntro";
import { FormatComparator } from "@/components/blocks/FormatComparator";
import { FormatIcon } from "@/components/scenes/HeroScene";
import { ProductStick } from "@/components/brand/ProductStick";
import { Container } from "@/components/ui/Section";
import { fr } from "@/content/i18n/fr";
import { getCatalog } from "@/lib/catalog";
import { familyStatusLabel } from "@/lib/view";

export const metadata: Metadata = {
  title: "Les formats",
  description: "Poudre prédosée ou concentré : deux formats Matocha, comparés honnêtement. La poudre est prioritaire, le concentré est en développement.",
  alternates: { canonical: "/formats" },
};

export default async function FormatsPage() {
  const catalog = await getCatalog();
  return (
    <>
      <PageIntro title={fr.formats.title} intro={fr.formats.intro} />
      <section className="pb-20">
        <Container wide>
          <FormatComparator catalog={catalog} />
          <ul className="mt-16 grid gap-6 md:grid-cols-2">
            {catalog.families.map((family) => (
              <li key={family.id}>
                <Link
                  href={`/formats/${family.id}`}
                  className="group grid grid-cols-[auto_1fr] items-center gap-6 border-2 border-encre/15 bg-lait p-6 transition-colors hover:border-foret"
                >
                  <div className="h-40">
                    <ProductStick format={family.id === "poudre" ? "Poudre" : "Concentré"} title={`${family.name}, visuel de concept`} />
                  </div>
                  <div>
                    <p className="flex items-center text-2xl u-caps">
                      <FormatIcon kind={family.formatIcon} className="h-5 w-5" />
                      {family.name}
                    </p>
                    <p className="mt-2">{family.promise}</p>
                    {familyStatusLabel(family) && <span className="mt-3 inline-block concept-tag">{familyStatusLabel(family)}</span>}
                    <span className="mt-4 block font-semibold underline decoration-matcha decoration-2 underline-offset-4 group-hover:decoration-foret">
                      {fr.formats.seeFamily}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
