---
workflow: general-video
flow: automation
storyboard: no
message: "A café-grade matcha latte at home: open the box, tear a stick, whisk — done."
destination: reels-tiktok
aspect: 1080x1920
language: en
audience: "Matcha-curious buyers scrolling Instagram / TikTok, mostly France"
length: 30s
angle: product-ritual-demo
narration: no
---

## Intent

A product film for MATOCHA (30 × 2 g matcha sticks, "Matcha. Made simple.") that walks
through making an iced matcha latte: the box opens, a stick comes out and is torn, the
powder pours into the glass, a splash of water, the whisk, ice, milk — and the finished
latte next to the box. Very professional motion design: zooms, beautiful transitions,
appetizing, makes people want to buy. The box must be heavily featured (user: "Très
important de montrer la boîte").

User's words: « montre comment tu fais avec la boisson, un latte… comment tu mélanges,
comment tu ouvres le produit et aussi avec la boîte… Fait avec des zooms, avec des belles
transitions… vraiment très pro et que ça donne envie aux personnes d'acheter. »

## Assets

- business-plan-assets/matocha-box.svg — the 30 × 2G box; rebuilt as a live, openable SVG (lid hinge, sticks inside).
- business-plan-assets/matocha-stick-green.svg, matocha-stick-ivory.svg — the 2 g stick, both colourways.
- business-plan-assets/matocha-glass-*.svg — the brand glass (outline, rim, heavy base, wave surface); the latte is built inside it.
- business-plan-assets/fonts.css — Archivo + Instrument Serif (base64) → extracted to assets/fonts/.
- src/data/brand.ts — palette (#173D2B, #0F2A1E, #79A84B, #F3EFE5, #E7E1D2, #161713, #E07A5F), lines, facts, price.

## Customizations

- Illustrated (flat vector, brand outline style) — no live-action footage exists.
- Continuous virtual camera: macro-to-wide box reveal, push-in follow of the stick, match cut into the tear close-up.
- Original procedural soundtrack (96 BPM lo-fi house) + synthesized foley (lid, rip, powder, water, whisk, ice, milk). No narration.
- Coral (#E07A5F) reserved for the single CTA.

## Notes

- Copy stays inside brand.ts facts: 100% Japanese matcha, 2 g per stick, 30 sticks, no sugar/additives, pre-order, €39.
- Recipe follows the site's own iced preparation (content.ts → preparations[Iced]).
- On-screen language EN (brand voice, site lang="en"); a FR cut is a cheap follow-up.
