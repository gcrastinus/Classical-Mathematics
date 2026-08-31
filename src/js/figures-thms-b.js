/* ============================================================
   figures-thms-b.js — Theorems 21 … 37, plus the two "hooks"
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
/** square built outward on PQ, away from point `away`; returns [P,Q,R,S] */
function squareOn(P, Q, away) {
  const d = dist(P, Q), n1 = mul(unit(perp(sub(Q, P))), d), n2 = mul(n1, -1);
  const n = (away && dist(add(mid(P, Q), n1), away) > dist(add(mid(P, Q), n2), away)) ? n1 : n2;
  return [P, Q, add(Q, n), add(P, n), unit(n)];
}
/** squareOn with side hysteresis kept in the figure state, so a drag that
    skims the boundary cannot make the square flap between sides */
function squareOnKeyed(b, key, P, Q, away) {
  const d = dist(P, Q), n1 = mul(unit(perp(sub(Q, P))), d), n2 = mul(n1, -1);
  const d1 = dist(add(mid(P, Q), n1), away), d2 = dist(add(mid(P, Q), n2), away);
  let pick = d1 > d2 ? 1 : -1;
  const prev = b.state['__sq:' + key];
  if (prev !== undefined && Math.abs(d1 - d2) < d * 0.2) pick = prev;
  b.state['__sq:' + key] = pick;
  const n = pick === 1 ? n1 : n2;
  return [P, Q, add(Q, n), add(P, n), unit(n)];
}
/** keep a dragged point at least m away from P (guards degenerate figures) */
function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}

/* ============================================================
   THEOREM 21 — Angle-Side-Angle
   ============================================================ */
FIGS['thm:21'] = {
  build(b) {
    const A = b.pt('A', -205, -45, { dir: [-1, -0.4] });
    const B = b.pt('B', -95, -45, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const C = b.pt('C', -165, 62, { dir: [-0.4, 1], clamp: minDistFrom(B, 30) });
    const t = V(215, 0);
    const D = b.at('D', add(A, t), { dir: [-1, -0.4] });
    const E = b.at('E', add(B, t), { dir: [1, -0.4] });
    const F = b.at('F', add(C, t), { dir: [-0.4, 1] });
    b.seg(A, B, { ticks: 1 }); b.seg(A, C); b.seg(B, C);
    b.seg(D, E, { ticks: 1 }); b.seg(D, F); b.seg(E, F);
    b.ang(B, A, C, { r: 24 }); b.ang(E, D, F, { r: 24 });
    b.ang(C, B, A, { r: 24, n: 2 }); b.ang(F, E, D, { r: 24, n: 2 });
    b.seg(A, add(A, mul(unit(sub(C, A)), dist(A, C) * 1.26)), { step: 3, until: 5, dash: '5 4', id: 'rayAC' });
    b.seg(B, add(B, mul(unit(sub(C, B)), dist(B, C) * 1.26)), { step: 4, until: 5, dash: '5 4', id: 'rayBC' });
    b.poly('ABC', [A, B, C], { step: 6 }); b.poly('DEF', [D, E, F], { step: 6 });
  }
};

/* ============================================================
   THEOREM 22 — Angle-Angle-Side
   ============================================================ */
FIGS['thm:22'] = {
  build(b) {
    const A = b.pt('A', -205, -45, { dir: [-1, -0.4] });
    const B = b.pt('B', -92, -45, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const C = b.pt('C', -172, 70, { dir: [-0.5, 1], clamp: minDistFrom(B, 30) });
    const t = V(218, 0);
    const D = b.at('D', add(A, t), { dir: [-1, -0.4] });
    const E = b.at('E', add(B, t), { dir: [1, -0.4] });
    const F = b.at('F', add(C, t), { dir: [-0.5, 1] });
    b.seg(A, B, { ticks: 1, id: 'seg:AB' }); b.seg(A, C, { id: 'seg:AC' }); b.seg(B, C, { id: 'seg:BC' });
    b.seg(D, E, { ticks: 1, id: 'seg:DE' }); b.seg(D, F, { id: 'seg:DF' }); b.seg(E, F, { id: 'seg:EF' });
    b.ang(B, A, C, { r: 24, id: 'ang:A' }); b.ang(E, D, F, { r: 24, id: 'ang:D' });
    b.ang(B, C, A, { r: 24, n: 2, id: 'ang:C' });
    b.ang(E, F, D, { r: 24, n: 2, id: 'ang:F' }); /* ∠EFD — compared with ∠C′ on line 3 */
    /* C′ on DF (supposed landing of C when AC < DF) */
    const Cq = b.at('C′', lerp(D, F, 0.72), { step: 3, until: 4, dir: [0.9, 0.2] });
    b.seg(E, Cq, { step: 3, until: 4, dash: '5 4', id: 'seg:ECq' });
    b.ang(E, Cq, D, { r: 22, n: 2, step: 3, until: 4, id: 'ang:Cq' }); /* ∠EC′D */
    b.link('C′', 'pt:C′'); b.link("C'", 'pt:C′');
    b.link('C′', 'ang:Cq'); b.link("C'", 'ang:Cq');
    b.link('∠C′', 'ang:Cq'); b.link("∠C'", 'ang:Cq');
    b.link('∠F', 'ang:F');
    b.text('an exterior angle would equal a remote interior angle — impossible', add(mid(D, E), V(10, -34)), { anchor: 'middle', size: 12, step: 3, until: 4 });
    b.poly('ABC', [A, B, C], { step: 5 }); b.poly('DEF', [D, E, F], { step: 5 });
  }
};

/* ============================================================
   THEOREM 23 — equal alternate angles ⇒ parallel
   ============================================================ */
FIGS['thm:23'] = {
  build(b) {
    const A = b.at('A', V(-150, 52), { dir: [-1, 0.3] }), Bp = b.at('B', V(150, 52), { dir: [1, 0.3] });
    const C = b.at('C', V(-150, -52), { dir: [-1, -0.3] }), D = b.at('D', V(150, -52), { dir: [1, -0.3] });
    b.seg(A, Bp, { id: 'seg:AB' }); b.seg(C, D, { id: 'seg:CD' });
    const E = b.ptOn('E', { a: A, b: Bp, kind: 'seg' }, 0.42, { dir: [0, 1], lo: 0.2, hi: 0.7 });
    const F = b.ptOn('F', { a: C, b: D, kind: 'seg' }, 0.60, { dir: [0, -1], lo: 0.3, hi: 0.8 });
    b.seg(add(E, mul(unit(sub(E, F)), 34)), add(F, mul(unit(sub(F, E)), 34)), { id: 'seg:EF' });
    b.ang(A, E, F, { label: '1', r: 30, id: 'ang:1' }); /* exterior in the reductio */
    b.ang(E, F, D, { label: '2', r: 30, id: 'ang:2' }); /* remote interior */
    /* reductio: EB and FD extended meet at X (hypothesis they are not parallel) */
    const X = b.at('X', V(238, 0), { step: 2, until: 4, dir: [1, 0] });
    b.seg(E, X, { step: 2, until: 4, dash: '5 4', id: 'seg:EX' });
    b.seg(F, X, { step: 2, until: 4, dash: '5 4', id: 'seg:FX' });
    b.link('EX', 'seg:EX'); b.link('XE', 'seg:EX'); b.link('FX', 'seg:FX'); b.link('XF', 'seg:FX');
    b.link('EB', 'seg:EX'); b.link('FD', 'seg:FX'); /* named by the lines that meet at X */
    b.text('suppose they met at X …', V(150, -84), { anchor: 'middle', size: 12, step: 2, until: 4 });
    b.text('AB ∥ CD', V(-108, 82), { anchor: 'middle', size: 13, step: 5 });
  }
};

/* ============================================================
   THEOREM 24 — co-interior angles supplementary ⇒ parallel
   ============================================================ */
FIGS['thm:24'] = {
  build(b) {
    const A = b.at('A', V(-150, 52), { dir: [-1, 0.3] }), Bp = b.at('B', V(150, 52), { dir: [1, 0.3] });
    const C = b.at('C', V(-150, -52), { dir: [-1, -0.3] }), D = b.at('D', V(150, -52), { dir: [1, -0.3] });
    b.seg(A, Bp); b.seg(C, D);
    const E = b.ptOn('E', { a: A, b: Bp, kind: 'seg' }, 0.42, { dir: [0, 1], lo: 0.2, hi: 0.7 });
    const F = b.ptOn('F', { a: C, b: D, kind: 'seg' }, 0.60, { dir: [0, -1], lo: 0.3, hi: 0.8 });
    b.seg(add(E, mul(unit(sub(E, F)), 34)), add(F, mul(unit(sub(F, E)), 34)), { id: 'seg:EF' });
    b.ang(A, E, F, { label: '1', r: 34, step: 3 });
    b.ang(F, E, Bp, { label: '2', r: 26 });
    b.ang(E, F, D, { label: '3', r: 26, id: 'ang:EFD' });
    b.text('AB ∥ CD', V(-108, 82), { anchor: 'middle', size: 13, step: 5 });
  }
};

/* ============================================================
   THEOREM 25 — parallels ⇒ equal alternate angles
   ============================================================ */
FIGS['thm:25'] = {
  build(b) {
    const A = b.at('A', V(-150, 52), { dir: [-1, 0.3] }), Bp = b.at('B', V(150, 52), { dir: [1, 0.3] });
    const C = b.at('C', V(-150, -52), { dir: [-1, -0.3] }), D = b.at('D', V(150, -52), { dir: [1, -0.3] });
    b.seg(A, Bp); b.seg(C, D);
    const Gp = b.ptOn('G', { a: A, b: Bp, kind: 'seg' }, 0.40, { dir: [-0.3, 1], lo: 0.2, hi: 0.7 });
    const H = b.ptOn('H', { a: C, b: D, kind: 'seg' }, 0.58, { dir: [0.3, -1], lo: 0.3, hi: 0.8 });
    const E = b.at('E', add(Gp, mul(unit(sub(Gp, H)), 40)), { dir: [0, 1] });
    const F = b.at('F', add(H, mul(unit(sub(H, Gp)), 40)), { dir: [0, -1] });
    b.seg(E, F, { id: 'seg:EF' });
    b.ang(A, Gp, H, { label: '1', r: 32, step: 1 });
    b.ang(Gp, H, D, { label: '3', r: 26, id: 'ang:GHD', step: 1 });
    b.ang(H, Gp, Bp, { label: '2', r: 26, step: 2 });
    b.text('∠1 = ∠3   ·   ∠2 + ∠3 = two right angles', V(-40, 86), { anchor: 'middle', size: 12, step: 6 });
  }
};

/* ============================================================
   THEOREM 26 — transitivity of parallelism
   ============================================================ */
FIGS['thm:26'] = {
  build(b) {
    const ys = [72, 0, -72];
    const names = ['A', 'B', 'C'];
    const pts = [];
    const dirv = unit(V(0.42, -1));
    const O = V(0, 0);
    ys.forEach((y, i) => {
      const P = interLL(V(0, y), V(1, 0), O, dirv);
      pts.push(P);
      b.seg(V(-155, y), V(155, y), { id: 'line:' + names[i], name: names[i] });
      b.text(names[i], V(-155, y), { dx: -14, dy: 0, size: 13, italic: true });
    });
    b.seg(add(pts[0], mul(dirv, -46)), add(pts[2], mul(dirv, 46)), { step: 2, id: 'seg:D', name: 'D' });
    b.text('D', add(pts[0], mul(dirv, -50)), { dy: 10, size: 13, italic: true });
    const left = i => V(-120, ys[i]), right = i => V(120, ys[i]);
    b.ang(left(0), pts[0], pts[1], { label: '1', r: 28, step: 2, id: 'ang:1' });
    b.ang(pts[0], pts[1], right(1), { label: '2', r: 28, step: 2, id: 'ang:2' });
    b.ang(left(1), pts[1], pts[2], { label: '3', r: 28, step: 2, id: 'ang:3' });
    b.ang(pts[1], pts[2], right(2), { label: '4', r: 28, step: 2, id: 'ang:4' });
  }
};

/* ============================================================
   THEOREM 27 — a parallel through a given point
   ============================================================ */
FIGS['thm:27'] = {
  build(b) {
    const A = b.at('A', V(-150, -50), { dir: [-1, 0] }), Bp = b.at('B', V(150, -50), { dir: [1, 0] });
    b.seg(A, Bp);
    const P = b.pt('P', -40, 62, { dir: [0, 1], clamp: keepSide(V(-150, -50), V(150, -50), 1, 40) });
    const X = b.ptOn('X', { a: A, b: Bp, kind: 'seg' }, 0.42, { step: 1, dir: [0, -1], lo: 0.2, hi: 0.8 });
    b.seg(P, X, { step: 1 });
    const uPX = unit(sub(X, P));
    const L = b.at('L', add(P, mul(unit(sub(Bp, A)), -dist(P, X) * 0.9)), { step: 2, dir: [-0.6, 0.6] });
    const L2 = b.at('L₂', add(P, mul(unit(sub(Bp, A)), dist(P, X) * 1.05)), { step: 3, dir: [1, 0.4], show: false });
    b.seg(L, L2, { step: 2, id: 'seg:PL' });
    b.ang(L, P, X, { r: 30, step: 2, id: 'ang:LPX' });
    b.ang(P, X, Bp, { r: 30, step: 2, id: 'ang:PXB' });
    b.text('PL ∥ AB', add(P, V(80, 22)), { size: 13, step: 3 });
  }
};

/* ============================================================
   THEOREM 28 — angle sum of a triangle
   ============================================================ */
FIGS['thm:28'] = {
  build(b) {
    const B = b.pt('B', -120, -45, { dir: [-1, -0.4] });
    const C = b.pt('C', 78, -45, { dir: [-0.2, -1], clamp: minDistFrom(B, 40) });
    const A = b.pt('A', -40, 92, { dir: [-0.2, 1], clamp: keepSide(V(-120, -45), V(78, -45), 1, 40) });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    const X = b.at('X', add(C, mul(unit(sub(C, B)), 92)), { step: 1, dir: [1, -0.2] });
    b.seg(C, X, { step: 1, dash: '6 4' });
    const P = b.at('P', add(C, mul(unit(sub(A, B)), dist(A, B) * 0.86)), { step: 2, dir: [0.4, 1] });
    b.seg(C, P, { step: 2, dash: '4 3' });
    b.ang(B, C, A, { label: '1', r: 30 });
    b.ang(B, A, C, { label: '2', r: 30, id: 'ang:BAC' });
    b.ang(A, B, C, { label: '3', r: 30, id: 'ang:ABC' });
    b.ang(A, C, P, { label: '4', r: 30, step: 3, id: 'ang:ACP' });
    b.ang(P, C, X, { label: '5', r: 30, step: 3, id: 'ang:PCX' });
    b.text('1 + 2 + 3 = two right angles', V(-20, -70), { anchor: 'middle', size: 12, step: 7 });
  }
};

/* ============================================================
   THEOREM 29 — the third angle
   ============================================================ */
FIGS['thm:29'] = {
  build(b) {
    const A = b.pt('A', -205, -45, { dir: [-1, -0.4] });
    const B = b.pt('B', -88, -45, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const C = b.pt('C', -170, 66, { dir: [-0.5, 1], clamp: minDistFrom(B, 30) });
    const g = V((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
    const s = 0.78, t = V(216, -6);
    const map = p => add(add(g, mul(sub(p, g), s)), t);
    const D = b.at('D', map(A), { dir: [-1, -0.4] });
    const E = b.at('E', map(B), { dir: [1, -0.4] });
    const F = b.at('F', map(C), { dir: [-0.5, 1] });
    b.seg(A, B); b.seg(B, C); b.seg(C, A);
    b.seg(D, E); b.seg(E, F); b.seg(F, D);
    b.ang(B, A, C, { label: '1', r: 26, step: 1 }); b.ang(C, B, A, { label: '2', r: 26, step: 1, id: 'ang:2' });
    b.ang(E, D, F, { label: '4', r: 22, step: 1, id: 'ang:4' }); b.ang(F, E, D, { label: '5', r: 22, step: 1, id: 'ang:5' });
    b.ang(A, C, B, { label: '3', r: 26, step: 2, id: 'ang:3' });
    b.ang(D, F, E, { label: '6', r: 22, step: 2, id: 'ang:6' });
    b.text('∠3 = ∠6', mid(mid(A, B), mid(D, E)), { dy: -30, anchor: 'middle', size: 12.5, step: 4 });
  }
};

/* ============================================================
   THEOREM 30 — one pair parallel and equal ⇒ parallelogram
   ============================================================ */
FIGS['thm:30'] = {
  build(b) {
    const A = b.pt('A', -95, -48, { dir: [-1, -0.4] });
    const B = b.pt('B', 48, -48, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const D = b.pt('D', -42, 48, { dir: [-1, 0.5], clamp: keepSide(V(-95, -48), V(48, -48), 1, 34) });
    const C = b.at('C', add(D, sub(B, A)), { dir: [1, 0.5] });
    /* given: AB ∥ DC and AB = DC (one tick each) */
    b.seg(A, B, { ticks: 1, id: 'seg:AB' });
    b.seg(D, C, { ticks: 1, id: 'seg:DC' });
    b.seg(A, D, { id: 'seg:AD' }); /* outline of the quadrilateral from the start */
    b.seg(B, C, { id: 'seg:BC' });
    b.link('DC', 'seg:DC'); b.link('CD', 'seg:DC');
    /* line 1: diagonal BD */
    b.seg(B, D, { step: 1, dash: '5 4', id: 'seg:BD' });
    /* line 2: alternate angles for AB ∥ DC with transversal BD */
    b.ang(A, B, D, { r: 26, step: 2, id: 'ang:ABD' });
    b.ang(B, D, C, { r: 26, step: 2, id: 'ang:BDC' });
    b.link('ABD', 'ang:ABD'); b.link('∠ABD', 'ang:ABD');
    b.link('BDC', 'ang:BDC'); b.link('∠BDC', 'ang:BDC');
    /* line 3: the two triangles on the diagonal */
    b.poly('ABD', [A, B, D], { step: 3, id: 'poly:ABD' });
    b.poly('CDB', [C, D, B], { step: 3, id: 'poly:CDB' });
    b.link('ABD', 'poly:ABD'); b.link('CDB', 'poly:CDB'); b.link('BCD', 'poly:CDB');
    /* line 4: SAS — common side BD (two ticks); AB=DC already one tick; included angles equal */
    b.tick(B, D, 2, { step: 4, id: 'tick:BD' });
    /* line 5: equality ticks on AD, BC + alternate angles ∠ADB and ∠DBC */
    b.tick(A, D, 2, { step: 5, id: 'tick:AD' });
    b.tick(B, C, 2, { step: 5, id: 'tick:BC' });
    b.ang(A, D, B, { r: 28, step: 5, id: 'ang:ADB' });
    b.ang(D, B, C, { r: 28, step: 5, id: 'ang:DBC' });
    b.link('ADB', 'ang:ADB'); b.link('∠ADB', 'ang:ADB');
    b.link('DBC', 'ang:DBC'); b.link('∠DBC', 'ang:DBC');
    b.poly('ABCD', [A, B, C, D], { step: 6 });
    b.text('AD ∥ BC and AD = BC', V(-24, -74), { anchor: 'middle', size: 12, step: 6 });
  }
};

/* ============================================================
   THEOREM 31 — properties of a parallelogram
   ============================================================ */
FIGS['thm:31'] = {
  build(b) {
    const A = b.pt('A', -100, -48, { dir: [-1, -0.4] });
    const B = b.pt('B', 44, -48, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const D = b.pt('D', -46, 48, { dir: [-1, 0.5], clamp: keepSide(V(-100, -48), V(44, -48), 1, 34) });
    const C = b.at('C', add(D, sub(B, A)), { dir: [1, 0.5] });
    b.poly('ABCD', [A, B, C, D], { fill: false, id: 'para' });
    b.seg(A, B, { ticks: 1 }); b.seg(D, C, { ticks: 1 });
    b.seg(A, D, { ticks: 2 }); b.seg(B, C, { ticks: 2 });
    b.seg(A, C, { step: 1, dash: '5 4', id: 'seg:AC' });
    b.ang(B, A, C, { r: 26, step: 2 }); b.ang(D, C, A, { r: 26, step: 2, id: 'ang:DCA' });
    b.ang(B, C, A, { r: 38, n: 2, step: 2, id: 'ang:BCA' }); b.ang(D, A, C, { r: 38, n: 2, step: 2, id: 'ang:DAC' });
    b.poly('ABC', [A, B, C], { step: 5, id: 'poly:ABC' });
    b.poly('CDA', [C, D, A], { step: 5, id: 'poly:CDA' });
  }
};

/* ============================================================
   THEOREM 32 — parallelograms on the same base, same parallels
   ============================================================ */
FIGS['thm:32'] = {
  build(b) {
    const B = b.pt('B', -62, -48, { dir: [-1, -0.4] });
    const E = b.pt('E', 40, -48, { dir: [0.4, -1], clamp: minDistFrom(B, 40) });
    const A = b.pt('A', -30, 52, { dir: [-0.6, 1], clamp: keepSide(V(-62, -48), V(40, -48), 1, 60) });
    const D = b.at('D', add(A, sub(E, B)), { dir: [0, 1] });
    const C = b.ptOn('C', { a: A, b: D, kind: 'seg' }, 0.42, { dir: [0, 1], lo: 0.15, hi: 0.85 });
    const F = b.at('F', add(C, sub(E, B)), { dir: [1, 0.4] });
    const u = unit(sub(E, B));
    b.seg(add(B, mul(u, -46)), add(E, mul(u, 56)), { id: 'par:low' });
    b.seg(add(A, mul(u, -46)), add(F, mul(u, 46)), { id: 'par:high' });
    b.poly('ABED', [A, B, E, D], { id: 'poly:ABED', fill: false });
    b.poly('CBEF', [C, B, E, F], { id: 'poly:CBEF', fill: false });
    b.tick(A, D, 1); b.tick(C, F, 1); b.tick(B, E, 1);
    b.seg(A, C, { step: 2, ticks: 3 }); b.seg(D, F, { step: 2, ticks: 3 });
    b.seg(A, B, { step: 3, ticks: 2 }); b.seg(D, E, { step: 3, ticks: 2 });
    b.seg(B, C, { step: 3 }); b.seg(E, F, { step: 3 });
    b.poly('ABC', [A, B, C], { step: 3, id: 'poly:ABC', cls: 'tri1' });
    b.poly('DEF', [D, E, F], { step: 3, id: 'poly:DEF', cls: 'tri2' });
    b.text('parallelogram ABED = parallelogram CBEF in area', add(mid(B, E), V(0, -26)),
      { anchor: 'middle', size: 12, step: 4 });
  }
};

/* ============================================================
   THEOREM 33 — triangles on the same base, same parallels
   ============================================================ */
FIGS['thm:33'] = {
  build(b) {
    const A = b.pt('A', -56, -40, { dir: [-1, -0.4] });
    const B = b.pt('B', 52, -40, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const C = b.pt('C', -18, 56, { dir: [-0.5, 1], clamp: keepSide(V(-56, -40), V(52, -40), 1, 50) });
    const Gp = b.ptOn('G', { a: C, b: add(C, mul(sub(B, A), 1.7)), kind: 'seg' }, 0.34, { dir: [0.4, 1], lo: 0.08, hi: 0.95 });
    const L = b.at('L', add(B, sub(C, A)), { dir: [1, 0.5] });
    const K = b.at('K', add(A, sub(Gp, B)), { dir: [-1, 0.5] });
    const u = unit(sub(B, A));
    b.seg(add(A, mul(u, -46)), add(B, mul(u, 46)), { id: 'par:low' });
    b.seg(add(K, mul(u, -40)), add(L, mul(u, 40)), { id: 'par:high' });
    /* parallelograms on base AB in the parallels (completed on line 2) */
    b.poly('ABLC', [A, B, L, C], { step: 2, fill: false, id: 'poly:ABLC' });
    b.poly('ABGK', [A, B, Gp, K], { step: 2, fill: false, id: 'poly:ABGK' });
    b.seg(A, C, { id: 'seg:AC' }); b.seg(B, C, { id: 'seg:BC' }); b.seg(A, B, { id: 'seg:AB' });
    b.seg(A, Gp, { id: 'seg:AG' }); b.seg(B, Gp, { id: 'seg:BG' });
    b.seg(B, L, { step: 2, id: 'seg:BL' }); b.seg(C, L, { step: 2, id: 'seg:CL' });
    b.seg(A, K, { step: 2, id: 'seg:AK' }); b.seg(Gp, K, { step: 2, id: 'seg:GK' });
    /* the given triangles (always on the figure) */
    b.poly('ABC', [A, B, C], { id: 'poly:ABC', cls: 'tri1' });
    b.poly('ABG', [A, B, Gp], { id: 'poly:ABG', cls: 'tri2' });
    /*
      Line 4: each parallelogram is bisected by a diagonal into the given
      triangle and its complement (Thm. 31).
        ABLC = △ABC + △BCL  (diagonal BC)
        ABGK = △ABG + △AGK  (diagonal AG)
    */
    b.poly('BCL', [B, C, L], { id: 'poly:BCL', step: 4, cls: 'tri1' });
    b.poly('AGK', [A, Gp, K], { id: 'poly:AGK', step: 4, cls: 'tri2' });
    b.link('BCL', 'poly:BCL'); b.link('CBL', 'poly:BCL'); b.link('LBC', 'poly:BCL');
    b.link('AGK', 'poly:AGK'); b.link('AKG', 'poly:AGK'); b.link('GAK', 'poly:AGK');
    b.text('△ABC = △ABG in area', add(mid(A, B), V(0, -26)), { anchor: 'middle', size: 12, step: 5 });
  }
};

/* ============================================================
   THEOREM 34 — complements about a diagonal
   ============================================================ */
FIGS['thm:34'] = {
  build(b) {
    const A = b.pt('A', -110, -52, { dir: [-1, -0.4] });
    const B = b.pt('B', 62, -52, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    const D = b.pt('D', -62, 52, { dir: [-1, 0.5], clamp: keepSide(V(-110, -52), V(62, -52), 1, 40) });
    const C = b.at('C', add(D, sub(B, A)), { dir: [1, 0.5] });
    b.poly('ABCD', [A, B, C, D], { fill: false, id: 'para' });
    b.seg(A, C, { step: 1, id: 'seg:AC' });
    const K = b.ptOn('K', { a: A, b: C, kind: 'seg' }, 0.44, { step: 1, dir: [0.9, -0.6], lo: 0.15, hi: 0.85 });
    const uAB = unit(sub(B, A)), uAD = unit(sub(D, A));
    const P = b.at('P', interLL(K, uAB, A, uAD), { step: 1, dir: [-1, 0] });
    const Q = b.at('Q', interLL(K, uAB, B, uAD), { step: 1, dir: [1, 0] });
    const R = b.at('R', interLL(K, uAD, A, uAB), { step: 1, dir: [0, -1] });
    const S = b.at('S', interLL(K, uAD, D, uAB), { step: 1, dir: [0, 1] });
    b.seg(P, Q, { step: 1, dash: '4 3' }); b.seg(R, S, { step: 1, dash: '4 3' });
    b.poly('ARKP', [A, R, K, P], { step: 2, id: 'poly:ARKP' });
    b.poly('KQCS', [K, Q, C, S], { step: 2, id: 'poly:KQCS' });
    b.poly('RBQK', [R, B, Q, K], { step: 3, id: 'poly:RBQK', cls: 'cmp' });
    b.poly('PKSD', [P, K, S, D], { step: 3, id: 'poly:PKSD', cls: 'cmp' });
    b.text('(1)', mid(mid(R, B), mid(Q, K)), { anchor: 'middle', size: 12, step: 3 });
    b.text('(2)', mid(mid(P, K), mid(S, D)), { anchor: 'middle', size: 12, step: 3 });
    b.text('complement (1) = complement (2)', V(-24, -78), { anchor: 'middle', size: 12, step: 3 });
  }
};

/* ============================================================
   THEOREM 35 — how to make a square
   ============================================================ */
FIGS['thm:35'] = {
  build(b) {
    const A = b.pt('A', -58, -50, { dir: [-1, -0.5] });
    const B = b.pt('B', 58, -50, { dir: [1, -0.5], clamp: minDistFrom(A, 30) });
    b.seg(A, B);
    const s = dist(A, B), u = unit(sub(B, A)), n = unit(perp(sub(B, A)));
    /* the perpendicular at A, built as in Theorem 9 (faint scaffold) */
    const U1 = add(A, mul(u, -s * 0.42)), U2 = add(A, mul(u, s * 0.42));
    b.seg(A, U1, { step: 1, role: 'scaffold', dash: '4 3', id: 'ext:left' });
    const rr = s * 0.72;
    b.circle(U1, rr, { step: 1, role: 'scaffold', wide: true, id: 'cir:U1' });
    b.circle(U2, rr, { step: 1, role: 'scaffold', wide: true, id: 'cir:U2' });
    const D = b.at('D', add(A, mul(n, s)), { step: 1, dir: [-1, 0.4] });
    b.seg(A, D, { step: 1, ticks: 1 });
    const E = b.at('E', add(A, mul(n, s * 1.24)), { step: 1, dir: [-0.6, 1] });
    b.seg(D, E, { step: 1, dash: '5 4', id: 'seg:DE' });
    const C = b.at('C', add(D, sub(B, A)), { step: 2, dir: [1, 0.4] });
    b.seg(D, C, { step: 2 }); b.seg(B, C, { step: 2 });
    b.poly('ABCD', [A, B, C, D], { step: 3 });
    b.ang(B, A, D, { square: true, r: 18, step: 1, id: 'sq:A' });
    b.ang(D, A, U1, { square: true, r: 18, step: 1, id: 'sq:A2' });
    b.ang(A, B, C, { square: true, r: 18, step: 4, id: 'sq:B' });
    b.ang(B, C, D, { square: true, r: 18, step: 4, id: 'sq:C' });
    b.ang(C, D, A, { square: true, r: 18, step: 4, id: 'sq:D' });
    b.tick(A, B, 1, { step: 5 }); b.tick(B, C, 1, { step: 5 });
    b.tick(C, D, 1, { step: 5 }); b.tick(D, A, 1, { step: 5 });
  }
};

/* ============================================================
   THEOREM 36 — the Pythagorean theorem
   ============================================================ */
FIGS['thm:36'] = {
  build(b) {
    const B = b.pt('B', -78, 30, { dir: [-1, 0.3] });
    const C = b.pt('C', 78, 30, { dir: [1, 0.3], clamp: minDistFrom(B, 60) });
    const M0 = mid(B, C), Rt = dist(B, C) / 2;
    /* A rides the semicircle on BC, so the angle at A is always right */
    const A = b.ptOn('A', { c: M0, r: Rt, kind: 'circle' }, 106 * DEG, { dir: [-0.2, 1] });
    b.seg(B, C); b.seg(A, B); b.seg(A, C);
    b.ang(B, A, C, { square: true, r: 18, id: 'sq:A' });
    const [, , E, D, nBC] = squareOnKeyed(b, 'BC', B, C, A);
    const Ep = b.at('E', E, { step: 1, dir: [1, -0.4] }), Dp = b.at('D', D, { step: 1, dir: [-1, -0.4] });
    b.poly('BCED', [B, C, Ep, Dp], { id: 'poly:BCED', step: 1 });
    const [, , F, Gq] = squareOnKeyed(b, 'AB', A, B, C);
    const Fp = b.at('F', F, { step: 1, dir: [-1, -0.3] }), Gp = b.at('G', Gq, { step: 1, dir: [-1, 0.4] });
    b.poly('ABFG', [A, B, Fp, Gp], { id: 'poly:ABFG', step: 1 });
    const [, , K, Hq] = squareOnKeyed(b, 'AC', A, C, B);
    const Kp = b.at('K', K, { step: 1, dir: [1, -0.3] }), Hp = b.at('H', Hq, { step: 1, dir: [1, 0.4] });
    b.poly('ACKH', [A, C, Kp, Hp], { id: 'poly:ACKH', step: 1 });
    /* the perpendicular is drawn first; L and M are where it lands */
    const Lv = interLL(A, nBC, Dp, sub(Ep, Dp)), Mv = interLL(A, nBC, B, sub(C, B));
    const L = b.at('L', Lv, { step: 2, dir: [0, -1] });
    b.seg(A, L, { step: 2, dash: '5 4', id: 'seg:AL', name: 'AL' });
    b.ang(A, L, Dp, { square: true, r: 15, step: 2, id: 'sq:L1' });
    b.ang(Ep, L, A, { square: true, r: 15, step: 2, id: 'sq:L2' });
    const M = b.at('M', Mv, { step: 2, dir: [0.9, 0.5] });
    b.seg(A, Dp, { step: 2, id: 'seg:AD' });
    b.seg(C, Fp, { step: 2, id: 'seg:CF' });
    b.seg(Gp, C, { step: 3, dash: '3 4', role: 'scaffold', id: 'seg:GC', name: 'GAC' });
    b.poly('FBC', [Fp, B, C], { step: 4, id: 'poly:FBC', cls: 'tri1' });
    b.poly('ABD', [A, B, Dp], { step: 4, id: 'poly:ABD', cls: 'tri2' });
    /*
      Line 6 only (until: 6): double △FBC on diagonal FC → parallelogram FBCP,
      then compare to square ABFG (same base / parallels idea, Thm. 33).
      Not drawn on any other step or the finished figure.
    */
    const P6v = add(sub(add(F, C), B), V(0, 0)); /* F+C−B, opposite B through mid of FC */
    const P6 = b.at('P', P6v, { step: 6, until: 6, dir: [0.6, -0.8] });
    b.seg(Fp, P6, { step: 6, until: 6, dash: '5 4', id: 'seg:FP6', hideUntilHl: true });
    b.seg(C, P6, { step: 6, until: 6, dash: '5 4', id: 'seg:CP6', hideUntilHl: true });
    b.seg(B, P6, { step: 6, until: 6, dash: '5 4', id: 'seg:BP6', hideUntilHl: true });
    b.poly('FCP', [Fp, C, P6], { step: 6, until: 6, id: 'poly:FCP', cls: 'tri1', hideUntilHl: true });
    b.poly('FBCP', [Fp, B, C, P6], { step: 6, until: 6, id: 'poly:FBCP', hideUntilHl: true });
    /*
      Line 7 only (until: 7): double △ABD on diagonal AD → parallelogram ABDQ,
      then compare to rectangle BL.
    */
    const Q7v = add(sub(add(A, D), B), V(0, 0)); /* A+D−B */
    const Q7 = b.at('Q', Q7v, { step: 7, until: 7, dir: [-0.6, -0.8] });
    b.seg(A, Q7, { step: 7, until: 7, dash: '5 4', id: 'seg:AQ7', hideUntilHl: true });
    b.seg(Dp, Q7, { step: 7, until: 7, dash: '5 4', id: 'seg:DQ7', hideUntilHl: true });
    b.seg(B, Q7, { step: 7, until: 7, dash: '5 4', id: 'seg:BQ7', hideUntilHl: true });
    b.poly('ADQ', [A, Dp, Q7], { step: 7, until: 7, id: 'poly:ADQ', cls: 'tri2', hideUntilHl: true });
    b.poly('ABDQ', [A, B, Dp, Q7], { step: 7, until: 7, id: 'poly:ABDQ', hideUntilHl: true });
    b.poly('BMLD', [B, M, L, Dp], { step: 7, id: 'poly:BL', cls: 'rect1' });
    b.poly('MCEL', [M, C, Ep, L], { step: 8, id: 'poly:CL', cls: 'rect2' });
    /* line 8: the matching right triangle on the other leg (for ACKH = CL) */
    b.poly('AMC', [A, M, C], { step: 8, id: 'poly:AMC', cls: 'tri2' });
    b.link('AMC', 'poly:AMC'); b.link('△AMC', 'poly:AMC');
    b.text('BL', mid(mid(B, M), mid(L, Dp)), { anchor: 'middle', size: 12.5, step: 7 });
    b.text('CL', mid(mid(M, C), mid(Ep, L)), { anchor: 'middle', size: 12.5, step: 8 });
    b.text('square BCED = square ABFG + square ACKH', add(mid(Dp, Ep), V(0, -30)), { anchor: 'middle', size: 12.5, step: 9 });
  }
};

/* ============================================================
   THEOREM 37 — converse of Pythagoras
   ============================================================ */
FIGS['thm:37'] = {
  build(b) {
    const A = b.pt('A', -190, -40, { dir: [-1, -0.4] });
    const B = b.pt('B', -78, -40, { dir: [1, -0.4], clamp: minDistFrom(A, 40) });
    const n = unit(perp(sub(B, A)));
    const C = b.at('C', add(A, mul(n, 86)), { dir: [-1, 0.4] });
    b.seg(A, B, { ticks: 1 }); b.seg(A, C, { ticks: 2 }); b.seg(B, C, { ticks: 3 });
    const t = V(218, 0);
    const D = b.at('D', add(A, t), { dir: [-1, -0.4] });
    const E = b.at('E', add(B, t), { dir: [1, -0.4] });
    const F = b.at('F', add(C, t), { dir: [-1, 0.4] });
    b.seg(D, E, { step: 2, ticks: 1 }); b.seg(D, F, { step: 2, ticks: 2 }); b.seg(E, F, { step: 4, ticks: 3 });
    b.ang(E, D, F, { square: true, r: 18, step: 2, id: 'sq:D' });
    b.text('DE = AB,  DF = AC,  ∠D right', add(mid(D, E), V(24, -26)), { anchor: 'middle', size: 12, step: 2 });
    b.ang(B, A, C, { square: true, r: 18, step: 6, id: 'sq:A' });
    b.text('so ∠BAC is right too', add(mid(A, B), V(0, -26)), { anchor: 'middle', size: 12, step: 6 });
  }
};

/* ============================================================
   HOOKS
   ============================================================ */
FIGS['hook:desargues'] = {
  build(b) {
    const Vc = b.pt('V', -186, -20, { dir: [-1, 0] });
    const A = b.pt('A', -66, 74, { dir: [-0.4, 1] });
    const B = b.pt('B', -34, -46, { dir: [0, -1] });
    const C = b.pt('C', 26, 22, { dir: [0.4, 0.9] });
    const k = [1.10, 1.80, 1.30];
    const a = b.at('a', add(Vc, mul(sub(A, Vc), k[0])), { dir: [0, 1] });
    const bb = b.at('b', add(Vc, mul(sub(B, Vc), k[1])), { dir: [0, -1] });
    const c = b.at('c', add(Vc, mul(sub(C, Vc), k[2])), { dir: [0.6, 0.8] });
    b.seg(Vc, a, { dash: '4 4', role: 'scaffold', id: 'ray:a' });
    b.seg(Vc, bb, { dash: '4 4', role: 'scaffold', id: 'ray:b' });
    b.seg(Vc, c, { dash: '4 4', role: 'scaffold', id: 'ray:c' });
    b.poly('ABC', [A, B, C], { id: 'poly:ABC' });
    b.poly('abc', [a, bb, c], { id: 'poly:abc' });
    const X = b.at('X', interLL(A, sub(B, A), a, sub(bb, a)), { dir: [0, 1] });
    const Y = b.at('Y', interLL(B, sub(C, B), bb, sub(c, bb)), { dir: [0.4, 1] });
    const Z = b.at('Z', interLL(A, sub(C, A), a, sub(c, a)), { dir: [-0.4, 1] });
    /* the axis: draw right across all three points */
    const dirAx = unit(sub(Y, X));
    const ts = [X, Y, Z].map(p => dot(sub(p, X), dirAx));
    const P0 = add(X, mul(dirAx, Math.min(...ts) - 20)), P1 = add(X, mul(dirAx, Math.max(...ts) + 20));
    b.seg(P0, P1, { w: 2.2, id: 'seg:XYZ' });
    b.text('X, Y and Z always lie on one straight line', mid(P0, P1), { dy: -20, anchor: 'middle', size: 12 });
  }
};

FIGS['hook:perp-sum'] = {
  build(b) {
    const A = b.at('A', V(-90, -52), { dir: [-1, -0.4] });
    const B = b.at('B', V(90, -52), { dir: [1, -0.4] });
    const C = b.at('C', interCC(A, 180, B, 180, 1), { dir: [0, 1] });
    b.poly('ABC', [A, B, C], { fill: true });
    const P = b.pt('P', -6, 26, {
      dir: [0.6, 0.8], clamp: q => {
        // keep P inside the triangle
        const tri = [A, B, C];
        let p = q;
        for (let i = 0; i < 3; i++) {
          const U = tri[i], W = tri[(i + 1) % 3], Z = tri[(i + 2) % 3];
          const nn = unit(perp(sub(W, U)));
          const s = Math.sign(dot(sub(Z, U), nn));
          const d = dot(sub(p, U), nn) * s;
          if (d < 10) p = add(p, mul(nn, s * (10 - d)));
        }
        return p;
      }
    });
    [[A, B, 'Q'], [B, C, 'R'], [C, A, 'S']].forEach(([U, W, nm]) => {
      const Fp = b.at(nm, footOf(P, U, W), { dir: null });
      b.seg(P, Fp, { w: 2 });
      b.ang(P, Fp, U, { square: true, r: 13 });
    });
    const alt = b.at('altitude', footOf(C, A, B), { show: false });
    b.seg(C, alt, { dash: '4 4', role: 'scaffold', id: 'seg:alt' });
    b.text('PQ + PR + PS = the altitude, wherever P is', V(0, -76), { anchor: 'middle', size: 12 });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
