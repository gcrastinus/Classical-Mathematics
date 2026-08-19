# Plan: The Complete Elements — 13 Books, Three Languages
*Revision 2 — updated for the confirmed source set.*

Extend the existing app to the whole of Euclid's Elements with three switchable text
layers — the Augros modern recasting, Fitzpatrick's literal English, and Heiberg's Greek —
selected by a language button in the header.

---

## 0. The source set (all now confirmed)

1. **Fitzpatrick, *Euclid's Elements of Geometry*** (attached PDF, 545 pp., Heiberg's Greek
   **left** column, English translation **right** column — note: reversed from the first
   draft of this plan). Permission to use confirmed. Critically: the PDF extracts cleanly
   with `pdftotext -layout` — columns separate correctly, diacritics intact, proposition
   headers in both languages (`STOIQEIWN aþ` / `ELEMENTS BOOK 1`, `mþ.` / `Proposition 40†`).
   **Extraction is therefore a scripted pipeline, not an LLM reading a PDF** — the LLM's
   job shrinks to cleanup, structuring, and validation. Far more reliable.
2. **Augros, *Introductory Geometry and Arithmetic*** (attached PDF, 386 pp.). This is the
   volume whose Chapter 1 the app already implements — and it covers the entire span:

   | Augros chapter | ≈ Elements book(s) |
   |---|---|
   | 1 Basics (in the app) | I |
   | 2 Squares | II |
   | 3 Circles | III |
   | 4 Polygons | IV |
   | 5 Proportion in General | V |
   | 6 Proportions in Plane Geometry | VI |
   | 7 Numbers | VII–IX |
   | 8 Irrational Magnitudes | X |
   | 9 Basic Solid Geometry | XI |
   | 10 Volumes and Areas | XII |
   | 11 The Five Perfect Solids | XIII |

   So the **modern layer exists for every book** — the largest risk in revision 1 is gone.
   Augros is selective (key theorems, not all 465), which shapes the architecture below.
3. **Joyce (Clark University)** — `aleph0.clarku.edu/~djoyce/elements/`. Static,
   server-rendered, fully fetchable page-by-page. Three uses:
   - **Citation structure**: his marginal references (I.Post.3, I.Def.15, C.N.1, prior
     propositions) sit next to the exact sentence they justify — they harvest directly
     into the app's `cites` arrays, step by step.
   - **Dependency graph**: every proposition page ends with "Use of Proposition …" —
     machine-harvestable; powers a future "where is this used?" feature and orders work.
   - **Commentary**: his Guide sections (critiques, hidden assumptions, historical notes)
     inform the modern remarks/questions we author — *reference only, his prose is
     copyrighted; nothing is copied.* The dead Java applets are irrelevant; his GIF
     diagrams remain a lettering cross-check.
   `elements.ratherthanpaper.com` is demoted to an occasional visual cross-check (it is
   client-rendered and harder to extract; everything it offers, Joyce or Fitzpatrick
   offers more accessibly).

## 1. What we already have

Unchanged from revision 1: the constraint engine, declarative FIGS + macro library,
reader with two-way highlighting, the FSX studio (camera gestures, preserve/free alter,
view lock), the CHECKS truth-claim DSL with live flag/restore, the `Scene` 3-D scaffold,
and — decisive for this project — the headless jsdom harness that gates all generated
content (pristine-green sweep, drag sweep, break/restore).

## 2. Architecture: two shelves, one store

Because Augros is a *course* (selective, with remarks/questions/hooks) and the Elements is
a *corpus* (complete), the app gets two shelves over one content store:

- **Course shelf** — Augros Chapters 1–11, exactly like today's Chapter 1: full features,
  modern text primary, `kid` lines, remarks, questions, hooks.
- **Elements shelf** — Books I–XIII, all 465 propositions, organized Euclid's way,
  literal + Greek always present; the modern layer appears wherever a correspondence
  exists to an Augros item.
- One record per proposition, tagged with both addresses (`aug:ch3:thm:7` ↔ `b3:prop:22`);
  the correspondence map is data (Prompt P1b produces it). Items appear on both shelves
  without duplication. Augros-only material (his hooks, his non-Euclidean extras like the
  medial-triangle surprise) lives on the Course shelf alone; Euclid propositions Augros
  skips live on the Elements shelf alone, `en` falling back to `lit`.

**Language layer** (unchanged in essence): every text field `{ en, lit, el }`; header
button cycles **Mod → Lit → ΕΛ**; localStorage persistence; per-item fallback to the best
available layer. Greek lettering handled by a global letter map (A↔Α … F↔Ζ, G↔Η, H↔Θ,
K↔Κ…) plus per-proposition `letterMap` where the modern figure renames points; figure
labels re-render in the active language; Greek aliases must match letter clusters inside
inflected phrases ("τῆς ΑΒ", "ἡ ὑπὸ τῶν ΒΑΓ γωνία").

**Structural changes** (Phase 0): engine/content split (`engine.js` + `book01.js…book13.js`
+ `course02.js…course11.js`, lazy-loaded; build script assembles a single-file fallback);
ids gain shelf/book prefixes with aliases for today's Book-I ids; book-shelf navigation
level; claims DSL additions (`eqRatio`, `similar`, tangency/inscribed-angle helpers,
arithmetic claims, and the 3-D trio `coplanar`/`perpToPlane`/`eqVolume`).

## 3. The extraction pipeline (scripted first, LLM second)

**Step A — scripted, no LLM**: `pdftotext -layout` per book; split columns at the stable
x-midpoint (verified working on this PDF); detect proposition boundaries from the paired
headers; strip running heads; rejoin hyphenation; emit *raw* per-proposition records
`{ el_raw, lit_raw }`. Figures come out as letter scatter — dropped (we build our own).
The same scripted pass extracts Augros chapters (his layout is single-column and clean)
and walks Joyce's pages for cites + dependency lists.

**Step B — LLM cleanup and structuring** (Prompts P1/P1b below): repair residual column
bleed, tag statement/construction/proof/porism parts, validate counts (I=48, II=14,
III=37, IV=16, V=25, VI=33, VII=39, VIII=27, IX=36, X=115, XI=39, XII=18, XIII=18),
verify every Greek letter list matches between columns.

## 4. Phasing

| Phase | Content | New machinery |
|---|---|---|
| 0 | Split build, shelves, language layer, letter maps, DSL adds, extraction pipeline over all 13 books + Augros + Joyce harvest | infrastructure |
| 1 | Book I retrofit: lit/el aligned onto all existing items; cites enriched from Joyce; the few Book-I propositions Augros skips added in lit/el | pipeline proven end-to-end |
| 2 | Books II–IV + Augros Ch. 2–4 | circle/tangency claims |
| 3 | Books V–VI + Ch. 5–6 | `eqRatio`, `similar`, magnitude bars |
| 4 | Books VII–X + Ch. 7–8 | number-line builders, arithmetic claims; Book X gets an auto-template for its ~115 mostly-linear diagrams |
| 5 | Books XI–XIII + Ch. 9–11 | 3-D activation of `Scene` |

Exit gate per phase: full automated sweep green + human skim of every figure.

## 5. Division of labor

**Grok** (long-context text work): P1 Fitzpatrick cleanup, P1b Augros structuring +
correspondence map, P2 trilingual step alignment, P5 letter maps, P7 Joyce harvest QA.
**Opus 5** (precision code against the harness): P3 figures, P4 claims, P6 3-D upgrade.
Everything lands only after the harness passes it.

---

## 6. The prompts

### P1 — Grok: Fitzpatrick cleanup & structuring (per book)

```
Input: machine-split text for Book {N} of Fitzpatrick's Euclid: an array of records
{ n, el_raw, lit_raw } produced by a column-splitter (Greek was the LEFT column, English
the RIGHT). The split is mostly clean but may contain residual bleed (a clause from the
wrong column), figure-letter debris, and page-header fragments.

For each record output:
{ "num": n, "kind": "construction"|"theorem"|"lemma"|"porism-of:<n>",
  "statement": { "lit", "el" },
  "setout":    { "lit", "el" },       // the ekthesis ("Let AB be...") if present
  "proof":     { "lit", "el" },       // full prose, paragraph breaks preserved
  "porism":    { "lit", "el" } | null,
  "letters":   ["Α","Β",...],         // every point letter, Greek alphabet order
  "notes":     [ "…" ]                // anything you repaired or are unsure of
}

Rules: never translate, paraphrase, or normalize spelling; preserve every diacritic;
keep Fitzpatrick's bracketed insertions "[Prop. 1.31]" in lit (they seed our citations);
remove figure-letter debris and page headers; where a clause is in the wrong column,
move it and log in notes; mark illegible text "[?]". kind = construction iff the
statement is an instruction (Q.E.F. proposition). Validate: Book {N} must yield
{expected count} propositions; the letters list must be derivable from BOTH columns —
flag any mismatch (possible split error).
```

### P1b — Grok: Augros chapter → app content + correspondence map

```
Input 1: the full text of Augros, "Introductory Geometry and Arithmetic", Chapter {C}.
Input 2: the JSON content of the app's existing Chapter 1 (its definitions, theorems,
steps, remarks, questions, hooks) as the format exemplar — the app IS this book's
Chapter 1, so match its structure and editorial voice exactly.
Input 3: the Book-{N} proposition list from Fitzpatrick (statements only).

Produce:
1. content JSON for Chapter {C} in the app's schema: definitions (with 'kid' lines where
   Augros gives an everyday gloss), theorems with num/title/aka/kind/statement, steps
   (his numbered reasoning cut into single-inference steps, each with cites where he
   names them), remarks, questions (with his hints/answers where given), hooks.
2. a correspondence map: for every theorem, { "aug": "ch{C}:thm:K",
   "euclid": "b{N}:prop:M" | null, "match": "exact"|"variant"|"composite"|"none",
   "note": "…" }. Augros sometimes merges two propositions, proves a variant, or adds
   modern material — classify honestly; never force a match.
Text is copied verbatim from Augros (this layer is his voice); do not modernize further,
do not invent steps he doesn't have. Flag any theorem whose proof text you could not cut
cleanly into steps.
```

### P2 — Grok: trilingual step alignment (per proposition)

```
Input 1: the proposition's structured record from P1 (lit + el proof prose).
Input 2: its modern step list (from P1b, or the app's existing Book-I steps).

Cut the literal English proof AND the Greek proof into exactly as many segments as the
modern step list, segment k expressing the same inference as step k. Segments must be
verbatim substrings, in order, jointly exhaustive; split only at sentence/clause
boundaries (Greek particles δή, γάρ, ἄρα, ὥστε mark inference joints). A modern step
with no counterpart gets "" and the uncovered text goes to the nearest neighbour. The
Greek and English cuts must correspond to EACH OTHER as well as to the steps (Fitzpatrick
is nearly sentence-parallel — exploit that).
Output { "steps": [ { "lit", "el" } ] } + per-step confidence: exact | merged | empty.
```

### P3 — Opus 5: figure authoring (per proposition)

```
Write one figure for a constraint-based Euclid engine. Attached:
(A) the engine API crib sheet [Fig methods: pt(name,x,y,{clamp,dir,noXform}),
    ptOn(name,seg|circle,t,{lo,hi}), at(name,p,{show,step,dir,hideUntilHl,keepAfterStep}),
    seg/ray/line/circle/arc/poly/face/tick/ang/text/arrowSeg/link, helpers equi /
    equiAway(state-hysteresis) / perpBisect / squareOn / squareOnKeyed / keepSide /
    keepOffLine / onPerpBisector / minDistFrom, geometry fns V,add,sub,mul,unit,perp,mid,
    lerp,dist,interCC,interLL,interLC,footOf,rotAbout];
(B) the proposition record: statement, aligned steps, letters, cites;
(C) two exemplar figures (thm:1a, thm:3) showing step-numbering, scaffold roles,
    until/hideUntilHl staging, clamp guards, and the given-length handle pattern;
(D) the Joyce diagram for this proposition (lettering/topology cross-check only).

Non-negotiable rules:
1. Free points = exactly Euclid's free choices; every constructed object is DERIVED
   (interCC/interLL/offsets) — nothing placed by eye.
2. Preserve-mode drags must keep every step true: add degeneracy clamps (minimum
   separations, hypothesis constraints like AC > AB, triangle-inequality bounds); given
   segments become one-dimensional noXform length handles (thm:1b / thm:19 pattern).
3. Per-rebuild side choices need state hysteresis (equiAway / squareOnKeyed pattern).
4. step: numbers follow the aligned list; compass circles role:'scaffold', wide:true;
   callouts get until:. Use the proposition's own letters.
Output ONLY FIGS['b{N}:prop:{M}'] = { build(b){...} } plus a 3-line comment: free points;
clamps and why; derivation chain.
Acceptance (machine-run): builds; every lettered point in the steps exists; pristine
CHECKS green; ±30px drag sweep of every free point stays green.
```

### P4 — Opus 5: truth claims (per proposition)

```
Attached: aligned steps, the FIGS source (for point names and object ids), and the claims
DSL reference [eqSeg,ltSeg,gtSeg,betw,eqAng,gtAng,acute,rightAng,sumSeg,gtSumSeg,sum2R,
angEqSum,para,circAt,circR,onCirc,cong,eqArea,eqQuad,halfQuad,sumQuad,pythag,eqRatio,
similar,tangent,coplanar,perpToPlane,eqVolume].
Write CHECKS['b{N}:prop:{M}'] = { step:[claims] }:
- construction steps: claim preconditions/products (centres, radii, incidence, betweenness);
- assertion steps: claim the stated relation (comparisons are lenient by design);
- reductio/supposition/impossibility/case-analysis steps: NO claims;
- claim only what the figure maintains (read the FIGS source; an illustrative lerp()
  point equals nothing).
Acceptance: pristine = zero flags; free-point drag sweep = zero flags; in free-edit mode
moving any named point flags ≥1 step and restoring it clears all.
```

### P5 — Grok: letter maps & Greek aliases (per proposition)

```
Input: modern figure point names (from FIGS), Fitzpatrick's English letters, Greek
letters (P1 record). Output { modern: { "A": {"lit":"A","el":"Α"}, … } } for every named
point; compound highlight tokens per language (segments "ΑΒ", triangles "ΑΒΓ", angle
phrases: both "∠ΑΒΓ" and the article forms "ἡ ὑπὸ ΑΒΓ", "ἡ ὑπὸ τῶν ΑΒΓ γωνία");
modernOnly:true for scaffold points absent from Euclid. Flag any renaming conflicts.
```

### P6 — Opus 5: the 3-D activation (one-time, entry to Phase 5)

```
Attached: geom.js and fsx.js sources. Extend, breaking no 2-D behaviour:
1. V(x,y,z=0); vector ops n-ready; dist/rotAbout unchanged at z=0.
2. Scene.project: orthographic with orbiting camera (yaw/pitch about target); in figures
   flagged is3D, FSX one-finger drag = orbit, two-finger = existing pinch/roll/pan.
3. Fig additions: pt3, face3 (planar polygon, painter-sorted), solid builders: prism,
   pyramid, cylinder, cone, sphere (silhouette + great circles), and the five regular
   solids parameterised for Book XIII.
4. Claims: coplanar, perpToPlane, eqVolume (convex decomposition).
5. View lock, alter modes, truth checking work identically; 2-D figures render
   pixel-identically (regression: the Book-I sweep).
Deliver as minimal diffs with a test list.
```

### P7 — Grok: Joyce harvest QA (per book, after the scripted crawl)

```
Input: for each proposition of Book {N}, the scripted harvest from Joyce's pages:
(a) marginal citations in order of appearance, (b) the "Use of Proposition" list,
(c) our aligned step list.
Task 1: attach each citation to the step it justifies (Joyce places them beside the
sentence; our steps segment the same prose) → per-step cites arrays in app format
("post:3", "def:15", "cn:1", "b1:prop:31").
Task 2: emit the dependency edges {uses:[...], usedBy:[...]} per proposition.
Task 3: flag any proposition where Joyce's lettering disagrees with Fitzpatrick's
(possible figure divergence worth a human look). Do not copy any of Joyce's prose.
```

---

## 7. Workflow per proposition

1. Pipeline record exists (P1) → P2 alignment → human skim of the Greek cuts.
2. Modern layer: from P1b if Augros covers it; else `en` falls back to `lit`.
3. P3 figure → harness → iterate. P4 claims → harness. P5 letter map → trilingual QA:
   switch all three languages at three random steps; click-highlighting must light the
   same geometry.
4. P7 cites merged. Commit; the book sweep stays green in CI (the jsdom harness).

## 8. Risks & early decisions (revised)

- ~~Modern layer missing for II–XIII~~ — resolved: Augros covers all books (selectively);
  the two-shelf design absorbs the selectivity.
- **Correspondence ambiguity**: Augros merges/varies propositions; P1b classifies matches
  honestly rather than forcing them — expect "variant" to be common in Ch. 5–8.
- **Licensing**: Fitzpatrick — permitted (confirmed). Augros — the user's own course
  volume. Joyce — structure and facts harvested, prose never copied. ratherthanpaper —
  not used as a source.
- **Greek tokenisation** in inflected phrases — P5 covers; shake down on Book I first.
- **Book X volume** (115 props): auto-template linear diagrams before hand-authoring.
- **Split build** must land in Phase 0, before content multiplies.
