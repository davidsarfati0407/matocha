import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "MATOCHA - Matcha. Made simple. Un stick Matocha de 2 g tenu devant un matcha latte glacé (visuel de concept).";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card (Open Graph and Twitter): the latte render (media-manifest id
 * "matocha-latte"), the name and the signature. No price, no claim.
 */
export async function renderShareCard() {
  const photo = await readFile(join(process.cwd(), "public/renders/matocha-latte.png"));
  const src = `data:image/png;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#EEEDE0", color: "#16241B", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: 72 }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: "#5F7F1F" }}>MATCHA ORIGINAL · DAILY BOX</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>MATOCHA</div>
            <div style={{ fontSize: 46, marginTop: 18, letterSpacing: -1 }}>Matcha. Made simple.</div>
          </div>
          <div style={{ fontSize: 18, opacity: 0.7 }}>Pré-lancement · Visuel de concept</div>
        </div>
        <img src={src} width={504} height={630} alt="" style={{ objectFit: "cover", objectPosition: "50% 40%", width: 504, height: 630 }} />
      </div>
    ),
    size,
  );
}

export default renderShareCard;
