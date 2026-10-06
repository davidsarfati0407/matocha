import { ImageResponse } from "next/og";
import { brand } from "@/data/brand";

export const alt = "MATOCHA — Matcha. Made simple.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card, generated at build time from the brand tokens.
 * The glass is drawn inline: Satori renders a subset of SVG, so the component
 * is restated here rather than imported.
 */
export default function OpengraphImage() {
  const glass = (
    <svg width="360" height="396" viewBox="0 0 200 220">
      <defs>
        <clipPath id="og-inside">
          <path d="M42 50 C43 98 49 148 56 175 C58 185 63 189 72 189 L128 189 C137 189 142 185 144 175 C151 148 157 98 158 50 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#og-inside)">
        <path
          d="M28 108 C48 97 66 113 92 107 C118 100 140 115 172 105 L172 202 L28 202 Z"
          fill={brand.colors.matcha}
        />
      </g>
      <path
        d="M36 47 C37 97 43 149 50 178 C52 190 60 196 72 196 L129 196 C141 196 148 189 150 177 C157 148 162 96 164 47"
        stroke={brand.colors.ivory}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse
        cx="100"
        cy="47"
        rx="64"
        ry="9.5"
        stroke={brand.colors.ivory}
        strokeWidth="7"
        fill="none"
      />
      <path
        d="M64 196 L136 196"
        stroke={brand.colors.ivory}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: brand.colors.green,
          padding: "68px 76px",
          fontFamily: "sans-serif",
          color: brand.colors.ivory,
        }}
      >
        <div style={{ position: "absolute", right: 96, top: 118, display: "flex" }}>
          {glass}
        </div>

        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8 }}>
          MATOCHA
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {["MATCHA.", "MADE SIMPLE."].map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                fontSize: 108,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 0.88,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            opacity: 0.8,
          }}
        >
          <div style={{ display: "flex" }}>
            Premium Japanese matcha, portioned into {brand.servingWeight}
            {brand.servingUnit} sticks.
          </div>
          <div style={{ display: "flex", letterSpacing: 4 }}>
            {brand.sticksPerBox} × {brand.servingWeight}
            {brand.servingUnit.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
