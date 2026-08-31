/* ============================================================
   Augros Chapter 2 figures (Course shelf). Euclid II plates are
   reused via figId; these are the teaching-only pictures.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}

/* identical rectangles */
FIGS['ch2:def:3'] = {
  build(b) {
    const A = b.at('G', V(-130, 30), { dir: [-1, 0.3] });
    const B = b.at('H', V(-130, -40), { dir: [-1, -0.3] });
    const C = b.at('K', V(-40, -40), { dir: [0.4, -1] });
    const D = add(A, sub(C, B));
    b.face([A, D, C, B], { shade: 0.16 });
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    const L = b.at('L', V(20, 30), { dir: [-0.3, 0.4] });
    const M = b.at('M', V(20, -40), { dir: [-0.3, -0.4] });
    const N = b.at('N', V(110, -40), { dir: [1, -0.3] });
    const P = add(L, sub(N, M));
    b.face([L, P, N, M], { shade: 0.16 });
    b.seg(L, M); b.seg(M, N); b.seg(N, P); b.seg(P, L);
    b.ang(A, B, C, { square: true, r: 12 });
    b.ang(L, M, N, { square: true, r: 12 });
    b.text('identical rectangles: equal corresponding sides', V(-10, -72), { anchor: 'middle', size: 12.5 });
  }
};

/* Thm 2 — gnomon in a square */
FIGS['ch2:thm:2'] = {
  build(b) {
    const D = b.at('D', V(-80, -70), { dir: [-1, -0.3] });
    const G0 = b.at('G', V(80, -70), { dir: [1, -0.3], clamp: minDistFrom(D, 80) });
    const s = dist(D, G0);
    const n = mul(unit(perp(sub(G0, D))), s);
    const A = b.at('A', add(D, n), { dir: [-1, 0.5] });
    const F = b.at('F', add(G0, n), { dir: [1, 0.5] });
    const u = unit(sub(G0, D)), v = unit(n);
    const t = s * 0.38;
    const C = b.at('C', add(D, mul(v, t)), { dir: [-1, 0.2] });
    const E = b.at('E', add(G0, mul(v, t)), { dir: [1, 0.2] });
    const B0 = b.at('B', add(A, mul(u, t)), { dir: [-0.2, 1] });
    const H = b.at('H', add(F, mul(u, t - s)), { dir: [0.4, 1] });
    const R = b.at('R', add(C, mul(u, t)), { dir: [0.4, 0.4] });
    b.seg(D, G0); b.seg(G0, F); b.seg(F, A); b.seg(A, D);
    b.seg(D, F, { dash: '5 4', id: 'diag' });
    b.seg(C, E); b.seg(B0, add(B0, mul(u, s - t)));
    b.face([D, add(D, mul(u, t)), R, C], { shade: 0.2, id: 'sq1' });
    b.face([R, add(R, mul(u, s - t)), F, E], { shade: 0.2, id: 'sq2' });
    b.face([A, B0, R, C], { shade: 0.08, id: 'rect1' });
    b.face([R, add(B0, mul(u, s - t)), F, H], { shade: 0.08, id: 'rect2' });
  }
};

/* Thm 5 — adding two rectangles */
FIGS['ch2:thm:5'] = {
  build(b) {
    const A = b.at('A', V(-120, 40), { dir: [-1, 0.3] });
    const B = b.at('B', V(-40, 40), { dir: [0.2, 0.5] });
    const C = b.at('C', V(-40, -20), { dir: [0.3, -0.4] });
    const D = b.at('D', V(-120, -20), { dir: [-1, -0.3] });
    const E = b.at('E', V(-40, -70), { dir: [0.3, -1] });
    const G = b.at('G', V(30, -70), { dir: [1, -0.3] });
    const F = b.at('F', V(30, -20), { dir: [1, 0.2] });
    b.face([A, B, C, D], { shade: 0.18 });
    b.face([D, C, E, add(D, sub(E, C))], { shade: 0.08 });
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    b.seg(C, E); b.seg(E, G); b.seg(G, F); b.seg(F, C);
    b.seg(A, G, { dash: '5 4', id: 'AG' });
    b.ang(A, D, C, { square: true, r: 12 });
  }
};

/* Thm 6 — perpendicular to a diameter */
FIGS['ch2:thm:6'] = {
  build(b) {
    const A = b.at('A', V(-110, 0), { dir: [-1, 0] });
    const B0 = b.at('B', V(110, 0), { dir: [1, 0], clamp: minDistFrom(A, 80) });
    const M = b.at('M', mid(A, B0), { dir: [0, -1] });
    const P = b.ptOn('P', { c: M, r: dist(M, A), kind: 'circle' }, 72 * DEG, { dir: [0.3, 1] });
    const R = b.at('R', V(P.x, A.y), { dir: [0, -1] });
    b.circle(M, A, { id: 'cir:M' });
    b.seg(A, B0);
    b.seg(P, R);
    b.seg(P, M, { dash: '4 4', id: 'PM', role: 'scaffold' });
    b.ang(P, R, B0, { square: true, r: 12 });
    b.text('PR² = AR · RB', V(0, -118), { anchor: 'middle', size: 13 });
  }
};

/* Thm 8 — isosceles vs another triangle on the same base/height */
FIGS['ch2:thm:8'] = {
  build(b) {
    const B0 = b.at('B', V(-70, -40), { dir: [-1, -0.3] });
    const C = b.at('C', V(70, -40), { dir: [1, -0.3], clamp: minDistFrom(B0, 60) });
    const A = b.at('A', V(0, 80), { dir: [0, 1] });
    const R = b.at('R', V(-100, 80), { dir: [-1, 0.3] });
    const K = b.at('K', V(40, -40), { dir: [0.4, -1] });
    b.seg(B0, C); b.seg(C, A); b.seg(A, B0);
    b.seg(R, K, { dash: '5 4', id: 'other' });
    b.seg(A, R, { dash: '5 4' });
    b.seg(A, add(A, V(90, 0)), { dash: '4 4', id: 'par', role: 'scaffold' });
    b.poly('ABC', [A, B0, C], { fill: false });
  }
};

/* Thm 10/11 — square vs rhombus of equal area */
FIGS['ch2:thm:10'] = {
  build(b) {
    const A = b.at('A', V(-40, -40), { dir: [-1, -0.3] });
    const B = b.at('B', V(40, -40), { dir: [1, -0.3], clamp: minDistFrom(A, 40) });
    const s = dist(A, B);
    const n = mul(unit(perp(sub(B, A))), s);
    b.face([A, B, add(B, n), add(A, n)], { shade: 0.16 });
    b.seg(A, B); b.seg(B, add(B, n)); b.seg(add(B, n), add(A, n)); b.seg(add(A, n), A);
    const R = b.at('R', V(-130, -20), { dir: [-1, 0] });
    const S = b.at('S', V(-70, -50), { dir: [0, -1] });
    const u = sub(S, R);
    const w = V(-u.y * 0.85, u.x * 0.55);
    const T = add(S, w), U = add(R, w);
    b.seg(R, S); b.seg(S, T); b.seg(T, U); b.seg(U, R);
    b.text('equal areas; the square has the shorter fence', V(-20, -88), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['ch2:thm:11'] = FIGS['ch2:thm:10'];
FIGS['ch2:thm:9'] = FIGS['ch2:thm:10'];

})(typeof window !== 'undefined' ? window : globalThis);
