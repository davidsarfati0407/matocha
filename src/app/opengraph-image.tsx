import { ImageResponse } from "next/og";

export const alt = "Matocha — Le matcha, en plus simple. Visuel de concept.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card. Pre-launch: no price, no claim, and the product drawing is
 * labelled as a concept (media-manifest id "og-concept").
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#EEEDE0",
          color: "#16241B",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>MATOCHA</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3, textTransform: "uppercase", maxWidth: 640 }}>
              Le matcha, en plus simple.
            </div>
            <div style={{ fontSize: 28, marginTop: 24 }}>Pré-lancement · Soyez prévenu du lancement</div>
          </div>
          <div style={{ fontSize: 20, opacity: 0.8 }}>Visuel de concept</div>
        </div>
        <svg width="360" height="486" viewBox="0 0 400 540">
          <path d="M110 170 C112 282 122 380 134 430 C137 442 148 450 162 450 L238 450 C252 450 263 442 266 430 C278 380 288 282 290 170 Z" fill="#A9C46A" />
          <path d="M110 170 C112 282 122 380 134 430 C137 442 148 450 162 450 L238 450 C252 450 263 442 266 430 C278 380 288 282 290 170" fill="none" stroke="#16241B" strokeWidth="8" />
          <ellipse cx="200" cy="170" rx="90" ry="12" fill="#E9EFCF" stroke="#16241B" strokeWidth="8" />
          <g transform="translate(250 20) rotate(14)">
            <rect width="40" height="170" rx="5" fill="#F4F2E6" stroke="#16241B" strokeWidth="5" />
            <rect width="40" height="22" fill="#1B3B2A" />
            <rect y="136" width="40" height="34" fill="#8DB33A" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
