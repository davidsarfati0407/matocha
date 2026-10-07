import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "MATOCHA - Matcha. Made simple. La boîte Matocha vert forêt et deux sticks de 2 g (visuel de concept).";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card (Open Graph and Twitter): the v2 hero render (media-manifest
 * id "matocha-v2-hero", downscaled from its 1672 px master), with the name
 * and signature on its lime copy space. No price, no claim.
 */
export async function renderShareCard() {
  const photo = await readFile(join(process.cwd(), "assets/renders-v2/matocha-v2-hero.jpg"));
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", color: "#153D2D", fontFamily: "sans-serif" }}>
        <img src={src} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover", objectPosition: "60% 50%" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: 560, height: "100%" }}>
          <div style={{ fontSize: 18, letterSpacing: 5 }}>MATCHA ORIGINAL · DAILY BOX</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>MATOCHA</div>
            <div style={{ fontSize: 42, marginTop: 16, letterSpacing: -1 }}>Matcha. Made simple.</div>
          </div>
          <div style={{ fontSize: 18 }}>Pré-lancement · Visuel de concept</div>
        </div>
      </div>
    ),
    size,
  );
}

export default renderShareCard;
