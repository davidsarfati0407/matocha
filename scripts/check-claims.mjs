#!/usr/bin/env node
/**
 * §14.7 — Forbidden strings check.
 *
 * Scans the site source for claims that must never appear unless they are a
 * Proof field (src/content/catalog/index.ts, where every value is typed and
 * shown only once `confirmed`). Exits 1 on any hit outside the allowlist.
 * Run: node scripts/check-claims.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN = ["src"];
/* The catalogue holds Proof fields (values + public targets); the test stub is not shipped. */
const PROOF_FILES = new Set(["src/content/catalog/index.ts"]);

const RULES = [
  [/100\s?%\s*(de\s+|d')?[a-zà-ü]/i, "« 100 % … »"],
  [/\bbio(logique)?\b/i, "bio"],
  [/\buji\b/i, "Uji"],
  [/c[ée]r[ée]moni(al|elle)/i, "cérémonial"],
  [/sans additif/i, "sans additifs"],
  [/recyclable|compostable/i, "recyclable"],
  [/d[ée]tox|br[ûu]le.graisse|anti.stress|sans crash|(^|[^\w:.-])focus(?![-:\w(])/i, "allégation santé"],
  [/10 secondes|z[ée]ro grumeau|aucune amertume|tout liquide/i, "promesse non testée"],
  [/\b(le|la) premi[eè]re? (marque|stick)|invent[ée]/i, "« le premier / inventé »"],
  [/39[,.]00|35[,.]10|\b3900\b/i, "ancien prix"],
  [/2\s?[–-]\s?4 (jours|working)/i, "délai inventé"],
  [/franco|free shipping/i, "franco"],
  [/best.?seller|\bavis clients?\b|\b\d([.,]\d)?\s?\/\s?5\b(?![\]\w])|étoiles|★/i, "avis / best-seller"],
  [/\bjapon(ais)?\b|japanese|japan\b/i, "origine Japon"],
  [/instagram\.com\/?["'`]|tiktok\.com\/?["'`]|pinterest\.com\/?["'`]/i, "racine de réseau social"],
];

/* Justified exceptions: file → patterns that may appear there, and why. */
const ALLOW = {
  "scripts/check-claims.mjs": "this list",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|json)$/.test(name)) out.push(p);
  }
  return out;
}

let hits = 0;
for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file);
    if (ALLOW[rel] || PROOF_FILES.has(rel)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const [re, label] of RULES) {
        if (re.test(line)) {
          hits++;
          console.log(`${rel}:${i + 1}  [${label}]  ${line.trim().slice(0, 140)}`);
        }
      }
    });
  }
}
console.log(hits === 0 ? "OK — aucune chaîne interdite hors champs Proof." : `\n${hits} occurrence(s) à vérifier.`);
process.exit(hits === 0 ? 0 : 1);
