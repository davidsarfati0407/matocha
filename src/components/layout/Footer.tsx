import Link from "next/link";
import { WordmarkGiant } from "@/components/brand/MatochaLogo";
import { Container } from "@/components/ui/Section";
import type { Catalog } from "@/content/catalog/types";
import { fr } from "@/content/i18n/fr";
import { proofText } from "@/lib/proof";

/**
 * Footer: real legal facts only (each one a Proof), confirmed social accounts
 * only — the list is empty until David adds real ones through the Ops API —
 * and the language. French is the only complete language, so it is stated,
 * not offered as a fake switch.
 */
export function Footer({ catalog }: { catalog: Catalog }) {
  const year = new Date().getFullYear();
  const operator = proofText(catalog.company.responsibleOperator);
  const email = catalog.company.contactEmail;

  return (
    <footer className="on-dark relative overflow-hidden bg-foret text-lait">

      <Container wide className="relative pt-12 pb-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl u-caps max-w-[16ch]">{fr.footer.signature}</p>
            <div className="mt-6 text-sm text-lait/85">
              {catalog.socials.length > 0 ? (
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {catalog.socials.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline-offset-4 hover:underline">
                        {s.network} · {s.handle}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{fr.footer.noSocial}</p>
              )}
            </div>
          </div>

          <nav aria-label={fr.footer.help}>
            <h2 className="u-label text-lait/75">{fr.footer.help}</h2>
            <ul className="mt-2">
              {[...fr.nav.primary, ...fr.footer.helpLinks].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={fr.footer.legal}>
            <h2 className="u-label text-lait/75">{fr.footer.legal}</h2>
            <ul className="mt-2">
              {fr.footer.legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm text-lait/85">
            <h2 className="u-label text-lait/75">Éditeur</h2>
            <p className="mt-4">
              {operator.confirmed ? operator.text : "Société en cours de création — informations publiées dès son immatriculation."}
            </p>
            {email.status === "confirmed" && email.value && (
              <p className="mt-2">
                <a href={`mailto:${email.value}`} className="underline underline-offset-4">
                  {email.value}
                </a>
              </p>
            )}
            <h2 className="u-label mt-6 text-lait/75">{fr.footer.language}</h2>
            <p className="mt-2" lang="fr">
              {fr.footer.languageFr}
            </p>
          </div>
        </div>

        <div className="mt-10" aria-hidden="true">
          <WordmarkGiant className="text-[clamp(3.4rem,15vw,12rem)]" />
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-lait/20 pt-6 text-xs text-lait/75 sm:flex-row sm:justify-between">
          <p>© {year} Matocha</p>
          <p>Les visuels du site sont des visuels de concept tant que le produit n&apos;est pas fabriqué.</p>
        </div>
      </Container>
    </footer>
  );
}
