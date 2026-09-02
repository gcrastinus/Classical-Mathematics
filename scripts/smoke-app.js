#!/usr/bin/env node
/** Headless smoke: every figure builds and every theorem has a figure. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

global.window = global;
require(path.join(SRC, "js", "geom.js"));

const files = [
  "js/figures-defs.js",
  "js/figures-euclid-defs.js",
  "js/figures-thms-a.js",
  "js/figures-thms-b.js",
  "js/figures-thms-euclid-b1.js",
  "js/figures-euclid-b2.js",
  "js/figures-thms-ch2.js",
  "js/figures-euclid-b3.js",
  "js/figures-thms-ch3.js",
  "js/figures-euclid-b4.js",
  "js/figures-thms-ch4.js",
  "js/figures-euclid-b5.js",
  "js/figures-thms-ch5.js",
  "js/figures-euclid-b6.js",
  "js/figures-thms-ch6.js",
  "js/figures-euclid-b7.js",
  "js/figures-thms-ch7.js",
  "js/figkeys.js",
];
for (const rel of files) {
  const file = path.join(SRC, rel);
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: rel });
}

const Geom = global.Geom;
const FIGS = global.FIGS;
const content = JSON.parse(fs.readFileSync(path.join(SRC, "content", "course-ch1.json"), "utf8"));

if (!Geom || !Geom.makeFigure) {
  console.error("Geom.makeFigure missing");
  process.exit(1);
}
if (!FIGS || !Object.keys(FIGS).length) {
  console.error("FIGS empty");
  process.exit(1);
}

const ids = Object.keys(FIGS);
let failed = 0;
for (const id of ids) {
  try {
    const fig = Geom.makeFigure(FIGS[id], {});
    const out = fig.render({ w: 640, h: 480, upTo: Infinity });
    const svg = typeof out === "string" ? out : (out && out.svg);
    if (!svg || !String(svg).includes("<svg")) {
      console.error("no svg", id);
      failed++;
    }
  } catch (e) {
    console.error("build failed", id, e.message);
    failed++;
  }
}

const thms = content.theorems || [];
const missing = thms.filter((t) => !FIGS[t.id]).map((t) => t.id);
if (missing.length) {
  console.error("theorems with no figure:", missing.join(", "));
  failed += missing.length;
}

const corr = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/correspondence/book01.json"), "utf8")
);
const book1 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book01.json"), "utf8")
);
if ((book1.propositions || []).length !== 48) {
  console.error("Book I props", (book1.propositions || []).length);
  failed++;
}
const mapped = new Set(
  corr.pairs.filter((p) => p.euclid).map((p) => p.euclid)
);
corr.euclidOnly.forEach((p) => mapped.add(p.euclid));
const missingMap = book1.propositions.filter((p) => !mapped.has(p.id)).map((p) => p.id);
if (missingMap.length) {
  console.error("Book I props with no correspondence:", missingMap.join(", "));
  failed += missingMap.length;
}
const extraFigs = [17, 21, 24, 25, 36, 38, 39, 40, 41, 42, 44, 45];
const missingFigs = extraFigs.filter((n) => !FIGS["b1:prop:" + n]);
if (missingFigs.length) {
  console.error("missing Euclid-only figures", missingFigs.join(", "));
  failed += missingFigs.length;
}

const joyce = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book01.json"), "utf8")
);
if ((joyce.definitions || []).length !== 23) {
  console.error("Joyce defs", (joyce.definitions || []).length);
  failed++;
}
if ((joyce.postulates || []).length !== 5) {
  console.error("Joyce posts", (joyce.postulates || []).length);
  failed++;
}
if ((joyce.commonNotions || []).length !== 5) {
  console.error("Joyce common notions", (joyce.commonNotions || []).length);
  failed++;
}
const jprops = joyce.propositions || [];
if (jprops.length !== 48) {
  console.error("Joyce props", jprops.length);
  failed++;
}
const noSteps = jprops.filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (noSteps.length) {
  console.error("Joyce props without stepped proofs:", noSteps.join(", "));
  failed += noSteps.length;
}
const noStmt = jprops.filter((p) => !p.statement).map((p) => p.id);
if (noStmt.length) {
  console.error("Joyce props without statements:", noStmt.join(", "));
  failed += noStmt.length;
}
const i7 = jprops.find((p) => p.id === "b1:prop:7");
if (!i7 || i7.steps.length < 8) {
  console.error("I.7 should unpack to ≥8 steps, got", i7 && i7.steps.length);
  failed++;
}
const defFigs = [2, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const missingDefFigs = defFigs.filter((n) => !FIGS["b1:def:" + n]);
if (missingDefFigs.length) {
  console.error("missing Euclid definition figures", missingDefFigs.join(", "));
  failed += missingDefFigs.length;
}
const missingPostFigs = [1, 2, 3].filter((n) => !FIGS["b1:post:" + n]);
if (missingPostFigs.length) {
  console.error("missing Euclid postulate figures", missingPostFigs.join(", "));
  failed += missingPostFigs.length;
}
const joycePoint = (joyce.definitions || []).find((d) => d.id === "b1:def:1");
if (!joycePoint || !/no part/.test(joycePoint.text) || /of which there is no part/.test(joycePoint.text)) {
  console.error("Elements Def. 1 should be Joyce English, got", joycePoint && joycePoint.text);
  failed++;
}

const book2 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book02.json"), "utf8")
);
const joyce2 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book02.json"), "utf8")
);
if ((book2.propositions || []).length !== 14) {
  console.error("Book II props", (book2.propositions || []).length);
  failed++;
}
if ((joyce2.propositions || []).length !== 14) {
  console.error("Joyce II props", (joyce2.propositions || []).length);
  failed++;
}
const j2miss = (joyce2.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j2miss.length) {
  console.error("Joyce II without steps:", j2miss.join(", "));
  failed += j2miss.length;
}
const missingB2 = [];
for (let n = 1; n <= 14; n++) if (!FIGS["b2:prop:" + n]) missingB2.push(n);
if (!FIGS["b2:def:1"] || !FIGS["b2:def:2"]) missingB2.push("defs");
if (missingB2.length) {
  console.error("missing Book II figures", missingB2.join(", "));
  failed += missingB2.length;
}
const ch2 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch2.json"), "utf8"));
if ((ch2.theorems || []).length !== 12) {
  console.error("Chapter 2 theorems", (ch2.theorems || []).length);
  failed++;
}

const book3 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book03.json"), "utf8")
);
const joyce3 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book03.json"), "utf8")
);
if ((book3.propositions || []).length !== 37) {
  console.error("Book III props", (book3.propositions || []).length);
  failed++;
}
if ((joyce3.propositions || []).length !== 37) {
  console.error("Joyce III props", (joyce3.propositions || []).length);
  failed++;
}
const j3miss = (joyce3.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j3miss.length) {
  console.error("Joyce III without steps:", j3miss.join(", "));
  failed += j3miss.length;
}
const missingB3 = [];
for (let n = 1; n <= 37; n++) if (!FIGS["b3:prop:" + n]) missingB3.push(n);
for (let n = 1; n <= 11; n++) if (!FIGS["b3:def:" + n]) missingB3.push("def" + n);
if (missingB3.length) {
  console.error("missing Book III figures", missingB3.join(", "));
  failed += missingB3.length;
}
const ch3 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch3.json"), "utf8"));
if ((ch3.theorems || []).length !== 26) {
  console.error("Chapter 3 theorems", (ch3.theorems || []).length);
  failed++;
}

const book4 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book04.json"), "utf8")
);
const joyce4 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book04.json"), "utf8")
);
if ((book4.propositions || []).length !== 16) {
  console.error("Book IV props", (book4.propositions || []).length);
  failed++;
}
if ((joyce4.propositions || []).length !== 16) {
  console.error("Joyce IV props", (joyce4.propositions || []).length);
  failed++;
}
const j4miss = (joyce4.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j4miss.length) {
  console.error("Joyce IV without steps:", j4miss.join(", "));
  failed += j4miss.length;
}
const missingB4 = [];
for (let n = 1; n <= 16; n++) if (!FIGS["b4:prop:" + n]) missingB4.push(n);
for (let n = 1; n <= 7; n++) if (!FIGS["b4:def:" + n]) missingB4.push("def" + n);
if (missingB4.length) {
  console.error("missing Book IV figures", missingB4.join(", "));
  failed += missingB4.length;
}
const ch4 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch4.json"), "utf8"));
if ((ch4.theorems || []).length !== 9) {
  console.error("Chapter 4 theorems", (ch4.theorems || []).length);
  failed++;
}

const book5 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book05.json"), "utf8")
);
const joyce5 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book05.json"), "utf8")
);
if ((book5.propositions || []).length !== 25) {
  console.error("Book V props", (book5.propositions || []).length);
  failed++;
}
if ((joyce5.definitions || []).length !== 18) {
  console.error("Joyce V defs", (joyce5.definitions || []).length);
  failed++;
}
if ((joyce5.propositions || []).length !== 25) {
  console.error("Joyce V props", (joyce5.propositions || []).length);
  failed++;
}
const j5miss = (joyce5.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j5miss.length) {
  console.error("Joyce V without steps:", j5miss.join(", "));
  failed += j5miss.length;
}
const missingB5 = [];
for (let n = 1; n <= 25; n++) if (!FIGS["b5:prop:" + n]) missingB5.push(n);
for (let n = 1; n <= 18; n++) if (!FIGS["b5:def:" + n]) missingB5.push("def" + n);
if (missingB5.length) {
  console.error("missing Book V figures", missingB5.join(", "));
  failed += missingB5.length;
}
const ch5 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch5.json"), "utf8"));
if ((ch5.theorems || []).length !== 18) {
  console.error("Chapter 5 theorems", (ch5.theorems || []).length);
  failed++;
}
if ((ch5.definitions || []).length !== 11) {
  console.error("Chapter 5 definitions", (ch5.definitions || []).length);
  failed++;
}
const ch5missFig = (ch5.theorems || []).filter((t) => !FIGS[t.figId || t.id]).map((t) => t.id);
if (ch5missFig.length) {
  console.error("Chapter 5 theorems with no figure:", ch5missFig.join(", "));
  failed += ch5missFig.length;
}
const b5dead = [];
for (let n = 1; n <= 25; n++) {
  const id = "b5:prop:" + n;
  try {
    const built = Geom.makeFigure(FIGS[id], {});
    const alive = (built.fig.objs || []).some((o) => (o.step || 0) > 0);
    if (!alive) b5dead.push(id);
  } catch (e) {
    b5dead.push(id + " (" + e.message + ")");
  }
}
if (b5dead.length) {
  console.error("Book V props with no step>0 objects:", b5dead.join(", "));
  failed += b5dead.length;
}
const ch5hlMiss = [];
for (const t of ch5.theorems || []) {
  const fid = t.figId || t.id;
  if (!FIGS[fid]) continue;
  const built = Geom.makeFigure(FIGS[fid], {});
  const ids = new Set((built.fig.objs || []).map((o) => o.id));
  const alias = built.fig.alias || {};
  const ok = (hid) => ids.has(hid) || (alias[hid] && alias[hid].length);
  for (const st of t.steps || []) {
    const beats = (st.hlBeats || []).flatMap((b) => (Array.isArray(b) ? b : []));
    const named = beats.concat(st.hlIds || []);
    named.forEach((hid) => {
      if (!ok(hid)) ch5hlMiss.push(t.id + " " + hid);
    });
  }
}
if (ch5hlMiss.length) {
  console.error("Chapter 5 highlight ids missing from plates:", ch5hlMiss.join(", "));
  failed += ch5hlMiss.length;
}
const corr5 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/correspondence/book05.json"), "utf8")
);
const mapped5 = new Set(
  corr5.pairs.filter((p) => p.euclid).map((p) => p.euclid)
);
(corr5.euclidOnly || []).forEach((p) => mapped5.add(p.euclid));
const missingMap5 = (joyce5.propositions || []).filter((p) => !mapped5.has(p.id)).map((p) => p.id);
if (missingMap5.length) {
  console.error("Book V props with no correspondence:", missingMap5.join(", "));
  failed += missingMap5.length;
}

const book6 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book06.json"), "utf8")
);
const joyce6 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book06.json"), "utf8")
);
if ((book6.propositions || []).length !== 33) {
  console.error("Book VI props", (book6.propositions || []).length);
  failed++;
}
if ((book6.definitions || []).length !== 3) {
  console.error("Book VI defs", (book6.definitions || []).length);
  failed++;
}
if ((joyce6.definitions || []).length !== 4) {
  console.error("Joyce VI defs", (joyce6.definitions || []).length);
  failed++;
}
if ((joyce6.propositions || []).length !== 33) {
  console.error("Joyce VI props", (joyce6.propositions || []).length);
  failed++;
}
const j6miss = (joyce6.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j6miss.length) {
  console.error("Joyce VI without steps:", j6miss.join(", "));
  failed += j6miss.length;
}
const missingB6 = [];
for (let n = 1; n <= 33; n++) if (!FIGS["b6:prop:" + n]) missingB6.push(n);
for (let n = 1; n <= 3; n++) if (!FIGS["b6:def:" + n]) missingB6.push("def" + n);
if (missingB6.length) {
  console.error("missing Book VI figures", missingB6.join(", "));
  failed += missingB6.length;
}
const ch6 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch6.json"), "utf8"));
if ((ch6.theorems || []).length !== 22) {
  console.error("Chapter 6 theorems", (ch6.theorems || []).length);
  failed++;
}
if ((ch6.definitions || []).length !== 6) {
  console.error("Chapter 6 definitions", (ch6.definitions || []).length);
  failed++;
}
const ch6missFig = (ch6.theorems || []).filter((t) => !FIGS[t.figId || t.id]).map((t) => t.id);
if (ch6missFig.length) {
  console.error("Chapter 6 theorems with no figure:", ch6missFig.join(", "));
  failed += ch6missFig.length;
}
const b6dead = [];
for (let n = 1; n <= 33; n++) {
  const id = "b6:prop:" + n;
  try {
    const built = Geom.makeFigure(FIGS[id], {});
    if (!(built.fig.objs || []).some((o) => (o.step || 0) > 0)) b6dead.push(id);
  } catch (e) {
    b6dead.push(id + " (" + e.message + ")");
  }
}
if (b6dead.length) {
  console.error("Book VI props with no step>0 objects:", b6dead.join(", "));
  failed += b6dead.length;
}
const ch6hlMiss = [];
for (const t of ch6.theorems || []) {
  const fid = t.figId || t.id;
  if (!FIGS[fid]) continue;
  const built = Geom.makeFigure(FIGS[fid], {});
  const ids = new Set((built.fig.objs || []).map((o) => o.id));
  const alias = built.fig.alias || {};
  const ok = (hid) => ids.has(hid) || (alias[hid] && alias[hid].length);
  for (const st of t.steps || []) {
    const beats = (st.hlBeats || []).flatMap((b) => (Array.isArray(b) ? b : []));
    beats.concat(st.hlIds || []).forEach((hid) => {
      if (!ok(hid)) ch6hlMiss.push(t.id + " " + hid);
    });
  }
}
if (ch6hlMiss.length) {
  console.error("Chapter 6 highlight ids missing from plates:", ch6hlMiss.join(", "));
  failed += ch6hlMiss.length;
}
const corr6 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/correspondence/book06.json"), "utf8")
);
const mapped6 = new Set(
  corr6.pairs.filter((p) => p.euclid).map((p) => p.euclid)
);
(corr6.euclidOnly || []).forEach((p) => mapped6.add(p.euclid));
const missingMap6 = (joyce6.propositions || []).filter((p) => !mapped6.has(p.id)).map((p) => p.id);
if (missingMap6.length) {
  console.error("Book VI props with no correspondence:", missingMap6.join(", "));
  failed += missingMap6.length;
}

const book7 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/fitzpatrick/book07.json"), "utf8")
);
const joyce7 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/extracted/joyce/book07.json"), "utf8")
);
if ((book7.propositions || []).length !== 39) {
  console.error("Book VII props", (book7.propositions || []).length);
  failed++;
}
if ((book7.definitions || []).length !== 22) {
  console.error("Book VII defs", (book7.definitions || []).length);
  failed++;
}
if ((joyce7.definitions || []).length !== 22) {
  console.error("Joyce VII defs", (joyce7.definitions || []).length);
  failed++;
}
if ((joyce7.propositions || []).length !== 39) {
  console.error("Joyce VII props", (joyce7.propositions || []).length);
  failed++;
}
const j7miss = (joyce7.propositions || []).filter((p) => !p.steps || p.steps.length < 2).map((p) => p.id);
if (j7miss.length) {
  console.error("Joyce VII without steps:", j7miss.join(", "));
  failed += j7miss.length;
}
const missingB7 = [];
for (let n = 1; n <= 39; n++) if (!FIGS["b7:prop:" + n]) missingB7.push(n);
for (let n = 1; n <= 22; n++) if (!FIGS["b7:def:" + n]) missingB7.push("def" + n);
if (missingB7.length) {
  console.error("missing Book VII figures", missingB7.join(", "));
  failed += missingB7.length;
}
const ch7 = JSON.parse(fs.readFileSync(path.join(SRC, "content/course-ch7.json"), "utf8"));
if ((ch7.theorems || []).length !== 32) {
  console.error("Chapter 7 theorems", (ch7.theorems || []).length);
  failed++;
}
if ((ch7.definitions || []).length !== 17) {
  console.error("Chapter 7 definitions", (ch7.definitions || []).length);
  failed++;
}
const ch7missFig = (ch7.theorems || []).filter((t) => !FIGS[t.figId || t.id]).map((t) => t.id);
if (ch7missFig.length) {
  console.error("Chapter 7 theorems with no figure:", ch7missFig.join(", "));
  failed += ch7missFig.length;
}
const b7dead = [];
for (let n = 1; n <= 39; n++) {
  const id = "b7:prop:" + n;
  try {
    const built = Geom.makeFigure(FIGS[id], {});
    if (!(built.fig.objs || []).some((o) => (o.step || 0) > 0)) b7dead.push(id);
  } catch (e) {
    b7dead.push(id + " (" + e.message + ")");
  }
}
if (b7dead.length) {
  console.error("Book VII props with no step>0 objects:", b7dead.join(", "));
  failed += b7dead.length;
}
const ch7hlMiss = [];
for (const t of ch7.theorems || []) {
  const fid = t.figId || t.id;
  if (!FIGS[fid]) continue;
  const built = Geom.makeFigure(FIGS[fid], {});
  const ids = new Set((built.fig.objs || []).map((o) => o.id));
  const alias = built.fig.alias || {};
  const ok = (hid) => ids.has(hid) || (alias[hid] && alias[hid].length);
  for (const st of t.steps || []) {
    const beats = (st.hlBeats || []).flatMap((b) => (Array.isArray(b) ? b : []));
    beats.concat(st.hlIds || []).forEach((hid) => {
      if (!ok(hid)) ch7hlMiss.push(t.id + " " + hid);
    });
  }
}
if (ch7hlMiss.length) {
  console.error("Chapter 7 highlight ids missing from plates:", ch7hlMiss.join(", "));
  failed += ch7hlMiss.length;
}
const corr7 = JSON.parse(
  fs.readFileSync(path.join(SRC, "content/correspondence/book07.json"), "utf8")
);
const mapped7 = new Set(
  corr7.pairs.filter((p) => p.euclid).map((p) => p.euclid)
);
(corr7.euclidOnly || []).forEach((p) => mapped7.add(p.euclid));
const missingMap7 = (joyce7.propositions || []).filter((p) => !mapped7.has(p.id)).map((p) => p.id);
if (missingMap7.length) {
  console.error("Book VII props with no correspondence:", missingMap7.join(", "));
  failed += missingMap7.length;
}

console.log(
  "ok",
  ids.length,
  "figures;",
  thms.length,
  "theorems;",
  (content.definitions || []).length,
  "definitions;",
  book1.propositions.length,
  "Euclid I propositions;",
  book2.propositions.length,
  "Euclid II propositions;",
  book3.propositions.length,
  "Euclid III propositions;",
  book4.propositions.length,
  "Euclid IV propositions;",
  book5.propositions.length,
  "Euclid V propositions;",
  book6.propositions.length,
  "Euclid VI propositions;",
  book7.propositions.length,
  "Euclid VII propositions;",
  (ch2.theorems || []).length,
  "Ch.2 theorems;",
  (ch3.theorems || []).length,
  "Ch.3 theorems;",
  (ch4.theorems || []).length,
  "Ch.4 theorems;",
  (ch5.theorems || []).length,
  "Ch.5 theorems;",
  (ch6.theorems || []).length,
  "Ch.6 theorems;",
  (ch7.theorems || []).length,
  "Ch.7 theorems"
);
if (failed) {
  console.error("failures", failed);
  process.exit(1);
}
