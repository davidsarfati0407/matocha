import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

/* Kept as a route, out of the navigation and out of the index while empty. */
export const metadata: Metadata = {
  title: "Journal",
  description: "Le journal de Matocha ouvrira avec ses premiers articles.",
  robots: { index: false, follow: true },
};

export default function JournalPage() {
  return (
    <>
      <PageIntro title="Journal" intro="Pas encore d'article. Nous préférons une page vide à du contenu de remplissage." />
      <section className="pb-24">
        <Container wide>
          <ButtonLink href="/#inscription">Être prévenu du lancement</ButtonLink>
        </Container>
      </section>
    </>
  );
}
