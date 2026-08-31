/* ============================================================
   Euclid Book IV figures — inscribed and circumscribed polygons.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, pol, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}
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
function gon(b, C, r, n, start, names) {
  const pts = names.map((nm, i) =>
    b.ptOn(nm, { c: C, r, kind: 'circle' }, (start + i * 360 / n) * DEG, { dir: [Math.cos((start + i * 360 / n) * DEG), Math.sin((start + i * 360 / n) * DEG)] })
  );
  b.circle(C, pts[0], { id: 'cir:' + (C.name || 'C') });
  pts.forEach((p, i) => b.seg(p, pts[(i + 1) % n]));
  return pts;
}

/* Defs 1–7: inscribed / circumscribed figures and a chord “fitted” in */
FIGS['b4:def:1'] = FIGS['b4:def:2'] = {
  build(b) {
    const A = b.at('A', V(-50, -40)); const B = b.at('B', V(50, -40));
    const C = b.at('C', V(30, 50)); const D = b.at('D', V(-40, 40));
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    const P = b.at('P', lerp(A, B, 0.3)); const Q = b.at('Q', lerp(B, C, 0.4));
    const R = b.at('R', lerp(C, D, 0.4)); const S = b.at('S', lerp(D, A, 0.35));
    b.seg(P, Q); b.seg(Q, R); b.seg(R, S); b.seg(S, P);
    b.text('a figure inscribed in a figure', V(0, -68), { anchor: 'middle', size: 13 });
  }
};
FIGS['b4:def:3'] = FIGS['b4:def:6'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 80, [['A', 90], ['B', 210], ['C', 330]]);
    b.seg(p.A, p.B); b.seg(p.B, p.C); b.seg(p.C, p.A);
    b.text('a triangle inscribed in a circle', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['b4:def:4'] = FIGS['b4:def:5'] = {
  build(b) {
    const C = b.pt('C', 0, 0, { dir: [0.3, -0.4] });
    const T = b.ptOn('T', { c: C, r: 42, kind: 'circle' }, 90 * DEG, { dir: [0, 1] });
    b.circle(C, T, { id: 'cir:C' });
    const pts = [90, 210, 330].map((d, i) => {
      const Q = pol(C, 42, d * DEG);
      const n = unit(sub(Q, C));
      return b.at('P' + i, add(Q, mul(n, 36)), { dir: n });
    });
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % 3]));
    b.text('a triangle circumscribed about a circle', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['b4:def:7'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 78, [['A', 40], ['B', 150]]);
    b.seg(p.A, p.B);
    b.text('a line fitted into the circle', V(0, -100), { anchor: 'middle', size: 13 });
  }
};

/* IV.1 — fit a given line into a circle */
FIGS['b4:prop:1'] = {
  build(b) {
    const p = ring(b, 'O', V(10, 0), 80, [['A', 30], ['B', 130], ['C', 220]]);
    const D1 = b.at('D', V(-130, -20), { dir: [-1, 0] });
    const D2 = b.at('D′', V(-70, -20), { dir: [0.3, -1] });
    b.seg(D1, D2);
    b.seg(p.A, p.B);
  }
};
/* IV.2 — triangle of given angles in a circle */
FIGS['b4:prop:2'] = {
  build(b) {
    const p = ring(b, 'O', V(40, 0), 78, [['P', 90], ['A', 20], ['B', 200]]);
    const u = unit(perp(sub(p.P, p.O)));
    b.seg(add(p.P, mul(u, -70)), add(p.P, mul(u, 70)), { id: 'tan' });
    b.seg(p.P, p.A); b.seg(p.P, p.B); b.seg(p.A, p.B);
    const T = b.at('T', V(-110, 50)); const U = b.at('U', V(-40, 50)); const W = b.at('W', V(-70, -20));
    b.seg(T, U); b.seg(U, W); b.seg(W, T);
  }
};
/* IV.3 — triangle about a circle */
FIGS['b4:prop:3'] = FIGS['b4:def:4'];
/* IV.4 — incircle */
FIGS['b4:prop:4'] = {
  build(b) {
    const A = b.pt('A', 0, 80, { dir: [0, 1] });
    const B = b.pt('B', -80, -50, { dir: [-1, -0.3] });
    const C = b.pt('C', 80, -50, { dir: [1, -0.3], clamp: minDistFrom(B, 60) });
    b.seg(A, B); b.seg(B, C); b.seg(C, A);
    const I = b.at('I', V(0, -10), { dir: [0.3, 0.2] });
    const D = b.at('D', V(0, -50), { dir: [0, -1] });
    b.circle(I, D, { id: 'incir' });
    b.seg(I, D, { dash: '4 4', role: 'scaffold' });
  }
};
/* IV.5 — circumcircle */
FIGS['b4:prop:5'] = {
  build(b) {
    const A = b.pt('A', 0, 70, { dir: [0, 1] });
    const B = b.pt('B', -75, -45, { dir: [-1, -0.3] });
    const C = b.pt('C', 80, -40, { dir: [1, -0.3], clamp: minDistFrom(B, 50) });
    b.seg(A, B); b.seg(B, C); b.seg(C, A);
    const O = b.at('O', V(0, 5), { dir: [0.4, -0.2] });
    b.circle(O, A, { id: 'ccir' });
  }
};
/* IV.6 — square in a circle */
FIGS['b4:prop:6'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    gon(b, C, 80, 4, 45, ['A', 'B', 'C', 'D']);
  }
};
/* IV.7 — square about a circle */
FIGS['b4:prop:7'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    const T = b.ptOn('T', { c: C, r: 48, kind: 'circle' }, 90 * DEG, { dir: [0, 1] });
    b.circle(C, T, { id: 'cir:O' });
    const r = 48 * Math.SQRT2;
    const names = ['A', 'B', 'Cc', 'D'];
    const pts = [45, 135, 225, 315].map((d, i) => b.at(names[i], pol(C, r, d * DEG)));
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % 4]));
  }
};
/* IV.8 — circle in a square */
FIGS['b4:prop:8'] = {
  build(b) {
    const A = b.at('A', V(-60, 60)); const B = b.at('B', V(60, 60));
    const C = b.at('C', V(60, -60)); const D = b.at('D', V(-60, -60));
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    const O = b.at('O', V(0, 0));
    const T = b.at('T', V(0, -60));
    b.circle(O, T, { id: 'incir' });
  }
};
/* IV.9 — circle about a square */
FIGS['b4:prop:9'] = {
  build(b) {
    const A = b.at('A', V(-55, 55)); const B = b.at('B', V(55, 55));
    const C = b.at('C', V(55, -55)); const D = b.at('D', V(-55, -55));
    b.seg(A, B); b.seg(B, C); b.seg(C, D); b.seg(D, A);
    const O = b.at('O', V(0, 0));
    b.circle(O, A, { id: 'ccir' });
  }
};
/* IV.10 — golden isosceles */
FIGS['b4:prop:10'] = {
  build(b) {
    const A = b.pt('A', 0, 80, { dir: [0, 1] });
    const B = b.pt('B', -70, -50, { dir: [-1, -0.3] });
    const C = b.pt('C', 70, -50, { dir: [1, -0.3], clamp: minDistFrom(B, 50) });
    b.seg(A, B); b.seg(B, C); b.seg(C, A);
    b.ang(B, A, C, { r: 22, id: 'vert' });
    b.ang(A, B, C, { r: 18, n: 2 });
    b.ang(A, C, B, { r: 18, n: 2 });
  }
};
/* IV.11 — pentagon in a circle */
FIGS['b4:prop:11'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    gon(b, C, 82, 5, 90, ['A', 'B', 'Cc', 'D', 'E']);
  }
};
/* IV.12 — pentagon about a circle */
FIGS['b4:prop:12'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    const T = b.ptOn('T', { c: C, r: 42, kind: 'circle' }, 90 * DEG, { dir: [0, 1] });
    b.circle(C, T, { id: 'cir:O' });
    const r = 42 / Math.cos(Math.PI / 5);
    const names = ['A', 'B', 'Cc', 'D', 'E'];
    const pts = names.map((nm, i) => b.at(nm, pol(C, r, (90 + i * 72) * DEG)));
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % 5]));
  }
};
/* IV.13 — incircle of a pentagon */
FIGS['b4:prop:13'] = FIGS['b4:prop:12'];
/* IV.14 — circumcircle of a pentagon */
FIGS['b4:prop:14'] = FIGS['b4:prop:11'];
/* IV.15 — hexagon */
FIGS['b4:prop:15'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    gon(b, C, 80, 6, 0, ['A', 'B', 'Cc', 'D', 'E', 'F']);
    b.seg(C, b.pts.A, { dash: '4 4', role: 'scaffold' });
  }
};
/* IV.16 — 15-gon (schematic regular 15) */
FIGS['b4:prop:16'] = {
  build(b) {
    const C = b.pt('O', 0, 0, { dir: [0.3, -0.4] });
    const names = [];
    for (let i = 0; i < 15; i++) names.push('P' + i);
    gon(b, C, 84, 15, 90, names);
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
