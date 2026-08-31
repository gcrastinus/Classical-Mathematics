#!/usr/bin/env python3
"""Assemble the single-file Geometria app from src/.

The live teaching app stays one HTML file (openable without a server).
Edit files under src/; run this script to write index.html.

Usage:
  python3 scripts/build-app.py
  python3 scripts/build-app.py --check   # rebuild to a temp path and compare
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"

# Order matches the original index.html script tags.
# The figure/workbench/proof files are concatenated into one <script>
# so load order stays exactly as it was.
ENGINE = ["js/geom.js"]
FIGURES = [
    "js/figures-defs.js",
    "js/figures-euclid-defs.js",
    "js/figures-thms-a.js",
    "js/figures-thms-b.js",
    "js/figures-thms-euclid-b1.js",
    "js/figures-euclid-b2.js",
    "js/figures-thms-ch2.js",
    "js/figures-euclid-b3.js",
    "js/figures-thms-ch3.js",
    "js/figures-euclid-b4.js",
    "js/figures-thms-ch4.js",
    "js/figkeys.js",
    "js/workbench.js",
    "js/proof.js",
]
READER = ["js/fsx-enabled.js", "js/app.js", "js/fsx.js"]
CONTENT_JSON = SRC / "content" / "course-ch1.json"
CONTENT_DIR = SRC / "content"
CORR_DIR = SRC / "content" / "correspondence"
FITZ_DIR = SRC / "content" / "extracted" / "fitzpatrick"
JOYCE_DIR = SRC / "content" / "extracted" / "joyce"

BOOK_TITLES = {
    1: "Book I · Plane Geometry",
    2: "Book II · Squares and Rectangles",
    3: "Book III · Circles",
    4: "Book IV · Polygons",
}
CHAPTER_TITLES = {
    1: "Chapter 1 · Plane Geometry",
    2: "Chapter 2 · Squares and Rectangles",
    3: "Chapter 3 · Circles",
    4: "Chapter 4 · Polygons",
}
TERM_OVERRIDE = {
    "b3:def:2": "Tangent line",
    "b3:def:3": "Circles that touch",
    "b3:def:4": "Equally far from the center",
    "b3:def:5": "Farther from the center",
}

CITE_RE = re.compile(
    r"\[(?:Prop(?:osition)?\.?\s*(\d+)\.(\d+)|Post\.?\s*(\d+)|Def\.?\s*(?:(\d+)\.)?(\d+)|C\.N\.?\s*(\d+))\]",
    re.I,
)


def parse_fitz_cites(text: str) -> list[str]:
    ids = []
    for m in CITE_RE.finditer(text or ""):
        if m.group(1) and m.group(2):
            cid = f"b{int(m.group(1))}:prop:{int(m.group(2))}"
        elif m.group(3):
            cid = f"b1:post:{int(m.group(3))}"
        elif m.group(5):
            book = int(m.group(4) or 1)
            cid = f"b{book}:def:{int(m.group(5))}"
        elif m.group(6):
            cid = f"b1:cn:{int(m.group(6))}"
        else:
            continue
        if cid not in ids:
            ids.append(cid)
    return ids


def read_js(rel: str) -> str:
    text = (SRC / rel).read_text(encoding="utf-8")
    return text


# Polytonic Greek from the Fitzpatrick PDF often arrives with word-spaces dropped.
_GREEK = r"[\u0370-\u03ff\u1f00-\u1fff]"
# Clitics and prepositions: safe to split even when glued to the previous word.
_CLITIC_TOKENS = (
    "ἐστιν|ἐστὶν|εἰσίν|εἰσιν|ἐστὶ(?!ν)|ἀλλὰ|ὥστε|ἐὰν|γὰρ|μὲν|οὖν|δὲ|δὴ|"
    "καὶ|ἄρα|οὐκ|οὐχ|ἀπὸ|ἐπὶ|πρὸς|κατὰ|μετὰ|περὶ|ὑπὸ|διὰ|παρὰ|"
    "ἀφ᾿|ἐφ᾿|καθ᾿|μεθ᾿|ὑπ᾿|δι᾿|παρ᾿|ἐπ᾿|"
    "᾿Επὶ|᾿Απὸ|᾿Εὰν|Ἐπὶ|Ἀπὸ|Ἐὰν|"
    "ἴσοις|ἴσων|ἴσην|ἴσαι|ἴσα(?!ι)|ἴση"
)
# Short articles/relatives: only split at a real word edge, never inside αὐτῷ / τὰς.
_EDGE_TOKENS = (
    "τοὺς|τοῖς|ταῖς|τὰς|τῶν|τὴν|τὸν|τοῦ|τῆς|"
    "τῷ|τῇ|τὸ(?!ν)|Τὰ(?!ς)|τὰ(?!ς)|αἱ|οἱ|ὁ|ἡ|"
    "οὗ|ᾧ|ἣν|ἣ(?!ν)|ὃ|ᾗ|οἷς|αἷς|ὧν"
)
_EKTHESIS_RE = re.compile(
    r"(?<=[.··;])\s+(?="
    r"῎Εστωσαν|Ἔστωσαν|῎Εστω|Ἔστω|"
    r"Εὐθεῖα γάρ|Δύο γὰρ|Πρὸς γάρ|Εἰ γὰρ|Ἐὰν γὰρ|᾿Εὰν γὰρ|"
    r"\S+ γάρ τις|\S+ γὰρ "
    r")"
)


def repair_greek(s: str) -> str:
    """Re-insert spaces the two-column PDF collapsed."""
    if not s:
        return ""
    s = s.replace("\xa0", " ").strip()
    s = re.sub(r"^[.\s]+", "", s)
    clit = _CLITIC_TOKENS
    edge = _EDGE_TOKENS
    s = re.sub(rf"(?<={_GREEK})({clit})(?={_GREEK})(?!ς)", r" \1 ", s)
    s = re.sub(rf"(?<={_GREEK})({clit})(?!{_GREEK})", r" \1", s)
    s = re.sub(rf"(?<!{_GREEK})({clit})(?={_GREEK})(?!ς)", r"\1 ", s)
    s = re.sub(rf"(?<!{_GREEK})({edge})(?={_GREEK})", r"\1 ", s)
    s = re.sub(r"(οὐ)(?=συσ)", r"\1 ", s)
    s = re.sub(r"(μὴ)(?=ἐπ|ἐν|εἰς)", r"\1 ", s)
    s = re.sub(r" {2,}", " ", s)
    s = re.sub(r" +([.,;··])", r"\1", s)
    s = re.sub(rf"(?<=[.··])\s+[Α-Ω∆](?:\s+[Α-Ω∆]){{0,8}}\s+(?={_GREEK})", ". ", s)
    return s.strip()


def split_greek_enunciation(el: str) -> tuple[str, str]:
    """Enunciation vs the rest of the demonstration (ekthesis onward)."""
    s = repair_greek(el)
    if not s:
        return "", ""
    m = _EKTHESIS_RE.search(s)
    if m:
        return s[: m.start() + 1].strip(), s[m.end():].strip()
    m = re.search(r"(῎Εστωσαν|Ἔστωσαν|῎Εστω|Ἔστω)\b", s)
    if m and m.start() > 30:
        return s[: m.start()].strip().rstrip(".,··"), s[m.start():].strip()
    if len(s) > 400:
        m = re.search(r"[.··]\s+", s[50:])
        if m:
            cut = 50 + m.start() + 1
            return s[:cut].strip(), s[cut:].strip()
    return s, ""


def _term_from_lit(lit: str, fallback: str) -> str:
    m = re.match(
        r"^(?:And )?(?:a |an |the )?(.*?)(?:\s+is\b|\s+are\b|\s+\()",
        lit.strip(),
        re.I,
    )
    if m:
        t = m.group(1).strip(" .,").replace("  ", " ")
        if 1 < len(t) < 48:
            return t[0].upper() + t[1:]
    return fallback


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def pack_book(n: int, corr: dict, thm_by_id: dict) -> dict | None:
    fitz_path = FITZ_DIR / f"book{n:02d}.json"
    if not fitz_path.exists():
        return None
    book = _load_json(fitz_path)
    joyce_doc = _load_json(JOYCE_DIR / f"book{n:02d}.json")
    joyce = {rec["id"]: rec for rec in joyce_doc.get("propositions", [])}
    joyce_defs = {d["id"]: d for d in joyce_doc.get("definitions", [])}
    joyce_posts = {d["id"]: d for d in joyce_doc.get("postulates", [])}
    joyce_cns = {d["id"]: d for d in joyce_doc.get("commonNotions", [])}

    by_euclid_title = {}
    aug_of = {}
    for p in corr.get("pairs", []):
        if p.get("euclid"):
            by_euclid_title[p["euclid"]] = p.get("euclidTitle")
            aug_of.setdefault(p["euclid"], []).append(p["aug"])
    for p in corr.get("euclidOnly", []):
        by_euclid_title[p["euclid"]] = p.get("euclidTitle")

    props = []
    for pr in book.get("propositions", []):
        eid = pr["id"]
        fig_ids = aug_of.get(eid) or []
        # Book I reuses Course FIGS['thm:N']. Later chapters draw Euclid
        # plates at bN:prop:N and point the course item at them via figId.
        fig_id = next((a for a in fig_ids if a in thm_by_id and not str(a).startswith('ch')), None)
        fitz_cites = parse_fitz_cites((pr.get("body") or {}).get("lit") or "") + parse_fitz_cites(
            (pr.get("statement") or {}).get("lit") or ""
        )
        j = joyce.get(eid) or {}
        uses = j.get("uses") or fitz_cites
        steps = []
        for st in j.get("steps") or []:
            text = (st.get("text") or "").strip()
            if not text:
                continue
            steps.append({
                "text": text,
                "cites": st.get("cites") or parse_fitz_cites(text),
            })
        fitz_stmt = (pr.get("statement") or {}).get("lit") or ""
        joyce_stmt = (j.get("statement") or "").strip()
        raw_el = ((pr.get("statement") or {}).get("el") or "") + " " + ((pr.get("body") or {}).get("el") or "")
        stmt_el, body_el = split_greek_enunciation(raw_el)
        if not body_el:
            body_el = repair_greek((pr.get("body") or {}).get("el") or "")
        props.append({
            "id": eid,
            "num": pr["n"],
            "kind": pr["kind"],
            "title": by_euclid_title.get(eid) or (joyce_stmt or fitz_stmt)[:72],
            "statement": joyce_stmt or fitz_stmt,
            "statementEl": stmt_el,
            "prose": (pr["body"] or {}).get("lit") or "",
            "proseEl": body_el,
            "steps": steps,
            "end": "Q.E.F." if pr["kind"] == "construction" else "Q.E.D.",
            "figId": fig_id,
            "courseIds": fig_ids,
            "euclid": eid,
            "uses": uses,
            "usedBy": j.get("usedBy") or [],
            "_group": "propositions",
            "_book": n,
        })

    def pack_principles(items, kind_prefix, group, joyce_map):
        out = []
        for it in items:
            j = joyce_map.get(it["id"]) or {}
            lit = (j.get("text") or "").strip() or (it.get("lit") or "")
            term = (j.get("term") or "").strip() or _term_from_lit(lit, kind_prefix + " " + str(it.get("num")))
            if term.lower() in ("contained", "contain"):
                term = "Rectangle contained by two lines"
            term = TERM_OVERRIDE.get(it["id"], term)
            out.append({
                "id": it["id"],
                "num": it.get("num"),
                "term": term,
                "text": lit,
                "textEl": repair_greek(it.get("el") or ""),
                "_group": group,
                "_book": n,
            })
        return out

    return {
        "n": n,
        "id": f"b{n}",
        "title": BOOK_TITLES.get(n) or book.get("title") or f"Book {n}",
        "definitions": pack_principles(book.get("definitions") or [], "Definition", "definitions", joyce_defs),
        "postulates": pack_principles(book.get("postulates") or [], "Postulate", "postulates", joyce_posts),
        "commonNotions": pack_principles(book.get("commonNotions") or [], "Common Notion", "commonNotions", joyce_cns),
        "propositions": props,
    }


def assemble_store() -> dict:
    course = _load_json(CONTENT_JSON)
    extra_chapters = []
    for path in sorted(CONTENT_DIR.glob("course-ch*.json")):
        if path.name == "course-ch1.json":
            continue
        extra_chapters.append(_load_json(path))
    corr_all = {"pairs": [], "euclidOnly": []}
    for path in sorted(CORR_DIR.glob("book*.json")):
        c = _load_json(path)
        corr_all["pairs"].extend(c.get("pairs") or [])
        corr_all["euclidOnly"].extend(c.get("euclidOnly") or [])
        for k in ("postulates", "commonNotions", "note", "book"):
            if k in c and k not in corr_all:
                corr_all[k] = c[k]

    thm_by_id = {t["id"]: t for t in course.get("theorems", [])}
    for ch in extra_chapters:
        for t in (ch.get("theorems") or []) + (ch.get("extra") or []):
            thm_by_id[t["id"]] = t

    for p in corr_all.get("pairs", []):
        t = thm_by_id.get(p.get("aug"))
        if not t:
            continue
        if p.get("euclid"):
            t["euclid"] = p["euclid"]
            t["euclidMatch"] = p.get("match")
        if p.get("note"):
            t["euclidNote"] = p["note"]

    books = []
    for n in range(1, 14):
        if n > 1 and not (JOYCE_DIR / f"book{n:02d}.json").exists():
            continue
        packed = pack_book(n, corr_all, thm_by_id)
        if packed and (packed.get("propositions") or packed.get("definitions")):
            books.append(packed)

    course_chapters = [
        {"n": 1, "id": "ch1", "title": CHAPTER_TITLES[1]},
    ]
    for ch in extra_chapters:
        ch = dict(ch)
        n = int(ch.get("n") or str(ch.get("id") or "ch2").replace("ch", "") or 2)
        ch["n"] = n
        ch.setdefault("id", f"ch{n}")
        ch.setdefault("title", CHAPTER_TITLES.get(n) or f"Chapter {n}")
        course_chapters.append(ch)

    return {
        "defaultShelf": "course",
        "course": course,
        "courseChapters": course_chapters,
        "corpus": {"books": books},
        "correspondence": corr_all,
    }


def content_script() -> str:
    store = assemble_store()
    payload = json.dumps(store, separators=(",", ":"), ensure_ascii=False)
    return (
        "window.STORE=" + payload + ";"
        "window.CONTENT=window.STORE.course;"
    )


def script_tag(body: str) -> str:
    return "<script>" + body + "</script>"


def join_parts(rels: list[str]) -> str:
    """Concatenate source files. Each extracted file already ends with a
    newline; a blank line originally sat between them, so join with \\n\\n."""
    parts = [read_js(r).rstrip("\n") for r in rels]
    return "\n\n".join(parts) + "\n\n"


def build() -> str:
    shell = (SRC / "shell.html").read_text(encoding="utf-8")
    css = (SRC / "css" / "app.css").read_text(encoding="utf-8")
    if "/*__CSS__*/" not in shell or "/*__SCRIPTS__*/" not in shell:
        raise SystemExit("src/shell.html is missing /*__CSS__*/ or /*__SCRIPTS__*/ markers")

    scripts = [
        script_tag(read_js("js/geom.js")),
        script_tag(content_script()),
        script_tag(join_parts(FIGURES)),
        script_tag(read_js("js/fsx-enabled.js")),
        script_tag(read_js("js/app.js")),
        script_tag(read_js("js/fsx.js")),
    ]
    html = shell.replace("/*__CSS__*/", css, 1).replace("/*__SCRIPTS__*/", "\n".join(scripts), 1)
    if not html.endswith("\n"):
        html += "\n"
    return html


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="write nothing; exit 1 if rebuild differs from index.html")
    ap.add_argument("-o", "--output", type=Path, default=OUT)
    args = ap.parse_args()
    html = build()
    store = assemble_store()
    d1 = ((store.get("corpus") or {}).get("books") or [{}])[0]
    defs = (d1.get("definitions") or [])
    if defs and "οὗ μέρος" not in (defs[0].get("textEl") or ""):
        raise SystemExit("Greek spacing: expected οὗ μέρος in Def. 1, got " + repr((defs[0].get("textEl") or "")[:80]))
    if args.check:
        current = args.output.read_text(encoding="utf-8") if args.output.exists() else ""
        if current == html:
            print("ok: rebuild matches", args.output)
            return 0
        print("rebuild differs from", args.output, file=sys.stderr)
        print("  current", len(current), "bytes; rebuild", len(html), "bytes", file=sys.stderr)
        for i, (a, b) in enumerate(zip(current, html)):
            if a != b:
                lo = max(0, i - 60)
                print("  first diff at", i, file=sys.stderr)
                print("  current ", repr(current[lo:i + 60]), file=sys.stderr)
                print("  rebuild ", repr(html[lo:i + 60]), file=sys.stderr)
                break
        else:
            print("  one is a prefix of the other", file=sys.stderr)
        return 1
    args.output.write_text(html, encoding="utf-8")
    print("wrote", args.output, f"({len(html)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
