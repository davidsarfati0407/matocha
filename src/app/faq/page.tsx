import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { FaqList, faqJsonLd } from "@/components/blocks/FaqList";
import { Container } from "@/components/ui/Section";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Préparation, liquides, chaud ou froid, sucre, allergènes, conservation, livraison : les réponses, sans promesses non vérifiées.",
  alternates: { canonical: "/faq" },
};

const TOPICS = [
  { id: "preparation", title: "La préparation" },
  { id: "produit", title: "Le produit" },
  { id: "commande", title: "Commander" },
] as const;

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }} />
      <PageIntro title="Questions fréquentes" intro="Si une réponse dépend d'une donnée pas encore confirmée, nous le disons." />
      <section className="pb-24">
        <Container wide className="max-w-4xl space-y-14">
          {TOPICS.map((t) => (
            <div key={t.id}>
              <h2 className="text-3xl u-caps">{t.title}</h2>
              <div className="mt-5">
                <FaqList items={faq.filter((f) => f.topic === t.id)} />
              </div>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
