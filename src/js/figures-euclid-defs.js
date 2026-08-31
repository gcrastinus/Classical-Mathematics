/* ============================================================
   Euclid Book I definition figures (Elements shelf).
   Joyce/Heiberg/classical: no picture for point, surface, plane,
   boundary (1, 3–7, 13–14). A line for Def. 2; then angles,
   the circle, the named polygons, and parallels.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, ang, pol, rotAbout, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}

/* Def. 2 — a line (breadthless length) */
FIGS['b1:def:2'] = {
  build(b) {
    const A = b.at('A', V(-110, 8), { dir: [-1, 0] });
    const B = b.at('B', V(110, 8), { dir: [1, 0] });
    b.seg(A, B);
    b.text('a line: breadthless length', V(0, -28), { anchor: 'middle', size: 13 });
  }
};

/* Def. 8 — plane angle (two lines meeting, not in a straight line) */
FIGS['b1:def:8'] = {
  build(b) {
    const B0 = b.at('B', V(-10, -20), { dir: [0, -1] });
    const A = b.at('A', V(-70, 70), { dir: [-0.6, 1] });
    const C = b.at('C', V(90, 10), { dir: [1, 0] });
    b.seg(B0, A); b.seg(B0, C);
    b.ang(A, B0, C, { r: 28, id: 'ang:ABC' });
    b.text('the inclination of BA and BC at B', V(10, -48), { anchor: 'middle', size: 13 });
  }
};

/* Def. 9 — rectilinear angle (the containing lines are straight) */
FIGS['b1:def:9'] = {
  build(b) {
    const E = b.at('E', V(-8, -22), { dir: [0, -1] });
    const D = b.at('D', V(-50, 72), { dir: [-0.5, 1] });
    const F = b.at('F', V(88, -8), { dir: [1, 0] });
    b.seg(E, D); b.seg(E, F);
    b.ang(D, E, F, { r: 28, id: 'ang:DEF' });
    b.text('a rectilinear angle: the lines are straight', V(12, -50), { anchor: 'middle', size: 13 });
  }
};

/* Def. 10 — right angle and perpendicular */
FIGS['b1:def:10'] = {
  build(b) {
    const C = b.at('C', V(-100, 0), { dir: [-1, 0] });
    const D = b.at('D', V(100, 0), { dir: [1, 0] });
    const B0 = b.at('B', V(0, 0), { dir: [0, -1] });
    const A = b.at('A', V(0, 96), { dir: [0, 1] });
    b.seg(C, D); b.seg(B0, A);
    b.ang(C, B0, A, { square: true, r: 22, id: 'ang:CBA' });
    b.ang(A, B0, D, { square: true, r: 22, id: 'ang:ABD' });
    b.text('the adjacent angles are equal: each is right; AB ⊥ CD', V(0, -28), { anchor: 'middle', size: 13 });
  }
};

/* Defs. 11 & 12 — obtuse and acute (Joyce puts them on one plate) */
function obtuseAcute(b) {
  const C = b.at('C', V(-110, 0), { dir: [-1, 0] });
  const D = b.at('D', V(110, 0), { dir: [1, 0] });
  const B0 = b.at('B', V(0, 0), { dir: [0, -1] });
  const A = b.at('A', V(0, 96), { dir: [0, 1] });
  const E = b.at('E', pol(V(0, 0), 96, 48 * DEG), { dir: [0.7, 0.7] });
  b.seg(C, D); b.seg(B0, A); b.seg(B0, E);
  b.ang(C, B0, A, { square: true, r: 18 });
  b.ang(A, B0, E, { r: 36, id: 'ang:ABE' });
  b.ang(E, B0, D, { r: 52, id: 'ang:EBD' });
  b.text('∠ABE is acute (less than a right) · ∠EBD is obtuse (greater)', V(0, -28),
    { anchor: 'middle', size: 12.5 });
}
FIGS['b1:def:11'] = { build: obtuseAcute };
FIGS['b1:def:12'] = { build: obtuseAcute };

/* Postulates 1–3 — the three constructions Euclid actually draws.
   Postulates 4–5 and the common notions are not classically figured. */
FIGS['b1:post:1'] = {
  build(b) {
    const A = b.pt('A', -80, 0, { dir: [-1, 0] }), B = b.pt('B', 80, 0, { dir: [1, 0] });
    b.seg(A, B);
    b.text('to draw a straight line from any point to any point', mid(A, B),
      { dy: -22, anchor: 'middle', size: 13 });
  }
};
FIGS['b1:post:2'] = {
  build(b) {
    const A = b.pt('A', -100, 0, { dir: [-1, 0] }), B = b.pt('B', 20, 0, { dir: [0, -1] });
    b.seg(A, B);
    const C = b.at('C', add(B, mul(unit(sub(B, A)), 84)), { dir: [0, 1] });
    b.seg(B, C, { dash: '6 4', id: 'ext' });
    b.arrowSeg(C, add(C, mul(unit(sub(B, A)), 26)), { id: 'arr' });
    b.text('to produce a finite straight line continuously in a straight line', V(-8, -28),
      { anchor: 'middle', size: 13 });
  }
};
FIGS['b1:post:3'] = {
  build(b) {
    const A = b.pt('A', 0, 0, { dir: [0.7, -0.7] });
    const B = b.pt('B', -60, 60, { dir: [-0.7, 0.7] });
    b.circle(A, B, { id: 'cir:A' });
    b.seg(A, B, { name: 'AB' });
    b.text('to describe a circle with any center and radius', V(0, -104),
      { anchor: 'middle', size: 13 });
  }
};

/* Defs. 15–21, 22 (quadrilaterals), 23 (parallels): same pictures as the
   course, which already follow the classical plates. */
[
  [15, 'def:15'], [16, 'def:16'], [17, 'def:17'], [18, 'def:18'],
  [19, 'def:19'], [20, 'def:20'], [21, 'def:21'],
  [22, 'def:23'],  /* Euclid 22 = named quadrilaterals = Augros 23 */
  [23, 'def:22']   /* Euclid 23 = parallels = Augros 22 */
].forEach(([n, src]) => {
  if (FIGS[src]) FIGS['b1:def:' + n] = FIGS[src];
});

})(typeof window !== 'undefined' ? window : globalThis);
