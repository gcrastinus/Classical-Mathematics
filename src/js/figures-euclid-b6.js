/* ============================================================
   Euclid Book VI figures — similar triangles and polygons.
   Letters match Joyce/Heiberg so click-to-highlight works.
   Given figures sit at step 0; constructed lines, cuts, and
   copies draw on later so Replay traces the proof.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, pol, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function cap(b, s, y, o) {
  b.text(s, V(0, y), Object.assign({ anchor: 'middle', size: 13 }, o || {}));
}
function P(b, map) {
  const o = {};
  Object.keys(map).forEach(nm => {
    const v = map[nm];
    let opts = {};
    if (v[2] && Array.isArray(v[2])) opts = Object.assign({ dir: v[2] }, v[3] || {});
    else if (v[2] && typeof v[2] === 'object') opts = v[2];
    o[nm] = b.at(nm, V(v[0], v[1]), opts);
  });
  return o;
}
function segs(b, p, pairs, o) {
  o = o || {};
  (pairs || []).forEach(s => {
    const extra = (s[2] && typeof s[2] === 'object' && !Array.isArray(s[2])) ? s[2] : {};
    b.seg(p[s[0]], p[s[1]], Object.assign({}, o, extra));
  });
}
function tri(b, name, p, o) {
  const pts = String(name).split('').map(n => p[n]);
  return b.poly(name, pts, o);
}

/* ----- definitions (Heiberg numbering) ----- */
FIGS['b6:def:1'] = {
  build(b) {
    const A = b.at('A', V(-140, 36)); const B = b.at('B', V(-70, 50));
    const C = b.at('C', V(-48, -28)); const D = b.at('D', V(-150, -12));
    segs(b, { A, B, C, D }, ['AB', 'BC', 'CD', 'DA'], { cls: 'accent' });
    b.poly('ABCD', [A, B, C, D], { fill: false, cls: 'accent' });
    const sc = p => V(90 + (p.x + 95) * 1.28, p.y * 1.28);
    const E = b.at('E', sc(A), { step: 1 }); const F = b.at('F', sc(B), { step: 1 });
    const Gg = b.at('G', sc(C), { step: 1 }); const H = b.at('H', sc(D), { step: 1 });
    segs(b, { E, F, G: Gg, H }, ['EF', 'FG', 'GH', 'HE'], { step: 1 });
    b.poly('EFGH', [E, F, Gg, H], { fill: false, step: 1 });
    cap(b, 'similar: equal angles, proportional sides', -62);
  }
};
FIGS['b6:def:2'] = {
  build(b) {
    const A = b.at('A', V(-120, 0), { dir: [-1, 0] });
    const Gg = b.at('G', V(-10, 0), { dir: [0, 1] });
    const B = b.at('B', V(70, 0), { dir: [1, 0] });
    b.seg(A, Gg, { cls: 'accent', w: 2.6 });
    b.seg(Gg, B);
    b.link('AB', 'seg:AG'); b.link('AB', 'seg:GB');
    b.link('BA', 'seg:AG'); b.link('BA', 'seg:GB');
    cap(b, 'cut in extreme and mean ratio  ·  BA : AG = AG : GB', -42);
  }
};
FIGS['b6:def:3'] = {
  build(b) {
    const p = P(b, { B: [-90, -40], C: [90, -40], A: [-20, 70] });
    const H = b.at('H', V(-20, -40), { dir: [0, -1], step: 1 });
    segs(b, p, ['AB', 'BC', 'CA']);
    tri(b, 'ABC', p);
    b.seg(p.A, H, { dash: '5 4', cls: 'accent', step: 1 });
    b.ang(p.A, H, p.C, { square: true, r: 14, step: 1 });
    cap(b, 'height: perpendicular from the vertex to the base', -72);
  }
};

/* ----- propositions ----- */
FIGS['b6:prop:1'] = {
  build(b) {
    const p = P(b, {
      B: [-110, -40], C: [0, -40], D: [80, -40], A: [0, 70]
    });
    segs(b, p, ['AB', 'BC', 'CA', 'CD', 'DA']);
    tri(b, 'ACB', p);
    tri(b, 'ACD', p);
    const E = b.at('E', V(-110, 70), { step: 1 });
    const F = b.at('F', V(80, 70), { step: 1 });
    p.E = E; p.F = F;
    b.seg(E, p.B, { step: 1 }); b.seg(E, p.A, { cls: 'accent', step: 1 });
    b.seg(F, p.D, { step: 1 }); b.seg(p.A, F, { cls: 'accent', step: 1 });
    b.poly('CE', [p.C, E, p.A, p.B], { fill: false, step: 1 });
    b.poly('CF', [p.C, p.A, F, p.D], { fill: false, step: 1 });
    b.link('CE', 'poly:CE'); b.link('FC', 'poly:CF'); b.link('CF', 'poly:CF');
    cap(b, 'same height, as the bases', -72);
  }
};
FIGS['b6:prop:2'] = {
  build(b) {
    const p = P(b, { A: [0, 80], B: [-100, -50], C: [110, -50] });
    segs(b, p, ['AB', 'BC', 'CA']);
    tri(b, 'ABC', p);
    const D = b.at('D', lerp(p.A, p.B, 0.42), { step: 1 });
    const E = b.at('E', lerp(p.A, p.C, 0.42), { step: 1 });
    p.D = D; p.E = E;
    b.seg(p.A, D, { step: 1 }); b.seg(p.B, D, { step: 1 });
    b.seg(p.A, E, { step: 1 }); b.seg(p.C, E, { step: 1 });
    b.seg(D, E, { cls: 'accent', step: 1 });
    tri(b, 'ADE', p, { step: 1, fill: false });
    b.seg(p.B, E, { step: 2, role: 'scaffold', dash: '5 4' });
    b.seg(p.C, D, { step: 2, role: 'scaffold', dash: '5 4' });
    tri(b, 'BDE', p, { step: 2, fill: false });
    tri(b, 'CDE', p, { step: 2, fill: false });
    cap(b, 'DE ∥ BC  cuts  AB and AC proportionally', -78);
  }
};
FIGS['b6:prop:3'] = {
  build(b) {
    const p = P(b, { A: [-20, 80], B: [-110, -50], C: [120, -50] });
    segs(b, p, ['AB', 'BC', 'CA']);
    tri(b, 'ABC', p);
    const D = b.at('D', lerp(p.B, p.C, 0.38), { step: 1 });
    p.D = D;
    b.seg(p.A, D, { cls: 'accent', step: 1 });
    b.seg(p.B, D, { step: 1 }); b.seg(D, p.C, { step: 1 });
    const E = b.at('E', add(p.A, mul(unit(sub(p.A, p.B)), 64)), { step: 2, dir: [-0.2, 1] });
    p.E = E;
    b.seg(p.A, E, { step: 2 });
    b.seg(p.C, E, { step: 2, dash: '5 4' });
    cap(b, 'the bisector of ∠A  cuts BC as BA : AC', -78);
  }
};
FIGS['b6:prop:4'] = {
  build(b) {
    const p = P(b, {
      B: [-120, -20], C: [-20, -20], A: [-90, 70],
      E: [90, -20, { step: 1 }], D: [40, 55, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    segs(b, p, ['DC', 'CE', 'ED'], { step: 1 });
    tri(b, 'DCE', p, { step: 1, fill: false });
    cap(b, 'equiangular triangles are similar', -58);
  }
};
FIGS['b6:prop:5'] = FIGS['b6:prop:6'] = FIGS['b6:prop:7'] = {
  build(b) {
    const p = P(b, {
      A: [-120, 50], B: [-150, -40], C: [-40, -40],
      D: [40, 70, { step: 1 }], E: [20, -40, { step: 1 }], F: [150, -40, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    segs(b, p, ['DE', 'EF', 'FD'], { step: 1 });
    tri(b, 'DEF', p, { step: 1, fill: false });
    cap(b, 'proportional sides  ⇒  equiangular (similar)', -72);
  }
};
FIGS['b6:prop:8'] = {
  build(b) {
    const p = P(b, { A: [-30, 50], B: [-110, 50], C: [-30, -70] });
    segs(b, p, ['AB', 'BC', 'CA']);
    tri(b, 'ABC', p);
    b.ang(p.B, p.A, p.C, { square: true, r: 16 });
    const D = b.at('D', lerp(p.B, p.C, 0.55), { dir: [0.6, -0.6], step: 1 });
    p.D = D;
    b.seg(p.A, D, { cls: 'accent', dash: '5 4', step: 1 });
    tri(b, 'ABD', p, { step: 1, fill: false });
    tri(b, 'ACD', p, { step: 1, fill: false });
    cap(b, 'altitude to the hypotenuse: three similar triangles', -98);
  }
};
FIGS['b6:prop:9'] = {
  build(b) {
    const A = b.at('A', V(-120, 10), { dir: [-1, 0] });
    const B = b.at('B', V(120, 10), { dir: [1, 0] });
    const C = b.at('C', lerp(A, B, 1 / 3), { dir: [0, 1], step: 1 });
    b.seg(A, B);
    b.seg(A, C, { cls: 'accent', step: 1 }); b.seg(C, B, { step: 1 });
    b.link('AB', 'seg:AC'); b.link('AB', 'seg:CB');
    cap(b, 'cut off a prescribed part of AB', -36);
  }
};
FIGS['b6:prop:10'] = {
  build(b) {
    const p = P(b, { A: [-90, -20], B: [110, -20] });
    b.seg(p.A, p.B);
    const H = b.at('H', V(-40, 80), { step: 1 });
    const G = b.at('G', lerp(p.A, H, 0.42), { step: 1 });
    const C = b.at('C', lerp(p.A, p.B, 0.42), { step: 1 });
    p.H = H; p.G = G; p.C = C;
    b.seg(p.A, H, { step: 1 }); b.seg(H, p.B, { step: 1 });
    b.seg(p.A, G, { step: 1 }); b.seg(G, H, { step: 1 });
    b.seg(p.A, C, { step: 1 }); b.seg(C, p.B, { step: 1 });
    b.seg(G, C, { cls: 'accent', step: 1 });
    const D = b.at('D', V(40, 70), { step: 1 });
    const E = b.at('E', V(130, 20), { step: 1 });
    const K = b.at('K', lerp(D, E, 0.4), { dir: [0, 1], step: 1 });
    b.seg(D, E, { step: 1 });
    cap(b, 'cut AB similarly to the given cut line', -58);
  }
};
FIGS['b6:prop:11'] = {
  build(b) {
    const p = P(b, { A: [-40, -30], B: [80, -30], C: [-10, 70, { step: 1 }] });
    b.seg(p.A, p.B);
    b.seg(p.A, p.C, { step: 1 });
    cap(b, 'third proportional to AB and AC', -62);
  }
};
FIGS['b6:prop:12'] = {
  build(b) {
    const A = b.at('A', V(-140, 50), { dir: [-1, 0] });
    const B = b.at('B', V(-140, 10), { dir: [-1, 0] });
    const C = b.at('C', V(-140, -30), { dir: [-1, 0] });
    b.seg(A, add(A, V(70, 0)), { id: 'seg:A', name: 'A', cls: 'accent' });
    b.seg(B, add(B, V(45, 0)), { id: 'seg:B', name: 'B' });
    b.seg(C, add(C, V(55, 0)), { id: 'seg:C', name: 'C', cls: 'accent' });
    const p = P(b, {
      P: [20, -20, { step: 1 }], E: [90, -20, { step: 1 }],
      G: [140, -20, { step: 1 }], K: [50, 70, { step: 1 }],
      H: [100, 95, { step: 1 }]
    });
    segs(b, p, ['PE', 'EG', 'PK'], { step: 1 });
    b.seg(p.E, p.K, { step: 1 }); b.seg(p.G, p.H, { cls: 'accent', step: 1 });
    cap(b, 'fourth proportional  A : B  =  C : KH', -58);
  }
};
FIGS['b6:prop:13'] = {
  build(b) {
    const D = b.at('D', V(-110, -20)); const E = b.at('E', V(-10, -20));
    const F = b.at('F', V(90, -20));
    b.seg(D, E); b.seg(E, F);
    b.link('DF', 'seg:DE'); b.link('DF', 'seg:EF');
    b.link('FD', 'seg:DE'); b.link('FD', 'seg:EF');
    const ctr = mid(D, F);
    const r = dist(ctr, D);
    b.circle(ctr, D, { id: 'cir:DF', step: 1, role: 'scaffold' });
    const Pp = b.at('P', V(-10, -20 + r), { dir: [0, 1], step: 1 });
    b.seg(E, Pp, { cls: 'accent', step: 1 });
    b.seg(D, Pp, { step: 1 }); b.seg(Pp, F, { step: 1 });
    cap(b, 'mean proportional  DE : EP  =  EP : EF', -r - 48);
  }
};
FIGS['b6:prop:14'] = {
  build(b) {
    const p = P(b, {
      B: [0, -10], A: [-90, -10], C: [70, -10, { step: 1 }],
      H: [-70, 60], K: [90, 50, { step: 1 }],
      E: [-20, 60], D: [20, 50, { step: 1 }]
    });
    segs(b, p, ['AB', 'AH', 'HE', 'EB'], { cls: 'accent' });
    segs(b, p, ['BC', 'CK', 'KD', 'DB'], { step: 1 });
    cap(b, 'equal equiangular parallelograms: sides reciprocal', -52);
  }
};
FIGS['b6:prop:15'] = {
  build(b) {
    const p = P(b, {
      A: [-20, 70], B: [-110, -40], C: [20, -40],
      D: [40, -10, { step: 1 }], E: [130, -40, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    segs(b, p, ['AD', 'DE', 'EA'], { step: 1 });
    tri(b, 'ADE', p, { step: 1, fill: false });
    cap(b, 'equal triangles, one equal angle: sides reciprocal', -72);
  }
};
FIGS['b6:prop:16'] = {
  build(b) {
    const A = b.at('A', V(-130, 20), { dir: [-1, 0] });
    const B = b.at('B', V(-130, -20), { dir: [-1, 0] });
    b.seg(A, add(A, V(80, 0)), { id: 'seg:AB', name: 'AB', cls: 'accent' });
    const C = b.at('C', V(-20, 20), { dir: [-0.2, 1] });
    const D = b.at('D', V(60, 20), { dir: [1, 0] });
    b.seg(C, D, { cls: 'accent' });
    const E = b.at('E', V(-20, -50), { dir: [-1, 0], step: 1 });
    const F = b.at('F', V(-20, -90), { dir: [-1, 0], step: 1 });
    b.seg(E, add(E, V(50, 0)), { id: 'seg:E', name: 'E', step: 1 });
    b.seg(F, add(F, V(70, 0)), { id: 'seg:F', name: 'F', step: 1 });
    cap(b, 'A:B = C:D  ⇒  rectangle AD = rectangle BC', -118);
  }
};
FIGS['b6:prop:17'] = {
  build(b) {
    const A = b.at('A', V(-40, 50), { dir: [-1, 0] });
    const B = b.at('B', V(-40, 10), { dir: [-1, 0] });
    const C = b.at('C', V(-40, -30), { dir: [-1, 0], step: 1 });
    b.seg(A, add(A, V(50, 0)), { id: 'seg:A', name: 'A', cls: 'accent' });
    b.seg(B, add(B, V(80, 0)), { id: 'seg:B', name: 'B' });
    b.seg(C, add(C, V(128, 0)), { id: 'seg:C', name: 'C', cls: 'accent', step: 1 });
    cap(b, 'A : B  =  B : C  ⇒  rectangle AC = square on B', -68);
  }
};
FIGS['b6:prop:18'] = {
  build(b) {
    const p = P(b, {
      A: [-130, 20], B: [-50, 20], C: [-30, -50], D: [-140, -40],
      E: [20, -10, { step: 1 }], H: [130, -10, { step: 1 }],
      K: [55, 50, { step: 1 }], L: [145, -55, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CD', 'DA'], { cls: 'accent' });
    b.poly('ABCD', [p.A, p.B, p.C, p.D], { fill: false, cls: 'accent' });
    segs(b, p, ['EH', 'HK', 'KL', 'LE'], { step: 1 });
    b.poly('EHKL', [p.E, p.H, p.K, p.L], { fill: false, step: 1 });
    cap(b, 'a similar figure on the given line EH', -88);
  }
};
FIGS['b6:prop:19'] = {
  build(b) {
    const p = P(b, {
      A: [-130, 40], B: [-160, -40], C: [-50, -40],
      D: [40, 55, { step: 1 }], E: [20, -40, { step: 1 }], F: [140, -40, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    segs(b, p, ['DE', 'EF', 'FD'], { step: 1 });
    tri(b, 'DEF', p, { step: 1, fill: false });
    cap(b, 'similar triangles  as  squares on corresponding sides', -72);
  }
};
FIGS['b6:prop:20'] = {
  build(b) {
    const names = ['A', 'B', 'C', 'D', 'E'];
    const pts = names.map((nm, i) => {
      const t = (-90 + i * 72) * DEG;
      return b.at(nm, pol(V(-90, 5), 70, t));
    });
    pts.forEach((p, i) => b.seg(p, pts[(i + 1) % 5], { cls: 'accent' }));
    b.poly('ABCDE', pts, { fill: false, cls: 'accent' });
    const n2 = ['F', 'G', 'H', 'K', 'L'];
    const q = n2.map((nm, i) => {
      const t = (-90 + i * 72) * DEG;
      return b.at(nm, pol(V(90, 5), 42, t), { step: 1 });
    });
    q.forEach((p, i) => b.seg(p, q[(i + 1) % 5], { step: 1 }));
    b.poly('FGHKL', q, { fill: false, step: 1 });
    cap(b, 'similar polygons  as  squares on corresponding sides', -92);
  }
};
FIGS['b6:prop:21'] = {
  build(b) {
    const A = b.at('A', V(-110, 30));
    b.seg(A, add(A, V(50, 0))); b.seg(add(A, V(50, 0)), add(A, V(40, -55))); b.seg(add(A, V(40, -55)), A);
    const B = b.at('B', V(10, 50), { step: 1 });
    b.seg(B, add(B, V(80, 0)), { step: 1 }); b.seg(add(B, V(80, 0)), add(B, V(60, -80)), { step: 1 });
    b.seg(add(B, V(60, -80)), B, { step: 1 });
    const C = b.at('C', V(-40, -10), { step: 1 });
    b.seg(C, add(C, V(36, 0)), { cls: 'accent', step: 1 });
    b.seg(add(C, V(36, 0)), add(C, V(28, -40)), { cls: 'accent', step: 1 });
    b.seg(add(C, V(28, -40)), C, { cls: 'accent', step: 1 });
    cap(b, 'A ~ C  and  B ~ C  ⇒  A ~ B', -92);
  }
};
FIGS['b6:prop:22'] = {
  build(b) {
    const A = b.at('A', V(-140, 40), { dir: [-1, 0] });
    const B = b.at('B', V(-140, 5), { dir: [-1, 0] });
    b.seg(A, add(A, V(70, 0)), { id: 'seg:AB', name: 'AB', cls: 'accent' });
    const C = b.at('C', V(-40, 40)); const D = b.at('D', V(30, 40));
    b.seg(C, D, { cls: 'accent' });
    const E = b.at('E', V(-140, -40), { dir: [-1, 0], step: 1 });
    const F = b.at('F', V(-40, -40), { step: 1 });
    b.seg(E, add(E, V(55, 0)), { id: 'seg:EF', name: 'EF', step: 1 });
    const Gg = b.at('G', V(50, -40), { step: 1 }); const H = b.at('H', V(130, -40), { step: 1 });
    b.seg(Gg, H, { step: 1 });
    cap(b, 'AB : CD  =  EF : GH  ⇒  similar figures proportional', -78);
  }
};
FIGS['b6:prop:23'] = {
  build(b) {
    const p = P(b, {
      A: [-120, -20], C: [-20, -20], B: [-100, 50], D: [0, 50],
      F: [110, -20, { step: 1 }], G: [40, 55, { step: 1 }], E: [130, 55, { step: 1 }]
    });
    segs(b, p, ['AC', 'CD', 'DB', 'BA'], { cls: 'accent' });
    segs(b, p, ['CF', 'FE', 'EG', 'GC'], { step: 1 });
    cap(b, 'equiangular parallelograms: compound ratio of sides', -58);
  }
};
FIGS['b6:prop:24'] = {
  build(b) {
    const p = P(b, {
      A: [-110, -40], B: [80, -40], C: [120, 55], D: [-70, 55]
    });
    segs(b, p, ['AB', 'BC', 'CD', 'DA']);
    b.seg(p.A, p.C, { dash: '5 4' });
    const E = b.at('E', lerp(p.A, p.B, 0.42), { step: 1 });
    const K = b.at('K', lerp(p.A, p.D, 0.42), { step: 1 });
    const Pp = b.at('P', add(E, sub(K, p.A)), { step: 1 });
    p.E = E; p.K = K; p.P = Pp;
    b.seg(E, Pp, { cls: 'accent', step: 1 }); b.seg(Pp, K, { cls: 'accent', step: 1 });
    cap(b, 'parallelograms about the diameter are similar', -72);
  }
};
FIGS['b6:prop:25'] = {
  build(b) {
    const p = P(b, { A: [-120, 20], B: [-50, 20], C: [-80, -50] });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    const D = b.at('D', V(40, -20), { dir: [-1, 0], step: 1 });
    b.seg(D, add(D, V(90, 0)), { step: 1 });
    cap(b, 'similar to ABC  and  equal to a given figure on D', -78);
  }
};
FIGS['b6:prop:26'] = FIGS['b6:prop:24'];
FIGS['b6:prop:27'] = {
  build(b) {
    const A = b.at('A', V(-120, -20)); const B = b.at('B', V(120, -20));
    const C = b.at('C', mid(A, B), { dir: [0, -1] });
    b.seg(A, B);
    const h = 70, n = V(0, h);
    const D = b.at('D', add(A, n), { step: 1 }); const E = b.at('E', add(C, n), { step: 1 });
    b.seg(A, D, { step: 1 }); b.seg(D, E, { cls: 'accent', step: 1 }); b.seg(E, C, { cls: 'accent', step: 1 });
    cap(b, 'greatest parallelogram on the half', -52);
  }
};
FIGS['b6:prop:28'] = FIGS['b6:prop:29'] = {
  build(b) {
    const A = b.at('A', V(-120, -30)); const B = b.at('B', V(120, -30));
    b.seg(A, B);
    const C0 = b.at('C', V(-130, 55), { step: 1 });
    const C1 = add(C0, V(48, 0)); const C2 = add(C0, V(36, -40));
    b.seg(C0, C1, { cls: 'accent', step: 1 }); b.seg(C1, C2, { cls: 'accent', step: 1 });
    b.seg(C2, C0, { cls: 'accent', step: 1 });
    const D = b.at('D', V(30, 50), { step: 1 }); const E = b.at('E', V(110, 20), { step: 1 });
    const F = b.at('F', V(50, 5), { step: 1 });
    segs(b, { D, E, F }, ['DE', 'EF', 'FD'], { step: 1 });
    cap(b, 'apply a parallelogram equal to C, falling short / exceeding', -62);
  }
};
FIGS['b6:prop:30'] = {
  build(b) {
    const p = P(b, {
      A: [-80, -20], B: [50, -20], D: [-80, 90], C: [50, 90]
    });
    segs(b, p, ['AB', 'BC', 'CD', 'DA']);
    const M = b.at('M', mid(p.A, p.D), { dir: [-1, 0], step: 1 });
    b.circle(M, p.B, { id: 'cir:M', step: 1, role: 'scaffold' });
    const F = b.at('F', V(-80, 160), { dir: [-1, 0.2], step: 2 });
    const K = b.at('K', V(-20, -20), { dir: [0, -1], step: 2 });
    const Gg = b.at('G', V(-20, 160), { step: 2 });
    b.seg(p.A, F, { step: 2 }); b.seg(F, Gg, { step: 2 }); b.seg(Gg, K, { cls: 'accent', step: 2 });
    cap(b, 'cut AB in extreme and mean ratio at K', -52);
  }
};
FIGS['b6:prop:31'] = {
  build(b) {
    const p = P(b, { A: [-30, 40], B: [-30, -50], C: [90, -50] });
    segs(b, p, ['AB', 'BC', 'CA']);
    tri(b, 'ABC', p);
    b.ang(p.A, p.B, p.C, { square: true, r: 16 });
    b.seg(p.B, add(p.B, V(-50, 0)), { step: 1 });
    b.seg(add(p.B, V(-50, 0)), add(p.A, V(-50, 0)), { step: 1 });
    b.seg(add(p.A, V(-50, 0)), p.A, { cls: 'accent', step: 1 });
    const u = unit(sub(p.C, p.A)); const n = mul(perp(u), -50);
    b.seg(p.A, add(p.A, n), { step: 1 }); b.seg(p.C, add(p.C, n), { step: 1 });
    b.seg(add(p.A, n), add(p.C, n), { cls: 'accent', step: 1 });
    const u2 = unit(sub(p.C, p.B)); const n2 = mul(perp(u2), 55);
    b.seg(p.B, add(p.B, n2), { step: 1 }); b.seg(p.C, add(p.C, n2), { step: 1 });
    b.seg(add(p.B, n2), add(p.C, n2), { step: 1 });
    cap(b, 'similar figures on the sides: the two = the hypotenuse', -92);
  }
};
FIGS['b6:prop:32'] = {
  build(b) {
    const p = P(b, {
      A: [-100, 50], B: [-40, -20], C: [20, -20],
      D: [40, 40, { step: 1 }], E: [130, -20, { step: 1 }]
    });
    segs(b, p, ['AB', 'BC', 'CA'], { cls: 'accent' });
    tri(b, 'ABC', p);
    segs(b, p, ['DC', 'CE', 'ED'], { step: 1 });
    tri(b, 'DCE', p, { step: 1, fill: false });
    cap(b, 'corresponding sides parallel  ⇒  remaining sides in line', -58);
  }
};
FIGS['b6:prop:33'] = {
  build(b) {
    const Gg = b.at('G', V(-80, 0)); const H = b.at('H', V(80, 0), { step: 1 });
    const B = b.ptOn('B', { c: Gg, r: 70, kind: 'circle' }, 110 * DEG, { dir: [-1, 0.4] });
    const C = b.ptOn('C', { c: Gg, r: 70, kind: 'circle' }, 20 * DEG, { dir: [1, 0.2] });
    const A = b.ptOn('A', { c: Gg, r: 70, kind: 'circle' }, 200 * DEG, { dir: [-0.4, -1] });
    b.circle(Gg, B, { id: 'cir:G' });
    b.seg(Gg, B); b.seg(Gg, C);
    const E = b.ptOn('E', { c: H, r: 70, kind: 'circle' }, 110 * DEG, { dir: [-1, 0.4], step: 1 });
    const F = b.ptOn('F', { c: H, r: 70, kind: 'circle' }, 20 * DEG, { dir: [1, 0.2], step: 1 });
    const D = b.ptOn('D', { c: H, r: 70, kind: 'circle' }, 200 * DEG, { dir: [0.4, -1], step: 1 });
    b.circle(H, E, { id: 'cir:H', step: 1 });
    b.seg(H, E, { step: 1 }); b.seg(H, F, { step: 1 });
    cap(b, 'equal circles: angles as the arcs they stand on', -102);
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
