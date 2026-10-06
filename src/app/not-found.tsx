import { Photo } from "@/components/media/Photo";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { fr } from "@/content/i18n/fr";

export default function NotFound() {
  return (
    <section className="pt-28 pb-24">
      <Container wide className="grid items-center gap-10 lg:grid-cols-2">
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
        <Photo id="matocha-sticks" sizes="(min-width: 1024px) 45vw, 100vw" ratio="aspect-[4/3]" />
      </Container>
    </section>
  );
}
