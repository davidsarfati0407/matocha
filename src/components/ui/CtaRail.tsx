import { ButtonLink } from "./Button";
import { Container } from "./Section";
import { MicroMark } from "./Annotation";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * A slim rail that closes a section: a line of product facts, a glass, and a
 * way to buy. It exists to keep the page from ending each block on empty
 * ground, and to keep a purchase path within reach the whole way down.
 */
export function CtaRail({
  label,
  href = "/product",
  cta = "Shop MATOCHA",
  tone = "dark",
  className,
}: {
  label: string;
  href?: string;
  cta?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";

  return (
    <Container wide className={className}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-5 border-t pt-6",
          light ? "border-ivory/25" : "border-black/20",
        )}
      >
        <div className="flex items-center gap-4">
          <span className="block h-9 w-9 shrink-0">
            <MatochaGlass
              variant="classic"
              ink={light ? "#F3EFE5" : undefined}
            />
          </span>
          <p className="u-caps max-w-[28ch] text-sm sm:text-base">{label}</p>
        </div>

        <div className="flex items-center gap-5">
          <MicroMark className={light ? "text-ivory" : ""}>
            {brand.sticksPerBox} × {brand.servingWeight}
            {brand.servingUnit} — {formatPrice(brand.price)}
          </MicroMark>
          <ButtonLink
            href={href}
            size="md"
            variant={light ? "ivory" : "solid"}
          >
            {cta}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
