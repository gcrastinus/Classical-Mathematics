#!/usr/bin/env python3
"""Cut a Fitzpatrick proof into the major movements of a Euclidean demonstration.

Not every sentence: given, what is required, each construction, each
inference (since … thus), then the restatement. Used by the Elements shelf.
"""
from __future__ import annotations

import re

CITE_TOKEN = re.compile(r"\[[^\]]+\]")
CONSTR = re.compile(
    r"\bhave been (drawn|joined|produced|described|constructed|cut|placed|"
    r"applied|made|taken|added|built)\b",
    re.I,
)
QED_ECHO = re.compile(
    r"\(Which is\) the very thing it was required to (do|show)\.?",
    re.I,
)
GLOSS = re.compile(r"^\((?:That is|the squares|respectively)", re.I)

ABBREV = ("Prop.", "Def.", "Post.", "C.N.", "Fig.", "i.e.", "e.g.", "viz.")


def split_sentences(text: str) -> list[str]:
    if not text:
        return []
    held = []

    def stash(m):
        held.append(m.group(0))
        return f"⟦{len(held) - 1}⟧"

    t = CITE_TOKEN.sub(stash, text)
    for ab in ABBREV:
        t = t.replace(ab, ab.replace(".", "·"))
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z(])", t)
    out = []
    for p in parts:
        p = p.replace("·", ".")
        for i, c in enumerate(held):
            p = p.replace(f"⟦{i}⟧", c)
        p = re.sub(r"\s+", " ", p).strip()
        if p:
            out.append(p)
    return out


def role(s: str) -> str:
    sl = s.lower()
    if QED_ECHO.search(s) or sl.startswith("(which is) the very thing"):
        return "qed"
    if s.startswith("I say that") or "it is required to" in sl:
        return "goal"
    if CONSTR.search(s) and re.match(r"^(Let |And let |For let )", s):
        return "construction"
    if s.startswith("For let "):
        return "construction"
    if s.startswith("Let ") and not CONSTR.search(s):
        return "given"
    if s.startswith("Similarly"):
        return "similarly"
    if s.startswith("Thus") or s.startswith("Therefore"):
        return "thus"
    if re.match(r"^(And since|For since|Since |Again, since|For if |In fact,)", s):
        return "since"
    if s.startswith("But "):
        return "but"
    if GLOSS.match(s):
        return "gloss"
    if s.startswith("And let ") or s.startswith("And "):
        return "and"
    return "other"


def group_sentences(sentences: list[str]) -> list[str]:
    steps: list[str] = []
    buf: list[str] = []
    kind: str | None = None

    def flush():
        nonlocal kind
        if buf:
            text = " ".join(buf).strip()
            text = QED_ECHO.sub("", text).strip()
            if text:
                steps.append(text)
            buf.clear()
        kind = None

    for s in sentences:
        r = role(s)
        if r == "gloss":
            if buf:
                buf.append(s)
            elif steps:
                steps[-1] = steps[-1] + " " + s
            else:
                buf.append(s)
                kind = "given"
            continue
        if r == "qed":
            if buf:
                buf.append(s)
            flush()
            continue
        if r == "given":
            if kind not in (None, "given"):
                flush()
            buf.append(s)
            kind = "given"
            continue
        if r == "goal":
            flush()
            buf.append(s)
            kind = "goal"
            flush()
            continue
        if r == "construction":
            if kind != "construction":
                flush()
            buf.append(s)
            kind = "construction"
            continue
        if r in ("since", "similarly"):
            if kind == "construction":
                flush()
            elif kind == "proof" and buf:
                flush()
            buf.append(s)
            kind = "proof"
            continue
        if r == "thus":
            buf.append(s)
            kind = kind or "proof"
            # a Thus that restates the theorem (long, starts Thus + original claim)
            # ends the current inference
            flush()
            continue
        if r in ("but", "and", "other"):
            if kind == "construction" and CONSTR.search(s):
                buf.append(s)
                continue
            if kind is None or kind in ("given", "goal"):
                flush()
                kind = "proof"
            buf.append(s)
            kind = "proof"
            continue
        buf.append(s)
        kind = kind or "proof"
    flush()
    return steps


def segment_proof(body: str, statement: str = "") -> list[str]:
    """Return the major movements of a Fitzpatrick proof body."""
    text = (body or "").strip()
    if not text:
        return []
    sents = split_sentences(text)
    steps = group_sentences(sents)
    # drop a last step that only restates the enunciation (already in the statement)
    if statement and len(steps) >= 2:
        stem = re.sub(r"\W+", " ", statement.lower())[:48].strip()
        last = re.sub(r"\W+", " ", steps[-1].lower())
        if stem and stem in last and len(steps[-1]) > 80:
            steps = steps[:-1]
    return [s for s in steps if len(s) > 8]


if __name__ == "__main__":
    import json
    import sys
    from pathlib import Path

    book = json.loads(
        Path("src/content/extracted/fitzpatrick/book01.json").read_text(encoding="utf-8")
    )
    nums = [int(a) for a in sys.argv[1:]] or [1, 4, 17, 32, 47]
    for n in nums:
        p = next(x for x in book["propositions"] if x["n"] == n)
        steps = segment_proof(p["body"]["lit"], p["statement"]["lit"])
        print(f"\n===== I.{n}  {len(steps)} steps =====")
        for i, s in enumerate(steps, 1):
            print(f"{i}. {s[:220]}")
    if not sys.argv[1:]:
        lengths = []
        for p in book["propositions"]:
            lengths.append(len(segment_proof(p["body"]["lit"], p["statement"]["lit"])))
        print("\ncounts:", sorted(lengths))
        print("min", min(lengths), "median", sorted(lengths)[len(lengths)//2], "max", max(lengths))
        print("singletons", sum(1 for n in lengths if n < 2))
