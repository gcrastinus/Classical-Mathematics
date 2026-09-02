/* ============================================================
   Augros Chapter 5 figures. Book V plates reused via figId;
   remaining teaching pictures are still magnitudes-as-lines.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function mag(b, name, y, len, o) {
  o = o || {};
  const x0 = o.x0 === undefined ? -140 : o.x0;
  const P = b.at(name, V(x0, y), { dir: o.dir || [-1, 0] });
  const Q = add(P, V(len, 0));
  b.seg(P, Q, { id: 'seg:' + name, cls: o.cls, w: o.w || 2.4, name: name });
  if (o.ticks) b.tick(P, Q, o.ticks, { id: 'tk:' + name });
  return P;
}

FIGS['ch5:def:3'] = {
  build(b) {
    mag(b, 'A', 54, 40, { cls: 'accent' });
    mag(b, 'C', 18, 120, { ticks: 2, cls: 'accent' });
    mag(b, 'B', -16, 50);
    mag(b, 'D', -50, 150, { ticks: 2 });
    b.text('3A and 3B — equimultiples', V(0, -86), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch5:def:5'] = FIGS['b5:def:3'];
FIGS['ch5:def:6'] = FIGS['b5:def:5'];
FIGS['ch5:def:7'] = FIGS['b5:def:7'];
FIGS['ch5:def:11'] = FIGS['b5:def:7'];
FIGS['ch5:hook:means'] = {
  build(b) {
    /* A ≥ M ≥ G ≥ H ≥ B on one line (A=4, B=1, M=2.5, G=2, H=1.6). */
    const A = b.at('A', V(-120, 0), { dir: [-1, 0] });
    const M = b.at('M', V(0, 0), { dir: [0, 1] });
    const Gg = b.at('G', V(40, 0), { dir: [0, -1] });
    const H = b.at('H', V(72, 0), { dir: [0, 1] });
    const B = b.at('B', V(120, 0), { dir: [1, 0] });
    b.seg(A, M, { cls: 'accent' });
    b.seg(M, Gg);
    b.seg(Gg, H);
    b.seg(H, B, { cls: 'accent' });
    b.link('AB', 'seg:AM'); b.link('AB', 'seg:MG'); b.link('AB', 'seg:GH'); b.link('AB', 'seg:HB');
    b.link('BA', 'seg:AM'); b.link('BA', 'seg:MG'); b.link('BA', 'seg:GH'); b.link('BA', 'seg:HB');
    b.text('arithmetic, geometric, harmonic means', V(0, -40), { anchor: 'middle', size: 13 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
