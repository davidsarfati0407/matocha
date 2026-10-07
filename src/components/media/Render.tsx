import renders from "@/content/renders.json";
import { getMedia, isShowable } from "@/content/media";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

type CropEntry = { width: number; height: number; avif: [number, string][]; webp: [number, string][]; fallback: string };
type RenderEntry = { master: { width: number; height: number }; crops: Record<string, CropEntry> };

const table = renders as unknown as Record<string, RenderEntry>;
const srcSet = (list: [number, string][]) => list.map(([w, path]) => `${path} ${w}w`).join(", ");

/**
 * A v2 render as a <picture>: AVIF, then WebP, then a JPEG fallback, from
 * variants that are never wider than the master (scripts/build-renders.mjs).
 *
 * - `crop` / `mobileCrop`: art direction; phones (< 768 px) get their own
 *   framing so the pack stays readable.
 * - width/height are set on every source: the browser reserves the box.
 * - Lazy by default; `priority` for the hero only (eager + high fetch priority).
 * - No zoom, no filter, no blur: the pixels are shown as they are.
 * - A concept render always carries the "Visuel de concept" tag.
 */
export function Render({
  id,
  crop = "full",
  mobileCrop,
  sizes,
  mobileSizes = "100vw",
  priority = false,
  className,
  imgClassName,
  rounded = true,
  tag = "bottom-right",
}: {
  id: string;
  crop?: string;
  mobileCrop?: string;
  sizes: string;
  mobileSizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  rounded?: boolean;
  tag?: "bottom-right" | "top-left" | "none";
}) {
  const item = getMedia(id);
  const entry = table[id];
  if (!isShowable(item) || !entry) return null;
  const desktop = entry.crops[crop];
  const mobile = mobileCrop ? entry.crops[mobileCrop] : null;
  const phone = "(max-width: 767px)";

  return (
    <figure className={cn("relative overflow-hidden bg-lait-profond", rounded && "rounded-[28px]", className)}>
      <picture>
        {mobile && (
          <>
            <source media={phone} type="image/avif" srcSet={srcSet(mobile.avif)} sizes={mobileSizes} width={mobile.width} height={mobile.height} />
            <source media={phone} type="image/webp" srcSet={srcSet(mobile.webp)} sizes={mobileSizes} width={mobile.width} height={mobile.height} />
          </>
        )}
        <source type="image/avif" srcSet={srcSet(desktop.avif)} sizes={sizes} width={desktop.width} height={desktop.height} />
        <source type="image/webp" srcSet={srcSet(desktop.webp)} sizes={sizes} width={desktop.width} height={desktop.height} />
        <img
          src={desktop.fallback}
          width={desktop.width}
          height={desktop.height}
          alt={item.decorative ? "" : item.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding={priority ? "sync" : "async"}
          draggable={false}
          className={cn("block h-auto w-full", imgClassName)}
        />
      </picture>
      {item.status === "concept" && tag !== "none" && (
        <figcaption className={cn("absolute concept-tag", tag === "top-left" ? "top-3 left-3" : "right-3 bottom-3")}>
          {fr.status.concept}
        </figcaption>
      )}
    </figure>
  );
}
