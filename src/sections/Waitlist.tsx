import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { Reveal, RevealLine } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";

/**
 * FIRST POUR.
 *
 * MATOCHA has not shipped, so there is nothing honest to quote. No
 * testimonials, no review counts, no logos — an invitation instead of invented
 * proof.
 */
export function Waitlist() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-black sec text-ivory"
    >
      <Container wide>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <EditorialLabel index="13" className="text-ivory">Pre-launch</EditorialLabel>
            </Reveal>

            <h2 className="text-h2 u-caps mt-5 max-w-[16ch]">
              <RevealLine>First pour.</RevealLine>
            </h2>

            <Reveal delay={0.12}>
              <p className="text-lead mt-8 max-w-[32ch] text-ivory/80">
                The first MATOCHA production is coming. Join the list.
              </p>

              <WaitlistForm
                className="mt-10 max-w-xl"
                size="lg"
                tone="light"
                source="waitlist"
                buttonLabel="Join the waitlist"
              />

              <p className="u-label mt-5 text-ivory/50">
                No spam. Just matcha.
              </p>
            </Reveal>
          </div>

          <Reveal
            delay={0.2}
            className="hidden lg:col-span-4 lg:col-start-9 lg:block"
          >
            <div className="relative flex h-full items-center justify-center overflow-hidden bg-green p-10">
              <div className="h-[86%]">
                <MatochaGlass variant="pour" ink="#F3EFE5" />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
