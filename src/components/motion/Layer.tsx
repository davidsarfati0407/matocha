import Image from "next/image";
import { getMedia, isShowable } from "@/content/media";

/** A transparent product layer from the manifest, at its natural aspect ratio. */
export function Layer({ id, sizes, priority, className }: { id: string; sizes: string; priority?: boolean; className?: string }) {
  const item = getMedia(id);
  if (!isShowable(item) || !item.width || !item.height) return null;
  return (
    <Image
      src={item.files.desktop}
      alt={item.decorative ? "" : item.alt}
      width={item.width}
      height={item.height}
      sizes={sizes}
      priority={priority}
      className={className}
      draggable={false}
    />
  );
}
