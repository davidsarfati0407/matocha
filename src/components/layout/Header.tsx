"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { MatochaLogo } from "@/components/brand/MatochaLogo";
import { primaryNav, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20c0-3.6 3.2-5.9 7.2-5.9s7.2 2.3 7.2 5.9" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-6" aria-hidden="true">
      <span
        className={cn(
          "absolute left-0 h-px w-full bg-current transition-all duration-400 ease-[var(--ease-matocha)]",
          open ? "top-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 h-px bg-current transition-all duration-400 ease-[var(--ease-matocha)]",
          open ? "top-1/2 w-full -rotate-45" : "top-full w-2/3",
        )}
      />
    </span>
  );
}

/**
 * The header carries the glass lockup. Every page now opens on ivory, so the
 * type stays dark throughout; only the bar itself arrives, fading in with a
 * hairline rule once the page has moved.
 */
export function Header() {
  const pathname = usePathname();
  const { count, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  const solid = scrolled || pathname !== "/" || menuOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[var(--ease-matocha)]",
          "text-black",
          solid
            ? "border-b border-black/10 bg-ivory/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "mx-auto flex max-w-[1600px] items-center justify-between px-5 transition-[height] duration-500 sm:px-8 lg:px-12",
            solid ? "h-16 lg:h-[74px]" : "h-20 lg:h-[92px]",
          )}
        >
          {/* Mobile: menu */}
          <button
            type="button"
            className="u-label -ml-1 flex h-11 items-center gap-2 font-semibold lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={menuOpen} />
          </button>

          {/* The lockup: glass, then wordmark */}
          <Link
            href="/"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 text-[0.95rem] lg:static lg:translate-x-0 lg:text-[1.05rem]"
            aria-label={`${site.name} — home`}
          >
            {/* Object first, then the word — the glass alone has to carry
                the brand at favicon size, so it leads the lockup. */}
            <span className="lg:hidden">
              <MatochaLogo variant="inline" glassVariant="classic" ink="currentColor" />
            </span>
            <span className="hidden lg:block">
              <MatochaLogo variant="inline" glassVariant="classic" ink="currentColor" />
            </span>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-9 lg:flex">
            {primaryNav.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "u-label group relative inline-block py-2 font-semibold transition-opacity duration-300",
                      active ? "opacity-100" : "opacity-70 hover:opacity-100",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 -bottom-px h-px origin-left bg-coral transition-transform duration-500 ease-[var(--ease-matocha)]",
                        active
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Utilities */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              className="u-label hidden h-11 items-center px-2 font-semibold opacity-70 transition-opacity hover:opacity-100 lg:inline-flex"
              aria-label="Change language"
            >
              {site.languages[0].code}
            </button>

            <Link
              href="/account"
              className="hidden h-11 w-11 items-center justify-center opacity-75 transition-opacity hover:opacity-100 lg:inline-flex"
              aria-label="Account"
            >
              <AccountIcon />
            </Link>

            <button
              type="button"
              onClick={open}
              className="u-label -mr-2 inline-flex h-11 items-center gap-2 px-2 font-semibold transition-opacity hover:opacity-70"
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <span>Cart</span>
              <span className="tabular-nums">({count})</span>
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          data-matocha-motion
          className="on-green fixed inset-0 z-40 flex flex-col bg-green pt-24 text-ivory lg:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <ul className="flex flex-1 flex-col justify-center px-5 pb-24">
            {primaryNav.map((item, index) => (
              <motion.li
                key={item.href}
                data-matocha-motion
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.06 + index * 0.06,
                  ease: EASE,
                }}
                className="border-b border-ivory/20"
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-baseline justify-between py-5"
                >
                  <span className="text-h2 u-caps">{item.label}</span>
                  <span className="u-label opacity-40">0{index + 1}</span>
                </Link>
              </motion.li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-ivory/20 px-5 py-6">
            <Link
              href="/account"
              onClick={onClose}
              className="u-label font-semibold"
            >
              Account
            </Link>
            <span className="u-label opacity-55">
              {site.address.city}, {site.address.country}
            </span>
            <span className="u-label font-semibold">
              {site.languages[0].code}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
