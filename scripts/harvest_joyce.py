#!/usr/bin/env python3
"""Harvest Joyce's Book I: statements, front matter, proof paragraphs, cites.

The Guide/commentary is not stored. Proof steps come from the theorem body
on https://mathcs.clarku.edu/~djoyce/elements/bookI/propIN.html
(unclosed <p> tags, a <div class="just"> sitting above the paragraph it licenses).

Definitions, postulates, common notions, and proposition statements come from
the Book I index (same site). Fitzpatrick/Heiberg stay the literal + Greek layer.
"""
from __future__ import annotations

import argparse
import html as htmlmod
import json
import re
import ssl
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOYCE_DIR = ROOT / "src" / "content" / "extracted" / "joyce"
ROMAN_INV = {v: k for k, v in {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
    "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13,
}.items()}
# filled below after ROMAN dict
EXPECTED = {
    1: {"defs": 23, "posts": 5, "cns": 5, "props": 48},
    2: {"defs": 2, "posts": 0, "cns": 0, "props": 14},
    3: {"defs": 11, "posts": 0, "cns": 0, "props": 37},
    4: {"defs": 7, "posts": 0, "cns": 0, "props": 16},
}

JUST_RE = re.compile(r'<div class="just">(.*?)</div>', re.S | re.I)
HREF_RE = re.compile(r"<a[^>]*>([^<]+)</a>", re.I)
USE_RE = re.compile(
    r"Use of Proposition\s+\d+</h4>\s*(.*?)(?:<div id=\"footer\"|<h4|<hr)",
    re.S | re.I,
)
STATEMENT_RE = re.compile(r'<div class="statement">(.*?)</div>', re.S | re.I)

ROMAN = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
    "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13,
}

TERM_FIX = {
    "right": "Right angle",
    "parallel": "Parallel lines",
    "rectilinear": "Rectilinear angle",
}
POST_TERMS = {
    1: "Straight line from point to point",
    2: "Produce a finite straight line",
    3: "Circle with any center and radius",
    4: "Right angles are equal",
    5: "The parallel postulate",
}
CN_TERMS = {
    1: "Things equal to the same thing",
    2: "Equals added to equals",
    3: "Equals subtracted from equals",
    4: "Things which coincide",
    5: "The whole is greater than the part",
}

CONTINUE_RE = re.compile(
    r"(?<=\.)\s+(?=(?:"
    r"Therefore |Then,? |But |And |Subtract |Add |Now |Accordingly |"
    r"Since |I say |Again,? |Out of |For if |Join |Describe |Let |"
    r"It is required |Take "
    r"))"
)

_SSL = ssl._create_unverified_context()


def cite_id(label: str) -> str | None:
    s = re.sub(r"\s+", "", label.strip())
    s = s.replace("Prop.", "").replace("Proposition", "")
    m = re.match(r"([IVX]+)\.Post\.(\d+)", s, re.I)
    if m:
        b = ROMAN.get(m.group(1).upper(), 1)
        return f"b{b}:post:{int(m.group(2))}"
    m = re.match(r"([IVX]+)\.Def\.(\d+)", s, re.I)
    if m:
        b = ROMAN.get(m.group(1).upper(), 1)
        return f"b{b}:def:{int(m.group(2))}"
    m = re.match(r"C\.N\.?(\d+)?", s, re.I)
    if m:
        n = m.group(1) or "1"
        return f"b1:cn:{int(n)}"
    m = re.match(r"([IVX]+)\.(\d+)$", s)
    if m:
        b = ROMAN.get(m.group(1).upper())
        if b:
            return f"b{b}:prop:{int(m.group(2))}"
    return None


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "GeometriaHarvest/1.0"})
    with urllib.request.urlopen(req, timeout=20, context=_SSL) as r:
        return r.read().decode("latin-1", errors="replace")


def book_roman(n: int) -> str:
    for k, v in ROMAN.items():
        if v == n:
            return k
    return str(n)


def index_url(book: int) -> str:
    r = book_roman(book)
    return f"https://mathcs.clarku.edu/~djoyce/elements/book{r}/book{r}.html"


def prop_url(book: int, n: int) -> str:
    r = book_roman(book)
    return f"https://mathcs.clarku.edu/~djoyce/elements/book{r}/prop{r}{n}.html"


def out_path(book: int) -> Path:
    return JOYCE_DIR / f"book{book:02d}.json"


def fetch(n: int, book: int = 1) -> str:
    return fetch_url(prop_url(book, n))


def html_to_text(s: str) -> str:
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = re.sub(r"</?(i|em|b|strong|span|font)[^>]*>", "", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmlmod.unescape(s)
    s = s.replace("\xa0", " ")
    s = re.sub(r"[ \t\r\n]+", " ", s).strip()
    s = re.sub(r" +([.,;:])", r"\1", s)
    return s


def first_italic(piece: str) -> str | None:
    m = re.search(r"<i>(.*?)</i>", piece, re.S | re.I)
    if not m:
        return None
    t = html_to_text(m.group(1)).strip(" .,;")
    return t or None


def clean_term(raw: str | None, text: str, fallback: str) -> str:
    if raw:
        key = raw.lower()
        if key in TERM_FIX:
            return TERM_FIX[key]
        if 1 < len(raw) < 48:
            return raw[0].upper() + raw[1:]
    m = re.match(
        r"^(?:And )?(?:a |an |the )?(.*?)(?:\s+is\b|\s+are\b|\s+\()",
        text.strip(),
        re.I,
    )
    if m:
        t = m.group(1).strip(" .,").replace("  ", " ")
        if 1 < len(t) < 48:
            return t[0].upper() + t[1:]
    return fallback


def cites_from_just(block: str) -> list[str]:
    ids = []
    for lab in HREF_RE.findall(block):
        cid = cite_id(lab)
        if cid and cid not in ids:
            ids.append(cid)
    return ids


def harvest_proof_steps(html: str) -> list[dict]:
    """Paragraphs of the demonstration, each with the cites sitting above it."""
    m = re.search(r'<div class="theorem">(.*)', html, re.S | re.I)
    if not m:
        return []
    chunk = m.group(1)
    cut = re.search(r'<a name=guide|<h2>\s*Guide|<h4>\s*Use of', chunk, re.I)
    if cut:
        chunk = chunk[: cut.start()]
    starts = list(re.finditer(
        r'<div class="(?:just|statement|qed|ldiagram)"|<p\b',
        chunk,
        re.I,
    ))
    pending: list[str] = []
    steps: list[dict] = []
    for i, mm in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(chunk)
        piece = chunk[mm.start():end]
        tag = mm.group(0).lower()
        if "just" in tag:
            pending.extend(cites_from_just(piece))
            continue
        if "statement" in tag or "qed" in tag or "ldiagram" in tag:
            continue
        if not tag.startswith("<p"):
            continue
        text = html_to_text(piece)
        if not text or len(text) < 8:
            continue
        if text.upper() in ("Q.E.D.", "Q.E.F."):
            continue
        cites = pending[:]
        pending = []
        steps.append({"text": text, "cites": cites})
    return steps


def harvest_statement(html: str) -> str:
    m = STATEMENT_RE.search(html)
    return html_to_text(m.group(1)) if m else ""


def harvest_used_by(html: str, n: int, book: int = 1) -> list[str]:
    used_by = []
    m = USE_RE.search(html)
    if not m:
        return used_by
    for lab in HREF_RE.findall(m.group(1)):
        cid = cite_id(lab)
        if cid and cid not in used_by and cid != f"b{book}:prop:{n}":
            used_by.append(cid)
    if used_by:
        return used_by
    plain = re.sub(r"<[^>]+>", " ", m.group(1))
    for mm in re.finditer(r"\b([IVX]+)\.(\d+)\b", plain):
        b = ROMAN.get(mm.group(1).upper())
        if not b:
            continue
        cid = f"b{b}:prop:{int(mm.group(2))}"
        if cid not in used_by and cid != f"b{book}:prop:{n}":
            used_by.append(cid)
    return used_by


def expand_therefore(st: dict) -> list[dict]:
    """Joyce sometimes packs several 'Therefore' inferences in one <p>."""
    text = st["text"]
    cites = st.get("cites") or []
    n_th = len(re.findall(r"(?:^|\. )Therefore ", text))
    if n_th < 2 or len(text) < 140:
        return [st]
    parts = re.split(r"(?<=\.)\s+(?=Therefore )", text)
    out = []
    for i, p in enumerate(parts):
        p = p.strip()
        if p:
            out.append({"text": p, "cites": cites if i == 0 else []})
    return out or [st]


def split_once(text: str) -> list[str] | None:
    """One pedagogical cut of a dense Joyce paragraph, or None."""
    # I.7 reductio opener: given + construction of the other pair
    m = re.match(
        r"(If possible, given two straight lines .+? meeting at the point C), let two other (.+)",
        text,
    )
    if m:
        return [m.group(1).rstrip(",") + ".", "Let two other " + m.group(2)]
    m = re.match(
        r"(Let two other straight lines .+? from the same end), so that (.+)",
        text,
    )
    if m:
        return [m.group(1) + ".", "So that " + m.group(2)]
    if text.startswith("Therefore given two straight lines constructed from the ends"):
        return ["Therefore this is impossible."]

    if len(text) < 140:
        return None

    # Superposition reductio: claim, for if (false coincidence), then (I.7)
    m = re.match(r"(.+), for, if (.+), then (.+)$", text)
    if m and len(text) >= 200:
        return [
            m.group(1).rstrip(" ,") + ".",
            "For if " + m.group(2).rstrip(" ,") + ".",
            "Then " + m.group(3)[0].lower() + m.group(3)[1:] if m.group(3)[:1].isupper()
            else "Then " + m.group(3),
        ]

    # Sentence-level movements Joyce left in one <p>
    m = CONTINUE_RE.search(text)
    if m:
        a, b = text[: m.start()].strip(), text[m.end():].strip()
        if len(a) >= 24 and len(b) >= 24:
            return [a, b]

    # Hypothesis → conclusion
    if len(text) >= 180:
        m = re.match(r"(Since .+?), therefore (.+)$", text)
        if m and len(m.group(1)) >= 40 and len(m.group(2)) >= 24:
            return [m.group(1) + ".", "Therefore " + m.group(2)]
        m = re.search(r", therefore ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 50 and len(right) >= 24:
                return [left.rstrip(" ,") + ".", "Therefore " + right]
        m = re.search(r"; therefore ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 50 and len(right) >= 24:
                return [left.rstrip(" ;") + ".", "Therefore " + right]
        m = re.search(r", it follows that ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 40 and len(right) >= 40:
                return [left.rstrip(" ,") + ".", "It follows that " + right]

    # Closing restatement of the enunciation
    if len(text) >= 220 and re.match(r"Therefore if ", text):
        m = re.match(r"(Therefore if .+?), then (.+)$", text)
        if m and len(m.group(2)) >= 40:
            return [m.group(1) + ".", "Then " + m.group(2)]

    # SAS-style conclusion, then the named remaining angles
    if len(text) >= 220:
        m = re.search(r", that is, ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 60 and len(right) >= 24:
                return [left.rstrip(" ,") + ".", "That is, " + right]

    # Two-case ekthesis (I.26 adjacent side first; I.28 exterior or co-interior)
    if len(text) >= 220:
        m = re.search(r", and let them also have ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 60:
                return [left.rstrip(" ,") + ".", "And let them also have " + right]
        m = re.search(r", or the sum of ", text)
        if m:
            left, right = text[: m.start()].strip(), text[m.end():].strip()
            if len(left) >= 60:
                return [left.rstrip(" ,") + ".", "Or the sum of " + right]

    return None


def expand_step(n: int, st: dict) -> list[dict]:
    text = (st.get("text") or "").strip()
    cites = st.get("cites") or []
    parts = split_once(text)
    if not parts or (len(parts) == 1 and parts[0] == text):
        return expand_therefore({"text": text, "cites": cites})
    out: list[dict] = []
    for i, p in enumerate(parts):
        p = p.strip()
        if not p:
            continue
        out.extend(expand_step(n, {"text": p, "cites": cites if i == 0 else []}))
    return out or [st]


def refine_steps(n: int, steps: list[dict]) -> list[dict]:
    out = []
    for st in steps:
        out.extend(expand_step(n, st))
    return out


def harvest_one(html: str, n: int, book: int = 1) -> dict:
    steps = refine_steps(n, harvest_proof_steps(html))
    uses = []
    for st in steps:
        for cid in st["cites"]:
            if cid not in uses:
                uses.append(cid)
    return {
        "id": f"b{book}:prop:{n}",
        "statement": harvest_statement(html),
        "uses": uses,
        "usedBy": harvest_used_by(html, n, book),
        "steps": steps,
        "stepCites": [st["cites"] for st in steps if st["cites"]],
    }


def _section(raw: str, name: str, *nxts: str) -> str:
    a = re.search(rf"<a name={name}", raw)
    if not a:
        return ""
    end = len(raw)
    for nxt in nxts:
        b = re.search(rf"<a name={nxt}", raw)
        if b and a.start() < b.start() < end:
            end = b.start()
    return raw[a.start():end]


def harvest_dl(chunk: str, kind: str, id_prefix: str) -> list[dict]:
    """Walk unclosed <dt>/<dd> pairs in a Book I index section."""
    items = []
    starts = list(re.finditer(r"<dt\b", chunk, re.I))
    label = {
        "def": r"Definition\s+(\d+)",
        "post": r"Postulate\s+(\d+)",
        "cn": r"Common [Nn]otion\s+(\d+)",
        "prop": r"Proposition\s+(\d+)",
    }[kind]
    fallback = {
        "def": "Definition",
        "post": "Postulate",
        "cn": "Common Notion",
        "prop": "Proposition",
    }[kind]
    for i, mm in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(chunk)
        piece = chunk[mm.start():end]
        nm = re.search(label, piece)
        dm = re.search(r"<dd\b[^>]*>(.*)", piece, re.S | re.I)
        if not nm or not dm:
            continue
        n = int(nm.group(1))
        text = html_to_text(dm.group(1))
        rec = {
            "id": f"{id_prefix}{n}",
            "num": n,
            "text": text,
        }
        if kind != "prop":
            if kind == "post" and n in POST_TERMS:
                rec["term"] = POST_TERMS[n]
            elif kind == "cn" and n in CN_TERMS:
                rec["term"] = CN_TERMS[n]
            else:
                rec["term"] = clean_term(first_italic(piece), text, f"{fallback} {n}")
        items.append(rec)
    return items


def harvest_index(html: str, book: int = 1) -> dict:
    pfx = f"b{book}:"
    defs = harvest_dl(_section(html, "defs", "posts", "cns", "props", "guide"), "def", pfx + "def:")
    posts = harvest_dl(_section(html, "posts", "cns", "props", "guide"), "post", pfx + "post:")
    cns = harvest_dl(_section(html, "cns", "props", "guide"), "cn", pfx + "cn:")
    props = harvest_dl(_section(html, "props", "guide", "logic"), "prop", pfx + "prop:")
    return {
        "definitions": defs,
        "postulates": posts,
        "commonNotions": cns,
        "statements": {p["id"]: p["text"] for p in props},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", type=int, default=1)
    ap.add_argument("--sleep", type=float, default=0.15)
    ap.add_argument("--index", type=Path, help="local book index HTML (skip fetch)")
    ap.add_argument(
        "--skip-fetch",
        action="store_true",
        help="reuse existing proposition harvest; only refine steps and merge the index",
    )
    args = ap.parse_args()
    book = args.book
    meta = EXPECTED.get(book) or {}
    dest = out_path(book)
    src = index_url(book)

    if args.index:
        index_html = args.index.read_text(encoding="latin-1", errors="replace")
    else:
        index_html = fetch_url(src)
    front = harvest_index(index_html, book)
    n_props = meta.get("props") or len(front["statements"])
    if meta:
        if meta.get("defs") is not None and len(front["definitions"]) != meta["defs"]:
            raise SystemExit(f"index defs {len(front['definitions'])} expected {meta['defs']}")
        if meta.get("props") is not None and len(front["statements"]) != meta["props"]:
            raise SystemExit(f"index statements {len(front['statements'])} expected {meta['props']}")

    if args.skip_fetch:
        if not dest.exists():
            raise SystemExit(f"--skip-fetch needs existing {dest}")
        prev = json.loads(dest.read_text(encoding="utf-8"))
        records = []
        for rec in prev.get("propositions", []):
            n = int(str(rec["id"]).split(":")[-1])
            rec = dict(rec)
            rec["steps"] = refine_steps(n, rec.get("steps") or [])
            rec["statement"] = rec.get("statement") or front["statements"].get(rec["id"], "")
            rec["stepCites"] = [st["cites"] for st in rec["steps"] if st.get("cites")]
            records.append(rec)
        if n_props and len(records) != n_props:
            raise SystemExit(f"existing harvest has {len(records)} propositions")
    else:
        records = []
        for n in range(1, n_props + 1):
            html = fetch(n, book)
            rec = harvest_one(html, n, book)
            rec["statement"] = rec.get("statement") or front["statements"].get(rec["id"], "")
            records.append(rec)
            print(
                f"{book_roman(book)}.{n:2d}  steps={len(rec['steps']):2d}  uses={len(rec['uses']):2d}  "
                f"{(rec['steps'][0]['text'][:50] + '…') if rec['steps'] else 'NO STEPS'}"
            )
            time.sleep(args.sleep)

    dest.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "book": book,
        "source": src.rsplit("/", 1)[0] + "/",
        "definitions": front["definitions"],
        "postulates": front["postulates"],
        "commonNotions": front["commonNotions"],
        "propositions": records,
    }
    dest.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print("wrote", dest)
    empty = [r["id"] for r in records if not r.get("steps")]
    if empty:
        print("NO STEPS", empty)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
