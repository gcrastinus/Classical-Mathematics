/* ============================================================
   Euclid Book V figures — magnitudes as straight lines
   (the classical plates: no areas, no point-clouds).
   Letters match Joyce/Heiberg so click-to-highlight works.
   Equimultiples are the same line cut into equal copies.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add } = G;
const FIGS = root.FIGS || (root.FIGS = {});

const LEFT = -140;

/** One horizontal magnitude. `names` is a letter-string (A, AB, AEB…).
    `parts` is a length, or an array of consecutive piece-lengths.
    `o.step` / `o.role` apply to the whole line; `o.ptSteps` / `o.segSteps`
    override per point or piece so Replay can draw copies after the given. */
function mag(b, names, y, parts, o) {
  o = o || {};
  if (typeof names === 'string') names = names.split('');
  if (typeof parts === 'number') {
    parts = names.length === 1 ? [parts] : Array(names.length - 1).fill(parts);
  }
  const x0 = o.x0 === undefined ? LEFT : o.x0;
  const w = o.w || 2.4;
  const stepOf = (arr, i) => (arr && arr[i] !== undefined ? arr[i] : (o.step || 0));
  if (names.length === 1) {
    const st = stepOf(o.ptSteps, 0);
    const P = b.at(names[0], V(x0, y), { dir: o.dir || [-1, 0], step: st, role: o.role });
    const Q = add(P, V(parts[0], 0));
    b.seg(P, Q, { id: 'seg:' + names[0], cls: o.cls, w: w, name: names[0], step: stepOf(o.segSteps, 0), role: o.role });
    if (o.ticks) b.tick(P, Q, o.ticks, { id: 'tk:' + names[0], step: stepOf(o.segSteps, 0), role: o.role });
    return [P, Q];
  }
  const pts = [];
  let x = x0;
  names.forEach((nm, i) => {
    const first = i === 0, last = i === names.length - 1;
    const dir = (o.dirs && o.dirs[i]) || (first ? [-1, 0] : last ? [1, 0] : [0, (i % 2 ? 1 : -1)]);
    pts.push(b.at(nm, V(x, y), { dir, step: stepOf(o.ptSteps, i), role: o.role }));
    if (i < parts.length) x += parts[i];
  });
  for (let i = 0; i < pts.length - 1; i++) {
    b.seg(pts[i], pts[i + 1], { cls: o.cls, w: w, step: stepOf(o.segSteps, i), role: o.role });
  }
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 2; j < names.length; j++) {
      const tok = names[i] + names[j], rtok = names[j] + names[i];
      for (let k = i; k < j; k++) {
        const piece = 'seg:' + names[k] + names[k + 1];
        b.link(tok, piece);
        b.link(rtok, piece);
      }
    }
  }
  return pts;
}
function cap(b, s, y) {
  b.text(s, V(0, y), { anchor: 'middle', size: 13 });
}

/* ----- definitions ----- */
FIGS['b5:def:1'] = FIGS['b5:def:2'] = {
  build(b) {
    mag(b, 'A', 22, 40);
    mag(b, 'B', -18, 120, { ticks: 2, cls: 'accent' });
    cap(b, 'A measures B three times', -54);
  }
};
FIGS['b5:def:3'] = FIGS['b5:def:4'] = {
  build(b) {
    mag(b, 'A', 22, 70, { cls: 'accent' });
    mag(b, 'B', -18, 105);
    cap(b, 'A : B  — a ratio of magnitudes of the same kind', -54);
  }
};
FIGS['b5:def:5'] = FIGS['b5:def:6'] = {
  build(b) {
    mag(b, 'A', 70, 90, { cls: 'accent' });
    mag(b, 'B', 36, 60);
    mag(b, 'C', 2, 75, { cls: 'accent' });
    mag(b, 'D', -32, 50);
    cap(b, 'A : B  =  C : D   when equimultiples compare alike', -68);
  }
};
FIGS['b5:def:7'] = {
  build(b) {
    mag(b, 'A', 70, 96, { cls: 'accent' });
    mag(b, 'B', 36, 48);
    mag(b, 'C', 2, 72, { cls: 'accent' });
    mag(b, 'D', -32, 70);
    cap(b, 'A : B  >  C : D', -68);
  }
};
FIGS['b5:def:8'] = {
  build(b) {
    mag(b, 'A', 36, 96, { cls: 'accent' });
    mag(b, 'B', 2, 64);
    mag(b, 'C', -32, 42);
    cap(b, 'A : B  =  B : C   (three terms)', -68);
  }
};
FIGS['b5:def:9'] = FIGS['b5:def:10'] = {
  build(b) {
    mag(b, 'A', 70, 100, { cls: 'accent' });
    mag(b, 'B', 36, 70);
    mag(b, 'C', 2, 49);
    mag(b, 'D', -32, 34);
    cap(b, 'duplicate / triplicate ratio along a chain', -68);
  }
};
FIGS['b5:def:11'] = FIGS['b5:def:12'] = {
  build(b) {
    mag(b, 'A', 54, 90, { cls: 'accent' });
    mag(b, 'B', 20, 60);
    mag(b, 'C', -14, 75, { cls: 'accent' });
    mag(b, 'D', -48, 50);
    cap(b, 'antecedents A, C  ·  consequents B, D', -82);
  }
};
FIGS['b5:def:13'] = {
  build(b) {
    mag(b, 'A', 54, 90, { cls: 'accent' });
    mag(b, 'B', 20, 60);
    mag(b, 'C', -14, 75, { cls: 'accent' });
    mag(b, 'D', -48, 50);
    cap(b, 'inverse:  B : A  =  D : C', -82);
  }
};
FIGS['b5:def:14'] = {
  build(b) {
    mag(b, 'ACB', 22, [90, 60], { cls: 'accent' });
    cap(b, 'taken jointly:  AB : BC', -58);
  }
};
FIGS['b5:def:15'] = {
  build(b) {
    mag(b, 'ACB', 22, [90, 60], { cls: 'accent' });
    cap(b, 'taken separately:  AC : CB', -58);
  }
};
FIGS['b5:def:16'] = {
  build(b) {
    mag(b, 'ACB', 22, [90, 60], { cls: 'accent' });
    cap(b, 'conversion:  AB : AC', -58);
  }
};
FIGS['b5:def:17'] = {
  build(b) {
    mag(b, 'A', 70, 80, { cls: 'accent' });
    mag(b, 'B', 36, 55);
    mag(b, 'C', 2, 36);
    mag(b, 'D', -32, 80, { cls: 'accent' });
    mag(b, 'E', -66, 55);
    mag(b, 'F', -100, 36);
    cap(b, 'ex aequali:  A : C  =  D : F', -132);
  }
};
FIGS['b5:def:18'] = {
  build(b) {
    mag(b, 'A', 70, 80, { cls: 'accent' });
    mag(b, 'B', 36, 55);
    mag(b, 'C', 2, 36);
    mag(b, 'D', -32, 50);
    mag(b, 'E', -66, 70, { cls: 'accent' });
    mag(b, 'F', -100, 48);
    cap(b, 'perturbed proportion', -132);
  }
};

/* ----- propositions -----
   Given magnitudes: step 0. Equimultiples taken, cuts, and copies: step 1+.
   Course theorems reuse these plates, so constructed steps stay ≤ 3. */
FIGS['b5:prop:1'] = {
  build(b) {
    mag(b, 'E', -16, 48);
    mag(b, 'F', -50, 32);
    mag(b, 'AGB', 54, [48, 48], { cls: 'accent', step: 1 });
    mag(b, 'CHD', 18, [32, 32], { step: 1 });
    cap(b, 'equimultiples of a sum', -86);
  }
};
FIGS['b5:prop:2'] = {
  build(b) {
    mag(b, 'C', -16, 40);
    mag(b, 'F', -50, 32);
    mag(b, 'ABG', 54, [80, 40], { cls: 'accent', step: 1 });
    mag(b, 'DEH', 18, [64, 32], { step: 1 });
    cap(b, 'adding equimultiples', -86);
  }
};
FIGS['b5:prop:3'] = {
  build(b) {
    mag(b, 'A', 70, 40);
    mag(b, 'B', 36, 20);
    mag(b, 'C', 2, 32);
    mag(b, 'D', -32, 16);
    mag(b, 'EKF', -66, [40, 40], { cls: 'accent', step: 1 });
    mag(b, 'GLH', -100, [32, 32], { step: 1 });
    cap(b, 'a multiple of a multiple', -134);
  }
};
FIGS['b5:prop:4'] = {
  build(b) {
    mag(b, 'A', 86, 40, { cls: 'accent' });
    mag(b, 'B', 52, 28);
    mag(b, 'C', 18, 32, { cls: 'accent' });
    mag(b, 'D', -16, 22);
    mag(b, 'E', -50, 80, { step: 1 });
    mag(b, 'F', -84, 64, { step: 1 });
    mag(b, 'G', -118, 56, { step: 1 });
    mag(b, 'H', -152, 44, { step: 1 });
    cap(b, 'equimultiples of proportionals are proportional', -186);
  }
};
FIGS['b5:prop:5'] = {
  build(b) {
    mag(b, 'AEB', 36, [40, 80], { cls: 'accent', ptSteps: [0, 1, 0] });
    mag(b, 'CFD', -8, [28, 56], { ptSteps: [0, 1, 0] });
    cap(b, 'taking away the same multiple', -48);
  }
};
FIGS['b5:prop:6'] = {
  build(b) {
    mag(b, 'E', -16, 40);
    mag(b, 'F', -50, 32);
    mag(b, 'AGB', 54, [80, 40], { cls: 'accent', step: 1 });
    mag(b, 'CHD', 18, [64, 32], { step: 1 });
    cap(b, 'taking away from equimultiples', -86);
  }
};
FIGS['b5:prop:7'] = {
  build(b) {
    mag(b, 'A', 36, 80, { cls: 'accent' });
    mag(b, 'B', 2, 80);
    mag(b, 'C', -32, 50, { step: 1 });
    cap(b, 'equals have the same ratio to C', -68);
  }
};
FIGS['b5:prop:8'] = {
  build(b) {
    mag(b, 'AEB', 90, [36, 70], { cls: 'accent', ptSteps: [0, 1, 0] });
    mag(b, 'C', 54, 70);
    mag(b, 'D', 18, 40);
    mag(b, 'FGH', -18, [72, 140], { step: 2 });
    mag(b, 'K', -54, 140, { step: 2 });
    mag(b, 'N', -90, 160, { step: 2 });
    cap(b, 'the greater has the greater ratio to the same', -124);
  }
};
FIGS['b5:prop:9'] = FIGS['b5:prop:7'];
FIGS['b5:prop:10'] = {
  build(b) {
    mag(b, 'A', 36, 90, { cls: 'accent' });
    mag(b, 'C', -32, 50);
    mag(b, 'B', 2, 55, { step: 1 });
    cap(b, 'the greater ratio belongs to the greater', -68);
  }
};
FIGS['b5:prop:11'] = {
  build(b) {
    mag(b, 'A', 70, 90, { cls: 'accent' });
    mag(b, 'B', 36, 60);
    mag(b, 'C', 2, 75);
    mag(b, 'D', -32, 50);
    mag(b, 'E', -66, 60, { cls: 'accent', step: 1 });
    mag(b, 'F', -100, 40, { step: 1 });
    cap(b, 'A : B  =  C : D  =  E : F', -134);
  }
};
FIGS['b5:prop:12'] = {
  build(b) {
    mag(b, 'A', 70, 90, { cls: 'accent' });
    mag(b, 'B', 36, 60);
    mag(b, 'C', 2, 90, { cls: 'accent', step: 1 });
    mag(b, 'D', -32, 60, { step: 1 });
    mag(b, 'E', -66, 90, { cls: 'accent', step: 1 });
    mag(b, 'F', -100, 60, { step: 1 });
    cap(b, 'as one to one, so all to all', -134);
  }
};
FIGS['b5:prop:13'] = {
  build(b) {
    mag(b, 'A', 86, 90, { cls: 'accent' });
    mag(b, 'B', 52, 60);
    mag(b, 'C', 18, 70, { cls: 'accent' });
    mag(b, 'D', -16, 50);
    mag(b, 'E', -50, 55, { step: 1 });
    mag(b, 'F', -84, 80, { step: 1 });
    cap(b, 'if C : D  >  E : F  then  A : B  >  E : F', -118);
  }
};
FIGS['b5:prop:14'] = {
  build(b) {
    mag(b, 'A', 54, 100, { cls: 'accent' });
    mag(b, 'B', 20, 70);
    mag(b, 'C', -14, 70, { cls: 'accent', step: 1 });
    mag(b, 'D', -48, 48, { step: 1 });
    cap(b, 'if A : B = C : D and A > C then B > D', -82);
  }
};
FIGS['b5:prop:15'] = {
  build(b) {
    mag(b, 'C', 2, 40);
    mag(b, 'F', -66, 28);
    mag(b, 'AGHB', 36, [40, 40, 40], { cls: 'accent', step: 1 });
    mag(b, 'DKLE', -32, [28, 28, 28], { step: 1 });
    cap(b, 'parts as similar multiples', -100);
  }
};
FIGS['b5:prop:16'] = {
  build(b) {
    mag(b, 'A', 86, 90, { cls: 'accent' });
    mag(b, 'B', 52, 60);
    mag(b, 'C', 18, 75, { cls: 'accent' });
    mag(b, 'D', -16, 50);
    mag(b, 'E', -50, 90, { step: 1 });
    mag(b, 'F', -84, 60, { step: 1 });
    mag(b, 'G', -118, 75, { step: 1 });
    mag(b, 'H', -152, 50, { step: 1 });
    cap(b, 'alternando:  A : C  =  B : D', -186);
  }
};
FIGS['b5:prop:17'] = {
  build(b) {
    mag(b, 'ABE', 70, [80, 50], { cls: 'accent' });
    mag(b, 'CDF', 36, [64, 40]);
    mag(b, 'GHKO', 2, [48, 30, 30], { step: 1 });
    mag(b, 'LMNP', -32, [40, 24, 24], { step: 1 });
    cap(b, 'separando', -68);
  }
};
FIGS['b5:prop:18'] = {
  build(b) {
    mag(b, 'AEB', 36, [80, 50], { cls: 'accent' });
    mag(b, 'CFD', -8, [64, 40], { step: 1 });
    cap(b, 'componendo:  (A+B) : B', -48);
  }
};
FIGS['b5:prop:19'] = {
  build(b) {
    mag(b, 'AEB', 36, [70, 40], { cls: 'accent' });
    mag(b, 'CFD', -8, [56, 32], { step: 1 });
    cap(b, 'as whole to whole, so remainder to remainder', -48);
  }
};
FIGS['b5:prop:20'] = {
  build(b) {
    mag(b, 'A', 70, 80, { cls: 'accent' });
    mag(b, 'B', 36, 55);
    mag(b, 'C', 2, 36);
    mag(b, 'D', -32, 80, { cls: 'accent', step: 1 });
    mag(b, 'E', -66, 55, { step: 1 });
    mag(b, 'F', -100, 36, { step: 1 });
    cap(b, 'ex aequali:  A : C  =  D : F', -132);
  }
};
FIGS['b5:prop:21'] = {
  build(b) {
    mag(b, 'A', 70, 80, { cls: 'accent' });
    mag(b, 'B', 36, 55);
    mag(b, 'C', 2, 36);
    mag(b, 'D', -32, 50, { step: 1 });
    mag(b, 'E', -66, 70, { cls: 'accent', step: 1 });
    mag(b, 'F', -100, 48, { step: 1 });
    cap(b, 'perturbed proportion', -132);
  }
};
FIGS['b5:prop:22'] = FIGS['b5:prop:20'];
FIGS['b5:prop:23'] = FIGS['b5:prop:21'];
FIGS['b5:prop:24'] = {
  build(b) {
    mag(b, 'C', 18, 55);
    mag(b, 'F', -50, 44);
    mag(b, 'ABG', 54, [80, 50], { cls: 'accent', step: 1 });
    mag(b, 'DEH', -16, [64, 40], { step: 1 });
    cap(b, 'adding two proportions', -86);
  }
};
FIGS['b5:prop:25'] = {
  build(b) {
    mag(b, 'E', -16, 70);
    mag(b, 'F', -50, 32);
    mag(b, 'AGB', 54, [70, 40], { cls: 'accent', ptSteps: [0, 1, 0] });
    mag(b, 'CHD', 18, [50, 32], { ptSteps: [0, 1, 0] });
    cap(b, 'greatest + least  >  the other two', -86);
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
