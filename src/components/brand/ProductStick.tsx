import { cn } from "@/lib/utils";

/*
 * THE MATOCHA STICK — packaging route "Everyday icon".
 *
 * Thin cream sachet, forêt crimp, MATOCHA set large and upright so it reads in
 * a jeans pocket, an original "filet" ribbon (the same ribbon that runs down
 * the site), one colour block per recipe, three gestures on the back.
 *
 * No weight, origin or "100 %" is printed: those wait for confirmed data. The
 * drawing is the reference for every render and generation (PROMPTS.md) —
 * generators must not invent the typography.
 */

export type StickView = "face" | "dos" | "profil";

const LAIT = "#F4F2E6";
const FORET = "#1B3B2A";
const INK = "#16241B";

/** The brand ribbon, as printed on the pack. */
export const FILET_PATH =
  "M-6 120 C24 96 40 150 66 128 C92 106 104 150 132 132";

export function ProductStick({
  view = "face",
  accent = "#8DB33A",
  recipe = "Original",
  format = "Poudre",
  className,
  title,
}: {
  view?: StickView;
  accent?: string;
  recipe?: string;
  format?: "Poudre" | "Concentré";
  className?: string;
  title?: string;
}) {
  const label = title ?? `Stick Matocha ${recipe}, vue ${view}`;

  if (view === "profil") {
    return (
      <svg viewBox="0 0 30 440" className={cn("h-full w-auto", className)} role="img" aria-label={label}>
        <path d="M6 6 L24 6 L22 40 L26 400 L24 434 L6 434 L4 400 L8 40 Z" fill={LAIT} stroke={INK} strokeWidth="2" />
        <rect x="6" y="6" width="18" height="34" fill={FORET} />
        <rect x="5" y="400" width="20" height="34" fill={FORET} />
        <rect x="7" y="330" width="16" height="60" fill={accent} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 440" className={cn("h-full w-auto", className)} role="img" aria-label={label}>
      <defs>
        <clipPath id={`stick-${view}-${recipe}`}>
          <rect x="4" y="4" width="112" height="432" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#stick-${view}-${recipe})`}>
        <rect x="4" y="4" width="112" height="432" fill={LAIT} />
        {/* Crimped seals */}
        <rect x="4" y="4" width="112" height="34" fill={FORET} />
        <rect x="4" y="402" width="112" height="34" fill={FORET} />
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={8 + i * 8} y1="6" x2={8 + i * 8} y2="36" stroke="#2A5039" strokeWidth="1.5" />
        ))}

        {view === "face" ? (
          <>
            {/* Tear notch + dotted tear line */}
            <line x1="4" y1="52" x2="116" y2="52" stroke={INK} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.5" />
            {/* Le Filet */}
            <path d={FILET_PATH} transform="translate(0 0)" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
            <path d={FILET_PATH} transform="translate(0 196)" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity="0.6" />
            <text
              x="64"
              y="350"
              transform="rotate(-90 64 350)"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              fontSize="40"
              letterSpacing="-1"
              fill={FORET}
            >
              MATOCHA
            </text>
            {/* Recipe block */}
            <rect x="4" y="360" width="112" height="42" fill={accent} />
            <text x="60" y="380" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="700" fontSize="12" letterSpacing="1.5" fill={INK}>
              {recipe.toUpperCase()}
            </text>
            <text x="60" y="395" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="500" fontSize="9" letterSpacing="1.2" fill={INK}>
              {format.toUpperCase()}
            </text>
          </>
        ) : (
          <>
            <text x="60" y="66" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="700" fontSize="13" fill={FORET}>
              MATOCHA
            </text>
            {/* Three gestures */}
            {(format === "Poudre" ? ["OUVRIR", "VERSER", "PRÉPARER"] : ["OUVRIR", "VERSER", "MÉLANGER"]).map((g, i) => (
              <g key={g} transform={`translate(0 ${96 + i * 92})`}>
                <circle cx="60" cy="24" r="22" fill="none" stroke={FORET} strokeWidth="2" />
                <text x="60" y="30" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="20" fill={FORET}>
                  {i + 1}
                </text>
                <text x="60" y="66" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="600" fontSize="10" letterSpacing="1" fill={INK}>
                  {g}
                </text>
              </g>
            ))}
            {/* Mandatory-information area, left blank until confirmed */}
            <rect x="14" y="368" width="92" height="28" fill="none" stroke={INK} strokeDasharray="3 3" opacity="0.45" />
            <text x="60" y="386" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="7" fill={INK} opacity="0.7">
              LOT · DDM · MENTIONS
            </text>
          </>
        )}
      </g>
      <rect x="4" y="4" width="112" height="432" rx="6" fill="none" stroke={INK} strokeWidth="2" />
    </svg>
  );
}
