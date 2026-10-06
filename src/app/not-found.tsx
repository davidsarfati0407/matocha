import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

/** An empty glass, and a way back. */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[76svh] items-center overflow-hidden py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] bottom-[-18%] w-[80vw] max-w-none sm:w-[44vw] lg:w-[28vw]"
      >
        <MatochaGlass variant="empty" className="opacity-[0.5]" />
      </div>

      <Container wide className="relative">
        <p className="u-label opacity-55">Error 404</p>
        <h1 className="text-h1 u-caps mt-6 max-w-[14ch]">
          Nothing in this glass.
        </h1>
        <p className="text-lead mt-6 max-w-[36ch] opacity-70">
          The link is broken or the page has moved. The matcha, thankfully, has
          not.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/product" variant="outline">
            Shop MATOCHA
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
