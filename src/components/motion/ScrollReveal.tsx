"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Section reveals. Marks `[data-reveal]` elements `.is-in` a little before
 * they enter the viewport (25 % early), and immediately for anything already
 * above the fold or passed during a fast scroll jump — so no section is ever
 * left blank. The hidden start state only applies once `html.motion-ok` is set
 * (inline script in the layout), so without JS everything is visible.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("motion-ok")) return;
    const pending = new Set(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const show = (el: HTMLElement) => {
      el.classList.add("is-in");
      pending.delete(el);
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && show(e.target as HTMLElement)),
      { rootMargin: "0px 0px 25% 0px" },
    );
    pending.forEach((el) => io.observe(el));

    /* Anything already scrolled past (anchor jump, fast fling) shows at once. */
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const limit = window.innerHeight * 1.25;
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < limit) show(el);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sweep);
    };
    sweep();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
