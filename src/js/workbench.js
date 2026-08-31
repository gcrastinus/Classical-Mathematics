/* ============================================================
   workbench.js — the drawing board.
   Its tools are Euclid's postulates and the theorems already
   proved; every move writes itself into a construction log with
   the citation that licenses it.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, dot, crs, ang, pol,
        interCC, interLL, interLC, footOf, rotAbout, DEG } = G;

const EPS = 0.6;                       // world units: "the same point"
const ANG_EPS = 0.7 * DEG;

/* ============================================================
   state
   ============================================================ */
const WB = {
  items: [], log: [], tool: 'point', sel: [], seq: 0, letter: 0,
  view: { cx: 0, cy: 0, k: 1 }, upTo: 99, challenge: null, done: false,
  msg: '', mode: 'construct', claims: [], draft: null, proved: false, proofMsg: '', refId: '', litClaim: 0
};
root.WB = WB;

const P = id => WB.items.find(i => i.id === id);
const pts = () => WB.items.filter(i => i.kind === 'point');
const at = id => { const p = P(id); return p ? V(p.x, p.y) : null; };
const NAMES = 'ABCDEFGHKLMNPQRSTUVWXYZ';
function nextName() {
  const n = WB.letter++;
  return n < NAMES.length ? NAMES[n] : NAMES[n % NAMES.length] + Math.floor(n / NAMES.length);
}
function uid(k) { return k + ':' + (++WB.seq); }

/* ============================================================
   adding things
   ============================================================ */
function addPoint(p, o = {}) {
  const near = pts().find(q => dist(q, p) < EPS);
  if (near) return near.id;
  const name = o.name || nextName();
  const it = { kind: 'point', id: 'pt:' + name, name, x: p.x, y: p.y, free: !!o.free, by: o.by };
  WB.items.push(it);
  return it.id;
}
function addItem(it) { it.id = it.id || uid(it.kind); WB.items.push(it); return it.id; }

/* geometry of an item, resolved from its points */
function geo(it) {
  if (!it) return null;
  if (it.kind === 'point') return { kind: 'point', p: V(it.x, it.y) };
  if (it.kind === 'seg') return { kind: 'seg', a: at(it.a), b: at(it.b) };
  if (it.kind === 'line') return { kind: 'line', a: at(it.a), b: at(it.b) };
  if (it.kind === 'circle') { const c = at(it.c); return { kind: 'circle', c, r: dist(c, at(it.through)) }; }
  return null;
}
/* every intersection of two drawn things, respecting segment ends */
function meets(A, B) {
  const g1 = geo(A), g2 = geo(B); if (!g1 || !g2) return [];
  const onSeg = (g, p) => {
    if (g.kind !== 'seg') return true;
    const t = dot(sub(p, g.a), sub(g.b, g.a)) / (dot(sub(g.b, g.a), sub(g.b, g.a)) || 1);
    return t > -1e-6 && t < 1 + 1e-6;
  };
  const out = [];
  const lin = g => (g.kind === 'seg' || g.kind === 'line');
  if (lin(g1) && lin(g2)) {
    const p = interLL(g1.a, sub(g1.b, g1.a), g2.a, sub(g2.b, g2.a));
    if (p && onSeg(g1, p) && onSeg(g2, p)) out.push(p);
  } else if (lin(g1) && g2.kind === 'circle') {
    lineCircle(g1, g2).forEach(p => { if (onSeg(g1, p)) out.push(p); });
  } else if (g1.kind === 'circle' && lin(g2)) {
    lineCircle(g2, g1).forEach(p => { if (onSeg(g2, p)) out.push(p); });
  } else if (g1.kind === 'circle' && g2.kind === 'circle') {
    const d = dist(g1.c, g2.c);
    if (d > 1e-9 && d < g1.r + g2.r - 1e-9 && d > Math.abs(g1.r - g2.r) + 1e-9) {
      out.push(interCC(g1.c, g1.r, g2.c, g2.r, 1), interCC(g1.c, g1.r, g2.c, g2.r, -1));
    }
  }
  return out.filter(Boolean);
}
function lineCircle(l, c) {
  const u = unit(sub(l.b, l.a)), f = sub(l.a, c.c);
  const b = dot(f, u), cc = dot(f, f) - c.r * c.r, disc = b * b - cc;
  if (disc < 1e-9) return [];
  const q = Math.sqrt(disc);
  return [add(l.a, mul(u, -b - q)), add(l.a, mul(u, -b + q))];
}
/* after drawing something new, name where it crosses what was already there */
function newMeets(id) {
  const it = P(id); const made = [];
  WB.items.forEach(other => {
    if (other === it || other.kind === 'point') return;
    meets(it, other).forEach(p => {
      if (pts().some(q => dist(q, p) < EPS)) return;
      made.push(addPoint(p, { by: id }));
    });
  });
  return made;
}
function names(ids) { return ids.map(i => (P(i) || {}).name).filter(Boolean).join(' and '); }

/* ============================================================
   the tools
   ============================================================ */
function centroid() {
  const ps = pts(); if (!ps.length) return V(0, 0);
  return V(ps.reduce((s, p) => s + p.x, 0) / ps.length, ps.reduce((s, p) => s + p.y, 0) / ps.length);
}
/** which side of PQ is emptier — build new figures there */
function freeSide(A, B) {
  const n = unit(perp(sub(B, A))), m = mid(A, B), g = centroid();
  return dot(sub(g, m), n) > 0 ? -1 : 1;
}
function segBetween(a, b) {          // an existing segment joining these two point ids?
  return WB.items.find(i => i.kind === 'seg' && ((i.a === a && i.b === b) || (i.a === b && i.b === a)));
}

const TOOLS = [
  /* ---- the postulates ---- */
  {
    id: 'point', group: 'Postulates', label: 'Point', thm: 0, needs: [],
    hint: 'Click anywhere to take a point.',
    click(p) { const id = addPoint(p, { free: true }); return { made: [id], text: 'Take a point ' + P(id).name + '.', cite: null }; }
  },
  {
    id: 'seg', group: 'Postulates', label: 'Join', thm: 0, cite: 'post:1', needs: ['point', 'point'],
    hint: 'Click two points to join them with a straight line.',
    run(s) {
      const id = addItem({ kind: 'seg', a: s[0], b: s[1] });
      return { made: [id, ...newMeets(id)], text: 'Join ' + names(s) + '.', cite: 'post:1' };
    }
  },
  {
    id: 'line', group: 'Postulates', label: 'Produce', thm: 0, cite: 'post:2', needs: ['point', 'point'],
    hint: 'Click two points: the line through them is produced both ways.',
    run(s) {
      const id = addItem({ kind: 'line', a: s[0], b: s[1] });
      return { made: [id, ...newMeets(id)], text: 'Produce the straight line through ' + names(s) + '.', cite: 'post:2' };
    }
  },
  {
    id: 'circle', group: 'Postulates', label: 'Circle', thm: 0, cite: 'post:3', needs: ['point', 'point'],
    hint: 'Click the centre, then a point the circle must pass through.',
    run(s) {
      const id = addItem({ kind: 'circle', c: s[0], through: s[1] });
      return {
        made: [id, ...newMeets(id)],
        text: 'Draw the circle with centre ' + P(s[0]).name + ' and radius ' + P(s[0]).name + P(s[1]).name + '.',
        cite: 'post:3'
      };
    }
  },
  /* ---- the theorems, as tools ---- */
  {
    id: 'equi', group: 'Theorems', label: 'Equilateral triangle', thm: 1, cite: 'thm:1', needs: ['seg'],
    hint: 'Click a straight line: an equilateral triangle is built on it.',
    run(s) {
      const seg = P(s[0]), A = at(seg.a), B = at(seg.b), r = dist(A, B);
      const p = interCC(A, r, B, r, freeSide(A, B));
      const c = addPoint(p);
      const m1 = addItem({ kind: 'seg', a: seg.a, b: c }), m2 = addItem({ kind: 'seg', a: seg.b, b: c });
      return {
        made: [c, m1, m2], text: 'On ' + P(seg.a).name + P(seg.b).name + ' make the equilateral triangle '
          + P(seg.a).name + P(seg.b).name + P(c).name + '.', cite: 'thm:1'
      };
    }
  },
  {
    id: 'carry', group: 'Theorems', label: 'Carry a length', thm: 1.1, cite: 'thm:1a', needs: ['point', 'seg'],
    hint: 'Click a point, then a straight line: a line equal to it is placed at that point.',
    run(s) {
      const Q = at(s[0]), seg = P(s[1]), L = dist(at(seg.a), at(seg.b));
      const dir = unit(sub(Q, centroid()));
      const d = (dist(Q, centroid()) < 1e-6) ? V(1, 0) : dir;
      const e = addPoint(add(Q, mul(d, L)));
      const m = addItem({ kind: 'seg', a: s[0], b: e });
      return {
        made: [e, m], text: 'At ' + P(s[0]).name + ' place ' + P(s[0]).name + P(e).name
          + ' equal to ' + P(seg.a).name + P(seg.b).name + '.', cite: 'thm:1a'
      };
    }
  },
  {
    id: 'cutoff', group: 'Theorems', label: 'Cut off a length', thm: 1.2, cite: 'thm:1b', needs: ['seg', 'seg'],
    hint: 'Click the longer line, then the shorter: the shorter is cut off from the longer.',
    run(s) {
      const big = P(s[0]), small = P(s[1]);
      const A = at(big.a), B = at(big.b), L = dist(at(small.a), at(small.b));
      if (L >= dist(A, B)) return { error: 'The second line must be the shorter of the two.' };
      const e = addPoint(add(A, mul(unit(sub(B, A)), L)));
      return {
        made: [e], text: 'From ' + P(big.a).name + P(big.b).name + ' cut off ' + P(big.a).name + P(e).name
          + ' equal to ' + P(small.a).name + P(small.b).name + '.', cite: 'thm:1b'
      };
    }
  },
  {
    id: 'bisang', group: 'Theorems', label: 'Bisect an angle', thm: 7, cite: 'thm:7', needs: ['point', 'point', 'point'],
    hint: 'Click the vertex of the angle, then a point on each of its two sides.',
    run(s) {
      const B = at(s[0]), A = at(s[1]), C = at(s[2]);
      const u1 = unit(sub(A, B)), u2 = unit(sub(C, B));
      if (dist(u1, u2) < 1e-6) return { error: 'Those two sides lie on top of each other.' };
      const d = unit(add(u1, u2)), L = Math.min(dist(B, A), dist(B, C));
      const e = addPoint(add(B, mul(d, L)));
      const m = addItem({ kind: 'seg', a: s[0], b: e });
      return {
        made: [e, m], text: 'Bisect ∠' + P(s[1]).name + P(s[0]).name + P(s[2]).name + ' by ' + P(s[0]).name + P(e).name + '.',
        cite: 'thm:7'
      };
    }
  },
  {
    id: 'bisect', group: 'Theorems', label: 'Bisect a line', thm: 8, cite: 'thm:8', needs: ['seg'],
    hint: 'Click a straight line to cut it in half.',
    run(s) {
      const seg = P(s[0]), m = addPoint(mid(at(seg.a), at(seg.b)));
      return {
        made: [m], text: 'Bisect ' + P(seg.a).name + P(seg.b).name + ' at ' + P(m).name + '.', cite: 'thm:8'
      };
    }
  },
  {
    id: 'perpon', group: 'Theorems', label: 'Perpendicular at a point', thm: 9, cite: 'thm:9', needs: ['seg', 'point'],
    hint: 'Click a straight line, then a point on it.',
    run(s) {
      const seg = P(s[0]), A = at(seg.a), B = at(seg.b), Q = at(s[1]);
      if (dist(footOf(Q, A, B), Q) > EPS) return { error: 'That point is not on the line — use “perpendicular from a point”.' };
      const n = mul(unit(perp(sub(B, A))), dist(A, B) * 0.7 * (freeSide(A, B) || 1));
      const e = addPoint(add(Q, n));
      const m = addItem({ kind: 'seg', a: s[1], b: e });
      return {
        made: [e, m], text: 'From ' + P(s[1]).name + ' draw ' + P(s[1]).name + P(e).name + ' at right angles to '
          + P(seg.a).name + P(seg.b).name + '.', cite: 'thm:9'
      };
    }
  },
  {
    id: 'perpfrom', group: 'Theorems', label: 'Perpendicular from a point', thm: 10, cite: 'thm:10', needs: ['seg', 'point'],
    hint: 'Click a straight line, then a point off it.',
    run(s) {
      const seg = P(s[0]), A = at(seg.a), B = at(seg.b), Q = at(s[1]);
      const f = footOf(Q, A, B);
      if (dist(f, Q) < EPS) return { error: 'That point is on the line — use “perpendicular at a point”.' };
      const e = addPoint(f);
      const made = [e];
      /* if the foot falls beyond the ends, the line has to be produced to reach it */
      const t = dot(sub(f, A), sub(B, A)) / (dot(sub(B, A), sub(B, A)) || 1);
      let produced = '';
      if (t < 0 || t > 1) {
        made.push(addItem({ kind: 'seg', a: t < 0 ? seg.a : seg.b, b: e, produced: true }));
        produced = ' produced';
      }
      made.push(addItem({ kind: 'seg', a: s[1], b: e }));
      return {
        made, text: 'From ' + P(s[1]).name + ' drop the perpendicular ' + P(s[1]).name + P(e).name
          + ' to ' + P(seg.a).name + P(seg.b).name + produced + '.', cite: 'thm:10'
      };
    }
  },
  {
    id: 'tri3', group: 'Theorems', label: 'Triangle from three lines', thm: 19, cite: 'thm:19', needs: ['seg', 'seg', 'seg'],
    hint: 'Click three straight lines: the first becomes the base of a triangle with those three sides.',
    run(s) {
      const base = P(s[0]), A = at(base.a), B = at(base.b);
      const r1 = dist(at(P(s[1]).a), at(P(s[1]).b)), r2 = dist(at(P(s[2]).a), at(P(s[2]).b));
      const d = dist(A, B);
      if (r1 + r2 <= d || d + r1 <= r2 || d + r2 <= r1)
        return { error: 'Any two of the three lines must together be greater than the third.' };
      const c = addPoint(interCC(A, r1, B, r2, freeSide(A, B)));
      const m1 = addItem({ kind: 'seg', a: base.a, b: c }), m2 = addItem({ kind: 'seg', a: base.b, b: c });
      return {
        made: [c, m1, m2], text: 'On ' + P(base.a).name + P(base.b).name + ' construct the triangle '
          + P(base.a).name + P(base.b).name + P(c).name + ' from the three given lines.', cite: 'thm:19'
      };
    }
  },
  {
    id: 'parallel', group: 'Theorems', label: 'Parallel through a point', thm: 27, cite: 'thm:27', needs: ['seg', 'point'],
    hint: 'Click a straight line, then a point not on it.',
    run(s) {
      const seg = P(s[0]), A = at(seg.a), B = at(seg.b), Q = at(s[1]);
      if (dist(footOf(Q, A, B), Q) < EPS) return { error: 'That point is on the line already.' };
      const e = addPoint(add(Q, sub(B, A)));
      const m = addItem({ kind: 'line', a: s[1], b: e });
      return {
        made: [e, m], text: 'Through ' + P(s[1]).name + ' draw a line parallel to ' + P(seg.a).name + P(seg.b).name + '.',
        cite: 'thm:27'
      };
    }
  },
  {
    id: 'square', group: 'Theorems', label: 'Square on a line', thm: 35, cite: 'thm:35', needs: ['seg'],
    hint: 'Click a straight line: the square on it is built.',
    run(s) {
      const seg = P(s[0]), A = at(seg.a), B = at(seg.b);
      const n = mul(unit(perp(sub(B, A))), dist(A, B) * freeSide(A, B));
      const c = addPoint(add(B, n)), d = addPoint(add(A, n));
      const m = [addItem({ kind: 'seg', a: seg.b, b: c }), addItem({ kind: 'seg', a: c, b: d }),
      addItem({ kind: 'seg', a: d, b: seg.a })];
      return {
        made: [c, d, ...m], text: 'On ' + P(seg.a).name + P(seg.b).name + ' describe the square '
          + P(seg.a).name + P(seg.b).name + P(c).name + P(d).name + '.', cite: 'thm:35'
      };
    }
  },
  /* ---- housekeeping ---- */
  {
    id: 'erase', group: 'Postulates', label: 'Rub out', thm: 0, needs: ['any'],
    hint: 'Click anything to rub it out (and whatever depended on it).',
    run(s) { removeWithDependents(s[0]); return { made: [], text: null }; }
  }
];
root.WB_TOOLS = TOOLS;
const tool = id => TOOLS.find(t => t.id === id);

function removeWithDependents(id) {
  const gone = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    WB.items.forEach(i => {
      if (gone.has(i.id)) return;
      const refs = [i.a, i.b, i.c, i.through, i.by].filter(Boolean);
      if (refs.some(r => gone.has(r))) { gone.add(i.id); grew = true; }
    });
  }
  WB.items = WB.items.filter(i => !gone.has(i.id));
  WB.log.forEach(e => { e.made = (e.made || []).filter(m => !gone.has(m)); });
  WB.log = WB.log.filter(e => e.made.length || e.keep);
}

/* ============================================================
   doing a move
   ============================================================ */
function kindOf(id) { const i = P(id); return i ? (i.kind === 'line' ? 'seg' : i.kind) : null; }

function pick(id) {                       // returns a status message
  const t = tool(WB.tool); if (!t) return '';
  if (t.needs[0] === 'any') { commit(t.run([id])); return ''; }
  const want = t.needs[WB.sel.length];
  const got = kindOf(id);
  if (want !== got && !(want === 'seg' && got === 'seg')) {
    return 'That is a ' + (got === 'point' ? 'point' : got === 'circle' ? 'circle' : 'line') +
      ' — click a ' + (want === 'point' ? 'point' : 'straight line') + '.';
  }
  WB.sel.push(id);
  if (WB.sel.length === t.needs.length) { const r = t.run(WB.sel.slice()); WB.sel = []; return commit(r); }
  return t.hint;
}
function clickEmpty(p) {
  const t = tool(WB.tool); if (!t) return '';
  if (t.click) return commit(t.click(p));
  if (t.needs[WB.sel.length] === 'point') {          // a fresh point where you clicked
    const id = addPoint(p, { free: true });
    WB.log.push({ text: 'Take a point ' + P(id).name + '.', cite: null, made: [id] });
    return pick(id);
  }
  WB.sel = [];
  return '';
}
function commit(r) {
  if (!r) return '';
  if (r.error) { WB.sel = []; return r.error; }
  if (r.text) WB.log.push({ text: r.text, cite: r.cite, made: r.made });
  checkGoal();
  return '';
}
function undo() {
  const e = WB.log.pop(); if (!e) return;
  (e.made || []).forEach(id => { WB.items = WB.items.filter(i => i.id !== id); });
  WB.sel = []; WB.done = false;
}
function clear(keepSetup) {
  WB.items = []; WB.log = []; WB.sel = []; WB.letter = 0; WB.seq = 0; WB.done = false; WB.msg = '';
  WB.claims = []; WB.draft = null; WB.mode = 'construct'; WB.proved = false; WB.proofMsg = ''; WB.litClaim = 0;
  if (keepSetup && WB.challenge) setup(WB.challenge);
}

/* ============================================================
   challenges — the book's own constructions and questions
   ============================================================ */
function givenSeg(x1, y1, x2, y2, label) {
  const a = addPoint(V(x1, y1), { free: true }), b = addPoint(V(x2, y2), { free: true });
  const id = addItem({ kind: 'seg', a, b, given: true });
  WB.log.push({ text: 'Given: the straight line ' + P(a).name + P(b).name + '.', cite: null, made: [], keep: true });
  return { a, b, id };
}
const CH = [
  {
    id: 'free', title: 'Free drawing', upTo: 99, blurb: 'Every tool you have earned. Draw what you like.',
    setup() { }, goal: null
  },
  {
    id: 'equilateral', title: 'Theorem 1 — an equilateral triangle on AB', upTo: 0,
    blurb: 'With the three postulates only: two circles and two joins.',
    setup() { givenSeg(-130, -60, 60, -60); },
    goal() {
      const [A, B] = ['pt:A', 'pt:B'];
      const L = dist(at(A), at(B));
      return pts().some(p => p.id !== A && p.id !== B &&
        Math.abs(dist(p, at(A)) - L) < EPS && Math.abs(dist(p, at(B)) - L) < EPS &&
        segBetween(A, p.id) && segBetween(B, p.id));
    }
  },
  {
    id: 'rhombus', title: 'Theorem 1, question 2 — make a rhombus', upTo: 1,
    blurb: 'Both points where the two circles cut one another are useful.',
    setup() { givenSeg(-120, -20, 60, -20); },
    goal() {
      const ps = pts();
      for (const p of ps) for (const q of ps) {
        if (p === q) continue;
        for (const r of ps) {
          if (r === p || r === q) continue;
          for (const s of ps) {
            if (s === p || s === q || s === r) continue;
            const L = dist(p, q);
            if (L < 5) continue;
            if (Math.abs(dist(q, r) - L) > EPS || Math.abs(dist(r, s) - L) > EPS || Math.abs(dist(s, p) - L) > EPS) continue;
            if (Math.abs(Math.abs(dot(unit(sub(q, p)), unit(sub(s, p)))) - 1) < 1e-3) continue;   // degenerate
            if (Math.abs(dot(unit(sub(q, p)), unit(sub(s, p)))) < 1e-3) continue;                 // that is a square
            if (segBetween(p.id, q.id) && segBetween(q.id, r.id) && segBetween(r.id, s.id) && segBetween(s.id, p.id))
              return true;
          }
        }
      }
      return false;
    }
  },
  {
    id: 'bisect', title: 'Theorem 8 — cut a line in half', upTo: 7,
    blurb: 'You may use the equilateral triangle and the bisected angle, but not Theorem 8 itself.',
    setup() { givenSeg(-120, -50, 90, -50); },
    goal() {
      const A = at('pt:A'), B = at('pt:B'), m = mid(A, B);
      return pts().some(p => !p.free && dist(p, m) < EPS);
    }
  },
  {
    id: 'perp', title: 'Theorem 10 — drop a perpendicular from P', upTo: 9,
    blurb: 'P is not on the line. Everything up to Theorem 9 is available.',
    setup() {
      const s = givenSeg(-150, -60, 150, -60);
      const p = addPoint(V(-20, 70), { free: true });
      WB.log.push({ text: 'Given: the point ' + P(p).name + ', not on AB.', cite: null, made: [], keep: true });
    },
    goal() {
      const A = at('pt:A'), B = at('pt:B'), Q = at('pt:C');
      if (!Q) return false;
      const f = footOf(Q, A, B);
      return pts().some(p => !p.free && dist(p, f) < EPS) &&
        WB.items.some(i => i.kind === 'seg' && ((i.a === 'pt:C' && dist(at(i.b), f) < EPS) || (i.b === 'pt:C' && dist(at(i.a), f) < EPS)));
    }
  },
  {
    id: 'isosceles', title: 'Theorem 1, question 4 — an isosceles triangle', upTo: 3,
    blurb: 'Not equilateral: exactly two sides equal, on the given base.',
    setup() { givenSeg(-110, -40, 70, -40); },
    goal() {
      const A = at('pt:A'), B = at('pt:B'), L = dist(A, B);
      return pts().some(p => {
        const a = dist(p, A), b = dist(p, B);
        return a > 5 && Math.abs(a - b) < EPS && Math.abs(a - L) > 3 * EPS &&
          segBetween('pt:A', p.id) && segBetween('pt:B', p.id);
      });
    }
  },
  {
    id: 'square', title: 'Theorem 35 — a square on AB', upTo: 27,
    blurb: 'Perpendicular, then two parallels — or any road you like.',
    setup() { givenSeg(-90, -80, 40, -80); },
    goal() {
      const A = at('pt:A'), B = at('pt:B'), L = dist(A, B);
      const n = mul(unit(perp(sub(B, A))), L);
      for (const sgn of [1, -1]) {
        const c = add(B, mul(n, sgn)), d = add(A, mul(n, sgn));
        const pc = pts().find(p => dist(p, c) < EPS), pd = pts().find(p => dist(p, d) < EPS);
        if (pc && pd && segBetween('pt:B', pc.id) && segBetween(pc.id, pd.id) && segBetween(pd.id, 'pt:A')) return true;
      }
      return false;
    }
  },
  {
    id: 'triangle3', title: 'Theorem 19 — a triangle from three given lines', upTo: 18,
    blurb: 'Carry the lengths where you need them, then let two circles cross.',
    setup() {
      givenSeg(-160, -70, -30, -70);
      givenSeg(10, -70, 110, -70);
      givenSeg(-160, 60, -50, 60);
    },
    goal() {
      const segs = WB.items.filter(i => i.kind === 'seg' && i.given);
      if (segs.length < 3) return false;
      const want = segs.map(s => dist(at(s.a), at(s.b))).sort((x, y) => x - y);
      const all = WB.items.filter(i => i.kind === 'seg');
      for (const s1 of all) for (const s2 of all) for (const s3 of all) {
        if (s1 === s2 || s2 === s3 || s1 === s3) continue;
        const ends = [s1, s2, s3].map(s => [s.a, s.b]);
        const flat = ends.flat(), uniq = Array.from(new Set(flat));
        if (uniq.length !== 3) continue;                       // a genuine triangle
        if ([s1, s2, s3].some(s => s.given)) continue;
        const got = [s1, s2, s3].map(s => dist(at(s.a), at(s.b))).sort((x, y) => x - y);
        if (got.every((g, i) => Math.abs(g - want[i]) < EPS)) return true;
      }
      return false;
    }
  }
];
root.WB_CHALLENGES = CH;

function setup(id) {
  const c = CH.find(x => x.id === id) || CH[0];
  WB.challenge = c.id; WB.upTo = c.upTo; WB.done = false;
  c.setup();
}
function checkGoal() {
  const c = CH.find(x => x.id === WB.challenge);
  if (!c || !c.goal) return;
  try { if (c.goal()) WB.done = true; } catch (e) { }
}

/* ============================================================
   drawing the board
   ============================================================ */
function figure() {
  const items = WB.items;
  return {
    build(b) {
      items.forEach(i => {
        if (i.kind !== 'point') return;
        b.at(i.name, V(i.x, i.y), { big: !i.free, cls: i.given ? 'given' : '' });
      });
      items.forEach(i => {
        const A = i.a && P(i.a), B = i.b && P(i.b);
        if (i.kind === 'seg') b.seg(b.pts[A.name], b.pts[B.name],
          { id: i.id, w: i.given ? 2.6 : undefined, dash: i.produced ? '5 4' : undefined });
        else if (i.kind === 'line') b.ray(b.pts[A.name], b.pts[B.name], { both: true, id: i.id });
        else if (i.kind === 'circle') {
          const c = P(i.c), t = P(i.through);
          b.circle(b.pts[c.name], b.pts[t.name], { id: i.id, cls: 'wbcircle' });
        }
      });
    }
  };
}
root.WB_figure = figure;
root.WB_api = { pick, clickEmpty, undo, clear, setup, tool, TOOLS, CH, addPoint, P, at };

})(typeof window !== 'undefined' ? window : globalThis);
