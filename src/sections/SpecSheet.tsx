import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { Reveal } from "@/components/ui/Reveal";
import { Container, EditorialLabel } from "@/components/ui/Section";
import { MicroMark } from "@/components/ui/Annotation";
import { brand, sourcingRows } from "@/data/brand";
import { dailyBox } from "@/data/product";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The specification sheet — a fashion product plate, not a nutrition panel.
 * Dense grid, hairline rules, small type, one glass holding the corner.
 */
const SPECS: [string, string][] = [
  ["Contents", `${brand.sticksPerBox} sticks`],
  ["Per stick", `${brand.servingWeight}${brand.servingUnit}`],
  ["Total", `${brand.netWeight}${brand.servingUnit}`],
  ["Ingredients", "100% Japanese matcha"],
  ["Sugar", "None"],
  ["Flavourings", "None"],
  ["Additives", "None"],
  ["Format", "Individually sealed sticks"],
];

export function SpecSheet() {
  const rows = sourcingRows();

  return (
    <section className="border-y border-black/12 bg-ivory sec-tight">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/20 pb-4">
          <div>
            <EditorialLabel index="08">Specification</EditorialLabel>
            <p className="text-h3 u-caps mt-4">
              MATOCHA / Daily Box
            </p>
          </div>
          <div className="flex items-center gap-6">
            <MicroMark>{formatPrice(dailyBox.price)}</MicroMark>
            <span className="block h-10 w-10">
              <MatochaGlass variant="classic" />
            </span>
          </div>
        </div>

        <Reveal>
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {SPECS.map(([label, value]) => (
              <div
                key={label}
                className="border-b border-black/12 py-5 pr-4 sm:border-r sm:last:border-r-0"
              >
                <dt className="u-label opacity-50">{label}</dt>
                <dd className="mt-2 text-[1.05rem]">{value}</dd>
              </div>
            ))}
          </dl>

          <dl className="grid grid-cols-2 sm:grid-cols-5">
            {rows.map((row) => (
              <div key={row.label} className="border-b border-black/12 py-5 pr-4">
                <dt className="u-label opacity-50">{row.label}</dt>
                <dd
                  className={cn(
                    "mt-2 text-[1.05rem]",
                    !row.confirmed && "u-serif-it opacity-40",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <MicroMark>Japan</MicroMark>
          <MicroMark>Matcha</MicroMark>
          <MicroMark>{brand.sticksPerBox} × {brand.servingWeight}{brand.servingUnit}</MicroMark>
          <MicroMark className="hidden sm:inline">Daily</MicroMark>
        </div>
      </Container>
    </section>
  );
}
