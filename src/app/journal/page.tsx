import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LifestyleFrame } from "@/components/brand/LifestyleFrame";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { Reveal } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes on matcha, sourcing and the making of MATOCHA. The first entries publish with the first production run.",
  alternates: { canonical: "/journal" },
};

/**
 * The journal is intentionally empty. Placeholder articles would be invented
 * content; the page states what is coming instead.
 */
const planned = [
  {
    title: "Choosing a producer",
    note: "How we are tasting and selecting the first lot.",
    tone: "ivory" as const,
    lightX: "76%",
  },
  {
    title: "Why 2g",
    note: "The portion behind one properly made bowl.",
    tone: "sand" as const,
    lightX: "26%",
  },
  {
    title: "Matcha away from home",
    note: "Kettles, hotel rooms and airport lounges.",
    tone: "green" as const,
    lightX: "62%",
  },
];

export default function JournalPage() {
  return (
    <>
      <PageHeader
        label="Journal"
        lines={[{ text: "Notes" }, { text: "in progress." }]}
        intro="The journal opens with the first MATOCHA production. Three pieces are being written now — no filler in the meantime."
      />

      <section className="pb-24 sm:pb-32">
        <Container wide>
          <ul className="grid gap-8 sm:grid-cols-3">
            {planned.map((entry, index) => (
              <Reveal as="li" key={entry.title} delay={index * 0.08}>
                <LifestyleFrame
                  tone={entry.tone}
                  ratio="4 / 3"
                  label="Coming soon"
                  lightX={entry.lightX}
                  subject="none"
                />
                <h2 className="text-h3 u-caps mt-5">{entry.title}</h2>
                <p className="mt-2 max-w-[28ch] opacity-65">{entry.note}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-20 border-t border-black/12 pt-12">
            <h2 className="text-h2 u-caps max-w-[14ch]">
              Be told when the first entry lands.
            </h2>
            <WaitlistForm
              className="mt-8 max-w-xl"
              size="lg"
              source="journal"
              buttonLabel="Join the list"
            />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
