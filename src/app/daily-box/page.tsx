import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ProofValue } from "@/components/blocks/ProofValue";
import { FaqList } from "@/components/blocks/FaqList";
import { ProductCard } from "@/components/blocks/ProductCard";
import { Photo } from "@/components/media/Photo";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { faq } from "@/content/faq";
import { fr } from "@/content/i18n/fr";
import { theProduct } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { proofText } from "@/lib/proof";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import { productView } from "@/lib/view";

export const metadata: Metadata = {
  title: "La Daily Box",
  description:
    "Matcha Original en poudre : 30 sticks de 2 g dans la Daily Box. Préparation, composition et informations, avec ce qui reste à confirmer.",
  alternates: { canonical: "/daily-box" },
};

export default async function DailyBoxPage() {
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const { pack, recipe, family } = theProduct(catalog);
  const product = productView(catalog, mode);

  /* Mandatory food information (INCO / DGCCRF), shown "à compléter" until confirmed. */
  const mandatory = [
    ["Dénomination", proofText(recipe.denomination)],
    ["Ingrédients", proofText(recipe.ingredients, (v) => v.join(", "))],
    ["Allergènes", proofText(recipe.allergens, (v) => (v.length ? v.join(", ") : "Aucun"))],
    ["Quantité nette", proofText(pack.netQuantity)],
    ["Déclaration nutritionnelle", proofText(recipe.nutrition, (v) => Object.entries(v).map(([k, x]) => `${k} : ${x}`).join(" · "))],
    ["Opérateur responsable", proofText(catalog.company.responsibleOperator)],
    ["Origine", proofText(recipe.origin)],
    ["Mode d'emploi", proofText(recipe.preparation, () => family.gesture.join(", "))],
    ["Conservation", proofText(recipe.storage)],
  ] as const;

  const productFaq = faq.filter((f) => ["comment-preparer", "sans-fouet", "chaud-froid", "conservation", "quand"].includes(f.id));

  return (
    <>
      <PageIntro title={pack.name} intro={fr.product.intro} />

      <section aria-labelledby="acheter-title" className="pb-16">
        <Container wide className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Photo id="matocha-latte" priority sizes="(min-width: 1024px) 45vw, 100vw" />
          <div>
            <h2 id="acheter-title" className="sr-only">
              {product.name}
            </h2>
            <ProductCard product={product} />
            <p className="mt-6 measure">{family.gestureNote}</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="geste" className="sec">
        <Container wide>
          <div>
            <h2 id="geste" className="text-4xl u-caps">{fr.gesture.title}</h2>
            <ol className="mt-8 space-y-4">
              {family.gesture.map((step, i) => (
                <li key={step} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-encre/15 pt-4">
                  <span className="font-serif text-4xl leading-none">{i + 1}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{step}</h3>
                    <p className="mt-1 measure">{fr.gesture.stepPowder[i]}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm">{fr.gesture.volumesPending}</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="infos" className="sec">
        <Container wide className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="infos" className="text-4xl u-caps">Informations alimentaires</h2>
            <p className="mt-4 measure">
              Ces informations sont obligatoires avant toute vente à distance. Elles s&apos;affichent « {fr.status.pending} » tant
              qu&apos;elles ne sont pas confirmées par le fabricant et nos documents.
            </p>
          </div>
          <dl className="self-start divide-y divide-encre/15 border-y border-encre/15">
            {mandatory.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[11rem_1fr] gap-4 py-3">
                <dt className="font-semibold">{label}</dt>
                <dd>
                  <ProofValue value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="faq-produit" className="sec">
        <Container wide className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="faq-produit" className="text-4xl u-caps">Questions</h2>
            <div className="mt-6">
              <FaqList items={productFaq} />
            </div>
            <ButtonLink href="/faq" variant="outline" className="mt-6">
              {fr.final.allFaq}
            </ButtonLink>
          </div>
          {mode !== "sale" && (
            <div id="inscription" className="scroll-mt-24">
              <h2 className="text-3xl u-caps">{fr.final.ctaTitle}</h2>
              <p className="mt-3">{fr.final.ctaText}</p>
              <WaitlistForm open={isWaitlistOpen()} consentText={CONSENT_TEXT} consentVersion={CONSENT_VERSION} source="daily-box" className="mt-6" />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
