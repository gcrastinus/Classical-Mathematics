/* ============================================================
   Augros Chapter 7 teaching plates. Euclid VII reused via figId;
   remaining pictures are numbers as unit-measured lines.
   ============================================================ */
(function (root) {
'use strict';
const G = root.Geom;
const { V, add } = G;
const FIGS = root.FIGS || (root.FIGS = {});

function mag(b, name, y, len, o) {
  o = o || {};
  const st = o.step || 0;
  const P = b.at(name, V(o.x0 === undefined ? -120 : o.x0, y), { dir: [-1, 0], step: st, role: o.role });
  const Q = add(P, V(len, 0));
  b.seg(P, Q, { id: 'seg:' + name, cls: o.cls, w: o.w || 2.4, name: name, step: st, role: o.role });
  if (o.ticks) b.tick(P, Q, o.ticks, { id: 'tk:' + name, step: st, role: o.role });
  return P;
}

FIGS['ch7:def:1'] = {
  build(b) {
    mag(b, 'A', 20, 30, { ticks: 1, cls: 'accent' });
    mag(b, 'B', -16, 90, { ticks: 3 });
    b.text('a multitude of units', V(0, -52), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:def:11'] = {
  build(b) {
    mag(b, 'N', 20, 120, { ticks: 6, cls: 'accent' });
    mag(b, 'M', -16, 40, { ticks: 2 });
    b.text('divide N by M  —  how many times M comes out', V(0, -52), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:def:12'] = {
  build(b) {
    mag(b, 'A', 50, 24, { ticks: 1, cls: 'accent' });
    mag(b, 'B', 16, 72, { ticks: 3 });
    mag(b, 'C', -18, 144, { ticks: 6 });
    mag(b, 'D', -52, 240, { ticks: 10 });
    b.text('triangular numbers  1, 3, 6, 10', V(0, -88), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:def:15'] = FIGS['ch7:def:16'] = {
  build(b) {
    mag(b, 'A', 20, 80, { ticks: 4, cls: 'accent' });
    b.text('a power  /  a factorial', V(0, -24), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:6'] = FIGS['b7:prop:1'];
FIGS['ch7:thm:14'] = FIGS['b7:prop:31'];
FIGS['ch7:thm:15'] = {
  build(b) {
    mag(b, 'P', 36, 50, { ticks: 1, cls: 'accent' });
    mag(b, 'Q', -8, 140, { ticks: 5, step: 1 });
    b.text('there is always a greater prime', V(0, -48), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:16'] = {
  build(b) {
    mag(b, 'A', 36, 180, { cls: 'accent' });
    mag(b, 'B', -8, 180, { step: 1 });
    b.text('arbitrarily many composites in a row', V(0, -48), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:19'] = FIGS['ch7:def:12'];
FIGS['ch7:thm:20'] = {
  build(b) {
    mag(b, 'A', 36, 72, { ticks: 3, cls: 'accent' });
    mag(b, 'B', 2, 144, { ticks: 6, step: 1 });
    mag(b, 'C', -32, 216, { ticks: 9, cls: 'accent', step: 1 });
    b.text('two consecutive triangular numbers make a square', V(0, -68), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:21'] = {
  build(b) {
    mag(b, 'A', 36, 24, { ticks: 1, cls: 'accent' });
    mag(b, 'B', 2, 72, { ticks: 3, step: 1 });
    mag(b, 'C', -32, 120, { ticks: 5, step: 1 });
    b.text('a square is a sum of consecutive odds', V(0, -68), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:22'] = FIGS['b7:def:18'];
FIGS['ch7:thm:23'] = FIGS['b7:def:18'];
FIGS['ch7:thm:24'] = FIGS['b7:def:11'];
FIGS['ch7:thm:25'] = FIGS['b7:def:21'];
FIGS['ch7:thm:26'] = FIGS['b7:def:21'];
FIGS['ch7:thm:27'] = FIGS['b7:def:18'];
FIGS['ch7:thm:28'] = FIGS['b7:prop:19'];
FIGS['ch7:thm:29'] = FIGS['b7:prop:19'];
FIGS['ch7:thm:30'] = {
  build(b) {
    mag(b, 'A', 50, 24, { ticks: 1, cls: 'accent' });
    mag(b, 'B', 16, 48, { ticks: 2, step: 1 });
    mag(b, 'C', -18, 96, { ticks: 4, step: 1 });
    mag(b, 'D', -52, 192, { ticks: 8, cls: 'accent', step: 1 });
    b.text('continuous proportion from 1', V(0, -88), { anchor: 'middle', size: 13 });
  }
};
FIGS['ch7:thm:31'] = FIGS['ch7:thm:30'];
FIGS['ch7:thm:32'] = FIGS['b7:def:22'];

})(typeof window !== 'undefined' ? window : globalThis);
