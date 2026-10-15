// Capture d'un fichier SVG/HTML local en PNG (contrôle visuel du plan généré).
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
const [, , input, output] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 480 } });
await p.setContent(`<body style="margin:0">${readFileSync(input, "utf8")}</body>`);
await p.screenshot({ path: output, fullPage: true, timeout: 60000 });
await b.close();
