import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

/** Shared layout for the short waitlist status pages. */
export function StatusPage({
  title,
  body,
  cta = { href: "/", label: "Retour à l'accueil" },
  secondary,
}: {
  title: string;
  body: string[];
  cta?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="pt-32 pb-28 sm:pt-40 sm:pb-36">
      <Container>
        <h1 className="text-h1 u-caps max-w-[16ch]">{title}</h1>
        <div className="mt-8 max-w-[52ch] space-y-4">
          {body.map((p) => (
            <p key={p} className="text-lead opacity-80">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
          {secondary && (
            <ButtonLink href={secondary.href} variant="outline">
              {secondary.label}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  );
}
