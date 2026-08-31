/* ============================================================
   figures-defs.js — figures for the definitions, postulates and
   further principles.  All coordinates are y-UP.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, ang, pol, interCC, interLL, interLC, footOf, rotAbout, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

/* ---------- the gold brick (definitions 1-4) ---------- */
function brick(b, emphasis) {
  const w = 130, hd = 62, off = V(46, 34);
  const H = b.at('H', V(0, 0), { show: false });
  const L = b.at('L', V(w, 0), { show: false });
  const Lb = V(w + off.x, off.y);
  const W = V(off.x, off.y);
  const Hd = V(0, -hd), Ld = V(w, -hd), Lbd = V(w + off.x, off.y - hd), Wd = V(off.x, off.y - hd);
  // shaded faces give the solid its three-dimensional look
  b.face([H, L, Lb, W], { shade: 0.30, id: 'face:top', cls: emphasis === 'surface' ? 'accent' : '' });
  b.face([H, L, Ld, Hd], { shade: 0.16, id: 'face:front' });
  b.face([L, Lb, Lbd, Ld], { shade: 0.10, id: 'face:right' });
  [[Hd, Wd], [Wd, W], [Wd, Lbd]].forEach(([p, q], i) => b.seg(p, q, { id: 'hid' + i, dash: '4 4', role: 'scaffold', w: 1 }));
  const E = [[H, L], [L, Lb], [Lb, W], [W, H], [H, Hd], [L, Ld], [Lb, Lbd], [Hd, Ld], [Ld, Lbd]];
  E.forEach(([p, q], i) => b.seg(p, q, { id: 'edge' + i }));
  b.seg(H, L, { id: 'seg:HL', cls: emphasis === 'line' ? 'accent' : '' });
  b.mark('H', H, { dir: [-1, -0.2], big: emphasis === 'point', cls: emphasis === 'point' ? 'accent' : '' });
  b.mark('L', L, { dir: [1, -0.2] });
  b.mark('W', W, { dir: [-0.6, 1] });
  b.mark('D', Hd, { dir: [-1, -0.3] });
  return { H, L, W, Hd, Lb, Ld };
}
const cap = (b, s, y) => b.text(s, V(65, y === undefined ? -100 : y), { anchor: 'middle', size: 12.5 });
/* the same part again, lifted out of the solid and set down below it */
const DROP = V(0, -168);
function apart(b, title) {
  b.text(title, add(V(65, -104), V(0, 0)), { anchor: 'middle', size: 12.5 });
  b.seg(V(-24, -122), V(178, -122), { id: 'rule', role: 'scaffold', w: 1, dash: '2 5' });
}
function lab(b, s, at, dx, dy) { b.text(s, at, { dx: dx || 0, dy: dy || 0, size: 15, italic: true, anchor: 'middle' }); }

FIGS['def:1'] = { build(b) { brick(b); cap(b, 'a gold brick: it has length HL, width HW and depth HD'); } };

FIGS['def:2'] = {
  build(b) {
    const g = brick(b, 'surface');
    apart(b, 'the top face, taken by itself');
    const f = [g.H, g.L, g.Lb, g.W].map(p => add(p, DROP));
    b.face(f, { shade: 0.3, id: 'face:alone', cls: 'accent' });
    b.poly('surface', f, { fill: false, id: 'poly:alone', cls: 'accent' });
    lab(b, 'H', f[0], -13, -4); lab(b, 'L', f[1], 13, -4); lab(b, 'W', f[3], -14, 4);
    b.text('a surface: length and width, no depth at all', add(V(65, -238), V(0, 0)),
      { anchor: 'middle', size: 12.5 });
  }
};
FIGS['def:3'] = {
  build(b) {
    const g = brick(b, 'line');
    apart(b, 'the edge HL, taken by itself');
    const a = add(g.H, DROP), c = add(g.L, DROP);
    b.seg(a, c, { id: 'seg:alone', cls: 'accent' });
    lab(b, 'H', a, -13, 0); lab(b, 'L', c, 13, 0);
    b.text('a line: length, with no width and no depth', add(V(65, -206), V(0, 0)),
      { anchor: 'middle', size: 12.5 });
  }
};
FIGS['def:4'] = {
  build(b) {
    const g = brick(b, 'point');
    apart(b, 'the corner H, taken by itself');
    const a = add(g.H, V(65, -168));
    b.at('H₁', a, { label: '', big: true, cls: 'accent', id: 'pt:alone' });
    lab(b, 'H', a, 0, 16);
    b.text('a point: no length, no width, no depth — only a place', add(V(65, -206), V(0, 0)),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 5. straight line / curved line ---------- */
FIGS['def:5'] = {
  build(b) {
    const A = b.pt('A', -95, 40), B = b.pt('B', 60, 40);
    b.seg(A, B, { name: 'straight line' });
    b.text('straight: perfectly uniform, every part like every other', mid(A, B),
      { dy: 14, anchor: 'middle', size: 12.5 });
    const C = b.at('C', V(-95, -40)), D = b.at('D', V(60, -40));
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      pts.push(V(C.x + (D.x - C.x) * t, C.y + 22 * Math.sin(t * Math.PI * 2)));
    }
    b.poly('curve', pts, { close: false, fill: false, id: 'curve' });
    b.text('curved: no two parts alike', mid(C, D), { dy: -34, anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 6. plane ---------- */
FIGS['def:6'] = {
  build(b) {
    const P = [V(-90, -20), V(40, -50), V(110, 20), V(-20, 50)];
    b.face(P, { shade: 0.18, id: 'plane' });
    b.poly('plane', P, { fill: false, id: 'planeedge' });
    b.text('a flat surface, or plane: uniform all over', V(10, -74), { anchor: 'middle', size: 12.5 });
    b.seg(V(-90, 86), V(110, 86), { id: 'edgeon' });
    b.text('seen edge-on, a plane looks like a straight line', V(10, 96), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 7. plane angle ---------- */
FIGS['def:7'] = {
  build(b) {
    const B = b.pt('B', -40, -30), A = b.pt('A', -55, 70), C = b.pt('C', 75, -30);
    b.seg(B, A); b.seg(B, C);
    b.ang(A, B, C, { label: '1', r: 26 });
    b.ang(A, B, C, { label: '2', r: 46, id: 'ang:ext', reflex: true, cls: 'faintang' });
    b.text('1 = the interior angle ABC   ·   2 = the exterior inclination', V(10, -56),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 8. rectilineal angle ---------- */
FIGS['def:8'] = {
  build(b) {
    const E = b.pt('E', -50, -25), D = b.pt('D', -34, 66), F = b.pt('F', 80, -25);
    b.seg(E, D); b.seg(E, F);
    b.ang(D, E, F, { r: 26 });
    b.text('angle DEF: two straight lines meeting at E', V(15, -48), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 9. right angle ---------- */
FIGS['def:9'] = {
  build(b) {
    const C = b.at('C', V(-95, 0), { dir: [-1, 0] }), D = b.at('D', V(95, 0), { dir: [1, 0] });
    const B = b.at('B', V(0, 0), { dir: [0, -1] });
    const A = b.at('A', V(0, 95), { dir: [0, 1] });
    b.seg(C, D); b.seg(B, A);
    b.ang(C, B, A, { label: '1', r: 30, lr: 46 });
    b.ang(A, B, D, { label: '2', r: 30, lr: 46 });
    b.text('AB stands on CD making ∠1 = ∠2', V(0, -28), { anchor: 'middle', size: 12.5 });
    /* one of them, taken by itself */
    b.seg(V(-110, -58), V(110, -58), { id: 'rule', role: 'scaffold', w: 1, dash: '2 5' });
    b.text('either angle, taken by itself', V(0, -76), { anchor: 'middle', size: 12.5 });
    const V0 = V(-42, -172), Vr = V(42, -172), Vu = V(-42, -88);
    b.seg(V0, Vr, { id: 'ra1', cls: 'accent' }); b.seg(V0, Vu, { id: 'ra2', cls: 'accent' });
    b.ang(Vr, b.at('v', V0, { show: false }), Vu, { square: true, r: 18, id: 'ang:alone', cls: 'accent' });
    b.text('a right angle', V(0, -192), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 10. perpendicular ---------- */
FIGS['def:10'] = {
  build(b) {
    const C = b.at('C', V(-95, 0), { dir: [-1, 0] }), D = b.at('D', V(95, 0), { dir: [1, 0] });
    const B = b.at('B', V(0, 0), { dir: [0, -1] }), A = b.at('A', V(0, 90), { dir: [0, 1] });
    b.seg(C, D); b.seg(B, A, { name: 'AB' });
    b.ang(C, B, A, { square: true, r: 22 });
    b.ang(A, B, D, { square: true, r: 22, id: 'ang:ABD' });
    b.text('AB is perpendicular to CD', V(0, -30), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 11. obtuse and acute ---------- */
FIGS['def:11'] = {
  build(b) {
    const C = b.at('C', V(-95, 0), { dir: [-1, 0] }), D = b.at('D', V(95, 0), { dir: [1, 0] });
    const B = b.at('B', V(0, 0), { dir: [0, -1] });
    const A = b.at('A', V(0, 95), { dir: [0, 1] });
    const E = b.at('E', pol(V(0, 0), 95, 44 * DEG), { dir: [0.7, 0.7] });
    b.seg(C, D); b.seg(B, A); b.seg(B, E);
    b.ang(C, B, A, { square: true, r: 19 });
    b.ang(C, B, E, { label: '1', r: 40, lr: 58, ldir: [-0.55, 0.83] });
    b.ang(E, B, D, { label: '2', r: 62, lr: 78, id: 'ang:EBD', ldir: [0.72, 0.3] });
    b.text('∠1 (= ∠CBE) is acute; ∠2 (= ∠EBD) is obtuse', V(0, -28), { anchor: 'middle', size: 12.5 });
    b.seg(V(-120, -58), V(120, -58), { id: 'rule', role: 'scaffold', w: 1, dash: '2 5' });
    b.text('each angle, taken by itself', V(0, -76), { anchor: 'middle', size: 12.5 });
    const p1 = V(-150, -150), p2 = V(66, -150);
    b.seg(p1, add(p1, V(84, 0)), { id: 'ac1', cls: 'accent' });
    b.seg(p1, add(p1, mul(unit(V(Math.cos(52 * DEG), Math.sin(52 * DEG))), 84)), { id: 'ac2', cls: 'accent' });
    b.ang(add(p1, V(84, 0)), b.at('v1', p1, { show: false }), add(p1, mul(V(Math.cos(52 * DEG), Math.sin(52 * DEG)), 84)),
      { r: 24, id: 'ang:acute', cls: 'accent' });
    b.text('acute', add(p1, V(46, -26)), { anchor: 'middle', size: 12.5 });
    b.seg(p2, add(p2, V(84, 0)), { id: 'ob1', cls: 'accent' });
    b.seg(p2, add(p2, mul(unit(V(Math.cos(128 * DEG), Math.sin(128 * DEG))), 84)), { id: 'ob2', cls: 'accent' });
    b.ang(add(p2, V(84, 0)), b.at('v2', p2, { show: false }), add(p2, mul(V(Math.cos(128 * DEG), Math.sin(128 * DEG)), 84)),
      { r: 30, id: 'ang:obtuse', cls: 'accent' });
    b.text('obtuse', add(p2, V(4, -26)), { anchor: 'middle', size: 12.5 });
    b.text('less than a right angle · greater than a right angle', V(-16, -196),
      { anchor: 'middle', size: 12 });
  }
};

/* ---------- 12. supplementary / complementary ---------- */
FIGS['def:12'] = {
  build(b) {
    const C = b.at('C', V(-95, 0), { dir: [-1, 0] }), D = b.at('D', V(95, 0), { dir: [1, 0] });
    const B = b.at('B', V(0, 0), { dir: [0, -1] });
    const A = b.at('A', V(0, 95), { dir: [0, 1] });
    const E = b.at('E', pol(V(0, 0), 95, 44 * DEG), { dir: [0.7, 0.7] });
    b.seg(C, D); b.seg(B, A); b.seg(B, E);
    b.ang(C, B, E, { label: '1', r: 34, lr: 52, ldir: [-0.55, 0.83] });
    b.ang(E, B, D, { label: '2', r: 58, lr: 74, id: 'ang:EBD', ldir: [0.72, 0.3] });
    b.ang(E, B, A, { label: '3', r: 22, lr: 40, id: 'ang:EBA', ldir: [0.28, 0.96] });
    b.text('∠CBE + ∠EBD = two right angles — supplementary', V(0, -30), { anchor: 'middle', size: 12.5 });
    b.text('∠CBE + ∠EBA = one right angle — complementary', V(0, -50), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 13. boundary ---------- */
FIGS['def:13'] = {
  build(b) {
    const O = V(-76, 6);
    b.circle(b.at('c', O, { show: false }), 46, { id: 'sphere' });
    const eq = [];
    for (let i = 0; i <= 40; i++) {
      const t = Math.PI * 2 * i / 40;
      eq.push(V(O.x + 46 * Math.cos(t), O.y + 15 * Math.sin(t)));
    }
    b.poly('equator', eq, { fill: false, id: 'equator', dash: '4 4', role: 'scaffold', close: false });
    b.text('a sphere is bounded by one surface', V(-76, -60), { anchor: 'middle', size: 12.5 });
    const S = [V(34, -40), V(126, -40), V(126, 52), V(34, 52)];
    b.poly('square', S, { fill: true, id: 'sq' });
    b.text('a square, by four lines', V(80, -60), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 14. figure ---------- */
FIGS['def:14'] = {
  build(b) {
    const F = b.at('F', V(-118, 46), { dir: [-1, 0] }), Gp = b.at('G', V(-28, 46), { dir: [1, 0] });
    b.seg(F, Gp);
    b.arrowSeg(V(-102, 78), V(-64, 22), { id: 'thru1' });
    b.text('you can pass through a line', V(-73, -4), { anchor: 'middle', size: 12.5 });
    b.text('without crossing its ends', V(-73, -22), { anchor: 'middle', size: 12.5 });
    const H = b.at('H', V(24, -40), { dir: [-0.7, -0.7] }), K = b.at('K', V(52, 58), { dir: [0, 1] }),
      L = b.at('L', V(126, -40), { dir: [0.9, -0.5] });
    b.poly('HKL', [H, K, L], { fill: true });
    b.arrowSeg(V(-6, 26), V(66, 6), { id: 'thru2' });
    b.text('a triangle cannot be entered', V(76, -60), { anchor: 'middle', size: 12.5 });
    b.text('without crossing a side', V(76, -78), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 15-18. the circle ---------- */
function circleFig(b, o = {}) {
  const C = b.at('C', V(0, 0), { dir: o.cdir || [-0.7, -0.7] });
  const R = 88;
  const cir = b.circle(C, R, { id: 'cir:C' });
  const A = b.at('A', pol(C, R, -125 * DEG));
  const D = b.at('D', pol(C, R, 118 * DEG));
  const E = b.at('E', pol(C, R, 62 * DEG));
  const B = b.at('B', pol(C, R, -8 * DEG));
  const F = b.at('F', pol(C, R, -62 * DEG));
  return { C, R, cir, A, B, D, E, F };
}
FIGS['def:15'] = {
  build(b) {
    const { C, A, B, D, E, F } = circleFig(b);
    [A, D, E, B, F].forEach((p, i) => b.seg(C, p, { dash: '4 3', w: 1, role: 'scaffold', id: 'r' + i }));
    b.text('every point of the boundary is the same distance from C', V(0, -112),
      { anchor: 'middle', size: 12.5 });
  }
};
FIGS['def:16'] = {
  build(b) {
    circleFig(b);
    b.text('C is the centre; the curve ADEBF is the circumference', V(0, -112),
      { anchor: 'middle', size: 12.5 });
  }
};
FIGS['def:17'] = {
  build(b) {
    const { C, A, B, D } = circleFig(b, { cdir: [0.55, -0.9] });
    b.seg(C, D, { name: 'CD' });
    b.seg(A, C); b.seg(C, B);
    b.text('CD is a radius   ·   ACB is a diameter', V(0, -108), { anchor: 'middle', size: 12.5 });
    b.seg(V(-120, -134), V(120, -134), { id: 'rule', role: 'scaffold', w: 1, dash: '2 5' });
    b.text('each of them, taken by itself', V(0, -152), { anchor: 'middle', size: 12.5 });
    const r = dist(C, D);
    const r0 = V(-r / 2, -186), r1 = add(r0, V(r, 0));
    b.seg(r0, r1, { id: 'rad:alone', cls: 'accent' });
    lab(b, 'C', r0, -13, 0); lab(b, 'D', r1, 13, 0);
    b.text('a radius — centre to circumference', mid(r0, r1), { dy: -20, anchor: 'middle', size: 12 });
    const d0 = V(-r, -240), d1 = add(d0, V(2 * r, 0)), dm = mid(d0, d1);
    b.seg(d0, d1, { id: 'dia:alone', cls: 'accent' });
    b.at('c₂', dm, { label: '', big: true, id: 'pt:dmid' });
    lab(b, 'A', d0, -13, 0); lab(b, 'C', dm, 0, 15); lab(b, 'B', d1, 13, 0);

    b.text('a diameter — right across, through the centre', mid(d0, d1), { dy: -20, anchor: 'middle', size: 12 });
  }
};
FIGS['def:18'] = {
  build(b) {
    const C = b.at('C', V(0, 0), { dir: [0, -1] });
    const R = 88;
    const A = b.at('A', V(-R, 0), { dir: [-1, -0.2] }), B = b.at('B', V(R, 0), { dir: [1, -0.2] });
    b.at('D', pol(C, R, 140 * DEG)); b.at('E', pol(C, R, 45 * DEG));
    b.arc(C, R, 0, Math.PI, { id: 'semi' });
    b.seg(A, B, { name: 'AB' });
    b.text('the semicircle: the diameter AB with the arc ADEB', V(0, -26),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 19. rectilineal figures ---------- */
FIGS['def:19'] = {
  build(b) {
    b.poly('tri', [V(-140, -35), V(-70, 55), V(-30, -35)], { fill: true, id: 'p1' });
    b.text('triangle', V(-85, -52), { anchor: 'middle', size: 12.5 });
    b.poly('quad', [V(10, -35), V(0, 45), V(80, 55), V(95, -30)], { fill: true, id: 'p2' });
    b.text('quadrilateral', V(46, -52), { anchor: 'middle', size: 12.5 });
    const O = V(180, 10), pts = [];
    for (let i = 0; i < 5; i++) pts.push(pol(O, 48, (90 + i * 72) * DEG));
    b.poly('pent', pts, { fill: true, id: 'p3' });
    b.text('polygon', V(180, -52), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 20. equilateral / isosceles / scalene ---------- */
FIGS['def:20'] = {
  build(b) {
    const A = b.at('A', V(-160, -30), { dir: [-0.8, -0.6] }), C = b.at('C', V(-70, -30), { dir: [0.8, -0.6] });
    const B = b.at('B', interCC(A, 90, C, 90, 1), { dir: [0, 1] });
    b.poly('ABC', [A, B, C], { fill: true });
    [[A, B], [B, C], [C, A]].forEach(([p, q], i) => b.tick(p, q, 1, { id: 'tk' + i }));
    b.text('equilateral', V(-115, -50), { anchor: 'middle', size: 12.5 });
    const E = b.at('E', V(-24, -30), { dir: [-0.8, -0.6] }), F = b.at('F', V(66, -30), { dir: [0.8, -0.6] });
    const D = b.at('D', interCC(E, 104, F, 104, 1), { dir: [0, 1] });
    b.poly('DEF', [D, E, F], { fill: true });
    b.tick(D, E, 1, { id: 'tk4' }); b.tick(D, F, 1, { id: 'tk5' });
    b.text('isosceles', V(21, -50), { anchor: 'middle', size: 12.5 });
    const Gp = b.at('G', V(112, -30), { dir: [-0.8, -0.6] }), K = b.at('K', V(220, -30), { dir: [0.9, -0.5] });
    const H = b.at('H', V(138, 58), { dir: [-0.3, 1] });
    b.poly('GHK', [Gp, H, K], { fill: true });
    b.text('scalene', V(166, -50), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 21. right / obtuse / acute triangles ---------- */
FIGS['def:21'] = {
  build(b) {
    const M = b.at('M', V(-160, -30), { dir: [-0.8, -0.6] }), L = b.at('L', V(-76, -30), { dir: [0.9, -0.4] }),
      N = b.at('N', V(-160, 60), { dir: [-0.8, 0.6] });
    b.poly('LMN', [L, M, N], { fill: true });
    b.ang(L, M, N, { square: true, r: 17 });
    b.text('right', V(-118, -50), { anchor: 'middle', size: 12.5 });
    b.text('NL = hypotenuse', mid(N, L), { dx: 16, dy: 10, size: 11.5, italic: true });
    const P = b.at('P', V(-14, -30), { dir: [-0.3, -1] }), O = b.at('O', V(84, -30), { dir: [0.9, -0.4] }),
      Q = b.at('Q', V(-64, 40), { dir: [-0.6, 0.8] });
    b.poly('OPQ', [O, P, Q], { fill: true });
    b.ang(O, P, Q, { r: 24, id: 'ang:OPQ' });
    b.text('obtuse', V(10, -50), { anchor: 'middle', size: 12.5 });
    const S = b.at('S', V(126, -30), { dir: [-0.8, -0.6] }), T = b.at('T', V(220, -30), { dir: [0.9, -0.5] }),
      R = b.at('R', V(168, 62), { dir: [0, 1] });
    b.poly('RST', [R, S, T], { fill: true });
    b.text('acute', V(173, -50), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 22. parallel ---------- */
FIGS['def:22'] = {
  build(b) {
    const A = b.at('A', V(-90, 30), { dir: [-1, 0] }), B = b.at('B', V(90, 30), { dir: [1, 0] });
    const C = b.at('C', V(-90, -30), { dir: [-1, 0] }), D = b.at('D', V(90, -30), { dir: [1, 0] });
    b.seg(A, B, { name: 'AB' }); b.seg(C, D, { name: 'CD' });
    b.text('AB ∥ CD — however far they are extended, they never meet', V(0, -52),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 23. quadrilaterals (two rows) ---------- */
FIGS['def:23'] = {
  build(b) {
    const s = 70;
    /* top row: square, rectangle, rhombus */
    const y = 40;
    const E = b.at('E', V(-190, y + s), { dir: [-0.8, 0.6] }), F = b.at('F', V(-190 + s, y + s), { dir: [0.8, 0.6] }),
      Gq = b.at('G', V(-190 + s, y), { dir: [0.8, -0.6] }), H = b.at('H', V(-190, y), { dir: [-0.8, -0.6] });
    b.poly('EFGH', [E, F, Gq, H], { fill: true });
    [[E, F], [F, Gq], [Gq, H], [H, E]].forEach(([p, q], i) => b.tick(p, q, 1, { id: 'q' + i }));
    b.ang(F, E, H, { square: true, r: 13 });
    b.text('square', V(-155, y - 22), { anchor: 'middle', size: 12.5 });
    const K = b.at('K', V(-80, y + s), { dir: [-0.8, 0.6] }), L = b.at('L', V(20, y + s), { dir: [0.8, 0.6] }),
      Mq = b.at('M', V(20, y), { dir: [0.8, -0.6] }), Nq = b.at('N', V(-80, y), { dir: [-0.8, -0.6] });
    b.poly('KLMN', [K, L, Mq, Nq], { fill: true });
    b.ang(L, K, Nq, { square: true, r: 13 });
    b.text('rectangle', V(-30, y - 22), { anchor: 'middle', size: 12.5 });
    const O = b.at('O', V(66, y), { dir: [-0.8, -0.6] }), Pq = b.at('P', V(146, y), { dir: [0.8, -0.6] });
    const Rq = b.at('R', add(O, mul(unit(V(0.45, 1)), 80)), { dir: [-0.8, 0.6] }),
      Q = b.at('Q', add(Pq, mul(unit(V(0.45, 1)), 80)), { dir: [0.8, 0.6] });
    b.poly('OPQR', [O, Pq, Q, Rq], { fill: true });
    [[O, Pq], [Pq, Q], [Q, Rq], [Rq, O]].forEach(([p, q], i) => b.tick(p, q, 1, { id: 'r' + i }));
    b.text('rhombus', V(122, y - 22), { anchor: 'middle', size: 12.5 });
    /* bottom row: parallelogram, trapezium */
    const y2 = -100;
    const St = b.at('S', V(-150, y2), { dir: [-0.8, -0.6] }), Tt = b.at('T', V(-54, y2), { dir: [0.8, -0.6] });
    const Vq = b.at('V', add(St, V(38, 74)), { dir: [-0.8, 0.6] }), U = b.at('U', add(Tt, V(38, 74)), { dir: [0.8, 0.6] });
    b.poly('STUV', [St, Tt, U, Vq], { fill: true });
    b.text('parallelogram', V(-56, y2 - 22), { anchor: 'middle', size: 12.5 });
    const Wq = b.at('W', V(50, y2), { dir: [-0.8, -0.6] }), Z = b.at('Z', V(160, y2), { dir: [0.8, -0.6] }),
      Y = b.at('Y', V(132, y2 + 62), { dir: [0.9, 0.4] }), Xq = b.at('X', V(74, y2 + 78), { dir: [-0.5, 0.9] });
    b.poly('WXYZ', [Wq, Xq, Y, Z], { fill: true });
    b.text('trapezium', V(105, y2 - 22), { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- 24. inclined toward each other ---------- */
FIGS['def:24'] = {
  build(b) {
    const P = V(-60, 45), Q = V(-60, -45);
    const A = b.at('A', V(-140, 62), { dir: [-1, 0.3] }), B = b.at('B', V(-140, -62), { dir: [-1, -0.3] });
    const A2 = V(130, 12), B2 = V(130, -12);
    b.ray(P, Q, { both: true, id: 'ray:C' });
    b.text('C', V(-52, 84), { size: 13, italic: true });
    b.seg(A, A2, { id: 'lineA' }); b.seg(B, B2, { id: 'lineB' });
    b.ang(A2, P, Q, { label: '1', r: 26, lr: 44 });
    b.ang(A, P, V(-60, 90), { label: '3', r: 26, lr: 44, id: 'ang:3' });
    b.ang(V(-60, 90), Q, B2, { label: '2', r: 26, lr: 44, id: 'ang:2' });
    b.ang(B, Q, V(-60, -90), { label: '4', r: 26, lr: 44, id: 'ang:4' });
    b.text('if ∠1 + ∠2 is less than ∠3 + ∠4, the two lines are inclined to the right', V(0, -86),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- postulates ---------- */
FIGS['post:1'] = {
  build(b) {
    const A = b.pt('A', -80, 0, { dir: [-1, 0] }), B = b.pt('B', 80, 0, { dir: [1, 0] });
    b.seg(A, B);
    b.text('a straight line may be drawn from any point to any point', mid(A, B),
      { dy: -22, anchor: 'middle', size: 12.5 });
  }
};
FIGS['post:2'] = {
  build(b) {
    const A = b.pt('A', -100, 0, { dir: [-1, 0] }), B = b.pt('B', 20, 0, { dir: [0, -1] });
    b.seg(A, B);
    const C = b.at('C', add(B, mul(unit(sub(B, A)), 84)), { dir: [0, 1] });
    b.seg(B, C, { dash: '6 4', id: 'ext' });
    b.arrowSeg(C, add(C, mul(unit(sub(B, A)), 26)), { id: 'arr' });
    b.text('AB may be extended, as far as you please', V(-10, -26), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['post:3'] = {
  build(b) {
    const P = b.pt('P', 0, 0, { dir: [0.7, -0.7] });
    const L = b.pt('L', -60, 60, { dir: [-0.7, 0.7] });
    b.circle(P, L, { id: 'cir:P' });
    b.seg(P, L, { name: 'PL' });
    b.text('a circle about any centre P, with any given radius PL', V(0, -104),
      { anchor: 'middle', size: 12.5 });
  }
};
FIGS['post:4'] = {
  build(b) {
    const B = V(-64, -20), C = V(-134, -20), D = V(6, -20), A = V(-64, 62);
    b.seg(C, D, { id: 's1' }); b.seg(B, A, { id: 's2' });
    b.ang(C, B, A, { label: '1', square: true, r: 20, lr: 40 });
    b.ang(A, B, D, { label: '2', square: true, r: 20, lr: 40, id: 'ang:2' });
    const Q = V(96, -20), R = V(96, 62), S = V(176, -20), Sl = V(96, -20);
    b.seg(Q, S, { id: 's3' }); b.seg(Q, R, { id: 's4' });
    b.ang(S, Q, R, { label: '3', square: true, r: 20, lr: 40, id: 'ang:3' });
    b.text('all right angles are equal — adjacent or not', V(20, -48), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['post:5'] = {
  build(b) {
    const P = V(-70, 50), Q = V(-70, -50);
    b.ray(P, Q, { both: true, id: 'ray:C' });
    b.text('C', V(-62, 84), { size: 13, italic: true });
    const dA = unit(V(1, -0.16)), dB = unit(V(1, 0.16));
    const X = b.at('X', interLL(P, dA, Q, dB), { dir: [1, 0] });
    const A0 = add(P, mul(dA, -68)), B0 = add(Q, mul(dB, -68));
    b.seg(A0, X, { id: 'lineA' });
    b.seg(B0, X, { id: 'lineB' });
    b.text('A', A0, { dx: -13, size: 13, italic: true });
    b.text('B', B0, { dx: -13, size: 13, italic: true });
    b.ang(X, P, Q, { label: '1', r: 26, lr: 44 });
    b.ang(A0, P, V(-70, 92), { label: '3', r: 26, lr: 44, id: 'ang:3' });
    b.ang(V(-70, 92), Q, X, { label: '2', r: 26, lr: 44, id: 'ang:2' });
    b.ang(B0, Q, V(-70, -92), { label: '4', r: 26, lr: 44, id: 'ang:4' });
    b.text('∠1 + ∠2 less than ∠3 + ∠4 ⇒ A and B must meet at X', V(6, -86),
      { anchor: 'middle', size: 12.5 });
  }
};

/* ---------- further principles ---------- */
FIGS['prin:two-lines'] = {
  build(b) {
    const A = b.pt('A', -85, 0, { dir: [-1, 0] }), B = b.pt('B', 85, 0, { dir: [1, 0] });
    b.seg(A, B);
    const m = mid(A, B);
    b.poly('bent', [A, add(m, V(0, 40)), B], { close: false, fill: false, dash: '6 4', id: 'other' });
    b.text('two straight lines cannot enclose a space,', V(0, -22), { anchor: 'middle', size: 12.5 });
    b.text('so they cannot cut one another twice', V(0, -40), { anchor: 'middle', size: 12.5 });
  }
};
FIGS['prin:halves'] = {
  build(b) {
    const rows = [34, -34];
    rows.forEach((y, i) => {
      const A = V(-90, y), B = V(70, y), M = mid(A, B);
      b.seg(A, M, { id: 'h' + i + 'a', ticks: 1 });
      b.seg(M, B, { id: 'h' + i + 'b', ticks: 1 });
      b.seg(add(M, V(0, 8)), add(M, V(0, -8)), { id: 'm' + i, w: 1.3 });
      b.text(i ? 'and its halves are equal to the halves of the other' : 'this whole is equal to that whole',
        V(-10, y + (i ? -26 : 16)), { anchor: 'middle', size: 12.5 });
    });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
