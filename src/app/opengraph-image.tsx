import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Matocha — Le matcha, en plus simple. La Daily Box, visuel de concept.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card: the Daily Box render (media-manifest id "matocha-box"), no
 * price, no claim, labelled as a concept.
 */
export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/renders/matocha-box.png"));
  const src = `data:image/png;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#EEEDE0", color: "#16241B", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: 64 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>MATOCHA</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3, textTransform: "uppercase", maxWidth: 600 }}>
              Le matcha, en plus simple.
            </div>
            <div style={{ fontSize: 28, marginTop: 24 }}>Daily Box · 30 sticks de 2 g · Pré-lancement</div>
          </div>
          <div style={{ fontSize: 20, opacity: 0.8 }}>Visuel de concept</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
        <img src={src} width={504} height={630} alt="" style={{ objectFit: "cover", width: 504, height: 630 }} />
      </div>
    ),
    size,
  );
}
