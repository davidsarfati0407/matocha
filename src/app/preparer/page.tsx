import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { PrepGuide } from "@/components/scenes/PrepGuide";
import { Container } from "@/components/ui/Section";
import { drinks } from "@/content/drinks";
import { fr } from "@/content/i18n/fr";
import { recipesOf } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { ACCENT_HEX, familyStatusLabel } from "@/lib/view";

export const metadata: Metadata = {
  title: "Comment préparer",
  description: "Choisissez le format, chaud ou glacé, et ce que vous avez sous la main : on vous montre la préparation, ou on vous dit honnêtement qu'elle n'est pas encore testée.",
  alternates: { canonical: "/preparer" },
};

export default async function PreparerPage() {
  const catalog = await getCatalog();
  const families = catalog.families.map((family) => {
    const r = recipesOf(catalog, family.id).find((x) => x.id === "original")!;
    return {
      id: family.id,
      name: family.name,
      status: familyStatusLabel(family),
      liquidColor: r.liquidColor,
      matterColor: r.matterColor,
      accent: ACCENT_HEX[r.accentToken],
    };
  });
  return (
    <>
      <PageIntro title="Comment préparer" intro={`${fr.gesture.intro} Les volumes exacts sont en cours de test : nous les publierons une fois mesurés.`} />
      <section className="pb-24">
        <Container wide>
          <PrepGuide drinks={drinks} families={families} />
        </Container>
      </section>
    </>
  );
}
