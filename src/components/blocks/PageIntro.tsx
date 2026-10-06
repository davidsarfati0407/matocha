import { Container } from "@/components/ui/Section";

/** Interior page masthead: one heading, one short intro. No label stacked above. */
export function PageIntro({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="pt-28 pb-10 lg:pt-32 lg:pb-14">
      <Container wide>
        <h1 className="text-5xl u-caps max-w-[16ch]">{title}</h1>
        {intro && <p className="mt-6 max-w-[52ch] text-lg">{intro}</p>}
        {children}
      </Container>
    </header>
  );
}
