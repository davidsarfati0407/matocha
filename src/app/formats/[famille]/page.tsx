import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ProofValue } from "@/components/blocks/ProofValue";
import { FaqList } from "@/components/blocks/FaqList";
import { GestureScene } from "@/components/scenes/GestureScene";
import { FlavourScene } from "@/components/scenes/FlavourScene";
import { PackChooser } from "@/components/scenes/PackChooser";
import { ProductStick } from "@/components/brand/ProductStick";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { faq } from "@/content/faq";
import { fr } from "@/content/i18n/fr";
import { findRecipe, type FamilyId } from "@/content/catalog";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { proofText } from "@/lib/proof";
import { CONSENT_TEXT, CONSENT_VERSION, isWaitlistOpen } from "@/lib/waitlist/status";
import { ACCENT_HEX, familyStatusLabel, flavourOptions, gestureFamilies, packCards } from "@/lib/view";

const FAMILIES: FamilyId[] = ["poudre", "concentre"];

export const dynamicParams = false;
export function generateStaticParams() {
  return FAMILIES.map((famille) => ({ famille }));
}

export async function generateMetadata({ params }: PageProps<"/formats/[famille]">): Promise<Metadata> {
  const { famille } = await params;
  const catalog = await getCatalog();
  const family = catalog.families.find((f) => f.id === famille);
  if (!family) return {};
  return {
    title: family.name,
    description: `${family.promise} ${family.id === "concentre" ? "Format en développement : formule, portion et conservation à définir." : "Préparation, packs et composition, avec ce qui reste à confirmer."}`,
    alternates: { canonical: `/formats/${famille}` },
  };
}

export default async function FamilyPage({ params }: PageProps<"/formats/[famille]">) {
  const { famille } = await params;
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const family = catalog.families.find((f) => f.id === famille);
  if (!family) notFound();
  const recipe = findRecipe(catalog, family.id, "original")!;
  const isPowder = family.id === "poudre";
  const status = familyStatusLabel(family);

  /* Mandatory food information (INCO / DGCCRF), shown "à compléter" until confirmed. */
  const operator = proofText(catalog.company.responsibleOperator);
  const mandatory = [
    ["Dénomination", proofText(recipe.denomination)],
    ["Ingrédients", proofText(recipe.ingredients, (v) => v.join(", "))],
    ["Allergènes", proofText(recipe.allergens, (v) => (v.length ? v.join(", ") : "Aucun"))],
    ["Quantité nette", proofText(catalog.packs.find((p) => p.familyId === family.id)!.netQuantity)],
    ["Déclaration nutritionnelle", proofText(recipe.nutrition, (v) => Object.entries(v).map(([k, x]) => `${k} : ${x}`).join(" · "))],
    ["Opérateur responsable", operator],
    ["Origine", proofText(recipe.origin)],
    ["Mode d'emploi", proofText(recipe.preparation, () => family.gesture.join(", "))],
    ["Conservation", proofText(recipe.storage)],
  ] as const;

  const famFaq = faq.filter((f) => (isPowder ? ["comment-preparer", "sans-fouet", "chaud-froid", "conservation"] : ["poudre-ou-concentre", "sans-fouet", "quand"]).includes(f.id));

  return (
    <>
      <PageIntro title={family.name} intro={family.promise}>
        <div className="mt-6 flex flex-wrap gap-2">
          {status && <span className="concept-tag">{status}</span>}
          <span className="concept-tag">{fr.status.concept}</span>
        </div>
        <p className="mt-6 max-w-[56ch]">{family.gestureNote}</p>
      </PageIntro>

      {/* M10 — the pack in hand: three 2D concept views until the packaging is final. */}
      <section aria-labelledby="sachet" className="pb-16">
        <Container wide>
          <h2 id="sachet" className="text-3xl u-caps">Le sachet</h2>
          <ul className="mt-6 grid grid-cols-3 items-end gap-4 sm:max-w-xl">
            {(["face", "dos", "profil"] as const).map((view) => (
              <li key={view} className="text-center">
                <div className="mx-auto h-56 sm:h-72">
                  <ProductStick view={view} accent={ACCENT_HEX[recipe.accentToken]} format={isPowder ? "Poudre" : "Concentré"} />
                </div>
                <p className="mt-2 text-sm capitalize">{view}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">Aplats de concept : dimensions, film et mentions dépendent du fabricant retenu.</p>
        </Container>
      </section>

      <section aria-labelledby="preparation" className="sec">
        <Container wide>
          <h2 id="preparation" className="text-4xl u-caps">{family.gesture.join(". ")}.</h2>
          <div className="mt-10">
            <GestureScene families={gestureFamilies(catalog).filter((g) => g.id === family.id)} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="gouts" className="sec">
        <Container wide>
          <h2 id="gouts" className="text-4xl u-caps">{fr.flavour.title}</h2>
          <div className="mt-10">
            <FlavourScene options={flavourOptions(catalog, mode, family.id)} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="packs-title" id="packs" className="sec">
        <Container wide>
          <h2 id="packs-title" className="text-4xl u-caps">{fr.formats.packsTitle}</h2>
          <p className="mt-3 measure">{fr.formats.packsIntro}</p>
          <div className="mt-8">
            <PackChooser packs={packCards(catalog, mode, family.id)} accent={ACCENT_HEX[recipe.accentToken]} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="infos" className="sec">
        <Container wide className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="infos" className="text-4xl u-caps">Informations alimentaires</h2>
            <p className="mt-4 measure">
              Ces informations sont obligatoires avant toute vente à distance. Elles s&apos;affichent « {fr.status.pending} » tant qu&apos;elles ne
              sont pas confirmées par le fabricant et nos documents.
            </p>
          </div>
          <dl className="divide-y divide-encre/15 border-y border-encre/15">
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

      <section aria-labelledby="faq-famille" className="sec">
        <Container wide className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="faq-famille" className="text-4xl u-caps">Questions</h2>
            <div className="mt-6">
              <FaqList items={famFaq} />
            </div>
            <ButtonLink href="/faq" variant="outline" className="mt-6">
              {fr.final.allFaq}
            </ButtonLink>
          </div>
          {mode !== "sale" && (
            <div>
              <h2 className="text-3xl u-caps">{fr.final.ctaTitle}</h2>
              <p className="mt-3">{fr.final.ctaText}</p>
              <WaitlistForm open={isWaitlistOpen()} consentText={CONSENT_TEXT} consentVersion={CONSENT_VERSION} source={`formats-${family.id}`} className="mt-6" />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
