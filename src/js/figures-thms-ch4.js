/* ============================================================
   Augros Chapter 4 figures. Euclid IV plates reused via figId.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, mul, unit, pol, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

FIGS['ch4:thm:9'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L'];
    const r = 82;
    const pts = names.map((nm, i) =>
      b.ptOn(nm, { c: C, r, kind: 'circle' }, (90 + i * 36) * DEG, { dir: [Math.cos((90 + i * 36) * DEG), Math.sin((90 + i * 36) * DEG)] })
    );
    b.circle(C, pts[0], { id: 'cir:O' });
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % 10]));
    b.text('a regular decagon', V(0, -108), { anchor: 'middle', size: 13 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
