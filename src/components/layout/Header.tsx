"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MatochaLogo } from "@/components/brand/MatochaLogo";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-6" aria-hidden="true">
      <span
        className={cn(
          "absolute left-0 h-0.5 w-full bg-current transition-transform duration-300",
          open ? "top-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 h-0.5 bg-current transition-transform duration-300",
          open ? "top-1/2 w-full -rotate-45" : "top-full w-2/3",
        )}
      />
    </span>
  );
}

/**
 * Header. Plain links rendered on the server pass (the component is client
 * only for the mobile menu and the hairline that appears on scroll). The shop
 * link and the cart exist only in sale mode — `cartSlot` is rendered by the
 * layout, never here.
 */
export function Header({
  sale,
  cartSlot,
}: {
  sale: boolean;
  cartSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = sale ? [...fr.nav.primary, fr.nav.shop] : fr.nav.primary;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the menu on navigation (adjusting state during render, not in an effect). */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-[80] bg-foret px-4 py-3 text-lait focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {fr.nav.skip}
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
          scrolled || menuOpen
            ? "border-encre/10 bg-lait/92 backdrop-blur-md"
            : "border-transparent bg-lait/0",
        )}
      >
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-4 sm:px-8 lg:h-[72px] lg:px-12"
        >
          <Link href="/" aria-label={fr.nav.home} className="flex min-h-11 items-center text-[1.05rem]">
            <MatochaLogo variant="inline" glassVariant="classic" ink="currentColor" />
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "py-2 text-[0.95rem] font-medium underline-offset-[6px] transition-colors hover:underline hover:decoration-matcha hover:decoration-2",
                      active && "underline decoration-matcha decoration-2",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {cartSlot}
            <button
              type="button"
              className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? fr.nav.closeMenu : fr.nav.openMenu}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="menu-mobile"
        hidden={!menuOpen}
        className="on-dark fixed inset-0 z-40 flex flex-col bg-foret px-4 pt-24 pb-10 text-lait lg:hidden"
      >
        <ul className="flex flex-1 flex-col justify-center">
          {items.map((item) => (
            <li key={item.href} className="border-b border-lait/20">
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-5 text-3xl u-caps"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-80">{fr.footer.signature}</p>
      </div>
    </>
  );
}
