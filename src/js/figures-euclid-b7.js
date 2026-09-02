/* ============================================================
   Euclid Book VII figures — numbers as measured lines
   (the classical plates: a number is a segment of units).
   Letters match Joyce so click-to-highlight works.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add } = G;
const FIGS = root.FIGS || (root.FIGS = {});

const LEFT = -140;
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
    const dir = first ? [-1, 0] : last ? [1, 0] : [0, (i % 2 ? 1 : -1)];
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
        b.link(tok, piece); b.link(rtok, piece);
      }
    }
  }
  return pts;
}
function cap(b, s, y) {
  b.text(s, V(0, y), { anchor: 'middle', size: 13 });
}

FIGS['b7:def:1'] = {
  build(b) {
    mag(b, 'A', 0, 28, { ticks: 1, cls: 'accent' });
    cap(b, 'a unit — that by which each thing is called one', -40);
  }
};
FIGS['b7:def:2'] = {
  build(b) {
    mag(b, 'A', 20, 120, { ticks: 4, cls: 'accent' });
    cap(b, 'a number — a multitude of units', -24);
  }
};
FIGS['b7:def:3'] = FIGS['b7:def:5'] = {
  build(b) {
    mag(b, 'A', 36, 40, { ticks: 2, cls: 'accent' });
    mag(b, 'B', -8, 120, { ticks: 6 });
    cap(b, 'A measures B  ·  B is a multiple of A', -48);
  }
};
FIGS['b7:def:4'] = {
  build(b) {
    mag(b, 'A', 36, 50, { ticks: 2, cls: 'accent' });
    mag(b, 'B', -8, 110, { ticks: 5 });
    cap(b, 'A is parts of B  (it does not measure B)', -48);
  }
};
FIGS['b7:def:6'] = {
  build(b) {
    mag(b, 'ACB', 10, [60, 60], { cls: 'accent' });
    cap(b, 'even: divided into two equal numbers', -36);
  }
};
FIGS['b7:def:7'] = {
  build(b) {
    mag(b, 'A', 10, 105, { ticks: 3, cls: 'accent' });
    cap(b, 'odd: not divided in half', -36);
  }
};
FIGS['b7:def:8'] = FIGS['b7:def:9'] = FIGS['b7:def:10'] = {
  build(b) {
    mag(b, 'A', 36, 80, { ticks: 4, cls: 'accent' });
    mag(b, 'B', -8, 40, { ticks: 2 });
    cap(b, 'measured according to an even or odd number', -48);
  }
};
FIGS['b7:def:11'] = {
  build(b) {
    mag(b, 'A', 10, 84, { ticks: 1, cls: 'accent' });
    cap(b, 'prime: measured by a unit alone', -36);
  }
};
FIGS['b7:def:12'] = {
  build(b) {
    mag(b, 'A', 36, 96, { ticks: 3, cls: 'accent' });
    mag(b, 'B', -8, 80, { ticks: 5 });
    cap(b, 'relatively prime: common measure is the unit', -48);
  }
};
FIGS['b7:def:13'] = FIGS['b7:def:14'] = {
  build(b) {
    mag(b, 'A', 36, 40, { ticks: 2, cls: 'accent' });
    mag(b, 'B', -8, 120, { ticks: 6 });
    cap(b, 'composite: measured by some number', -48);
  }
};
FIGS['b7:def:15'] = {
  build(b) {
    mag(b, 'A', 50, 36, { ticks: 2, cls: 'accent' });
    mag(b, 'B', 14, 54, { ticks: 3 });
    mag(b, 'C', -22, 108, { ticks: 6, cls: 'accent' });
    cap(b, 'A multiplied by B  makes  C', -58);
  }
};
FIGS['b7:def:16'] = {
  build(b) {
    mag(b, 'A', 36, 48, { ticks: 3, cls: 'accent' });
    mag(b, 'B', -8, 64, { ticks: 4 });
    cap(b, 'plane number: sides A and B', -48);
  }
};
FIGS['b7:def:17'] = {
  build(b) {
    mag(b, 'A', 50, 36, { ticks: 2, cls: 'accent' });
    mag(b, 'B', 14, 48, { ticks: 3 });
    mag(b, 'C', -22, 40, { ticks: 2 });
    cap(b, 'solid number: three sides', -58);
  }
};
FIGS['b7:def:18'] = {
  build(b) {
    mag(b, 'A', 20, 90, { ticks: 3, cls: 'accent' });
    cap(b, 'square: equal times equal', -24);
  }
};
FIGS['b7:def:19'] = {
  build(b) {
    mag(b, 'A', 20, 80, { ticks: 2, cls: 'accent' });
    cap(b, 'cube: equal times equal times equal', -24);
  }
};
FIGS['b7:def:20'] = {
  build(b) {
    mag(b, 'A', 50, 40, { ticks: 2, cls: 'accent' });
    mag(b, 'B', 16, 80, { ticks: 4 });
    mag(b, 'C', -18, 30, { ticks: 3, cls: 'accent' });
    mag(b, 'D', -52, 60, { ticks: 6 });
    cap(b, 'A : B  =  C : D   (the same multiple or the same part)', -88);
  }
};
FIGS['b7:def:21'] = {
  build(b) {
    mag(b, 'A', 36, 48, { ticks: 2, cls: 'accent' });
    mag(b, 'B', 2, 72, { ticks: 3, cls: 'accent' });
    mag(b, 'C', -32, 64, { ticks: 4 });
    mag(b, 'D', -66, 96, { ticks: 6 });
    cap(b, 'similar plane numbers: proportional sides', -102);
  }
};
FIGS['b7:def:22'] = {
  build(b) {
    mag(b, 'A', 36, 90, { ticks: 6, cls: 'accent' });
    mag(b, 'B', 2, 15, { ticks: 1 });
    mag(b, 'C', -32, 30, { ticks: 2 });
    mag(b, 'D', -66, 45, { ticks: 3 });
    cap(b, 'perfect: equal to the sum of its own parts  (6 = 1+2+3)', -102);
  }
};

function four(b, caption, yCap) {
  mag(b, 'A', 54, 40, { cls: 'accent' });
  mag(b, 'B', 20, 60);
  mag(b, 'C', -14, 50, { cls: 'accent', step: 1 });
  mag(b, 'D', -48, 75, { step: 1 });
  cap(b, caption, yCap || -84);
}
function pairUnit(b, caption) {
  mag(b, 'A', 54, 32, { ticks: 1, cls: 'accent' });
  mag(b, 'BC', 20, 90);
  mag(b, 'D', -14, 48, { ticks: 2, cls: 'accent', step: 1 });
  mag(b, 'EF', -48, 90, { step: 1 });
  cap(b, caption, -84);
}
function pairParts(b, caption) {
  mag(b, 'AB', 54, [40, 40], { cls: 'accent' });
  mag(b, 'C', 20, 50);
  mag(b, 'DE', -14, [32, 32], { cls: 'accent', step: 1 });
  mag(b, 'F', -48, 40, { step: 1 });
  cap(b, caption, -84);
}

FIGS['b7:prop:1'] = {
  build(b) {
    mag(b, 'AHFB', 54, [20, 40, 80], { cls: 'accent' });
    mag(b, 'CGD', 18, [36, 84]);
    mag(b, 'E', -16, 40, { step: 1 });
    cap(b, 'subtract in turn  ·  a unit remains  ⇒  relatively prime', -52);
  }
};
FIGS['b7:prop:2'] = {
  build(b) {
    mag(b, 'AB', 36, 140, { cls: 'accent' });
    mag(b, 'CD', 2, 84);
    mag(b, 'E', -32, 28, { cls: 'accent', step: 1 });
    cap(b, 'greatest common measure of two numbers', -68);
  }
};
FIGS['b7:prop:3'] = {
  build(b) {
    mag(b, 'A', 50, 120, { cls: 'accent' });
    mag(b, 'B', 16, 90);
    mag(b, 'C', -18, 60);
    mag(b, 'D', -52, 30, { cls: 'accent', step: 1 });
    cap(b, 'greatest common measure of three numbers', -88);
  }
};
FIGS['b7:prop:4'] = {
  build(b) {
    mag(b, 'A', 20, 50, { cls: 'accent' });
    mag(b, 'BC', -16, 120, { step: 1 });
    cap(b, 'the less is a part, or parts, of the greater', -52);
  }
};
FIGS['b7:prop:5'] = FIGS['b7:prop:9'] = {
  build(b) { pairUnit(b, 'the same part of sums and remainders'); }
};
FIGS['b7:prop:6'] = FIGS['b7:prop:10'] = {
  build(b) { pairParts(b, 'the same parts of sums and remainders'); }
};
FIGS['b7:prop:7'] = FIGS['b7:prop:8'] = FIGS['b7:prop:11'] = {
  build(b) {
    mag(b, 'AEB', 36, [50, 70], { cls: 'accent', ptSteps: [0, 1, 0] });
    mag(b, 'CFD', -8, [40, 56], { ptSteps: [0, 1, 0] });
    cap(b, 'as whole to whole, so remainder to remainder', -48);
  }
};
FIGS['b7:prop:12'] = {
  build(b) { four(b, 'as one to one, so all antecedents to all consequents'); }
};
FIGS['b7:prop:13'] = {
  build(b) { four(b, 'alternando:  A : C  =  B : D'); }
};
FIGS['b7:prop:14'] = {
  build(b) {
    mag(b, 'A', 70, 80, { cls: 'accent' });
    mag(b, 'B', 36, 50);
    mag(b, 'C', 2, 30);
    mag(b, 'D', -32, 80, { cls: 'accent', step: 1 });
    mag(b, 'E', -66, 50, { step: 1 });
    mag(b, 'F', -100, 30, { step: 1 });
    cap(b, 'ex aequali  A : C  =  D : F', -132);
  }
};
FIGS['b7:prop:15'] = {
  build(b) {
    mag(b, 'A', 70, 24, { ticks: 1, cls: 'accent' });
    mag(b, 'BC', 36, 72);
    mag(b, 'D', 2, 48, { ticks: 2, cls: 'accent', step: 1 });
    mag(b, 'EF', -32, 96, { step: 1 });
    cap(b, 'unit A measures BC as D measures EF', -68);
  }
};
FIGS['b7:prop:16'] = {
  build(b) {
    mag(b, 'A', 36, 60, { ticks: 3, cls: 'accent' });
    mag(b, 'B', 2, 80, { ticks: 4 });
    mag(b, 'C', -32, 240, { ticks: 12, cls: 'accent', step: 1 });
    mag(b, 'D', -66, 240, { ticks: 12, step: 1 });
    cap(b, 'A×B  =  B×A', -102);
  }
};
FIGS['b7:prop:17'] = FIGS['b7:prop:18'] = {
  build(b) {
    mag(b, 'A', 50, 40, { cls: 'accent' });
    mag(b, 'B', 16, 70);
    mag(b, 'C', -18, 120, { cls: 'accent', step: 1 });
    mag(b, 'D', -52, 210, { step: 1 });
    cap(b, 'multiples keep the ratio of the numbers multiplied', -88);
  }
};
FIGS['b7:prop:19'] = {
  build(b) { four(b, 'A : B  =  C : D  ⇔  A×D  =  B×C'); }
};
FIGS['b7:prop:20'] = FIGS['b7:prop:21'] = FIGS['b7:prop:22'] = {
  build(b) { four(b, 'least numbers of a ratio  ·  relatively prime'); }
};
FIGS['b7:prop:23'] = FIGS['b7:prop:24'] = FIGS['b7:prop:25'] = FIGS['b7:prop:26'] = FIGS['b7:prop:27'] = FIGS['b7:prop:28'] = FIGS['b7:prop:29'] = {
  build(b) {
    mag(b, 'A', 36, 48, { ticks: 1, cls: 'accent' });
    mag(b, 'B', 2, 80);
    mag(b, 'C', -32, 120, { step: 1 });
    cap(b, 'primes and relative primeness', -68);
  }
};
FIGS['b7:prop:30'] = {
  build(b) {
    mag(b, 'A', 50, 36, { ticks: 1, cls: 'accent' });
    mag(b, 'B', 16, 60);
    mag(b, 'C', -18, 80, { step: 1 });
    mag(b, 'D', -52, 180, { cls: 'accent', step: 1 });
    cap(b, 'a prime measuring a product measures a factor', -88);
  }
};
FIGS['b7:prop:31'] = FIGS['b7:prop:32'] = {
  build(b) {
    mag(b, 'A', 20, 150, { ticks: 6, cls: 'accent' });
    mag(b, 'B', -16, 50, { ticks: 2, step: 1 });
    cap(b, 'every composite is measured by a prime', -52);
  }
};
FIGS['b7:prop:33'] = {
  build(b) { four(b, 'least numbers of the same ratio'); }
};
FIGS['b7:prop:34'] = FIGS['b7:prop:35'] = {
  build(b) {
    mag(b, 'A', 36, 60, { cls: 'accent' });
    mag(b, 'B', 2, 90);
    mag(b, 'C', -32, 180, { cls: 'accent', step: 1 });
    cap(b, 'least common multiple of two numbers', -68);
  }
};
FIGS['b7:prop:36'] = {
  build(b) {
    mag(b, 'A', 50, 48, { cls: 'accent' });
    mag(b, 'B', 16, 72);
    mag(b, 'C', -18, 96);
    mag(b, 'D', -52, 288, { cls: 'accent', step: 1 });
    cap(b, 'least common multiple of three numbers', -88);
  }
};
FIGS['b7:prop:37'] = FIGS['b7:prop:38'] = FIGS['b7:prop:39'] = {
  build(b) {
    mag(b, 'A', 36, 40, { ticks: 2, cls: 'accent' });
    mag(b, 'B', 2, 120, { ticks: 6, step: 1 });
    cap(b, 'a part of the same name as the measuring number', -48);
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
