import { RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";

/** Shared masthead for interior pages. */
export function PageHeader({
  label,
  lines,
  intro,
}: {
  label: string;
  /** One entry per headline line; `italic` sets the serif accent word. */
  lines: { text: string; italic?: boolean }[];
  intro?: string;
}) {
  return (
    <header className="pt-28 pb-12 sm:pt-32 sm:pb-16">
      <Container wide>
        <EditorialLabel>{label}</EditorialLabel>

        <h1 className="text-h1 u-caps mt-8 max-w-[15ch]">
          {lines.map((line, index) => (
            <RevealLine key={line.text} delay={index * 0.08}>
              {line.italic ? (
                <span className="u-serif-it text-[1.05em] lowercase">
                  {line.text}
                </span>
              ) : (
                line.text
              )}
            </RevealLine>
          ))}
        </h1>

        {intro && (
          <p className="text-lead mt-8 max-w-[46ch] opacity-75">{intro}</p>
        )}
      </Container>
    </header>
  );
}
