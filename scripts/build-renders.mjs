#!/usr/bin/env node
/**
 * Builds the responsive variants of the v2 renders.
 *
 * Masters: assets/renders-v2/*.jpg, kept byte for byte as received (no PNG
 * re-encode: it would add weight, not detail). For each render and each crop:
 * AVIF + WebP at several widths, NEVER wider than the crop's native width,
 * plus one JPEG fallback. Crops are plain extracts of the master (no resize
 * up, no sharpening). Writes public/renders/v2/* and src/content/renders.json.
 *
 * Run: node scripts/build-renders.mjs
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "assets/renders-v2");
const OUT = join(ROOT, "public/renders/v2");
const WIDTHS = [480, 640, 828, 1080, 1280, 1672];

/* Crops in master pixels. "full" is the whole frame. */
const RENDERS = {
  "matocha-v2-hero": {
    full: null,
    /* Phones: box + both sticks, seals included. 1050 px wide so a 350 px
       frame at DPR 3 still gets native pixels. */
    mobile: { left: 600, top: 0, width: 1050, height: 941 },
  },
  "matocha-v2-marketing": { full: null },
  "matocha-v2-poudre": { full: null },
  "matocha-v2-latte": { full: null },
  /* Shown whole, in landscape: a 4:5 crop would only be 753 px wide. */
  "matocha-v2-swirl": { full: null },
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const manifest = {};
for (const [id, crops] of Object.entries(RENDERS)) {
  const master = join(SRC, `${id}.jpg`);
  const meta = await sharp(master).metadata();
  manifest[id] = { master: { width: meta.width, height: meta.height, format: meta.format }, crops: {} };

  for (const [crop, box] of Object.entries(crops)) {
    const area = box ?? { left: 0, top: 0, width: meta.width, height: meta.height };
    const widths = [...new Set([...WIDTHS.filter((w) => w < area.width), area.width])];
    const entry = { width: area.width, height: area.height, avif: [], webp: [], fallback: "" };

    for (const w of widths) {
      const base = sharp(master).extract(area).resize({ width: w, withoutEnlargement: true, kernel: "lanczos3" });
      const name = `${id}-${crop}-${w}`;
      /* 4:4:4 chroma keeps the small cream "2G" and wordmark edges clean. */
      await base.clone().avif({ quality: 62, chromaSubsampling: "4:4:4", effort: 6 }).toFile(join(OUT, `${name}.avif`));
      await base.clone().webp({ quality: 84, smartSubsample: true }).toFile(join(OUT, `${name}.webp`));
      entry.avif.push([w, `/renders/v2/${name}.avif`]);
      entry.webp.push([w, `/renders/v2/${name}.webp`]);
    }
    const fw = widths.find((w) => w >= 1080) ?? area.width;
    const fallback = `${id}-${crop}-${fw}.jpg`;
    await sharp(master).extract(area).resize({ width: fw, withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toFile(join(OUT, fallback));
    entry.fallback = `/renders/v2/${fallback}`;
    manifest[id].crops[crop] = entry;
  }
}

writeFileSync(join(ROOT, "src/content/renders.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(Object.entries(manifest).map(([id, m]) => `${id} ${m.master.width}×${m.master.height} → ${Object.keys(m.crops).join(", ")}`).join("\n"));
