/* ============================================================
   Euclid Book II figures (Elements shelf). Rectangles, squares,
   gnomons — the classical plates for I.1–14 and the two defs.
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
function sq(P, Q, sign) {
  const n = mul(unit(perp(sub(Q, P))), dist(P, Q) * (sign || 1));
  return [P, Q, add(Q, n), add(P, n)];
}
function rectOn(P, Q, h) {
  const n = mul(unit(perp(sub(Q, P))), h);
  return [P, Q, add(Q, n), add(P, n)];
}
function drawPoly(b, name, pts, o) {
  o = o || {};
  if (o.shade !== undefined) b.face(pts, { shade: o.shade, id: 'face:' + name, cls: o.cls });
  b.poly(name, pts, { fill: false, id: 'poly:' + name, cls: o.cls, step: o.step });
  (o.segs !== false) && pts.forEach((p, i) => b.seg(p, pts[(i + 1) % pts.length], { id: 's:' + name + i, step: o.step }));
}

/* Def. 1 — a rectangle contained by two adjacent sides */
FIGS['b2:def:1'] = {
  build(b) {
    const D = b.at('D', V(-70, 50), { dir: [-1, 0.4] });
    const E = b.at('E', V(-70, -50), { dir: [-1, -0.4] });
    const F = b.at('F', V(70, -50), { dir: [1, -0.4] });
    const C = b.at('C', V(70, 50), { dir: [1, 0.4] });
    b.face([D, C, F, E], { shade: 0.16, id: 'face:R' });
    b.seg(D, E, { cls: 'accent', w: 2.4, id: 'seg:DE' });
    b.seg(E, F, { cls: 'accent', w: 2.4, id: 'seg:EF' });
    b.seg(F, C); b.seg(C, D);
    b.ang(D, E, F, { square: true, r: 16 });
    b.text('the rectangle contained by DE and EF', V(0, -78), { anchor: 'middle', size: 13 });
  }
};

/* Def. 2 — gnomon: a parallelogram about the diagonal plus two complements */
FIGS['b2:def:2'] = {
  build(b) {
    const A = b.at('A', V(-90, -55), { dir: [-1, -0.3] });
    const B = b.at('B', V(90, -55), { dir: [1, -0.3] });
    const C = b.at('C', V(110, 55), { dir: [1, 0.5] });
    const D = b.at('D', V(-70, 55), { dir: [-1, 0.5] });
    const G = mid(A, C);
    const H = b.at('H', lerp(A, B, 0.42), { dir: [0, -1] });
    const F = b.at('F', lerp(A, D, 0.42), { dir: [-1, 0] });
    const K = add(H, sub(F, A));
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    b.seg(A, C, { dash: '5 4', id: 'diag' });
    b.face([F, K, B, A], { shade: 0.22, id: 'gnomon' });
    b.seg(F, K); b.seg(K, H); b.seg(H, B);
    b.seg(F, A); b.seg(K, add(K, sub(C, A)));
    b.text('gnomon: the L about the diagonal', V(10, -82), { anchor: 'middle', size: 13 });
  }
};

/* II.1 — A × BC = A×BD + A×DE + A×EC */
FIGS['b2:prop:1'] = {
  build(b) {
    const B0 = b.at('B', V(-20, -40), { dir: [-0.4, -1] });
    const C = b.at('C', V(160, -40), { dir: [1, -0.3], clamp: minDistFrom(B0, 80) });
    const D = b.at('D', lerp(B0, C, 0.33), { dir: [0, -1] });
    const E = b.at('E', lerp(B0, C, 0.66), { dir: [0, -1] });
    const h = 78;
    const n = mul(unit(perp(sub(C, B0))), h);
    const G = b.at('G', add(B0, n), { dir: [-0.6, 1] });
    const H = b.at('H', add(C, n), { dir: [0.6, 1] });
    const K = b.at('K', add(D, n), { show: true, dir: [0, 1] });
    const L = b.at('L', add(E, n), { show: true, dir: [0, 1] });
    const A1 = b.at('A', V(-110, -40), { dir: [-1, 0] });
    const Ap = b.at('A′', V(-110, 38), { dir: [-1, 0.2] });
    b.seg(A1, Ap);
    b.seg(B0, C); b.seg(B0, G); b.seg(G, H); b.seg(H, C);
    b.seg(D, K); b.seg(E, L);
    b.face([B0, D, K, G], { shade: 0.22 });
    b.face([D, E, L, K], { shade: 0.14 });
    b.face([E, C, H, L], { shade: 0.08 });
    b.ang(C, B0, G, { square: true, r: 14 });
    b.text('A', mid(A1, Ap), { dx: -16, size: 14, italic: true });
  }
};

/* II.2 — AB×AC + AB×CB = square on AB */
FIGS['b2:prop:2'] = {
  build(b) {
    const A = b.at('A', V(-80, -50), { dir: [-1, -0.3] });
    const B = b.at('B', V(80, -50), { dir: [1, -0.3], clamp: minDistFrom(A, 60) });
    const C = b.at('C', lerp(A, B, 0.38), { dir: [0, -1] });
    const s = sq(A, B, 1);
    const D = b.at('D', s[3], { dir: [-1, 0.5] });
    const E = b.at('E', s[2], { dir: [1, 0.5] });
    const F = b.at('F', add(C, sub(D, A)), { dir: [0, 1] });
    b.seg(A, B); b.seg(B, E); b.seg(E, D); b.seg(D, A);
    b.seg(C, F);
    b.face([A, C, F, D], { shade: 0.2 });
    b.face([C, B, E, F], { shade: 0.1 });
    b.ang(B, A, D, { square: true, r: 14 });
  }
};

/* II.3 — AB×BC = AC×CB + square on BC */
FIGS['b2:prop:3'] = {
  build(b) {
    const A = b.at('A', V(-110, -40), { dir: [-1, -0.3] });
    const B = b.at('B', V(90, -40), { dir: [1, -0.3], clamp: minDistFrom(A, 80) });
    const C = b.at('C', lerp(A, B, 0.62), { dir: [0, -1] });
    const s = sq(C, B, 1);
    const D = b.at('D', s[3], { dir: [-0.3, 1] });
    const E = b.at('E', s[2], { dir: [1, 0.4] });
    const F = b.at('F', add(A, sub(D, C)), { dir: [-0.6, 1] });
    b.seg(A, B); b.seg(C, D); b.seg(D, E); b.seg(E, B);
    b.seg(D, F); b.seg(A, F);
    b.face([C, B, E, D], { shade: 0.2, id: 'sq:BC' });
    b.face([A, C, D, F], { shade: 0.1, id: 'rect:AC' });
    b.ang(B, C, D, { square: true, r: 14 });
  }
};

/* II.4 — (AC+CB)² = AC² + CB² + 2·AC·CB */
FIGS['b2:prop:4'] = {
  build(b) {
    const A = b.at('A', V(-90, -70), { dir: [-1, -0.3] });
    const B = b.at('B', V(90, -70), { dir: [1, -0.3], clamp: minDistFrom(A, 70) });
    const C = b.at('C', lerp(A, B, 0.4), { dir: [0, -1] });
    const s = sq(A, B, 1);
    const D = b.at('D', s[3], { dir: [-1, 0.5] });
    const E = b.at('E', s[2], { dir: [1, 0.5] });
    const u = unit(sub(B, A)), n = unit(perp(sub(B, A)));
    const ac = dist(A, C), cb = dist(C, B);
    const H = b.at('H', add(C, mul(n, ac)), { dir: [0.4, 0.8] });
    const G = b.at('G', add(C, mul(n, dist(A, B))), { dir: [0, 1] });
    const K = b.at('K', add(B, mul(n, cb)), { dir: [1, 0.3] });
    b.seg(A, B); b.seg(B, E); b.seg(E, D); b.seg(D, A);
    b.seg(A, E, { dash: '4 4', id: 'diag', role: 'scaffold' });
    b.seg(C, G); b.seg(add(D, mul(u, ac)), add(E, mul(u, -cb)));
    b.face([C, B, K, H], { shade: 0.22, id: 'sq:CB' });
    b.face([A, add(A, mul(n, ac)), H, C], { shade: 0.1, id: 'rect' });
    b.ang(B, A, D, { square: true, r: 14 });
  }
};

/* II.5 — equal and unequal cuts */
FIGS['b2:prop:5'] = {
  build(b) {
    const A = b.at('A', V(-110, -40), { dir: [-1, -0.3] });
    const B = b.at('B', V(110, -40), { dir: [1, -0.3], clamp: minDistFrom(A, 90) });
    const C = b.at('C', mid(A, B), { dir: [0, -1] });
    const D = b.at('D', lerp(A, B, 0.72), { dir: [0, -1] });
    const h = dist(A, C);
    const n = mul(unit(perp(sub(B, A))), h);
    const F = b.at('F', add(A, n), { dir: [-0.6, 1] });
    const G = b.at('G', add(C, n), { dir: [0, 1] });
    const H = b.at('H', add(B, n), { dir: [0.6, 1] });
    const K = b.at('K', add(D, n), { dir: [0.3, 1] });
    b.seg(A, B); b.seg(A, F); b.seg(F, H); b.seg(H, B);
    b.seg(C, G); b.seg(D, K);
    b.face([C, D, K, G], { shade: 0.2 });
    b.face([D, B, H, K], { shade: 0.08 });
    b.ang(B, A, F, { square: true, r: 14 });
  }
};

/* II.6 — bisected and produced */
FIGS['b2:prop:6'] = {
  build(b) {
    const A = b.at('A', V(-80, -40), { dir: [-1, -0.3] });
    const B = b.at('B', V(40, -40), { dir: [0.4, -1], clamp: minDistFrom(A, 50) });
    const C = b.at('C', mid(A, B), { dir: [0, -1] });
    const D = b.at('D', V(110, -40), { dir: [1, -0.3], clamp: minDistFrom(B, 30) });
    const h = dist(A, C);
    const n = mul(unit(perp(sub(B, A))), h);
    const F = b.at('F', add(A, n), { dir: [-0.5, 1] });
    const G = b.at('G', add(C, n), { dir: [0, 1] });
    const H = b.at('H', add(B, n), { dir: [0.2, 1] });
    const K = b.at('K', add(D, n), { dir: [0.7, 1] });
    b.seg(A, D); b.seg(A, F); b.seg(F, K); b.seg(K, D);
    b.seg(C, G); b.seg(B, H);
    b.face([B, D, K, H], { shade: 0.18 });
    b.face([C, B, H, G], { shade: 0.08 });
    b.ang(B, A, F, { square: true, r: 14 });
  }
};

/* II.7 */
FIGS['b2:prop:7'] = {
  build(b) {
    const A = b.at('A', V(-90, -55), { dir: [-1, -0.3] });
    const B = b.at('B', V(90, -55), { dir: [1, -0.3], clamp: minDistFrom(A, 70) });
    const C = b.at('C', lerp(A, B, 0.38), { dir: [0, -1] });
    const s = sq(A, B, 1);
    const D = b.at('D', s[3], { dir: [-1, 0.5] });
    const E = b.at('E', s[2], { dir: [1, 0.5] });
    const n = unit(perp(sub(B, A)));
    const F = b.at('F', add(C, mul(n, dist(A, B))), { dir: [0, 1] });
    b.seg(A, B); b.seg(B, E); b.seg(E, D); b.seg(D, A);
    b.seg(C, F);
    b.face([A, C, F, D], { shade: 0.18 });
    b.face([C, B, E, F], { shade: 0.08 });
    b.ang(B, A, D, { square: true, r: 14 });
  }
};

/* II.8 */
FIGS['b2:prop:8'] = {
  build(b) {
    const A = b.at('A', V(-100, -50), { dir: [-1, -0.3] });
    const B = b.at('B', V(60, -50), { dir: [0.5, -1], clamp: minDistFrom(A, 70) });
    const C = b.at('C', lerp(A, B, 0.55), { dir: [0, -1] });
    const s = sq(A, B, 1);
    const D = b.at('D', s[3], { dir: [-1, 0.5] });
    const E = b.at('E', s[2], { dir: [1, 0.4] });
    const n = unit(perp(sub(B, A)));
    const G = b.at('G', add(C, mul(n, dist(A, B))), { dir: [0, 1] });
    b.seg(A, B); b.seg(B, E); b.seg(E, D); b.seg(D, A);
    b.seg(C, G);
    b.face([A, C, G, D], { shade: 0.16 });
    b.face([C, B, E, G], { shade: 0.08 });
    b.ang(B, A, D, { square: true, r: 14 });
  }
};

/* II.9 */
FIGS['b2:prop:9'] = {
  build(b) {
    const A = b.at('A', V(-100, 0), { dir: [-1, 0] });
    const B = b.at('B', V(100, 0), { dir: [1, 0], clamp: minDistFrom(A, 80) });
    const C = b.at('C', mid(A, B), { dir: [0, -1] });
    const D = b.at('D', lerp(A, B, 0.7), { dir: [0, -1] });
    const s1 = sq(A, D, 1);
    const s2 = sq(D, B, 1);
    b.seg(A, B);
    drawPoly(b, 'AD', s1, { shade: 0.16, segs: true });
    drawPoly(b, 'DB', s2, { shade: 0.08, segs: true });
    b.ang(B, A, s1[3], { square: true, r: 12 });
  }
};

/* II.10 */
FIGS['b2:prop:10'] = {
  build(b) {
    const A = b.at('A', V(-80, 0), { dir: [-1, 0] });
    const B = b.at('B', V(40, 0), { dir: [0.3, -1], clamp: minDistFrom(A, 50) });
    const C = b.at('C', mid(A, B), { dir: [0, -1] });
    const D = b.at('D', V(110, 0), { dir: [1, 0], clamp: minDistFrom(B, 30) });
    const s1 = sq(A, D, 1);
    const s2 = sq(B, D, -1);
    b.seg(A, D);
    drawPoly(b, 'AD', s1, { shade: 0.14, segs: true });
    drawPoly(b, 'BD', s2, { shade: 0.08, segs: true });
  }
};

/* II.11 — cut AB so rectangle of whole and one part = square on the other */
FIGS['b2:prop:11'] = {
  build(b) {
    const A = b.at('A', V(-70, -40), { dir: [-1, -0.3] });
    const B = b.at('B', V(70, -40), { dir: [1, -0.3], clamp: minDistFrom(A, 60) });
    const s = sq(A, B, 1);
    const C = b.at('C', s[3], { dir: [-1, 0.5] });
    const D = b.at('D', s[2], { dir: [1, 0.5] });
    const E = b.at('E', mid(A, C), { dir: [-1, 0] });
    const H = b.at('H', lerp(A, B, 0.38), { dir: [0, -1] });
    b.seg(A, B); b.seg(B, D); b.seg(D, C); b.seg(C, A);
    b.seg(A, D, { dash: '4 4', id: 'diag', role: 'scaffold' });
    b.seg(E, B, { dash: '4 4', id: 'EB', role: 'scaffold' });
    const n = unit(perp(sub(B, A)));
    const K = b.at('K', add(H, mul(n, dist(A, H))), { dir: [0.2, 1] });
    b.seg(H, K); b.seg(K, add(A, mul(n, dist(A, H))));
    b.face([A, H, K, add(A, mul(n, dist(A, H)))], { shade: 0.18 });
    b.ang(B, A, C, { square: true, r: 14 });
  }
};

/* II.12 — obtuse triangle, squares on the sides */
FIGS['b2:prop:12'] = {
  build(b) {
    const B0 = b.at('B', V(-40, -30), { dir: [0, -1] });
    const C = b.at('C', V(90, -30), { dir: [1, -0.3], clamp: minDistFrom(B0, 50) });
    const A = b.at('A', V(-90, 70), { dir: [-0.7, 1], clamp: minDistFrom(B0, 40) });
    const F = b.at('F', add(B0, mul(unit(sub(B0, C)), dist(B0, A) * 0.35)), { dir: [-1, 0] });
    b.seg(A, B0); b.seg(B0, C); b.seg(C, A);
    b.seg(A, F, { dash: '5 4', id: 'alt' });
    b.ang(A, B0, C, { r: 22, id: 'obtuse' });
    const s = sq(A, C, 1);
    b.seg(s[1], s[2], { id: 'sq1' }); b.seg(s[2], s[3], { id: 'sq2' }); b.seg(s[3], s[0], { id: 'sq3' });
  }
};

/* II.13 — acute triangle */
FIGS['b2:prop:13'] = {
  build(b) {
    const A = b.at('A', V(-70, 70), { dir: [-0.5, 1] });
    const B0 = b.at('B', V(-50, -40), { dir: [-0.4, -1] });
    const C = b.at('C', V(80, -40), { dir: [1, -0.3], clamp: minDistFrom(B0, 50) });
    const D = b.at('D', lerp(B0, C, 0.35), { dir: [0, -1] });
    b.seg(A, B0); b.seg(B0, C); b.seg(C, A);
    b.seg(A, D, { dash: '5 4', id: 'perp' });
    b.ang(A, D, C, { square: true, r: 12 });
    const s = sq(A, C, 1);
    b.seg(s[1], s[2]); b.seg(s[2], s[3]); b.seg(s[3], s[0]);
  }
};

/* II.14 — square a rectangle via the geometric mean */
FIGS['b2:prop:14'] = {
  build(b) {
    const A = b.at('A', V(-90, -20), { dir: [-1, -0.2] });
    const B = b.at('B', V(40, -20), { dir: [0.3, -1], clamp: minDistFrom(A, 50) });
    const h = 56;
    const n = mul(unit(perp(sub(B, A))), h);
    const D = b.at('D', add(A, n), { dir: [-0.6, 1] });
    const C = b.at('C', add(B, n), { dir: [0.3, 1] });
    const E = b.at('E', add(B, mul(unit(sub(B, A)), h)), { dir: [1, -0.2] });
    const O = b.at('O', mid(A, E), { dir: [0, -1] });
    const r = dist(A, E) / 2;
    b.face([A, B, C, D], { shade: 0.16 });
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    b.seg(B, E);
    b.circle(O, E, { id: 'cir:O', role: 'scaffold' });
    const Q = b.at('Q', add(B, mul(unit(n), 52)), { dir: [0.2, 1] });
    b.seg(B, Q);
    b.ang(C, B, A, { square: true, r: 14 });
    b.text('square on BQ equals the rectangle', V(0, -72), { anchor: 'middle', size: 12.5 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
