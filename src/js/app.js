/* ============================================================
   app.js — the reader:  navigation, proof stepping, replay,
   two-way highlighting between the words and the diagram.
   ============================================================ */
(function () {
'use strict';
const G = window.Geom, FIGS = window.FIGS, C = window.CONTENT;
const STORE = window.STORE || { course: C, corpus: { books: [] }, correspondence: { pairs: [] } };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const COURSE_GROUPS = [
  { key: 'definitions', label: 'Definitions', abbr: 'Def.', kicker: 'Definition' },
  { key: 'postulates', label: 'Geometrical Postulates', abbr: 'Post.', kicker: 'Postulate' },
  { key: 'commonNotions', label: 'General Principles', abbr: 'Gen. Pr.', kicker: 'General Principle' },
  { key: 'extra', label: 'Further Principles', abbr: 'Princ.', kicker: 'Principle' },
  { key: 'theorems', label: 'Theorems', abbr: 'Theo.', kicker: null },
  { key: 'practice', label: 'Practice', abbr: 'Prac.', kicker: null }
];
const CORPUS_GROUPS = [
  { key: 'definitions', label: 'Definitions', abbr: 'Def.', kicker: 'Definition' },
  { key: 'postulates', label: 'Postulates', abbr: 'Post.', kicker: 'Postulate' },
  { key: 'commonNotions', label: 'Common Notions', abbr: 'C.N.', kicker: 'Common Notion' },
  { key: 'propositions', label: 'Propositions', abbr: 'Prop.', kicker: null }
];

let GROUPS = COURSE_GROUPS;
const ITEMS = [];
const BY_ID = {};
const LABELS = (C && C.labels) || { def: 'Def.', post: 'Post.', cn: 'Gen. Pr.', thm: 'Thm.' };

function corpusBooks() {
  return (STORE.corpus && STORE.corpus.books) || [];
}
function corpusBook() {
  return corpusBooks()[0] || null;
}
function romanBook(n) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'][+n] || String(n);
}
function elementsSpan() {
  const ns = corpusBooks().map(b => b.n);
  if (!ns.length) return 'Book I';
  if (ns.length === 1) return 'Book ' + romanBook(ns[0]);
  return 'Books ' + romanBook(ns[0]) + '–' + romanBook(ns[ns.length - 1]);
}
function courseChapters() {
  const extra = (STORE.courseChapters || []).filter(ch => ch && ch.n !== 1);
  return [{ n: 1, id: 'ch1', title: 'Chapter 1 · Plane Geometry', source: C }].concat(extra);
}
function courseTheorem(id) {
  const t = (C.theorems || []).find(x => x.id === id);
  if (t) return t;
  for (const ch of (STORE.courseChapters || [])) {
    const hit = (ch.theorems || []).find(x => x.id === id);
    if (hit) return hit;
  }
  return null;
}
function rebuildCatalog() {
  ITEMS.length = 0;
  Object.keys(BY_ID).forEach(k => { delete BY_ID[k]; });
  if (UI.shelf === 'elements') {
    GROUPS = CORPUS_GROUPS;
    corpusBooks().forEach(book => {
      GROUPS.forEach(g => (book[g.key] || []).forEach(it => {
        ITEMS.push(Object.assign({
          _kicker: g.kicker, _shelf: 'elements', _book: book.n,
          _bookTitle: book.title, _bookId: book.id
        }, it, { _group: g.key }));
      }));
    });
  } else {
    GROUPS = COURSE_GROUPS;
    courseChapters().forEach(ch => {
      const src = ch.source || ch;
      GROUPS.forEach(g => {
        if (g.key === 'practice') return;
        (src[g.key] || []).forEach(it => {
          ITEMS.push(Object.assign({
            _group: g.key, _kicker: g.kicker, _shelf: 'course',
            _chapter: ch.n, _chapterTitle: ch.title
          }, it));
        });
      });
    });
    ITEMS.push({ id: 'rec', _group: 'practice', num: null, title: 'Recitation', _shelf: 'course', _chapter: 99 });
    ITEMS.push({ id: 'wb', _group: 'practice', num: null, title: 'The drawing board', _shelf: 'course', _chapter: 99 });
  }
  ITEMS.forEach(it => { BY_ID[it.id] = it; });
}
function correspondentId(id) {
  const it = BY_ID[id];
  if (!it) return null;
  if (UI.shelf === 'elements') return (it.courseIds && it.courseIds[0]) || null;
  return it.euclid || null;
}

function shortRef(id) {
  const m = /^b(\d+):(prop|def|post|cn):(.+)$/.exec(id || '');
  if (m) {
    const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'][+m[1]] || m[1];
    const n = m[3];
    if (m[2] === 'prop') return roman + '.' + n;
    if (m[2] === 'def') return roman + '.Def.' + n;
    if (m[2] === 'post') return roman + '.Post.' + n;
    return 'C.N.' + n;
  }
  const it = BY_ID[id]; if (!it) return id;
  const kind = id.split(':')[0];
  return (LABELS[kind] || '') + ' ' + (it.num !== null && it.num !== undefined ? it.num : (it.term || it.title || ''));
}
function titleOf(it) {
  if (it._group === 'practice') return it.title;
  if (it._group === 'theorems' || it._group === 'propositions') return it.title;
  if (it.term) return it.term;
  if (it.title) return it.title;
  return (it.text || '').split('.')[0];
}
function kickerOf(it) {
  if (it._group === 'practice') return it.id === 'rec' ? 'Recitation' : 'Workbench';
  if (it._group === 'theorems') {
    const ch = it._chapter && it._chapter !== 1 ? ' · Ch.' + it._chapter : '';
    return (it.kind === 'construction' ? 'Construction · Theorem ' : 'Theorem ') + it.num + ch;
  }
  if (it._group === 'propositions') {
    const r = romanBook(it._book || 1);
    return (it.kind === 'construction' ? 'Construction · ' : '') + 'Elements ' + r + '.' + it.num;
  }
  if (it._kicker && it.num) return it._kicker + ' ' + it.num;
  return it._kicker || '';
}

/* ---------- ui state ---------- */
const UI = {
  shelf: (typeof localStorage !== 'undefined' && localStorage.getItem('geo-shelf') === 'elements') ? 'elements' : 'course',
  greek: (typeof localStorage === 'undefined' || localStorage.getItem('geo-greek') !== 'off'),
  id: 'thm:1', step: null, scaffold: true, theme: 'light', open: {},
  playing: 0, sel: null, figs: {}, states: {}, speed: 0.75, lastDrawn: null, zoomTimer: 0,
  hlBeat: null, hlBeatTimer: 0, figLayer: null, figLayerTimer: 0, figLayerSvg: null
};
rebuildCatalog();

function setShelf(name) {
  if (name !== 'course' && name !== 'elements') return;
  if (name === UI.shelf) { syncShelfChrome(); return; }
  const prev = BY_ID[UI.id] || {};
  const jump = name === 'elements'
    ? prev.euclid
    : ((prev.courseIds && prev.courseIds[0]) || null);
  UI.shelf = name;
  try { localStorage.setItem('geo-shelf', name); } catch (e) { /* ignore */ }
  rebuildCatalog();
  syncShelfChrome();
  const fallback = (ITEMS.find(i => i._group === 'theorems' || i._group === 'propositions') || ITEMS[0] || {}).id;
  go((jump && BY_ID[jump]) ? jump : fallback);
}
function syncShelfChrome() {
  const course = UI.shelf === 'course';
  const bc = document.getElementById('b-shelf-course');
  const be = document.getElementById('b-shelf-elements');
  if (bc) bc.setAttribute('aria-pressed', course ? 'true' : 'false');
  if (be) be.setAttribute('aria-pressed', course ? 'false' : 'true');
  const h = document.getElementById('app-title');
  if (h) {
    h.innerHTML = course
      ? 'Classical Mathematics – Geometry<small>Plane Geometry</small>'
      : 'Euclid, Elements<small>' + elementsSpan() + ' · Joyce / Heiberg</small>';
  }
  document.title = course ? 'Classical Mathematics – Geometry' : 'Euclid, Elements';
  const col = document.querySelector('nav .colophon');
  if (col) {
    col.innerHTML = course
      ? 'Based on Michael Augros, <em>Introduction to Arithmetic and Geometry</em>, Adapted for the Web by Timothy Kearns.'
      : 'Demonstration divided after David Joyce, Clark University. Greek: Heiberg; literal English: Fitzpatrick.';
  }
  const bg = document.getElementById('b-greek');
  if (bg) {
    bg.hidden = course;
    bg.setAttribute('aria-pressed', UI.greek ? 'true' : 'false');
    bg.title = UI.greek ? 'Hide Heiberg Greek' : 'Show Heiberg Greek';
  }
}
function greekHtml(el, cls, fig) {
  if (UI.shelf !== 'elements' || !UI.greek) return '';
  const t = String(el || '').trim();
  if (!t) return '';
  /* Figure aliases include Heiberg letters (Geom.LETTER_EL), so the same
     click-to-highlight path as English works. Drawing labels stay Latin. */
  const body = fig ? markup(t, fig) : esc(t);
  return `<p class="${cls || 'greek'}" lang="el">${body}</p>`;
}
function setGreek(on) {
  UI.greek = !!on;
  try { localStorage.setItem('geo-greek', UI.greek ? 'on' : 'off'); } catch (e) { /* ignore */ }
  syncShelfChrome();
  renderItem();
}
function crosswalkHtml(it) {
  if (it._group === 'theorems' && it.euclid) {
    const m = /^b(\d+):prop:(.+)$/.exec(it.euclid);
    const label = m ? ('Elements ' + romanBook(m[1]) + '.' + m[2]) : it.euclid;
    const tag = (it.euclidMatch && it.euclidMatch !== 'exact') ? ` · ${esc(it.euclidMatch)}` : '';
    return `<p class="xwalk">Euclid, <a data-jump="${esc(it.euclid)}">${esc(label)}</a>${tag}</p>`;
  }
  if (it._group === 'propositions' && it.courseIds && it.courseIds.length) {
    const links = it.courseIds.map(id => {
      const c = courseTheorem(id);
      const cm = /^ch(\d+):/.exec(id);
      const ch = cm ? ('Ch.' + cm[1] + ' · ') : '';
      const label = c ? (ch + 'Theorem ' + c.num) : id;
      return `<a data-jump="${esc(id)}">${esc(label)}</a>`;
    }).join(', ');
    return `<p class="xwalk">Taught in the course as ${links}</p>`;
  }
  if (it._group === 'propositions' && !it.figId) {
    return `<p class="xwalk">Not treated as its own theorem in Augros Chapter 1.</p>`;
  }
  return '';
}

/* every tempo runs 25% slower than it used to (values × 0.75) */
const SPEEDS = [{ v: 0.45, label: 'slow' }, { v: 0.75, label: 'normal' }, { v: 1.275, label: 'quick' }];
/* recitation */
const REC = { queue: [], at: 0, again: [], drawing: false, proof: false, key: false, scaffold: false, scope: 'all' };

/* ---------- figure handling ---------- */
function figFor(id) {
  const it = BY_ID[id];
  const fid = (it && it.figId) || id;
  if (!FIGS[fid]) return null;
  if (!UI.figs[id]) {
    UI.states[id] = UI.states[id] || {};
    UI.figs[id] = G.makeFigure(FIGS[fid], UI.states[id]);
  }
  return UI.figs[id];
}

/* which diagram elements does a piece of text mention? */
function refsIn(text, fig) {
  const out = [];
  if (!fig) return out;
  const keys = Object.keys(fig.fig.alias);
  if (!keys.length) return out;
  keys.sort((a, b) => b.length - a.length);
  const pat = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!pat) return out;
  /* no look-behind: keep it working in every browser */
  const re = new RegExp('([^A-Za-z]|^)(' + pat + ')(?![A-Za-z])', 'g');
  let m;
  while ((m = re.exec(text))) {
    const tok = m[2];
    m.index += m[1].length;
    re.lastIndex = m.index + tok.length;
    if (/^\d+$/.test(tok)) {                     // a bare number: only an angle label
      const pre = text.slice(0, m.index);
      if (/\d$/.test(pre) || /^\d/.test(text.slice(m.index + tok.length))) continue;
      if (/(Thm\.|Theorem|Def\.|Definition|Post\.|Postulate|Step|step|Pr\.)\s*$/.test(pre)) continue;
      if (!fig.fig.alias[tok] || !fig.fig.alias[tok].some(i => i.startsWith('ang:'))) continue;
    }
    if (tok === 'A' && /^ [a-z]/.test(text.slice(m.index + 1, m.index + 3))) {
      const pre = text.slice(0, m.index);
      if (!pre || /(^|[.:;!?]\s+|[“"(]\s*)$/.test(pre)) continue;   // the article "A", not the point A
    }
    let ids = fig.fig.alias[tok] || [];
    const before = text[m.index - 1] || '';
    const pick = k => { const q = ids.filter(i => i.startsWith(k)); if (q.length) ids = q; };
    if (before === '∠') pick('ang:');
    else if (/^\d+$/.test(tok)) pick('ang:');   /* ∠1 written as "1" after ∠ in token split, or bare label */
    else if (before === '△' || before === 'r') pick('poly:');
    else if (tok.length === 3) pick('poly:');
    else if (tok.length === 2) pick('seg:');
    ids = Array.from(new Set(ids));
    if (ids.length) out.push({ tok, start: m.index, end: m.index + tok.length, ids });
  }
  return out;
}
function markup(text, fig) {
  const rs = refsIn(text, fig);
  let out = '', at = 0;
  rs.forEach(r => {
    if (r.start < at) return;
    out += esc(text.slice(at, r.start));
    out += `<span class="ref" data-eids="${r.ids.join(' ')}">` + esc(r.tok) + '</span>';
    at = r.end;
  });
  out += esc(text.slice(at));
  return out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/* ---------- rendering the page ---------- */
function navGroupOf(id) { const it = BY_ID[id]; return it ? it._group : 'theorems'; }
function navKeyOf(id) {
  const it = BY_ID[id];
  if (!it) return 'theorems';
  if (it._shelf === 'elements' || UI.shelf === 'elements') return 'b' + (it._book || 1) + ':' + (it._group || 'propositions');
  if (it._group === 'practice') return 'practice:practice';
  return 'ch' + (it._chapter || 1) + ':' + it._group;
}
function renderNav() {
  const q = ($('#find').value || '').toLowerCase();
  const cur = BY_ID[UI.id] || {};
  let html = '';
  const buckets = [];
  if (UI.shelf === 'elements') {
    corpusBooks().forEach(book => buckets.push({ key: 'b' + book.n, label: book.title, book: book.n }));
  } else {
    courseChapters().forEach(ch => buckets.push({ key: 'ch' + ch.n, label: ch.title, chapter: ch.n }));
    buckets.push({ key: 'practice', label: 'Practice', chapter: 99, practice: true });
  }
  buckets.forEach(bucket => {
    const groups = bucket.practice ? GROUPS.filter(g => g.key === 'practice') : GROUPS.filter(g => g.key !== 'practice');
    const inBucket = it => {
      if (UI.shelf === 'elements') return (it._book || 1) === bucket.book;
      if (bucket.practice) return it._group === 'practice';
      return (it._chapter || 1) === bucket.chapter && it._group !== 'practice';
    };
    const any = ITEMS.some(inBucket);
    if (!any) return;
    html += `<div class="navbook">${esc(bucket.label)}</div>`;
    groups.forEach(g => {
      const items = ITEMS.filter(i => i._group === g.key && inBucket(i))
        .filter(i => !q || (titleOf(i) + ' ' + (i.statement || i.text || '') + ' ' + (i.num || '')).toLowerCase().includes(q));
      if (!items.length) return;
      const gk = bucket.key + ':' + g.key;
      const defaultOpen = q || (UI.shelf === 'elements'
        ? (cur._book || 1) === bucket.book && g.key === navGroupOf(UI.id)
        : (cur._chapter || 1) === (bucket.chapter || 1) && g.key === navGroupOf(UI.id));
      const open = UI.open[gk] !== undefined ? UI.open[gk] : defaultOpen;
      html += `<h3 class="navsec${open ? ' open' : ''}" data-g="${gk}"><span class="tw">${open ? '▾' : '▸'}</span><span class="nav-lbl">${g.label}</span><span class="nav-abbr">${esc(g.abbr || g.label)}</span><i>${items.length}</i></h3>`;
      html += `<div class="navitems"${open ? '' : ' hidden'}>`;
      items.forEach(i => {
        html += `<a data-id="${i.id}" class="${i.id === UI.id ? 'on' : ''}"><b>${i.num !== null && i.num !== undefined ? i.num : '·'}</b><span>${esc(titleOf(i))}</span></a>`;
      });
      html += `</div>`;
    });
  });
  $('#nav-list').innerHTML = html;
}

function nSteps(it) { return (it.steps || []).length; }

/**
 * For each angle in the set, also select the two sides that form it.
 * A segment matches a ray if:
 *   - one end is the vertex and the other lies on that ray, or
 *   - the vertex lies on the segment (e.g. base CD with B in the middle)
 *     and one of its ends lies on that ray.
 * Works for any angle object (ang:…, sq1, …), not only ang: ids.
 */
function expandAngleRays(fig, idSet) {
  if (!fig || !idSet || !idSet.size) return;
  const byId = {};
  fig.fig.objs.forEach(o => { if (o.id) byId[o.id] = o; });
  const same = (p, q) => p && q && (p === q || (p.name && q.name && p.name === q.name));
  const eps = 1e-6;
  /* Q lies on the ray from V through `toward` (same direction, any length). */
  const onRay = (V, toward, Q) => {
    if (!V || !toward || !Q) return false;
    if (same(Q, V)) return true;
    const dT = G.sub(toward, V), dQ = G.sub(Q, V);
    const lt = G.len(dT), lq = G.len(dQ);
    if (lq < eps) return true;
    if (lt < eps) return false;
    return G.dot(G.unit(dT), G.unit(dQ)) > 0.998;
  };
  /* V lies in the interior of segment AB (endpoints are handled separately). */
  const onSegInterior = (V, A, B) => {
    if (!V || !A || !B) return false;
    if (same(V, A) || same(V, B)) return false;
    const d = G.dist(A, B);
    if (d < eps) return false;
    return Math.abs(G.dist(A, V) + G.dist(V, B) - d) < 1e-3;
  };
  const add = [];
  idSet.forEach(id => {
    const a = byId[id];
    if (!a || a.kind !== 'angle') return;
    const Vv = a.v, P = a.p, Q = a.q;
    fig.fig.objs.forEach(o => {
      if ((o.kind !== 'seg' && o.kind !== 'line') || !o.id) return;
      const A = o.a, B = o.b;
      /* endpoint at the vertex: other end on either ray */
      if (same(A, Vv) && (onRay(Vv, P, B) || onRay(Vv, Q, B))) { add.push(o.id); return; }
      if (same(B, Vv) && (onRay(Vv, P, A) || onRay(Vv, Q, A))) { add.push(o.id); return; }
      /* vertex interior to the segment (straight base cut by the upright) */
      if (onSegInterior(Vv, A, B) &&
          (onRay(Vv, P, A) || onRay(Vv, P, B) || onRay(Vv, Q, A) || onRay(Vv, Q, B))) {
        add.push(o.id);
      }
    });
  });
  add.forEach(id => idSet.add(id));
}

/**
 * If a clicked / selected id shares an alias token with other ids
 * (e.g. X ↔ DA, Y ↔ AB), light the whole group. Only multi-id aliases expand.
 */
/**
 * Expand selection by alias tokens that name the same object (X↔DA, Y↔AB, Z↔BF).
 * One hop from the seed ids only — do not chain (DE linking DA+AE must not
 * turn a click on X into a full D–E highlight).
 */
function expandAliases(fig, idSet) {
  if (!fig || !idSet || !idSet.size) return;
  const alias = fig.fig.alias || {};
  const seed = Array.from(idSet);
  seed.forEach(id => {
    Object.keys(alias).forEach(tok => {
      const ids = alias[tok];
      if (!ids || ids.length < 2) return;
      if (!ids.includes(id)) return;
      ids.forEach(x => idSet.add(x));
    });
  });
}

/** For each triangle (poly) id in the set, also select the three side segments. */
function expandPolySides(fig, idSet) {
  if (!fig || !idSet || !idSet.size) return;
  const byId = {};
  fig.fig.objs.forEach(o => { if (o.id) byId[o.id] = o; });
  const same = (p, q) => p && q && (p === q || (p.name && q.name && p.name === q.name));
  const add = [];
  idSet.forEach(id => {
    if (!String(id).startsWith('poly:')) return;
    const poly = byId[id];
    if (!poly || poly.kind !== 'poly' || !poly.pts || poly.pts.length < 2) return;
    const pts = poly.pts;
    const n = pts.length;
    const edges = [];
    for (let i = 0; i < n; i++) {
      if (poly.close === false && i === n - 1) break;
      edges.push([pts[i], pts[(i + 1) % n]]);
    }
    fig.fig.objs.forEach(o => {
      if ((o.kind !== 'seg' && o.kind !== 'line') || !o.id) return;
      for (let e = 0; e < edges.length; e++) {
        const p = edges[e][0], q = edges[e][1];
        if ((same(o.a, p) && same(o.b, q)) || (same(o.a, q) && same(o.b, p))) {
          add.push(o.id);
          break;
        }
      }
    });
  });
  add.forEach(id => idSet.add(id));
}

/** Resolve a step's hlBeats entry (array of element ids) to a highlight Set.
 *  Beat value null or "clear" → no highlight (full figure at normal stroke). */
/** A beat is either a plain list of ids to light, or
 *  { hl, draw, show, keep, dim } — draw and show also light;
 *  keep holds a part at full ink without lighting it; dim fades one that
 *  would otherwise have stayed at full ink. */
function beatSpec(b) {
  if (b === null || b === 'clear') return null;
  const empty = { hl: [], draw: [], show: [], keep: [], dim: [] };
  if (Array.isArray(b)) return Object.assign(empty, { hl: b.slice() });
  if (b && typeof b === 'object') {
    return {
      hl: (b.hl || []).slice(), draw: (b.draw || []).slice(), show: (b.show || []).slice(),
      keep: (b.keep || []).slice(), dim: (b.dim || []).slice()
    };
  }
  return empty;
}

function resolveBeatIds(fig, beat) {
  const sp = beatSpec(beat);
  if (sp === null) return null;
  const ids = sp.hl.concat(sp.draw, sp.show);
  const set = new Set(ids || []);
  if (!set.size && !sp.keep.length && !sp.dim.length) return set;
  expandAngleRays(fig, set);
  expandPolySides(fig, set);
  /* asked for plainly, or asked to fade: either way, not lit */
  sp.keep.forEach(id => set.delete(id));
  sp.dim.forEach(id => set.delete(id));
  return set;
}

function clearHlBeats() {
  if (UI.hlBeatTimer) { clearTimeout(UI.hlBeatTimer); UI.hlBeatTimer = 0; }
  UI.hlBeat = null;
}

/**
 * Start (or keep) a multi-beat highlight sequence for the current step.
 * Each beat lights one set of ids; beats advance on a timer so SSS pairs
 * can be shown one triangle after the other.
 * Returns: a Set of ids, the string 'CLEAR' (full unhighlighted figure), or null.
 * Call clearHlBeats() before drawFig when the step changes so a fresh
 * sequence begins.
 */
function hlBeatsFor(it, st, fig) {
  const beats = st && st.hlBeats;
  if (!beats || !beats.length || !fig) return null;
  const same = UI.hlBeat && UI.hlBeat.id === it.id && UI.hlBeat.step === UI.step;
  if (!same) {
    clearHlBeats();
    const sets = beats.map(b => resolveBeatIds(fig, b));
    /* reflashIds: only ids new to this beat (so a side never flashes twice) */
    const reflashFor = i => {
      const cur = sets[i];
      if (cur === null) return new Set();           /* clear beat: no reflash */
      /* first beat can be static bright (no dip/draw) — used after a layer swipe */
      if (i <= 0) return st.hlFirstStatic ? new Set() : new Set(cur);
      const prev = sets[i - 1];
      if (prev === null) return new Set(cur);
      const neu = new Set();
      cur.forEach(id => { if (!prev.has(id)) neu.add(id); });
      /* if the beat is a pure swap (no new ids), reflash the whole beat once */
      return neu.size ? neu : new Set(cur);
    };
    UI.hlBeat = { id: it.id, step: UI.step, sets, specs: beats.map(beatSpec), i: 0, reflashFor };
    const gap = Math.max(550, (st.hlBeatMs || 950) / UI.speed);
    const startDelay = Math.max(0, (st.hlBeatDelay || 0) / UI.speed);
    const advance = () => {
      if (!UI.hlBeat || UI.hlBeat.id !== it.id || UI.hlBeat.step !== UI.step) return;
      if (UI.hlBeat.i >= UI.hlBeat.sets.length - 1) return;
      UI.hlBeat.i++;
      drawFig({ beatAdvance: true, reflashIds: UI.hlBeat.reflashFor(UI.hlBeat.i) });
      if (UI.hlBeat && UI.hlBeat.i < UI.hlBeat.sets.length - 1) {
        UI.hlBeatTimer = setTimeout(advance, gap);
      }
    };
    if (sets.length > 1) UI.hlBeatTimer = setTimeout(advance, startDelay + gap);
  }
  const cur = UI.hlBeat && UI.hlBeat.sets[UI.hlBeat.i];
  if (cur === null) return 'CLEAR';
  return cur && cur.size ? new Set(cur) : null;
}

/**
 * General Principles & Further Principles have no diagrams: show the whole
 * group as a list; the item chosen in the sidebar is highlighted.
 */
function renderPrincipleList(it) {
  const g = GROUPS.find(x => x.key === it._group);
  const peers = ITEMS.filter(i => i._group === it._group);
  let h = `<div class="wrap prinwrap">
    <div class="kicker">${esc(g ? g.label : '')}</div>
    <h2 class="title">${esc(g ? g.label : titleOf(it))}</h2>
    <p class="aka" style="margin-bottom:16px">Click a principle in the list or in the sidebar — the selection is highlighted here.</p>
    <div class="prinlist">`;
  peers.forEach(p => {
    const on = p.id === it.id ? ' on' : '';
    const num = (p.num !== null && p.num !== undefined)
      ? `<b class="prinnum">${esc(String(p.num))}.</b>` : '';
    h += `<article class="prinitem${on}" data-prin-id="${p.id}" id="prin-${p.id}">
      <h3>${num}<span>${esc(p.term || titleOf(p))}</span></h3>
      <p class="statement">${esc(p.text || p.statement || '')}</p>
      ${p.kid ? `<p class="kid">${esc(p.kid)}</p>` : ''}
    </article>`;
  });
  h += `</div></div>`;
  $('#main').innerHTML = h;
  const el = document.getElementById('prin-' + it.id);
  if (el) setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
}

/* ============================================================
   Library scroll view — all definitions (or postulates / principles)
   on one long page: read one, scroll on to the next, with generous
   space between.  The sidebar entry lights up as each item passes.
   ============================================================ */
function renderScrollList(it) {
  const g = GROUPS.find(x => x.key === it._group);
  const peers = ITEMS.filter(i => i._group === it._group);
  /* one live figure per entry, so each picture can be clicked and lit */
  const figsMap = {};
  peers.forEach(p => {
    const fid = p.figId || p.id;
    if (window.FIGS && window.FIGS[fid]) {
      try { figsMap[p.id] = G.makeFigure(window.FIGS[fid], {}); } catch (e) { /* skip */ }
    }
  });
  let h = `<div class="wrap scrollwrap">
    <div class="kicker scrollhead">${esc(g ? g.label : '')}</div>`;
  peers.forEach(p => {
    const kick = (p._kicker || '') + (p.num !== null && p.num !== undefined ? ' ' + p.num : '');
    const fw = figsMap[p.id] || null;
    h += `<section class="scrollitem" data-sid="${p.id}">
      <div class="kicker">${esc(kick)}</div>
      <h2 class="title">${esc(p.term || titleOf(p))}</h2>
      <p class="statement">${markup(p.text || p.statement || '', fw)}</p>
      ${greekHtml(p.textEl || p.statementEl, '', fw)}
      ${p.kid ? `<p class="kid">${markup(p.kid, fw)}</p>` : ''}
      ${fw ? `<div class="scrollfig" data-fig="${p.id}"></div>` : ''}
    </section>`;
  });
  h += `</div>`;
  $('#main').innerHTML = h;

  /* -- per-figure selection: click a part (or a name in the text) to light it -- */
  const sels = {};
  const litSection = id => {
    const sec = $(`#main .scrollitem[data-sid="${id}"]`); if (!sec) return;
    const sel = sels[id];
    $$('.ref', sec).forEach(r => {
      const ids = (r.dataset.eids || '').split(' ');
      r.classList.toggle('lit', !!(sel && ids.some(i => sel.includes(i))));
    });
  };
  const wireOne = (svg, id) => {
    const fw = figsMap[id]; if (!svg || !fw) return;
    svg.addEventListener('click', ev => {
      const t = ev.target.closest('[data-eid]');
      if (t) {
        const ids = linkedIdList(fw, t.dataset.eid);
        const same = sels[id] && sels[id].join(' ') === ids.join(' ');
        sels[id] = same ? null : ids;
      } else sels[id] = null;
      drawOne(id); litSection(id);
    });
    svg.addEventListener('mouseover', ev => {
      const t = ev.target.closest('[data-eid]');
      const ids = t ? linkedIdList(fw, t.dataset.eid) : [];
      svg.querySelectorAll('[data-eid]').forEach(n => n.classList.toggle('hov', ids.includes(n.dataset.eid)));
    });
    svg.addEventListener('mouseleave', () => {
      svg.querySelectorAll('[data-eid]').forEach(n => n.classList.remove('hov'));
    });
  };
  const drawOne = id => {
    const el = $(`#main .scrollfig[data-fig="${id}"]`), fw = figsMap[id];
    if (!el || !fw) return;
    let hl = null;
    const sel = sels[id];
    if (sel && sel.length) {
      hl = new Set(sel);
      expandAliases(fw, hl); expandAngleRays(fw, hl); expandPolySides(fw, hl);
    }
    try { el.innerHTML = fw.render({ w: 640, h: 430, highlight: hl }); } catch (e) { return; }
    wireOne(el.firstChild, id);
  };
  peers.forEach(p => drawOne(p.id));

  /* names in the text also select in that entry's own picture */
  $('#main .scrollwrap').addEventListener('click', ev => {
    const r = ev.target.closest('.ref'); if (!r) return;
    const sec = ev.target.closest('.scrollitem'); if (!sec) return;
    const id = sec.dataset.sid; if (!figsMap[id]) return;
    ev.stopPropagation();                 /* keep the theorem-page ref handler out of it */
    const ids = (r.dataset.eids || '').split(' ').filter(Boolean);
    const same = sels[id] && sels[id].join(' ') === ids.join(' ');
    sels[id] = same ? null : ids;
    drawOne(id); litSection(id);
  });

  scrollLibraryTo(it.id);
  bindScrollSpy();
}
/** Programmatic jump inside a library (defs / posts / principles) page. */
function scrollLibraryTo(id) {
  const sec = $(`#main .scrollitem[data-sid="${id}"]`);
  if (!sec) return false;
  UI._spyLock = true;
  clearTimeout(UI._spyUnlockT);
  sec.scrollIntoView({ block: 'start' });
  $$('#nav-list a').forEach(a => a.classList.toggle('on', a.dataset.id === id));
  /* unlock after layout/scroll settle — keep UI.id we just chose */
  UI._spyUnlockT = setTimeout(() => { UI._spyLock = false; }, 220);
  return true;
}
function isLibraryGroup(g) {
  return g === 'definitions' || g === 'postulates' || g === 'commonNotions' || g === 'extra';
}
function bindScrollSpy() {
  const main = $('#main');
  let raf = 0;
  const spy = () => {
    raf = 0;
    if (UI._spyLock) return;
    const secs = $$('#main .scrollitem'); if (!secs.length) return;
    /* At the bottom of the page the last section often cannot reach the
       spy line — prefer the last entry instead of sticking on the one above. */
    const nearBottom = main.scrollTop + main.clientHeight >= main.scrollHeight - 48;
    let cur;
    if (nearBottom) {
      cur = secs[secs.length - 1];
    } else {
      const line = main.getBoundingClientRect().top + 90;
      cur = secs[0];
      for (const s of secs) { if (s.getBoundingClientRect().top <= line) cur = s; else break; }
    }
    const id = cur.dataset.sid;
    if (id && id !== UI.id && BY_ID[id]) {
      UI.id = id;
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      $$('#nav-list a').forEach(a => a.classList.toggle('on', a.dataset.id === id));
    }
  };
  main.onscroll = () => { if (!raf) raf = requestAnimationFrame(spy); };
}

function renderItem() {
  $('#main').onscroll = null;              /* scroll-spy belongs to the library views only */
  if (UI.id === 'rec') return renderRecitation();
  if (UI.id === 'wb') return renderWorkbench();
  const it = BY_ID[UI.id]; if (!it) return;
  /* library groups: one long scrolling page, every entry with its picture */
  if (it._group === 'definitions' || it._group === 'postulates' ||
      it._group === 'commonNotions' || it._group === 'extra') {
    renderScrollList(it);
    return;
  }
  const fig = figFor(it.id);
  const hasProof = nSteps(it) > 0;
  let h = `<div class="wrap">
    <div class="kicker">${esc(kickerOf(it))}</div>
    <h2 class="title">${esc(titleOf(it))}</h2>`;
  /* landscape phones only: the studio button sits beside the title and
     scrolls away with it (hidden everywhere else) */
  if (window.FSX_ENABLED && window.FSX_ENABLED.has(it.id))
    h += `<button class="fsx-cta fsx-cta-top" id="b-fsx-top" title="Full screen: big figure, proof at your side, pan/zoom, alter the illustration">⛶&ensp;Explore &amp; alter</button>`;
  if (it.aka) h += `<p class="aka">${esc(it.aka)}</p>`;
  h += `<p class="statement">${markup(it.statement || it.text || '', fig)}</p>`;
  h += greekHtml(it.statementEl || it.textEl, '', fig);
  h += crosswalkHtml(it);
  if (it.kid) h += `<p class="kid">${markup(it.kid, fig)}</p>`;
  h += `<div class="cols"><div class="left">`;

  if (hasProof) {
    h += `<h4 class="sec">${it.kind === 'construction' ? 'Construction &amp; proof' : 'Proof'}</h4><ol class="steps">`;
    it.steps.forEach((s, i) => {
      const cites = (s.cites || []).map(c => `<span class="cite" data-cite="${c}">${esc(shortRef(c))}</span>`).join('');
      h += `<li data-step="${i + 1}"><span>${markup(s.text, fig)}</span>${cites ? `<span class="cites">${cites}</span>` : ''}${s.note ? `<span class="cite" style="cursor:default">${esc(s.note)}</span>` : ''}</li>`;
    });
    h += `</ol><p class="qed">${esc(it.end || (it.kind === 'construction' ? 'Q.E.F.' : 'Q.E.D.'))}</p>`;
    if (UI.shelf === 'elements' && UI.greek && it.proseEl) h += `<details class="gproof"><summary>Greek text (Heiberg)</summary>${greekHtml(it.proseEl, '', fig)}</details>`;
  } else if (it.prose) {
    h += `<h4 class="sec">${it.kind === 'construction' ? 'Construction &amp; proof' : 'Proof'}</h4>`;
    String(it.prose).split(/\n\n/).forEach(para => {
      if (para.trim()) h += `<p class="prose">${markup(para, fig)}</p>`;
    });
    h += `<p class="qed">${esc(it.end || (it.kind === 'construction' ? 'Q.E.F.' : 'Q.E.D.'))}</p>`;
    if (UI.shelf === 'elements' && UI.greek && it.proseEl) h += `<details class="gproof"><summary>Greek text (Heiberg)</summary>${greekHtml(it.proseEl, '', fig)}</details>`;
    if (it.uses && it.uses.length) {
      h += `<p class="xwalk">Uses ${it.uses.map(c => `<span class="cite" data-cite="${c}">${esc(shortRef(c))}</span>`).join(' ')}</p>`;
    }
  }
  if (it.remarks && it.remarks.length) {
    h += `<h4 class="sec">Remarks</h4>`;
    it.remarks.forEach((r, i) => h += `<p class="remark"><b>${i + 1}.</b> ${markup(r, fig)}</p>`);
  }
  if (it.questions && it.questions.length) {
    h += `<h4 class="sec">Questions</h4>`;
    it.questions.forEach((q, i) => {
      h += `<div class="qitem" data-q="${i}"><div class="q">${i + 1}. ${markup(q.q, fig)}</div>`;
      if (q.hint) h += `<button class="reveal" data-act="hint">Hint</button> `;
      if (q.answer) h += `<button class="reveal" data-act="ans">Show answer</button>`;
      h += `<div class="body"></div></div>`;
    });
  }
  h += `</div><div class="right">`;
  if (fig) {
    h += `<div class="figsticky"><div class="figbox"><div class="figstage">
      <div class="figwrap" id="figwrap"></div>
      <div class="fig-stepbadge" id="fig-stepbadge" hidden aria-hidden="true"></div>`;
    if (hasProof) {
      /* phones: wordless playback controls inside the frame, bottom-left */
      h += `<div class="fig-overlayctl">
        <button class="obtn" id="ob-prev" title="Previous step">‹</button>
        <button class="obtn play" id="ob-play" title="Play / pause">▶</button>
        <button class="obtn" id="ob-next" title="Next step">›</button>
      </div>`;
    }
    /* landscape phones: the other figure options fold into a little drawer
       at the top-right of the illustration */
    h += `<button class="fig-ctl-tab" id="fig-ctl-tab" title="Figure options">⚙</button>`;
    h += `</div>`;
    h += `<div class="fig-stepline" id="fig-stepline" hidden></div>`;
    /* one tidy bar, two clusters: playback on the left, figure options on
       the right — the same arrangement the studio uses */
    h += `<div class="figbar">`;
    if (hasProof) {
      h += `<div class="ctlgrp">
            <button class="tbtn icon" id="b-prev" title="Previous step (←)">‹</button>
            <button class="tbtn" id="b-play" title="Play from the step you are on (space)">▶ Play</button>
            <button class="tbtn icon" id="b-next" title="Next step (→)">›</button>
            <span class="stepchip" id="stepchip"></span>
          </div>`;
    }
    h += `<span class="sp"></span>`;
    h += `<div class="ctlgrp">`;
    if (hasProof)
      h += `<button class="tbtn" id="b-speed" title="How fast the figure is drawn">${esc((SPEEDS.find(x => x.v === UI.speed) || SPEEDS[1]).label)}</button>`;
    if (fig.fig.objs.some(o => o.role === 'scaffold'))
      h += `<button class="tbtn tgl${UI.scaffold ? ' on' : ''}" id="b-scaf" title="The circles and lines a compass needs, which the proof does not name"><span class="lbl-long">construction lines</span><span class="lbl-short">lines</span></button>`;
    h += `<button class="tbtn" id="b-full" title="Show the finished figure (Esc)"><span class="lbl-long">whole figure</span><span class="lbl-short">whole</span></button>`;
    h += `<button class="tbtn" id="b-reset" title="Put the figure back to its original positions and proportions"><span class="lbl-long">⟲ original</span><span class="lbl-short">⟲</span></button>`;
    h += `</div>`;
    h += `</div>`;
    h += `<div class="hint-drag">Click any part of the figure — or any name in the proof — to light it up in both places. Use <b>whole figure</b> at any step to see the finished drawing.</div>`;
    h += `</div>`;
    /* the invitation to the studio sits below and outside the figure box */
    if (window.FSX_ENABLED && window.FSX_ENABLED.has(it.id))
      h += `<button class="fsx-cta" id="b-fsx" title="Full screen: big figure, proof at your side, pan/zoom, alter the illustration">⛶&ensp;<span class="lbl-long">Explore and alter the illustration</span><span class="lbl-short">Explore &amp; alter</span></button>`;
    h += `</div>`;   /* /figsticky */
  } else if (it._group === 'propositions') {
    h += `<div class="pending-fig">No interactive figure yet for Elements I.${esc(String(it.num))}. Euclid’s wording is on the left; the drawing will be built the same way as the course figures.</div>`;
  }
  h += `</div></div></div>`;
  $('#main').innerHTML = h;
  drawFig();
  syncSteps();
}

/* ============================================================
   Recitation — statement first; the drawing and the proof only
   when you ask for them.
   ============================================================ */
const SCOPES = [
  { id: 'all', label: 'All 39 theorems', pick: i => i._group === 'theorems' },
  { id: 't1', label: 'Theorems 1 – 10', pick: i => i._group === 'theorems' && i.sort <= 10 },
  { id: 't2', label: 'Theorems 11 – 20', pick: i => i._group === 'theorems' && i.sort > 10 && i.sort <= 20 },
  { id: 't3', label: 'Theorems 21 – 30', pick: i => i._group === 'theorems' && i.sort > 20 && i.sort <= 30 },
  { id: 't4', label: 'Theorems 31 – 37', pick: i => i._group === 'theorems' && i.sort > 30 },
  { id: 'cons', label: 'The constructions only', pick: i => i._group === 'theorems' && i.kind === 'construction' },
  { id: 'defs', label: 'Definitions', pick: i => i._group === 'definitions' }
];
function recBuild(scope, ids) {
  REC.scope = scope;
  const sc = SCOPES.find(s => s.id === scope) || SCOPES[0];
  const list = ids || ITEMS.filter(sc.pick).map(i => i.id);
  for (let i = list.length - 1; i > 0; i--) {          // shuffle
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  REC.queue = list; REC.at = 0; REC.again = [];
  recReset();
}
function recReset() { REC.drawing = false; REC.proof = false; REC.key = false; REC.scaffold = false; }
function recNext(hadIt) {
  const id = REC.queue[REC.at];
  if (!hadIt && id) REC.again.push(id);
  REC.at++; recReset(); renderRecitation();
}
function renderRecitation() {
  const it = BY_ID[REC.queue[REC.at]];
  const total = REC.queue.length;
  let h = `<div class="wrap recwrap">
    <div class="recbar">
      <label>Practise
        <select id="rec-scope">${SCOPES.map(s =>
    `<option value="${s.id}"${s.id === REC.scope ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
      </label>
      <span class="sp"></span>
      <span class="reccount">${total ? Math.min(REC.at + 1, total) + ' of ' + total : ''}${REC.again.length ? ' · ' + REC.again.length + ' to come back to' : ''}</span>
      <button class="tbtn" id="rec-restart">start again</button>
    </div>`;
  if (!it) {
    h += `<div class="reccard done">
      <h2 class="title">That is the round.</h2>
      <p class="statement">${REC.again.length
        ? 'You marked ' + REC.again.length + ' to come back to. Go through those again while they are warm.'
        : 'Everything in this round came back to you. Pick a wider range, or come back tomorrow — a day later is the real test.'}</p>
      ${REC.again.length ? `<button class="tbtn big" id="rec-again">Go again with those ${REC.again.length}</button> ` : ''}
      <button class="tbtn big" id="rec-restart2">New round</button>
    </div></div>`;
    $('#main').innerHTML = h; return;
  }
  const fig = figFor(it.id);
  const K = window.FIGKEY[it.id];
  h += `<div class="reccard">
    <div class="kicker">${esc(kickerOf(it))}</div>
    <p class="statement big">${esc(it.statement || it.text || '')}</p>
    <p class="recask">Draw the figure, then give the proof aloud — a reason for every step.</p>
    <div class="recbtns">
      <button class="tbtn${REC.drawing ? ' on' : ''}" id="rec-draw">Show final drawing</button>
      <button class="tbtn${REC.proof ? ' on' : ''}" id="rec-proof">Show the proof</button>
      <span class="sp"></span>
      <a class="reclink" data-goto="${it.id}">open the full page →</a>
    </div>`;
  if (REC.drawing) {
    h += `<div class="figbox"><div class="figwrap" id="figwrap"></div><div class="figbar">`;
    if (K) h += `<button class="tbtn${REC.key ? ' on' : ''}" id="rec-key">${REC.key ? 'plain figure' : 'emphasise the key parts'}</button>`;
    if (fig && fig.fig.objs.some(o => o.role === 'scaffold'))
      h += `<label><input type="checkbox" id="rec-scaf"${REC.scaffold ? ' checked' : ''}> construction lines</label>`;
    h += `<span class="sp"></span></div>`;
    if (REC.key && K) h += `<div class="hint-drag">${esc(K.say)}</div>`;
    h += `</div>`;
  }
  if (REC.proof && it.steps) {
    h += `<h4 class="sec">${it.kind === 'construction' ? 'Construction &amp; proof' : 'Proof'}</h4><ol class="steps">`;
    it.steps.forEach(st => {
      const cites = (st.cites || []).map(c => `<span class="cite" data-cite="${c}">${esc(shortRef(c))}</span>`).join('');
      h += `<li>${esc(st.text)}${cites ? `<span class="cites">${cites}</span>` : ''}</li>`;
    });
    h += `</ol>`;
  }
  h += `<div class="recjudge">
      <button class="tbtn big good" id="rec-yes">I had it</button>
      <button class="tbtn big" id="rec-no">Not yet</button>
    </div></div></div>`;
  $('#main').innerHTML = h;
  if (REC.drawing && fig) {
    const wrap = $('#figwrap');
    const hl = (REC.key && K) ? new Set(K.ids) : null;
    wrap.innerHTML = fig.render({ w: 640, h: 480, showScaffold: REC.scaffold, highlight: hl });
  }
}

const WBV = { w: 780, h: 560, view: { cx: 0, cy: 0, k: 1 } };
function renderWorkbench() {
  const WB = window.WB, API = window.WB_api, PR = window.WB_proof;
  const ch = window.WB_CHALLENGES.find(c => c.id === WB.challenge) || window.WB_CHALLENGES[0];
  const proving = WB.mode === 'prove';
  let h = `<div class="wrap wbwrap">
    <div class="kicker">Workbench${proving ? ' · writing the proof' : ' · building the figure'}</div>
    <h2 class="title">${esc(ch.title)}</h2>
    <p class="statement">${esc(ch.blurb)}</p>
    <div class="wbgrid">
      <div class="wbtools">${proving ? provePalette() : toolPalette()}${reference()}</div>
      <div>
        <div class="figbox"><div class="figwrap wbcanvas" id="figwrap"></div>
          <div class="figbar">
            <span class="wbstatus" id="wbstatus">${esc(WB.msg || (proving ? draftHint() : (API.tool(WB.tool) || {}).hint || ''))}</span>
            <span class="sp"></span>
            ${proving
      ? `<button class="tbtn" id="wb-back-figure">← back to the figure</button>`
      : `<button class="tbtn" id="wb-undo">↶ undo</button><button class="tbtn" id="wb-clear">clear</button>
             <button class="tbtn good" id="wb-begin-proof">begin the proof →</button>`}
          </div>
        </div>
        ${proving ? draftBar() : ''}
      </div>
      <div class="wblog">
        <label class="wbsel">Task
          <select id="wb-ch">${window.WB_CHALLENGES.map(c =>
        `<option value="${c.id}"${c.id === WB.challenge ? ' selected' : ''}>${esc(c.title)}</option>`).join('')}</select>
        </label>
        ${WB.done ? '<div class="wbdone">✓ The figure answers the task.</div>' : ''}
        ${proving && WB.proved ? '<div class="wbdone">✓ ' + esc(WB.proofMsg || 'Proved.') + '</div>' : ''}
        <h4 class="sec">Construction</h4>
        <ol class="wbsteps">${WB.log.map(e =>
          `<li>${esc(e.text)}${e.cite ? `<span class="cite" data-cite="${e.cite}">${esc(shortRef(e.cite))}</span>` : ''}</li>`).join('')}</ol>
        ${WB.log.length ? '' : '<p class="hint-drag">Pick a tool, then click on the board.</p>'}
        ${proofList()}
      </div>
    </div></div>`;
  $('#main').innerHTML = h;
  drawWorkbench();
}

/* ---------- the two palettes ---------- */
function toolPalette() {
  const WB = window.WB;
  const byGroup = { Postulates: [], Theorems: [] };
  window.WB_TOOLS.forEach(t => byGroup[t.group].push(t));
  const tbtn = t => {
    const locked = t.thm > WB.upTo;
    return `<button class="wbtool${WB.tool === t.id ? ' on' : ''}${locked ? ' locked' : ''}" data-tool="${t.id}"
      title="${locked ? 'unlocked after Theorem ' + t.thm : (t.hint || '')}"${locked ? ' disabled' : ''}>
      ${esc(t.label)}${t.cite ? `<i>${esc(shortRef(t.cite))}</i>` : ''}</button>`;
  };
  return `<h5>Postulates</h5>${byGroup.Postulates.map(tbtn).join('')}
    <h5>Theorems proved</h5>${byGroup.Theorems.map(tbtn).join('')}`;
}
function provePalette() {
  const WB = window.WB, PR = window.WB_proof, d = WB.draft || {};
  const picks = PR.PICKERS.map(p =>
    `<button class="wbtool${d.picking === p.kind ? ' on' : ''}" data-pick="${p.kind}" title="${esc(p.hint)}">${esc(p.label)}</button>`).join('');
  const kinds = [d.lhs && d.lhs.kind, d.rhs && d.rhs.kind].filter(Boolean);
  const rels = PR.RELS.map(r => {
    const fits = !kinds.length || kinds.every(k => r.kinds.includes(k));
    return `<button class="wbrel${d.rel === r.id ? ' on' : ''}${fits ? '' : ' locked'}" data-rel="${r.id}"
      title="${esc(r.words)}"${fits ? '' : ' disabled'}>${esc(r.sym)}</button>`;
  }).join('');
  return `<h5>Name a part</h5>${picks}<h5>Relation</h5><div class="wbrels">${rels}</div>`;
}

/* ---------- the line being written ---------- */
function draftHint() {
  const d = window.WB.draft || {};
  if (d.picking) return (window.WB_proof.PICKERS.find(p => p.kind === d.picking) || {}).hint || '';
  if (!d.lhs) return 'Say what you are talking about: a line, an angle or a triangle.';
  if (!d.rel) return 'Now choose the relation.';
  const R = window.WB_proof.RELS.find(r => r.id === d.rel);
  if (R && R.arity === 2 && !d.rhs) return 'Now name the other part.';
  if (!d.cite) return 'Now give the reason that licenses it.';
  return 'Add the line to the proof.';
}
function draftBar() {
  const WB = window.WB, PR = window.WB_proof, d = WB.draft || {};
  const R = PR.RELS.find(r => r.id === d.rel);
  const slot = (part, what) => part
    ? `<button class="wbslot filled" data-slot="${what}">${esc(part.label)}</button>`
    : `<span class="wbslot">${what === 'lhs' ? 'name a part' : 'name a part'}</span>`;
  const relChip = R ? `<span class="wbrelchip">${esc(R.sym)}</span>` : `<span class="wbslot">relation</span>`;
  const opts = PR.available(window.CONTENT, WB.upTo);
  const groups = [...new Set(opts.map(o => o.group))];
  return `<div class="wbdraft">
    <span class="wbdraftlab">Line ${(WB.claims || []).length + 1}</span>
    ${slot(d.lhs, 'lhs')} ${relChip} ${R && R.arity === 1 ? '' : slot(d.rhs, 'rhs')}
    <span class="wbbecause">because</span>
    <select id="wb-cite"><option value="">— choose a reason —</option>
      ${groups.map(g => `<optgroup label="${esc(g)}">` +
        opts.filter(o => o.group === g).map(o =>
          `<option value="${o.id}"${d.cite === o.id ? ' selected' : ''}>${esc(o.label)}</option>`).join('') +
        `</optgroup>`).join('')}
    </select>
    <button class="tbtn good" id="wb-add">add line</button>
    <button class="tbtn" id="wb-clear-line">clear</button>
  </div>`;
}
function proofList() {
  const WB = window.WB, PR = window.WB_proof;
  const claims = WB.claims || [];
  if (WB.mode !== 'prove' && !claims.length) return '';
  return `<h4 class="sec">Proof</h4>
    <ol class="wbproof">${claims.map(c =>
      `<li class="${c.ok ? 'ok' : 'bad'}" data-claim="${c.n}">
        <span class="wbmark">${c.ok ? '✓' : '✗'}</span>
        <span class="wbclaimtext">${esc(PR.claimText(c))}</span>
        <span class="cite" data-cite="${c.cite}">${esc(shortRef(c.cite))}</span>
        ${c.ok ? '' : `<i class="wbwhy">${esc(c.why)}</i>`}
      </li>`).join('')}</ol>
    ${claims.length ? '<button class="tbtn" id="wb-undo-claim">↶ take back the last line</button>' : ''}
    ${(!WB.proved && WB.proofMsg) ? `<p class="hint-drag">${esc(WB.proofMsg)}</p>` : ''}`;
}

/* ---------- the little reference window ---------- */
function reference() {
  const WB = window.WB, PR = window.WB_proof;
  const opts = PR.available(window.CONTENT, WB.upTo);
  const groups = [...new Set(opts.map(o => o.group))];
  const cur = WB.refId && BY_ID[WB.refId];
  return `<h5>Look it up</h5>
    <select id="wb-ref" class="wbref">
      <option value="">— definitions, postulates, theorems —</option>
      ${groups.map(g => `<optgroup label="${esc(g)}">` +
        opts.filter(o => o.group === g).map(o =>
          `<option value="${o.id}"${WB.refId === o.id ? ' selected' : ''}>${esc(o.label)}</option>`).join('') +
        `</optgroup>`).join('')}
    </select>
    ${cur ? `<div class="wbrefcard">
        <b>${esc(shortRef(WB.refId))}</b>
        <div class="wbreftitle">${esc(titleOf(cur))}</div>
        <div class="wbreftext">${esc(cur.statement || cur.text || '')}</div>
        <a class="reclink" data-goto="${WB.refId}">open the full page →</a>
      </div>` : ''}`;
}

function drawWorkbench() {
  const wrap = $('#figwrap'); if (!wrap) return;
  const WB = window.WB, PR = window.WB_proof;
  const fig = G.makeFigure(window.WB_figure(), {});
  let lit = new Set(WB.sel || []);
  if (WB.mode === 'prove') {
    lit = new Set();
    const d = WB.draft || {};
    [d.lhs, d.rhs].forEach(p => { if (p) PR.eids(p).forEach(x => lit.add(x)); });
    (d.buf || []).forEach(x => lit.add(x));
    if (WB.litClaim) {
      const c = (WB.claims || []).find(x => x.n === WB.litClaim);
      if (c) PR.claimEids(c).forEach(x => lit.add(x));
    }
  }
  wrap.innerHTML = fig.render({
    w: WBV.w, h: WBV.h, view: WBV.view, showScaffold: true,
    highlight: lit.size ? lit : null
  });
  const svg = wrap.firstChild;
  if (!svg) return;
  svg.addEventListener('click', ev => {
    const API = window.WB_api, PR = window.WB_proof;
    const el = ev.target.closest('[data-eid]');
    let msg = '';
    if (window.WB.mode === 'prove') {
      msg = el ? PR.proofClick(el.dataset.eid) : 'Click a part of the figure.';
    } else if (el) {
      msg = API.pick(el.dataset.eid);
    } else {
      const ctm = svg.getScreenCTM();
      const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
      const q = p.matrixTransform(ctm.inverse());
      msg = API.clickEmpty(fig.toWorld({ x: q.x, y: q.y }));
    }
    window.WB.msg = msg;
    renderWorkbench();
  });
}

function drawFig(opt) {
  opt = opt || {};
  const it = BY_ID[UI.id]; if (!it) return;
  const fig = figFor(it.id);
  if (!fig) return;
  /* fullscreen studio, when open, owns the drawing surface */
  const wrap = document.getElementById('fs-figwrap') || $('#figwrap'); if (!wrap) return;
  const upTo = UI.step === null ? Infinity : UI.step;
  let hl = null;
  let hlKeep = false;
  let beatAnim = !!opt.beatAdvance;
  if (UI.sel) {
    hl = new Set(UI.sel);
    expandAliases(fig, hl);
    expandAngleRays(fig, hl);
    expandPolySides(fig, hl);
    if (!opt.beatAdvance) clearHlBeats();
  } else if (UI.step !== null && UI.step > 0 && it.steps && it.steps[UI.step - 1]) {
    const st = it.steps[UI.step - 1];
    /* multi-beat highlight (e.g. one congruent triangle, then the other) */
    const beatHl = (st.hlBeats && st.hlBeats.length) ? hlBeatsFor(it, st, fig) : null;
    if (beatHl === 'CLEAR') {
      hl = null;           /* full figure, normal strokes, all tick marks */
    } else if (beatHl) {
      hl = beatHl;
    } else if (st.hlIds && st.hlIds.length) {
      /* explicit ids win — used when auto refsIn pulls in too much */
      hl = new Set(st.hlIds);
      if (st.hlExpand !== false && st.hlExpand !== 'none') {
        if (st.hlExpand === 'sides') expandPolySides(fig, hl);
        else expandAngleRays(fig, hl); /* default: angles → their two rays only */
      }
    } else {
      const ids = [];
      refsIn(st.text, fig).forEach(r => ids.push(...r.ids));
      /*
        hl: "angles" — light only what this step names: angle marks (and any
        segments / points the text actually mentions). Dim everything else so
        the base and unrelated angles do not stay lit.
      */
      if (st.hl === 'angles' || st.hl === 'numbers') {
        hlKeep = false;
        const angs = ids.filter(id => id.startsWith('ang:') || id.startsWith('lab:'));
        const segs = ids.filter(id => id.startsWith('seg:'));
        const pts  = ids.filter(id => id.startsWith('pt:'));
        const pick = angs.length || segs.length ? angs.concat(segs, pts) : ids;
        hl = new Set(pick);
      } else if (ids.length) {
        hl = new Set(ids);
      }
      /* angle marks also light their two rays; triangles light their three sides */
      if (hl) {
        expandAngleRays(fig, hl);
        expandPolySides(fig, hl);
      }
    }
  } else if (!opt.beatAdvance) {
    clearHlBeats();
  }
  /* draw the new work on only when the proof moves forward (or a highlight beat) */
  const last = UI.lastDrawn;
  const stNow = (UI.step !== null && UI.step > 0 && it.steps) ? it.steps[UI.step - 1] : null;
  const hasBeats = !!(stNow && stNow.hlBeats && stNow.hlBeats.length);
  const stepAdvance = UI.step !== null && !!last && last.id === it.id &&
    UI.step > (last.step === null ? -1 : last.step);
  /*
    Steps with hlBeats (or a single full hlIds highlight): skip staggered
    construction draw-on so the whole figure does not drip in piece by piece
    (e.g. only A and BP first). Beats reflash only what is new to that beat.
  */
  const hasHlIds = !!(stNow && stNow.hlIds && stNow.hlIds.length);
  let noDrawAnim = (hasBeats || hasHlIds) && (beatAnim || stepAdvance);
  /* hlDraw: draw the step on as usual, and let the beats follow */
  if (noDrawAnim && stNow && stNow.hlDraw && !beatAnim) noDrawAnim = false;
  const animate = beatAnim || stepAdvance;
  let reflashIds = opt.reflashIds || null;
  if (hasBeats && stepAdvance && !beatAnim && UI.hlBeat && UI.hlBeat.reflashFor) {
    reflashIds = UI.hlBeat.reflashFor(0);
  } else if (hasHlIds && stepAdvance && !beatAnim && hl) {
    reflashIds = new Set(hl);
  }
  if (!opt.beatAdvance) UI.lastDrawn = { id: it.id, step: UI.step };
  const zoomDur = 0.62 / UI.speed;
  /* ids from this step's beats so far (so DA stays after its beat when AE draws) */
  let revealedIds = null;
  if (UI.hlBeat && UI.hlBeat.sets && UI.hlBeat.sets.length) {
    revealedIds = new Set();
    const upToBeat = Math.min(UI.hlBeat.i, UI.hlBeat.sets.length - 1);
    for (let bi = 0; bi <= upToBeat; bi++) {
      const s = UI.hlBeat.sets[bi];
      if (s) s.forEach(id => revealedIds.add(id));
    }
  }
  /*
    Beat staging. Whatever a later beat says it will draw or show is kept off
    the figure until that beat comes round; whatever an earlier beat drew stays,
    construction lines included, whether or not the checkbox is ticked.
  */
  let hideIds = null, forceIds = null, drawIds = null, fadeIds = null, keepIds = null, dimIds = null;
  if (UI.step !== null && it.steps) {
    /* everything staged by a beat in this step or any step before it */
    const staged = new Set();
    for (let s = 1; s < UI.step; s++) {
      const sp0 = it.steps[s - 1];
      (sp0 && sp0.hlBeats ? sp0.hlBeats : []).forEach(b => {
        const sp = beatSpec(b); if (!sp) return;
        sp.draw.concat(sp.show).forEach(id => staged.add(id));
      });
    }
    const later = new Set();
    if (UI.hlBeat && UI.hlBeat.specs && UI.hlBeat.id === it.id && UI.hlBeat.step === UI.step) {
      const specs = UI.hlBeat.specs, at = UI.hlBeat.i;
      specs.forEach((sp, k) => {
        if (!sp) return;
        const into = k > at ? later : staged;
        sp.draw.forEach(id => into.add(id));
        sp.show.forEach(id => into.add(id));
      });
      const cur = specs[at];
      if (cur) {
        if (cur.keep.length) keepIds = new Set(cur.keep);
        if (cur.dim.length) dimIds = new Set(cur.dim);
        if (animate) {
          if (cur.draw.length) drawIds = new Set(cur.draw);
          if (cur.show.length) fadeIds = new Set(cur.show);
        }
      }
    }
    staged.forEach(id => later.delete(id));
    hideIds = later.size ? later : null;
    forceIds = staged.size ? staged : null;
  }
  const fsBig = !!(window.FSX && window.FSX.active);
  const opts = {
    w: fsBig ? 1000 : 640, h: fsBig ? 700 : 480, showScaffold: UI.scaffold, upTo, highlight: hl, hlKeep,
    /* the studio holds one fixed scale, so altered lengths visibly change size */
    view: (fsBig && window.FSX.lockedView) ? window.FSX.lockedView() : undefined,
    animate, speed: UI.speed, noDrawAnim, reflashIds, revealedIds,
    hideIds, forceIds, drawIds, fadeIds, keepIds, dimIds,
    hlExclude: (stNow && stNow.hlNot && stNow.hlNot.length) ? new Set(stNow.hlNot) : null
  };
  let out = fig.render(opts);
  let z = { needed: false };
  if (animate && !beatAnim && !noDrawAnim) {
    z = G.zoomFor(fig.fig, { step: UI.step });
    if (z.needed) out = fig.render(Object.assign({}, opts, { delay0: zoomDur + 0.12 }));
  }
  wrap.innerHTML = out;
  clearTimeout(UI.zoomTimer);
  if (z.needed) {
    const body = wrap.firstChild && wrap.firstChild.querySelector
      ? wrap.firstChild.querySelector('.figbody') : null;
    if (body) {
    body.style.transitionDuration = zoomDur + 's';
    requestAnimationFrame(() => {
      body.style.transform = `translate(${f2(z.tx)}px,${f2(z.ty)}px) scale(${f2(z.s)})`;
    });
    /* let the finished figure sit still for a moment before coming back in */
    UI.zoomTimer = setTimeout(() => {
      if (body.isConnected) body.style.transform = '';
    }, (zoomDur + 0.12 + drawSpan(UI.step) + HOLD) * 1000);
    }
  }
  applyFigLayer(it, wrap.firstChild, stepAdvance && !beatAnim);
  wireFig(wrap.firstChild, fig);
  if (window.FSX && window.FSX.active) window.FSX.afterDraw(wrap.firstChild, fig);
}

/**
 * Theorem 12 (and similar): two diagram layers — the true claim figure and the
 * reductio figure. Swipe the claim up when the supposition begins; swipe the
 * reductio up when the proof restores the claim on the last step.
 */
function thm12Layer(step, n) {
  if (step === null || step === 0 || step === 1) return 'claim';
  if (step >= n) return 'claim';           /* final line: back to the truth */
  return 'reductio';                       /* steps 2 … n-1 */
}
function applyFigLayer(it, svg, doTransition) {
  if (!svg || !it) return;
  /* only thm 12 uses layered claim/reductio figures for now */
  if (it.id !== 'thm:12') {
    clearTimeout(UI.figLayerTimer); UI.figLayerTimer = 0; UI.figLayerSvg = null;
    svg.removeAttribute('data-layer');
    UI.figLayer = null;
    return;
  }
  const n = nSteps(it);
  const target = thm12Layer(UI.step, n);
  const prev = UI.figLayer;
  /* a swipe already under way on this very figure: leave it to finish, or it
     would start over from the beginning and the figure would judder */
  if (UI.figLayerTimer && UI.figLayerSvg === svg && prev === target) return;
  clearTimeout(UI.figLayerTimer); UI.figLayerTimer = 0;
  UI.figLayerSvg = svg;
  if (doTransition && prev && prev !== target) {
    const mode = (prev === 'claim' && target === 'reductio') ? 'to-reductio'
      : (prev === 'reductio' && target === 'claim') ? 'to-claim'
      : target;
    svg.setAttribute('data-layer', mode);
    UI.figLayer = target;
    /* the swipe itself is 0.72 * --dur; let it land before settling */
    UI.figLayerTimer = setTimeout(() => {
      UI.figLayerTimer = 0;
      if (svg.isConnected) svg.setAttribute('data-layer', target);
    }, 700 / UI.speed);
  } else {
    svg.setAttribute('data-layer', target);
    UI.figLayer = target;
  }
}

function isPhoneLayout() {
  return !!(window.matchMedia && matchMedia('(max-width:900px)').matches);
}

/** Corner badge: only while Replay is running, and only for real proof lines (≥ 1). */
function syncStepBadge() {
  const badge = $('#fig-stepbadge');
  if (!badge) return;
  const show = !!UI.playing && UI.step !== null && UI.step >= 1;
  badge.textContent = show ? String(UI.step) : '';
  badge.classList.toggle('on', show);
  badge.hidden = !show;
  badge.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (show) badge.setAttribute('aria-label', 'Proof step ' + UI.step);
  else badge.removeAttribute('aria-label');
}

function syncSteps() {
  const it = BY_ID[UI.id]; if (!it) return;
  const n = nSteps(it);
  $$('#main ol.steps li, #fsov ol.steps li').forEach(li => {
    const s = +li.dataset.step;
    li.classList.toggle('on', UI.step === s);
    li.classList.toggle('done', UI.step !== null && s < UI.step);
    li.classList.toggle('future', UI.step !== null && s > UI.step);
  });
  const chipTxt = UI.step === null ? '' : (UI.step === 0 ? 'what is given' : 'step ' + UI.step + ' of ' + n);
  const chip = $('#stepchip');
  if (chip) chip.textContent = chipTxt;
  const chip2 = $('#fs-stepchip'); if (chip2) chip2.textContent = chipTxt;
  const pl = $('#b-play'); if (pl) pl.textContent = UI.playing ? '❙❙ pause' : '▶ Play';
  const pl2 = $('#fs-play'); if (pl2) pl2.textContent = UI.playing ? '❙❙ pause' : '▶ Play';
  const op = $('#ob-play'); if (op) op.textContent = UI.playing ? '❚❚' : '▶';
  /* on a phone, the line of the proof the figure has reached sits right
     under the drawing (the proof itself is further down the page) */
  const sl = $('#fig-stepline');
  if (sl) {
    const stx = (UI.step !== null && UI.step >= 1 && it.steps && it.steps[UI.step - 1])
      ? UI.step + '.  ' + it.steps[UI.step - 1].text : '';
    sl.textContent = stx;
    sl.hidden = !stx;
  }
  syncStepBadge();
}

function setStep(s) {
  const it = BY_ID[UI.id]; if (!it) return;
  const n = nSteps(it);
  if (s === null) UI.step = null;
  else UI.step = Math.max(0, Math.min(n, s));
  UI.sel = null;
  clearHlBeats();
  drawFig(); syncSteps();
  /* On phone the diagram sits above the proof; auto-scrolling to each line
     steals focus and fights the user’s free scroll. Desktop keeps follow-along. */
  if (UI.playing && !isPhoneLayout()) {
    const li = $(`#main ol.steps li[data-step="${UI.step}"]`);
    if (li) li.scrollIntoView({ block: 'nearest' });
  }
}
const f2 = n => Math.round(n * 100) / 100;
/* how many things are drawn on at this step, and how long that takes */
function animCount(s) {
  const fig = figFor(UI.id); if (!fig) return 1;
  let n = 0;
  fig.fig.objs.forEach(o => {
    if ((o.step || 0) !== s) return;
    if (o.role === 'scaffold' && !UI.scaffold) return;
    if (o.role === 'hidden' || (o.step || 0) > 90) return;
    n++;
  });
  return Math.max(1, n);
}
const HOLD = 0.55;                 // the finished figure stays put before anything moves
function drawSpan(s) {
  const n = animCount(s);
  let late = 0;
  const fig = figFor(UI.id);
  if (fig) fig.fig.objs.forEach(o => {
    if ((o.step || 0) === s && o.late && (o.role !== 'scaffold' || UI.scaffold)) late = Math.max(late, o.late);
  });
  return ((n > 5 ? 0.13 : 0.17) * (n - 1) + 0.82 + late) / UI.speed;
}
function stepTime(s) {
  const fig = figFor(UI.id); if (!fig) return 1400;
  const it = BY_ID[UI.id];
  const st = it && it.steps && s > 0 ? it.steps[s - 1] : null;
  const z = G.zoomFor(fig.fig, { step: s });
  const zoomOut = z.needed ? (0.62 + 0.12) / UI.speed : 0;
  const zoomBack = z.needed ? 0.62 / UI.speed : 0;
  const nBeats = st && st.hlBeats ? st.hlBeats.length : 1;
  const beatGap = (st && st.hlBeatMs ? st.hlBeatMs : 950) / UI.speed / 1000;
  const beatExtra = nBeats > 1 ? (nBeats - 1) * beatGap + 0.35 : 0;
  /* thm 12 layer swipe claim ↔ reductio */
  const n = it ? nSteps(it) : 0;
  const layerSwipe = (it && it.id === 'thm:12' && (s === 2 || s === n)) ? 0.85 / UI.speed : 0;
  const t = (zoomOut + drawSpan(s) + HOLD + zoomBack + 0.35 + beatExtra + layerSwipe) * 1000;
  return Math.max(1100, Math.min(9000, t));
}
function play() {
  if (UI.playing) { stopPlay(); syncSteps(); return; }
  const it = BY_ID[UI.id], n = nSteps(it);
  /*
    Play from wherever the reader is standing: if a step of the proof is
    showing, that step is drawn again from its own beginning and the proof
    runs on to the end. With no step chosen, it plays from the start.
    (Thm 12 begins on step 1: its claim figure is already the "given".)
  */
  const chosen = (UI.step !== null && UI.step >= 1) ? UI.step : null;
  const startAt = chosen !== null ? chosen : ((it && it.id === 'thm:12') ? 1 : 0);
  UI.step = startAt; clearHlBeats();
  UI.figLayer = null; clearTimeout(UI.figLayerTimer);
  /* pretend we have just come from the step before, so this one draws itself on */
  UI.lastDrawn = startAt >= 1 ? { id: it.id, step: startAt - 1 } : null;
  drawFig(); syncSteps();
  const tick = () => {
    if (UI.step >= n) { stopPlay(); syncSteps(); return; }
    setStep(UI.step + 1);
    UI.playing = setTimeout(tick, stepTime(UI.step));
  };
  UI.playing = setTimeout(tick, startAt >= 1 ? stepTime(startAt) : 700 / UI.speed);
  syncSteps();
}
function stopPlay() {
  if (UI.playing) { clearTimeout(UI.playing); UI.playing = 0; }
  clearHlBeats();
  syncStepBadge();
}

/* ---------- dragging & clicking in the figure ---------- */
function linkedIdList(fig, id) {
  const set = new Set([id]);
  expandAliases(fig, set);
  return Array.from(set);
}
function wireFig(svg, fig) {
  if (!svg) return;
  svg.addEventListener('click', ev => {
    const el = ev.target.closest('[data-eid]');
    if (el) {
      const ids = linkedIdList(fig, el.dataset.eid);
      const same = UI.sel && UI.sel.length === ids.length && ids.every((x, i) => x === UI.sel[i]);
      UI.sel = same ? null : ids;
    } else UI.sel = null;
    drawFig(); litText();
  });
  svg.addEventListener('mouseover', ev => {
    const el = ev.target.closest('[data-eid]');
    if (!el) { hover(null); return; }
    hover(el.dataset.eid, linkedIdList(fig, el.dataset.eid));
  });
  svg.addEventListener('mouseleave', () => hover(null));
}
/* soft highlight while the mouse is over a part (group = co-linked ids) */
function hover(id, group) {
  const ids = group && group.length ? group : (id ? [id] : []);
  const hit = eid => ids.includes(eid);
  $$('#main .fig [data-eid], #fsov .fig [data-eid]').forEach(el => el.classList.toggle('hov', hit(el.dataset.eid)));
  $$('#main .ref, #fsov .ref').forEach(r => {
    const eids = (r.dataset.eids || '').split(' ');
    r.classList.toggle('hov', ids.some(i => eids.includes(i)));
  });
}
function litText() {
  $$('#main .ref, #fsov .ref').forEach(r => {
    const ids = (r.dataset.eids || '').split(' ');
    r.classList.toggle('lit', !!(UI.sel && ids.some(i => UI.sel.includes(i))));
  });
}

/* ---------- citation popover ---------- */
let pop = null;
function showCite(id, x, y) {
  hideCite();
  const it = BY_ID[id]; if (!it) return;
  pop = document.createElement('div');
  pop.className = 'pop';
  const f = FIGS[id] ? G.makeFigure(FIGS[id], {}) : null;
  const figHtml = f
    ? `<div class="pop-fig">${f.render({ w: 480, h: 320, showScaffold: false, pad: 0.04, preview: true })}</div>`
    : '';
  pop.innerHTML = `<button class="close">✕</button><h5>${esc(shortRef(id))}</h5>
    <div><b>${esc(titleOf(it))}</b></div>
    <div style="color:var(--muted);font-size:14.5px;margin-top:4px">${esc(it.statement || it.text || '')}</div>
    ${figHtml}
    <div style="margin-top:8px"><a data-goto="${id}" style="font-family:var(--sans);font-size:12px;cursor:pointer">open →</a></div>`;
  document.body.appendChild(pop);
  const r = pop.getBoundingClientRect();
  pop.style.left = Math.max(12, Math.min(x, innerWidth - r.width - 14)) + 'px';
  pop.style.top = Math.max(12, Math.min(y + 12, innerHeight - r.height - 14)) + 'px';
  pop.addEventListener('click', ev => {
    if (ev.target.closest('.close')) hideCite();
    const g = ev.target.closest('[data-goto]');
    if (g) { hideCite(); go(g.dataset.goto); }
  });
}
function hideCite() { if (pop) { pop.remove(); pop = null; } }

/* ---------- navigation ---------- */
function setNavOpen(open) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.toggle('nav-open', !!open);
  const btn = document.getElementById('b-nav');
  if (btn) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close contents' : 'Open contents');
    btn.title = open ? 'Close contents' : 'Contents';
  }
  /* lock body scroll only while the drawer is open (phone) */
  if (window.matchMedia && matchMedia('(max-width:900px)').matches) {
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
}
function closeNav() { setNavOpen(false); }
function toggleNav() {
  const app = document.getElementById('app');
  setNavOpen(!(app && app.classList.contains('nav-open')));
}
function go(id) {
  /* leaving a theorem drops its edited geometry (normal view and fullscreen studio) */
  if (id !== UI.id) {
    if (window.FSX) window.FSX.leaveTheorem(UI.id);
    delete UI.figs[UI.id]; delete UI.states[UI.id];
  }
  if (id === 'rec') {
    stopPlay(); UI.id = 'rec'; UI.step = null; UI.sel = null;
    if (!REC.queue.length) recBuild(REC.scope);
    renderNav(); renderRecitation(); location.hash = 'rec'; $('#main').scrollTop = 0;
    closeNav(); return;
  }
  if (id === 'wb') {
    stopPlay(); UI.id = 'wb'; UI.step = null; UI.sel = null;
    if (!window.WB.challenge) window.WB_api.setup('equilateral');
    renderNav(); renderWorkbench(); location.hash = 'wb'; $('#main').scrollTop = 0;
    closeNav(); return;
  }
  if (!BY_ID[id]) return;
  stopPlay();
  const prev = BY_ID[UI.id];
  const next = BY_ID[id];
  /* Same library group already on screen: scroll in place — do not remount
     (remount + spy was causing last/second-last oscillation). */
  if (prev && next && isLibraryGroup(prev._group) && prev._group === next._group &&
      $('#main .scrollitem')) {
    UI.id = id; UI.step = null; UI.sel = null; UI.lastDrawn = null;
    UI.figLayer = null; clearTimeout(UI.figLayerTimer);
    UI.open[navKeyOf(id)] = true;
    renderNav();
    location.hash = id;
    scrollLibraryTo(id);
    closeNav();
    return;
  }
  UI.id = id; UI.step = null; UI.sel = null; UI.lastDrawn = null;
  UI.figLayer = null; clearTimeout(UI.figLayerTimer);
  UI.open[navKeyOf(id)] = true;
  renderNav(); renderItem();
  /* scroll lists position themselves; theorems reset to top */
  if (!$('#main .scrollitem')) $('#main').scrollTop = 0;
  location.hash = id;
  closeNav();
}
function step(d) {
  const list = ITEMS.map(i => i.id), k = list.indexOf(UI.id);
  if (k < 0) return;
  const j = Math.max(0, Math.min(list.length - 1, k + d));
  if (j === k) return;
  go(list[j]);
}
function toast(s) {
  const t = $('#toast'); t.textContent = s; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1400);
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  if (ev.target.closest('#b-shelf-course')) { setShelf('course'); return; }
  if (ev.target.closest('#b-shelf-elements')) { setShelf('elements'); return; }
  if (ev.target.closest('#b-greek')) { setGreek(!UI.greek); return; }
  const jump = ev.target.closest('a[data-jump]');
  if (jump) {
    const id = jump.dataset.jump;
    if (id && /^b\d+:/.test(id)) setShelf('elements');
    else setShelf('course');
    /* setShelf already navigates; if it landed elsewhere, go explicitly */
    if (BY_ID[id]) go(id);
    return;
  }
  if (ev.target.closest('#b-nav') || ev.target.closest('#nav-tab')) { toggleNav(); return; }
  if (ev.target.closest('#nav-backdrop')) { closeNav(); return; }
  const sec = ev.target.closest('#nav-list .navsec');
  if (sec) {
    const g = sec.dataset.g;
    const nowOpen = UI.open[g] !== undefined ? UI.open[g] : g === navKeyOf(UI.id);
    UI.open[g] = !nowOpen;
    renderNav(); return;
  }
  const a = ev.target.closest('#nav-list a');
  if (a) { go(a.dataset.id); return; }
  const prin = ev.target.closest('.prinitem[data-prin-id]');
  if (prin) { go(prin.dataset.prinId); return; }
  const c = ev.target.closest('.cite[data-cite]');
  if (c) { showCite(c.dataset.cite, ev.clientX, ev.clientY); return; }
  const li = ev.target.closest('#main ol.steps li');
  if (li && !ev.target.closest('.ref')) {
    stopPlay();
    /* clicking the step you are already on puts the whole figure back */
    const s = +li.dataset.step;
    setStep(UI.step === s && !UI.sel ? null : s);
    return;
  }
  const rf = ev.target.closest('#main .ref');
  if (rf) {
    const ids = (rf.dataset.eids || '').split(' ');
    const same = UI.sel && UI.sel.length === ids.length && UI.sel.every((x, i) => x === ids[i]);
    UI.sel = same ? null : ids;
    drawFig(); litText(); return;
  }
  const rv = ev.target.closest('.qitem .reveal');
  if (rv) {
    const box = rv.closest('.qitem'), i = +box.dataset.q;
    const q = BY_ID[UI.id].questions[i];
    const act = rv.dataset.act; /* 'hint' | 'ans' */
    const body = $('.body', box);
    const showingThis = box.classList.contains('open') && box.dataset.openAct === act;
    const label = btn => {
      if (btn.dataset.act === 'hint')
        btn.textContent = (box.dataset.openAct === 'hint' && box.classList.contains('open')) ? 'Hide hint' : 'Hint';
      else
        btn.textContent = (box.dataset.openAct === 'ans' && box.classList.contains('open')) ? 'Hide answer' : 'Show answer';
    };
    if (showingThis) {
      /* put it away */
      box.classList.remove('open');
      box.dataset.openAct = '';
      body.innerHTML = '';
    } else {
      box.classList.add('open');
      box.dataset.openAct = act;
      body.innerHTML = act === 'hint'
        ? `<i>Hint:</i> ${markup(q.hint || '', figFor(UI.id))}`
        : `<i>Answer:</i> ${markup(q.answer || '', figFor(UI.id))}`;
    }
    box.querySelectorAll('.reveal').forEach(label);
    return;
  }
  if (ev.target.closest('#b-prev') || ev.target.closest('#ob-prev')) { stopPlay(); setStep(UI.step === null ? 0 : UI.step - 1); return; }
  if (ev.target.closest('#b-next') || ev.target.closest('#ob-next')) { stopPlay(); setStep(UI.step === null ? 1 : UI.step + 1); return; }
  if (ev.target.closest('#b-play') || ev.target.closest('#ob-play')) { play(); return; }
  if (ev.target.closest('#b-reset')) {
    const fw = figFor(UI.id);
    if (fw) { fw.reset(); if (window.FSX) window.FSX.leaveTheorem(UI.id); drawFig(); toast('Original figure restored'); }
    return;
  }
  if (ev.target.closest('#b-speed')) {
    const i = SPEEDS.findIndex(x => x.v === UI.speed);
    const nx = SPEEDS[(i + 1) % SPEEDS.length];
    UI.speed = nx.v;
    $('#b-speed').textContent = nx.label;
    const fsb = document.getElementById('fs-speed'); if (fsb) fsb.textContent = nx.label;
    return;
  }
  if (ev.target.closest('#rec-draw')) { REC.drawing = !REC.drawing; renderRecitation(); return; }
  if (ev.target.closest('#rec-proof')) { REC.proof = !REC.proof; renderRecitation(); return; }
  if (ev.target.closest('#rec-key')) { REC.key = !REC.key; renderRecitation(); return; }
  if (ev.target.closest('#rec-yes')) { recNext(true); return; }
  if (ev.target.closest('#rec-no')) { recNext(false); return; }
  if (ev.target.closest('#rec-again')) { recBuild(REC.scope, REC.again.slice()); renderRecitation(); return; }
  if (ev.target.closest('#rec-restart') || ev.target.closest('#rec-restart2')) {
    recBuild(REC.scope); renderRecitation(); return;
  }
  const gt = ev.target.closest('.reclink[data-goto]');
  if (gt) { go(gt.dataset.goto); return; }
  const wt = ev.target.closest('.wbtool');
  if (wt) { window.WB.tool = wt.dataset.tool; window.WB.sel = []; window.WB.msg = ''; renderWorkbench(); return; }
  if (ev.target.closest('#wb-undo')) { window.WB_api.undo(); renderWorkbench(); return; }
  if (ev.target.closest('#wb-clear')) { window.WB_api.clear(true); renderWorkbench(); return; }
  const PR = window.WB_proof;
  if (ev.target.closest('#wb-begin-proof')) {
    PR.beginProof(); PR.checkGoal(); window.WB.msg = ''; renderWorkbench(); return;
  }
  if (ev.target.closest('#wb-back-figure')) { PR.backToFigure(); renderWorkbench(); return; }
  const pk = ev.target.closest('[data-pick]');
  if (pk) { window.WB.msg = PR.startPick(pk.dataset.pick); renderWorkbench(); return; }
  const rl = ev.target.closest('.wbrel[data-rel]');
  if (rl) { window.WB.msg = PR.setRel(rl.dataset.rel); renderWorkbench(); return; }
  const sl = ev.target.closest('.wbslot[data-slot]');
  if (sl) { window.WB.draft[sl.dataset.slot] = null; renderWorkbench(); return; }
  if (ev.target.closest('#wb-add')) { window.WB.msg = PR.addClaim(); renderWorkbench(); return; }
  if (ev.target.closest('#wb-clear-line')) { PR.clearDraft(); window.WB.msg = ''; renderWorkbench(); return; }
  if (ev.target.closest('#wb-undo-claim')) { PR.undoClaim(); PR.checkGoal(); renderWorkbench(); return; }
  const cl = ev.target.closest('[data-claim]');
  if (cl && !ev.target.closest('.cite')) {
    const n = +cl.dataset.claim;
    window.WB.litClaim = window.WB.litClaim === n ? 0 : n;
    renderWorkbench(); return;
  }
  if (ev.target.closest('#b-theme')) {
    UI.theme = UI.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = UI.theme;
    $('#b-theme').textContent = UI.theme === 'dark' ? '☀' : '☾';
    return;
  }
  if (ev.target.closest('#b-full')) { stopPlay(); setStep(null); return; }
  if (ev.target.closest('#fig-ctl-tab')) {
    const fb = ev.target.closest('.figbox');
    if (fb) fb.classList.toggle('ctlopen');
    return;
  }
  if (ev.target.closest('#b-scaf')) {
    UI.scaffold = !UI.scaffold;
    ['b-scaf', 'fs-scaf'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.toggle('on', UI.scaffold);
    });
    drawFig(); return;
  }
  if (!ev.target.closest('.pop') && !ev.target.closest('.cite')) hideCite();
});
/* clicking anywhere quiet — not a step, a name, a chip or a control — lets go
   of whatever was being looked at and puts the whole figure back */
document.addEventListener('click', ev => {
  if (UI.step === null && !UI.sel) return;
  if (UI.id === 'wb' || UI.id === 'rec') return;
  const t = ev.target;
  if (!t.closest || !t.closest('#main')) return;
  if (t.closest('ol.steps li') || t.closest('.ref') || t.closest('.cite') ||
      t.closest('button') || t.closest('select') || t.closest('input') ||
      t.closest('label') || t.closest('a') || t.closest('svg') ||
      t.closest('.qitem') || t.closest('.pop')) return;
  stopPlay(); UI.sel = null; setStep(null);
});

document.addEventListener('change', ev => {
  if (ev.target.id === 'rec-scaf') { REC.scaffold = ev.target.checked; renderRecitation(); }
  if (ev.target.id === 'rec-scope') { recBuild(ev.target.value); renderRecitation(); }
  if (ev.target.id === 'wb-ch') {
    window.WB_api.clear(false); window.WB_api.setup(ev.target.value);
    window.WB.mode = 'construct'; window.WB.claims = []; window.WB.draft = null;
    window.WB.proved = false; window.WB.proofMsg = ''; renderWorkbench();
  }
  if (ev.target.id === 'wb-cite') { window.WB_proof.setCite(ev.target.value); renderWorkbench(); }
  if (ev.target.id === 'wb-ref') { window.WB.refId = ev.target.value; renderWorkbench(); }
});

document.addEventListener('input', ev => { if (ev.target.id === 'find') renderNav(); });
document.addEventListener('mouseover', ev => {
  const rf = ev.target.closest('#main .ref');
  if (rf) {
    const eids = (rf.dataset.eids || '').split(' ').filter(Boolean);
    hover(eids[0] || null, eids);
  } else if (!ev.target.closest('#main .fig')) hover(null);
});
document.addEventListener('keydown', ev => {
  if (ev.target.tagName === 'INPUT') { if (ev.key === 'Escape') { ev.target.value = ''; renderNav(); ev.target.blur(); } return; }
  if (UI.id === 'rec') {
    if (ev.key === 'd') { REC.drawing = !REC.drawing; renderRecitation(); }
    else if (ev.key === 'p') { REC.proof = !REC.proof; renderRecitation(); }
    else if (ev.key === 'k') { REC.key = !REC.key; renderRecitation(); }
    else if (ev.key === 'Enter' || ev.key === 'y') recNext(true);
    else if (ev.key === 'n') recNext(false);
    return;
  }
  if (ev.key === 'ArrowRight') { stopPlay(); setStep(UI.step === null ? 1 : UI.step + 1); }
  else if (ev.key === 'ArrowLeft') { stopPlay(); setStep(UI.step === null ? 0 : UI.step - 1); }
  else if (ev.key === 'ArrowDown' || ev.key === 'j') { ev.preventDefault(); step(1); }
  else if (ev.key === 'ArrowUp' || ev.key === 'k') { ev.preventDefault(); step(-1); }
  else if (ev.key === ' ') { ev.preventDefault(); play(); }
  else if (ev.key === 'Escape') {
    const app = document.getElementById('app');
    if (app && app.classList.contains('nav-open')) { closeNav(); return; }
    stopPlay(); setStep(null); UI.sel = null; drawFig(); litText(); hideCite();
  }
  else if (ev.key === '/') { ev.preventDefault(); setNavOpen(true); $('#find').focus(); }
  else if (ev.key === 'd') { $('#b-theme').click(); }
});
window.addEventListener('hashchange', () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || id === UI.id) return;
  if (id.indexOf('b1:') === 0 && UI.shelf !== 'elements') {
    UI.shelf = 'elements'; rebuildCatalog(); syncShelfChrome();
  } else if ((id.indexOf('thm:') === 0 || id.indexOf('def:') === 0) && UI.shelf !== 'course') {
    UI.shelf = 'course'; rebuildCatalog(); syncShelfChrome();
  }
  if (BY_ID[id] || id === 'rec' || id === 'wb') go(id);
});

/* ---------- start ---------- */
const start = decodeURIComponent((location.hash || '').slice(1));
if (/^b\d+:/.test(start)) UI.shelf = 'elements';
rebuildCatalog();
UI.id = BY_ID[start] ? start : (UI.shelf === 'elements' ? 'b1:prop:1' : 'def:1');
syncShelfChrome();
if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
  UI.theme = 'dark'; document.documentElement.dataset.theme = 'dark';
  const t = $('#b-theme'); if (t) t.textContent = '☀';
}
/* Hook for the animation builder (animator.html). Harmless when unused. */
window.__EUCLID__ = {
  go, setStep, drawFig, renderItem, figFor, stopPlay, clearHlBeats, play,
  UI, ITEMS, BY_ID, get CONTENT() { return window.CONTENT; },
  /* exported for the fullscreen studio (FSX) */
  markup, refsIn, expandAliases, expandAngleRays, expandPolySides,
  wireFig, syncSteps, nSteps, litText, hover, shortRef, titleOf, kickerOf, SPEEDS, toast
};
renderNav(); renderItem();
window.addEventListener('resize', () => {
  /* leaving the phone breakpoints should never leave the drawer “stuck” open
     (landscape phones also use the drawer, so they are exempt too) */
  if (window.matchMedia && !matchMedia('(max-width:900px)').matches &&
      !matchMedia('(max-width:1000px) and (max-height:520px) and (orientation:landscape)').matches) closeNav();
  drawFig();
});
})();
