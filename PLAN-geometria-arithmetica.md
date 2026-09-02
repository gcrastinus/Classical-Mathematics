# Geometria & Arithmetica

*Builds on the live Chapter-1 app in `index.html` and on `PLAN-elements-13-books.md`. That earlier plan still governs extraction, figures, claims, and trilingual layering. This document records the product split and the highlight contract.*

---

## Decisions (locked)

| Question | Decision |
|---|---|
| Packaging | Two apps, one shared core |
| Coverage | Augros **course** + full Euclid **corpus** (all 465 propositions) |
| Split | **Geometria:** Elements I–VI, X–XIII (Augros Ch. 1–6, 8–11). **Arithmetica:** Elements VII–IX (Augros Ch. 7) |
| Playback | Keep the current Replay / step / beat player. Do not invent a new advance model |
| Wording | Augros modern English first. Fitzpatrick literal + Heiberg Greek later |
| Foundation | The live Classical Mathematics geometry app (Augros Ch. 1), including its animations and accessory tools |

Common notions and the idea of equality live in both apps. Geometric postulates and plane/solid definitions live in Geometria. Book VII number-definitions live in Arithmetica. Book V (proportion of magnitudes) and Book X (irrationals) stay in Geometria.

---

## What we already have (do not rewrite)

The live app is `index.html` — a single-file reader with:

- Augros Chapter 1: 24 definitions, 5 postulates, 5 common notions, 2 further principles, 39 theorems (1, 1a, 1b, 2–37), remarks, questions, two hooks
- Constraint-based figures (`geom.js` + `FIGS`), drag-to-deform with clamps
- Construction **draw-on** (lines and circles trace themselves; they do not pop in)
- Step playback, `hlBeats` / `hlIds` / auto `refsIn`, Byrne colours
- Accessory tools: construction-lines toggle, Replay, speed, fullscreen **studio** (alter / preserve / view lock), **workbench** (postulate tools + challenges), **recitation** (FIGKEY relief), citation popovers, two-way text↔figure highlighting

`content.json` and `app-engine.js` are an older generation. The embedded `window.CONTENT` in `index.html` is the source of truth.

`PLAN-elements-13-books.md` already specifies the two **shelves** (Course vs Elements corpus), the extraction pipeline (Fitzpatrick + Augros + Joyce cites), and figure/claims authoring. That work is still the way we grow past Book I.

---

## Product shape

```
                    ┌────────────── shared core ──────────────┐
                    │  geom engine, beat player, studio,      │
                    │  workbench, recitation, claims, build   │
                    │  content store (one record per prop)    │
                    └────────┬─────────────────────┬──────────┘
                             │                     │
                      Geometria.app         Arithmetica.app
                      course + corpus       course + corpus
                      I–VI, X–XIII          VII–IX
```

Near term there is only geometry content, so **Geometria is the current app**, re-titled. Arithmetica is a second shell that stays a stub until Book VII exists. Shared code is extracted when the second shell is stood up, not before — we will not split the tree while there is only one book.

Each app has two shelves over one store (unchanged from the 13-book plan):

- **Course** — Augros’s path: kid lines, remarks, questions, hooks. Default landing, same UX as today.
- **Elements** — Euclid’s order, every proposition. Modern layer when Augros (or a later modern note) covers it; otherwise Fitzpatrick English, with Greek waiting for the language switch.

One JSON record per proposition, tagged with both addresses (`aug:ch1:thm:1` ↔ `b1:prop:1`). Augros-only extras (hooks, 1a/1b as teaching inserts, non-Euclidean asides) live on the Course shelf only. Euclid propositions Augros skips live on the Elements shelf only.

---

## Highlight contract (the quality bar)

Playback stays as it is: step forward with → / Replay; multi-beat steps already tick on a timer.

What changes is **what each step is allowed to light**, and **in what order**. Today 221 of 252 Book I steps rely on auto `refsIn`, which lights every token in the sentence at once and often extras via `expandAngleRays` / `expandPolySides`. That is the source of stray highlights.

### Per-step choreography

Author `hlBeats` (or a single `hlIds` when one frame is enough) so a step does, in order:

1. **Given** — only what the hypothesis already put on the figure (the ekthesis). Nothing constructed later.
2. **Names in sentence order** — each object the sentence *names*, as it names it. Not neighbours, not the rest of a triangle unless the text names the triangle.
3. **Draw** — if the step produces a line, ray, or circle, that object is in a `draw` beat so it traces on. It must not already be sitting on the figure at full ink.
4. **Result** — the equality, cut, intersection, or finished figure the sentence concludes. Then the extras go dim.

A construction step (“Draw circle X around A with radius AB”) is typically:

`[seg:AB, pt:A, pt:B]` → `{ draw: ["cir:A"] }` → `[cir:A, seg:AB, pt:A]`

A demonstration step (“AC = AB, since both are radii of circle A”) is typically:

`[cir:A]` → `[seg:AC]` → `[seg:AB]` → `[seg:AC, seg:AB]` (result: the two equal radii)

### Rules

- No auto `refsIn` as the highlight set for a proof step. `refsIn` may still mark clickable tokens in the prose.
- `hlNot` / `hlExpand: "none"` when a named angle must not drag its rays, or a triangle must not drag unused sides.
- Scaffold (compass circles after they have done their work) stays off unless the sentence names them or the construction-lines box is on.
- Producing a line (Postulate 2) animates the extension past the endpoint; it does not flash a pre-drawn infinite line.
- Circles always `anim-draw` from the centre’s first named radius point, not fade-in.

Book I is the place this contract is proven: walk every theorem, fix the strays the current animations already have, and only then copy the pattern to later books.

---

## Content growth (from the 13-book plan)

Unchanged in substance:

| Phase | Content | Notes |
|---|---|---|
| 0 | Split engine/content, course/corpus shelves, ids with book prefixes | Do this as soon as Book I highlight QA is green, before Ch. 2 multiplies the file |
| 1 | Book I retrofit: highlight contract on all 39 items; Euclid I.1–48 on the corpus shelf (the few Augros skips in lit English) | Pipeline proven |
| 2 | Books II–IV + Augros Ch. 2–4 | Circles, polygons |
| 3 | Books V–VI + Ch. 5–6 | Proportion, similar figures — still Geometria |
| 4 | Books VII–IX + Ch. 7 → **stand up Arithmetica** | Number-as-segment diagrams; Book X + Ch. 8 stay in Geometria |
| 5 | Books XI–XIII + Ch. 9–11 | Activate 3-D `Scene` |

Exit gate per book: every step has explicit beats or `hlIds`; Replay shows no stray ink; constructions draw; drag sweep of free points stays true.

---

## First work

Animation highlight QA is **deferred** (strays exist; we are not chasing them now).

1. **Phase 0 split (done)** — `src/` holds the engine, figures, course content, reader, workbench, and studio. `python3 scripts/build-app.py` reassembles the single-file `index.html`.
2. **Extraction + shelves (done for Book I)** — `scripts/extract_fitzpatrick.py` pulls all 13 books (Heiberg Greek + Fitzpatrick English) from the PDF. Course / Elements shelves in the reader. Book I correspondence maps Augros theorems onto Euclid I.1–48. Corpus-only propositions show Euclid’s text; figures come later.
3. **Book I corpus complete (done)** — Joyce harvest (`src/content/extracted/joyce/book01.json`) supplies Book I English: 23 definitions, 5 postulates, 5 common notions, all 48 proposition statements, and proof **steps** (his demonstration paragraphs, further split at inference seams), plus marginal cites and `usedBy`. The Guide is not stored. Fitzpatrick/Heiberg remain for the literal `prose` and Greek layers. Classical figures: Joyce/Heiberg plates for defs 2, 8–12, 15–23; postulates 1–3; the 12 Augros-skipped propositions. No leftover Elements I holes.
4. **Book II + Augros Chapter 2 (done)** — Joyce harvest for II.1–14; Elements shelf lists Book I and Book II; Course shelf lists Chapter 1 and Chapter 2 (Squares and Rectangles). Correspondence maps the overlapping theorems; Euclid-only II.2–3, 6–10, 12–13 live on Elements; Augros-only isoperimetric theorems 8–11 and Marion’s hook live on Course.
5. **Book III + Augros Chapter 3 (done)** — Joyce harvest for III.1–37 (11 defs); Elements lists Books I–III; Course lists Chapters 1–3 (Circles). Correspondence maps Augros 1–26 onto Euclid; Euclid-only III.7–8, 19, 23–27, 29, 33–35, 37 live on Elements; Miquel / centroid / cotangent hooks live on Course.
6. **Book IV + Augros Chapter 4 (done)** — Joyce harvest for IV.1–16 (7 defs); Course Chapter 4 (9 theorems: inscribed triangles, in/circumcircles, square, golden triangle, pentagon, hexagon, decagon) plus three hooks. Euclid-only IV.1, 7–9, 12–14, 16 live on Elements.
7. **Greek highlight scaffolding (in)** — `Geom.LETTER_EL` maps Latin figure letters to Heiberg (F→Ζ, G→Η, H→Θ). Every `link()` also registers the Greek token, so Heiberg prose can use the same click-to-highlight path. Drawing labels stay Latin until a later relabel pass. `greekHtml` already runs `markup` when a figure is present.
8. **Book V + Augros Chapter 5 (done)** — Joyce harvest for V.1–25 (18 defs). Course Chapter 5 (11 defs, 18 theorems, Three means hook). Classical line-magnitude plates (stacked labeled segments; equimultiples as tick-copies / interior points), not point-clouds. Invertendo and trichotomy are Augros-only; Euclid-only V.2–3, 5–6, 13, 18–21, 24–25 live on Elements.
9. **Book VI + Augros Chapter 6 (done)** — Joyce harvest for VI.1–33 (4 Joyce defs; Heiberg/Fitzpatrick keep 3). Course Chapter 6 (6 defs, 22 theorems, Ceva hook). Classical similar-triangle and polygon plates, lettered like Joyce. Intersecting chords (III.35 by similarity) and the ~ / reciprocal-sides notes are Augros-only; Euclid-only VI.7, 9, 11, 15, 17, 23, 25–29, 32–33 live on Elements. Joyce’s interpolated VI.Def.2 is not packed onto Elements.
10. **Arithmetica stood up + Book VII / Augros Chapter 7 (done)** — Two apps, one core. `index.html` is Geometria (Ch. 1–6, Elements I–VI). `arithmetica.html` is Arithmetica (Ch. 7, Elements VII). Shared engine, reader, and build; content filtered per app. Common notions live in both. Joyce harvest for VII.1–39 (22 defs). Course Chapter 7 (17 defs, 10 number principles, 32 theorems). Numbers drawn as unit-measured segments. Euclid-only VII.3–14, 18, 23, 25–28, 32–33, 35–39 live on Elements. Infinitude of primes, figurate numbers, and even perfect numbers are Augros-only until Books VIII–IX.
11. Next: Elements VIII–IX in Arithmetica. Book X and Chapter 8 stay in Geometria.

### Source layout

```
src/css/app.css
src/shell.html
src/content/course-ch1.json          # Augros Ch. 1
src/content/course-ch2.json          # Augros Ch. 2 (squares and rectangles)
src/content/correspondence/book02.json
src/js/geom.js                       # constraint engine
src/js/figures-defs.js               # Course (gold brick) definition figures
src/js/figures-euclid-defs.js        # Elements Book I defs + postulates 1–3
src/js/figures-thms-a.js             # Theorems 1–20
src/js/figures-thms-b.js             # Theorems 21–37 + hooks
src/js/figures-thms-euclid-b1.js     # Euclid-only I.17, 21, 24–25, 36, 38–42, 44–45
src/js/figkeys.js
src/js/workbench.js
src/js/proof.js
src/js/app.js                        # reader
src/js/fsx.js                        # fullscreen studio
src/js/fsx-enabled.js
src/content/extracted/joyce/book01.json
scripts/build-app.py
scripts/harvest_joyce.py
scripts/smoke-app.js
index.html                           # built; still the file you open
```

Do not edit the old `build.py` / `content.json` / `app-engine.js` — those are a previous generation.
