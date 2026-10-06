import Link from "next/link";
import { WordmarkGiant } from "@/components/brand/MatochaLogo";
import { MatochaGlass, MatochaWave } from "@/components/brand/MatochaGlass";
import { MatochaPattern } from "@/components/brand/MatochaPattern";
import { Container } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { MicroMark } from "@/components/ui/Annotation";
import { brand } from "@/data/brand";
import { footerColumns, site } from "@/data/site";

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
];

/**
 * The last poster of the site: pattern, giant wordmark, a glass cropped by the
 * bottom edge, and everything a footer owes the visitor — newsletter, nav,
 * social, legal, and the facts one more time.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-green text-ivory">
      {/* Pattern band opening the footer */}
      <div aria-hidden="true" className="relative h-20 overflow-hidden border-b border-ivory/15 sm:h-24">
        <MatochaPattern color="#F3EFE5" opacity={0.14} scale={0.85} />
      </div>

      {/* The glass, cropped by the bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[2%] bottom-[-16%] w-[62vw] max-w-none sm:w-[34vw] lg:w-[22vw]"
      >
        <MatochaGlass variant="classic" ink="#F3EFE5" className="opacity-[0.28]" />
      </div>

      <Container wide className="relative pt-14 pb-10 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-xl">
            <p className="u-label opacity-60">Newsletter</p>
            <p className="text-h3 mt-4 max-w-[20ch] font-normal">
              Slow letters about matcha, once a month.
            </p>
            <WaitlistForm
              tone="light"
              className="mt-6"
              buttonLabel="Sign up"
              source="footer"
            />

            <MatochaWave className="mt-10 h-4 max-w-[10rem]" color="#79A84B" />

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {SOCIAL.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="u-label opacity-70 transition-opacity hover:opacity-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4"
          >
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="u-label opacity-55">{column.title}</h2>
                <ul className="mt-5 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-[0.95rem] opacity-85 transition-opacity duration-300 hover:opacity-100"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Product facts, one last time */}
        <dl className="mt-14 grid grid-cols-2 border-t border-ivory/20 sm:grid-cols-4">
          {[
            ["Product", brand.productName],
            ["Contents", `${brand.sticksPerBox} × ${brand.servingWeight}${brand.servingUnit}`],
            ["Net weight", `${brand.netWeight}${brand.servingUnit}`],
            ["Origin", brand.sourcing.origin ?? "To be confirmed"],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-ivory/15 py-4 pr-4">
              <dt className="u-label opacity-50">{label}</dt>
              <dd className="mt-1.5 text-note">{value}</dd>
            </div>
          ))}
        </dl>

        {/* The wordmark, full bleed */}
        <div className="mt-12 sm:mt-16">
          <WordmarkGiant className="text-[clamp(3.6rem,19vw,18rem)]" />
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-ivory/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="u-caps flex items-center gap-3 text-lg">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-coral"
            />
            {brand.campaignLine}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <MicroMark className="text-ivory">
              {site.address.city}, {site.address.country}
            </MicroMark>
            <MicroMark className="text-ivory">MATOCHA®</MicroMark>
            <p className="u-label opacity-45">
              © {year} {site.name}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
