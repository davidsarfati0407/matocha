import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { fr } from "@/content/i18n/fr";

export default function NotFound() {
  return (
    <section className="pt-28 pb-24">
      <Container wide>
        <div>
          <p className="text-sm font-semibold">Erreur 404</p>
          <h1 className="mt-4 text-5xl u-caps max-w-[14ch]">{fr.notFound.title}</h1>
          <p className="mt-6 text-lg">{fr.notFound.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/">{fr.notFound.home}</ButtonLink>
            <ButtonLink href="/daily-box" variant="outline">
              {fr.notFound.product}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
