import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ProofValue } from "@/components/blocks/ProofValue";
import { Container } from "@/components/ui/Section";
import { getCatalog } from "@/lib/catalog";
import { proofText } from "@/lib/proof";
import type { Catalog } from "@/content/catalog/types";

/**
 * Legal templates. Each is marked "à compléter" while the company does not
 * exist: no fictitious company, registration or address is ever printed.
 */
const PAGES = {
  "mentions-legales": { title: "Mentions légales", intro: "Informations sur l'éditeur et l'hébergeur du site." },
  cgv: { title: "Conditions générales de vente", intro: "Elles seront publiées avant l'ouverture des commandes. Aucune commande ne peut être passée tant qu'elles ne sont pas en vigueur." },
  confidentialite: { title: "Politique de confidentialité", intro: "Quelles données nous collectons, pourquoi, et vos droits." },
  cookies: { title: "Cookies", intro: "Ce que le site dépose dans votre navigateur." },
} as const;

type Slug = keyof typeof PAGES;

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[page]">): Promise<Metadata> {
  const { page } = await params;
  const p = PAGES[page as Slug];
  return p ? { title: p.title, description: p.intro, alternates: { canonical: `/legal/${page}` } } : {};
}

function Draft() {
  return <p className="mt-2 inline-block concept-tag">À compléter avant le lancement</p>;
}

function Body({ slug, catalog }: { slug: Slug; catalog: Catalog }) {
  const c = catalog.company;
  if (slug === "mentions-legales") {
    const rows = [
      ["Éditeur", proofText(c.responsibleOperator)],
      ["Forme juridique", proofText(c.legalForm)],
      ["Immatriculation", proofText(c.registration)],
      ["Adresse", proofText(c.address)],
      ["Directeur de la publication", proofText(c.publicationDirector)],
      ["Contact", proofText(c.contactEmail)],
      ["Hébergeur", proofText(c.host)],
    ] as const;
    return (
      <dl className="divide-y divide-encre/15 border-y border-encre/15">
        {rows.map(([label, v]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[16rem_1fr]">
            <dt className="font-semibold">{label}</dt>
            <dd><ProofValue value={v} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  if (slug === "confidentialite") {
    return (
      <div className="u-prose measure">
        <Draft />
        <p>
          <strong>Données collectées aujourd&apos;hui.</strong> Uniquement si vous vous inscrivez pour être prévenu du lancement : votre adresse
          e-mail, les sujets qui vous intéressent, la version du texte de consentement accepté, la date, et une empreinte irréversible (hachage) de
          votre adresse IP pour limiter les abus. Votre IP n&apos;est jamais conservée en clair.
        </p>
        <p>
          <strong>Finalité.</strong> Vous prévenir du lancement de la Daily Box. Base légale : votre consentement, donné par une case non
          pré-cochée, puis confirmé par e-mail (double opt-in).
        </p>
        <p>
          <strong>Vos droits.</strong> Désinscription en un clic depuis chaque e-mail. Droits d&apos;accès, de rectification et d&apos;effacement :
          l&apos;adresse de contact sera publiée avec la création de la société.
        </p>
        <p>
          <strong>À compléter :</strong> identité du responsable de traitement, durée de conservation, sous-traitants (hébergement, base de données,
          envoi d&apos;e-mails) et transferts hors UE, une fois les services choisis.
        </p>
      </div>
    );
  }
  if (slug === "cookies") {
    return (
      <div className="u-prose measure">
        <p>Le site ne dépose aucun cookie publicitaire ni de mesure d&apos;audience.</p>
        <p>
          Le seul cookie technique est celui de session de l&apos;espace d&apos;administration, réservé à l&apos;équipe. En mode vente, votre panier
          sera conservé dans le stockage local de votre navigateur, sans quitter votre appareil.
        </p>
        <p>Si un traceur non essentiel est ajouté un jour, cette page et un bandeau de consentement arriveront avec lui.</p>
      </div>
    );
  }
  return (
    <div className="u-prose measure">
      <Draft />
      <p>
        À rédiger avec un professionnel : identification du vendeur, produits et informations alimentaires, prix TTC et frais de livraison, paiement,
        livraison, droit de rétractation et ses exceptions pour les denrées, garanties, médiation de la consommation, données personnelles.
      </p>
    </div>
  );
}

export default async function LegalPage({ params }: PageProps<"/legal/[page]">) {
  const { page } = await params;
  const p = PAGES[page as Slug];
  if (!p) notFound();
  const catalog = await getCatalog();
  return (
    <>
      <PageIntro title={p.title} intro={p.intro} />
      <section className="pb-24">
        <Container wide>
          <Body slug={page as Slug} catalog={catalog} />
        </Container>
      </section>
    </>
  );
}
