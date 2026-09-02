/* ============================================================
   Augros Chapter 6 teaching plates. Euclid VI reused via figId;
   remaining pictures match the course letters.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, lerp, sub } = G;
const FIGS = root.FIGS || (root.FIGS = {});

FIGS['ch6:def:2'] = {
  build(b) {
    const L = b.at('L', V(-120, 40)); const M = b.at('M', V(-150, -40));
    const N = b.at('N', V(-40, -40));
    b.seg(L, M, { cls: 'accent' }); b.seg(M, N, { cls: 'accent' }); b.seg(N, L, { cls: 'accent' });
    const P = b.at('P', V(40, 55)); const Q = b.at('Q', V(20, -40));
    const R = b.at('R', V(150, -40));
    b.seg(P, Q); b.seg(Q, R); b.seg(R, P);
    b.text('ΔLMN  ~  ΔPQR', V(0, -72), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch6:def:5'] = {
  build(b) {
    const C = b.at('C', V(-120, 40), { dir: [-1, 0] });
    const D = b.at('D', V(-120, -20), { dir: [-1, 0] });
    b.seg(C, add(C, V(50, 0)), { id: 'seg:C', name: 'C', cls: 'accent' });
    b.seg(D, add(D, V(90, 0)), { id: 'seg:D', name: 'D' });
    const E = b.at('E', V(20, 40), { dir: [-1, 0] });
    const K = b.at('K', V(20, -20), { dir: [-1, 0] });
    b.seg(E, add(E, V(90, 0)), { id: 'seg:E', name: 'E' });
    b.seg(K, add(K, V(50, 0)), { id: 'seg:K', name: 'K', cls: 'accent' });
    b.text('reciprocal sides  C : E  =  K : D', V(0, -58), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch6:thm:13'] = {
  build(b) {
    const O = b.at('O', V(0, 0), { show: false });
    const A = b.ptOn('A', { c: O, r: 90, kind: 'circle' }, 200 * Math.PI / 180, { dir: [-1, -0.3] });
    const B = b.ptOn('B', { c: O, r: 90, kind: 'circle' }, 20 * Math.PI / 180, { dir: [1, 0.2] });
    const C = b.ptOn('C', { c: O, r: 90, kind: 'circle' }, 110 * Math.PI / 180, { dir: [-0.2, 1] });
    const D = b.ptOn('D', { c: O, r: 90, kind: 'circle' }, 290 * Math.PI / 180, { dir: [0.3, -1] });
    b.circle(O, A, { id: 'cir:O' });
    const Xpt = G.interLL(A, sub(B, A), C, sub(D, C)) || lerp(A, B, 0.45);
    const X = b.at('X', Xpt);
    b.seg(A, X, { cls: 'accent' }); b.seg(X, B, { cls: 'accent' });
    b.seg(C, X); b.seg(X, D);
    b.link('AB', 'seg:AX'); b.link('AB', 'seg:XB');
    b.link('CD', 'seg:CX'); b.link('CD', 'seg:XD');
    b.seg(A, D, { step: 1, role: 'scaffold', dash: '5 4' });
    b.seg(C, B, { step: 1, role: 'scaffold', dash: '5 4' });
    b.poly('AXD', [A, X, D], { step: 2, fill: false });
    b.poly('CXB', [C, X, B], { step: 2, fill: false });
    b.text('AX · XB  =  CX · XD', V(0, -118), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch6:hook:ceva'] = {
  build(b) {
    const X = b.at('X', V(0, 80)); const Y = b.at('Y', V(-110, -50));
    const Z = b.at('Z', V(120, -50));
    const R = b.at('R', lerp(Y, Z, 0.45), { dir: [0, -1] });
    const S = b.at('S', lerp(Z, X, 0.42), { dir: [1, 0.4] });
    const Q = b.at('Q', lerp(X, Y, 0.48), { dir: [-1, 0.3] });
    b.seg(X, Y); b.seg(Y, Z); b.seg(Z, X);
    b.seg(X, R, { cls: 'accent' }); b.seg(Y, S, { cls: 'accent' }); b.seg(Z, Q, { cls: 'accent' });
    const P = b.at('P', lerp(X, R, 0.55));
    b.text('(a/b)·(c/d)·(e/f)  =  1', V(0, -78), { anchor: 'middle', size: 13 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
