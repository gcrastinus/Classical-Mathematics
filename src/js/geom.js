/* ============================================================
   geom.js — a small constraint-based Euclidean construction engine
   ------------------------------------------------------------
   * All authoring is done in ordinary mathematical coordinates
     (x right, y UP).  Projection to SVG flips y, so no figure
     can ever come out upside down.
   * A figure is a build(b) function.  Free points remember their
     positions in a state object, so the whole figure is simply
     re-built on every drag: everything derived stays exact.
   * Rendering emits an SVG string (works in the browser and in
     node, so figures can be checked headlessly).
   ============================================================ */
(function (root) {
'use strict';

/* ---------- vectors ---------- */
const V = (x, y) => ({ x: +x, y: +y });
const add = (a, b) => V(a.x + b.x, a.y + b.y);
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const mul = (a, s) => V(a.x * s, a.y * s);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const crs = (a, b) => a.x * b.y - a.y * b.x;
const len = a => Math.hypot(a.x, a.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const unit = a => { const l = len(a) || 1; return V(a.x / l, a.y / l); };
const perp = a => V(-a.y, a.x);                  // +90° (counter-clockwise)
const mid = (a, b) => V((a.x + b.x) / 2, (a.y + b.y) / 2);
const lerp = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const ang = a => Math.atan2(a.y, a.x);
const pol = (o, r, t) => V(o.x + r * Math.cos(t), o.y + r * Math.sin(t));
const rotAbout = (p, o, t) => {
  const d = sub(p, o), c = Math.cos(t), s = Math.sin(t);
  return V(o.x + d.x * c - d.y * s, o.y + d.x * s + d.y * c);
};
const DEG = Math.PI / 180;

/* Latin figure letters → Heiberg Greek. Drawings stay Latin; the map lets
   Greek prose share the same highlight ids. F→Ζ, G→Η, H→Θ (Euclid’s skip). */
const LETTER_EL = {
  A: 'Α', B: 'Β', C: 'Γ', D: 'Δ', E: 'Ε', F: 'Ζ', G: 'Η', H: 'Θ',
  I: 'Ι', K: 'Κ', L: 'Λ', M: 'Μ', N: 'Ν', O: 'Ο', P: 'Π', Q: 'Ϙ',
  R: 'Ρ', S: 'Σ', T: 'Τ', U: 'Υ', X: 'Χ', Y: 'Υ', Z: 'Ζ'
};
function tokenToEl(token) {
  const s = String(token);
  const m = /^(∠)?([A-Za-z]+)$/.exec(s);
  if (!m) return null;
  let out = m[1] || '';
  for (const ch of m[2]) {
    const g = LETTER_EL[ch.toUpperCase()];
    if (!g) return null;
    out += g;
  }
  return out;
}

/* ---------- primitive constructions ---------- */
// line through a with direction da  ×  line through b with direction db
function interLL(a, da, b, db) {
  const d = crs(da, db);
  if (Math.abs(d) < 1e-12) return null;
  const t = crs(sub(b, a), db) / d;
  return add(a, mul(da, t));
}
// two circles; side = +1 → the intersection left of the directed line c1→c2
function interCC(c1, r1, c2, r2, side) {
  const d = dist(c1, c2);
  if (d < 1e-12) return null;
  let a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  let h2 = r1 * r1 - a * a;
  const h = Math.sqrt(Math.max(0, h2));
  const u = unit(sub(c2, c1));
  const base = add(c1, mul(u, a));
  return add(base, mul(perp(u), (side < 0 ? -h : h)));
}
// line (p, dir) × circle (c, r);  which = +1 → farther along dir
function interLC(p, dir, c, r, which) {
  const u = unit(dir);
  const f = sub(p, c);
  const b = dot(f, u), cc = dot(f, f) - r * r;
  let disc = b * b - cc;
  disc = Math.sqrt(Math.max(0, disc));
  const t = (which < 0) ? (-b - disc) : (-b + disc);
  return add(p, mul(u, t));
}
const footOf = (p, a, b) => {           // foot of perpendicular from p to line ab
  const u = unit(sub(b, a));
  return add(a, mul(u, dot(sub(p, a), u)));
};
const reflectPt = (p, a, b) => {
  const f = footOf(p, a, b);
  return add(p, mul(sub(f, p), 2));
};
const projOnSeg = (p, a, b) => {        // clamped projection (for dragging)
  const ab = sub(b, a);
  let t = dot(sub(p, a), ab) / (dot(ab, ab) || 1);
  t = Math.max(0, Math.min(1, t));
  return lerp(a, b, t);
};

/* ============================================================
   Figure builder
   ============================================================ */
let uid = 0;
class Fig {
  constructor(state) {
    this.state = state || {};
    this.objs = [];
    this.free = [];          // draggable handles
    this.alias = {};         // text token -> [element ids]
    this.pts = {};           // name -> point
    this.opts = {};
  }

  /* -- registration of text tokens ---------------------------- */
  link(token, id) {
    if (!token) return;
    const t = String(token);
    (this.alias[t] || (this.alias[t] = [])).push(id);
    const el = tokenToEl(t);
    if (el && el !== t) (this.alias[el] || (this.alias[el] = [])).push(id);
  }
  _push(o) {
    if (!o.id) o.id = o.kind + ':' + (++uid);
    o.step = o.step || 0;
    this.objs.push(o);
    return o;
  }

  /* -- points ------------------------------------------------- */
  /** free, draggable point */
  pt(name, x, y, o = {}) {
    const st = this.state[name];
    let p = V(st ? st.x : x, st ? st.y : y);
    /* a clamp is a standing constraint, not just a drag filter: apply it on
       every build so the figure keeps its properties when *other* points move */
    if (o.clamp) { const q = o.clamp(p, this); p = V(q.x, q.y); }
    p.name = name;
    this.pts[name] = p;
    if (o.free !== false) {
      /* noXform: a 1-D length handle — draggable, but whole-diagram
         rotations and flips leave it alone */
      this.free.push({ name, at: p, noXform: !!o.noXform, project: q => (o.clamp ? o.clamp(q, this) : q) });
    }
    this.mark(name, p, o);
    return p;
  }
  /** point constrained to a segment / circle, draggable along it */
  ptOn(name, obj, tOrPos, o = {}) {
    let p;
    const st = this.state[name];
    if (obj.kind === 'circle' || obj.r !== undefined) {
      const t = st ? st.t : tOrPos;
      p = pol(obj.c, obj.r, t);
      this.free.push({
        name, at: p, param: 't',
        project: q => ({ t: ang(sub(q, obj.c)) })
      });
      this.state[name] = { t: st ? st.t : tOrPos };
    } else {
      const t = st ? st.t : tOrPos;
      p = lerp(obj.a, obj.b, t);
      this.free.push({
        name, at: p, param: 't',
        project: q => {
          const ab = sub(obj.b, obj.a);
          let t2 = dot(sub(q, obj.a), ab) / (dot(ab, ab) || 1);
          const lo = o.lo === undefined ? 0.06 : o.lo, hi = o.hi === undefined ? 0.94 : o.hi;
          return { t: Math.max(lo, Math.min(hi, t2)) };
        }
      });
      this.state[name] = { t: st ? st.t : tOrPos };
    }
    p.name = name;
    this.pts[name] = p;
    this.mark(name, p, o);
    return p;
  }
  /** a derived (computed) point: label it, but it is not draggable */
  at(name, p, o = {}) {
    if (!p) p = V(0, 0);
    const q = V(p.x, p.y);
    q.name = name;
    this.pts[name] = q;
    this.mark(name, q, o);
    return q;
  }
  /** draw the dot + letter for a point */
  mark(name, p, o = {}) {
    if (o.show === false) return p;
    const id = 'pt:' + name;
    this._push({
      kind: 'point', id, at: p, label: o.label === undefined ? name : o.label, until: o.until,
      step: o.step, role: o.role, dir: o.dir, dot: o.dot, big: o.big, cls: o.cls,
      hideUntilHl: !!o.hideUntilHl, late: o.late,
      keepAfterStep: !!o.keepAfterStep, keepThroughBeats: !!o.keepThroughBeats
    });
    this.link(name, id);
    return p;
  }

  /* -- lines -------------------------------------------------- */
  seg(a, b, o = {}) {
    const id = o.id || ('seg:' + this._nm(a) + this._nm(b));
    const s = this._push({
      kind: 'seg', id, a, b, step: o.step, until: o.until, role: o.role, cls: o.cls, late: o.late,
      w: o.w, dash: o.dash, color: o.color, fit: o.fit, hideUntilHl: !!o.hideUntilHl,
      keepAfterStep: !!o.keepAfterStep, keepThroughBeats: !!o.keepThroughBeats
    });
    const n1 = this._nm(a), n2 = this._nm(b);
    if (n1 && n2) { this.link(n1 + n2, id); this.link(n2 + n1, id); }
    if (o.name) this.link(o.name, id);
    if (o.ticks) this.tick(a, b, o.ticks, { step: o.step, late: o.late });
    return s;
  }
  /** unbounded straight line through a and b (clipped to the view) */
  ray(a, b, o = {}) {
    const id = o.id || ('ray:' + this._nm(a) + this._nm(b));
    return this._push({ kind: 'line', id, a, b, both: !!o.both, step: o.step, until: o.until, role: o.role, dash: o.dash, cls: o.cls, color: o.color });
  }
  line(a, b, o = {}) { return this.ray(a, b, Object.assign({ both: true }, o)); }

  circle(c, thru, o = {}) {
    const r = (typeof thru === 'number') ? thru : dist(c, thru);
    const nm = this._nm(c);
    const id = o.id || ('cir:' + (nm || (++uid)));
    const obj = this._push({
      kind: 'circle', id, c, r, step: o.step, until: o.until, role: o.role, cls: o.cls,
      dash: o.dash, color: o.color, fit: o.fit, label: o.label, labelAng: o.labelAng, wide: o.wide,
      hideUntilHl: !!o.hideUntilHl
    });
    if (nm) { this.link('circle ' + nm, id); this.link('cir' + nm, id); }
    if (o.label) this.link(o.label, id);
    if (o.name) this.link(o.name, id);
    return obj;
  }
  arc(c, r, t0, t1, o = {}) {
    return this._push({ kind: 'arc', id: o.id, c, r, t0, t1, step: o.step, until: o.until, role: o.role, dash: o.dash, color: o.color, cls: o.cls, fit: o.fit, hideUntilHl: !!o.hideUntilHl });
  }
  /** arc of circle `cir` from point p to point q (short way unless o.big) */
  arcPts(cir, p, q, o = {}) {
    let t0 = ang(sub(p, cir.c)), t1 = ang(sub(q, cir.c));
    let d = t1 - t0; while (d < 0) d += 2 * Math.PI; while (d >= 2 * Math.PI) d -= 2 * Math.PI;
    if (!o.big && d > Math.PI) { const t = t0; t0 = t1; t1 = t; }
    const pad = (o.pad || 0) * Math.PI / 180;
    return this.arc(cir.c, cir.r, t0 - pad, t1 + pad, o);
  }

  poly(names, pts, o = {}) {
    const id = o.id || ('poly:' + names);
    const p = this._push({
      kind: 'poly', id, pts, step: o.step, until: o.until, role: o.role, fill: o.fill !== false,
      close: o.close !== false, cls: o.cls, color: o.color, w: o.w, dash: o.dash, fit: o.fit
    });
    if (names) {
      const s = String(names);
      this.link(s, id);
      if (s.length === 3) {            // triangles: all readings
        const [A, B, C] = s;
        [A + B + C, A + C + B, B + A + C, B + C + A, C + A + B, C + B + A].forEach(t => this.link(t, id));
      }
      if (s.length === 4) {            // quadrilaterals: rotations + reverse
        for (let i = 0; i < 4; i++) {
          this.link(s.slice(i) + s.slice(0, i), id);
          const r = s.split('').reverse().join('');
          this.link(r.slice(i) + r.slice(0, i), id);
        }
      }
    }
    if (o.name) this.link(o.name, id);
    return p;
  }
  face(pts, o = {}) {   // shaded face, for solids
    return this._push({ kind: 'face', id: o.id, pts, shade: o.shade === undefined ? 0.5 : o.shade, step: o.step, until: o.until, role: o.role, cls: o.cls });
  }

  /* -- decorations -------------------------------------------- */
  /** angle at vertex v between rays to p and q */
  ang(p, v, q, o = {}) {
    const id = o.id || ('ang:' + this._nm(p) + this._nm(v) + this._nm(q));
    const a = this._push({
      kind: 'angle', id, v, p, q, n: o.n || 1, r: o.r || 20, label: o.label, until: o.until,
      square: !!o.square, step: o.step, role: o.role, cls: o.cls, color: o.color,
      reflex: !!o.reflex, lr: o.lr, ldir: o.ldir, hideUntilHl: !!o.hideUntilHl
    });
    const n1 = this._nm(p), nv = this._nm(v), n2 = this._nm(q);
    if (n1 && nv && n2) {
      this.link(n1 + nv + n2, id); this.link(n2 + nv + n1, id);
      this.link('∠' + n1 + nv + n2, id); this.link('∠' + n2 + nv + n1, id);
    }
    if (o.label) { this.link(String(o.label), id); this.link('∠' + o.label, id); }
    if (o.name) this.link(o.name, id);
    return a;
  }
  tick(a, b, n, o = {}) {
    return this._push({ kind: 'tick', id: o.id, a, b, n: n || 1, step: o.step, until: o.until, role: o.role, cls: o.cls, color: o.color, late: o.late, hideUntilHl: !!o.hideUntilHl, keepAfterStep: !!o.keepAfterStep, keepThroughBeats: !!o.keepThroughBeats });
  }
  text(s, at, o = {}) {
    return this._push({ kind: 'text', id: o.id, s, at, dx: o.dx || 0, dy: o.dy || 0, step: o.step, until: o.until, role: o.role, size: o.size, cls: o.cls, anchor: o.anchor, italic: o.italic, hideUntilHl: !!o.hideUntilHl });
  }
  arrowSeg(a, b, o = {}) {
    return this._push({
      kind: 'arrow', id: o.id, a, b, step: o.step, until: o.until, role: o.role,
      cls: o.cls || 'e-arrow', both: o.both, w: o.w || 2.8, dash: o.dash, color: o.color
    });
  }

  /* -- named helpers used all over Euclid --------------------- */
  _nm(p) { return p && p.name ? p.name : null; }

  /** equilateral triangle on AB, apex on the given side, built the
      Euclidean way: two circles (scaffold) then the two joins. */
  equi(A, B, name, o = {}) {
    const side = o.side === undefined ? 1 : o.side;
    const st = o.step || 0, sc = { step: o.stepCircles === undefined ? st : o.stepCircles, role: 'scaffold' };
    const r = dist(A, B);
    const P = interCC(A, r, B, r, side);
    let c1, c2;
    const wide = o.wide !== false;
    c1 = this.circle(A, B, Object.assign({}, sc, { label: o.labelA, wide, id: o.id1 || ('cir:' + name + '1') }));
    c2 = this.circle(B, A, Object.assign({}, sc, { label: o.labelB, wide, id: o.id2 || ('cir:' + name + '2') }));
    this.at(name, P, { step: o.stepApex || st, dir: o.dir });
    const Pp = this.pts[name];
    const js = o.stepJoin === undefined ? st : o.stepJoin;
    this.seg(A, Pp, { step: js, ticks: o.ticks });
    this.seg(B, Pp, { step: js, ticks: o.ticks });
    /* and the triangle itself, so that what was made is plainly there */
    if (o.poly !== false && A.name && B.name) {
      this.poly(A.name + B.name + name, [A, B, Pp], { step: js, id: 'poly:' + A.name + B.name + name, cls: 'made' });
    }
    return { apex: Pp, c1, c2 };
  }
  /** perpendicular bisector of AB via two equal circles (scaffold) */
  perpBisect(A, B, o = {}) {
    const r = dist(A, B) * (o.r || 0.8);
    const P = interCC(A, r, B, r, 1), Q = interCC(A, r, B, r, -1);
    const sc = { step: o.step, role: 'scaffold' };
    const wide = o.wide !== false;
    this.circle(A, r, Object.assign({ wide, id: 'cir:pb1' }, sc));
    this.circle(B, r, Object.assign({ wide, id: 'cir:pb2' }, sc));
    return { P, Q, mid: mid(A, B) };
  }
  bbox() { return bboxOf(this.objs, true); }
}

/* ============================================================
   bounding box
   ============================================================ */
function bboxOf(objs, includeScaffold, showScaffold, upTo, opts) {
  const UP = (upTo === undefined || upTo === null) ? Infinity : upTo;
  const skipWide = opts && opts.skipWide;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, any = false;
  const put = (p) => { if (!p) return; any = true; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); };
  for (const o of objs) {
    if (o.fit === false) continue;
    if (skipWide && o.wide) continue;
    if (o.role === 'hidden') continue;
    if (o.role === 'scaffold' && !showScaffold) continue;
    if (o.until !== undefined && UP === Infinity) continue;
    if ((o.step || 0) > 90) continue;
    switch (o.kind) {
      case 'seg': case 'arrow': put(o.a); put(o.b); break;
      case 'tick': break;
      case 'point': put(o.at); break;
      case 'text': put(o.at); break;
      case 'poly': case 'face': o.pts.forEach(put); break;
      case 'circle':
        put(V(o.c.x - o.r, o.c.y - o.r)); put(V(o.c.x + o.r, o.c.y + o.r)); break;
      case 'arc': {
        put(pol(o.c, o.r, o.t0)); put(pol(o.c, o.r, o.t1));
        // include extreme points that the arc actually passes through
        for (let k = 0; k < 4; k++) {
          const t = k * Math.PI / 2;
          if (arcContains(o.t0, o.t1, t)) put(pol(o.c, o.r, t));
        }
        break;
      }
      default: break;
    }
  }
  if (!any) { x0 = -50; y0 = -50; x1 = 50; y1 = 50; }
  return { x0, y0, x1, y1 };
}
/**
 * Tight frame for citation popovers: show the characteristic shape (triangle,
 * lines, finished polys) without construction extensions that shrink the figure
 * to a speck. Still draws the full figure; only the camera is tighter.
 */
function previewBBox(objs, showScaffold, upTo) {
  const UP = (upTo === undefined || upTo === null) ? Infinity : upTo;
  const ok = (o) => {
    if (!o || o.fit === false || o.role === 'hidden') return false;
    if (o.role === 'scaffold' && !showScaffold) return false;
    if (o.until !== undefined && UP === Infinity) return false;
    if ((o.step || 0) > 90) return false;
    return true;
  };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, any = false;
  const put = (p) => {
    if (!p || p.x === undefined) return;
    any = true;
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  };
  const hasPoly = objs.some(o => ok(o) && o.kind === 'poly');
  for (const o of objs) {
    if (!ok(o)) continue;
    if (hasPoly) {
      /* finished shapes define the theorem; keep given points/segments too */
      if (o.kind === 'poly' || o.kind === 'face') o.pts.forEach(put);
      else if (o.kind === 'point' && (o.step || 0) === 0) put(o.at);
      else if ((o.kind === 'seg' || o.kind === 'arrow') && (o.step || 0) === 0) {
        put(o.a); put(o.b);
      }
    } else {
      /* no filled shape: frame the given figure (step 0), not long extensions */
      if ((o.step || 0) !== 0) continue;
      if (o.kind === 'seg' || o.kind === 'arrow') { put(o.a); put(o.b); }
      else if (o.kind === 'point') put(o.at);
      else if (o.kind === 'poly' || o.kind === 'face') o.pts.forEach(put);
      /* circles/arcs omitted from the fit so compass work does not dominate */
    }
  }
  if (!any) return bboxOf(objs, true, showScaffold, upTo, { skipWide: true });
  /* if the core is still almost a line (degenerate), fall back to full fit */
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 && h < 8) return bboxOf(objs, true, showScaffold, upTo, { skipWide: true });
  const mx = Math.max(w * 0.12, 12), my = Math.max(h * 0.12, 12);
  return { x0: x0 - mx, y0: y0 - my, x1: x1 + mx, y1: y1 + my };
}
function norm2pi(t) { while (t < 0) t += 2 * Math.PI; while (t >= 2 * Math.PI) t -= 2 * Math.PI; return t; }
function arcContains(t0, t1, t) {
  let a = norm2pi(t0), b = norm2pi(t1), c = norm2pi(t);
  let d = norm2pi(b - a), e = norm2pi(c - a);
  return e <= d;
}

/* ============================================================
   Renderer  →  SVG string
   ============================================================ */

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function f(n) { return (Math.round(n * 100) / 100); }

function render(fig, o = {}) {
  const W = o.w || 560, H = o.h || 420;
  const showScaffold = o.showScaffold !== false;
  const upTo = (o.upTo === undefined || o.upTo === null) ? Infinity : o.upTo;
  const objs = fig.objs;
  let hl = o.highlight && o.highlight.size ? o.highlight : null;
  const hlKeep = !!o.hlKeep;   /* whole figure stays lit; only named ids get .hl */
  if (hl && !hlKeep) {          /* light up the letters that name it, too */
    const ex = new Set(hl);
    const put = p => { if (p && p.name) ex.add('pt:' + p.name); };
    for (const ob of objs) {
      if (!hl.has(ob.id)) continue;
      if (ob.kind === 'seg' || ob.kind === 'line' || ob.kind === 'arrow') { put(ob.a); put(ob.b); }
      else if (ob.kind === 'poly' || ob.kind === 'face') ob.pts.forEach(put);
      else if (ob.kind === 'angle') { put(ob.v); put(ob.p); put(ob.q); }
      else if (ob.kind === 'circle' || ob.kind === 'arc') put(ob.c);
      else if (ob.kind === 'tick') { put(ob.a); put(ob.b); }
    }
    hl = ex;
  }
  /* a step may name something that should stay unlit even so — and a beat's
     "full ink" / "fade" parts are never lit, whatever a neighbour drags in */
  const unlit = [o.hlExclude, o.keepIds, o.dimIds].filter(s => s && s.size);
  if (hl && unlit.length) {
    const keep = new Set(hl);
    unlit.forEach(s => s.forEach(x => keep.delete(x)));
    hl = keep;
  }


  /* ---- fit: solve for a scale at which the letters and captions also fit ---- */
  const preview = !!o.preview;
  let bb0 = preview
    ? previewBBox(objs, showScaffold, upTo)
    : bboxOf(objs, true, showScaffold, upTo, { skipWide: true });
  /* a wide circle joins the resting view only if it costs little room */
  const cw = Math.max(bb0.x1 - bb0.x0, 1), chh = Math.max(bb0.y1 - bb0.y0, 1);
  const wideOnes = [];
  const byStep = new Map();
  if (!preview) {
    for (const ob of objs) {
      if (!ob.wide || ob.kind !== 'circle') continue;
      if (ob.role === 'hidden' || (ob.role === 'scaffold' && !showScaffold)) continue;
      if (ob.until !== undefined && upTo === Infinity) continue;
      const st = ob.step || 0;
      if (!byStep.has(st)) byStep.set(st, []);
      byStep.get(st).push({ ob, cb: { x0: ob.c.x - ob.r, x1: ob.c.x + ob.r, y0: ob.c.y - ob.r, y1: ob.c.y + ob.r } });
    }
    /* circles drawn together are kept or dropped together, so the pair matches */
    [...byStep.keys()].sort((a, b) => a - b).forEach(st => {
      const grp = byStep.get(st);
      let u = bb0;
      grp.forEach(({ cb }) => {
        u = { x0: Math.min(u.x0, cb.x0), x1: Math.max(u.x1, cb.x1), y0: Math.min(u.y0, cb.y0), y1: Math.max(u.y1, cb.y1) };
      });
      if ((u.x1 - u.x0) <= 1.34 * cw && (u.y1 - u.y0) <= 1.34 * chh) bb0 = u;
      else grp.forEach(g => wideOnes.push(g));
    });
  }
  fig._wide = wideOnes;
  const padFrac = o.pad === undefined ? (preview ? 0.05 : 0.09) : o.pad;
  /* screen-space room each label needs around its anchor point */
  const extras = [];
  const lab = preview ? 0.55 : 1;   /* previews: don't let labels shrink the figure */
  for (const ob of objs) {
    if (ob.role === 'hidden') continue;
    if (ob.role === 'scaffold' && !showScaffold) continue;
    if (ob.until !== undefined && upTo === Infinity) continue;
    if ((ob.step || 0) > 90) continue;
    if (ob.kind === 'point' && ob.label) extras.push({ p: ob.at, l: 26 * lab, r: 26 * lab, t: 24 * lab, b: 24 * lab });
    if (ob.kind === 'text' && !preview) {
      const wpx = String(ob.s).length * ((ob.size || 13) * 0.52) + 6;
      const half = ob.anchor === 'middle' ? wpx / 2 : (ob.anchor === 'end' ? wpx : 0);
      extras.push({
        p: ob.at, l: half - (ob.dx || 0) + 2, r: (wpx - half) + (ob.dx || 0) + 2,
        t: 12 + (ob.dy || 0), b: 12 - (ob.dy || 0)
      });
    }
    if (!preview && ob.kind === 'angle' && ob.label !== undefined && ob.label !== null)
      extras.push({ p: ob.v, l: ob.r + 24, r: ob.r + 24, t: ob.r + 20, b: ob.r + 20 });
  }
  let k = o.view ? o.view.k : Math.min(W / Math.max(bb0.x1 - bb0.x0, 1e-6), H / Math.max(bb0.y1 - bb0.y0, 1e-6)) * (1 - padFrac);
  let bb = bb0;
  for (let it = 0; it < (o.view ? 0 : 5); it++) {
    let x0 = bb0.x0, x1 = bb0.x1, y0 = bb0.y0, y1 = bb0.y1;
    for (const e of extras) {
      x0 = Math.min(x0, e.p.x - e.l / k); x1 = Math.max(x1, e.p.x + e.r / k);
      y0 = Math.min(y0, e.p.y - e.b / k); y1 = Math.max(y1, e.p.y + e.t / k);
    }
    bb = { x0, y0, x1, y1 };
    const nk = Math.min(W / Math.max(x1 - x0, 1e-6), H / Math.max(y1 - y0, 1e-6)) * (1 - padFrac);
    if (Math.abs(nk - k) < 0.002) { k = nk; break; }
    k = (k + nk) / 2;
  }
  let w = Math.max(bb.x1 - bb.x0, 1e-6), h = Math.max(bb.y1 - bb.y0, 1e-6);
  let cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  /* a workbench wants a fixed viewport, not one that jumps as objects appear */
  if (o.view) { k = o.view.k; cx = o.view.cx; cy = o.view.cy; }
  const P = p => V(W / 2 + (p.x - cx) * k, H / 2 - (p.y - cy) * k);   // y flips here
  const inv = p => V(cx + (p.x - W / 2) / k, cy - (p.y - H / 2) / k);
  fig._proj = { P, inv, k, W, H, cx, cy };

  /* ---- label directions ---- */
  const nb = {};   // point name -> list of neighbour points
  const key = p => f(p.x) + ',' + f(p.y);
  const pushNb = (a, b) => { (nb[key(a)] || (nb[key(a)] = [])).push(b); };
  for (const ob of objs) {
    if (ob.kind === 'seg') { pushNb(ob.a, ob.b); pushNb(ob.b, ob.a); }
    if (ob.kind === 'poly' || ob.kind === 'face') {
      const ps = ob.pts;
      for (let i = 0; i < ps.length; i++) {
        const j = (i + 1) % ps.length;
        if (!ob.close && j === 0) continue;
        pushNb(ps[i], ps[j]); pushNb(ps[j], ps[i]);
      }
    }
    if (ob.kind === 'circle') { /* centre label pushed away from nothing */ }
  }
  const centroid = V((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
  function labelDir(p, given) {
    if (given) return unit(V(given[0], given[1]));
    const ns = nb[key(p)];
    if (ns && ns.length) {
      let s = V(0, 0);
      ns.forEach(q => { s = add(s, unit(sub(q, p))); });
      if (len(s) > 1e-6) return mul(unit(s), -1);
      // opposite rays: step out perpendicular
      return unit(perp(sub(ns[0], p)));
    }
    const d = sub(p, centroid);
    return len(d) > 1e-6 ? unit(d) : V(0, 1);
  }

  const stroke = () => null;
  const revealedIds = o.revealedIds || null; /* ids already shown in earlier beats this step */
  /* beat-driven staging (see hlBeats): what is not on screen yet, what a beat
     forces on screen, and what this beat is drawing or fading in right now. */
  const hideIds = o.hideIds || null;
  const forceIds = o.forceIds || null;
  const drawIds = o.drawIds || null;
  const fadeIds = o.fadeIds || null;
  const keepIds = o.keepIds || null;   /* full ink, though not highlighted */
  const dimIds = o.dimIds || null;     /* faded, whatever the figure says */

  /* ---- emit ---- */
  const out = [];
  const hits = [];                       // transparent, fat, click-me shapes
  const push = s => out.push(s);
  const hit = s => hits.push(s);
  /*
    Background construction (e.g. AE after it is drawn, or D–E on later steps):
    full normal stroke — same “white / ink” look as on proof line 2 — not .dim
    and not .hl. Only the current beat gets .hl.
  */
  const isBgStroke = ob => {
    if (!ob || !ob.id) return false;
    const st = ob.step || 0;
    /* a beat may ask outright for full ink, or for the fade */
    if (dimIds && dimIds.has(ob.id)) return false;
    if (keepIds && keepIds.has(ob.id)) return true;
    const wasRevealed = !!(revealedIds && revealedIds.has(ob.id));
    if (ob.keepThroughBeats && wasRevealed) return true;
    if (ob.keepAfterStep && (upTo === Infinity || upTo > st)) return true;
    return false;
  };
  const hlCls = ob => {
    if (!hl) return '';
    if (hl.has(ob.id)) return ' hl';
    if (isBgStroke(ob)) return '';          /* full opacity, unhighlighted */
    if (hlKeep) return '';
    return ' dim';
  };
  /* click targets travel with their layer, so a hidden layer cannot be clicked */
  const hitCls = ob => (ob && ob.cls ? ' ' + ob.cls : '');
  const cls = (ob, base) => {
    let c = base + animCls(ob);
    if (ob.role === 'scaffold') c += ' scaffold';
    if (ob.cls) c += ' ' + ob.cls;
    c += hlCls(ob);
    if ((ob.step || 0) === upTo && upTo !== Infinity && upTo > 0) c += ' now';
    return c;
  };
  /* one style attribute per element, always */
  const attrs = (ob, extra) => {
    let a = ` data-eid="${esc(ob.id)}" class="${cls(ob, KIND_CLASS[ob.kind] || '')}"${animLen(ob)}`;
    const st = styleOf(ob, stroke(ob)) + (extra || '') + animSty(ob);
    if (st) a += ` style="${st}"`;
    if (ob.dash) a += ` stroke-dasharray="${ob.dash}"`;
    if (ob.w) a += ` stroke-width="${ob.w}"`;
    return a;
  };
  var visible = ob => {
    if (ob.role === 'hidden') return false;
    /* hideIds: a later beat of this step draws it, so it is not on screen yet */
    if (hideIds && ob.id && hideIds.has(ob.id)) return false;
    /* forceIds: a beat has drawn this, so it is on screen whatever the checkbox
       says and whatever step it nominally belongs to */
    const forced = !!(forceIds && ob.id && forceIds.has(ob.id));
    if (ob.role === 'scaffold' && !showScaffold && !forced) return false;
    if ((ob.step || 0) > upTo && !forced) return false;
    if (ob.until !== undefined && (upTo === Infinity || upTo > ob.until)) return false;
    /*
      hideUntilHl: off until named in a highlight.
      - in current hl → show
      - keepThroughBeats + already revealed → stay as full (unhighlighted) background
      - keepAfterStep + past this step / whole figure → permanent geometry
      - else hide (cut-off circles; AB/BF between their own beats)
    */
    if (ob.hideUntilHl) {
      const st = ob.step || 0;
      const inHl = !!(ob.id && hl && hl.has(ob.id));
      const wasRevealed = !!(ob.id && revealedIds && revealedIds.has(ob.id));
      if (inHl) { /* show */ }
      else if (ob.keepThroughBeats && wasRevealed) { /* background stroke through later beats */ }
      else if (ob.keepAfterStep && (upTo === Infinity || upTo > st)) { /* permanent after step */ }
      else return false;
    }
    return true;
  };

  /* Adjacent non-right angles at one vertex: stagger arc radii so the
     little corner marks stay easy to tell apart (not almost on top of each other). */
  (function staggerAngleArcs() {
    const groups = new Map();
    for (const ob of objs) {
      if (ob.kind !== 'angle' || ob.square || !visible(ob)) continue;
      const key = ob.v;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ob);
    }
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      list.sort((a, b) => ((a.r || 20) - (b.r || 20)) || String(a.id).localeCompare(String(b.id)));
      const base = list[0].r || 20;
      const gap = 18; /* screen-px separation between neighbouring arcs */
      list.forEach((ob, i) => { ob._rDraw = base + i * gap; });
    }
  })();

  // draw order: faces, fills, circles, segments, decorations, points, text
  const order = { face: 0, poly: 1, circle: 2, arc: 2, line: 3, seg: 4, arrow: 4, tick: 5, angle: 6, point: 7, text: 8 };
  const sorted = objs.map((ob, i) => [ob, i]).sort((a, b) => (order[a[0].kind] - order[b[0].kind]) || (a[1] - b[1]));

  /* ---- the compass-and-straightedge animation ----
     everything belonging to the step just reached is drawn on, in order:
     strokes trace themselves out, the rest fades in behind them. */
  const speed = o.speed || 1;
  const animStep = (o.animate && upTo !== Infinity && upTo > 0) ? upTo : null;
  const STROKEY = { seg: 1, line: 1, circle: 1, arc: 1, poly: 1, angle: 1, tick: 1, arrow: 1 };
  const anim = {};
  /* noDrawAnim: skip construction draw-on (used when hlBeats drive the show).
     reflashIds: if set, only those ids get the reflash dip (avoids double-flash). */
  const noDrawAnim = !!o.noDrawAnim;
  const reflashIds = (o.reflashIds === undefined || o.reflashIds === null) ? null : o.reflashIds;
  if (animStep !== null) {
    if (!noDrawAnim) {
      /* in the order they were constructed, not the order they are painted:
         the arcs cross, that gives the point, and only then is the join drawn */
      const queue = [];
      const seen = {};
      for (const ob of objs) {
        if (!visible(ob) || (ob.step || 0) !== animStep || seen[ob.id]) continue;
        seen[ob.id] = 1; queue.push(ob);
      }
      const stag = (queue.length > 5 ? 0.13 : 0.17) / speed;
      queue.forEach((ob, i) => {
        /* solid construction strokes: full draw, not a lingering faint dash */
        anim[ob.id] = { cls: STROKEY[ob.kind] ? 'anim-draw' : 'anim-fade',
          delay: (o.delay0 || 0) + i * stag + (ob.late || 0) / speed };
      });
    }
    /* strokes in the highlight set: dip-then-relight, or draw-on if new this step */
    if (hl) {
      const want = (reflashIds !== null && reflashIds !== undefined) ? reflashIds : hl;
      let j = 0;
      for (const ob of objs) {
        if (!visible(ob) || anim[ob.id]) continue;
        if (!want.has(ob.id)) continue;
        if (!STROKEY[ob.kind]) continue;
        /* default: only reflash already-present work; beat mode may reflash this step's too */
        if (!reflashIds && !noDrawAnim && (ob.step || 0) >= animStep) continue;
        /*
          When a beat first names a stroke that belongs to this step (e.g. PX
          on thm 12 step 2), draw it on rather than only reflashing.
        */
        const isNewStroke = noDrawAnim && reflashIds && (ob.step || 0) === animStep;
        anim[ob.id] = {
          cls: isNewStroke ? 'anim-draw' : 'anim-reflash',
          delay: (o.delay0 || 0) + (j++ * (isNewStroke ? 0.08 : 0.04)) / speed
        };
      }
    }
    /*
      A beat may say outright "draw this now" / "show this now" — for a line
      already present, or a construction circle that belongs to no step at all.
      That wins over anything decided above.
    */
    if ((drawIds && drawIds.size) || (fadeIds && fadeIds.size)) {
      let m = 0;
      for (const ob of objs) {
        if (!visible(ob) || !ob.id) continue;
        const isDraw = drawIds && drawIds.has(ob.id);
        if (!isDraw && !(fadeIds && fadeIds.has(ob.id))) continue;
        anim[ob.id] = {
          cls: (isDraw && STROKEY[ob.kind]) ? 'anim-draw' : 'anim-fade',
          delay: (o.delay0 || 0) + (m++ * 0.12) / speed
        };
      }
    }
  }
  const animCls = ob => (anim[ob.id] ? ' ' + anim[ob.id].cls : '');
  const animSty = ob => (anim[ob.id] ? `--delay:${f(anim[ob.id].delay)}s;` : '');
  const animLen = ob => (anim[ob.id] && anim[ob.id].cls === 'anim-draw' ? ' pathLength="1"' : '');

  for (const [ob] of sorted) {
    if (!visible(ob)) continue;
    switch (ob.kind) {
      case 'seg': {
        const a = P(ob.a), b = P(ob.b);
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        hit(`<line class="hit${hitCls(ob)}" data-eid="${esc(ob.id)}" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`);
        push(`<line${attrs(ob, '--len:' + f(L) + ';')} x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`);
        break;
      }
      case 'arrow': {
        const a = P(ob.a), b = P(ob.b);
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        push(`<line${attrs(ob, '--len:' + f(L) + ';')} marker-end="url(#arrowh)"${ob.both ? ' marker-start="url(#arrowh0)"' : ''} x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`);
        break;
      }
      case 'line': {   // clip to the view rectangle
        const vbb = o.view
          ? { x0: cx - W / (2 * k), x1: cx + W / (2 * k), y0: cy - H / (2 * k), y1: cy + H / (2 * k) }
          : bb0;
        const seg = clipLine(ob.a, ob.b, vbb, ob.both);
        if (!seg) break;
        const a = P(seg[0]), b = P(seg[1]);
        hit(`<line class="hit${hitCls(ob)}" data-eid="${esc(ob.id)}" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`);
        push(`<line${attrs(ob)} x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`);
        break;
      }
      case 'circle': {
        const c = P(ob.c);
        hit(`<circle class="hit${hitCls(ob)}" data-eid="${esc(ob.id)}" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(ob.r * k)}" fill="none"/>`);
        push(`<circle${attrs(ob, '--len:' + f(2 * Math.PI * ob.r * k) + ';')} cx="${f(c.x)}" cy="${f(c.y)}" r="${f(ob.r * k)}"/>`);
        if (ob.label) {
          const lp = P(pol(ob.c, ob.r, (ob.labelAng === undefined ? 65 : ob.labelAng) * DEG));
          const tdim = hlCls(ob);
          push(`<text class="figlab${tdim}" x="${f(lp.x)}" y="${f(lp.y)}" dy="-6">${esc(ob.label)}</text>`);
        }
        break;
      }
      case 'arc': {
        hit(`<path class="hit${hitCls(ob)}" data-eid="${esc(ob.id)}" fill="none" d="${arcPath(P, ob.c, ob.r * k, ob.t0, ob.t1, k)}"/>`);
        push(`<path${attrs(ob)} d="${arcPath(P, ob.c, ob.r * k, ob.t0, ob.t1, k)}" fill="none"/>`);
        break;
      }
      case 'poly': {
        const d = ob.pts.map(p => { const q = P(p); return f(q.x) + ',' + f(q.y); }).join(' ');
        const tag = ob.close ? 'polygon' : 'polyline';
        push(`<${tag}${attrs(ob, ob.fill === false ? 'fill:none;' : '')} points="${d}"/>`);
        break;
      }
      case 'face': {
        const d = ob.pts.map(p => { const q = P(p); return f(q.x) + ',' + f(q.y); }).join(' ');
        push(`<polygon${attrs(ob, '--sh:' + ob.shade + ';')} points="${d}" fill-opacity="${ob.shade}"/>`);
        break;
      }
      case 'tick': {
        const m = mid(ob.a, ob.b), u = unit(sub(ob.b, ob.a)), n = perp(u);
        const gap = 5 / k, half = 6 / k;
        for (let i = 0; i < ob.n; i++) {
          const c = add(m, mul(u, (i - (ob.n - 1) / 2) * gap));
          const p1 = P(add(c, mul(n, half))), p2 = P(add(c, mul(n, -half)));
          push(`<line${attrs(ob)} x1="${f(p1.x)}" y1="${f(p1.y)}" x2="${f(p2.x)}" y2="${f(p2.y)}"/>`);
        }
        break;
      }
      case 'angle': {
        const u1 = unit(sub(ob.p, ob.v)), u2 = unit(sub(ob.q, ob.v));
        const t1 = ang(u1), t2 = ang(u2);
        const rPx = (ob._rDraw !== undefined ? ob._rDraw : ob.r) || 20;
        const rw = rPx / k;                  // screen px -> world
        if (ob.square) {
          const a = add(ob.v, mul(u1, rw * 0.72)), c = add(ob.v, mul(u2, rw * 0.72));
          const b = add(a, sub(c, ob.v));
          const pa = P(a), pb = P(b), pc = P(c);
          push(`<polyline${attrs(ob)} points="${f(pa.x)},${f(pa.y)} ${f(pb.x)},${f(pb.y)} ${f(pc.x)},${f(pc.y)}" fill="none"/>`);
        } else {
          for (let i = 0; i < ob.n; i++) {
            const rr = rw * (1 + i * 0.22);
            push(`<path${attrs(ob)} d="${(ob.reflex ? arcPathLong : arcPathShort)(P, ob.v, rr * k, t1, t2, k)}" fill="none"/>`);
          }
        }
        if (ob.label !== undefined && ob.label !== null) {
          let bis = add(u1, u2);
          const alab = anim[ob.id] ? ' anim-fade' : '';
          bis = len(bis) < 1e-6 ? perp(u1) : unit(bis);
          if (ob.reflex) bis = mul(bis, -1);
          if (ob.ldir) bis = unit(V(ob.ldir[0], ob.ldir[1]));
          /* sit past the (possibly staggered) arc; lr is screen-px like r */
          const labR = ob.lr !== undefined ? ob.lr : (rPx * 1.55 + 10);
          const lp = P(add(ob.v, mul(bis, labR / k)));
          const tdim = hlCls(ob);
          const lcls = (ob.cls ? ' ' + ob.cls : '');
          push(`<text class="figlab small${tdim}${alab}${lcls}" data-eid="${esc(ob.id)}" x="${f(lp.x)}" y="${f(lp.y)}" dy="4"${anim[ob.id] ? ` style="${animSty(ob)}"` : ''}>${esc(ob.label)}</text>`);
        }
        break;
      }
      case 'point': {
        const p = P(ob.at);
        hit(`<circle class="hit dot${hitCls(ob)}" data-eid="${esc(ob.id)}" cx="${f(p.x)}" cy="${f(p.y)}" r="11"/>`);
        const dr = labelDir(ob.at, ob.dir);
        const off = ob.big ? 17 : 14;
        const lx = p.x + dr.x * off, ly = p.y - dr.y * off + 4.5;
        if (ob.dot !== false) push(`<circle${attrs(ob)} cx="${f(p.x)}" cy="${f(p.y)}" r="${ob.big ? 3.6 : 2.7}"/>`);
        if (ob.label) {
          const tdim = hlCls(ob);
          const lcls = (ob.cls ? ' ' + ob.cls : '');
          push(`<text class="figlab${tdim}${anim[ob.id] ? ' anim-fade' : ''}${lcls}" data-eid="${esc(ob.id)}" x="${f(lx)}" y="${f(ly)}"${anim[ob.id] ? ` style="${animSty(ob)}"` : ''}>${esc(ob.label)}</text>`);
        }
        break;
      }
      case 'text': {
        const p = P(ob.at);
        const tdim = hlCls(ob);
        push(`<text class="fignote${ob.cls ? ' ' + ob.cls : ''}${tdim}${anim[ob.id] ? ' anim-fade' : ''}" data-eid="${esc(ob.id)}"${anim[ob.id] ? ` style="${animSty(ob)}"` : ''} x="${f(p.x + (ob.dx || 0))}" y="${f(p.y - (ob.dy || 0))}"${ob.anchor ? ` text-anchor="${ob.anchor}"` : ''}${ob.size ? ` font-size="${ob.size}"` : ''}${ob.italic ? ' font-style="italic"' : ''}>${esc(ob.s)}</text>`);
        break;
      }
    }
  }


  const defs = `<defs>
    <marker id="arrowh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="currentColor"/></marker>
    <marker id="arrowh0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L9,5 L0,9 z" fill="currentColor"/></marker>
  </defs>`;

  return `<svg class="fig" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="--dur:${f(0.78 / speed)}s" xmlns="http://www.w3.org/2000/svg">${defs}<g class="figbody">${out.join('')}</g><g class="hitlayer">${hits.join('')}</g></svg>`;
}

const KIND_CLASS = {
  seg: 'e-seg', line: 'e-line', circle: 'e-cir', arc: 'e-arc', poly: 'e-poly',
  face: 'e-face', tick: 'e-tick', angle: 'e-ang', point: 'e-pt', text: 'e-txt', arrow: 'e-seg'
};
function styleOf(ob, s) { let st = ''; if (ob.color) st += `--c:${ob.color};`; else if (s) st += `--c:${s};`; return st; }

function arcPath(P, c, rpx, t0, t1, k) {
  let d = norm2pi(t1 - t0);
  const large = d > Math.PI ? 1 : 0;
  const a = P(pol(c, rpx / k, t0)), b = P(pol(c, rpx / k, t1));
  // y is flipped, so a counter-clockwise turn in world space is clockwise on screen
  return `M ${f(a.x)} ${f(a.y)} A ${f(rpx)} ${f(rpx)} 0 ${large} 0 ${f(b.x)} ${f(b.y)}`;
}
function arcPathLong(P, c, rpx, t0, t1, k) {
  let d = norm2pi(t1 - t0);
  if (d < Math.PI) { const t = t0; t0 = t1; t1 = t; d = 2 * Math.PI - d; }
  const a = P(pol(c, rpx / k, t0)), b = P(pol(c, rpx / k, t1));
  return `M ${f(a.x)} ${f(a.y)} A ${f(rpx)} ${f(rpx)} 0 1 0 ${f(b.x)} ${f(b.y)}`;
}
function arcPathShort(P, c, rpx, t0, t1, k) {
  let d = norm2pi(t1 - t0);
  if (d > Math.PI) { const t = t0; t0 = t1; t1 = t; d = 2 * Math.PI - d; }
  const a = P(pol(c, rpx / k, t0)), b = P(pol(c, rpx / k, t1));
  return `M ${f(a.x)} ${f(a.y)} A ${f(rpx)} ${f(rpx)} 0 0 0 ${f(b.x)} ${f(b.y)}`;
}
function clipLine(a, b, bb, both) {
  const pad = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * 0.06;
  const x0 = bb.x0 - pad, x1 = bb.x1 + pad, y0 = bb.y0 - pad, y1 = bb.y1 + pad;
  const d = sub(b, a);
  let tmin = -1e9, tmax = 1e9;
  const slab = (p, dd, lo, hi) => {
    if (Math.abs(dd) < 1e-12) { if (p < lo || p > hi) { tmin = 1; tmax = -1; } return; }
    let t1 = (lo - p) / dd, t2 = (hi - p) / dd;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
  };
  slab(a.x, d.x, x0, x1); slab(a.y, d.y, y0, y1);
  if (tmax < tmin) return null;
  if (!both) tmin = Math.max(tmin, 0);
  return [add(a, mul(d, tmin)), add(a, mul(d, tmax))];
}

/* ============================================================
   Figure instance: build + drag
   ============================================================ */
function makeFigure(def, state) {
  const st = state || {};
  const build = () => { const b = new Fig(st); b.opts = def.opts || {}; def.build(b); return b; };
  let fig = build();
  return {
    def, state: st,
    get fig() { return fig; },
    rebuild() { fig = build(); return fig; },
    render(o) { return render(fig, o); },
    /** convert screen point (px inside the svg viewBox) to world */
    toWorld(p) { return fig._proj ? fig._proj.inv(p) : p; },
    drag(name, worldPt) {
      const fr = fig.free.find(x => x.name === name);
      if (!fr) return;
      const r = fr.project(worldPt);
      if (r && r.t !== undefined) st[name] = { t: r.t };
      else st[name] = { x: r.x, y: r.y };
      this.rebuild();
    },
    reset() { for (const k in st) delete st[k]; this.rebuild(); }
  };
}

/** how far to pull back so the circles drawn at this step are seen whole */
function zoomFor(fig, o) {
  const pr = fig._proj, wide = fig._wide || [];
  if (!pr || !wide.length) return { needed: false };
  const step = o && o.step;
  const mine = wide.filter(w => step === undefined || step === null || (w.ob.step || 0) === step);
  if (!mine.length) return { needed: false };
  let bb = { x0: pr.cx - pr.W / (2 * pr.k), x1: pr.cx + pr.W / (2 * pr.k), y0: pr.cy - pr.H / (2 * pr.k), y1: pr.cy + pr.H / (2 * pr.k) };
  /* every circle of this step, whole */
  mine.forEach(w => {
    bb = { x0: Math.min(bb.x0, w.cb.x0), x1: Math.max(bb.x1, w.cb.x1), y0: Math.min(bb.y0, w.cb.y0), y1: Math.max(bb.y1, w.cb.y1) };
  });
  const pad = 1.06;
  let k2 = Math.min(pr.W / ((bb.x1 - bb.x0) * pad), pr.H / ((bb.y1 - bb.y0) * pad));
  const maxOut = 3.2;                       // never pull back further than this
  k2 = Math.max(k2, pr.k / maxOut);
  if (k2 >= pr.k * 0.985) return { needed: false };
  const c2 = { x: (bb.x0 + bb.x1) / 2, y: (bb.y0 + bb.y1) / 2 };
  const sc = k2 / pr.k;
  const dx = (pr.cx - c2.x) * k2, dy = -(pr.cy - c2.y) * k2;
  /* given with the origin at 0,0 so no transform-box guesswork is needed */
  return {
    needed: true, s: sc, dx, dy,
    tx: (pr.W / 2) * (1 - sc) + dx, ty: (pr.H / 2) * (1 - sc) + dy
  };
}

root.Geom = {
  V, add, sub, mul, dot, crs, len, dist, unit, perp, mid, lerp, ang, pol, rotAbout, DEG,
  interLL, interCC, interLC, footOf, reflectPt, projOnSeg,
  LETTER_EL, tokenToEl,
  Fig, render, makeFigure, bboxOf, zoomFor
};
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = (typeof window !== 'undefined' ? window : globalThis).Geom;
