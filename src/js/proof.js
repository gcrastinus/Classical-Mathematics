/* ============================================================
   proof.js — the second half of the drawing board.
   Once the figure is built, the student states the proof one
   line at a time: name a part, choose a relation, name another
   part, and give the reason that licenses it.
   Each line is checked against the figure actually drawn, and
   the reason must be something already available in the book.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, sub, unit, dist, dot, crs, ang, DEG } = G;

const LEN_EPS = 0.9;                 // world units
const ANG_EPS = 0.9 * DEG;
const PAR_EPS = 0.012;               // sin of the angle between two lines

/* ============================================================
   parts of the figure the student can talk about
   ============================================================ */
const RELS = [
  { id: 'eq', sym: '=', words: 'is equal to', arity: 2, kinds: ['seg', 'ang', 'tri'] },
  { id: 'gt', sym: '>', words: 'is greater than', arity: 2, kinds: ['seg', 'ang'] },
  { id: 'lt', sym: '<', words: 'is less than', arity: 2, kinds: ['seg', 'ang'] },
  { id: 'perp', sym: '⊥', words: 'is at right angles to', arity: 2, kinds: ['seg'] },
  { id: 'par', sym: '∥', words: 'is parallel to', arity: 2, kinds: ['seg'] },
  { id: 'cong', sym: '≅', words: 'is identical with', arity: 2, kinds: ['tri'] },
  { id: 'right', sym: 'is a right angle', words: 'is a right angle', arity: 1, kinds: ['ang'] },
  { id: 'equilat', sym: 'is equilateral', words: 'is equilateral', arity: 1, kinds: ['tri'] },
  { id: 'isos', sym: 'is isosceles', words: 'is isosceles', arity: 1, kinds: ['tri'] }
];
const PICKERS = [
  { kind: 'seg', label: 'a straight line', need: 1, hint: 'Click a straight line in the figure.' },
  { kind: 'ang', label: 'an angle', need: 3, hint: 'Click the vertex of the angle, then a point on each of its two sides.' },
  { kind: 'tri', label: 'a triangle', need: 3, hint: 'Click the three corners of the triangle.' },
  { kind: 'cir', label: 'a circle', need: 1, hint: 'Click a circle.' }
];

function api() { return root.WB_api; }
function WB() { return root.WB; }
function itemOf(id) { return WB().items.find(i => i.id === id); }
function nameOf(id) { const it = itemOf(id); return it ? it.name : '?'; }
function pos(id) { const it = itemOf(id); return it ? V(it.x, it.y) : null; }

/* a part is what a proof line talks about */
function segPart(itemId) {
  const it = itemOf(itemId);
  if (!it || (it.kind !== 'seg' && it.kind !== 'line')) return null;
  return { kind: 'seg', a: it.a, b: it.b, item: itemId, label: nameOf(it.a) + nameOf(it.b) };
}
function angPart(vertex, p, q) {
  return { kind: 'ang', v: vertex, p, q, label: '∠' + nameOf(p) + nameOf(vertex) + nameOf(q) };
}
function triPart(a, b, c) {
  return { kind: 'tri', pts: [a, b, c], label: '△' + nameOf(a) + nameOf(b) + nameOf(c) };
}
function cirPart(itemId) {
  const it = itemOf(itemId);
  if (!it || it.kind !== 'circle') return null;
  return { kind: 'cir', item: itemId, label: 'circle ' + nameOf(it.c) };
}
/* a canonical key, so the same part named twice counts as the same thing */
function key(part) {
  if (!part) return '';
  if (part.kind === 'seg') return 'seg:' + [nameOf(part.a), nameOf(part.b)].sort().join('');
  if (part.kind === 'ang') return 'ang:' + nameOf(part.v) + ':' + [nameOf(part.p), nameOf(part.q)].sort().join('');
  if (part.kind === 'tri') return 'tri:' + part.pts.map(nameOf).sort().join('');
  if (part.kind === 'cir') return 'cir:' + part.item;
  return '';
}
/* which drawn elements light up when this part is named */
function eids(part) {
  if (!part) return [];
  if (part.kind === 'seg') return [part.item];
  if (part.kind === 'cir') return [part.item];
  if (part.kind === 'ang') return ['pt:' + nameOf(part.v), 'pt:' + nameOf(part.p), 'pt:' + nameOf(part.q)]
    .concat(joinIds([part.v, part.p], [part.v, part.q]));
  if (part.kind === 'tri') return part.pts.map(p => 'pt:' + nameOf(p))
    .concat(joinIds([part.pts[0], part.pts[1]], [part.pts[1], part.pts[2]], [part.pts[0], part.pts[2]]));
  return [];
}
function joinIds(...pairs) {
  const out = [];
  pairs.forEach(([x, y]) => {
    WB().items.forEach(i => {
      if ((i.kind === 'seg' || i.kind === 'line') &&
        ((i.a === x && i.b === y) || (i.a === y && i.b === x))) out.push(i.id);
    });
  });
  return out;
}

/* ============================================================
   measuring — is the claim true of the figure actually drawn?
   ============================================================ */
function segLen(part) { return dist(pos(part.a), pos(part.b)); }
function angSize(part) {
  const v = pos(part.v), u1 = unit(sub(pos(part.p), v)), u2 = unit(sub(pos(part.q), v));
  return Math.acos(Math.max(-1, Math.min(1, dot(u1, u2))));
}
function triSides(part) {
  const [a, b, c] = part.pts.map(pos);
  return [dist(a, b), dist(b, c), dist(a, c)].sort((x, y) => x - y);
}
function dirOf(part) { return unit(sub(pos(part.b), pos(part.a))); }

function truth(claim) {
  const { rel, lhs, rhs } = claim;
  const R = RELS.find(r => r.id === rel);
  if (!R || !lhs) return { ok: false, why: 'the line is not finished' };
  if (R.arity === 2 && !rhs) return { ok: false, why: 'the line is not finished' };
  if (R.arity === 2 && lhs.kind !== rhs.kind)
    return { ok: false, why: 'those are not the same kind of thing' };
  if (!R.kinds.includes(lhs.kind))
    return { ok: false, why: 'that relation does not apply to ' + lhs.kind };
  try {
    switch (rel) {
      case 'eq':
        if (lhs.kind === 'seg') return res(Math.abs(segLen(lhs) - segLen(rhs)) < LEN_EPS);
        if (lhs.kind === 'ang') return res(Math.abs(angSize(lhs) - angSize(rhs)) < ANG_EPS);
        return res(triSides(lhs).every((s, i) => Math.abs(s - triSides(rhs)[i]) < LEN_EPS));
      case 'gt':
        return res(lhs.kind === 'seg' ? segLen(lhs) > segLen(rhs) + LEN_EPS
          : angSize(lhs) > angSize(rhs) + ANG_EPS);
      case 'lt':
        return res(lhs.kind === 'seg' ? segLen(lhs) + LEN_EPS < segLen(rhs)
          : angSize(lhs) + ANG_EPS < angSize(rhs));
      case 'perp': return res(Math.abs(dot(dirOf(lhs), dirOf(rhs))) < PAR_EPS);
      case 'par': return res(Math.abs(crs(dirOf(lhs), dirOf(rhs))) < PAR_EPS);
      case 'cong': return res(triSides(lhs).every((s, i) => Math.abs(s - triSides(rhs)[i]) < LEN_EPS));
      case 'right': return res(Math.abs(angSize(lhs) - Math.PI / 2) < ANG_EPS);
      case 'equilat': {
        const s = triSides(lhs);
        return res(Math.abs(s[0] - s[2]) < LEN_EPS);
      }
      case 'isos': {
        const s = triSides(lhs);
        return res(Math.abs(s[0] - s[1]) < LEN_EPS || Math.abs(s[1] - s[2]) < LEN_EPS);
      }
    }
  } catch (e) { return { ok: false, why: 'that part is not in the figure' }; }
  return { ok: false, why: 'unknown relation' };
}
function res(b) { return b ? { ok: true, why: 'true of the figure you drew' } : { ok: false, why: 'not true of the figure you drew' }; }

/* ============================================================
   what may be cited at this point in the book
   ============================================================ */
function available(content, upTo) {
  const out = [];
  (content.definitions || []).forEach(d => out.push({ id: d.id, group: 'Definitions', label: 'Def. ' + d.num + ' — ' + d.term }));
  (content.postulates || []).forEach(d => out.push({ id: d.id, group: 'Postulates', label: 'Post. ' + d.num }));
  (content.commonNotions || []).forEach(d => out.push({ id: d.id, group: 'General Principles', label: 'Gen. Pr. ' + d.num }));
  (content.extra || []).forEach(d => out.push({ id: d.id, group: 'General Principles', label: d.term }));
  (content.theorems || []).forEach(t => {
    const n = typeof t.sort === 'number' ? t.sort : parseFloat(t.num);
    if (n <= upTo + 1e-9) out.push({ id: t.id, group: 'Theorems proved', label: 'Thm. ' + t.num + ' — ' + t.title });
  });
  return out;
}

/* ============================================================
   state and moves
   ============================================================ */
function fresh() { return { lhs: null, rel: null, rhs: null, cite: null, picking: null, buf: [] }; }
function ensure() {
  const wb = WB();
  if (!wb.claims) wb.claims = [];
  if (!wb.draft) wb.draft = fresh();
  return wb;
}
function beginProof() { const wb = ensure(); wb.mode = 'prove'; wb.draft = fresh(); wb.msg = ''; }
function backToFigure() { const wb = ensure(); wb.mode = 'construct'; wb.sel = []; wb.msg = ''; }

function startPick(kind) {
  const wb = ensure();
  wb.draft.picking = kind; wb.draft.buf = [];
  const p = PICKERS.find(x => x.kind === kind);
  return p ? p.hint : '';
}
/** a click on the board while a proof line is being written */
function proofClick(id) {
  const wb = ensure(), d = wb.draft;
  if (!d.picking) return 'First say what kind of thing you mean: a line, an angle, or a triangle.';
  const P = PICKERS.find(x => x.kind === d.picking);
  const it = itemOf(id);
  if (!it) return '';
  if (d.picking === 'seg') {
    if (it.kind !== 'seg' && it.kind !== 'line') return 'That is not a straight line.';
    return place(segPart(id));
  }
  if (d.picking === 'cir') {
    if (it.kind !== 'circle') return 'That is not a circle.';
    return place(cirPart(id));
  }
  if (it.kind !== 'point') return 'Click a point.';
  if (d.buf.includes(id)) return 'You have already used that point.';
  d.buf.push(id);
  if (d.buf.length < P.need) {
    return d.picking === 'ang'
      ? (d.buf.length === 1 ? 'Now a point on one side of the angle.' : 'Now a point on the other side.')
      : 'Now the next corner.';
  }
  const part = d.picking === 'ang' ? angPart(d.buf[0], d.buf[1], d.buf[2]) : triPart(d.buf[0], d.buf[1], d.buf[2]);
  return place(part);
}
function place(part) {
  const d = ensure().draft;
  d.picking = null; d.buf = [];
  if (!part) return 'That will not do.';
  if (!d.lhs) { d.lhs = part; return 'Now choose the relation.'; }
  if (!d.rhs) { d.rhs = part; return d.cite ? 'Now add the line.' : 'Now give the reason.'; }
  d.lhs = part; d.rhs = null; d.rel = d.rel; return 'Started a new line.';
}
function setRel(rel) {
  const d = ensure().draft;
  d.rel = rel;
  const R = RELS.find(r => r.id === rel);
  if (R && R.arity === 1) { d.rhs = null; return d.lhs ? 'Now give the reason.' : 'Now name the thing.'; }
  return d.lhs ? 'Now name the other part.' : 'Now name the first part.';
}
function setCite(id) { ensure().draft.cite = id || null; return ''; }
function clearDraft() { ensure().draft = fresh(); return ''; }

function addClaim() {
  const wb = ensure(), d = wb.draft;
  const R = RELS.find(r => r.id === d.rel);
  if (!d.lhs) return 'Name the part you are talking about.';
  if (!R) return 'Choose a relation.';
  if (R.arity === 2 && !d.rhs) return 'Name the other part.';
  if (!d.cite) return 'Give the reason — the definition, postulate or theorem that licenses this.';
  const t = truth(d);
  wb.claims.push({
    n: wb.claims.length + 1, rel: d.rel, lhs: d.lhs, rhs: R.arity === 2 ? d.rhs : null,
    cite: d.cite, ok: t.ok, why: t.why
  });
  wb.draft = fresh();
  checkGoal();
  return t.ok ? '' : 'That line is not true of the figure you drew — look again.';
}
function undoClaim() { const wb = ensure(); wb.claims.pop(); wb.proved = false; return ''; }

function claimText(c) {
  const R = RELS.find(r => r.id === c.rel);
  if (!R) return '';
  return R.arity === 1 ? c.lhs.label + ' ' + R.sym : c.lhs.label + ' ' + R.sym + ' ' + c.rhs.label;
}
function claimEids(c) { return eids(c.lhs).concat(c.rhs ? eids(c.rhs) : []); }

/* ============================================================
   have they proved what was asked?
   ============================================================ */
/* union-find over part keys, so a chain of equalities counts */
function equalityGroups(claims) {
  const parent = {};
  const find = x => { while (parent[x] && parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
  const join = (a, b) => { parent[a] = parent[a] || a; parent[b] = parent[b] || b; parent[find(a)] = find(b); };
  claims.forEach(c => {
    if (c.rel === 'eq' && c.ok && c.cite && c.rhs) join(key(c.lhs), key(c.rhs));
  });
  return { find, sameGroup: (a, b) => (parent[a] || parent[b]) ? find(a) === find(b) : false };
}
function segKeyOf(nameA, nameB) { return 'seg:' + [nameA, nameB].sort().join(''); }

const GOALS = {
  equilateral(wb) {
    /* the three sides of the triangle built on AB must be tied together */
    const apex = wb.items.find(i => i.kind === 'point' && !i.free && i.name !== 'A' && i.name !== 'B');
    if (!apex) return { done: false, msg: 'Build the triangle first.' };
    const g = equalityGroups(wb.claims);
    const AB = segKeyOf('A', 'B'), AC = segKeyOf('A', apex.name), BC = segKeyOf('B', apex.name);
    const done = g.sameGroup(AB, AC) && g.sameGroup(AB, BC) && g.sameGroup(AC, BC);
    return { done, msg: done ? 'All three sides are tied together: the triangle is equilateral.' :
      'Tie all three sides together — each of the two new sides to AB, and then to each other.' };
  },
  bisect(wb) {
    const A = 'A', B = 'B';
    const mid = wb.items.find(i => i.kind === 'point' && !i.free &&
      Math.abs(dist(V(i.x, i.y), pos('pt:A')) - dist(V(i.x, i.y), pos('pt:B'))) < LEN_EPS &&
      Math.abs(dist(pos('pt:A'), V(i.x, i.y)) + dist(V(i.x, i.y), pos('pt:B')) - dist(pos('pt:A'), pos('pt:B'))) < LEN_EPS);
    if (!mid) return { done: false, msg: 'Find the point that cuts AB in half first.' };
    const g = equalityGroups(wb.claims);
    const done = g.sameGroup(segKeyOf('A', mid.name), segKeyOf('B', mid.name));
    return { done, msg: done ? 'The two halves are shown equal.' : 'Show that the two halves of AB are equal.' };
  },
  isosceles(wb) {
    const ok = wb.claims.some(c => c.ok && c.cite &&
      ((c.rel === 'isos' && c.lhs.kind === 'tri') ||
        (c.rel === 'eq' && c.lhs.kind === 'seg' && c.rhs && c.rhs.kind === 'seg')));
    return { done: ok, msg: ok ? 'The two equal sides are shown equal.' : 'Show which two sides are equal.' };
  },
  perp(wb) {
    const ok = wb.claims.some(c => c.ok && c.cite && (c.rel === 'perp' || c.rel === 'right'));
    return { done: ok, msg: ok ? 'The perpendicular is shown to stand at right angles.' :
      'State that your line is at right angles to AB — or that the angle it makes is a right angle.' };
  },
  square(wb) {
    const g = equalityGroups(wb.claims);
    const names = wb.items.filter(i => i.kind === 'point').map(i => i.name);
    let sides = 0;
    for (const a of names) for (const b of names) if (a < b && g.sameGroup(segKeyOf('A', 'B'), segKeyOf(a, b))) sides++;
    const right = wb.claims.some(c => c.ok && c.cite && (c.rel === 'right' || c.rel === 'perp'));
    const done = sides >= 3 && right;
    return { done, msg: done ? 'Four equal sides and a right angle: it is a square.' :
      'Tie all four sides together by equalities, and state that one angle is right.' };
  },
  rhombus(wb) {
    const g = equalityGroups(wb.claims);
    const names = wb.items.filter(i => i.kind === 'point').map(i => i.name);
    let n = 0;
    for (const a of names) for (const b of names) if (a < b && g.sameGroup(segKeyOf('A', 'B'), segKeyOf(a, b))) n++;
    const done = n >= 3;
    return { done, msg: done ? 'All four sides are tied together: it is a rhombus.' :
      'Tie all four sides of your rhombus together by equalities.' };
  },
  triangle3(wb) {
    const eqs = wb.claims.filter(c => c.ok && c.cite && c.rel === 'eq' && c.lhs.kind === 'seg').length;
    const done = eqs >= 3;
    return { done, msg: done ? 'Each side is shown equal to its given line.' :
      'Show each of the three sides equal to the line it was made from.' };
  }
};
function checkGoal() {
  const wb = ensure();
  const g = GOALS[wb.challenge];
  if (!g) { wb.proved = false; wb.proofMsg = ''; return; }
  try {
    const r = g(wb);
    wb.proved = !!r.done; wb.proofMsg = r.msg;
  } catch (e) { wb.proved = false; wb.proofMsg = ''; }
}

root.WB_proof = {
  RELS, PICKERS, beginProof, backToFigure, startPick, proofClick, setRel, setCite,
  addClaim, undoClaim, clearDraft, claimText, claimEids, eids, available, checkGoal, truth
};
})(typeof window !== 'undefined' ? window : globalThis);

