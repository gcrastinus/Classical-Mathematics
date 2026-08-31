/* ============================================================
   figures-thms-a.js — Theorems 1 … 20
   Every construction is done the way the proof does it:
   equilateral triangles come from two circles, cut-offs come
   from circles, midpoints from equal circles.  Lines that the
   proof never names are marked role:'scaffold' (faint, optional).
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add, sub, mul, unit, perp, mid, lerp, dist, ang, pol, interCC, interLL, interLC, footOf, reflectPt, rotAbout, DEG } = G;
const FIGS = root.FIGS || (root.FIGS = {});

/* ---- helpers ------------------------------------------------ */
/** equilateral triangle on PQ whose apex is on the far side from `away`.
    The chosen side is remembered in the figure state with hysteresis, so a
    drag that skims the boundary cannot make the apex flap back and forth. */
function equiAway(b, P, Q, name, away, o = {}) {
  const r = dist(P, Q);
  const c1 = interCC(P, r, Q, r, 1), c2 = interCC(P, r, Q, r, -1);
  let side = (away && dist(c1, away) < dist(c2, away)) ? -1 : 1;
  const key = '__side:' + name;
  const prev = b.state[key];
  if (prev !== undefined && away && Math.abs(dist(c1, away) - dist(c2, away)) < r * 0.22) {
    side = prev;                         /* indecisive: keep the old side */
  }
  b.state[key] = side;
  return b.equi(P, Q, name, Object.assign({ side }, o));
}
/** keep a dragged point strictly on one side of line UV (dist ≥ m) */
function keepSide(U, Vv, sign, m) {
  return q => {
    const n = unit(perp(sub(Vv, U)));
    const d = G.dot(sub(q, U), n) * sign;
    return d >= m ? q : add(q, mul(n, sign * (m - d)));
  };
}
/** clamp onto the perpendicular bisector of UV, at least m from the line.
    Either side is allowed, so a whole-diagram flip stays isosceles. */
function onPerpBisector(U, Vv, m) {
  return q => {
    const M = mid(U, Vv), n = unit(perp(sub(Vv, U)));
    let d = G.dot(sub(q, M), n);
    if (Math.abs(d) < m) d = (d < 0 ? -1 : 1) * m;
    return add(M, mul(n, d));
  };
}
/** keep a dragged point at least m off the line UV — whichever side */
function keepOffLine(U, Vv, m) {
  return q => {
    const n = unit(perp(sub(Vv, U)));
    const d = G.dot(sub(q, U), n);
    if (Math.abs(d) >= m) return q;
    const s = d >= 0 ? 1 : -1;
    return add(q, mul(n, s * m - d));
  };
}
/** keep a dragged point at least m away from P (guards degenerate figures) */
function minDistFrom(P, m) {
  return q => {
    const l = dist(q, P);
    return l >= m ? q : (l < 1e-9 ? add(P, V(m, 0)) : add(P, mul(sub(q, P), m / l)));
  };
}

/* ============================================================
   THEOREM 1 — equilateral triangle on AB
   ============================================================ */
FIGS['thm:1'] = {
  build(b) {
    const A = b.pt('A', -55, 0, { dir: [-1, -0.35] });
    const B = b.pt('B', 55, 0, { dir: [1, -0.35], clamp: minDistFrom(A, 26) });
    b.seg(A, B);
    const r = dist(A, B);
    const cA = b.circle(A, B, { step: 1, label: 'X', labelAng: 152, role: 'scaffold' });
    const cB = b.circle(B, A, { step: 2, label: 'Z', labelAng: 28, role: 'scaffold' });
    const C = b.at('C', interCC(A, r, B, r, 1), { step: 3, dir: [0, 1] });
    const D = b.at('D', interCC(A, r, B, r, -1), { step: 3, dir: [0, -1], role: 'scaffold' });
    b.seg(A, C, { step: 4 });
    b.seg(B, C, { step: 5 });
    b.tick(A, B, 1, { step: 8 }); b.tick(A, C, 1, { step: 8 }); b.tick(B, C, 1, { step: 8 });
    b.poly('ABC', [A, B, C], { step: 9 });
  }
};

/* ============================================================
   THEOREM 1a — Euclid I.2: place at A a line equal to BC
   ============================================================ */
FIGS['thm:1a'] = {
  build(b) {
    const A = b.pt('A', -58, 48, { dir: [-0.9, 0.5] });
    const B = b.pt('B', -6, -26, { dir: [-0.9, -0.5], clamp: minDistFrom(A, 26) });
    const C = b.pt('C', 66, -44, { dir: [0.6, -0.8], clamp: minDistFrom(B, 22) });
    b.seg(B, C, { ticks: 2 });                       // the given line
    b.seg(A, B, { step: 1 });
    const eq = equiAway(b, A, B, 'D', C, { step: 2, stepCircles: 2, stepApex: 2, stepJoin: 2 });
    const D = eq.apex;
    const uDA = unit(sub(A, D)), uDB = unit(sub(B, D));
    const rBC = dist(B, C);
    const Gp = b.at('G', add(B, mul(uDB, rBC)), { step: 4, dir: [0.9, 0.4] });
    const dDG = dist(D, Gp);
    const L = b.at('L', add(D, mul(uDA, dDG)), { step: 5, dir: [-0.9, 0.4] });
    const E = b.at('E', add(D, mul(uDA, dDG + 26)), { step: 3, dir: [-0.9, 0.4] });
    const F = b.at('F', add(D, mul(uDB, dDG + 26)), { step: 3, dir: [0.9, 0.3] });
    /* full solid rays of the extended lines — not faint dashes */
    b.seg(A, E, { step: 3, w: 2.2, id: 'seg:AE' });
    b.seg(B, F, { step: 3, w: 2.2, id: 'seg:BF' });
    b.circle(B, rBC, { id: 'cir:B', step: 4, role: 'scaffold', wide: true });
    b.seg(B, Gp, { step: 4, id: 'seg:BG', ticks: 2, w: 2.3 });
    b.circle(D, dDG, { id: 'cir:D', step: 5, role: 'scaffold', wide: true });
    b.seg(A, L, { step: 5, w: 2.4, id: 'seg:AL', ticks: 2 });
    /* DG and DL are each made of two pieces: name them so the proof can point at them */
    ['DG', 'GD'].forEach(t => { b.link(t, 'seg:BD'); b.link(t, 'seg:BG'); });
    ['DL', 'LD'].forEach(t => { b.link(t, 'seg:AD'); b.link(t, 'seg:AL'); });
    ['DE', 'ED'].forEach(t => { b.link(t, 'seg:AD'); b.link(t, 'seg:AE'); });
    ['DF', 'FD'].forEach(t => { b.link(t, 'seg:BD'); b.link(t, 'seg:BF'); });
    b.text('AL = BC', mid(A, L), { dx: -12, dy: 0, step: 9, size: 14, anchor: 'end', cls: 'callout-txt' });
  }
};

/* ============================================================
   THEOREM 1b — Euclid I.3: cut off from AB a line equal to C
   ============================================================ */
FIGS['thm:1b'] = {
  build(b) {
    const A = b.pt('A', -82, -16, { dir: [-1, -0.4] });
    /* AB must stay longer than the given line C (rC = 62), or step 3 has no cut */
    const B = b.pt('B', 78, -16, { dir: [1, -0.3], clamp: minDistFrom(A, 74) });
    b.seg(A, B, { id: 'seg:AB' });
    const c0 = b.at('c0', V(-82, 74), { show: false });
    /* the given line C is adjustable: drag its right end to lengthen or
       shorten it — along its own line only, and always shorter than AB */
    const c1 = b.pt('c1', -20, 74, { show: false, noXform: true, clamp: q => {
      const maxL = dist(A, B) * 0.86;
      return V(Math.max(c0.x + 16, Math.min(c0.x + maxL, q.x)), 74);
    } });
    b.seg(c0, c1, { id: 'seg:C', w: 2.4, ticks: 2 });
    b.text('C', mid(c0, c1), { dy: 12, anchor: 'middle', size: 13, italic: true });
    const rC = dist(c0, c1);
    /*
      Step 1: light C, place D, draw AD = C.
      Step 2: circle radius AD.
      Step 3: cut AB at E.
      Step 4 (final): emphasise AE (the cut-off piece) and C — not the whole of AB.
    */
    b.seg(c0, c1, { id: 'seg:Cshow', step: 1, w: 2.9, ticks: 2 });
    b.link('C', 'seg:C'); b.link('C', 'seg:Cshow');
    const D = b.at('D', add(A, mul(unit(V(0.42, 1)), rC)), { step: 1, dir: [-0.5, 0.9] });
    b.seg(A, D, { step: 1, ticks: 2, w: 2.4, id: 'seg:AD' });
    b.circle(A, rC, { id: 'cir:A', step: 2, role: 'scaffold', wide: true });
    const E = b.at('E', add(A, mul(unit(sub(B, A)), rC)), { step: 3, dir: [0.2, -1] });
    b.seg(A, E, { step: 3, w: 2.4, id: 'seg:AE', ticks: 2 });
    /* final step: only AE and C get the emphasis, not full AB */
    b.seg(A, E, { step: 4, w: 3.0, id: 'seg:AEfinal', ticks: 2 });
    b.seg(c0, c1, { step: 4, w: 3.0, id: 'seg:Cfinal', ticks: 2 });
    b.link('AE', 'seg:AE'); b.link('AE', 'seg:AEfinal');
    b.link('C', 'seg:Cfinal');
    b.text('AE = C', mid(A, E), { dy: -18, anchor: 'middle', step: 4, size: 14, cls: 'callout-txt' });
  }
};

/* ============================================================
   THEOREM 2 — Side-Angle-Side
   ============================================================ */
FIGS['thm:2'] = {
  build(b) {
    const B = b.pt('B', -150, 62, { dir: [0, 1] });
    const A = b.pt('A', -205, -42, { dir: [-1, -0.4], clamp: minDistFrom(B, 30) });
    const C = b.pt('C', -92, -42, { dir: [0.6, -0.9], clamp: keepOffLine(A, B, 16) });
    const t = V(212, 0);
    const E = b.at('E', add(B, t), { dir: [0, 1] });
    const D = b.at('D', add(A, t), { dir: [-1, -0.4] });
    const F = b.at('F', add(C, t), { dir: [0.6, -0.9] });
    b.poly('ABC', [A, B, C], { step: 5 });
    b.poly('DEF', [D, E, F], { step: 5 });
    b.seg(A, B, { ticks: 1 }); b.seg(B, C, { ticks: 2 }); b.seg(A, C);
    b.seg(D, E, { ticks: 1 }); b.seg(E, F, { ticks: 2 }); b.seg(D, F);
    b.ang(A, B, C, { r: 22 }); b.ang(D, E, F, { r: 22 });
    /* strong clear motion arrow (not a faint stick) */
    b.arrowSeg(add(mid(A, B), V(26, 16)), add(mid(D, E), V(-26, 16)), {
      step: 2, until: 3, id: 'move', w: 3.4, cls: 'e-arrow'
    });
    b.text('slide △ABC onto △DEF', add(mid(A, C), V(106, 96)), {
      anchor: 'middle', size: 15, step: 2, until: 3, cls: 'callout-txt', id: 'txt:slide'
    });
    const bulge = add(mid(D, F), mul(unit(perp(sub(F, D))), -26));
    /* callout path: dashed so it is not geometry, but heavy enough to read */
    b.poly('bent', [D, bulge, F], {
      close: false, fill: false, dash: '7 5', w: 2.2, step: 4, until: 4,
      id: 'bent', cls: 'callout'
    });
    b.text('two straight lines would enclose a space — impossible', add(mid(D, F), V(0, -46)), {
      anchor: 'middle', size: 14, step: 4, until: 4, cls: 'callout-txt', id: 'txt:bent'
    });
  }
};

/* ============================================================
   THEOREM 3 — base angles of an isosceles triangle
   ============================================================ */
FIGS['thm:3'] = {
  build(b) {
    const B = b.pt('B', -60, 0, { dir: [-1, 0.2] });
    const C = b.pt('C', 60, 0, { dir: [1, 0.2], clamp: minDistFrom(B, 44) });
    const A = b.pt('A', 0, 124, { clamp: onPerpBisector(B, C, 40), dir: [0, 1] });
    b.seg(A, B, { ticks: 1 }); b.seg(A, C, { ticks: 1 }); b.seg(B, C);
    /*
      Extend the legs past the base to unused ends F and G.
      Step 1: pick D at random on BF and highlight BD.
      Step 2: circle centre C, radius BD, cutting CG at E (so CE = BD).
    */
    const ext = 120;
    const uBA = unit(sub(B, A)), uCA = unit(sub(C, A));
    const F = b.at('F', add(B, mul(uBA, ext)), { step: 1, dir: [-0.9, -0.6] });
    const G = b.at('G', add(C, mul(uCA, ext)), { step: 1, dir: [0.9, -0.6] });
    const sBF = b.seg(B, F, { step: 1, w: 1.8, id: 'seg:BF' });
    b.seg(C, G, { step: 1, w: 1.8, id: 'seg:CG' });
    /* D is "a point at random on BF": a free choice, draggable along BF.
       The circle about C (radius BD) and the point E are derived from it —
       never the reverse.  The limits keep BD a proper piece of BF, so the
       equal cut CE always lands within CG and the figure stays in view. */
    /* D and the piece BD stay off-screen until their own beat names them */
    const D = b.ptOn('D', sBF, 0.42, {
      lo: 0.12, hi: 0.88,
      step: 1, dir: [-1, -0.3], hideUntilHl: true, keepAfterStep: true, keepThroughBeats: true
    });
    b.seg(B, D, {
      step: 1, w: 2.5, id: 'seg:BD', hideUntilHl: true, keepAfterStep: true, keepThroughBeats: true
    });
    b.tick(B, D, 2, {
      step: 1, id: 'tick:BD', hideUntilHl: true, keepAfterStep: true, keepThroughBeats: true
    });
    const rBD = dist(B, D);
    const E = b.at('E', add(C, mul(uCA, rBD)), { step: 2, dir: [1, -0.3] });
    b.circle(C, rBD, { step: 2, role: 'scaffold', wide: true, id: 'cir:C' });
    b.seg(C, E, { step: 2, w: 2.5, id: 'seg:CE' });
    b.tick(C, E, 2, { step: 2, id: 'tick:CE' });
    b.seg(B, E, { step: 3, w: 2.1 }); b.seg(C, D, { step: 3, w: 2.1 });
    b.seg(A, D, { step: 4, w: 1.2, role: 'scaffold', id: 'seg:AD' });
    b.seg(A, E, { step: 4, w: 1.2, role: 'scaffold', id: 'seg:AE' });
    b.poly('ADC', [A, D, C], { step: 6, id: 'poly:ADC', fill: false, w: 2.4 });
    b.poly('AEB', [A, E, B], { step: 6, id: 'poly:AEB', fill: false, w: 2.4 });
    b.poly('BDC', [B, D, C], { step: 7, id: 'poly:BDC', fill: false });
    b.poly('CEB', [C, E, B], { step: 7, id: 'poly:CEB', fill: false });
    b.ang(A, B, C, { r: 26, label: null, step: 8 });
    b.ang(B, C, A, { r: 26, step: 8 });
    b.ang(D, B, C, { r: 24, step: 9, id: 'ang:DBC' });
    b.ang(E, C, B, { r: 24, step: 9, id: 'ang:ECB' });
    b.ang(B, A, C, { r: 34, step: 5, id: 'ang:BAC' });
  }
};

/* ============================================================
   THEOREM 4 — converse of the isosceles theorem
   ============================================================ */
FIGS['thm:4'] = {
  build(b) {
    /* Genuine isosceles: A on the perpendicular bisector of BC so AB = AC */
    const B = b.pt('B', -70, -34, { dir: [-1, -0.4] });
    const C = b.pt('C', 70, -34, { dir: [1, -0.4], clamp: minDistFrom(B, 44) });
    const A = b.pt('A', 0, 118, { clamp: onPerpBisector(B, C, 50), dir: [0, 1] });
    b.seg(A, B, { id: 'seg:AB', ticks: 1 });
    b.seg(A, C, { id: 'seg:AC', ticks: 1 });
    b.seg(B, C, { id: 'seg:BC' });
    /*
      Step 1: one leg, base, angle at B.
      Step 2: other leg, base, angle at C.
      Step 3: both equal base angles — isosceles in view.
      Reductio (steps 4–6): suppose a side longer; cut BD = AC further down AB
      (D between A and B, not near B), join DC.
    */
    b.ang(A, B, C, { id: 'ang:ABC1', r: 28, step: 1, until: 1 });
    b.ang(B, C, A, { id: 'ang:ACB2', r: 28, step: 2, until: 2 });
    b.ang(A, B, C, { id: 'ang:ABC', r: 26, step: 3 });
    b.ang(B, C, A, { id: 'ang:ACB', r: 26, step: 3 });
    /*
      For the reductio we need a longer AB; keep the isosceles look for the
      given triangle, and place D well down AB toward A so BD is a clear
      proper segment equal to AC (using a slightly longer temporary cut).
      Visually AB = AC still; D is the point with BD = AC if AB were longer —
      we place D by circle so BD = AC and AB must exceed AC: nudge B left
      only for the cut by using radius AC along BA from B.
    */
    /* D well down AB from B toward A (not near B); BD marked equal to AC by ticks */
    const D = b.at('D', lerp(B, A, 0.68), { step: 5, dir: [-0.9, 0.25] });
    b.seg(A, B, { id: 'seg:ABflash', step: 4, w: 2.8, until: 4 });
    b.circle(B, dist(B, D), { step: 5, role: 'scaffold', wide: true, id: 'cir:B' });
    b.seg(B, D, { step: 5, ticks: 2, w: 2.3, id: 'seg:BD' });
    b.seg(D, C, { step: 5, w: 2.1, id: 'seg:DC' });
    b.poly('DBC', [D, B, C], { step: 6 });
    b.text('△DBC is a part of △ACB, yet equal to it — absurd', V(0, -62), {
      anchor: 'middle', size: 14, step: 6, cls: 'callout-txt'
    });
  }
};

/* ============================================================
   THEOREM 5 — two triangles on the same base (Euclid I.7)
   "triangles are rigid"
   ============================================================ */
FIGS['thm:5'] = {
  build(b) {
    /* the hinged square, for step 1 only — kept well clear of the main figure */
    const sq = [V(-340, -10), V(-230, -10), V(-230, 100), V(-340, 100)];
    b.poly('square', sq, { step: 1, until: 1, id: 'sq', fill: true });
    const sh = [V(-340, -10), V(-230, -10), V(-194, 94), V(-304, 94)];
    b.poly('slanted', sh, { step: 1, until: 1, id: 'sq2', fill: false, dash: '5 4' });
    b.text('a hinged square collapses …', V(-285, -34), { anchor: 'middle', size: 12, step: 1, until: 1 });

    /*
      Layout (Augros p. 18): M and N high, MN a short crown, BN long,
      AN and BM crossing. Impossible supposition AM=AN and BM=BN with
      distinct apexes; equality marked by ticks. Angles are named only
      by their three letters — no numbered labels.
    */
    const A = b.pt('A', -105, 0, { dir: [-1, -0.35] });
    const B = b.pt('B', 100, 0, { dir: [1, -0.35], clamp: minDistFrom(A, 60) });
    const M = b.pt('M', -28, 205, { dir: [-0.5, 1], clamp: keepSide(V(-105, 0), V(100, 0), 1, 110) });
    b.seg(A, B, { id: 'seg:AB' });
    b.seg(A, M, { ticks: 1, id: 'seg:AM' }); b.seg(B, M, { ticks: 2, id: 'seg:BM' });
    const N = b.at('N', V(108, 198), { step: 2, dir: [1, 0.4] });
    b.seg(A, N, { step: 2, ticks: 1, id: 'seg:AN' }); b.seg(B, N, { step: 2, ticks: 2, id: 'seg:BN' });
    b.seg(M, N, { step: 3, id: 'seg:MN' });

    /*
      Staged angles (letter names only), mirroring the proof:
        4 — wholes ∠AMN = ∠ANM (isosceles AM = AN)
        5 — ray MB splits ∠AMN into ∠AMB and ∠BMN
        6 — wholes ∠BMN = ∠BNM (isosceles BM = BN); ∠BMN already from 5
        7 — ray NA splits ∠BNM into ∠ANM and ∠BNA
        8–9 — arithmetic; 10 — conclusion caption
    */
    b.ang(A, M, N, { id: 'ang:AMN', r: 36, step: 4, name: '∠AMN' });
    b.ang(A, N, M, { id: 'ang:ANM', r: 36, step: 4, name: '∠ANM' });

    b.seg(M, B, { step: 5, w: 2.7, id: 'seg:MB', name: 'MB' });
    b.link('MB', 'seg:MB'); b.link('BM', 'seg:MB'); b.link('BM', 'seg:BM');
    b.ang(A, M, B, { id: 'ang:AMB', r: 22, step: 5, name: '∠AMB' });
    b.ang(B, M, N, { id: 'ang:BMN', r: 40, step: 5, name: '∠BMN' });

    /* step 6: other isosceles — whole ∠BNM joins ∠BMN already drawn */
    b.ang(B, N, M, { id: 'ang:BNM', r: 42, step: 6, name: '∠BNM' });

    /* step 7: ray NA divides ∠BNM — lesser ∠BNA (∠ANM already from 4) */
    b.seg(N, A, { step: 7, w: 2.7, id: 'seg:NA', name: 'NA' });
    b.link('NA', 'seg:NA'); b.link('AN', 'seg:NA'); b.link('AN', 'seg:AN');
    b.ang(B, N, A, { id: 'ang:BNA', r: 22, step: 7, name: '∠BNA' });

    b.text('(the figure cannot really exist — that is what we prove)', V(0, -40), {
      anchor: 'middle', size: 12, step: 10
    });
  }
};

/* ============================================================
   THEOREM 6 — Side-Side-Side
   ============================================================ */
FIGS['thm:6'] = {
  build(b) {
    const C = b.pt('C', -58, -34, { dir: [-1, -0.4] });
    const D = b.pt('D', 58, -34, { dir: [1, -0.4], clamp: minDistFrom(C, 40) });
    const A = b.pt('A', 6, 80, { dir: [0.3, 1], clamp: keepSide(V(-58, -34), V(58, -34), 1, 34) });
    /* named sides so both triangles can light as full line-sets together */
    b.seg(C, D, { id: 'seg:CD' });
    b.seg(C, A, { ticks: 1, id: 'seg:CA' });
    b.seg(D, A, { ticks: 2, id: 'seg:DA' });
    const B = b.at('B', rotAbout(A, C, -11 * DEG), { step: 1, until: 2, dir: [1, 0.6] });
    b.seg(C, B, { step: 1, until: 2, dash: '5 4', id: 'seg:CB' });
    b.seg(D, B, { step: 1, until: 2, dash: '5 4', id: 'seg:DB' });
    /*
      Hidden △BCD so the proof text “△BCD” links for highlight. △ACD is the
      real filled face (step 4); expandPolySides still walks its edges on step 2.
    */
    b.poly('BCD', [B, C, D], { id: 'poly:BCD', role: 'hidden' });
    b.text('B must fall on A', add(A, V(46, 16)), { size: 12, step: 3 });
    b.poly('ACD', [A, C, D], { step: 4, id: 'poly:ACD' });
    b.ang(A, C, D, { r: 22, step: 4 }); b.ang(C, D, A, { r: 22, step: 4 });
    b.ang(C, A, D, { r: 22, step: 4 });
  }
};

/* ============================================================
   THEOREM 7 — bisect an angle
   ============================================================ */
FIGS['thm:7'] = {
  build(b) {
    const B = b.pt('B', -76, -46, { dir: [-1, -0.5] });
    const A = b.pt('A', -116, 104, { dir: [-0.4, 1], clamp: minDistFrom(B, 40) });
    const C = b.pt('C', 84, -30, { dir: [1, 0.2], clamp: minDistFrom(B, 40) });
    b.seg(B, A, { id: 'seg:BA' }); b.seg(B, C, { id: 'seg:BC' });
    const r = Math.min(dist(B, A), dist(B, C)) * 0.6;
    const D = b.at('D', add(B, mul(unit(sub(A, B)), r)), { step: 1, dir: [-1, 0.2] });
    const E = b.at('E', add(B, mul(unit(sub(C, B)), r)), { step: 1, dir: [0.4, -1] });
    b.circle(B, r, { id: 'cir:B', step: 1, role: 'scaffold', wide: true });
    b.seg(B, D, { step: 1, w: 2.1, id: 'seg:BD' }); b.seg(B, E, { step: 1, w: 2.1, id: 'seg:BE' });
    b.tick(B, D, 1, { step: 5 }); b.tick(B, E, 1, { step: 5 });
    b.seg(D, E, { step: 2, id: 'seg:DE' });
    /* equi on DE away from B: joins are DF and EF (ids seg:DF, seg:EF) */
    const eq = equiAway(b, D, E, 'F', B, { step: 3, stepCircles: 3, stepApex: 3, stepJoin: 3, ticks: 2 });
    const F = eq.apex;
    b.seg(B, F, { step: 4, w: 2.2, id: 'seg:BF' });
    /* hidden SSS triangles — step 8 lights each on all three sides, in two beats */
    b.poly('FBD', [F, B, D], { id: 'poly:FBD', role: 'hidden' });
    b.poly('FBE', [F, B, E], { id: 'poly:FBE', role: 'hidden' });
    /* equal half-angles: drawn once the bisector is joined (claim), re-used at QED */
    b.ang(D, B, F, { r: 40, step: 4, name: '∠FBD', id: 'ang:FBD' });
    b.ang(F, B, E, { r: 40, step: 4, name: '∠FBE', id: 'ang:FBE' });
    /* whole given angle ABC — outer arc on the final step with the two halves */
    b.ang(A, B, C, { r: 58, step: 9, name: '∠ABC', id: 'ang:ABC' });
    b.link('ABC', 'ang:ABC'); b.link('∠ABC', 'ang:ABC');
  }
};

/* ============================================================
   THEOREM 8 — bisect a straight line
   ============================================================ */
FIGS['thm:8'] = {
  build(b) {
    const A = b.pt('A', -72, 0, { dir: [-1, -0.4] });
    const B = b.pt('B', 72, 0, { dir: [1, -0.4], clamp: minDistFrom(A, 30) });
    b.seg(A, B);
    const eq = b.equi(A, B, 'C', { step: 1, stepCircles: 1, stepApex: 1, stepJoin: 1, ticks: 1, dir: [0, 1], wide: false });
    const C = eq.apex;
    /* the same two circles cross below as well: joining the crossings is the bisector */
    const C2 = b.at('C₂', interCC(A, dist(A, B), B, dist(A, B), -1), { step: 2, dir: [0, -1] });
    const D = b.at('D', mid(A, B), { step: 2, dir: [-0.9, -0.5] });
    b.seg(C, C2, { step: 2, w: 2.2, id: 'seg:CC2', name: 'CD' });
    b.seg(A, C2, { step: 2, dash: '4 4', role: 'scaffold', id: 'seg:AC2' });
    b.seg(B, C2, { step: 2, dash: '4 4', role: 'scaffold', id: 'seg:BC2' });
    b.ang(A, C, D, { r: 34, step: 4 }); b.ang(D, C, B, { r: 34, step: 4, id: 'ang:DCB' });
    b.tick(A, D, 2, { step: 7 }); b.tick(D, B, 2, { step: 7 });
    b.ang(C, D, B, { square: true, r: 18, step: 7, id: 'ang:CDB' });
    b.ang(A, D, C, { square: true, r: 18, step: 7, id: 'ang:ADC' });
    b.text('the two circles cross above and below; the line joining the crossings cuts AB in half',
      V(0, -190), { anchor: 'middle', size: 12, step: 7 });
  }
};

/* ============================================================
   THEOREM 9 — perpendicular from a point ON the line
   ============================================================ */
FIGS['thm:9'] = {
  build(b) {
    const A = b.at('A', V(-135, 0), { dir: [-1, 0] });
    const Bp = b.at('B', V(135, 0), { dir: [1, 0] });
    b.seg(A, Bp);
    const P = b.ptOn('P', { a: A, b: Bp, kind: 'seg' }, 0.42, { dir: [0, -1], lo: 0.28, hi: 0.72 });
    const r = 62;
    const C = b.at('C', add(P, mul(unit(sub(A, Bp)), r)), { step: 1, dir: [0, -1] });
    const D = b.at('D', add(P, mul(unit(sub(Bp, A)), r)), { step: 1, dir: [0, -1] });
    b.circle(P, r, { step: 1, role: 'scaffold', wide: true, id: 'cir:P' });
    b.seg(P, C, { step: 1, w: 2.1, id: 'seg:PC' }); b.seg(P, D, { step: 1, w: 2.1, id: 'seg:PD' });
    b.seg(C, D, { step: 2, w: 2.1, id: 'seg:CD' });
    b.tick(P, C, 1, { step: 4 }); b.tick(P, D, 1, { step: 4 });
    const eq = b.equi(C, D, 'R', { step: 2, stepCircles: 2, stepApex: 2, stepJoin: 2, ticks: 2, dir: [0, 1] });
    const R = eq.apex;
    b.seg(P, R, { step: 3, w: 2.2 });
    b.ang(R, P, C, { r: 30, step: 8, until: 9 }); b.ang(D, P, R, { r: 30, step: 8, until: 9, id: 'ang:DPR' });
    b.ang(C, P, R, { square: true, r: 20, step: 9, id: 'sq1' });
    b.ang(R, P, D, { square: true, r: 20, step: 9, id: 'sq2' });
  }
};

/* ============================================================
   THEOREM 10 — perpendicular from a point OFF the line
   ============================================================ */
FIGS['thm:10'] = {
  build(b) {
    const A = b.at('A', V(-140, 0), { dir: [-1, 0] });
    const Bp = b.at('B', V(140, 0), { dir: [1, 0] });
    b.seg(A, Bp);
    const P = b.pt('P', -6, 96, { dir: [0, 1], clamp: q => {
      const p = keepSide(V(-140, 0), V(140, 0), 1, 40)(q);
      return V(Math.max(-60, Math.min(60, p.x)), p.y);
    } });
    const D = b.pt('D', -22, -30, { dir: [-0.4, -1], clamp: keepSide(V(-140, 0), V(140, 0), -1, 18), step: 1 });
    const r = dist(P, D);
    const half = Math.sqrt(Math.max(1, r * r - P.y * P.y));
    const Gp = b.at('G', V(P.x - half, 0), { step: 2, dir: [-0.6, 1] });
    const E = b.at('E', V(P.x + half, 0), { step: 2, dir: [0.6, 1] });
    b.circle(P, r, { step: 2, id: 'cir:P', role: 'scaffold', wide: true });
    b.seg(Gp, P, { step: 3, ticks: 1 }); b.seg(E, P, { step: 3, ticks: 1 });
    const H = b.at('H', mid(Gp, E), { step: 4, dir: [0, -1] });
    const pb = b.perpBisect(Gp, E, { step: 4, r: 0.66 });
    b.seg(H, Gp, { step: 4, w: 2.1, id: 'seg:HG' }); b.seg(H, E, { step: 4, w: 2.1, id: 'seg:HE' });
    b.tick(Gp, H, 2, { step: 7 }); b.tick(H, E, 2, { step: 7 });
    b.seg(P, H, { step: 5, w: 2.2 });
    b.ang(P, H, Gp, { r: 26, step: 10, until: 10 }); b.ang(E, H, P, { r: 26, step: 10, until: 10, id: 'ang:EHP' });
    b.ang(Gp, H, P, { square: true, r: 18, step: 11, id: 'sq1' });
    b.ang(P, H, E, { square: true, r: 18, step: 11, id: 'sq2' });
  }
};

/* ============================================================
   THEOREM 11 — adjacent angles on a straight line
   ============================================================ */
FIGS['thm:11'] = {
  build(b) {
    const C = b.at('C', V(-120, 0), { dir: [-1, 0] });
    const D = b.at('D', V(120, 0), { dir: [1, 0] });
    const B = b.at('B', V(0, 0), { dir: [0, -1] });
    /* base CD under the two right-angle squares; middle upright BP */
    b.seg(C, D, { id: 'seg:CD' });
    /* keep A's ray between BP (up) and BD (right), so the region really is
       cut into the pieces ∠1, ∠2, ∠3 that the proof names */
    const A = b.pt('A', 52, 98, { dir: [0.5, 1], clamp: q => {
      const p = keepSide(V(-120, 0), V(120, 0), 1, 40)(q);
      return V(Math.max(14, p.x), p.y);
    } });
    b.seg(B, A, { id: 'seg:BA' });
    const P = b.at('P', V(0, Math.max(78, dist(B, A) * 0.95)), { step: 2, dir: [0, 1] });
    b.seg(B, P, { step: 2, dash: '5 4', id: 'seg:BP' });
    b.ang(C, B, P, { square: true, r: 22, step: 3, id: 'sq1' });
    b.ang(P, B, D, { square: true, r: 22, step: 3, id: 'sq2' });
    b.ang(C, B, P, { label: '1', r: 40, step: 4, id: 'ang:1' });
    b.ang(P, B, A, { label: '2', r: 40, step: 4, id: 'ang:2' });
    b.ang(A, B, D, { label: '3', r: 40, step: 4, id: 'ang:3' });
    /*
      Named wholes used late in the proof. Hidden: they exist so “∠ABC” / “∠ABD”
      resolve and expandAngleRays can light both inclined sides (BA and the base CD).
    */
    b.ang(A, B, C, { id: 'ang:ABC', role: 'hidden' });
    b.ang(A, B, D, { id: 'ang:ABD', role: 'hidden' });
    b.link('ABC', 'ang:ABC'); b.link('∠ABC', 'ang:ABC');
    b.link('ABD', 'ang:ABD'); b.link('∠ABD', 'ang:ABD');
    /* prefer the named wholes over the piece labels when the text says ABC / ABD */
    b.link('ABD', 'ang:3'); /* keep piece 3 available; refsIn picks ang: with ∠ */
    b.text('∠ABC + ∠ABD = two right angles', V(0, -34), { anchor: 'middle', size: 12, step: 7 });
  }
};

/* ============================================================
   THEOREM 12 — converse: two rights ⇒ one straight line
   Two layered figures (CSS slides them):
     layer-claim    — A–P–C collinear, ∠APB + ∠BPC = two rights (true)
     layer-reductio — PC bent off the line; X on the extension of AP
   Step 1 shows the claim; step 2 whisks it up for the reductio; the
   last step whisks the reductio up and restores the claim.
   ============================================================ */
FIGS['thm:12'] = {
  build(b) {
    const P = b.at('P', V(0, 0), { dir: [0, -1], cls: 'layer-claim' });
    const A = b.at('A', V(-118, 0), { dir: [-1, 0], cls: 'layer-claim' });
    const B = b.pt('B', -36, 96, {
      dir: [-0.3, 1], clamp: keepSide(V(-118, 0), V(118, 0), 1, 40), cls: 'layer-claim'
    });
    /* the upright arm belongs to the claim figure and travels with it */
    b.seg(P, B, { id: 'seg:PB', cls: 'layer-claim' });

    /*
      CLAIM layer: AP and PC collinear, BP on the line, both angles marked.
      Present from the start (step 0) so step 1 / Replay open on the full true figure.
    */
    const Ccol = b.at('Ccol', V(118, 0), { dir: [1, 0], label: 'C', cls: 'layer-claim' });
    b.seg(A, P, { id: 'seg:AP1', cls: 'layer-claim' });
    b.seg(P, Ccol, { id: 'seg:PC1', cls: 'layer-claim' });
    b.link('AP', 'seg:AP1'); b.link('PA', 'seg:AP1');
    b.link('PC', 'seg:PC1'); b.link('CP', 'seg:PC1');
    b.link('C', 'pt:Ccol');
    b.ang(A, P, B, { id: 'ang:APB', r: 40, label: 'APB', name: '∠APB', cls: 'layer-claim' });
    b.ang(B, P, Ccol, { id: 'ang:BPC', r: 40, label: 'BPC', name: '∠BPC', cls: 'layer-claim' });
    b.link('APB', 'ang:APB'); b.link('∠APB', 'ang:APB');
    b.link('BPC', 'ang:BPC'); b.link('∠BPC', 'ang:BPC');
    b.text('∠APB + ∠BPC = two right angles', V(0, -40), {
      anchor: 'middle', size: 12.5, cls: 'layer-claim'
    });

    /*
      REDUCTIO layer (step 2+): PC bent — not a straight extension of AP.
      First beat of step 2: only AP, BP, PC + ∠APB, ∠BPC (no PX, no X).
      Second beat: draw PX (and X). hideUntilHl keeps them off-screen until then.
    */
    /* its own A, P and B, so that the whole first figure can slide away and
       the whole second figure rise in its place */
    const rP = b.at('rP', V(P.x, P.y), { step: 2, dir: [0, -1], label: 'P', cls: 'layer-reductio' });
    const rA = b.at('rA', V(A.x, A.y), { step: 2, dir: [-1, 0], label: 'A', cls: 'layer-reductio' });
    const rB = b.at('rB', V(B.x, B.y), { step: 2, dir: [-0.3, 1], label: 'B', cls: 'layer-reductio' });
    b.link('A', 'pt:rA'); b.link('P', 'pt:rP'); b.link('B', 'pt:rB');
    b.seg(rP, rB, { step: 2, id: 'seg:rPB', cls: 'layer-reductio' });
    b.link('PB', 'seg:rPB'); b.link('BP', 'seg:rPB');
    const C = b.at('C', add(P, mul(unit(V(0.93, 0.40)), 122)), { step: 2, dir: [1, 0.4], cls: 'layer-reductio' });
    b.seg(rA, rP, { step: 2, id: 'seg:AP', cls: 'layer-reductio' });
    b.seg(rP, C, { step: 2, id: 'seg:PC', cls: 'layer-reductio' });
    b.ang(rA, rP, rB, { id: 'ang:rAPB', r: 36, step: 2, label: 'APB', name: '∠APB', cls: 'layer-reductio', hideUntilHl: true });
    b.ang(rB, rP, C, { id: 'ang:rBPC', r: 36, step: 2, label: 'BPC', name: '∠BPC', cls: 'layer-reductio', hideUntilHl: true });
    b.link('APB', 'ang:rAPB'); b.link('BPC', 'ang:rBPC');
    b.link('∠APB', 'ang:rAPB'); b.link('∠BPC', 'ang:rBPC');

    const X = b.at('X', V(132, 0), { step: 2, dir: [1, -0.3], cls: 'layer-reductio', hideUntilHl: true });
    b.seg(rP, X, { step: 2, dash: '6 4', id: 'seg:PX', w: 2.0, cls: 'layer-reductio', hideUntilHl: true, keepAfterStep: true });
    b.link('AP', 'seg:AP'); b.link('PA', 'seg:AP');
    b.link('PC', 'seg:PC'); b.link('CP', 'seg:PC');
    b.link('PX', 'seg:PX'); b.link('XP', 'seg:PX');
    b.text('suppose PC is not the extension of AP', V(8, -68), {
      anchor: 'middle', size: 12.5, step: 2, until: 3, cls: 'layer-reductio', hideUntilHl: true, id: 'txt:suppose'
    });

    b.ang(rA, rP, rB, { label: '1', r: 34, step: 3, id: 'ang:1', cls: 'layer-reductio' });
    b.ang(rB, rP, X, { label: '2', r: 34, step: 3, id: 'ang:2', cls: 'layer-reductio' });
    b.ang(X, rP, C, { label: '3', r: 56, step: 3, id: 'ang:3', cls: 'layer-reductio' });
    b.link('1', 'ang:1'); b.link('∠1', 'ang:1');
    b.link('2', 'ang:2'); b.link('∠2', 'ang:2');
    b.link('3', 'ang:3'); b.link('∠3', 'ang:3');
    b.text('if ∠APB + ∠BPC = two rights, PC must lie along PX', V(0, -34), {
      anchor: 'middle', size: 12, step: 7, cls: 'layer-claim'
    });
  }
};

FIGS['thm:13'] = {
  build(b) {
    const P = b.at('P', V(0, 0), { dir: [-0.4, -1] });
    const A = b.pt('A', -112, -40, { dir: [-1, -0.3], clamp: minDistFrom(P, 40) });
    const B = b.at('B', add(P, mul(unit(sub(P, A)), 112)), { dir: [1, 0.3] });
    const C = b.pt('C', -96, 58, { dir: [-1, 0.4], clamp: minDistFrom(P, 40) });
    const D = b.at('D', add(P, mul(unit(sub(P, C)), 108)), { dir: [1, -0.4] });
    b.seg(A, B); b.seg(C, D);
    b.ang(A, P, C, { label: '1', r: 30, step: 1, id: 'ang:1' });
    b.ang(C, P, B, { label: '2', r: 30, step: 2, id: 'ang:2' });
    b.ang(B, P, D, { label: '3', r: 30, step: 1, id: 'ang:3' });
    b.ang(D, P, A, { label: '4', r: 30, step: 6, id: 'ang:4' });
  }
};

/* ============================================================
   THEOREM 14 — exterior angle > remote interior
   ============================================================ */
FIGS['thm:14'] = {
  build(b) {
    const B = b.pt('B', -112, -40, { dir: [-1, -0.4] });
    const C = b.pt('C', 78, -40, { dir: [0.2, -1], clamp: minDistFrom(B, 50) });
    const A = b.pt('A', -34, 94, { dir: [-0.3, 1], clamp: keepSide(V(-112, -40), V(78, -40), 1, 40) });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    const D = b.at('D', add(C, mul(unit(sub(C, B)), 84)), { step: 1, dir: [1, -0.2] });
    b.seg(C, D, { step: 1, dash: '6 4' });
    const E = b.at('E', mid(A, C), { step: 2, dir: [1, -0.35] });
    const F = b.at('F', add(B, mul(sub(E, B), 2)), { step: 2, dir: [1, 0.2] });
    b.seg(B, F, { step: 2 }); b.seg(C, F, { step: 2 });
    b.seg(A, E, { step: 2, w: 1.9, id: 'seg:AE' }); b.seg(E, C, { step: 2, w: 1.9, id: 'seg:EC' });
    b.seg(B, E, { step: 2, w: 1.9, id: 'seg:BE' }); b.seg(E, F, { step: 2, w: 1.9, id: 'seg:EF' });
    b.tick(A, E, 1, { step: 3 }); b.tick(E, C, 1, { step: 3 });
    b.tick(B, E, 2, { step: 3 }); b.tick(E, F, 2, { step: 3 });
    b.ang(A, E, B, { r: 20, step: 4 }); b.ang(C, E, F, { r: 20, step: 4, id: 'ang:CEF' });
    b.ang(B, A, C, { r: 28, step: 6, id: 'ang:BAC' });
    b.ang(E, C, F, { r: 26, step: 6, id: 'ang:ECF' });
    b.ang(A, C, D, { r: 52, step: 7, id: 'ang:ACD' });
  }
};

/* ============================================================
   THEOREM 15 — greater side, greater opposite angle
   ============================================================ */
FIGS['thm:15'] = {
  build(b) {
    const B = b.pt('B', -104, -44, { dir: [-1, -0.4] });
    const A = b.pt('A', -58, 96, { dir: [-0.2, 1], clamp: keepSide(V(-104, -44), V(116, -44), 1, 40) });
    /* the hypothesis is AC > AB: C keeps its distance from A above that bound */
    const C = b.pt('C', 116, -44, { dir: [1, -0.4], clamp: q => {
      const th = dist(A, B) * 1.12, l = dist(q, A);
      return l >= th ? q : (l < 1e-9 ? add(A, V(th, 0)) : add(A, mul(sub(q, A), th / l)));
    } });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    const dAB = dist(A, B);
    const D = b.at('D', add(A, mul(unit(sub(C, A)), Math.min(dAB, dist(A, C) * 0.9))), { step: 2, dir: [0.4, 1] });
    b.circle(A, dist(A, D), { step: 2, role: 'scaffold', wide: true, id: 'cir:A' });
    b.tick(A, B, 1, { step: 2 }); b.tick(A, D, 1, { step: 2 });
    b.seg(B, D, { step: 2 });
    b.ang(A, B, D, { r: 26, step: 3 }); b.ang(A, D, B, { r: 26, step: 3, id: 'ang:ADB' });
    b.ang(A, C, B, { r: 30, step: 4, id: 'ang:ACB' });
    b.ang(A, B, C, { r: 46, step: 6, id: 'ang:ABC' });
  }
};

/* ============================================================
   THEOREM 16 — greater angle, greater opposite side
   ============================================================ */
FIGS['thm:16'] = {
  build(b) {
    const B = b.pt('B', -100, -38, { dir: [-1, -0.4] });
    const A = b.pt('A', -18, 96, { dir: [-0.2, 1], clamp: keepSide(V(-100, -38), V(100, -38), 1, 40) });
    /* the hypothesis ∠ABC > ∠ACB means AC > AB: keep C far enough from A */
    const C = b.pt('C', 100, -38, { dir: [1, -0.4], clamp: q => {
      const th = dist(A, B) * 1.10, l = dist(q, A);
      return l >= th ? q : (l < 1e-9 ? add(A, V(th, 0)) : add(A, mul(sub(q, A), th / l)));
    } });
    b.seg(A, B); b.seg(A, C); b.seg(B, C);
    b.ang(A, B, C, { r: 30 }); b.ang(A, C, B, { r: 30 });
    const iso = b.at('A₁', interCC(B, dist(B, C) * 0.8, C, dist(B, C) * 0.8, 1), { step: 3, until: 3, dir: [0, 1] });
    b.seg(B, iso, { step: 3, until: 3, dash: '5 4', id: 'iso1' });
    b.seg(C, iso, { step: 3, until: 3, dash: '5 4', id: 'iso2' });
    b.text('if AC = AB the base angles would be equal', V(0, -60), { anchor: 'middle', size: 12, step: 3, until: 3 });
    const A2 = b.at('A₂', V(-A.x, A.y), { step: 4, until: 4, dir: [0.2, 1] });
    b.seg(B, A2, { step: 4, until: 4, dash: '5 4', id: 'les1' });
    b.seg(C, A2, { step: 4, until: 4, dash: '5 4', id: 'les2' });
    b.text('if AC < AB then ∠ABC < ∠ACB', V(0, -60), { anchor: 'middle', size: 12, step: 4, until: 4 });
  }
};

/* ============================================================
   THEOREM 17 — the triangle inequality
   ============================================================ */
FIGS['thm:17'] = {
  build(b) {
    const B = b.pt('B', -104, -46, { dir: [-1, -0.4] });
    const C = b.pt('C', 86, -46, { dir: [1, -0.4], clamp: minDistFrom(B, 40) });
    const A = b.pt('A', -26, 76, { dir: [-1, 0.3], clamp: keepSide(V(-104, -46), V(86, -46), 1, 34) });
    b.seg(A, B); b.seg(A, C, { ticks: 1 }); b.seg(B, C);
    const dAC = dist(A, C);
    const D = b.at('D', add(A, mul(unit(sub(A, B)), dAC)), { step: 2, dir: [-0.3, 1] });
    b.circle(A, dAC, { step: 2, role: 'scaffold', wide: true, id: 'cir:A' });
    b.seg(A, D, { step: 2, ticks: 1 });
    b.seg(C, D, { step: 2 });
    b.ang(A, C, D, { r: 24, step: 3 }); b.ang(A, D, C, { r: 24, step: 3, id: 'ang:ADC' });
    b.ang(B, C, D, { r: 44, step: 3, id: 'ang:BCD' });
    b.text('BD = BA + AC  >  BC', add(mid(B, D), V(-14, 14)), { size: 12, step: 5, anchor: 'end' });
  }
};

/* ============================================================
   THEOREM 18 — the perpendicular is the shortest
   ============================================================ */
FIGS['thm:18'] = {
  build(b) {
    const A = b.at('A', V(-135, 0), { dir: [-1, 0] });
    const Bp = b.at('B', V(135, 0), { dir: [1, 0] });
    b.seg(A, Bp, { id: 'seg:AB' });
    const P = b.pt('P', -18, 92, { dir: [0, 1], clamp: q => {
      const p = keepSide(V(-135, 0), V(135, 0), 1, 40)(q);
      return V(Math.max(-100, Math.min(100, p.x)), p.y);
    } });
    const L = b.at('L', footOf(P, A, Bp), { step: 1, dir: [-0.4, -1] });
    const R = b.ptOn('R', { a: A, b: Bp, kind: 'seg' }, 0.78, { step: 1, dir: [0.4, -1], lo: 0.6, hi: 0.95 });
    /* PL = perpendicular (shortest); PR = any other path — ids used by step-5 beats */
    b.seg(P, L, { step: 1, w: 2.2, id: 'seg:PL' });
    b.seg(P, R, { step: 1, id: 'seg:PR' });
    b.seg(L, R, { step: 2, w: 2.2, color: null, id: 'seg:LR' });
    b.ang(P, L, R, { square: true, r: 18, step: 2, id: 'sq:PLR' });
    /* right angle on the line: PL ⊥ AB */
    b.ang(A, L, P, { square: true, r: 18, step: 2, id: 'sq:PL' });
    b.ang(P, R, L, { r: 26, step: 3, id: 'ang:PRL' });
    b.text('PR > PL', add(mid(P, R), V(18, 8)), { size: 12, step: 5, id: 'txt:gt' });
  }
};

/* ============================================================
   THEOREM 19 — a triangle from three given lines
   ============================================================ */
FIGS['thm:19'] = {
  build(b) {
    /* the three given lines (step 0) */
    const gy = 128;
    const x0 = b.at('x0', V(-150, gy), { show: false });
    const y0 = b.at('y0', V(-50, gy), { show: false });
    const z0 = b.at('z0', V(35, gy), { show: false });
    /* each given length has one draggable end that slides only along its own
       line; the clamps keep the triangle inequality, so the circles of the
       construction always meet */
    const gl = (f, name, dflt, anchor) => { const s = f.state[name]; return (s ? s.x : dflt) - anchor; };
    const x1 = b.pt('x1', -70, gy, { show: false, noXform: true, clamp: (q, f) => {
      const Yl = gl(f, 'y1', 15, -50), Zl = gl(f, 'z1', 130, 35);
      const lo = Math.max(16, Yl - Zl + 12), hi = Yl + Zl - 12;
      return V(-150 + Math.max(lo, Math.min(hi, q.x + 150)), gy);
    } });
    const y1 = b.pt('y1', 15, gy, { show: false, noXform: true, clamp: (q, f) => {
      const Xl = gl(f, 'x1', -70, -150), Zl = gl(f, 'z1', 130, 35);
      const lo = Math.max(16, Math.abs(Xl - Zl) + 12), hi = Xl + Zl - 12;
      return V(-50 + Math.max(lo, Math.min(hi, q.x + 50)), gy);
    } });
    const z1 = b.pt('z1', 130, gy, { show: false, noXform: true, clamp: (q, f) => {
      const Xl = gl(f, 'x1', -70, -150), Yl = gl(f, 'y1', 15, -50);
      const lo = Math.max(16, Yl - Xl + 12), hi = Yl + Xl - 12;
      return V(35 + Math.max(lo, Math.min(hi, q.x - 35)), gy);
    } });
    /* given lengths: X one tick, Y two, Z three — match triangle sides AC, AB, BC */
    b.seg(x0, x1, { id: 'seg:X', w: 2.4, ticks: 1 }); b.text('X', mid(x0, x1), { dy: 12, anchor: 'middle', size: 13, italic: true, id: 'lab:X' });
    b.seg(y0, y1, { id: 'seg:Y', w: 2.4, ticks: 2 }); b.text('Y', mid(y0, y1), { dy: 12, anchor: 'middle', size: 13, italic: true, id: 'lab:Y' });
    b.seg(z0, z1, { id: 'seg:Z', w: 2.4, ticks: 3 }); b.text('Z', mid(z0, z1), { dy: 12, anchor: 'middle', size: 13, italic: true, id: 'lab:Z' });
    const X = dist(x0, x1), Y = dist(y0, y1), Z = dist(z0, z1);
    const A = b.at('A', V(-62, 0), { dir: [-0.2, -1] });
    const Bp = b.at('B', V(-62 + Y, 0), { dir: [0.2, -1] });
    const D = b.at('D', V(-62 - X, 0), { dir: [-1, -0.3] });
    const F = b.at('F', V(-62 + Y + Z, 0), { dir: [1, -0.3] });
    const E = b.at('E', V(-62 + Y + Z + 24, 0), { dir: [1, 0.4] });
    /*
      Step-1 construction (shown only when a beat names them):
        DA (stays as dim context), AE (only its own beat), AB/BF (only their beats).
      keepThroughBeats only on DA so AE+AB+BF do not stack into a fully lit D–E.
      Equality pairs for clicks: X↔DA, Y↔AB, Z↔BF (no DE multi-link — that
      chained X-clicks into the whole base line).
    */
    /* DA only on its beat. AE stays as a full (unhighlighted) background stroke
       after it is drawn — same look as D–E on proof line 2 — while Y cuts AB
       and Z cuts BF from that line. */
    b.seg(D, A, { step: 1, id: 'seg:DA', w: 2.2, hideUntilHl: true, keepAfterStep: true });
    b.seg(A, E, { step: 1, id: 'seg:AE', w: 2.2, hideUntilHl: true, keepAfterStep: true, keepThroughBeats: true });
    b.seg(A, Bp, { step: 1, id: 'seg:AB', w: 2.2, hideUntilHl: true, keepAfterStep: true });
    b.seg(Bp, F, { step: 1, id: 'seg:BF', w: 2.2, hideUntilHl: true, keepAfterStep: true });
    b.tick(D, A, 1, { step: 1, hideUntilHl: true, keepAfterStep: true, id: 'tick:DA' });
    b.tick(A, Bp, 2, { step: 1, hideUntilHl: true, keepAfterStep: true, id: 'tick:AB' });
    b.tick(Bp, F, 3, { step: 1, hideUntilHl: true, keepAfterStep: true, id: 'tick:BF' });
    b.circle(A, Y, { step: 1, id: 'cir:cutY', role: 'scaffold', wide: true, hideUntilHl: true });
    b.circle(Bp, Z, { step: 1, id: 'cir:cutZ', role: 'scaffold', wide: true, hideUntilHl: true });
    /* equal lengths: given line ↔ cut-off segment only */
    b.link('X', 'seg:X'); b.link('X', 'seg:DA'); b.link('DA', 'seg:DA'); b.link('DA', 'seg:X');
    b.link('Y', 'seg:Y'); b.link('Y', 'seg:AB'); b.link('AB', 'seg:AB'); b.link('AB', 'seg:Y');
    b.link('Z', 'seg:Z'); b.link('Z', 'seg:BF'); b.link('BF', 'seg:BF'); b.link('BF', 'seg:Z');
    b.link('AD', 'seg:DA'); b.link('AD', 'seg:X'); b.link('BA', 'seg:AB'); b.link('BA', 'seg:Y');
    b.link('FB', 'seg:BF'); b.link('FB', 'seg:Z');
    b.link('AE', 'seg:AE'); b.link('EA', 'seg:AE');
    /* later steps: circles for the triangle and the triangle itself */
    b.circle(A, X, { step: 2, id: 'cir:A', role: 'scaffold' });
    b.circle(Bp, Z, { step: 3, id: 'cir:B', role: 'scaffold' });
    /* intersection named on line 4 (no joins yet); AC/CB on line 5 */
    const C = b.at('C', interCC(A, X, Bp, Z, 1), { step: 4, dir: [0, 1] });
    /* AC = X (1 tick), AB = Y (2 ticks, above), BC = Z (3 ticks) */
    b.seg(A, C, { step: 5, ticks: 1, id: 'seg:AC' });
    b.seg(C, Bp, { step: 5, ticks: 3, id: 'seg:CB' });
    b.link('BC', 'seg:CB'); b.link('CB', 'seg:CB');
    b.poly('ABC', [A, Bp, C], { step: 6 });
  }
};

/* ============================================================
   THEOREM 20 — copy an angle
   ============================================================ */
FIGS['thm:20'] = {
  build(b) {
    const X = b.pt('X', -160, -34, { dir: [-1, -0.4], clamp: q =>
      minDistFrom(V(-129, 57), 40)(minDistFrom(V(-50, -12), 40)(q)) });
    const A = b.at('A', add(V(-160, -34), mul(unit(V(0.34, 1)), 96)), { dir: [-0.6, 1] });
    const Bp = b.at('B', add(V(-160, -34), mul(unit(V(1, 0.20)), 112)), { dir: [0.6, -0.7] });
    b.seg(X, A); b.seg(X, Bp);
    b.ang(A, X, Bp, { r: 30 });
    b.seg(A, Bp, { step: 1, ticks: 3 });
    const P = b.pt('P', 40, -34, { dir: [-0.6, -0.7], clamp: q => {
      const p = minDistFrom(V(210, -34), 60)(q);
      return V(Math.min(p.x, 140), p.y);
    } });
    const R = b.at('R', V(210, -34), { dir: [1, 0] });
    b.ray(P, R, { id: 'ray:PR' });
    b.at('R', V(206, -34), { show: false });
    const dXB = dist(X, Bp), dXA = dist(X, A), dAB = dist(A, Bp);
    const T = b.at('T', add(P, mul(unit(sub(R, P)), dXB)), { step: 2, dir: [0.3, -1] });
    b.tick(X, Bp, 1, { step: 2 }); b.tick(P, T, 1, { step: 2 });
    const Z = b.at('Z', interCC(P, dXA, T, dAB, 1), { step: 3, dir: [0, 1] });
    b.circle(P, dXA, { step: 3, role: 'scaffold', wide: true, id: 'cir:P' });
    b.circle(T, dAB, { step: 3, role: 'scaffold', wide: true, id: 'cir:T' });
    b.seg(P, Z, { step: 3, ticks: 2 }); b.seg(Z, T, { step: 3, ticks: 3 });
    b.tick(X, A, 2, { step: 3 });
    b.poly('XAB', [X, A, Bp], { step: 3, id: 'poly:XAB', cls: 'tri1' });
    b.poly('PZT', [P, Z, T], { step: 3, id: 'poly:PZT', cls: 'tri2' });
    b.ang(Z, P, T, { r: 30, step: 4, id: 'ang:ZPT' });
    b.text('∠ZPT = ∠AXB', add(P, V(46, -26)), { size: 12, step: 5, anchor: 'middle' });
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
