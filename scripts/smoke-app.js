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
  (ch2.theorems || []).length,
  "Ch.2 theorems;",
  (ch3.theorems || []).length,
  "Ch.3 theorems;",
  (ch4.theorems || []).length,
  "Ch.4 theorems"
);
if (failed) {
  console.error("failures", failed);
  process.exit(1);
}
