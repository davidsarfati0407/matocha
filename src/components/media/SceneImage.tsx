import Image from "next/image";
import { getMedia, isShowable } from "@/content/media";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

/**
 * A render that fills its frame (cover), for the full-screen scenes.
 *
 * - `crop` / `cropLg`: the focal point on phones and from 1024 px, so the
 *   cover crop always keeps the subject in frame.
 * - `depth`: drifts on scroll inside a ParallaxRoot; the image is overscanned
 *   by 7 % top and bottom so no edge ever shows.
 * - `kenBurns`: a very slow zoom. Off in reduced motion.
 * - `reveal`: the frame unveils when it scrolls in.
 * - A `concept` render always carries the "Visuel de concept" tag.
 */
export function SceneImage({
  id,
  sizes,
  priority = false,
  crop = "50% 50%",
  cropLg = crop,
  depth = 0,
  kenBurns = false,
  reveal = false,
  className,
}: {
  id: string;
  sizes: string;
  priority?: boolean;
  crop?: string;
  cropLg?: string;
  depth?: number;
  kenBurns?: boolean;
  reveal?: boolean;
  className?: string;
}) {
  const item = getMedia(id);
  if (!isShowable(item)) return null;

  return (
    <figure data-reveal={reveal ? "image" : undefined} className={cn("relative overflow-hidden bg-lait-profond", className)}>
      <div
        data-depth={depth || undefined}
        className={cn("absolute inset-x-0", depth ? "parallax -inset-y-[7%]" : "inset-y-0")}
      >
        <Image
          src={item.files.desktop}
          alt={item.decorative ? "" : item.alt}
          fill
          sizes={sizes}
          /* Next 16: `priority` is deprecated; eager + high fetch priority for the hero. */
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={cn("scene-crop object-cover", kenBurns && "kb")}
          style={{ "--f": crop, "--f-lg": cropLg } as React.CSSProperties}
        />
      </div>
      {item.status === "concept" && (
        <figcaption className="absolute right-3 bottom-3 concept-tag">{fr.status.concept}</figcaption>
      )}
    </figure>
  );
}
