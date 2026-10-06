import { useId } from "react";
import { clamp01, easeOut, lerp, mixColor, r, seeded, seg, smooth } from "@/lib/anim";
import type { FamilyId, PrepMethod } from "@/content/catalog/types";

/*
 * THE POUR STAGE — the shared drawing behind M01 (hero loop) and M02 (the
 * gesture). It is a pure function of `t` (0 → 1), so the same frame can be a
 * looping film, a scroll position, or a static poster.
 *
 * It shows the real gesture of each format and nothing more:
 *  - POUDRE: the powder lands on the surface and stays there — matcha is in
 *    suspension, it does not dissolve — until a tool moves it. Only then does
 *    the colour become uniform.
 *  - CONCENTRÉ: a thick green ribbon falls into the milk, marbles, and a few
 *    turns of a spoon even it out. Never shown without its "en développement"
 *    label (the caller's job).
 *
 * Timeline:
 *   0.00–0.14  Ouvrir    — the pack tears along its notch
 *   0.14–0.40  Verser    — powder cloud / concentrate ribbon
 *   0.40–0.72  Préparer  — whisk, frother, shaker or spoon
 *   0.72–1.00  Boire     — even colour, foam, the glass lifts, a sip
 */

export type StageTemp = "hot" | "iced";

export const STAGE_STEPS = [
  { from: 0, to: 0.14 },
  { from: 0.14, to: 0.4 },
  { from: 0.4, to: 0.72 },
  { from: 0.72, to: 1 },
] as const;

/** A representative frame for each of the three steps (posters, reduced motion). */
export const STEP_FRAMES = [0.1, 0.33, 0.6, 0.8] as const;

const MILK = "#F5F2E6";
const INK = "#16241B";
const FORET = "#1B3B2A";
const LAIT = "#EEEDE0";
const GLASS_TINT = "#FFFFFF";

/* Glass geometry, viewBox 0 0 400 500. */
const OUTLINE =
  "M110 170 C112 282 122 380 134 430 C137 442 148 450 162 450 L238 450 C252 450 263 442 266 430 C278 380 288 282 290 170";
const INTERIOR =
  "M117 174 C119 282 129 378 141 426 C144 436 151 442 162 442 L238 442 C249 442 256 436 259 426 C271 378 281 282 283 174 Z";
const BOTTOM = 446;

function surfacePath(y: number, wobble: number) {
  const w = wobble;
  return `M96 ${r(y + 2)} C140 ${r(y - 7 * w)} 170 ${r(y + 6 * w)} 202 ${r(y)} C236 ${r(y - 6 * w)} 262 ${r(y + 7 * w)} 304 ${r(y - 1)} L304 ${BOTTOM + 10} L96 ${BOTTOM + 10} Z`;
}

/* ------------------------------------------------------------------ packs */

function Stick({ accent }: { accent: string }) {
  return (
    <g>
      <rect x="0" y="0" width="26" height="124" rx="3" fill={LAIT} stroke={INK} strokeWidth="2.5" />
      <rect x="0" y="0" width="26" height="16" rx="3" fill={FORET} />
      <rect x="0" y="98" width="26" height="26" rx="3" fill={accent} />
      <path d="M4 40 C10 48 16 44 22 52 M4 60 C10 68 16 64 22 72" stroke={accent} strokeWidth="2" fill="none" />
      <text
        x="13"
        y="84"
        transform="rotate(-90 13 84)"
        fontFamily="var(--font-sans)"
        fontWeight="700"
        fontSize="11"
        letterSpacing="0.4"
        fill={FORET}
      >
        MATOCHA
      </text>
    </g>
  );
}

function Sachet({ accent }: { accent: string }) {
  return (
    <g>
      <rect x="-8" y="0" width="42" height="92" rx="6" fill={LAIT} stroke={INK} strokeWidth="2.5" />
      <rect x="-8" y="0" width="42" height="14" rx="4" fill={FORET} />
      <path d="M13 34 C6 46 5 52 13 58 C21 52 20 46 13 34 Z" fill={accent} stroke={INK} strokeWidth="1.5" />
      <text x="31" y="86" transform="rotate(-90 31 86)" fontFamily="var(--font-sans)" fontWeight="700" fontSize="7.5" fill={FORET}>
        MATOCHA
      </text>
    </g>
  );
}

/** Line-art hand: clearly graphic, no skin tone implied. */
function Hand() {
  return (
    <path
      d="M-10 70 C-14 60 -4 54 4 60 L4 64 C10 56 24 58 30 64 C36 70 36 84 32 96 C28 112 20 126 6 134 L-16 140 C-22 124 -20 104 -14 90 Z"
      fill={LAIT}
      stroke={INK}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  );
}

/* ------------------------------------------------------------------ tools */

function Tool({ method, k, mixing }: { method: PrepMethod; k: number; mixing: number }) {
  /* k: 0 → off-frame, 1 → in the drink. mixing: drives the motion. */
  if (k <= 0.001) return null;
  const enter = easeOut(k);
  const swirl = Math.sin(mixing * Math.PI * 10);
  if (method === "whisk") {
    const x = lerp(340, 200 + swirl * 34, enter);
    const y = lerp(-140, 150, enter);
    return (
      <g transform={`translate(${r(x)} ${r(y)}) rotate(${r(swirl * 8)})`}>
        <rect x="-7" y="-150" width="14" height="110" rx="6" fill="#C9A978" stroke={INK} strokeWidth="2.5" />
        <path
          d="M-7 -40 C-30 0 -28 70 0 96 C28 70 30 0 7 -40 M-3 -40 C-14 10 -12 70 0 96 M3 -40 C14 10 12 70 0 96"
          fill="none"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (method === "spoon") {
    const angle = mixing * Math.PI * 6;
    const x = lerp(330, 200 + Math.cos(angle) * 40, enter);
    const y = lerp(-120, 160 + Math.sin(angle) * 10, enter);
    return (
      <g transform={`translate(${r(x)} ${r(y)}) rotate(14)`}>
        <rect x="-4" y="-170" width="8" height="200" rx="4" fill="#B8BBB2" stroke={INK} strokeWidth="2.2" />
        <ellipse cx="0" cy="44" rx="15" ry="22" fill="#C8CBC2" stroke={INK} strokeWidth="2.2" />
      </g>
    );
  }
  if (method === "shaker") {
    /* The lid closes over the glass; the whole stage shakes (handled outside). */
    const y = lerp(-80, 150, enter);
    return (
      <g transform={`translate(200 ${r(y)})`}>
        <path d="M-96 0 L96 0 L88 -26 C70 -40 -70 -40 -88 -26 Z" fill={FORET} stroke={INK} strokeWidth="2.5" />
        <rect x="-22" y="-52" width="44" height="18" rx="5" fill={FORET} stroke={INK} strokeWidth="2.5" />
      </g>
    );
  }
  /* frother */
  const x = lerp(330, 206 + swirl * 6, enter);
  const y = lerp(-160, 196, enter);
  return (
    <g transform={`translate(${r(x)} ${r(y)}) rotate(6)`}>
      <rect x="-12" y="-232" width="24" height="96" rx="10" fill={FORET} stroke={INK} strokeWidth="2.5" />
      <rect x="-2" y="-138" width="4" height="150" fill="#9EA39A" stroke={INK} strokeWidth="1.5" />
      <ellipse cx="0" cy="16" rx={r(12 * Math.abs(Math.cos(mixing * 60)) + 3)} ry="8" fill="none" stroke={INK} strokeWidth="2.2" />
    </g>
  );
}

/* ------------------------------------------------------------------ stage */

export function PourStage({
  t,
  family,
  temp = "iced",
  method,
  liquidColor,
  matterColor,
  accent,
  title,
  className,
}: {
  t: number;
  family: FamilyId;
  temp?: StageTemp;
  method?: PrepMethod;
  liquidColor: string;
  matterColor: string;
  accent: string;
  /** Accessible description; the scene is decorative when omitted. */
  title?: string;
  className?: string;
}) {
  const powder = family === "poudre";
  const tool: PrepMethod = method ?? (powder ? (temp === "iced" ? "frother" : "whisk") : "spoon");

  const open = seg(t, 0.02, 0.14);
  const pour = seg(t, 0.16, 0.4);
  const tilt = smooth(seg(t, 0.12, 0.22)) * (1 - smooth(seg(t, 0.38, 0.46)));
  const toolIn = smooth(seg(t, 0.4, 0.48)) * (1 - smooth(seg(t, 0.68, 0.76)));
  const mix = seg(t, 0.46, 0.7);
  const lift = smooth(seg(t, 0.78, 0.86)) * (1 - smooth(seg(t, 0.93, 0.98)));
  const sip = smooth(seg(t, 0.86, 0.92));
  const fade = 1 - smooth(seg(t, 0.975, 1)) * 0.9;

  /* Liquid level: milk sits in the glass from the start. */
  const baseLevel = 232;
  const level = baseLevel + (powder ? 0 : -6 * pour) + sip * 22;
  const tint = smooth(mix);
  const liquid = mixColor(MILK, liquidColor, tint);
  const wobble = 0.6 + Math.sin(t * Math.PI * 16) * 0.25 + mix * (1 - mix) * 2.4;

  /* Pack position: held above the glass, tilted to pour. */
  /* Tipped clockwise: the printed MATOCHA (running upward) stays readable
     through the pour instead of turning upside down. */
  const packX = 116;
  const packY = -8;
  const S = 1.4;
  const angle = 128 * tilt;
  const packOut = smooth(seg(t, 0.4, 0.5));

  const rand = seeded(7);
  const grains = Array.from({ length: 34 }, () => ({
    d: rand() * 0.7,
    s: (rand() - 0.5) * 2,
    z: 1.6 + rand() * 2.2,
  }));
  /* The torn end of the pack, once fully tilted (pivot at its centre 13,60). */
  const theta = (128 * Math.PI) / 180;
  const mouthX = packX + S * (13 + 60 * Math.sin(theta));
  const mouthY = packY + S * (60 - 60 * Math.cos(theta));

  const powderLayer = powder ? smooth(pour) * (1 - smooth(mix)) : 0;
  const marble = !powder ? smooth(pour) * (1 - smooth(mix)) : 0;
  const foam = smooth(seg(t, 0.62, 0.74));
  const steam = temp === "hot" ? smooth(seg(t, 0.66, 0.8)) : 0;
  const shake = tool === "shaker" ? Math.sin(t * 400) * 3 * mix * (1 - mix) * 4 : 0;
  /* Unique per instance: a duplicated id inside a display:none twin breaks the clip. */
  const clipId = `pour-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 -50 400 550"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={clipId}>
          <path d={INTERIOR} />
        </clipPath>
        <linearGradient id={`${clipId}-sheen`} x1="0" x2="1">
          <stop offset="0" stopColor={GLASS_TINT} stopOpacity="0.55" />
          <stop offset="0.18" stopColor={GLASS_TINT} stopOpacity="0" />
          <stop offset="0.82" stopColor={GLASS_TINT} stopOpacity="0" />
          <stop offset="1" stopColor={GLASS_TINT} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${clipId}-depth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <g opacity={r(fade)}>
        {/* Table shadow */}
        <ellipse cx="200" cy="458" rx={r(110 - lift * 20)} ry="10" fill={INK} opacity={r(0.14 - lift * 0.06)} />

        <g transform={`translate(${r(shake)} ${r(-lift * 26)}) rotate(${r(-lift * 5)} 200 450)`}>
          {/* Steam */}
          {steam > 0 && (
            <g opacity={r(steam * 0.8)} fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round">
              <path className="steam" d="M170 150 C160 132 182 120 172 100" />
              <path className="steam" style={{ animationDelay: "0.8s" }} d="M206 146 C196 126 218 116 208 92" />
              <path className="steam" style={{ animationDelay: "1.6s" }} d="M238 150 C228 132 250 122 240 104" />
            </g>
          )}

          <g clipPath={`url(#${clipId})`}>
            <rect x="96" y="160" width="208" height="300" fill={GLASS_TINT} opacity="0.35" />
            {/* The drink */}
            <path d={surfacePath(level, wobble)} fill={liquid} />
            <path d={surfacePath(level, wobble)} fill={`url(#${clipId}-depth)`} />

            {/* Concentrate marbling, swirling as the spoon turns */}
            {marble > 0 && (
              <g opacity={r(marble)} fill={matterColor}>
                <path
                  transform={`rotate(${r(mix * 220)} 200 330)`}
                  d={`M150 ${r(level + 30)} C190 ${r(level + 10)} 230 ${r(level + 70)} 250 ${r(level + 50)} C262 ${r(level + 90)} 200 ${r(level + 120)} 170 ${r(level + 90)} C150 ${r(level + 80)} 140 ${r(level + 50)} 150 ${r(level + 30)} Z`}
                  opacity="0.75"
                />
                <path
                  transform={`rotate(${r(-mix * 160)} 200 360)`}
                  d={`M180 ${r(level + 120)} C210 ${r(level + 110)} 240 ${r(level + 150)} 222 ${r(level + 170)} C200 ${r(level + 186)} 168 ${r(level + 150)} 180 ${r(level + 120)} Z`}
                  opacity="0.55"
                />
                <ellipse cx="200" cy={r(BOTTOM - 14)} rx={r(46 * marble)} ry="8" opacity="0.6" />
              </g>
            )}

            {/* Powder floating on the surface — it waits for the tool */}
            {powderLayer > 0 && (
              <g fill={matterColor} opacity={r(Math.min(1, powderLayer * 1.4))}>
                <path d={`M120 ${r(level - 2)} C160 ${r(level - 9)} 200 ${r(level + 2)} 280 ${r(level - 5)} L282 ${r(level + 7)} C220 ${r(level + 12)} 170 ${r(level + 4)} 118 ${r(level + 9)} Z`} />
                {[146, 176, 214, 248].map((x, i) => (
                  <circle key={x} cx={x} cy={r(level + 2 + (i % 2) * 4)} r={r(4 + (i % 3) * 1.5)} />
                ))}
              </g>
            )}

            {/* Swirl lines while mixing */}
            {mix > 0 && mix < 1 && (
              <g fill="none" stroke={MILK} strokeWidth="3" strokeLinecap="round" opacity={r(Math.sin(Math.PI * mix) * 0.7)}>
                <path transform={`rotate(${r(mix * 720)} 200 ${r(level + 90)})`} d={`M150 ${r(level + 90)} A50 26 0 0 1 250 ${r(level + 90)}`} />
                <path transform={`rotate(${r(-mix * 540)} 200 ${r(level + 140)})`} d={`M168 ${r(level + 140)} A32 16 0 0 1 232 ${r(level + 140)}`} />
              </g>
            )}

            {/* Foam */}
            {foam > 0 && (
              <g opacity={r(foam)}>
                <path d={surfacePath(level - 1, wobble * 0.6).replace(/L304 [\d.]+ L96 [\d.]+ Z$/, `L304 ${r(level + 12)} L96 ${r(level + 12)} Z`)} fill={mixColor(MILK, liquidColor, 0.28)} />
                {[132, 158, 186, 214, 242, 266].map((x, i) => (
                  <circle key={x} cx={x} cy={r(level + 4 + (i % 2) * 3)} r={2 + (i % 3)} fill={MILK} opacity="0.85" />
                ))}
              </g>
            )}

            {/* Ice */}
            {temp === "iced" && (
              <g fill={GLASS_TINT} fillOpacity="0.62" stroke={INK} strokeWidth="2.2" strokeOpacity="0.55">
                <rect x="138" y={r(level - 10 + Math.sin(t * 20) * 2)} width="44" height="40" rx="8" transform={`rotate(-12 160 ${r(level + 10)})`} />
                <rect x="204" y={r(level - 4)} width="40" height="38" rx="8" transform={`rotate(10 224 ${r(level + 14)})`} />
                <rect x="168" y={r(level + 34)} width="38" height="34" rx="7" transform={`rotate(-5 187 ${r(level + 50)})`} />
              </g>
            )}

            <rect x="96" y="160" width="208" height="300" fill={`url(#${clipId}-sheen)`} />
          </g>

          {/* Glass */}
          <path d={OUTLINE} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="200" cy="170" rx="90" ry="12" fill="none" stroke={INK} strokeWidth="5" />
          <path d="M150 449 L250 449" stroke={INK} strokeWidth="8" strokeLinecap="round" />
          {/* Condensation on a cold glass */}
          {temp === "iced" && (
            <g fill={GLASS_TINT} opacity="0.7">
              <circle cx="126" cy="300" r="2.4" />
              <circle cx="132" cy="352" r="1.8" />
              <circle cx="272" cy="268" r="2.2" />
              <circle cx="264" cy="330" r="1.6" />
            </g>
          )}
        </g>

        {/* Falling powder: a small cloud, then grains landing on the surface */}
        {powder && pour > 0 && pour < 1 && (
          <g fill={matterColor}>
            {grains.map((g, i) => {
              const f = clamp01((pour - g.d) / 0.3);
              if (f <= 0 || f >= 1) return null;
              const x = mouthX + g.s * 26 * f;
              const y = mouthY + f * (level - mouthY);
              return <circle key={i} cx={r(x)} cy={r(y)} r={r(g.z)} opacity={r(0.9 - f * 0.3)} />;
            })}
            <ellipse cx={r(mouthX)} cy={r(level - 16)} rx={r(30 * Math.sin(Math.PI * pour))} ry={r(10 * Math.sin(Math.PI * pour))} opacity="0.25" />
          </g>
        )}

        {/* Concentrate ribbon */}
        {!powder && pour > 0.02 && pour < 0.96 && (
          <path
            d={`M${r(mouthX)} ${r(mouthY)} C${r(mouthX - 4)} ${r(mouthY + 40)} ${r(mouthX + 6)} ${r((mouthY + level) / 2)} ${r(mouthX + 2)} ${r(level + 6)}`}
            stroke={matterColor}
            strokeWidth={r(9 * Math.sin(Math.PI * pour) + 2)}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* The pack, held, torn, tilted — then set aside */}
        <g
          transform={`translate(${r(packX - packOut * 160)} ${r(packY - packOut * 40)}) rotate(${r(angle)} ${13 * S} ${60 * S}) scale(${S})`}
          opacity={r(1 - packOut)}
        >
          {/* Torn top piece flies off */}
          <g transform={`translate(${r(open * 18)} ${r(-open * 24)}) rotate(${r(open * 34)} 13 6)`} opacity={r(1 - seg(t, 0.12, 0.2))}>
            <rect x={powder ? 0 : -8} y="0" width={powder ? 26 : 42} height="10" rx="2" fill={FORET} stroke={INK} strokeWidth="2" />
          </g>
          <g clipPath={undefined}>
            <g transform="translate(0 0)">
              {powder ? <Stick accent={accent} /> : <Sachet accent={accent} />}
            </g>
            {/* Cover the original top once torn */}
            {open > 0.2 && <rect x={powder ? -1 : -9} y="-2" width={powder ? 28 : 44} height="12" fill={LAIT} opacity={r(seg(open, 0.2, 0.6))} />}
          </g>
          <g transform="translate(6 52) scale(0.66)">
            <Hand />
          </g>
        </g>

        {/* The opened pack, set down on the table next to the glass */}
        {packOut > 0 && (
          <g opacity={r(packOut)} transform="translate(392 430) rotate(90) scale(0.8)">
            {powder ? <Stick accent={accent} /> : <Sachet accent={accent} />}
            <rect x={powder ? -1 : -9} y="-2" width={powder ? 28 : 44} height="12" fill={LAIT} />
          </g>
        )}

        <Tool method={tool} k={toolIn} mixing={mix} />
      </g>
    </svg>
  );
}
