import manifest from "./media-manifest.json";

export type MediaStatus = "real" | "concept" | "missing";

export type MediaItem = {
  id: string;
  family: "poudre";
  recipe: string;
  status: MediaStatus;
  kind: "video" | "image" | "rive" | "lottie" | "model3d" | "svg";
  source: string;
  license: { name: string; url: string; commercialUse: boolean; proofStored: string };
  files: { desktop: string; mobile: string; poster: string };
  width?: number;
  height?: number;
  alt: string;
  decorative: boolean;
  usedIn: string[];
  notes: string;
};

export const media = manifest as MediaItem[];

/** Every media used on the site must have an entry. Throws if not. */
export function getMedia(id: string): MediaItem {
  const item = media.find((m) => m.id === id);
  if (!item) throw new Error(`Media "${id}" is not in media-manifest.json`);
  return item;
}

/** An image can be shown only if it exists and its commercial use is allowed. */
export function isShowable(item: MediaItem) {
  return item.status !== "missing" && item.license.commercialUse && !!item.files.desktop;
}
