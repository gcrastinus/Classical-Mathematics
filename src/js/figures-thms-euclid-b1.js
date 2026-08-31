/* ============================================================
   figures-thms-euclid-b1.js — Euclid I.17, 21, 24–25, 36, 38–42, 44–45
   The twelve Book I propositions Augros Chapter 1 does not treat
   as their own theorems.  Same engine, same construction rules.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, ang, pol, dot,
        interCC, interLL, interLC, footOf, reflectPt, rotAbout, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function keepSide(U, Vv, sign, m) {
  return q => {
    const n = unit(perp(sub(Vv, U)));
    const d = dot(sub(q, U), n) * sign;
    return d >= m ? q : add(q, mul(n, sign * (m - d)));
  };
}
function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}
function keepOffLine(U, Vv, m) {
  return q => {
    const n = unit(perp(sub(Vv, U)));
    const d = dot(sub(q, U), n);
    if (Math.abs(d) >= m) return q;
    const s = d >= 0 ? 1 : -1;
    return add(q, mul(n, s * m - d));
  };
}

/* ============================================================
   I.17 — any two angles of a triangle < two right angles
   ============================================================ */
FIGS['b1:prop:17'] = {
  build(b) {
    const B = b.pt('B', -110, -42, { dir: [-1, -0.4] });
    const C = b.pt('C', 72, -42, { dir: [0.3, -1], clamp: minDistFrom(B, 48) });
    const A = b.pt('A', -28, 88, { dir: [-0.2, 1], clamp: keepSide(V(-110, -42), V(72, -42), 1, 40) });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    const D = b.at('D', add(C, mul(unit(sub(C, B)), 80)), { step: 1, dir: [1, -0.2] });
    b.seg(C, D, { step: 1, dash: '6 4', id: 'seg:CD' });
    b.ang(A, B, C, { r: 28, id: 'ang:ABC' });
    b.ang(A, C, B, { r: 28, id: 'ang:ACB' });
    b.ang(A, C, D, { r: 48, step: 2, id: 'ang:ACD' });
    b.ang(B, A, C, { r: 26, step: 4, id: 'ang:BAC' });
    b.text('∠ABC + ∠BCA < two right angles', V(-20, -72), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   I.21 — two lines from the ends of a side to an interior point
   ============================================================ */
FIGS['b1:prop:21'] = {
  build(b) {
    const B = b.pt('B', -108, -46, { dir: [-1, -0.4] });
    const C = b.pt('C', 96, -46, { dir: [1, -0.4], clamp: minDistFrom(B, 50) });
    const A = b.pt('A', -16, 92, { dir: [0, 1], clamp: keepSide(V(-108, -46), V(96, -46), 1, 48) });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    const D = b.pt('D', 8, 18, { dir: [0.6, 0.2], clamp: q => {
      /* keep D strictly inside triangle ABC */
      let p = q;
      [[A, B, C], [B, C, A], [C, A, B]].forEach(([U, W, Z]) => {
        const nn = unit(perp(sub(W, U)));
        const s = Math.sign(dot(sub(Z, U), nn)) || 1;
        const d = dot(sub(p, U), nn) * s;
        if (d < 14) p = add(p, mul(nn, s * (14 - d)));
      });
      return p;
    } });
    b.seg(B, D, { step: 1, id: 'seg:BD' });
    b.seg(C, D, { step: 1, id: 'seg:DC' });
    const E = b.at('E', interLL(B, sub(D, B), A, sub(C, A)), { step: 2, dir: [0.8, 0.6] });
    b.seg(D, E, { step: 2, dash: '5 4', id: 'seg:DE' });
    b.ang(B, A, C, { r: 26, id: 'ang:BAC' });
    b.ang(B, D, C, { r: 22, step: 1, id: 'ang:BDC' });
    b.text('BD + DC < BA + AC,  ∠BDC > ∠BAC', V(-8, -74), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   I.24 — hinge theorem
   ============================================================ */
FIGS['b1:prop:24'] = {
  build(b) {
    const A = b.pt('A', -200, -20, { dir: [-1, 0.2] });
    const B = b.pt('B', -118, -68, { dir: [-0.4, -1], clamp: minDistFrom(A, 36) });
    const C = b.pt('C', -92, 28, { dir: [0.3, 1], clamp: minDistFrom(A, 36) });
    b.seg(A, B, { ticks: 1, id: 'seg:AB' });
    b.seg(A, C, { ticks: 2, id: 'seg:AC' });
    b.seg(B, C, { id: 'seg:BC' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', fill: false });
    b.ang(B, A, C, { r: 28, id: 'ang:BAC' });
    const D = b.at('D', V(28, -8), { dir: [-0.2, 0.6] });
    const uDE = unit(V(0.95, -0.22));
    const E = b.at('E', add(D, mul(uDE, dist(A, B))), { dir: [1, -0.4] });
    const F = b.at('F', add(D, mul(unit(V(0.55, 0.84)), dist(A, C))), { dir: [0.6, 1] });
    b.seg(D, E, { ticks: 1, id: 'seg:DE' });
    b.seg(D, F, { ticks: 2, id: 'seg:DF' });
    b.seg(E, F, { id: 'seg:EF' });
    b.poly('DEF', [D, E, F], { id: 'poly:DEF', fill: false });
    b.ang(E, D, F, { r: 22, id: 'ang:EDF' });
    const G = b.at('G', add(D, mul(unit(sub(C, A)), dist(A, C))), { step: 1, dir: [1, 0.5] });
    b.seg(D, G, { step: 1, ticks: 2, id: 'seg:DG' });
    b.seg(E, G, { step: 1, id: 'seg:EG' });
    b.seg(F, G, { step: 1, dash: '5 4', id: 'seg:FG' });
    b.ang(E, D, G, { r: 36, step: 1, id: 'ang:EDG' });
    b.text('BC > EF', V(-40, -92), { anchor: 'middle', size: 12.5, step: 2 });
  }
};

/* ============================================================
   I.25 — converse hinge
   ============================================================ */
FIGS['b1:prop:25'] = {
  build(b) {
    const A = b.pt('A', -188, -8, { dir: [-1, 0.3] });
    const B = b.pt('B', -108, -70, { dir: [-0.3, -1], clamp: minDistFrom(A, 36) });
    const C = b.pt('C', -70, 36, { dir: [0.4, 1], clamp: minDistFrom(A, 36) });
    b.seg(A, B, { ticks: 1 }); b.seg(A, C, { ticks: 2 }); b.seg(B, C, { w: 2.4, id: 'seg:BC' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', fill: false });
    b.ang(B, A, C, { r: 30, id: 'ang:BAC' });
    const D = b.at('D', V(40, 4), { dir: [-0.2, 0.5] });
    const E = b.at('E', add(D, mul(unit(sub(B, A)), dist(A, B))), { dir: [1, -0.5] });
    const F = b.at('F', add(D, mul(unit(sub(C, A)), dist(A, C) * 0.92)), { dir: [0.7, 1] });
    b.seg(D, E, { ticks: 1 }); b.seg(D, F, { ticks: 2 }); b.seg(E, F, { id: 'seg:EF' });
    b.poly('DEF', [D, E, F], { id: 'poly:DEF', fill: false });
    b.ang(E, D, F, { r: 22, id: 'ang:EDF' });
    b.text('BC > EF  ⇒  ∠BAC > ∠EDF', V(-36, -96), { anchor: 'middle', size: 12.5, step: 1 });
  }
};

/* ============================================================
   I.36 — parallelograms on equal bases, same parallels
   ============================================================ */
FIGS['b1:prop:36'] = {
  build(b) {
    const B = b.pt('B', -130, -48, { dir: [-1, -0.4] });
    const C = b.pt('C', -28, -48, { dir: [0.2, -1], clamp: minDistFrom(B, 44) });
    const base = dist(B, C);
    const u = unit(sub(C, B));
    const F = b.ptOn('F', { a: add(C, mul(u, 28)), b: add(C, mul(u, 160)), kind: 'seg' }, 0.35,
      { dir: [0.2, -1], lo: 0.08, hi: 0.9 });
    const G = b.at('G', add(F, mul(u, base)), { dir: [1, -0.4] });
    const A = b.pt('A', -108, 56, { dir: [-0.6, 1], clamp: keepSide(V(-130, -48), V(-28, -48), 1, 50) });
    const D = b.at('D', add(A, sub(C, B)), { dir: [0, 1] });
    const E = b.at('E', add(F, sub(A, B)), { dir: [0.3, 1] });
    const H = b.at('H', add(E, sub(G, F)), { dir: [1, 0.5] });
    b.seg(add(B, mul(u, -36)), add(G, mul(u, 40)), { id: 'par:low' });
    b.seg(add(A, mul(u, -36)), add(H, mul(u, 36)), { id: 'par:high' });
    b.poly('ABCD', [A, B, C, D], { id: 'poly:ABCD', fill: false });
    b.poly('EFGH', [E, F, G, H], { id: 'poly:EFGH', fill: false });
    b.tick(B, C, 1); b.tick(F, G, 1);
    b.seg(B, E, { step: 1, dash: '5 4', id: 'seg:BE' });
    b.seg(C, H, { step: 1, dash: '5 4', id: 'seg:CH' });
    b.poly('EBCH', [E, B, C, H], { step: 2, id: 'poly:EBCH', cls: 'tri1' });
    b.text('ABCD = EFGH in area', add(mid(B, G), V(0, -28)), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   I.38 — triangles on equal bases, same parallels
   ============================================================ */
FIGS['b1:prop:38'] = {
  build(b) {
    const B = b.pt('B', -120, -44, { dir: [-1, -0.4] });
    const C = b.pt('C', -22, -44, { dir: [0.2, -1], clamp: minDistFrom(B, 42) });
    const base = dist(B, C);
    const u = unit(sub(C, B));
    const E = b.at('E', add(C, mul(u, 48)), { dir: [0.2, -1] });
    const F = b.at('F', add(E, mul(u, base)), { dir: [1, -0.4] });
    const A = b.pt('A', -86, 62, { dir: [-0.5, 1], clamp: keepSide(V(-120, -44), V(-22, -44), 1, 48) });
    const D = b.at('D', add(E, sub(A, B)), { dir: [0.4, 1] });
    const G = b.at('G', add(B, sub(A, C)), { dir: [-1, 0.4] });
    const H = b.at('H', add(F, sub(D, E)), { dir: [1, 0.5] });
    b.seg(add(B, mul(u, -40)), add(F, mul(u, 40)), { id: 'par:low' });
    b.seg(add(G, mul(u, -20)), add(H, mul(u, 20)), { id: 'par:high' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', cls: 'tri1' });
    b.poly('DEF', [D, E, F], { id: 'poly:DEF', cls: 'tri2' });
    b.tick(B, C, 1); b.tick(E, F, 1);
    b.seg(B, G, { step: 1, dash: '4 3', id: 'seg:BG' });
    b.seg(A, G, { step: 1, dash: '4 3' });
    b.seg(F, H, { step: 1, dash: '4 3', id: 'seg:FH' });
    b.seg(D, H, { step: 1, dash: '4 3' });
    b.poly('GBCA', [G, B, C, A], { step: 2, fill: false, id: 'poly:GBCA' });
    b.poly('DEFH', [D, E, F, H], { step: 2, fill: false, id: 'poly:DEFH' });
    b.text('△ABC = △DEF in area', add(mid(B, F), V(0, -26)), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   I.39 — equal triangles on the same base ⇒ same parallels
   ============================================================ */
FIGS['b1:prop:39'] = {
  build(b) {
    const B = b.pt('B', -90, -48, { dir: [-1, -0.4] });
    const C = b.pt('C', 70, -48, { dir: [1, -0.4], clamp: minDistFrom(B, 48) });
    const A = b.pt('A', -48, 70, { dir: [-0.5, 1], clamp: keepSide(V(-90, -48), V(70, -48), 1, 44) });
    /* D on the line through A parallel to BC, so △DBC = △ABC by I.37 */
    const D = b.ptOn('D', { a: A, b: add(A, sub(C, B)), kind: 'seg' }, 0.72,
      { dir: [0.8, 1], lo: 0.2, hi: 0.95 });
    const u = unit(sub(C, B));
    b.seg(add(B, mul(u, -40)), add(C, mul(u, 40)), { id: 'par:low' });
    b.seg(add(A, mul(u, -50)), add(D, mul(u, 50)), { id: 'par:high' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', cls: 'tri1' });
    b.poly('DBC', [D, B, C], { id: 'poly:DBC', cls: 'tri2' });
    b.seg(A, D, { step: 1, id: 'seg:AD' });
    const E = b.at('E', add(A, mul(u, dist(A, D) * 0.55)), { step: 2, until: 3, dir: [1, 0.2] });
    b.seg(A, E, { step: 2, until: 3, dash: '5 4', id: 'seg:AE' });
    b.seg(E, C, { step: 2, until: 3, dash: '5 4', id: 'seg:EC' });
    b.text('AD ∥ BC', add(mid(A, D), V(0, 16)), { size: 12.5, step: 4, anchor: 'middle' });
  }
};

/* ============================================================
   I.40 — equal triangles on equal bases ⇒ same parallels
   ============================================================ */
FIGS['b1:prop:40'] = {
  build(b) {
    const B = b.pt('B', -140, -46, { dir: [-1, -0.4] });
    const C = b.pt('C', -18, -46, { dir: [0, -1], clamp: minDistFrom(B, 44) });
    const base = dist(B, C);
    const u = unit(sub(C, B));
    const E = b.at('E', add(C, mul(u, base)), { dir: [1, -0.4] });
    const A = b.pt('A', -108, 62, { dir: [-0.5, 1], clamp: keepSide(V(-140, -46), V(-18, -46), 1, 46) });
    const D = b.at('D', add(C, sub(A, B)), { dir: [0.5, 1] });
    b.seg(add(B, mul(u, -36)), add(E, mul(u, 36)), { id: 'par:low' });
    b.seg(add(A, mul(u, -36)), add(D, mul(u, 36)), { id: 'par:high' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', cls: 'tri1' });
    b.poly('CDE', [C, D, E], { id: 'poly:CDE', cls: 'tri2' });
    b.tick(B, C, 1); b.tick(C, E, 1);
    b.seg(A, D, { step: 1, id: 'seg:AD' });
    b.text('AD ∥ BE', add(mid(A, D), V(0, 16)), { size: 12.5, step: 2, anchor: 'middle' });
  }
};

/* ============================================================
   I.41 — parallelogram double a triangle on the same base
   ============================================================ */
FIGS['b1:prop:41'] = {
  build(b) {
    const B = b.pt('B', -70, -48, { dir: [-1, -0.4] });
    const C = b.pt('C', 58, -48, { dir: [1, -0.4], clamp: minDistFrom(B, 46) });
    const A = b.pt('A', -40, 58, { dir: [-0.6, 1], clamp: keepSide(V(-70, -48), V(58, -48), 1, 46) });
    const D = b.at('D', add(A, sub(C, B)), { dir: [1, 0.5] });
    const E = b.ptOn('E', { a: A, b: D, kind: 'seg' }, 0.62, { dir: [0.3, 1], lo: 0.2, hi: 0.85 });
    const u = unit(sub(C, B));
    b.seg(add(B, mul(u, -40)), add(C, mul(u, 40)), { id: 'par:low' });
    b.seg(add(A, mul(u, -40)), add(D, mul(u, 40)), { id: 'par:high' });
    b.poly('ABCD', [A, B, C, D], { id: 'poly:ABCD', fill: false });
    b.poly('EBC', [E, B, C], { id: 'poly:EBC', cls: 'tri1' });
    b.seg(A, C, { step: 1, dash: '5 4', id: 'seg:AC' });
    b.poly('ABC', [A, B, C], { step: 2, id: 'poly:ABC', cls: 'tri2' });
    b.text('ABCD = 2 · △EBC', add(mid(B, C), V(0, -26)), { anchor: 'middle', size: 12.5, step: 3 });
  }
};

/* ============================================================
   I.42 — parallelogram equal to a given triangle, in a given angle
   ============================================================ */
FIGS['b1:prop:42'] = {
  build(b) {
    const B = b.pt('B', -80, -40, { dir: [-1, -0.4] });
    const C = b.pt('C', 70, -40, { dir: [1, -0.4], clamp: minDistFrom(B, 48) });
    const A = b.pt('A', -18, 78, { dir: [0, 1], clamp: keepSide(V(-80, -40), V(70, -40), 1, 44) });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', cls: 'tri1' });
    const E = b.at('E', mid(B, C), { step: 1, dir: [0, -1] });
    b.seg(A, E, { step: 1, dash: '4 3', id: 'seg:AE' });
    /* given angle D, off to the right */
    const Dv = b.at('D', V(148, 18), { dir: [1, 0.4] });
    const Dp = b.at('D₁', add(Dv, V(-28, -36)), { show: false });
    const Dq = b.at('D₂', add(Dv, V(36, -8)), { show: false });
    b.seg(Dp, Dv, { id: 'seg:Dleg1' }); b.seg(Dv, Dq, { id: 'seg:Dleg2' });
    b.ang(Dp, Dv, Dq, { r: 22, id: 'ang:D' });
    b.text('∠D', add(Dv, V(18, 16)), { size: 12 });
    /* copy the angle at E on EC */
    const uEC = unit(sub(C, E));
    const uEF = rotAbout(add(E, uEC), E, ang(sub(Dq, Dv)) - ang(sub(Dp, Dv)));
    const F = b.at('F', add(E, mul(unit(sub(uEF, E)), 54)), { step: 2, dir: [0.8, -0.2] });
    b.seg(E, F, { step: 2, id: 'seg:EF' });
    b.ang(C, E, F, { r: 24, step: 2, id: 'ang:CEF' });
    /* AG through A ∥ EC; CG through C ∥ EF; they meet at G */
    const Gp = b.at('G', interLL(A, sub(C, E), C, sub(F, E)), { step: 3, dir: [1, 0.5] });
    b.seg(A, Gp, { step: 3, dash: '4 3', id: 'seg:AG' });
    b.seg(C, Gp, { step: 3, id: 'seg:CG' });
    b.seg(F, Gp, { step: 3, id: 'seg:FG' });
    b.poly('FECG', [F, E, C, Gp], { step: 4, id: 'poly:FECG' });
    b.text('FECG = △ABC,  ∠FEC = ∠D', V(10, -72), { anchor: 'middle', size: 12, step: 4 });
  }
};

/* ============================================================
   I.44 — apply a parallelogram to a given line
   ============================================================ */
FIGS['b1:prop:44'] = {
  build(b) {
    const A = b.pt('A', -150, -20, { dir: [-1, 0] });
    const B = b.pt('B', -40, -20, { dir: [0.2, -1], clamp: minDistFrom(A, 40) });
    b.seg(A, B, { id: 'seg:AB' });
    /* given triangle C */
    const C1 = b.at('C', V(132, 70), { dir: [0.2, 1] });
    const C2 = b.at('C₂', V(88, 18), { dir: [-0.4, -0.2] });
    const C3 = b.at('C₃', V(168, 18), { dir: [1, -0.2] });
    b.poly('C', [C1, C2, C3], { id: 'poly:C', cls: 'tri1' });
    b.text('△C', add(C1, V(8, 14)), { size: 12 });
    /* given angle D */
    const Dv = b.at('D', V(132, -56), { dir: [1, -0.3] });
    b.seg(add(Dv, V(-24, -18)), Dv); b.seg(Dv, add(Dv, V(32, -6)));
    b.ang(add(Dv, V(-24, -18)), Dv, add(Dv, V(32, -6)), { r: 18, id: 'ang:D' });
    b.text('∠D', add(Dv, V(20, 12)), { size: 12 });
    /* parallelogram applied to AB: BEFG with BE onward from AB */
    const u = unit(sub(B, A));
    const n = mul(unit(perp(u)), 52);
    const E = b.at('E', add(B, mul(u, 70)), { step: 1, dir: [1, 0] });
    const G = b.at('G', add(B, n), { step: 1, dir: [0.2, 1] });
    const F = b.at('F', add(E, n), { step: 1, dir: [1, 0.5] });
    b.poly('BEFG', [B, E, F, G], { step: 1, fill: false, id: 'poly:BEFG' });
    const H = b.at('H', add(A, n), { step: 2, dir: [-0.6, 1] });
    b.seg(A, H, { step: 2, dash: '5 4', id: 'seg:AH' });
    b.seg(H, F, { step: 2, dash: '5 4', id: 'seg:HF' });
    b.seg(H, B, { step: 2, dash: '4 3', id: 'seg:HB' });
    b.poly('ABGH', [A, B, G, H], { step: 3, id: 'poly:ABGH' });
    b.text('ABGH = △C,  ∠ABG = ∠D', V(-20, -78), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   I.45 — parallelogram equal to a given rectilinear figure
   ============================================================ */
FIGS['b1:prop:45'] = {
  build(b) {
    const A = b.pt('A', -130, -8, { dir: [-1, 0.2] });
    const B = b.pt('B', -40, -52, { dir: [0, -1], clamp: minDistFrom(A, 36) });
    const C = b.pt('C', 70, -40, { dir: [1, -0.4], clamp: minDistFrom(B, 36) });
    const D = b.pt('D', 18, 48, { dir: [0.4, 1], clamp: keepSide(V(-40, -52), V(70, -40), 1, 36) });
    b.poly('ABCD', [A, B, C, D], { id: 'poly:ABCD', fill: false });
    b.seg(D, B, { step: 1, dash: '5 4', id: 'seg:DB' });
    /* given angle E */
    const Ev = b.at('E', V(150, 8), { dir: [1, 0.3] });
    b.seg(add(Ev, V(-22, -20)), Ev); b.seg(Ev, add(Ev, V(30, -8)));
    b.ang(add(Ev, V(-22, -20)), Ev, add(Ev, V(30, -8)), { r: 18, id: 'ang:E' });
    b.text('∠E', add(Ev, V(18, 14)), { size: 12 });
    /* two parallelograms of equal angles sharing GH */
    const u = unit(V(1, 0.08));
    const n = mul(unit(perp(u)), 46);
    const K = b.at('K', V(-150, -88), { step: 2, dir: [-1, -0.4] });
    const F = b.at('F', add(K, mul(u, 70)), { step: 2, dir: [0.2, -1] });
    const H = b.at('H', add(K, n), { step: 2, dir: [-0.4, 1] });
    const Gp = b.at('G', add(F, n), { step: 2, dir: [0.4, 1] });
    b.poly('FKHG', [F, K, H, Gp], { step: 2, fill: false, id: 'poly:FH' });
    const M = b.at('M', add(Gp, mul(u, 78)), { step: 3, dir: [1, 0.3] });
    const N = b.at('N', add(M, n), { show: false });
    const P = b.at('P', add(F, mul(u, 78)), { step: 3, dir: [1, -0.4] });
    b.poly('GMP', [Gp, M, add(M, n), add(Gp, n)], { step: 3, fill: false, id: 'poly:GM' });
    const Q = b.at('Q', add(Gp, n), { step: 3, dir: [0.2, 1] });
    const R = b.at('R', add(M, n), { step: 3, dir: [1, 1] });
    b.seg(Gp, Q); b.seg(M, R); b.seg(Q, R);
    b.text('the two parallelograms together = ABCD', V(-10, -118), { anchor: 'middle', size: 12, step: 4 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
