import type { Metadata } from "next";
import { PageIntro } from "@/components/blocks/PageIntro";
import { ProofValue } from "@/components/blocks/ProofValue";
import { Container } from "@/components/ui/Section";
import { getCatalog } from "@/lib/catalog";
import { getSiteMode } from "@/lib/mode";
import { proofText } from "@/lib/proof";

export const metadata: Metadata = {
  title: "Aide",
  description: "Contact, livraison et retours. En pré-lancement, rien n'est encore expédié : ces informations seront publiées avant l'ouverture des commandes.",
  alternates: { canonical: "/aide" },
};

export default async function AidePage() {
  const [catalog, mode] = await Promise.all([getCatalog(), getSiteMode()]);
  const email = catalog.company.contactEmail;
  const s = catalog.shipping;
  return (
    <>
      <PageIntro
        title="Aide"
        intro={mode === "sale" ? "Contact, livraison et retours." : "Le site est en pré-lancement : aucune commande n'est possible. Voici ce qui sera publié avant l'ouverture."}
      />
      <section className="pb-24">
        <Container wide className="grid gap-12 md:grid-cols-3">
          <div id="contact" className="scroll-mt-24">
            <h2 className="text-2xl u-caps">Contact</h2>
            <p className="mt-4">
              {email.status === "confirmed" && email.value ? (
                <a className="underline underline-offset-4" href={`mailto:${email.value}`}>{email.value}</a>
              ) : (
                "L'adresse de contact sera publiée avec la création de la société."
              )}
            </p>
          </div>
          <div id="livraison" className="scroll-mt-24">
            <h2 className="text-2xl u-caps">Livraison</h2>
            <dl className="mt-4 space-y-3">
              {([["Transporteur", s.carrier], ["Délais", s.delay], ["Tarifs", s.rates]] as const).map(([label, p]) => (
                <div key={label}>
                  <dt className="font-semibold">{label}</dt>
                  <dd><ProofValue value={proofText(p)} /></dd>
                </div>
              ))}
            </dl>
          </div>
          <div id="retours" className="scroll-mt-24">
            <h2 className="text-2xl u-caps">Retours</h2>
            <p className="mt-4">
              La politique de retour et le droit de rétractation applicables aux denrées alimentaires seront détaillés dans les conditions de vente,
              publiées avant la première commande.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
