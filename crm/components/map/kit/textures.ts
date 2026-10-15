/**
 * Textures procédurales dessinées en canvas : aucun téléchargement.
 * Les textures de sol couvrent une tuile de TILE mètres et se répètent
 * (les UV des sols sont en mètres).
 */
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
export const TILE = 4;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function finish(c: HTMLCanvasElement, repeat = 1 / TILE, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, rnd: () => number, dark = "0,0,0") {
  for (let i = 0; i < w * h * 0.02; i++) {
    ctx.fillStyle = `rgba(${dark},${rnd() * amount})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

type Floor = "parquet_clair" | "beton_cire" | "tatami" | "carrelage" | "moquette" | "resine" | "paves" | "gazon" | "enrobe";

export function floorTexture(kind: Floor): THREE.Texture {
  const key = `floor:${kind}`;
  if (cache.has(key)) return cache.get(key)!;
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const rnd = seeded(kind.length * 97 + 13);
  switch (kind) {
    case "parquet_clair": {
      // Lames de chêne clair, joints décalés
      ctx.fillStyle = "#E3CCA5";
      ctx.fillRect(0, 0, S, S);
      const plank = S / 8;
      for (let row = 0; row < 8; row++) {
        let x = -rnd() * S * 0.5;
        while (x < S) {
          const len = S * (0.35 + rnd() * 0.4);
          const l = 205 + rnd() * 30;
          ctx.fillStyle = `rgb(${l + 12},${l - 8},${l - 48})`;
          ctx.fillRect(x, row * plank, len, plank);
          ctx.strokeStyle = "rgba(120,90,50,0.10)";
          for (let g = 0; g < 5; g++) {
            ctx.beginPath();
            const gy = row * plank + rnd() * plank;
            ctx.moveTo(x, gy);
            ctx.bezierCurveTo(x + len * 0.3, gy + (rnd() - 0.5) * 6, x + len * 0.6, gy + (rnd() - 0.5) * 6, x + len, gy);
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(110,80,45,0.35)";
          ctx.fillRect(x, row * plank, 1.5, plank);
          x += len;
        }
        ctx.fillStyle = "rgba(110,80,45,0.3)";
        ctx.fillRect(0, row * plank, S, 1.5);
      }
      break;
    }
    case "tatami": {
      ctx.fillStyle = "#D8CF93";
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 3) {
        ctx.fillStyle = `rgba(120,110,40,${0.05 + rnd() * 0.08})`;
        ctx.fillRect(0, y, S, 1);
      }
      ctx.fillStyle = "#2E4A33";
      for (const [x, y, w, h] of [[0, 0, S, 10], [0, S / 2 - 5, S, 10], [0, 0, 10, S], [S / 2 - 5, 0, 10, S / 2]]) ctx.fillRect(x, y, w, h);
      break;
    }
    case "carrelage": {
      ctx.fillStyle = "#EDEBE6";
      ctx.fillRect(0, 0, S, S);
      const t = S / 8;
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          const l = 232 + rnd() * 10;
          ctx.fillStyle = `rgb(${l},${l - 1},${l - 4})`;
          ctx.fillRect(i * t + 1, j * t + 1, t - 2, t - 2);
        }
      break;
    }
    case "moquette": {
      ctx.fillStyle = "#AEB8BC";
      ctx.fillRect(0, 0, S, S);
      noise(ctx, S, S, 0.25, rnd);
      noise(ctx, S, S, 0.2, rnd, "255,255,255");
      break;
    }
    case "resine": {
      ctx.fillStyle = "#C9D3CB";
      ctx.fillRect(0, 0, S, S);
      noise(ctx, S, S, 0.06, rnd);
      break;
    }
    case "beton_cire": {
      const g = ctx.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, "#D5D1C9");
      g.addColorStop(1, "#CBC6BD");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "90,85,75"},${rnd() * 0.06})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * S, rnd() * S, 20 + rnd() * 90, 10 + rnd() * 50, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      noise(ctx, S, S, 0.08, rnd);
      ctx.fillStyle = "rgba(90,85,75,0.25)";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      break;
    }
    case "paves": {
      ctx.fillStyle = "#C9C5BC";
      ctx.fillRect(0, 0, S, S);
      const t = S / 16;
      for (let j = 0; j < 16; j++)
        for (let i = -1; i < 9; i++) {
          const l = 205 + rnd() * 25;
          ctx.fillStyle = `rgb(${l},${l - 3},${l - 10})`;
          ctx.beginPath();
          ctx.roundRect(i * t * 2 + (j % 2) * t + 2, j * t + 2, t * 2 - 4, t - 4, 4);
          ctx.fill();
        }
      break;
    }
    case "gazon": {
      ctx.fillStyle = "#A9C98A";
      ctx.fillRect(0, 0, S, S);
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? "70,110,50" : "200,225,160"},${rnd() * 0.25})`;
        ctx.fillRect(rnd() * S, rnd() * S, 1.5, 3 + rnd() * 3);
      }
      break;
    }
    case "enrobe": {
      ctx.fillStyle = "#8E918F";
      ctx.fillRect(0, 0, S, S);
      noise(ctx, S, S, 0.25, rnd);
      noise(ctx, S, S, 0.12, rnd, "255,255,255");
      break;
    }
  }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

/** Sol extérieur général (terrain), clair et doux. */
export function groundTexture() {
  const key = "ground";
  if (cache.has(key)) return cache.get(key)!;
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const rnd = seeded(7);
  ctx.fillStyle = "#ECEAE4";
  ctx.fillRect(0, 0, S, S);
  noise(ctx, S, S, 0.04, rnd);
  const t = finish(c, 1 / 8);
  cache.set(key, t);
  return t;
}

/** Route avec marquage central et bandes de bord (U le long de la route, V en travers). */
export function roadTexture() {
  const key = "road";
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(512, 256);
  const rnd = seeded(3);
  ctx.fillStyle = "#8C8F8D";
  ctx.fillRect(0, 0, 512, 256);
  noise(ctx, 512, 256, 0.2, rnd);
  ctx.fillStyle = "#F2F0E8";
  for (let x = 0; x < 512; x += 128) ctx.fillRect(x + 20, 124, 70, 8);
  ctx.fillRect(0, 14, 512, 5);
  ctx.fillRect(0, 237, 512, 5);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Enduit ivoire avec lambris bas vert (murs hauts habillés). */
export function wallTexture(material: "enduit" | "brique" | "bardage") {
  const key = `wall:${material}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(256, 256);
  const rnd = seeded(material.length);
  if (material === "bardage") {
    ctx.fillStyle = "#E9E6DE";
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = "rgba(80,80,70,0.12)";
      ctx.fillRect(x, 0, 2, 256);
    }
  } else {
    ctx.fillStyle = "#F1ECE1";
    ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0.05, rnd);
    // Lambris : bas du mur (V proche de 0 → bas du canvas)
    ctx.fillStyle = "#DCCFB4";
    ctx.fillRect(0, 210, 256, 46);
    ctx.fillStyle = "rgba(90,70,40,0.25)";
    ctx.fillRect(0, 210, 256, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Texte peint au sol (noms d'espaces, numéros). */
export function paintedText(text: string, opts: { color?: string; font?: number; width?: number } = {}) {
  const key = `paint:${text}:${opts.color}:${opts.font}`;
  if (cache.has(key)) return cache.get(key)!;
  const font = opts.font ?? 64;
  const [m, mctx] = canvas(8, 8);
  void m;
  mctx.font = `600 ${font}px "Geist", "Helvetica Neue", Arial, sans-serif`;
  mctx.letterSpacing = `${font * 0.12}px`;
  const tw = Math.ceil(mctx.measureText(text).width + text.length * font * 0.12) + 24;
  const [c, ctx] = canvas(tw, Math.ceil(font * 1.4));
  ctx.font = `600 ${font}px "Geist", "Helvetica Neue", Arial, sans-serif`;
  ctx.letterSpacing = `${font * 0.12}px`;
  ctx.fillStyle = opts.color ?? "rgba(23,61,43,0.55)";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 12, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  (t.userData as { aspect: number }).aspect = c.width / c.height;
  cache.set(key, t);
  return t;
}

/** Logo de marque (mur, totem, camions). */
export function logoTexture(name: string, opts: { bg?: string; fg?: string; dot?: string } = {}) {
  const key = `logo:${name}:${opts.bg}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(1024, 256);
  ctx.fillStyle = opts.bg ?? "#173D2B";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = opts.fg ?? "#F3EFE5";
  ctx.font = `700 132px "Geist", "Helvetica Neue", Arial, sans-serif`;
  ctx.letterSpacing = "18px";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(name, 512, 136);
  ctx.fillStyle = opts.dot ?? "#79A84B";
  ctx.beginPath();
  ctx.arc(512 + ctx.measureText(name).width / 2 + 22, 62, 16, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

/** Écran d'ordinateur : contenu selon l'application ouverte. Non mis en cache (peut être animé). */
export type ScreenApp = "crm" | "tableur" | "design" | "code" | "terminal" | "visio" | "mail" | "verrouille" | "eteint" | "ventes" | "presentation" | "bienvenue";

const screenCache = new Map<string, THREE.CanvasTexture>();
export function screenTexture(app: ScreenApp, variant = 0) {
  const key = `${app}:${variant % 4}`;
  if (screenCache.has(key)) return screenCache.get(key)!;
  const [c, ctx] = canvas(256, 160);
  const rnd = seeded(app.length * 31 + variant);
  const bg: Record<string, string> = { code: "#1E2420", terminal: "#0E120F", eteint: "#141614", verrouille: "#1F3A2C", visio: "#2A2F2B" };
  ctx.fillStyle = bg[app] ?? "#F7F6F2";
  ctx.fillRect(0, 0, 256, 160);
  const bar = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  switch (app) {
    case "code":
      for (let i = 0; i < 14; i++) {
        let x = 10 + (i % 4) * 8;
        while (x < 220 * rnd() + 30) {
          const w = 10 + rnd() * 30;
          bar(x, 10 + i * 10, w, 5, ["#79A84B", "#E0B15F", "#7FB3C9", "#D7D2C4", "#C98AB8"][Math.floor(rnd() * 5)]);
          x += w + 5;
        }
      }
      break;
    case "terminal":
      for (let i = 0; i < 12; i++) bar(10, 10 + i * 12, 40 + rnd() * 170, 5, i % 4 === 0 ? "#79A84B" : "#9FB59C");
      break;
    case "tableur":
      bar(0, 0, 256, 16, "#2F7A4D");
      for (let r = 0; r < 10; r++) for (let k = 0; k < 6; k++) bar(4 + k * 42, 22 + r * 13, 40, 11, r === 0 ? "#DDE9DF" : rnd() > 0.85 ? "#FCE9C8" : "#FFFFFF");
      break;
    case "design":
      bar(0, 0, 36, 160, "#2B2D2A");
      bar(220, 0, 36, 160, "#2B2D2A");
      bar(60, 24, 136, 110, "#E7E1D2");
      ctx.fillStyle = "#173D2B";
      ctx.beginPath();
      ctx.roundRect(98, 40, 60, 80, 8);
      ctx.fill();
      bar(112, 64, 32, 8, "#79A84B");
      break;
    case "crm":
    case "ventes":
      bar(0, 0, 44, 160, "#173D2B");
      for (let i = 0; i < 4; i++) bar(54 + i * 50, 10, 44, 26, "#EFEBE1");
      for (let i = 0; i < 12; i++) bar(54 + i * 16, 140 - (20 + rnd() * 70), 10, 20 + rnd() * 70, i % 3 ? "#79A84B" : "#E07A5F");
      ctx.strokeStyle = "#173D2B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) ctx.lineTo(58 + i * 16, 60 + Math.sin(i + variant) * 12);
      ctx.stroke();
      break;
    case "mail":
      bar(0, 0, 70, 160, "#EDEAE2");
      for (let i = 0; i < 9; i++) bar(76, 8 + i * 17, 170, 12, i === 1 ? "#E4EEDA" : "#FFFFFF");
      break;
    case "visio":
      for (let i = 0; i < 4; i++) {
        bar(8 + (i % 2) * 124, 8 + Math.floor(i / 2) * 74, 116, 68, ["#4C5A52", "#5C5148", "#475766", "#5A4F60"][i]);
        ctx.fillStyle = ["#E8C7A8", "#C98E64", "#F2D3B8", "#A86B45"][i];
        ctx.beginPath();
        ctx.arc(66 + (i % 2) * 124, 40 + Math.floor(i / 2) * 74, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "presentation":
      bar(0, 0, 256, 160, "#173D2B");
      ctx.fillStyle = "#F3EFE5";
      ctx.font = "700 22px Arial";
      ctx.fillText("Discovery Box", 20, 60);
      bar(20, 80, 120, 6, "#79A84B");
      break;
    case "bienvenue":
      bar(0, 0, 256, 160, "#173D2B");
      ctx.fillStyle = "#F3EFE5";
      ctx.font = "700 20px Arial";
      ctx.fillText("Bienvenue", 74, 84);
      break;
    case "verrouille":
      ctx.fillStyle = "#F3EFE5";
      ctx.font = "600 34px Arial";
      ctx.fillText("09:41", 86, 80);
      break;
    case "eteint":
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  screenCache.set(key, t);
  return t;
}

/** Disque en dégradé radial : ombre de contact, halo de sélection. */
export function radialTexture(inner: string, outer = "rgba(0,0,0,0)") {
  const key = `radial:${inner}:${outer}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  cache.set(key, t);
  return t;
}

/** Étiquettes de cartons (rayonnages) : boîtes vertes de la marque. */
export function boxSideTexture() {
  const key = "boxside";
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = "#173D2B";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#F3EFE5";
  ctx.font = "700 18px Arial";
  ctx.fillText("MATOCHA", 18, 70);
  ctx.fillStyle = "#79A84B";
  ctx.beginPath();
  ctx.arc(108, 50, 5, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}
