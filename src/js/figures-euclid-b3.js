/* ============================================================
   Euclid Book III figures — circles, chords, tangents, angles.
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

/* ---------- definitions ---------- */
FIGS['b3:def:1'] = {
  build(b) {
    const p = ring(b, 'C', V(-70, 0), 48, [['A', 40], ['B', 200]]);
    const q = ring(b, 'F', V(80, 0), 48, [['D', 40], ['E', 200]]);
    b.seg(p.C, p.A); b.seg(q.F, q.D);
    b.text('equal circles: equal radii', V(5, -72), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:2'] = {
  build(b) {
    const p = ring(b, 'C', V(0, -10), 62, [['T', 90, [0, 1]]]);
    const u = unit(perp(sub(p.T, p.C)));
    b.seg(add(p.T, mul(u, -90)), add(p.T, mul(u, 90)), { id: 'tan' });
    b.seg(p.C, p.T, { dash: '4 4', role: 'scaffold' });
    b.text('a line that touches the circle at T', V(0, -92), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:3'] = {
  build(b) {
    const A = b.pt('A', -40, 0, { dir: [-1, 0] });
    const B = b.pt('B', 50, 0, { dir: [1, 0], clamp: minDistFrom(A, 50) });
    const T = b.at('T', lerp(A, B, 0.48), { dir: [0, 1] });
    b.circle(A, T, { id: 'cir:A' });
    b.circle(B, T, { id: 'cir:B' });
    b.seg(A, B, { dash: '4 4', role: 'scaffold' });
    b.text('circles that meet and do not cut', V(5, -78), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:4'] = FIGS['b3:def:5'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 90, [['A', 20], ['B', 160], ['C', 200], ['D', 250]]);
    const M = b.at('M', mid(p.A, p.B), { dir: [0.3, -1] });
    const N = b.at('N', mid(p.C, p.D), { dir: [-0.3, -1] });
    b.seg(p.A, p.B); b.seg(p.C, p.D);
    b.seg(p.E, M, { dash: '4 4' }); b.seg(p.E, N, { dash: '4 4' });
    b.text('chords equally / farther from the center', V(0, -112), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['b3:def:6'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 80, [['A', 40], ['B', 140]]);
    b.seg(p.A, p.B);
    b.poly('seg', [p.A, p.B], { fill: false });
    b.text('a segment: chord + arc', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:7'] = FIGS['b3:def:8'] = {
  build(b) {
    const p = ring(b, 'O', V(0, -8), 78, [['C', 30], ['D', 150], ['E', 90]]);
    b.seg(p.C, p.D); b.seg(p.C, p.E); b.seg(p.D, p.E);
    b.ang(p.C, p.E, p.D, { r: 18, id: 'ang:in' });
    b.text('an angle in a segment', V(0, -102), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:9'] = {
  build(b) {
    const p = ring(b, 'K', V(0, 0), 80, [['H', -30], ['L', 210], ['M', 80], ['N', 40], ['O', 160]]);
    b.seg(p.K, p.H); b.seg(p.K, p.L);
    b.seg(p.M, p.N); b.seg(p.M, p.O);
    b.ang(p.H, p.K, p.L, { r: 20 });
    b.ang(p.N, p.M, p.O, { r: 16 });
    b.text('at the center · at the circumference', V(0, -104), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['b3:def:10'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 78, [['A', 20], ['B', 110]]);
    b.seg(p.C, p.A); b.seg(p.C, p.B);
    b.ang(p.A, p.C, p.B, { r: 22 });
    b.text('a sector: two radii and the arc', V(0, -100), { anchor: 'middle', size: 13 });
  }
};
FIGS['b3:def:11'] = {
  build(b) {
    const p = ring(b, 'C', V(-70, 0), 52, [['A', 30], ['B', 140], ['P', 85]]);
    const q = ring(b, 'F', V(80, 0), 52, [['D', 30], ['E', 140], ['Q', 85]]);
    b.seg(p.A, p.B); b.seg(p.A, p.P); b.seg(p.B, p.P);
    b.seg(q.D, q.E); b.seg(q.D, q.Q); b.seg(q.E, q.Q);
    b.text('similar segments: equal angles', V(5, -78), { anchor: 'middle', size: 13 });
  }
};

/* ---------- propositions ---------- */
FIGS['b3:prop:1'] = {
  build(b) {
    const p = ring(b, 'M', V(0, 0), 88, [['A', 20], ['B', 150], ['D', 90], ['E', 270]]);
    const C = b.at('C', mid(p.A, p.B), { dir: [0.4, -1] });
    b.seg(p.A, p.B); b.seg(p.D, p.E);
    b.ang(p.A, C, p.D, { square: true, r: 12 });
  }
};
FIGS['b3:prop:2'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 86, [['A', 30], ['B', 150]]);
    const D = b.at('D', lerp(p.A, p.B, 0.45), { dir: [0.2, 1] });
    b.seg(p.A, p.B); b.seg(p.C, p.A); b.seg(p.C, D); b.seg(p.C, p.B);
  }
};
FIGS['b3:prop:3'] = {
  build(b) {
    const p = ring(b, 'C', V(0, 0), 88, [['A', 25], ['B', 155], ['D', 90]]);
    const M = b.at('M', mid(p.A, p.B), { dir: [0, -1] });
    b.seg(p.A, p.B); b.seg(p.C, M); b.seg(p.C, p.D);
    b.ang(p.A, M, p.C, { square: true, r: 12 });
  }
};
FIGS['b3:prop:4'] = {
  build(b) {
    const p = ring(b, 'F', V(0, 0), 88, [['A', 15], ['B', 170], ['C', 70], ['D', 250]]);
    const E = b.at('E', lerp(p.A, p.B, 0.42), { dir: [0.3, 0.5] });
    b.seg(p.A, p.B); b.seg(p.C, p.D);
  }
};
FIGS['b3:prop:5'] = {
  build(b) {
    const A = b.pt('A', -35, 0, { dir: [-1, 0] });
    const D = b.pt('D', 45, 12, { dir: [1, 0.2], clamp: minDistFrom(A, 50) });
    const B = b.at('B', add(A, V(40, 55)), { dir: [0, 1] });
    b.circle(A, B, { id: 'cir:A' });
    b.circle(D, B, { id: 'cir:D' });
    b.seg(A, D, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:6'] = {
  build(b) {
    const A = b.pt('A', -40, 0, { dir: [-1, 0] });
    const D = b.pt('D', 48, 0, { dir: [1, 0], clamp: minDistFrom(A, 55) });
    const C = b.at('C', lerp(A, D, 0.52), { dir: [0, 1] });
    b.circle(A, C, { id: 'cir:A' });
    b.circle(D, C, { id: 'cir:D' });
    b.seg(A, D, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:7'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 90, [['A', 0], ['B', 55], ['C', 125], ['D', 180]]);
    const F = b.at('F', lerp(p.A, p.D, 0.32), { dir: [0, 1] });
    b.seg(p.A, p.D); b.seg(F, p.B); b.seg(F, p.C);
  }
};
FIGS['b3:prop:8'] = {
  build(b) {
    const p = ring(b, 'E', V(-20, 0), 70, [['B', 20], ['C', 80], ['F', 150], ['A', 200]]);
    const D = b.pt('D', 110, 20, { dir: [1, 0.2] });
    b.seg(D, p.B); b.seg(D, p.C); b.seg(D, p.F); b.seg(D, p.A);
  }
};
FIGS['b3:prop:9'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 88, [['A', 20], ['B', 130], ['C', 230]]);
    b.seg(p.E, p.A); b.seg(p.E, p.B); b.seg(p.E, p.C);
  }
};
FIGS['b3:prop:10'] = {
  build(b) {
    const A = b.pt('A', -30, 0, { dir: [-1, 0] });
    const D = b.pt('D', 40, 18, { dir: [1, 0.2], clamp: minDistFrom(A, 50) });
    const B = b.at('B', add(mid(A, D), V(0, 48)), { dir: [0, 1] });
    b.circle(A, B, { id: 'cir:A' });
    b.circle(D, B, { id: 'cir:D' });
  }
};
FIGS['b3:prop:11'] = {
  build(b) {
    const E = b.pt('E', 0, 0, { dir: [-0.4, -0.3] });
    const F = b.pt('F', 28, 0, { dir: [0.5, -0.3], clamp: minDistFrom(E, 20) });
    const C = b.at('C', V(-70, 0), { dir: [-1, 0] });
    b.circle(E, C, { id: 'cir:E' });
    b.circle(F, C, { id: 'cir:F' });
    b.seg(E, C);
  }
};
FIGS['b3:prop:12'] = {
  build(b) {
    const F = b.pt('F', -50, 0, { dir: [-1, 0] });
    const G = b.pt('G', 55, 0, { dir: [1, 0], clamp: minDistFrom(F, 60) });
    const C = b.at('C', lerp(F, G, 0.48), { dir: [0, 1] });
    b.circle(F, C, { id: 'cir:F' });
    b.circle(G, C, { id: 'cir:G' });
    b.seg(F, G);
  }
};
FIGS['b3:prop:13'] = FIGS['b3:prop:10'];
FIGS['b3:prop:14'] = {
  build(b) {
    const p = ring(b, 'F', V(0, 0), 90, [['A', 25], ['B', 145], ['C', 200], ['D', 310]]);
    const M = b.at('M', mid(p.A, p.B), { dir: [0.2, -1] });
    const N = b.at('N', mid(p.C, p.D), { dir: [-0.2, -1] });
    b.seg(p.A, p.B); b.seg(p.C, p.D);
    b.seg(p.F, M, { dash: '4 4' }); b.seg(p.F, N, { dash: '4 4' });
  }
};
FIGS['b3:prop:15'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 88, [['A', 0], ['D', 180], ['B', 50], ['C', 130]]);
    b.seg(p.A, p.D); b.seg(p.B, p.C);
    b.seg(p.E, p.B, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:16'] = {
  build(b) {
    const p = ring(b, 'D', V(0, 0), 80, [['A', 0], ['B', 180]]);
    const u = unit(perp(sub(p.A, p.D)));
    b.seg(p.A, p.B);
    b.seg(add(p.A, mul(u, -80)), add(p.A, mul(u, 80)), { id: 'tan' });
    b.ang(p.B, p.A, add(p.A, u), { square: true, r: 14 });
  }
};
FIGS['b3:prop:17'] = {
  build(b) {
    const p = ring(b, 'E', V(-20, 0), 62, [['C', 55], ['D', 0]]);
    const A = b.pt('A', 100, 10, { dir: [1, 0.2] });
    b.seg(A, p.C);
    b.seg(A, p.E, { dash: '4 4', role: 'scaffold' });
    b.seg(p.E, p.C, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:18'] = {
  build(b) {
    const p = ring(b, 'F', V(0, 0), 70, [['C', 90]]);
    const u = unit(perp(sub(p.C, p.F)));
    b.seg(add(p.C, mul(u, -90)), add(p.C, mul(u, 90)), { id: 'DE' });
    b.seg(p.F, p.C);
    b.ang(p.F, p.C, add(p.C, u), { square: true, r: 14 });
  }
};
FIGS['b3:prop:19'] = FIGS['b3:prop:18'];
FIGS['b3:prop:20'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 86, [['B', 20], ['C', 130], ['A', 220]]);
    b.seg(p.E, p.B); b.seg(p.E, p.C);
    b.seg(p.A, p.B); b.seg(p.A, p.C);
    b.ang(p.B, p.E, p.C, { r: 22 });
    b.ang(p.B, p.A, p.C, { r: 18 });
  }
};
FIGS['b3:prop:21'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 86, [['B', 20], ['D', 140], ['A', 200], ['E', 250]]);
    b.seg(p.A, p.B); b.seg(p.A, p.D);
    b.seg(p.E, p.B); b.seg(p.E, p.D);
    b.ang(p.B, p.A, p.D, { r: 16 });
    b.ang(p.B, p.E, p.D, { r: 16 });
  }
};
FIGS['b3:prop:22'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 86, [['A', 20], ['B', 100], ['C', 190], ['D', 280]]);
    b.seg(p.A, p.B); b.seg(p.B, p.C); b.seg(p.C, p.D); b.seg(p.D, p.A);
    b.seg(p.A, p.C, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:23'] = {
  build(b) {
    const p = ring(b, 'C', V(-50, 0), 60, [['A', 30], ['B', 150], ['E', 90]]);
    const q = ring(b, 'F', V(70, 0), 78, [['A2', 40], ['B2', 160], ['D', 95]]);
    b.seg(p.A, p.B); b.seg(p.A, p.E); b.seg(p.B, p.E);
  }
};
FIGS['b3:prop:24'] = FIGS['b3:def:11'];
FIGS['b3:prop:25'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 80, [['A', 30], ['B', 150], ['C', 90]]);
    b.seg(p.A, p.B); b.seg(p.A, p.C); b.seg(p.B, p.C);
    b.circle(p.O, p.A, { id: 'cir:done', dash: '5 4' });
  }
};
FIGS['b3:prop:26'] = {
  build(b) {
    const p = ring(b, 'C', V(-70, 0), 58, [['A', 20], ['B', 130], ['G', 75]]);
    const q = ring(b, 'F', V(75, 0), 58, [['D', 20], ['E', 130], ['H', 75]]);
    b.seg(p.C, p.A); b.seg(p.C, p.B);
    b.seg(q.F, q.D); b.seg(q.F, q.E);
  }
};
FIGS['b3:prop:27'] = FIGS['b3:prop:26'];
FIGS['b3:prop:28'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 86, [['A', 25], ['B', 140], ['C', 200], ['D', 310]]);
    b.seg(p.A, p.B); b.seg(p.C, p.D);
  }
};
FIGS['b3:prop:29'] = FIGS['b3:prop:28'];
FIGS['b3:prop:30'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 86, [['A', 30], ['B', 150], ['D', 90]]);
    const C = b.at('C', mid(p.A, p.B), { dir: [0, -1] });
    b.seg(p.A, p.B); b.seg(C, p.D);
    b.ang(p.A, C, p.D, { square: true, r: 12 });
  }
};
FIGS['b3:prop:31'] = {
  build(b) {
    const p = ring(b, 'E', V(0, 0), 86, [['B', 0], ['C', 180], ['A', 70]]);
    b.seg(p.B, p.C); b.seg(p.A, p.B); b.seg(p.A, p.C);
    b.ang(p.B, p.A, p.C, { square: true, r: 16 });
  }
};
FIGS['b3:prop:32'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 78, [['B', 90], ['A', 20], ['C', 200]]);
    const u = unit(perp(sub(p.B, p.O)));
    b.seg(add(p.B, mul(u, -80)), add(p.B, mul(u, 80)), { id: 'EF' });
    b.seg(p.B, p.A); b.seg(p.A, p.C); b.seg(p.C, p.B);
    b.ang(add(p.B, u), p.B, p.A, { r: 16 });
  }
};
FIGS['b3:prop:33'] = {
  build(b) {
    const A = b.pt('A', -70, -20, { dir: [-1, -0.2] });
    const B = b.pt('B', 70, -20, { dir: [1, -0.2], clamp: minDistFrom(A, 50) });
    const p = ring(b, 'O', V(0, 20), 72, [['C', 80]]);
    b.seg(A, B); b.seg(A, p.C); b.seg(B, p.C);
  }
};
FIGS['b3:prop:34'] = FIGS['b3:prop:33'];
FIGS['b3:prop:35'] = {
  build(b) {
    const p = ring(b, 'O', V(0, 0), 88, [['A', 15], ['B', 170], ['C', 80], ['D', 250]]);
    const E = b.at('E', lerp(p.A, p.B, 0.4), { dir: [0.3, 0.4] });
    b.seg(p.A, p.B); b.seg(p.C, p.D);
  }
};
FIGS['b3:prop:36'] = {
  build(b) {
    const p = ring(b, 'M', V(-10, 0), 64, [['T', 70], ['S', 150], ['A', 210]]);
    const P = b.pt('P', 110, 50, { dir: [1, 0.4] });
    b.seg(P, p.T); b.seg(P, p.A);
    b.seg(p.M, p.T, { dash: '4 4', role: 'scaffold' });
  }
};
FIGS['b3:prop:37'] = FIGS['b3:prop:36'];

})(typeof window !== 'undefined' ? window : globalThis);
