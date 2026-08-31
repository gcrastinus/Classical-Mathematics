/* ============================================================
   fsx.js — the fullscreen studio.
   Big figure + proof rail, pan / zoom / rotate the view, and
   "Alter illustration" in two modes:
     · preserve the proof — only the figure's free parameters can
       move; every constructed object is rebuilt exactly, so each
       proof line stays true (clamps forbid degenerate edits);
     · free edit — a detached copy of the figure in which anything
       can be moved or resized; each proof line is re-checked live
       and flagged when its claim stops being true, and the flag
       lifts again the moment the edit makes it true once more.
   ------------------------------------------------------------
   3D scaffolding: all screen mapping goes world → (Scene.project)
   → view plane → (Camera matrix) → screen.  Scene.project is the
   identity on (x, y) today; for the solid-geometry books, give
   points a z, replace Scene.project with a view+perspective
   transform and Camera stays exactly as it is.  Nothing else in
   this module assumes the world is flat.
   ============================================================ */
(function () {
'use strict';
const boot = () => {
const E = window.__EUCLID__, G = window.Geom;
if (!E || !G) return;
const UI = E.UI, BY_ID = E.BY_ID;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const { V, add, sub, mul, dot, dist, unit, mid } = G;

/* ---------- Scene scaffold (see header note) ---------- */
const Scene = {
  dim: 2,
  camera3: { eye: { x: 0, y: 0, z: 600 }, target: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 }, fov: 45 },
  project(p) { return { x: p.x, y: p.y }; },
  unproject(p, z) { return { x: p.x, y: p.y, z: z || 0 }; }
};

/* ---------- 2D affine camera (SVG matrix order) ---------- */
const mID = () => [1, 0, 0, 1, 0, 0];
const mMul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]
];
const mT = (x, y) => [1, 0, 0, 1, x, y];
const mS = s => [s, 0, 0, s, 0, 0];
const mR = t => { const c = Math.cos(t), s = Math.sin(t); return [c, s, -s, c, 0, 0]; };
const mApply = (m, p) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
const mInv = m => {
  const det = m[0] * m[3] - m[1] * m[2] || 1e-12;
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};
function Camera() { this.m = mID(); }
Camera.prototype.scale = function () { return Math.hypot(this.m[0], this.m[1]); };
Camera.prototype.zoomAt = function (p, f) {
  const s = this.scale() * f;
  if (s < 0.2 || s > 24) return;
  this.m = mMul(mMul(mMul(mT(p.x, p.y), mS(f)), mT(-p.x, -p.y)), this.m);
};
Camera.prototype.rotateAt = function (p, t) {
  this.m = mMul(mMul(mMul(mT(p.x, p.y), mR(t)), mT(-p.x, -p.y)), this.m);
};
Camera.prototype.pan = function (dx, dy) { this.m = mMul(mT(dx, dy), this.m); };
Camera.prototype.reset = function () { this.m = mID(); };

/* ---------- state ---------- */
const FS = {
  on: false, id: null, alter: false, mode: 'preserve',
  cam: new Camera(), free: {}, axisPick: null, suppressClick: false,
  editDrag: false,   /* a geometry drag is live: the camera holds still */
  view: null      /* frozen projection {k,cx,cy}: the studio never auto-fits,
                     so a change of length is visible as a change of size */
};
/* capture the projection that fits the whole finished figure, and hold it */
function primeView() {
  FS.view = null;
  const fw = E.figFor(FS.id); if (!fw) return;
  try {
    fw.render({ w: 1000, h: 700, upTo: Infinity, showScaffold: UI.scaffold });
    const pr = fw.fig._proj;
    if (pr) FS.view = { k: pr.k, cx: pr.cx, cy: pr.cy };
  } catch (e) { FS.view = null; }
}

/* ============================================================
   Proof-truth checking.
   A construction line cannot be *false*, only *impossible* (its
   preconditions fail); an assertion line is checked numerically.
   Claims are read against whichever geometry is on screen, so a
   broken line is flagged the moment an edit falsifies it and the
   flag lifts as soon as the figure satisfies it again.
   ============================================================ */
const CHECKS = {
  'thm:1': {
    1: [['circAt', 'cir:A', 'A'], ['circR', 'cir:A', 'A', 'B']],
    2: [['circAt', 'cir:B', 'B'], ['circR', 'cir:B', 'B', 'A']],
    3: [['onCirc', 'C', 'cir:A'], ['onCirc', 'C', 'cir:B'], ['onCirc', 'D', 'cir:A'], ['onCirc', 'D', 'cir:B']],
    6: [['eqSeg', 'A', 'C', 'A', 'B']],
    7: [['eqSeg', 'B', 'C', 'A', 'B']],
    8: [['eqSeg', 'A', 'C', 'B', 'C']],
    9: [['eqSeg', 'A', 'B', 'A', 'C'], ['eqSeg', 'A', 'B', 'B', 'C']]
  },
  'thm:1a': {
    2: [['eqSeg', 'D', 'A', 'A', 'B'], ['eqSeg', 'D', 'B', 'A', 'B']],
    3: [['betw', 'D', 'A', 'E'], ['betw', 'D', 'B', 'F']],
    4: [['circAt', 'cir:B', 'B'], ['circR', 'cir:B', 'B', 'C'], ['onCirc', 'G', 'cir:B'], ['betw', 'D', 'B', 'G']],
    5: [['circAt', 'cir:D', 'D'], ['circR', 'cir:D', 'D', 'G'], ['onCirc', 'L', 'cir:D'], ['betw', 'D', 'A', 'L']],
    6: [['eqSeg', 'B', 'G', 'B', 'C']],
    7: [['eqSeg', 'D', 'L', 'D', 'G']],
    8: [['eqSeg', 'D', 'A', 'D', 'B'], ['eqSeg', 'A', 'L', 'B', 'G']],
    9: [['eqSeg', 'A', 'L', 'B', 'C']]
  },
  'thm:1b': {
    1: [['eqSeg', 'A', 'D', 'c0', 'c1']],
    2: [['circAt', 'cir:A', 'A'], ['circR', 'cir:A', 'A', 'D']],
    3: [['ltSeg', 'A', 'D', 'A', 'B'], ['onCirc', 'E', 'cir:A'], ['betw', 'A', 'E', 'B']],
    4: [['eqSeg', 'A', 'E', 'A', 'D'], ['eqSeg', 'A', 'E', 'c0', 'c1']]
  },
  'thm:2': {
    1: [['eqSeg', 'A', 'B', 'D', 'E'], ['eqAng', 'A', 'B', 'C', 'D', 'E', 'F'], ['eqSeg', 'B', 'C', 'E', 'F']],
    2: [['eqSeg', 'A', 'B', 'D', 'E']],
    3: [['eqAng', 'A', 'B', 'C', 'D', 'E', 'F'], ['eqSeg', 'B', 'C', 'E', 'F']],
    4: [['eqSeg', 'A', 'C', 'D', 'F']],
    5: [['cong', 'A', 'B', 'C', 'D', 'E', 'F']],
    6: [['eqSeg', 'A', 'C', 'D', 'F'], ['eqAng', 'B', 'A', 'C', 'E', 'D', 'F'],
        ['eqAng', 'B', 'C', 'A', 'E', 'F', 'D'], ['eqArea', 'A', 'B', 'C', 'D', 'E', 'F']]
  },
  'thm:3': {
    1: [['eqSeg', 'A', 'B', 'A', 'C'], ['betw', 'A', 'B', 'D']],
    2: [['eqSeg', 'C', 'E', 'B', 'D'], ['betw', 'A', 'C', 'E'], ['circAt', 'cir:C', 'C'],
        ['circR', 'cir:C', 'B', 'D'], ['onCirc', 'E', 'cir:C']],
    4: [['eqSeg', 'A', 'D', 'A', 'E']],
    5: [['eqSeg', 'A', 'C', 'A', 'B']],
    6: [['cong', 'A', 'D', 'C', 'A', 'E', 'B']],
    7: [['eqAng', 'A', 'D', 'C', 'A', 'E', 'B'], ['eqSeg', 'D', 'C', 'E', 'B'],
        ['eqSeg', 'B', 'D', 'C', 'E'], ['cong', 'B', 'D', 'C', 'C', 'E', 'B']],
    8: [['eqAng', 'E', 'B', 'A', 'D', 'C', 'A'], ['eqAng', 'E', 'B', 'C', 'D', 'C', 'B'],
        ['eqAng', 'C', 'B', 'A', 'B', 'C', 'A']],
    9: [['eqAng', 'D', 'B', 'C', 'E', 'C', 'B']]
  },
  /* Reductio steps (suppositions and the absurdities drawn from them) carry
     no claims: the true figure does not satisfy them, and that is the point. */
  'thm:4': {
    1: [['eqAng', 'A', 'B', 'C', 'A', 'C', 'B']],
    2: [['eqAng', 'A', 'B', 'C', 'A', 'C', 'B']],
    3: [['eqSeg', 'A', 'B', 'A', 'C']],
    9: [['eqSeg', 'A', 'B', 'A', 'C']]
  },
  'thm:5': {},                                   /* the drawn figure is the impossible one */
  'thm:6': { 1: [['eqSeg', 'C', 'A', 'C', 'B']] },
  'thm:7': {
    1: [['circAt', 'cir:B', 'B'], ['onCirc', 'D', 'cir:B'], ['onCirc', 'E', 'cir:B'],
        ['eqSeg', 'B', 'D', 'B', 'E'], ['betw', 'B', 'D', 'A'], ['betw', 'B', 'E', 'C']],
    3: [['eqSeg', 'F', 'D', 'D', 'E'], ['eqSeg', 'F', 'E', 'D', 'E']],
    5: [['eqSeg', 'B', 'E', 'B', 'D']],
    6: [['eqSeg', 'F', 'E', 'F', 'D']],
    8: [['cong', 'F', 'B', 'D', 'F', 'B', 'E']],
    9: [['eqAng', 'D', 'B', 'F', 'F', 'B', 'E']]
  },
  'thm:8': {
    1: [['eqSeg', 'A', 'C', 'A', 'B'], ['eqSeg', 'B', 'C', 'A', 'B']],
    2: [['betw', 'C', 'D', 'C₂']],
    3: [['eqSeg', 'A', 'C', 'C', 'B']],
    4: [['eqAng', 'A', 'C', 'D', 'D', 'C', 'B']],
    6: [['cong', 'A', 'C', 'D', 'B', 'C', 'D']],
    7: [['eqSeg', 'A', 'D', 'D', 'B'], ['betw', 'A', 'D', 'B']]
  },
  'thm:9': {
    1: [['eqSeg', 'P', 'C', 'P', 'D'], ['onCirc', 'C', 'cir:P'], ['onCirc', 'D', 'cir:P'],
        ['betw', 'A', 'C', 'P'], ['betw', 'P', 'D', 'B']],
    2: [['eqSeg', 'R', 'C', 'C', 'D'], ['eqSeg', 'R', 'D', 'C', 'D']],
    4: [['eqSeg', 'P', 'D', 'P', 'C']],
    5: [['eqSeg', 'C', 'R', 'D', 'R']],
    7: [['cong', 'R', 'P', 'C', 'R', 'P', 'D']],
    8: [['eqAng', 'R', 'P', 'C', 'R', 'P', 'D']],
    9: [['rightAng', 'R', 'P', 'C'], ['rightAng', 'R', 'P', 'D']],
    10: [['rightAng', 'R', 'P', 'A'], ['rightAng', 'R', 'P', 'B']]
  },
  'thm:10': {
    2: [['circAt', 'cir:P', 'P'], ['onCirc', 'G', 'cir:P'], ['onCirc', 'E', 'cir:P']],
    4: [['eqSeg', 'G', 'H', 'H', 'E'], ['betw', 'G', 'H', 'E']],
    6: [['eqSeg', 'P', 'G', 'P', 'E']],
    7: [['eqSeg', 'H', 'G', 'H', 'E']],
    9: [['cong', 'P', 'H', 'G', 'P', 'H', 'E']],
    10: [['eqAng', 'P', 'H', 'G', 'P', 'H', 'E'], ['rightAng', 'P', 'H', 'G'], ['rightAng', 'P', 'H', 'E']],
    11: [['rightAng', 'P', 'H', 'A'], ['rightAng', 'P', 'H', 'B']]
  },
  'thm:11': {
    2: [['rightAng', 'P', 'B', 'C'], ['rightAng', 'P', 'B', 'D']],
    3: [['sum2R', 'P', 'B', 'C', 'P', 'B', 'D']],
    5: [['angEqSum', 'P', 'B', 'D', 'P', 'B', 'A', 'A', 'B', 'D']],
    7: [['sum2R', 'A', 'B', 'C', 'A', 'B', 'D']]
  },
  'thm:12': {
    1: [['sum2R', 'A', 'P', 'B', 'B', 'P', 'Ccol']],
    7: [['betw', 'A', 'P', 'Ccol'], ['sum2R', 'A', 'P', 'B', 'B', 'P', 'Ccol']]
  },
  'thm:13': {
    1: [['eqAng', 'A', 'P', 'C', 'B', 'P', 'D'], ['eqAng', 'C', 'P', 'B', 'D', 'P', 'A']],
    2: [['sum2R', 'A', 'P', 'C', 'C', 'P', 'B']],
    3: [['sum2R', 'B', 'P', 'D', 'C', 'P', 'B']],
    5: [['eqAng', 'A', 'P', 'C', 'B', 'P', 'D']],
    6: [['eqAng', 'C', 'P', 'B', 'D', 'P', 'A']]
  },
  'thm:14': {
    1: [['betw', 'B', 'C', 'D']],
    2: [['eqSeg', 'B', 'E', 'E', 'F'], ['eqSeg', 'A', 'E', 'E', 'C'], ['betw', 'B', 'E', 'F']],
    3: [['eqSeg', 'E', 'F', 'B', 'E'], ['eqSeg', 'E', 'A', 'E', 'C']],
    4: [['eqAng', 'A', 'E', 'B', 'C', 'E', 'F']],
    5: [['cong', 'A', 'E', 'B', 'C', 'E', 'F']],
    6: [['eqAng', 'B', 'A', 'C', 'E', 'C', 'F'], ['gtAng', 'A', 'C', 'D', 'E', 'C', 'F']],
    7: [['gtAng', 'A', 'C', 'D', 'B', 'A', 'C']],
    8: [['gtAng', 'A', 'C', 'D', 'A', 'B', 'C']]
  },
  'thm:15': {
    1: [['ltSeg', 'A', 'B', 'A', 'C']],
    2: [['eqSeg', 'A', 'D', 'A', 'B'], ['betw', 'A', 'D', 'C']],
    3: [['eqAng', 'A', 'B', 'D', 'A', 'D', 'B']],
    4: [['gtAng', 'A', 'D', 'B', 'A', 'C', 'B']],
    5: [['gtAng', 'A', 'B', 'D', 'A', 'C', 'B']],
    6: [['gtAng', 'A', 'B', 'C', 'A', 'B', 'D']],
    7: [['gtAng', 'A', 'B', 'C', 'A', 'C', 'B']]
  },
  'thm:16': {
    1: [['gtAng', 'A', 'B', 'C', 'A', 'C', 'B']],
    5: [['gtSeg', 'A', 'C', 'A', 'B']]
  },
  'thm:17': {
    1: [['gtSumSeg', 'B', 'A', 'A', 'C', 'B', 'C']],
    2: [['eqSeg', 'A', 'D', 'A', 'C'], ['betw', 'B', 'A', 'D']],
    3: [['gtAng', 'B', 'C', 'D', 'A', 'C', 'D'], ['eqAng', 'A', 'C', 'D', 'A', 'D', 'C'],
        ['gtAng', 'B', 'C', 'D', 'A', 'D', 'C']],
    4: [['gtSeg', 'B', 'D', 'B', 'C']],
    5: [['sumSeg', 'B', 'A', 'A', 'D', 'B', 'D'], ['gtSumSeg', 'B', 'A', 'A', 'C', 'B', 'C']]
  },
  'thm:18': {
    1: [['rightAng', 'P', 'L', 'R'], ['betw', 'A', 'L', 'B'], ['betw', 'A', 'R', 'B']],
    2: [['rightAng', 'P', 'L', 'R']],
    3: [['acute', 'P', 'R', 'L'], ['gtAng', 'P', 'L', 'R', 'P', 'R', 'L']],
    5: [['gtSeg', 'P', 'R', 'P', 'L']]
  },
  'thm:19': {
    1: [['eqSeg', 'D', 'A', 'x0', 'x1'], ['eqSeg', 'A', 'B', 'y0', 'y1'], ['eqSeg', 'B', 'F', 'z0', 'z1'],
        ['betw', 'D', 'A', 'B'], ['betw', 'A', 'B', 'F']],
    2: [['circAt', 'cir:A', 'A'], ['circR', 'cir:A', 'A', 'D']],
    3: [['circAt', 'cir:B', 'B'], ['circR', 'cir:B', 'B', 'F']],
    5: [['onCirc', 'C', 'cir:A'], ['onCirc', 'C', 'cir:B']],
    6: [['eqSeg', 'A', 'C', 'x0', 'x1'], ['eqSeg', 'A', 'B', 'y0', 'y1'], ['eqSeg', 'B', 'C', 'z0', 'z1']]
  },
  'thm:20': {
    2: [['eqSeg', 'P', 'T', 'X', 'B']],
    3: [['eqSeg', 'P', 'Z', 'X', 'A'], ['eqSeg', 'Z', 'T', 'A', 'B'],
        ['circAt', 'cir:P', 'P'], ['circR', 'cir:P', 'X', 'A'], ['circR', 'cir:T', 'A', 'B'],
        ['onCirc', 'Z', 'cir:P'], ['onCirc', 'Z', 'cir:T']],
    4: [['eqAng', 'Z', 'P', 'T', 'A', 'X', 'B']],
    5: [['eqAng', 'Z', 'P', 'T', 'A', 'X', 'B']]
  },
  'thm:21': {
    1: [['eqAng', 'B', 'A', 'C', 'E', 'D', 'F'], ['eqSeg', 'A', 'B', 'D', 'E'], ['eqAng', 'A', 'B', 'C', 'D', 'E', 'F']],
    6: [['cong', 'A', 'B', 'C', 'D', 'E', 'F'], ['eqArea', 'A', 'B', 'C', 'D', 'E', 'F']]
  },
  'thm:22': {
    1: [['eqAng', 'B', 'C', 'A', 'E', 'F', 'D'], ['eqAng', 'B', 'A', 'C', 'E', 'D', 'F'], ['eqSeg', 'A', 'B', 'D', 'E']],
    4: [['eqSeg', 'A', 'C', 'D', 'F']],
    5: [['cong', 'A', 'B', 'C', 'D', 'E', 'F']]
  },
  'thm:23': {
    1: [['eqAng', 'A', 'E', 'F', 'E', 'F', 'D']],
    5: [['para', 'A', 'B', 'C', 'D']]
  },
  'thm:24': {
    2: [['sum2R', 'F', 'E', 'B', 'E', 'F', 'D']],
    3: [['sum2R', 'F', 'E', 'B', 'A', 'E', 'F']],
    4: [['eqAng', 'E', 'F', 'D', 'A', 'E', 'F']],
    5: [['para', 'A', 'B', 'C', 'D']]
  },
  'thm:25': {
    1: [['para', 'A', 'B', 'C', 'D']],
    5: [['eqAng', 'A', 'G', 'H', 'G', 'H', 'D']],
    6: [['sum2R', 'H', 'G', 'B', 'G', 'H', 'D']]
  },
  'thm:26': {},                                  /* the figure has no named points */
  'thm:27': {
    2: [['eqAng', 'L', 'P', 'X', 'P', 'X', 'B']],
    3: [['para', 'L', 'L₂', 'A', 'B']]
  },
  'thm:28': {
    1: [['betw', 'B', 'C', 'X']],
    2: [['para', 'C', 'P', 'B', 'A']],
    4: [['eqAng', 'B', 'A', 'C', 'A', 'C', 'P']],
    5: [['eqAng', 'A', 'B', 'C', 'P', 'C', 'X']],
    6: [['angEqSum', 'A', 'C', 'X', 'A', 'C', 'P', 'P', 'C', 'X']],
    7: [['sum2R', 'A', 'C', 'B', 'A', 'C', 'X']]
  },
  'thm:29': {
    1: [['eqAng', 'B', 'A', 'C', 'E', 'D', 'F'], ['eqAng', 'C', 'B', 'A', 'F', 'E', 'D']],
    4: [['eqAng', 'A', 'C', 'B', 'D', 'F', 'E']]
  },
  'thm:30': {
    1: [['para', 'A', 'B', 'D', 'C'], ['eqSeg', 'A', 'B', 'D', 'C']],
    2: [['eqAng', 'A', 'B', 'D', 'B', 'D', 'C']],
    3: [['eqSeg', 'A', 'B', 'D', 'C']],
    4: [['cong', 'A', 'B', 'D', 'C', 'D', 'B']],
    5: [['eqAng', 'A', 'D', 'B', 'D', 'B', 'C'], ['para', 'A', 'D', 'B', 'C']],
    6: [['eqSeg', 'A', 'D', 'B', 'C'], ['para', 'A', 'D', 'B', 'C']]
  },
  'thm:31': {
    1: [['para', 'A', 'B', 'D', 'C'], ['para', 'A', 'D', 'B', 'C']],
    2: [['eqAng', 'B', 'A', 'C', 'D', 'C', 'A'], ['eqAng', 'B', 'C', 'A', 'D', 'A', 'C']],
    3: [['cong', 'A', 'B', 'C', 'C', 'D', 'A']],
    4: [['eqSeg', 'A', 'B', 'C', 'D'], ['eqSeg', 'A', 'D', 'B', 'C'], ['eqAng', 'D', 'A', 'B', 'B', 'C', 'D']],
    5: [['eqArea', 'A', 'B', 'C', 'C', 'D', 'A']]
  },
  'thm:32': {
    2: [['eqSeg', 'A', 'D', 'B', 'E'], ['eqSeg', 'C', 'F', 'B', 'E'], ['eqSeg', 'A', 'C', 'D', 'F']],
    3: [['eqSeg', 'A', 'B', 'D', 'E'], ['eqSeg', 'B', 'C', 'E', 'F'], ['cong', 'A', 'B', 'C', 'D', 'E', 'F']],
    4: [['eqQuad', 'A', 'B', 'E', 'D', 'C', 'B', 'E', 'F']]
  },
  'thm:33': {
    2: [['para', 'C', 'G', 'A', 'B']],
    3: [['eqQuad', 'A', 'B', 'L', 'C', 'A', 'B', 'G', 'K']],
    4: [['halfQuad', 'A', 'B', 'C', 'A', 'B', 'L', 'C'], ['halfQuad', 'A', 'B', 'G', 'A', 'B', 'G', 'K']],
    5: [['eqArea', 'A', 'B', 'C', 'A', 'B', 'G']]
  },
  'thm:34': {
    1: [['betw', 'A', 'K', 'C']],
    2: [['eqArea', 'A', 'R', 'K', 'A', 'K', 'P'], ['eqArea', 'K', 'Q', 'C', 'K', 'C', 'S'],
        ['eqArea', 'A', 'B', 'C', 'A', 'C', 'D']],
    3: [['eqQuad', 'R', 'B', 'Q', 'K', 'P', 'K', 'S', 'D']]
  },
  'thm:35': {
    1: [['rightAng', 'B', 'A', 'D'], ['eqSeg', 'A', 'D', 'A', 'B']],
    2: [['para', 'D', 'C', 'A', 'B'], ['para', 'B', 'C', 'A', 'D']],
    3: [['para', 'D', 'C', 'A', 'B'], ['para', 'B', 'C', 'A', 'D']],
    4: [['rightAng', 'A', 'B', 'C'], ['rightAng', 'B', 'C', 'D'], ['rightAng', 'C', 'D', 'A']],
    5: [['eqSeg', 'A', 'B', 'B', 'C'], ['eqSeg', 'A', 'B', 'C', 'D'], ['eqSeg', 'A', 'B', 'D', 'A']],
    6: [['rightAng', 'B', 'A', 'D'], ['eqSeg', 'A', 'B', 'B', 'C'], ['eqSeg', 'A', 'B', 'C', 'D'], ['eqSeg', 'A', 'B', 'D', 'A']]
  },
  'thm:36': {
    1: [['rightAng', 'B', 'A', 'C']],
    2: [['rightAng', 'A', 'L', 'D'], ['betw', 'D', 'L', 'E']],
    3: [['betw', 'G', 'A', 'C']],
    4: [['eqSeg', 'F', 'B', 'A', 'B'], ['eqSeg', 'B', 'C', 'B', 'D'],
        ['eqAng', 'F', 'B', 'C', 'A', 'B', 'D'], ['eqArea', 'F', 'B', 'C', 'A', 'B', 'D']],
    5: [['eqArea', 'F', 'B', 'C', 'A', 'B', 'D']],
    6: [['halfQuad', 'F', 'B', 'C', 'A', 'B', 'F', 'G']],
    7: [['halfQuad', 'A', 'B', 'D', 'B', 'M', 'L', 'D']],
    8: [['eqQuad', 'A', 'B', 'F', 'G', 'B', 'M', 'L', 'D'], ['eqQuad', 'A', 'C', 'K', 'H', 'M', 'C', 'E', 'L']],
    9: [['pythag', 'A', 'B', 'A', 'C', 'B', 'C'],
        ['sumQuad', 'A', 'B', 'F', 'G', 'A', 'C', 'K', 'H', 'B', 'C', 'E', 'D']]
  },
  'thm:37': {
    1: [['pythag', 'A', 'B', 'A', 'C', 'B', 'C']],
    2: [['eqSeg', 'D', 'E', 'A', 'B'], ['eqSeg', 'D', 'F', 'A', 'C'], ['rightAng', 'E', 'D', 'F']],
    3: [['pythag', 'D', 'E', 'D', 'F', 'E', 'F']],
    4: [['eqSeg', 'E', 'F', 'B', 'C']],
    5: [['cong', 'A', 'B', 'C', 'D', 'E', 'F']],
    6: [['rightAng', 'B', 'A', 'C']]
  }
};

function angleAt(p, v, q) {
  const a = sub(p, v), b = sub(q, v);
  const la = Math.hypot(a.x, a.y) || 1e-12, lb = Math.hypot(b.x, b.y) || 1e-12;
  let c = (a.x * b.x + a.y * b.y) / (la * lb);
  c = Math.max(-1, Math.min(1, c));
  return Math.acos(c);
}
const triArea = (a, b, c) => Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
const polyArea = ps => {
  let s = 0;
  for (let i = 0; i < ps.length; i++) { const p = ps[i], q = ps[(i + 1) % ps.length]; s += p.x * q.y - q.x * p.y; }
  return Math.abs(s) / 2;
};

function checkCtx() {
  let pts, objs;
  if (FS.alter && FS.mode === 'free' && FS.free[FS.id]) {
    pts = FS.free[FS.id].pts; objs = FS.free[FS.id].objs;
  } else {
    const fw = E.figFor(FS.id); if (!fw) return null;
    pts = fw.fig.pts; objs = fw.fig.objs;
  }
  /* tolerance scales with the figure */
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, any = false;
  for (const k in pts) { const p = pts[k]; if (!p) continue; any = true;
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const diag = any ? Math.hypot(x1 - x0, y1 - y0) : 200;
  return {
    P: n => pts[n] || null,
    circ: id => objs.find(o => o.kind === 'circle' && o.id === id) || null,
    d(a, b) { const p = this.P(a), q = this.P(b); return (p && q) ? dist(p, q) : null; },
    a3(p, v, q) { const A = this.P(p), Vv = this.P(v), B = this.P(q); return (A && Vv && B) ? angleAt(A, Vv, B) : null; },
    area(ns) { const ps = ns.map(n => this.P(n)); return ps.some(p => !p) ? null : polyArea(ps); },
    tol: Math.max(2, diag * 0.02),
    aTol: 0.038,           /* ≈ 2.2° */
    areaTol: Math.max(40, diag * diag * 0.012)
  };
}

const CLAIM = {
  eqSeg(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]);
    return u === null || v === null || Math.abs(u - v) <= x.tol; },
  /* comparisons are lenient: they flag only when the figure is clearly
     against them, never on a borderline case */
  ltSeg(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]);
    return u === null || v === null || u < v + x.tol * 0.4; },
  gtSeg(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]);
    return u === null || v === null || u > v - x.tol * 0.4; },
  gtAng(c, x) { const a = x.a3(c[1], c[2], c[3]), b = x.a3(c[4], c[5], c[6]);
    return a === null || b === null || a > b - x.aTol; },
  acute(c, x) { const a = x.a3(c[1], c[2], c[3]);
    return a === null || a < Math.PI / 2 + x.aTol; },
  rightAng(c, x) { const a = x.a3(c[1], c[2], c[3]);
    return a === null || Math.abs(a - Math.PI / 2) <= x.aTol; },
  sumSeg(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]), w = x.d(c[5], c[6]);
    return u === null || v === null || w === null || Math.abs(u + v - w) <= x.tol * 1.2; },
  gtSumSeg(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]), w = x.d(c[5], c[6]);
    return u === null || v === null || w === null || u + v > w - x.tol * 0.4; },
  sum2R(c, x) { const a = x.a3(c[1], c[2], c[3]), b = x.a3(c[4], c[5], c[6]);
    return a === null || b === null || Math.abs(a + b - Math.PI) <= x.aTol * 1.6; },
  angEqSum(c, x) { const a = x.a3(c[1], c[2], c[3]), b = x.a3(c[4], c[5], c[6]), d = x.a3(c[7], c[8], c[9]);
    return a === null || b === null || d === null || Math.abs(a - b - d) <= x.aTol * 1.6; },
  para(c, x) { const a = x.P(c[1]), b = x.P(c[2]), p = x.P(c[3]), q = x.P(c[4]);
    if (!a || !b || !p || !q) return true;
    const u = unit(sub(b, a)), v = unit(sub(q, p));
    return Math.abs(u.x * v.y - u.y * v.x) <= 0.055; },
  eqQuad(c, x) { const A1 = x.area(c.slice(1, 5)), A2 = x.area(c.slice(5, 9));
    return A1 === null || A2 === null || Math.abs(A1 - A2) <= x.areaTol * 1.4; },
  halfQuad(c, x) { const T = x.area(c.slice(1, 4)), Q = x.area(c.slice(4, 8));
    return T === null || Q === null || Math.abs(2 * T - Q) <= x.areaTol * 1.6; },
  sumQuad(c, x) { const A1 = x.area(c.slice(1, 5)), A2 = x.area(c.slice(5, 9)), A3 = x.area(c.slice(9, 13));
    return A1 === null || A2 === null || A3 === null || Math.abs(A1 + A2 - A3) <= x.areaTol * 2.2; },
  pythag(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[3], c[4]), w = x.d(c[5], c[6]);
    return u === null || v === null || w === null || Math.abs(Math.hypot(u, v) - w) <= x.tol; },
  betw(c, x) { const u = x.d(c[1], c[2]), v = x.d(c[2], c[3]), w = x.d(c[1], c[3]);
    return u === null || v === null || w === null || Math.abs(u + v - w) <= x.tol; },
  eqAng(c, x) { const p = [1, 2, 3].map(i => x.P(c[i])), q = [4, 5, 6].map(i => x.P(c[i]));
    if (p.some(z => !z) || q.some(z => !z)) return true;
    return Math.abs(angleAt(p[0], p[1], p[2]) - angleAt(q[0], q[1], q[2])) <= x.aTol; },
  circAt(c, x) { const o = x.circ(c[1]), p = x.P(c[2]);
    return !o || !p || dist(o.c, p) <= x.tol; },
  circR(c, x) { const o = x.circ(c[1]), u = x.d(c[2], c[3]);
    return !o || u === null || Math.abs(o.r - u) <= x.tol; },
  onCirc(c, x) { const p = x.P(c[1]), o = x.circ(c[2]);
    return !p || !o || Math.abs(dist(p, o.c) - o.r) <= x.tol; },
  cong(c, x) {
    return CLAIM.eqSeg(['', c[1], c[2], c[4], c[5]], x) &&
           CLAIM.eqSeg(['', c[2], c[3], c[5], c[6]], x) &&
           CLAIM.eqSeg(['', c[1], c[3], c[4], c[6]], x);
  },
  eqArea(c, x) { const p = [1, 2, 3].map(i => x.P(c[i])), q = [4, 5, 6].map(i => x.P(c[i]));
    if (p.some(z => !z) || q.some(z => !z)) return true;
    return Math.abs(triArea(p[0], p[1], p[2]) - triArea(q[0], q[1], q[2])) <= x.areaTol; }
};

function runChecks() {
  if (!FS.on) return;
  const lis = $$('#fsov ol.steps li');
  if (!lis.length) return;
  const spec = CHECKS[FS.id];
  const ctx = spec ? checkCtx() : null;
  let broken = 0;
  lis.forEach(li => {
    const s = +li.dataset.step;
    let ok = true;
    if (spec && ctx && spec[s]) ok = spec[s].every(cl => (CLAIM[cl[0]] || (() => true))(cl, ctx));
    li.classList.toggle('fs-broken', !ok);
    if (!ok) broken++;
  });
  const badge = $('#fs-badge');
  if (badge) {
    const modeTxt = !FS.alter ? 'viewing'
      : (FS.mode === 'preserve' ? 'altering — <b>proof preserved</b>' : 'altering — <b>free edit</b>');
    badge.innerHTML = modeTxt + (broken ? ` · <b style="color:var(--accent)">${broken} line${broken > 1 ? 's' : ''} broken</b>` : (FS.alter && FS.mode === 'free' ? ' · all lines hold' : ''));
  }
}

/* ============================================================
   Free-edit snapshot: a detached copy of the built figure whose
   shared endpoints stay shared, so connected geometry moves as
   one — but nothing is constrained.
   ============================================================ */
function makeSnapshot() {
  const src = E.figFor(FS.id).fig;
  const map = new Map();
  const cp = p => {
    if (!p || typeof p.x !== 'number') return p;
    if (!map.has(p)) { const q = V(p.x, p.y); if (p.name) q.name = p.name; map.set(p, q); }
    return map.get(p);
  };
  const objs = src.objs.map(o => {
    const n = Object.assign({}, o);
    ['at', 'a', 'b', 'c', 'v', 'p', 'q'].forEach(k => { if (n[k] && typeof n[k].x === 'number') n[k] = cp(o[k]); });
    if (o.pts) n.pts = o.pts.map(cp);
    return n;
  });
  const pts = {};
  map.forEach(q => { if (q.name && !(q.name in pts)) pts[q.name] = q; });
  const pseudo = { objs, alias: src.alias, pts, state: {}, free: [] };
  return { objs, pts, map, pseudo, pf: { fig: pseudo } };
}

/* ---------- coordinate mapping ---------- */
function svgPt(svg, cx, cy) {
  const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
function currentProj() {
  if (FS.alter && FS.mode === 'free' && FS.free[FS.id]) return FS.free[FS.id].pseudo._proj;
  const fw = E.figFor(FS.id); return fw && fw.fig._proj;
}
function toWorld(svg, cx, cy) {
  const proj = currentProj(); if (!proj) return null;
  const vp = mApply(mInv(FS.cam.m), svgPt(svg, cx, cy));
  return Scene.unproject(proj.inv(vp));
}

/* ---------- camera application ---------- */
function applyCam(svg) {
  if (!svg) return;
  let g = svg.querySelector('g.fs-camg');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'fs-camg');
    const kids = ['g.figbody', 'g.hitlayer'].map(s => svg.querySelector(s)).filter(Boolean);
    if (kids.length) svg.insertBefore(g, kids[0]);
    kids.forEach(k => g.appendChild(k));
  }
  g.setAttribute('transform', 'matrix(' + FS.cam.m.map(v => Math.round(v * 1e4) / 1e4).join(' ') + ')');
  syncHandles(svg);
  syncAxisPreview(svg);
}

/* ---------- draggable handles (preserve mode) ---------- */
function syncHandles(svg) {
  if (!svg) return;
  let g = svg.querySelector('g.fs-handles');
  const want = FS.alter && FS.mode === 'preserve';
  if (!want) { if (g) g.remove(); return; }
  const fw = E.figFor(FS.id); if (!fw || !fw.fig._proj) return;
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'fs-handles');
    svg.appendChild(g);
  }
  g.innerHTML = '';
  fw.fig.free.forEach(fr => {
    const sp = mApply(FS.cam.m, fw.fig._proj.P(fr.at));
    /* a generous invisible ring first, so fingers can find the handle */
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('cx', sp.x); hit.setAttribute('cy', sp.y); hit.setAttribute('r', 26);
    hit.setAttribute('data-free', fr.name);
    hit.setAttribute('class', 'fs-handle-hit');
    g.appendChild(hit);
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', sp.x); c.setAttribute('cy', sp.y); c.setAttribute('r', 10);
    c.setAttribute('data-free', fr.name);
    g.appendChild(c);
  });
}

/* which free point should a touched element move, in preserve mode? */
function preserveTargetFor(eid, svg, ev) {
  const fw = E.figFor(FS.id); if (!fw) return null;
  const freeNames = new Set(fw.fig.free.map(f => f.name));
  if (eid.startsWith('pt:')) {
    const n = eid.slice(3);
    return freeNames.has(n) ? n : null;
  }
  const ob = fw.fig.objs.find(o => o.id === eid);
  if (!ob) return null;
  const cand = [];
  const push = p => { if (p && p.name && freeNames.has(p.name)) cand.push(p); };
  if (ob.kind === 'seg' || ob.kind === 'line' || ob.kind === 'arrow' || ob.kind === 'tick') { push(ob.a); push(ob.b); }
  else if (ob.kind === 'circle') push(ob.c);
  else if (ob.kind === 'poly' || ob.kind === 'face') (ob.pts || []).forEach(push);
  else if (ob.kind === 'angle') { push(ob.v); push(ob.p); push(ob.q); }
  if (!cand.length) return null;
  const w = toWorld(svg, ev.clientX, ev.clientY);
  if (w && cand.length > 1) cand.sort((a, b) => dist(a, w) - dist(b, w));
  return cand[0].name;
}

/* ---------- axis-flip preview ---------- */
function syncAxisPreview(svg) {
  if (!svg) return;
  let ln = svg.querySelector('line.fs-axisline');
  const pick = FS.axisPick;
  const proj = currentProj();
  if (!pick || !pick.length || !proj) { if (ln) ln.remove(); return; }
  if (!ln) {
    ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('class', 'fs-axisline');
    svg.appendChild(ln);
  }
  const a = mApply(FS.cam.m, proj.P(pick[0]));
  const b = pick[1] ? mApply(FS.cam.m, proj.P(pick[1])) : a;
  ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
  ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
}

/* ---------- transforms ---------- */
const reflectAcross = (A, B) => p => {
  const u = unit(sub(B, A)), w = sub(p, A);
  const par = mul(u, dot(w, u)), pp = sub(w, par);
  return add(A, sub(par, pp));
};
function centroidOf(pts) {
  let n = 0, x = 0, y = 0;
  for (const k in pts) { const p = pts[k]; if (!p) continue; n++; x += p.x; y += p.y; }
  return n ? V(x / n, y / n) : V(0, 0);
}
function applyXform(fn) {
  if (FS.mode === 'preserve') {
    const fw = E.figFor(FS.id); if (!fw) return;
    const movable = fw.fig.free.filter(fr => fr.param !== 't' && !fr.noXform);
    if (!movable.length) {
      E.toast('This figure has no free choices to move — switch to free edit to transform it.');
      return;
    }
    movable.forEach(fr => {
      const p = fn(fr.at); fw.state[fr.name] = { x: p.x, y: p.y };
    });
    fw.rebuild();
    E.drawFig();
  } else {
    const snap = FS.free[FS.id]; if (!snap) return;
    snap.map.forEach(q => { const p = fn(q); q.x = p.x; q.y = p.y; });
    drawFree();
  }
}
function xformCentroid() {
  if (FS.mode === 'free' && FS.free[FS.id]) return centroidOf(FS.free[FS.id].pts);
  const fw = E.figFor(FS.id); if (!fw) return V(0, 0);
  /* rotate about the free points' own centroid: it turns with them, so
     repeated rotations can never make the figure drift toward the middle */
  const mv = fw.fig.free.filter(fr => fr.param !== 't' && !fr.noXform);
  if (!mv.length) return centroidOf(fw.fig.pts);
  let x = 0, y = 0;
  mv.forEach(fr => { x += fr.at.x; y += fr.at.y; });
  return V(x / mv.length, y / mv.length);
}

/* ============================================================
   Free-edit rendering & interaction
   ============================================================ */
function freeHl(snap) {
  const it = BY_ID[FS.id];
  if (UI.sel && UI.sel.length) {
    const hl = new Set(UI.sel);
    E.expandAliases(snap.pf, hl); E.expandAngleRays(snap.pf, hl); E.expandPolySides(snap.pf, hl);
    return hl;
  }
  if (UI.step !== null && UI.step > 0 && it.steps && it.steps[UI.step - 1]) {
    const ids = [];
    E.refsIn(it.steps[UI.step - 1].text, snap.pf).forEach(r => ids.push(...r.ids));
    if (ids.length) {
      const hl = new Set(ids);
      E.expandAngleRays(snap.pf, hl); E.expandPolySides(snap.pf, hl);
      return hl;
    }
  }
  return null;
}
function drawFree() {
  const wrap = document.getElementById('fs-figwrap'); if (!wrap) return;
  const snap = FS.free[FS.id] || (FS.free[FS.id] = makeSnapshot());
  wrap.innerHTML = G.render(snap.pseudo, {
    w: 1000, h: 700, upTo: Infinity, showScaffold: UI.scaffold, highlight: freeHl(snap),
    view: FS.view || undefined       /* frozen scale: edits change visible size */
  });
  const svg = wrap.firstChild;
  if (svg) svg.classList.add('free-drag');
  applyCam(svg);
  wireStage(svg);
  runChecks();
}

function freeTargetFor(el, svg, ev) {
  const snap = FS.free[FS.id]; if (!snap) return null;
  const eid = el.dataset.eid;
  const w = toWorld(svg, ev.clientX, ev.clientY); if (!w) return null;
  const proj = currentProj();
  const wpx = 14 / (proj.k * FS.cam.scale());        /* 14 screen px in world units */
  const ob = snap.objs.find(o => o.id === eid);
  if (eid.startsWith('pt:')) {
    const p = snap.pts[eid.slice(3)];
    return p ? { kind: 'pt', pts: [p] } : null;
  }
  if (!ob) return null;
  if (ob.kind === 'seg' || ob.kind === 'line' || ob.kind === 'arrow') {
    if (dist(w, ob.a) < wpx * 1.4) return { kind: 'pt', pts: [ob.a] };
    if (dist(w, ob.b) < wpx * 1.4) return { kind: 'pt', pts: [ob.b] };
    return { kind: 'move', pts: [ob.a, ob.b] };
  }
  if (ob.kind === 'circle') {
    if (ev.shiftKey || dist(w, ob.c) < wpx * 1.6) return { kind: 'pt', pts: [ob.c] };
    return { kind: 'radius', ob };
  }
  if (ob.kind === 'poly' || ob.kind === 'face') {
    for (const p of ob.pts) if (dist(w, p) < wpx * 1.4) return { kind: 'pt', pts: [p] };
    if (ev.shiftKey) return { kind: 'scale', pts: ob.pts.slice() };
    return { kind: 'move', pts: ob.pts.slice() };
  }
  return null;
}

/* ============================================================
   Stage interaction: pan / zoom always; axis picking; dragging
   (handles in preserve mode, anything in free mode).
   ============================================================ */
function wireStage(svg) {
  if (!svg || svg.__fsWired) return;
  svg.__fsWired = true;

  /* the click at the end of a drag must not toggle a selection */
  svg.addEventListener('click', ev => { if (FS.suppressClick) ev.stopPropagation(); }, true);

  svg.addEventListener('wheel', ev => {
    ev.preventDefault();
    const f = Math.exp(-ev.deltaY * 0.0016);
    FS.cam.zoomAt(svgPt(svg, ev.clientX, ev.clientY), f);
    applyCam(currentSvg());
  }, { passive: false });

  svg.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const stage = $('#fsov .fs-stage');

    /* a further finger during a camera gesture always joins the gesture */
    if (pts.size) { gestureAdd(ev); ev.preventDefault(); return; }

    /* placing a flip axis */
    if (FS.axisPick) {
      const w = toWorld(svg, ev.clientX, ev.clientY);
      if (w) {
        FS.axisPick.push(V(w.x, w.y));
        if (FS.axisPick.length === 2) {
          const [Aa, Bb] = FS.axisPick;
          FS.axisPick = null;
          if (stage) stage.classList.remove('axispick');
          if (dist(Aa, Bb) > 1e-6) applyXform(reflectAcross(Aa, Bb));
          setHint();
        } else { syncAxisPreview(svg); setHint('Now click the second point of the axis.'); }
      }
      ev.preventDefault(); return;
    }

    /* preserve-mode dragging (only with Alter on): a handle, or any element
       a free point governs — touching a line or circle moves its nearest
       free choice */
    if (FS.alter && FS.mode === 'preserve') {
      const hd = ev.target.closest && ev.target.closest('.fs-handles circle');
      const el = !hd && ev.target.closest ? ev.target.closest('[data-eid]') : null;
      const name = hd ? hd.dataset.free : (el ? preserveTargetFor(el.dataset.eid, svg, ev) : null);
      if (name) {
        if (hd) hd.classList.add('grabbing');
        startDrag(ev, (cx, cy) => {
          const s = currentSvg(); if (!s) return;
          const w = toWorld(s, cx, cy); if (!w) return;
          const fw = E.figFor(FS.id);
          fw.drag(name, w);
          E.drawFig();                  /* afterDraw re-applies camera + handles */
          runChecks();
        });
        ev.preventDefault(); return;
      }
    }

    /* free-mode element drag */
    if (FS.alter && FS.mode === 'free') {
      const el = ev.target.closest && ev.target.closest('[data-eid]');
      const tgt = el ? freeTargetFor(el, svg, ev) : null;
      if (tgt) {
        let last = toWorld(svg, ev.clientX, ev.clientY);
        const snap = FS.free[FS.id];
        const cen = tgt.kind === 'scale'
          ? (() => { let x = 0, y = 0; tgt.pts.forEach(p => { x += p.x; y += p.y; }); return V(x / tgt.pts.length, y / tgt.pts.length); })()
          : null;
        startDrag(ev, (cx, cy) => {
          const s = currentSvg(); if (!s) return;
          const w = toWorld(s, cx, cy); if (!w || !last) { last = w; return; }
          if (tgt.kind === 'pt' || tgt.kind === 'move') {
            const dx = w.x - last.x, dy = w.y - last.y;
            const seen = new Set();
            tgt.pts.forEach(p => { if (seen.has(p)) return; seen.add(p); p.x += dx; p.y += dy; });
          } else if (tgt.kind === 'radius') {
            tgt.ob.r = Math.max(4, dist(w, tgt.ob.c));
          } else if (tgt.kind === 'scale' && cen) {
            const r0 = dist(last, cen) || 1e-6, r1 = dist(w, cen);
            const f = Math.max(0.05, r1 / r0);
            const seen = new Set();
            tgt.pts.forEach(p => {
              if (seen.has(p)) return; seen.add(p);
              p.x = cen.x + (p.x - cen.x) * f; p.y = cen.y + (p.y - cen.y) * f;
            });
          }
          last = w;
          drawFree();
        });
        ev.preventDefault(); return;
      }
    }

    /* otherwise: hand the pointer to the camera-gesture engine */
    if (FS.editDrag) return;
    gestureAdd(ev);
    ev.preventDefault();
  });

  /* ---- camera gestures ----
     one finger: pan.  two fingers: pinch to zoom, twist to rotate (2-D),
     and slide to pan — all about the fingers' midpoint.  While a geometry
     drag is live (FS.editDrag) no gesture can start, so the frame is rock
     steady while a length or angle is being adjusted. */
  const pts = new Map();
  let pinch = null, gestureMoved = false;
  function gestureAdd(ev) {
    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* mouse w/o capture is fine */ }
    pts.set(ev.pointerId, svgPt(svg, ev.clientX, ev.clientY));
    if (pts.size === 2) {
      const [p1, p2] = [...pts.values()];
      pinch = { d: Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1,
                a: Math.atan2(p2.y - p1.y, p2.x - p1.x),
                mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2 };
    }
    const stage = $('#fsov .fs-stage');
    if (stage) stage.classList.add('panning');
  }
  svg.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId)) return;
    const prev = pts.get(ev.pointerId);
    const cur = svgPt(svg, ev.clientX, ev.clientY);
    pts.set(ev.pointerId, cur);
    if (Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) > 0.5) {
      gestureMoved = true; FS.suppressClick = true;
    }
    if (pts.size >= 2 && pinch) {
      const [p1, p2] = [...pts.values()];
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      FS.cam.zoomAt({ x: mx, y: my }, d / pinch.d);
      FS.cam.rotateAt({ x: mx, y: my }, a - pinch.a);
      FS.cam.pan(mx - pinch.mx, my - pinch.my);
      pinch = { d, a, mx, my };
      applyCam(svg);
    } else if (pts.size === 1) {
      FS.cam.pan(cur.x - prev.x, cur.y - prev.y);
      applyCam(svg);
    }
  });
  const gestureEnd = ev => {
    if (!pts.has(ev.pointerId)) return;
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) {
      const stage = $('#fsov .fs-stage');
      if (stage) stage.classList.remove('panning');
      if (gestureMoved) { setTimeout(() => { FS.suppressClick = false; }, 0); gestureMoved = false; }
    }
  };
  svg.addEventListener('pointerup', gestureEnd);
  svg.addEventListener('pointercancel', gestureEnd);
}
function currentSvg() { return $('#fs-figwrap svg'); }
function startDrag(ev, onMove, onUp) {
  let moved = false;
  const id = ev.pointerId;
  const x0 = ev.clientX, y0 = ev.clientY;
  FS.editDrag = true;                    /* zoom and rotation hold still */
  const mv = e => {
    if (id !== undefined && e.pointerId !== undefined && e.pointerId !== id) return;
    if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) > 3) moved = true;
    if (moved) onMove(e.clientX, e.clientY);
  };
  const up = e => {
    if (id !== undefined && e && e.pointerId !== undefined && e.pointerId !== id) return;
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    FS.editDrag = false;                 /* gestures may resume */
    if (moved) { FS.suppressClick = true; setTimeout(() => { FS.suppressClick = false; }, 0); }
    if (onUp) onUp();
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

/* ============================================================
   Overlay DOM
   ============================================================ */
function railStepsHtml(it, fw) {
  let h = '<ol class="steps">';
  (it.steps || []).forEach((s, i) => {
    const cites = (s.cites || []).map(c => `<span class="cite" data-cite="${c}">${esc(E.shortRef(c))}</span>`).join('');
    h += `<li data-step="${i + 1}"><span>${E.markup(s.text, fw)}</span>${cites ? `<span class="cites">${cites}</span>` : ''}</li>`;
  });
  h += `</ol><p class="qed">${it.kind === 'construction' ? 'Q.E.F.' : 'Q.E.D.'}</p>`;
  return h;
}
function buildOverlay() {
  const it = BY_ID[FS.id], fw = E.figFor(FS.id);
  const ov = document.createElement('div');
  ov.id = 'fsov';
  ov.innerHTML = `
  <div class="fs-rail">
    <div class="fs-railhead">
      <div class="kicker">${esc(E.kickerOf(it))}</div>
      <h3>${esc(E.titleOf(it))}</h3>
      <p class="fs-stmt">${E.markup(it.statement || '', fw)}</p>
    </div>
    <div class="fs-stepbar">
      <div class="ctlgrp">
        <button class="tbtn icon" id="fs-prev" title="Previous step (←)">‹</button>
        <button class="tbtn" id="fs-play" title="Play (space)">▶ Play</button>
        <button class="tbtn icon" id="fs-next" title="Next step (→)">›</button>
        <span class="stepchip" id="fs-stepchip"></span>
      </div>
      <span class="sp"></span>
      <div class="ctlgrp">
        <button class="tbtn" id="fs-speed" title="How fast the figure is drawn">${esc((E.SPEEDS.find(x => x.v === UI.speed) || E.SPEEDS[1]).label)}</button>
        ${fw && fw.fig.objs.some(o => o.role === 'scaffold')
          ? `<button class="tbtn tgl${UI.scaffold ? ' on' : ''}" id="fs-scaf" title="The circles and lines a compass needs, which the proof does not name"><span class="lbl-long">construction lines</span><span class="lbl-short">lines</span></button>` : ''}
        <button class="tbtn" id="fs-whole" title="Leave the animation and show the whole finished figure"><span class="lbl-long">whole figure</span><span class="lbl-short">whole</span></button>
        <button class="tbtn" id="fs-restore" title="Put the figure back to its original positions and proportions"><span class="lbl-long">⟲ original</span><span class="lbl-short">⟲</span></button>
      </div>
    </div>
    <div class="fs-railbody">${railStepsHtml(it, fw)}</div>
    <div class="fs-railfoot">
      <button class="tbtn fs-altbtn" id="fs-alterbtn">✎ <span class="lbl">Alter illustration</span></button>
      <div class="fs-altermenu" id="fs-altermenu">
        <div class="fs-modes">
          <label><input type="radio" name="fs-mode" value="preserve" checked> preserve the proof</label>
          <label><input type="radio" name="fs-mode" value="free"> free edit</label>
        </div>
        <div class="fs-xforms">
          <button class="tbtn" data-x="axis" title="Click two points to place the mirror axis">⤄ <span class="lbl">flip about an axis…</span></button>
          <button class="tbtn" data-x="reset" title="Put the diagram back the way it was">↩ <span class="lbl">reset diagram</span></button>
        </div>
        <div class="fs-hint" id="fs-modehint"></div>
      </div>
    </div>
  </div>
  <div class="fs-stage">
    <div id="fs-figwrap"></div>
    <div class="fs-badge" id="fs-badge">viewing</div>
    <div class="fs-viewbar">
      <button class="tbtn vb" id="fs-zin" title="Zoom in">＋</button>
      <button class="tbtn vb" id="fs-zout" title="Zoom out">－</button>
      <button class="tbtn vb" id="fs-rotl" title="Rotate the view counter-clockwise">⟲</button>
      <button class="tbtn vb" id="fs-rotr" title="Rotate the view clockwise">⟳</button>
      <button class="tbtn vb" id="fs-vreset" title="Recenter: undo pan, zoom and view rotation">recenter view</button>
      <button class="tbtn fs-viewtoggle" id="fs-viewtoggle" title="Show or hide the view controls">⚙</button>
      <button class="tbtn" id="fs-exit" title="Exit full screen (Esc)">✕ exit</button>
    </div>
    <button class="tbtn fs-railtoggle" id="fs-railtoggle" title="Show or hide the proof and the alter tools">☰ Proof &amp; alter tools</button>
  </div>`;
  document.body.appendChild(ov);
  setHint();
  /* phone: swipe the sheet down to drop it to the bottom bar; swipe the bar up to raise it */
  const rail = ov.querySelector('.fs-rail');
  rail.addEventListener('pointerdown', ev => {
    if (!(window.matchMedia && matchMedia('(max-width:900px)').matches)) return;
    if (ev.target.closest('.fs-railbody')) return;      /* that part scrolls */
    const sy = ev.clientY, sx = ev.clientX;
    const mv = e => {
      if (e.clientY - sy > 50 && Math.abs(e.clientX - sx) < 90) { ov.classList.remove('railopen'); fin(); }
    };
    const fin = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', fin);
  });
  const rt = ov.querySelector('#fs-railtoggle');
  rt.addEventListener('pointerdown', ev => {
    const sy = ev.clientY;
    const mv = e => { if (sy - e.clientY > 25) { ov.classList.add('railopen'); fin(); } };
    const fin = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', fin);
  });
}
function setHint(msg) {
  const el = $('#fs-modehint'); if (!el) return;
  if (msg) { el.textContent = msg; return; }
  if (!FS.alter) el.textContent = '';
  else if (FS.mode === 'preserve')
    el.textContent = 'Drag the round handles: those are the figure’s free choices. Everything constructed from them is redrawn exactly, so every line of the proof stays true — degenerate edits are simply not allowed.';
  else
    el.textContent = 'Drag any point, line, circle rim or triangle — nothing is constrained. Shift-drag scales a triangle, shift-drag moves a circle’s centre. Lines of the proof that stop being true are flagged, and recover when the figure satisfies them again.';
}

/* ---------- open / close ---------- */
function open(id) {
  if (FS.on) close();
  FS.on = true; FS.id = id; FS.alter = false; FS.mode = 'preserve';
  FS.cam = new Camera(); FS.axisPick = null;
  E.stopPlay();
  buildOverlay();
  primeView();
  E.drawFig();
  E.syncSteps();
  runChecks();
}
function close() {
  if (!FS.on) return;
  FS.on = false; FS.axisPick = null; FS.view = null;
  const ov = document.getElementById('fsov'); if (ov) ov.remove();
  E.stopPlay();
  E.drawFig();          /* back into the page's own figure box */
  E.syncSteps();
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  if (ev.target.closest && ev.target.closest('.fsx-cta')) { open(UI.id); return; }
  if (!FS.on) return;
  if (FS.suppressClick) return;
  const t = ev.target;
  if (t.closest('#fs-exit')) { close(); return; }
  if (t.closest('#fs-railtoggle')) { const ov = document.getElementById('fsov'); if (ov) ov.classList.toggle('railopen'); return; }
  if (t.closest('#fs-whole')) { E.stopPlay(); E.setStep(null); return; }
  if (t.closest('#fs-speed')) {
    const S = E.SPEEDS;
    const i = S.findIndex(x => x.v === UI.speed);
    const nx = S[(i + 1) % S.length];
    UI.speed = nx.v;
    const b1 = $('#fs-speed'); if (b1) b1.textContent = nx.label;
    const b2 = $('#b-speed'); if (b2) b2.textContent = nx.label;
    return;
  }
  if (t.closest('#fs-scaf')) {
    UI.scaffold = !UI.scaffold;
    ['fs-scaf', 'b-scaf'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.toggle('on', UI.scaffold);
    });
    primeView();                       /* the frozen fit depends on what is shown */
    E.drawFig(); runChecks();
    return;
  }
  if (t.closest('#fs-restore')) {
    const fw = E.figFor(FS.id); if (fw) fw.reset();
    delete FS.free[FS.id];               /* a fresh free-edit copy, too */
    primeView();
    E.drawFig(); runChecks();
    return;
  }
  if (t.closest('#fs-viewtoggle')) { const ov = document.getElementById('fsov'); if (ov) ov.classList.toggle('viewopen'); return; }
  if (t.closest('#fs-zin')) { zoomCenter(1.3); return; }
  if (t.closest('#fs-zout')) { zoomCenter(1 / 1.3); return; }
  if (t.closest('#fs-rotl')) { rotCenter(-15); return; }
  if (t.closest('#fs-rotr')) { rotCenter(15); return; }
  if (t.closest('#fs-vreset')) { FS.cam.reset(); applyCam(currentSvg()); return; }
  if (t.closest('#fs-prev')) { E.stopPlay(); E.setStep(UI.step === null ? 0 : UI.step - 1); return; }
  if (t.closest('#fs-next')) { E.stopPlay(); E.setStep(UI.step === null ? 1 : UI.step + 1); return; }
  if (t.closest('#fs-play')) { E.play(); return; }
  if (t.closest('#fs-alterbtn')) {
    FS.alter = !FS.alter;
    $('#fs-alterbtn').classList.toggle('on', FS.alter);
    $('#fs-altermenu').classList.toggle('open', FS.alter);
    if (!FS.alter && FS.axisPick) { FS.axisPick = null; $('#fsov .fs-stage').classList.remove('axispick'); }
    setHint();
    E.drawFig(); runChecks();
    return;
  }
  const xb = t.closest('.fs-xforms [data-x]');
  if (xb && FS.alter) { doXform(xb.dataset.x); return; }
  /* proof rail: step lines and name references */
  const li = t.closest('#fsov ol.steps li');
  if (li && !t.closest('.ref') && !t.closest('.cite')) {
    E.stopPlay();
    const s = +li.dataset.step;
    E.setStep(UI.step === s && !UI.sel ? null : s);
    return;
  }
  const rf = t.closest('#fsov .ref');
  if (rf) {
    const ids = (rf.dataset.eids || '').split(' ');
    const same = UI.sel && UI.sel.length === ids.length && UI.sel.every((x, i) => x === ids[i]);
    UI.sel = same ? null : ids;
    E.drawFig(); E.litText();
    return;
  }
});
function zoomCenter(f) {
  const svg = currentSvg(); if (!svg) return;
  const vb = svg.viewBox.baseVal;
  FS.cam.zoomAt({ x: vb.width / 2, y: vb.height / 2 }, f);
  applyCam(svg);
}
function rotCenter(deg) {
  const svg = currentSvg(); if (!svg) return;
  const vb = svg.viewBox.baseVal;
  FS.cam.rotateAt({ x: vb.width / 2, y: vb.height / 2 }, deg * Math.PI / 180);
  applyCam(svg);
}
function doXform(x) {
  const stage = $('#fsov .fs-stage');
  if (x === 'axis') {
    FS.axisPick = [];
    if (stage) stage.classList.add('axispick');
    setHint('Click two points on the figure to place the mirror axis.');
    return;
  }
  if (x === 'reset') {
    if (FS.mode === 'preserve') { const fw = E.figFor(FS.id); fw.reset(); primeView(); E.drawFig(); runChecks(); }
    else { delete FS.free[FS.id]; drawFree(); }
    return;
  }
  const c = xformCentroid();
  const th = 15 * Math.PI / 180;
  if (x === 'rotl') applyXform(p => G.rotAbout(p, c, th));
  else if (x === 'rotr') applyXform(p => G.rotAbout(p, c, -th));
  else if (x === 'fliph') applyXform(p => V(2 * c.x - p.x, p.y));
  else if (x === 'flipv') applyXform(p => V(p.x, 2 * c.y - p.y));
}

document.addEventListener('keydown', ev => {
  if (!FS.on) return;
  if (ev.target && ev.target.tagName === 'INPUT' && ev.target.type !== 'radio') return;
  if (ev.key === 'Escape') {
    ev.preventDefault(); ev.stopPropagation();
    if (FS.axisPick) {
      FS.axisPick = null;
      const st = $('#fsov .fs-stage'); if (st) st.classList.remove('axispick');
      syncAxisPreview(currentSvg()); setHint();
    } else close();
    return;
  }
  if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); E.stopPlay(); E.setStep(UI.step === null ? 1 : UI.step + 1); }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); E.stopPlay(); E.setStep(UI.step === null ? 0 : UI.step - 1); }
  else if (ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); E.play(); }
}, true);

document.addEventListener('change', ev => {
  if (!FS.on) return;
  const r = ev.target;
  if (r && r.name === 'fs-mode') {
    FS.mode = r.value;
    if (FS.axisPick) { FS.axisPick = null; $('#fsov .fs-stage').classList.remove('axispick'); }
    setHint();
    E.drawFig(); runChecks();
  }
});

/* ---------- public surface ---------- */
window.FSX = {
  get active() { return FS.on; },
  lockedView() { return FS.view || undefined; },
  open, close,
  Scene, Camera,                          /* scaffolding for later (3D) books */
  afterDraw(svg, fig) {
    if (!FS.on) return;
    if (FS.alter && FS.mode === 'free') { drawFree(); return; }
    applyCam(svg);
    wireStage(svg);
    runChecks();
  },
  leaveTheorem(id) {
    delete FS.free[id];
    if (FS.on && FS.id === id) close();
  },
  /* introspection (tests, tooling): the free-edit snapshot and a re-check */
  freeSnapshot(id) { return FS.free[id] || null; },
  recheck() { if (FS.on) { if (FS.alter && FS.mode === 'free') drawFree(); else runChecks(); } }
};
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
