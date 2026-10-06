import { Marquee } from "@/components/ui/Marquee";

/**
 * A band of almost-black straight after the hero: the first hard colour break
 * on the page, and instant density.
 */
const ITEMS = [
  "100% Japanese matcha",
  "2g per stick",
  "30 servings",
  "No sugar",
  "No flavourings",
  "No additives",
];

export function BrandStrip() {
  return (
    <section
      aria-label="Product highlights"
      className="border-y border-black bg-black py-5 text-ivory sm:py-7"
    >
      <Marquee items={ITEMS} duration={64} separatorClassName="text-matcha" />
      <p className="sr-only">{ITEMS.join(". ")}.</p>
    </section>
  );
}
