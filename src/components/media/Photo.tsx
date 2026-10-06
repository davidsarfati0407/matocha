"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { getMedia, isShowable } from "@/content/media";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

/**
 * A render from the media manifest, never anything else.
 *
 * - The box reserves its aspect ratio: nothing moves when the image arrives.
 * - `kenBurns`: a very slow scale/drift of the image (CSS only).
 * - `parallax`: the image glides a few pixels against the scroll, written
 *   straight to the DOM, only while the frame is on screen.
 * - Reduced motion: both are off; the photo is simply shown.
 * - A `concept` render always carries the "Visuel de concept" tag.
 */
export function Photo({
  id,
  className,
  sizes,
  priority = false,
  kenBurns = false,
  parallax = false,
  objectPosition = "50% 50%",
  ratio = "aspect-[4/5]",
}: {
  id: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  kenBurns?: boolean;
  parallax?: boolean;
  objectPosition?: string;
  /** Tailwind aspect class; the renders are 4:5. */
  ratio?: string;
}) {
  const item = getMedia(id);
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parallax || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = frame.current;
    const inner = layer.current;
    if (!el || !inner) return;
    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      if (!visible) return;
      const r = el.getBoundingClientRect();
      /* -1 when the frame enters at the bottom, +1 when it leaves at the top. */
      const k = (window.innerHeight / 2 - (r.top + r.height / 2)) / (window.innerHeight / 2 + r.height / 2);
      inner.style.transform = `translate3d(0, ${(k * 18).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [parallax]);

  if (!isShowable(item)) return null;

  return (
    <figure ref={frame} className={cn("relative overflow-hidden bg-lait-profond", ratio, className)}>
      {/* The layer is a little taller than the frame so parallax never shows an edge. */}
      <div ref={layer} className={cn("absolute", parallax ? "-inset-y-6 inset-x-0" : "inset-0")}>
        <div className={cn("absolute inset-0", kenBurns && "ken-burns")}>
          <Image
            src={item.files.desktop}
            alt={item.decorative ? "" : item.alt}
            fill
            sizes={sizes}
            priority={priority}
            quality={80}
            className="object-cover"
            style={{ objectPosition }}
          />
        </div>
      </div>
      {item.status === "concept" && (
        <figcaption className="absolute top-2 left-2 concept-tag">{fr.status.concept}</figcaption>
      )}
    </figure>
  );
}
