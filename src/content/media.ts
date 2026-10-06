import manifest from "./media-manifest.json";

export type MediaStatus = "real" | "concept" | "missing";

export type MediaItem = {
  id: string;
  family: "poudre" | "concentre";
  recipe: string;
  status: MediaStatus;
  kind: "video" | "image" | "rive" | "lottie" | "model3d" | "svg";
  source: string;
  license: { name: string; url: string; commercialUse: boolean; proofStored: string };
  files: { desktop: string; mobile: string; poster: string };
  alt: string;
  decorative: boolean;
  usedIn: string[];
  notes: string;
};

export const media = manifest as MediaItem[];

/** Every media used on the site must have an entry. Throws in dev if not. */
export function getMedia(id: string): MediaItem {
  const item = media.find((m) => m.id === id);
  if (!item) throw new Error(`Media "${id}" is not in media-manifest.json`);
  return item;
}

/** A real file can only be shown when it is real, licensed and present. */
export function isPlayable(item: MediaItem) {
  return item.status === "real" && item.license.commercialUse && !!item.files.desktop;
}
