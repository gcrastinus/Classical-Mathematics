#!/usr/bin/env python3
"""Extract Fitzpatrick's Euclid (Heiberg Greek left, English right).

Source of truth: the two-column PDF. No LLM. Emits one JSON file per book
under src/content/extracted/fitzpatrick/bookNN.json.

Page ranges follow the PDF's own contents. Body text is ~10pt; footnotes
are ~8pt and are stored separately. Running heads and figure-letter
scatter are dropped. Hyphenation at line ends is rejoined.

Usage:
  python3 scripts/extract_fitzpatrick.py            # all 13 books
  python3 scripts/extract_fitzpatrick.py --book 1
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "Euclid - Elements - Modern English with Greek.pdf"
OUT_DIR = ROOT / "src" / "content" / "extracted" / "fitzpatrick"

# 1-indexed inclusive pages from the PDF contents page.
BOOK_PAGES = {
    1: (5, 48),
    2: (49, 68),
    3: (69, 108),
    4: (109, 128),
    5: (129, 154),
    6: (155, 192),
    7: (193, 226),
    8: (227, 252),
    9: (253, 280),
    10: (281, 422),
    11: (423, 470),
    12: (471, 504),
    13: (505, 538),
}

EXPECTED_PROPS = {
    1: 48, 2: 14, 3: 37, 4: 16, 5: 25, 6: 33,
    7: 39, 8: 27, 9: 36, 10: 115, 11: 39, 12: 18, 13: 18,
}

MID = 306.0          # page width 612; Greek left, English right
BODY_SIZE = 9.4      # keep 10pt body + 12pt headers; drop 8pt notes
Y_BUCKET = 2.6

def norm_text(s: str) -> str:
    return (
        s.replace("\u00a0", " ")
        .replace("ﬁ", "fi")
        .replace("ﬂ", "fl")
        .replace("ﬀ", "ff")
        .replace("ﬃ", "ffi")
        .replace("ﬄ", "ffl")
        .replace("–", "-")
        .replace("—", "—")
    )


HEAD_EL = re.compile(r"^(STOIQEIWN|Οροι|ὅροι)$", re.I)
HEAD_LIT = re.compile(r"^ELEMENTS BOOK \d+$", re.I)
PROP_LIT = re.compile(r"^Proposition\s+(\d+)(†)?\s*$")
PROP_EL = re.compile(r"^[αβγδεϛζηθικλμνξοπρστυφχψω]+\s*[ʹ΄'’þ.]*$", re.I)
NUM_LINE = re.compile(r"^\d+$")
LABEL_TOK = re.compile(r"^[A-Za-zΑ-Ωα-ωΆ-ώ]{1,2}$")
DEF_LIT = re.compile(r"^(\d+)\.\s+(.*)$")
# Greek definition numbers: αʹ. or α'. etc.
DEF_EL = re.compile(r"^([αβγδεϛζηθικλμνξοπρστυφχψω]+)[ʹ΄'’.]+\s*(.*)$")
POST_LIT = re.compile(r"^(\d+)\.\s+(.*)$")
HYPHEN = re.compile(r"[-\u00ad\u2010\u2011]$")

QEF = re.compile(r"required to do", re.I)
QED = re.compile(r"required to show", re.I)


def spans(page, side: str):
    """Yield (y0, x0, x1, size, text) for one column."""
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for s in line["spans"]:
                if s["size"] < BODY_SIZE:
                    continue
                x0, y0, x1, y1 = s["bbox"]
                cx = (x0 + x1) / 2
                if side == "el" and cx >= MID:
                    continue
                if side == "lit" and cx < MID:
                    continue
                text = norm_text(s["text"])
                if not text.strip():
                    continue
                yield y0, x0, x1, s["size"], text


def lines_of(page, side: str):
    items = sorted(spans(page, side), key=lambda t: (t[0], t[1]))
    clusters = []  # {y, bits: [(x0,x1,size,text)]}
    for y0, x0, x1, size, text in items:
        if clusters and abs(y0 - clusters[-1]["y"]) < 3.4:
            clusters[-1]["bits"].append((x0, x1, size, text))
        else:
            clusters.append({"y": y0, "bits": [(x0, x1, size, text)]})
    out = []
    for cl in clusters:
        bits = sorted(cl["bits"], key=lambda t: t[0])
        parts = []
        prev_x1 = None
        for x0, x1, size, text in bits:
            gap = 0 if prev_x1 is None else x0 - prev_x1
            if parts and gap > 0.9 and not parts[-1].endswith(" ") and not text.startswith(" "):
                parts.append(" ")
            parts.append(text)
            prev_x1 = x1
        text = re.sub(r"\s+", " ", "".join(parts)).strip()
        size = max(b[2] for b in bits)
        if text:
            out.append({"y": cl["y"], "size": size, "text": text})
    return out


def is_label_line(text: str) -> bool:
    toks = text.split()
    if not toks or len(toks) > 14:
        return False
    return all(LABEL_TOK.match(t) for t in toks)


def is_running_head(text: str, side: str) -> bool:
    t = norm_text(text).strip()
    if NUM_LINE.match(t):
        return True
    if side == "lit" and HEAD_LIT.match(t):
        return True
    if side == "el" and HEAD_EL.match(t):
        return True
    if side == "el" and re.match(r"^[a-z]{1,3}þ\.?$", t):
        return True
    return False


def clean_page_lines(page, side: str):
    kept = []
    for ln in lines_of(page, side):
        t = ln["text"]
        if is_running_head(t, side):
            continue
        if is_label_line(t):
            continue
        kept.append(ln)
    return kept


def rejoin(lines: list[str]) -> str:
    if not lines:
        return ""
    out = []
    buf = lines[0]
    for nxt in lines[1:]:
        if HYPHEN.search(buf):
            buf = HYPHEN.sub("", buf) + nxt
        else:
            out.append(buf)
            buf = nxt
    out.append(buf)
    # collapse intra-paragraph newlines: keep blank as para break
    paras, cur = [], []
    for ln in out:
        if not ln.strip():
            if cur:
                paras.append(" ".join(cur))
                cur = []
        else:
            cur.append(ln.strip())
    if cur:
        paras.append(" ".join(cur))
    return "\n\n".join(paras)


def collect_book_lines(doc, start: int, end: int, side: str):
    """Flatten cleaned lines across pages, tagging proposition headers."""
    rows = []
    for pno in range(start, end + 1):
        page = doc[pno - 1]
        for ln in clean_page_lines(page, side):
            rows.append({"page": pno, **ln})
    return rows


def split_by_proposition(rows, side: str):
    """Return (front_matter_lines, [{n, dagger, lines}])."""
    front = []
    props = []
    cur = None
    for ln in rows:
        t = ln["text"]
        if side == "lit":
            m = PROP_LIT.match(t)
        else:
            m = None
            # Greek prop headers sit just above "Proposition N" in the
            # other column; we split English first and slice Greek by page/y.
        if m:
            if cur:
                props.append(cur)
            cur = {"n": int(m.group(1)), "dagger": bool(m.group(2)), "lines": []}
            continue
        if cur is None:
            front.append(ln)
        else:
            cur["lines"].append(ln["text"])
    if cur:
        props.append(cur)
    return front, props


LETTER_RUN = re.compile(
    r"(?:(?<=\s)|^)[A-ZΑ-Ω∆](?:\s+[A-ZΑ-Ω∆]){2,}(?=\s|$)"
)


def strip_letter_runs(text: str) -> str:
    return re.sub(r"\s+", " ", LETTER_RUN.sub(" ", text)).strip()


def split_statement(text: str) -> tuple[str, str]:
    """Statement = enunciation; body begins at the ekthesis ('Let …' / ῎Εστω)."""
    text = strip_letter_runs(text)
    m = re.search(
        r"(?<=[.!?··])\s+(Let |For let |For, let |Therefore, let |῎Εστω |Ἔστω |Εστω )",
        text,
    )
    if m:
        return text[: m.start()].strip(), text[m.start():].strip()
    m = re.search(r"\s+(Let |῎Εστω |Ἔστω )", text)
    if m and m.start() > 40:
        return text[: m.start()].strip(), text[m.start():].strip()
    return text.strip(), ""


def kind_of(lit: str) -> str:
    if QEF.search(lit) and not QED.search(lit):
        return "construction"
    if QED.search(lit):
        return "theorem"
    if QEF.search(lit):
        return "construction"
    return "theorem"


def parse_front_lit(lines: list[dict]) -> dict:
    """Definitions / postulates / common notions from the English column."""
    section = "pre"
    defs, posts, cns = [], [], []
    buf = None
    target = None

    def flush():
        nonlocal buf
        if buf and target is not None:
            target.append(buf)
        buf = None

    for ln in lines:
        t = norm_text(ln["text"]).strip()
        low = t.lower()
        if low == "definitions":
            flush(); section = "def"; target = defs; continue
        if low == "postulates":
            flush(); section = "post"; target = posts; continue
        if low == "common notions":
            flush(); section = "cn"; target = cns; continue
        m = DEF_LIT.match(t)
        if m and section in ("def", "post", "cn"):
            flush()
            buf = {"num": int(m.group(1)), "lit": m.group(2)}
            continue
        if buf is not None:
            buf["lit"] = (buf["lit"] + " " + t).strip()
    flush()
    return {"definitions": defs, "postulates": posts, "commonNotions": cns}


def parse_front_el(lines: list[dict], front_lit: dict) -> dict:
    """Attach Greek text to numbered front-matter items in order."""
    # Drop the title 'Οροι' etc; keep numbered items.
    chunks = []
    buf = None
    for ln in lines:
        t = ln["text"]
        m = DEF_EL.match(t)
        if m and (m.group(2) or buf is None):
            if buf:
                chunks.append(buf)
            rest = m.group(2).strip()
            buf = rest
            continue
        if buf is None:
            continue
        buf = (buf + " " + t).strip()
    if buf:
        chunks.append(buf)

    def zip_onto(items):
        for i, it in enumerate(items):
            if i < len(chunks):
                it["el"] = chunks[i]
            else:
                it["el"] = ""
        return items

    # Front matter is defs then posts then CNs in one Greek stream.
    n_d, n_p, n_c = (
        len(front_lit["definitions"]),
        len(front_lit["postulates"]),
        len(front_lit["commonNotions"]),
    )
    zip_onto(front_lit["definitions"])
    rest = chunks[n_d:]
    for i, it in enumerate(front_lit["postulates"]):
        it["el"] = rest[i] if i < len(rest) else ""
    rest2 = rest[n_p:]
    for i, it in enumerate(front_lit["commonNotions"]):
        it["el"] = rest2[i] if i < len(rest2) else ""
    return front_lit


def extract_book(doc, n: int) -> dict:
    start, end = BOOK_PAGES[n]
    title_page = doc[start - 1].get_text("text")
    title = ""
    for ln in title_page.splitlines():
        s = ln.strip()
        if s and not s.startswith("ELEMENTS") and not s.isdigit() and "†" not in s[:1]:
            if len(s) > 8:
                title = s
                break

    lit_rows = collect_book_lines(doc, start, end, "lit")
    el_rows = collect_book_lines(doc, start, end, "el")
    front_lit_rows, lit_props = split_by_proposition(lit_rows, "lit")

    # Greek: split by the same proposition count, using English header pages
    # as anchors. Take Greek lines whose page/y fall between consecutive
    # English "Proposition N" headers.
    el_by_page = {}
    for ln in el_rows:
        el_by_page.setdefault(ln["page"], []).append(ln)

    # Locate English prop headers with page+y
    headers = []
    for ln in lit_rows:
        m = PROP_LIT.match(ln["text"])
        if m:
            headers.append({"n": int(m.group(1)), "page": ln["page"], "y": ln["y"]})

    def el_between(h0, h1):
        texts = []
        for page in range(h0["page"], (h1["page"] if h1 else end) + 1):
            for ln in el_by_page.get(page, []):
                if page == h0["page"] and ln["y"] < h0["y"] - 2:
                    continue
                if h1 and page == h1["page"] and ln["y"] >= h1["y"] - 2:
                    continue
                # skip the Greek numeral header sitting next to "Proposition N"
                if PROP_EL.match(ln["text"]) and abs(ln["y"] - h0["y"]) < 8 and page == h0["page"]:
                    continue
                texts.append(ln["text"])
        return texts

    propositions = []
    for i, hp in enumerate(headers):
        nxt = headers[i + 1] if i + 1 < len(headers) else None
        lit_body = next((p["lines"] for p in lit_props if p["n"] == hp["n"]), [])
        el_body = el_between(hp, nxt)
        lit = rejoin(lit_body)
        el = rejoin(el_body)
        stmt_lit, body_lit = split_statement(lit)
        stmt_el, body_el = split_statement(el)
        propositions.append({
            "n": hp["n"],
            "id": f"b{n}:prop:{hp['n']}",
            "kind": kind_of(lit),
            "statement": {"lit": stmt_lit, "el": stmt_el},
            "body": {"lit": body_lit, "el": body_el},
            "lit_raw": lit,
            "el_raw": el,
        })

    front = parse_front_lit(front_lit_rows)
    # Greek front matter: lines before the first proposition header
    if headers:
        h0 = headers[0]
        el_front = [ln for ln in el_rows
                    if ln["page"] < h0["page"] or (ln["page"] == h0["page"] and ln["y"] < h0["y"] - 2)]
    else:
        el_front = el_rows
    parse_front_el(el_front, front)

    for i, d in enumerate(front["definitions"], 1):
        d["id"] = f"b{n}:def:{d.get('num', i)}"
    for i, d in enumerate(front["postulates"], 1):
        d["id"] = f"b{n}:post:{d.get('num', i)}"
    for i, d in enumerate(front["commonNotions"], 1):
        d["id"] = f"b{n}:cn:{d.get('num', i)}"

    return {
        "book": n,
        "title": title,
        "pages": [start, end],
        "definitions": front["definitions"],
        "postulates": front["postulates"],
        "commonNotions": front["commonNotions"],
        "propositions": propositions,
    }


def validate(book: dict) -> list[str]:
    n = book["book"]
    issues = []
    got = [p["n"] for p in book["propositions"]]
    exp = EXPECTED_PROPS[n]
    if got != list(range(1, exp + 1)):
        missing = [i for i in range(1, exp + 1) if i not in got]
        extra = [i for i in got if i not in range(1, exp + 1)]
        dup = [i for i in got if got.count(i) > 1]
        issues.append(
            f"Book {n}: expected {exp} propositions, got {len(got)} "
            f"missing={missing} extra={extra} dup={sorted(set(dup))}"
        )
    if n == 1:
        if len(book["definitions"]) < 20:
            issues.append(f"Book 1 definitions: {len(book['definitions'])} (want 23)")
        if len(book["postulates"]) != 5:
            issues.append(f"Book 1 postulates: {len(book['postulates'])} (want 5)")
        if len(book["commonNotions"]) != 5:
            issues.append(f"Book 1 common notions: {len(book['commonNotions'])} (want 5)")
    empty = [p["n"] for p in book["propositions"] if len(p["lit_raw"]) < 80]
    if empty:
        issues.append(f"Book {n}: very short English on props {empty}")
    return issues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", type=int, nargs="*")
    args = ap.parse_args()
    if not PDF.exists():
        print("missing", PDF, file=sys.stderr)
        return 1
    books = args.book or list(BOOK_PAGES)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    all_issues = []
    for n in books:
        book = extract_book(doc, n)
        issues = validate(book)
        path = OUT_DIR / f"book{n:02d}.json"
        path.write_text(json.dumps(book, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(
            f"book {n:2d}: {len(book['propositions']):3d} props, "
            f"{len(book['definitions']):2d} defs, "
            f"{len(book['postulates'])} posts, "
            f"{len(book['commonNotions'])} cns  -> {path.name}"
        )
        for iss in issues:
            print("  !", iss)
            all_issues.append(iss)
        if book["propositions"]:
            p = book["propositions"][0]
            print("    P1 stmt:", (p["statement"]["lit"] or "")[:110].replace("\n", " "))
    if all_issues:
        print(f"\n{len(all_issues)} validation issue(s)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
