---
format: 1080x1920
duration: 30s
fps: 30
message: "A café-grade matcha latte at home: open the box, tear a stick, whisk — done."
arc: Brand mark → Box hero → Open → Tear → Pour → Water → Whisk → Ice → Milk → Hero → CTA
audience: Matcha-curious buyers on Reels / TikTok
mode: autonomous
music: "original, procedural — 96 BPM lo-fi house in D major (Gmaj9 · F#m7 · Em9 · A7sus → Dmaj9)"
grid: "1 bar = 2.5 s, 1 beat = 0.625 s; every scene change lands on a downbeat"
---

## Video direction

Flat-vector editorial, built only from the brand system: heavy-outline glass (#161713),
deep-green carton (#173D2B / #0F2A1E), fresh matcha liquid (#79A84B), ivory ground (#F3EFE5)
with window light, long cast shadows and paper grain. Archivo for statements, Instrument
Serif italic for the human voice, uppercase tracked labels for chrome. Coral (#E07A5F) appears
once — the CTA. Two worlds share one camera grammar: World A (the box) and World C (the
glass station, where the stick, whisk, ice, milk and — at the end — the box live). The glass
is the anchor from 9.5 s to the last frame; colour script ivory → green (whisk) → ivory (hero).
Motion: one virtual camera per world (`viewport-change`), velocity-matched match cut A→C,
seek-safe procedural liquids/particles driven from timeline time, eases varied per beat.

## Frame 1 — The mark draws itself

- scene: Macro on the box print: the glass emblem draws on in ivory, matcha rises inside, camera pulls back
- duration: 2.5s
- transition_in: cold open
- status: animated
- src: index.html
- poster: 1.2
- blueprint: zoom-out-workspace-reveal (adapt) · rules: svg-path-draw, viewport-change

0.15–1.05 outline strokes draw (power2.inOut), rim + base follow; 0.8–1.6 liquid wave rises.
1.0–2.5 camera A pulls back 3.9× → 1× with a −5° roll settling to 0 (power3.inOut): the green
field turns out to be the front of the box, standing on an ivory counter in window light. Lands
on the 2.5 s downbeat.

## Frame 2 — Hook + box hero

- scene: "Matcha latte, made simple." over the box; sheen sweeps the carton
- duration: 2.5s
- transition_in: continuous camera
- status: animated
- src: index.html
- poster: 4.2
- rules: waterfall-entry, ambient-glow-bloom (sheen), sine-wave-loop

## Frame 3 — Open

- scene: Lid swings open on its hinge, 30 sticks spring up, the hero stick rises and the camera follows it in
- duration: 2.5s
- transition_in: word swap on the downbeat
- status: animated
- src: index.html
- poster: 6.2
- blueprint: camera-journey A (adapt) · rules: spring-pop-entrance, viewport-change

5.05–5.75 lid hinge 0→118° (settles 108°), inner flap printed "Matcha. Made simple.";
5.45–6.1 sticks pop centre-out; 6.25–7.5 hero stick lifts, camera A pushes 1×→4.95× onto it.

## Frame 4 — Tear

- scene: Match cut to the stick close-up; the top rips off with a puff of matcha; camera pulls back onto the glass
- duration: 2.5s
- transition_in: match cut (invisible) at 7.5 s
- status: animated
- src: index.html
- poster: 8.4
- rules: particle-burst (puff), multi-phase-camera, motion-blur-streak
- handoff_in: hero stick — screen centre x 540, top y 380, width 360 px, rotation 0, opacity 1, velocity 0

8.125 rip (top piece flung, 14-particle puff, 0.25 s camera shake); 8.45–9.7 camera C 2.32×→1×
while the stick swings to −128° over the glass.

## Frame 5 — Pour

- scene: A stream of matcha powder falls into the empty glass and builds a little mound
- duration: 2.5s
- transition_in: continuous camera
- status: animated
- src: index.html
- poster: 10.8
- rules: particle-burst (continuous ballistic stream, index-seeded), spring-pop-entrance

## Frame 6 — A splash of water

- scene: Water pours in, the liquid rises murky-green, bubbles; camera eases toward the glass
- duration: 2.5s
- transition_in: continuous
- status: animated
- src: index.html
- poster: 13.6

## Frame 7 — Whisk

- scene: The world turns matcha-green; the whisk zig-zags on the 16ths, the liquid goes vivid and froths
- duration: 5s
- transition_in: circle iris from the glass (green), ink flips to ivory
- status: animated
- src: index.html
- poster: 17.0
- rules: motion-blur-streak (ghost trail), sine-wave-loop

## Frame 8 — Ice

- scene: Three ice cubes drop on the beat and splash
- duration: 1.25s
- transition_in: word swap
- status: animated
- src: index.html
- poster: 20.9
- rules: particle-burst (splash), spring-pop-entrance

## Frame 9 — Milk

- scene: Milk pours through the green and blooms underneath — the layered iced latte; slow push-in
- duration: 3.75s
- transition_in: word swap
- status: animated
- src: index.html
- poster: 23.4
- rules: viewport-change (push), sine-wave-loop (marbling)

## Frame 10 — Hero

- scene: Ivory iris back to daylight; camera pulls back, the box slides in beside the finished latte
- duration: 2.5s
- transition_in: circle iris (ivory) + pull-back with parallax
- status: animated
- src: index.html
- poster: 26.6
- rules: viewport-change, depth parallax

## Frame 11 — CTA

- scene: MATOCHA wordmark, "Matcha. Made simple.", coral pre-order pill, facts — box and latte stay in shot
- duration: 2.5s
- transition_in: type swap on the downbeat
- status: animated
- src: index.html
- poster: 29.3
- blueprint: logo-assemble-lockup (adapt) · rules: waterfall-entry, spring-pop-entrance
