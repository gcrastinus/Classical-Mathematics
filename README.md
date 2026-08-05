# Geometry Playground — Augros Chapter 1

Interactive single-page web app for **Michael Augros, *Introductory Arithmetic and Geometry*, Chapter 1** (definitions through the Pythagorean theorem).

## Open

Double-click **`index.html`** (fully self-contained).

## Features

| Feature | How to use |
|--------|------------|
| **Step-through proofs** | Begin proof / Next step, or `→` / `←` keys |
| **Linked reasons** | Click Def. / Post. / C.N. / Thm. chips for text + mini drawing |
| **Highlight / isolate** | Click diagram parts; current proof step dims the rest |
| **🎬 Construction replay** | On constructions (and selected theorems), animate steps in order |
| **⠿ Drag to deform** | Blue handles on selected theorems — invariants stay true (e.g. isosceles apex on the bisector) |
| **🎨 Byrne colors** | Header toggle — Oliver Byrne–style blue / yellow / red / black |
| **🔑 Answer keys** | Open a challenge → hint → Show answer key |
| **High-fidelity figures** | Especially Thms 1, 3, 32–34, 36 (Pythagoras with outer squares) |

### Especially good for dragging

- **Thm 1** — change base; equilateral rebuilds  
- **Thm 3** — apex stays on the perpendicular bisector (base angles stay equal)  
- **Thm 28** — free triangle vertices; exterior + angle sum figure  
- **Thm 32 / 33** — shear / move vertices in the same parallels  
- **Thm 36** — change legs; squares update  

## Files

| File | Role |
|------|------|
| `index.html` | **The app** (embedded data + engine) |
| `content.json` | Source content (defs, theorems, answers, interactive flags) |
| `app-engine.js` | Source engine (assembled into `index.html`) |
| `build.py` | Earlier content builder (optional) |

To rebuild after editing `content.json` or `app-engine.js`, re-run the assemble snippet in the project history, or paste:

```bash
# from chapter1-app/ — reassemble with your editor/script if needed
python3 -c "print('Use the assemble logic from the last build session')"
```

## Content notes

- Follows Augros’s proof structure; wording lightly adapted for interactive steps and younger readers  
- Answer keys for selected end-of-theorem questions  
- Introduction of the book is omitted by design  
