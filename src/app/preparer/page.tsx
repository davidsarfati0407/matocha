import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { PrepGuide } from "@/components/blocks/PrepGuide";
import { Container } from "@/components/ui/Section";
import { drinks } from "@/content/drinks";
import { fr } from "@/content/i18n/fr";

export const metadata: Metadata = {
  title: "Comment préparer",
  description:
    "Chaud ou glacé, et ce que vous avez sous la main : on vous montre la préparation, ou on vous dit honnêtement qu'elle n'est pas encore testée.",
  alternates: { canonical: "/preparer" },
};

export default function PreparerPage() {
  return (
    <>
      <PageIntro
        title="Comment préparer"
        intro={`${fr.gesture.intro} Les volumes exacts sont en cours de test : nous les publierons une fois mesurés.`}
      />
      <section className="pb-24">
        <Container wide>
          <div className="max-w-4xl">
            <PrepGuide drinks={drinks} />
          </div>
        </Container>
      </section>
    </>
  );
}
