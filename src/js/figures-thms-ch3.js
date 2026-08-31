/* ============================================================
   Augros Chapter 3 figures (Course). Euclid III plates reused
   via figId; these are teaching-only pictures.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, pol, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function ring(b, Cname, xy, r, named) {
  const C = b.pt(Cname, xy.x, xy.y, { dir: [0.25, -0.4] });
  const pts = {};
  pts[Cname] = C;
  named.forEach(([nm, deg, dir]) => {
    pts[nm] = b.ptOn(nm, { c: C, r, kind: 'circle' }, deg * DEG, { dir: dir || [0, 1] });
  });
  b.circle(C, pts[named[0][0]], { id: 'cir:' + Cname });
  return pts;
}

FIGS['ch3:def:2'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 80, [['K', 40], ['D', 150]]);
    b.seg(p.K, p.D);
    b.text('KD is a chord', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch3:def:3'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 80, [['A', 30], ['R', 90], ['C2', 160]]);
    b.text('arc ARC', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch3:def:4'] = {
  build(b) {
    const p = ring(b, 'O', V(0, -10), 78, [['F', 40], ['G', 90], ['H', 140]]);
    b.seg(p.F, p.H);
    b.text('concave below FH · convex above', V(0, -104), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['ch3:def:10'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 84, [['A', 18], ['B', 90], ['C', 162], ['D', 234], ['E', 306]]);
    b.seg(p.A, p.B); b.seg(p.B, p.C); b.seg(p.C, p.D); b.seg(p.D, p.E); b.seg(p.E, p.A);
    b.text('inscribed in the circle', V(0, -108), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch3:def:11'] = {
  build(b) {
    const C = b.pt('C', 0, 0, { dir: [0.3, -0.4] });
    const T = b.ptOn('T', { c: C, r: 48, kind: 'circle' }, 90 * DEG, { dir: [0, 1] });
    b.circle(C, T, { id: 'cir:C' });
    const u = unit(perp(sub(T, C)));
    /* a pentagon of tangents, schematic */
    const angs = [18, 90, 162, 234, 306];
    const pts = angs.map((d, i) => {
      const Q = pol(C, 48, d * DEG);
      const n = unit(sub(Q, C));
      const P = add(Q, mul(n, 28));
      return b.at('P' + i, P, { dir: n, show: i === 0 });
    });
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % pts.length]));
    b.text('circumscribed around the circle', V(0, -108), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch3:def:12'] = {
  build(b) {
    const C = b.pt('C', 0, 0, { show: false });
    const r = 78;
    const pts = [90, 162, 234, 306, 18].map((d, i) =>
      b.at('V' + i, pol(C, r, d * DEG), { dir: [Math.cos(d * DEG), Math.sin(d * DEG)] })
    );
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % pts.length]));
    b.text('regular: equal sides and equal angles', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch3:thm:16'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 72, [['A', 0]]);
    const S = b.at('S', add(p.A, V(70, 55)), { dir: [1, 0.5] });
    b.seg(p.C, p.A);
    b.seg(p.A, S);
    b.ang(p.C, p.A, S, { r: 20 });
    b.text('an acute line at A cuts the circle', V(0, -96), { anchor: 'middle', size: 13 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
