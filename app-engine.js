/* Geometry Playground — enhanced engine
   Features: Byrne colors, construction replay, drag-to-deform,
   high-fidelity diagrams, answer keys
*/
let DATA = null;
const state = {
  view: "home",
  thmId: null,
  step: 0,
  isolate: null,
  byrne: localStorage.getItem("geo-byrne") === "1",
  animating: false,
  geom: null, // live geometry params for current theorem
  showAnswers: {}, // `${thmId}:${qIndex}` -> bool
};

const BYRNE = {
  // Oliver Byrne palette-ish
  black: "#1a1a1a",
  blue: "#2f6fed",
  yellow: "#f5c518",
  red: "#e23d28",
  paleBlue: "rgba(47,111,237,0.22)",
  paleYellow: "rgba(245,197,24,0.28)",
  paleRed: "rgba(226,61,40,0.22)",
  paleTeal: "rgba(20,150,120,0.18)",
};

async function boot() {
  DATA = typeof EMBEDDED_DATA !== "undefined"
    ? EMBEDDED_DATA
    : await (await fetch("content.json")).json();
  indexRefs();
  if (state.byrne) document.body.classList.add("byrne");
  buildSidebar();
  bindGlobal();
  render();
}

const REF_INDEX = {};
function indexRefs() {
  for (const d of DATA.definitions) REF_INDEX[d.id] = { ...d, kind: "Definition" };
  for (const p of DATA.postulates) REF_INDEX[p.id] = { ...p, kind: "Postulate" };
  for (const c of DATA.commonNotions) REF_INDEX[c.id] = { ...c, kind: "Common Notion" };
  for (const e of DATA.extra) REF_INDEX[e.id] = { ...e, kind: "Principle" };
  for (const t of DATA.theorems) {
    REF_INDEX[t.id] = {
      id: t.id,
      term: t.aka || t.title,
      text: t.statement,
      kid: t.kind === "construction" ? "A construction (how-to) theorem." : "A demonstrated theorem.",
      kind: `Theorem ${t.num}`,
      num: t.num,
    };
  }
}

function buildSidebar() {
  const nav = document.getElementById("sidebar");
  const thms = DATA.theorems.map(t => {
    const cls = t.kind === "construction" ? "nav-item construction" : "nav-item";
    const icons = [];
    if (t.interactive?.draggable) icons.push("⠿");
    if (t.interactive?.animateConstruction) icons.push("▶");
    return `<button class="${cls}" data-thm="${t.id}">
      <span class="badge">${t.num}</span>
      <span class="label">${escapeHtml(t.title)}
        <span class="sub">${t.aka ? escapeHtml(t.aka) + " · " : ""}${icons.join(" ") || (t.kind === "construction" ? "construction" : "theorem")}</span>
      </span>
    </button>`;
  }).join("");

  nav.innerHTML = `
    <input class="search" id="navSearch" placeholder="Search theorems…" />
    <div class="nav-section">
      <h2>Start</h2>
      <div class="nav-list">
        <button class="nav-item" data-view="home"><span class="badge">★</span><span class="label">Home & how to use</span></button>
        <button class="nav-item" data-view="library-defs"><span class="badge">D</span><span class="label">Definitions 1–24</span></button>
        <button class="nav-item" data-view="library-posts"><span class="badge">P</span><span class="label">Postulates 1–5</span></button>
        <button class="nav-item" data-view="library-cns"><span class="badge">N</span><span class="label">Common Notions</span></button>
      </div>
    </div>
    <div class="nav-section">
      <h2>Theorems <span style="font-weight:500;text-transform:none;letter-spacing:0">⠿ drag · ▶ animate</span></h2>
      <div class="nav-list" id="thmNav">${thms}</div>
    </div>
    <div class="nav-section">
      <h2>Hooks</h2>
      <div class="nav-list">
        <button class="nav-item" data-view="hooks"><span class="badge">H</span><span class="label">Chapter 1 hook theorems</span></button>
      </div>
    </div>
  `;

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.thm) openTheorem(btn.dataset.thm);
    else if (btn.dataset.view) {
      state.view = btn.dataset.view;
      state.thmId = null;
      render();
    }
  });

  nav.querySelector("#navSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    for (const btn of nav.querySelectorAll("#thmNav .nav-item")) {
      const t = DATA.theorems.find(x => x.id === btn.dataset.thm);
      const hay = `${t.num} ${t.title} ${t.aka || ""} ${t.statement}`.toLowerCase();
      btn.style.display = !q || hay.includes(q) ? "" : "none";
    }
  });
}

function bindGlobal() {
  document.querySelectorAll("[data-view]").forEach(btn => {
    if (btn.closest(".header-actions")) {
      btn.addEventListener("click", () => {
        state.view = btn.dataset.view;
        state.thmId = null;
        render();
      });
    }
  });
  document.getElementById("btnByrne")?.addEventListener("click", () => {
    state.byrne = !state.byrne;
    localStorage.setItem("geo-byrne", state.byrne ? "1" : "0");
    document.body.classList.toggle("byrne", state.byrne);
    document.getElementById("btnByrne")?.classList.toggle("active", state.byrne);
    if (state.view === "theorem") render();
  });
  document.getElementById("backdrop").addEventListener("click", closePopover);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopover();
    if (state.view === "theorem" && state.thmId && !state.animating) {
      const t = getThm();
      if (!t) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        advance(t);
      }
      if (e.key === "ArrowLeft") { retreat(t); render(); }
    }
  });
}

function getThm() {
  return DATA.theorems.find(x => x.id === state.thmId);
}

function openTheorem(id) {
  state.view = "theorem";
  state.thmId = id;
  state.step = 0;
  state.isolate = null;
  state.geom = defaultGeom(DATA.theorems.find(x => x.id === id));
  state.showAnswers = {};
  render();
  document.getElementById("workspace").scrollTop = 0;
}

function defaultGeom(t) {
  if (!t) return null;
  const mode = t.interactive?.dragMode;
  switch (mode) {
    case "equilateral-base":
      return { ax: 120, ay: 250, bx: 320, by: 250 };
    case "isosceles-apex":
      return { ax: 220, ay: 70, bx: 110, by: 250, cx: 330, cy: 250 };
    case "sas-free":
      return { scale: 1 };
    case "angle-open":
      return { open: 55 }; // degrees of half-angle-ish
    case "segment-length":
      return { half: 140 };
    case "point-on-line":
      return { px: 220 };
    case "point-above-line":
      return { px: 220, py: 80 };
    case "vertical-rotate":
      return { a: 35 };
    case "triangle-vertices":
      return { ax: 200, ay: 70, bx: 80, by: 260, cx: 340, cy: 240 };
    case "parallel-transversal":
      return { gap: 120, t: 0.45, tilt: 25 };
    case "parallelogram-shear":
    case "parallelogram-shear-base":
      return { shear: 40, h: 120 };
    case "triangle-same-parallels":
      return { cx: 160, gx: 300 };
    case "right-triangle-legs":
      return { legAB: 100, legAC: 120 };
    default:
      return {};
  }
}

// fix isosceles default
function fixGeom(t) {
  if (!state.geom) state.geom = defaultGeom(t);
  if (t?.interactive?.dragMode === "isosceles-apex" && state.geom.cx == null) {
    state.geom = { ax: 220, ay: 70, bx: 110, by: 250, cx: 330, cy: 250 };
  }
  if (t?.interactive?.dragMode === "isosceles-apex" && state.geom.cy == null) {
    state.geom.cy = 250;
  }
}

function render() {
  document.querySelectorAll(".nav-item").forEach(b => {
    const active = (b.dataset.thm && b.dataset.thm === state.thmId) ||
      (b.dataset.view && b.dataset.view === state.view && !state.thmId);
    b.classList.toggle("active", !!active);
  });
  document.querySelectorAll(".header-actions .chip-btn[data-view]").forEach(b => {
    b.classList.toggle("active", b.dataset.view === state.view && !state.thmId);
  });
  document.getElementById("btnByrne")?.classList.toggle("active", state.byrne);

  const ws = document.getElementById("workspace");
  if (state.view === "home") ws.innerHTML = renderHome();
  else if (state.view === "library-defs") ws.innerHTML = renderLibrary("definitions", "Definitions", "def");
  else if (state.view === "library-posts") ws.innerHTML = renderLibrary("postulates", "Geometrical Postulates", "post");
  else if (state.view === "library-cns") ws.innerHTML = renderLibrary("commonNotions", "General Principles (Common Notions)", "cn");
  else if (state.view === "library-thms") ws.innerHTML = renderAllTheorems();
  else if (state.view === "hooks") ws.innerHTML = renderHooks();
  else if (state.view === "theorem") ws.innerHTML = renderTheorem();
  bindWorkspace();
}

function renderHome() {
  return `
    <section class="hero-card">
      <div class="kicker">Welcome</div>
      <h2>Build geometry the way Augros builds it</h2>
      <p class="welcome-lead">
        Chapter 1 of Michael Augros’s <em>Introductory Arithmetic and Geometry</em>:
        definitions, postulates, common notions, and Theorems 1–37 through Pythagoras.
      </p>
      <div class="legend">
        <span>▶ Step through proofs</span>
        <span>🎬 Replay constructions</span>
        <span>⠿ Drag where allowed</span>
        <span>🎨 Byrne colors</span>
        <span>🔑 Hints &amp; answer keys</span>
      </div>
    </section>
    <div class="home-grid">
      <button class="home-tile" data-go="library-defs"><h3>1. Definitions</h3><p>Words of geometry with mini drawings.</p></button>
      <button class="home-tile" data-go="library-posts"><h3>2. Postulates</h3><p>What you may draw and assume.</p></button>
      <button class="home-tile" data-go="library-cns"><h3>3. Common Notions</h3><p>General principles of equality.</p></button>
      <button class="home-tile" data-go-thm="thm:1"><h3>4. Theorem 1</h3><p>Equilateral triangle — animate, drag the base, Byrne colors.</p></button>
      <button class="home-tile" data-go-thm="thm:3"><h3>Isosceles base angles</h3><p>Drag the apex along the altitude — base angles stay equal.</p></button>
      <button class="home-tile" data-go-thm="thm:36"><h3>Pythagoras</h3><p>Drag the legs; watch the squares change.</p></button>
    </div>
    <footer class="note">Based on Augros, Chapter 1. Proofs follow his reasoning; adapted for interactive steps.</footer>
  `;
}

function renderLibrary(key, title, prefix) {
  const items = DATA[key];
  return `
    <section class="hero-card">
      <div class="kicker">${prefix.toUpperCase()}</div>
      <h2>${title}</h2>
      <p class="statement">Click any card for full wording, a friendly note, and a mini picture.</p>
    </section>
    <div class="lib-grid">
      ${items.map(item => `
        <button class="lib-card" data-ref="${item.id}">
          <div class="tag">${item.num != null ? (prefix === "def" ? "Def." : prefix === "post" ? "Post." : "C.N.") + " " + item.num : "Principle"}</div>
          <h4>${escapeHtml(item.term)}</h4>
          <p>${escapeHtml(item.kid || item.text)}</p>
        </button>`).join("")}
      ${key === "commonNotions" ? DATA.extra.map(item => `
        <button class="lib-card" data-ref="${item.id}">
          <div class="tag">Principle</div>
          <h4>${escapeHtml(item.term)}</h4>
          <p>${escapeHtml(item.kid || item.text)}</p>
        </button>`).join("") : ""}
    </div>`;
}

function renderAllTheorems() {
  return `
    <section class="hero-card">
      <div class="kicker">Map</div>
      <h2>All theorems</h2>
    </section>
    <div class="lib-grid">
      ${DATA.theorems.map(t => `
        <button class="lib-card" data-go-thm="${t.id}">
          <div class="tag">${t.kind === "construction" ? "Construction" : "Theorem"} ${t.num}</div>
          <h4>${escapeHtml(t.title)}</h4>
          <p>${escapeHtml(t.statement.slice(0, 140))}${t.statement.length > 140 ? "…" : ""}</p>
        </button>`).join("")}
    </div>`;
}

function renderHooks() {
  return `
    <section class="hero-card">
      <div class="kicker">Hooks</div>
      <h2>Wonders just beyond the chapter</h2>
    </section>
    <div class="lib-grid">
      ${DATA.hooks.map(h => `
        <div class="lib-card" style="cursor:default">
          <div class="tag">Hook</div>
          <h4>${escapeHtml(h.title)}</h4>
          <p>${escapeHtml(h.text)}</p>
          <p><em>${escapeHtml(h.kid)}</em></p>
        </div>`).join("")}
    </div>`;
}

function renderTheorem() {
  const t = getThm();
  if (!t) return `<p>Not found.</p>`;
  fixGeom(t);
  const total = t.steps.length;
  const pct = total ? Math.round((state.step / total) * 100) : 0;
  const kicker = t.kind === "construction" ? "Construction" : "Theorem";
  const canDrag = !!t.interactive?.draggable;
  const canAnim = !!t.interactive?.animateConstruction || t.kind === "construction";

  const stepsHtml = t.steps.map((s, i) => {
    if (i >= state.step) return "";
    const current = i === state.step - 1;
    return `
      <article class="step-card revealed ${current ? "current" : ""}" data-step="${i}">
        <div class="step-text"><span class="step-num">${i + 1}</span>${linkifyText(s.text)}</div>
        ${s.note ? `<div class="step-note">${escapeHtml(s.note)}</div>` : ""}
        ${s.cites?.length ? `<div class="cites">${s.cites.map(c => citeChip(c)).join("")}</div>` : ""}
      </article>`;
  }).join("");

  const done = state.step >= total;

  return `
    <section class="hero-card">
      <div class="kicker ${t.kind}">${kicker} ${t.num}</div>
      <h2>${escapeHtml(t.title)}</h2>
      <p class="statement">${linkifyText(t.statement)}</p>
      ${t.aka ? `<div class="aka">Also known as: <strong>${escapeHtml(t.aka)}</strong></div>` : ""}
    </section>
    <div class="layout">
      <section class="diagram-panel panel">
        <div class="diagram-toolbar">
          <h3>Diagram ${canDrag ? '<span class="pill">⠿ draggable</span>' : ""}</h3>
          <span class="hint-text">${canDrag ? "Drag handles · " : ""}click parts to isolate</span>
        </div>
        <div class="svg-wrap" id="diagramHost">${renderDiagram(t)}</div>
        <div class="controls" style="margin-top:0.75rem">
          <button class="btn secondary" id="btnResetDiag">Clear highlight</button>
          <button class="btn secondary" id="btnShowAll">Show final figure</button>
          ${canAnim ? `<button class="btn secondary" id="btnReplay">🎬 Replay construction</button>` : ""}
          ${canDrag ? `<button class="btn secondary" id="btnResetGeom">Reset shape</button>` : ""}
        </div>
        <div class="drag-hint" id="dragHint">${dragHint(t)}</div>
      </section>
      <section class="proof-panel">
        <div class="controls">
          <button class="btn secondary" id="btnPrev" ${state.step <= 0 || state.animating ? "disabled" : ""}>← Back</button>
          <button class="btn" id="btnNext" ${state.animating ? "disabled" : ""}>${state.step === 0 ? "Begin proof" : done ? "Replay steps" : "Next step →"}</button>
          <div class="progress"><span style="width:${pct}%"></span></div>
          <span class="hint-text">${state.step}/${total}</span>
        </div>
        <div class="step-list" id="stepList">
          ${state.step === 0 ? `
            <article class="step-card current">
              <div class="step-text">Press <strong>Begin proof</strong> or <strong>🎬 Replay construction</strong>. Use ← → keys. Toggle <strong>Byrne colors</strong> in the header for Oliver Byrne–style coloring.</div>
            </article>` : stepsHtml}
          ${done ? `<article class="step-card revealed current"><div class="step-text qed">${escapeHtml(t.end || "Q.E.D.")}</div></article>` : ""}
        </div>
        ${t.remarks.length || t.questions.length ? `
        <div class="extras">
          ${t.remarks.length ? `<section class="panel"><h3>Remarks</h3><ul>${t.remarks.map(r => `<li>${linkifyText(r)}</li>`).join("")}</ul></section>` : ""}
          ${t.questions.length ? `<section class="panel"><h3>Try these</h3>
            ${t.questions.map((q, i) => {
              const key = `${t.id}:${i}`;
              const show = !!state.showAnswers[key];
              return `
              <details class="q" ${show ? "open" : ""}>
                <summary>Challenge ${i + 1}: ${escapeHtml(q.q)}</summary>
                <div class="hint"><strong>Hint:</strong> ${escapeHtml(q.hint || "Use the diagram and cited reasons.")}</div>
                <button class="btn secondary btn-answer" data-q="${i}" style="margin-top:0.5rem">${show ? "Hide answer" : "🔑 Show answer key"}</button>
                ${show && q.answer ? `<div class="answer-key"><strong>Answer:</strong> ${escapeHtml(q.answer)}</div>` : ""}
              </details>`;
            }).join("")}
          </section>` : ""}
        </div>` : ""}
        <div class="controls" style="margin-top:0.5rem">
          <button class="btn secondary" id="btnPrevThm">← Prev theorem</button>
          <button class="btn secondary" id="btnNextThm">Next theorem →</button>
        </div>
      </section>
    </div>`;
}

function dragHint(t) {
  const m = t.interactive?.dragMode;
  const hints = {
    "equilateral-base": "Drag B (or A) to change the base — the equilateral triangle rebuilds.",
    "isosceles-apex": "Drag A along the perpendicular bisector — AB stays equal to AC, so base angles stay equal.",
    "right-triangle-legs": "Drag B to change leg AB, or C to change leg AC — squares update with the right triangle.",
    "parallelogram-shear": "Drag the top edge to shear the parallelogram — opposite sides stay parallel.",
    "parallelogram-shear-base": "Shear the top — areas of parallelograms on the same base in the same parallels stay equal.",
    "triangle-vertices": "Drag any vertex of the triangle freely.",
    "triangle-same-parallels": "Drag C or G along the upper parallel — the triangles keep equal area.",
    "parallel-transversal": "Drag to change the gap or transversal.",
    "point-on-line": "Drag P along the line.",
    "point-above-line": "Drag P above the line.",
    "angle-open": "Drag to open or close the angle.",
    "segment-length": "Drag an endpoint to change the segment length.",
    "vertical-rotate": "Drag to rotate the crossing lines — vertical angles stay equal.",
  };
  return canDragText(t) ? (hints[m] || "Drag the blue handles.") : "";
}
function canDragText(t) { return !!t.interactive?.draggable; }

function citeChip(id) {
  const ref = REF_INDEX[id];
  if (!ref) return `<button class="cite" data-ref="${id}">${id}</button>`;
  let cls = "cite";
  if (id.startsWith("def:")) cls += " def";
  else if (id.startsWith("post:")) cls += " post";
  else if (id.startsWith("cn:") || id.startsWith("prin:")) cls += " cn";
  else if (id.startsWith("thm:")) cls += " thm";
  const label = id.startsWith("thm:") ? `Thm. ${ref.num}` :
    id.startsWith("def:") ? `Def. ${ref.num}` :
    id.startsWith("post:") ? `Post. ${ref.num}` :
    id.startsWith("cn:") ? `C.N. ${ref.num}` : ref.term;
  return `<button class="${cls}" data-ref="${id}" title="${escapeAttr(ref.term)}">${escapeHtml(label)}</button>`;
}

function linkifyText(text) {
  let html = escapeHtml(text);
  html = html.replace(/\b(Theorem|Thm\.?)\s*(\d+)/gi, (_, w, n) => `<span class="ref-inline" data-ref="thm:${n}">${w} ${n}</span>`);
  html = html.replace(/\b(Definition|Def\.?)\s*(\d+)/gi, (_, w, n) => `<span class="ref-inline" data-ref="def:${n}">${w} ${n}</span>`);
  html = html.replace(/\b(Postulate|Post\.?)\s*(\d+)/gi, (_, w, n) => `<span class="ref-inline" data-ref="post:${n}">${w} ${n}</span>`);
  html = html.replace(/\b(Common Notion|C\.N\.)\s*(\d+)/gi, (_, w, n) => `<span class="ref-inline" data-ref="cn:${n}">${w} ${n}</span>`);
  return html;
}

function advance(t) {
  if (state.step >= t.steps.length) {
    state.step = 0;
    state.isolate = null;
  } else {
    state.step += 1;
  }
  render();
}
function retreat(t) {
  if (state.step > 0) state.step -= 1;
}

function bindWorkspace() {
  const ws = document.getElementById("workspace");
  ws.querySelectorAll("[data-go]").forEach(el => {
    el.addEventListener("click", () => { state.view = el.dataset.go; state.thmId = null; render(); });
  });
  ws.querySelectorAll("[data-go-thm]").forEach(el => {
    el.addEventListener("click", () => openTheorem(el.dataset.goThm));
  });
  ws.querySelectorAll("[data-ref]").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); openRef(el.dataset.ref, e); });
    el.addEventListener("mouseenter", (e) => showTip(el.dataset.ref, e));
    el.addEventListener("mouseleave", hideTip);
  });

  const t = getThm();
  if (!t || state.view !== "theorem") return;

  document.getElementById("btnNext")?.addEventListener("click", () => advance(t));
  document.getElementById("btnPrev")?.addEventListener("click", () => { retreat(t); render(); });
  document.getElementById("btnResetDiag")?.addEventListener("click", () => { state.isolate = null; applyHighlights(t); });
  document.getElementById("btnShowAll")?.addEventListener("click", () => {
    state.step = t.steps.length;
    state.isolate = null;
    render();
  });
  document.getElementById("btnResetGeom")?.addEventListener("click", () => {
    state.geom = defaultGeom(t);
    fixGeom(t);
    render();
  });
  document.getElementById("btnReplay")?.addEventListener("click", () => replayConstruction(t));
  document.getElementById("btnPrevThm")?.addEventListener("click", () => {
    const i = DATA.theorems.findIndex(x => x.id === t.id);
    if (i > 0) openTheorem(DATA.theorems[i - 1].id);
  });
  document.getElementById("btnNextThm")?.addEventListener("click", () => {
    const i = DATA.theorems.findIndex(x => x.id === t.id);
    if (i < DATA.theorems.length - 1) openTheorem(DATA.theorems[i + 1].id);
  });

  ws.querySelectorAll(".btn-answer").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const i = btn.dataset.q;
      const key = `${t.id}:${i}`;
      state.showAnswers[key] = !state.showAnswers[key];
      render();
      // re-open the details
      requestAnimationFrame(() => {
        const det = document.querySelectorAll("details.q")[i];
        if (det) det.open = true;
      });
    });
  });

  ws.querySelectorAll("svg.diagram .el.clickable").forEach(el => {
    if (el.classList.contains("handle")) return;
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      state.isolate = state.isolate === id ? null : id;
      applyHighlights(t);
    });
    el.addEventListener("mouseenter", (e) => {
      const tip = document.getElementById("tooltip");
      tip.textContent = el.dataset.label || el.dataset.id;
      tip.classList.add("show");
      moveTip(e);
    });
    el.addEventListener("mousemove", moveTip);
    el.addEventListener("mouseleave", hideTip);
  });

  setupDragging(t);
  applyHighlights(t);
  if (state.byrne) applyByrneColors(t);
}

function moveTip(e) {
  const tip = document.getElementById("tooltip");
  tip.style.left = e.clientX + 12 + "px";
  tip.style.top = e.clientY + 12 + "px";
}

// ─── Construction replay ────────────────────────────────────
async function replayConstruction(t) {
  if (state.animating) return;
  state.animating = true;
  state.isolate = null;
  state.step = 0;
  render();
  // brief pause then step through with animation classes
  await sleep(200);
  for (let i = 1; i <= t.steps.length; i++) {
    state.step = i;
    render();
    // animate newly highlighted elements
    const svg = document.querySelector("svg.diagram");
    if (svg) {
      svg.querySelectorAll(".el.hl").forEach(el => {
        el.classList.add("construct-in");
        if (el.classList.contains("circ") || el.tagName === "circle" && el.classList.contains("circ")) {
          animateCircleDraw(el);
        }
        if (el.classList.contains("seg") || el.tagName === "line") {
          animateLineDraw(el);
        }
      });
    }
    await sleep(750);
  }
  state.animating = false;
  render();
}

function animateCircleDraw(el) {
  try {
    const r = parseFloat(el.getAttribute("r") || "0");
    const len = 2 * Math.PI * r;
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.style.transition = "stroke-dashoffset 0.65s ease-out";
    requestAnimationFrame(() => { el.style.strokeDashoffset = "0"; });
  } catch (_) {}
}
function animateLineDraw(el) {
  try {
    const x1 = +el.getAttribute("x1"), y1 = +el.getAttribute("y1");
    const x2 = +el.getAttribute("x2"), y2 = +el.getAttribute("y2");
    const len = Math.hypot(x2 - x1, y2 - y1);
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.style.transition = "stroke-dashoffset 0.55s ease-out";
    requestAnimationFrame(() => { el.style.strokeDashoffset = "0"; });
  } catch (_) {}
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Highlights ─────────────────────────────────────────────
function applyHighlights(t) {
  const svg = document.querySelector("svg.diagram");
  if (!svg) return;
  const els = [...svg.querySelectorAll(".el")];
  els.forEach(el => el.classList.remove("hl", "dim"));

  if (state.isolate) {
    els.forEach(el => {
      if (el.dataset.id === state.isolate || el.classList.contains("handle")) el.classList.add("hl");
      else if (!el.classList.contains("handle")) el.classList.add("dim");
    });
    return;
  }
  if (state.step <= 0) return;
  const step = t.steps[state.step - 1];
  const h = new Set(step.highlights || []);
  if (!h.size) return;
  els.forEach(el => {
    if (el.classList.contains("handle")) return;
    if (h.has(el.dataset.id)) el.classList.add("hl");
    else el.classList.add("dim");
  });
}

function applyByrneColors(t) {
  const svg = document.querySelector("svg.diagram");
  if (!svg) return;
  // Assign stable Byrne colors by element id hash
  const palette = [BYRNE.blue, BYRNE.yellow, BYRNE.red, BYRNE.black];
  const fills = [BYRNE.paleBlue, BYRNE.paleYellow, BYRNE.paleRed, BYRNE.paleTeal];
  let i = 0;
  svg.querySelectorAll(".seg, line.seg").forEach(el => {
    const c = palette[i++ % palette.length];
    el.style.stroke = c;
    el.setAttribute("stroke", c);
  });
  i = 0;
  svg.querySelectorAll(".fill-soft, polygon.fill-soft").forEach(el => {
    const c = fills[i++ % fills.length];
    el.style.fill = c;
  });
  svg.querySelectorAll(".angle").forEach((el, idx) => {
    el.style.fill = fills[idx % fills.length];
    el.style.stroke = palette[idx % palette.length];
  });
  svg.querySelectorAll(".sq, rect.sq, polygon.sq").forEach((el, idx) => {
    el.style.fill = fills[idx % fills.length];
    el.style.stroke = palette[idx % palette.length];
  });
  svg.querySelectorAll(".circ").forEach((el, idx) => {
    el.style.stroke = palette[(idx + 1) % palette.length];
  });
}

// ─── Dragging ───────────────────────────────────────────────
function setupDragging(t) {
  if (!t.interactive?.draggable) return;
  const svg = document.querySelector("svg.diagram");
  if (!svg) return;
  const handles = svg.querySelectorAll(".handle");
  handles.forEach(h => {
    h.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      h.setPointerCapture(e.pointerId);
      state._drag = { id: h.dataset.handle, el: h };
    });
    h.addEventListener("pointermove", (e) => {
      if (!state._drag || state._drag.el !== h) return;
      const pt = svgPoint(svg, e.clientX, e.clientY);
      applyDrag(t, state._drag.id, pt.x, pt.y);
      // re-render diagram only
      const host = document.getElementById("diagramHost");
      if (host) {
        host.innerHTML = renderDiagram(t);
        setupDragging(t);
        bindDiagramClicks(t);
        applyHighlights(t);
        if (state.byrne) applyByrneColors(t);
      }
    });
    h.addEventListener("pointerup", () => { state._drag = null; });
    h.addEventListener("pointercancel", () => { state._drag = null; });
  });
}

function bindDiagramClicks(t) {
  const ws = document.getElementById("diagramHost");
  if (!ws) return;
  ws.querySelectorAll("svg.diagram .el.clickable").forEach(el => {
    if (el.classList.contains("handle")) return;
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      state.isolate = state.isolate === id ? null : id;
      applyHighlights(t);
    });
  });
}

function svgPoint(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function applyDrag(t, handleId, x, y) {
  const g = state.geom;
  const mode = t.interactive.dragMode;
  x = clamp(x, 30, 410);
  y = clamp(y, 30, 320);

  switch (mode) {
    case "equilateral-base":
      if (handleId === "A") { g.ax = x; g.ay = y; }
      if (handleId === "B") { g.bx = x; g.by = y; }
      break;
    case "isosceles-apex": {
      if (handleId === "B") {
        g.bx = x; g.by = 250; g.cy = 250;
        g.cx = Math.max(g.bx + 60, g.cx);
        reprojectApex(g);
      } else if (handleId === "C") {
        g.cx = x; g.cy = 250; g.by = 250;
        g.bx = Math.min(g.cx - 60, g.bx);
        reprojectApex(g);
      } else {
        // keep A on perpendicular bisector of BC
        const mx = (g.bx + g.cx) / 2, my = (g.by + g.cy) / 2;
        const dx = g.cx - g.bx, dy = g.cy - g.by;
        let px = -dy, py = dx;
        const len = Math.hypot(px, py) || 1;
        px /= len; py /= len;
        // prefer apex above the base
        if (py > 0) { px = -px; py = -py; }
        const vx = x - mx, vy = y - my;
        let dist = vx * px + vy * py;
        dist = clamp(dist, 40, 200);
        g.ax = mx + px * dist;
        g.ay = my + py * dist;
      }
      break;
    }
    case "right-triangle-legs":
      if (handleId === "B") { g.legAB = clamp(300 - y, 40, 160); } // B is below A
      if (handleId === "C") { g.legAC = clamp(x - 200, 40, 180); }
      break;
    case "parallelogram-shear":
    case "parallelogram-shear-base":
      if (handleId === "shear") { g.shear = clamp(x - 200, -120, 120); g.h = clamp(250 - y, 60, 160); }
      break;
    case "triangle-vertices":
      if (handleId === "A") { g.ax = x; g.ay = y; }
      if (handleId === "B") { g.bx = x; g.by = y; }
      if (handleId === "C") { g.cx = x; g.cy = y; }
      break;
    case "triangle-same-parallels":
      if (handleId === "C") g.cx = x;
      if (handleId === "G") g.gx = x;
      break;
    case "point-on-line":
      g.px = x;
      break;
    case "point-above-line":
      g.px = x; g.py = clamp(y, 40, 200);
      break;
    case "angle-open":
      g.open = clamp(Math.hypot(x - 220, 260 - y) / 2, 25, 90);
      break;
    case "segment-length":
      g.half = clamp(Math.abs(x - 220), 40, 180);
      break;
    case "vertical-rotate":
      g.a = Math.atan2(y - 170, x - 220) * 180 / Math.PI;
      break;
    case "parallel-transversal":
      if (handleId === "gap") g.gap = clamp(y - 100, 60, 160);
      if (handleId === "tilt") g.tilt = Math.atan2(y - 170, x - 220) * 180 / Math.PI;
      break;
    default:
      break;
  }
}

function reprojectApex(g) {
  const mx = (g.bx + g.cx) / 2, my = (g.by + g.cy) / 2;
  const h = Math.hypot(g.ax - mx, g.ay - my) || 140;
  g.ax = mx;
  g.ay = my - Math.abs(h);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ─── Popover ────────────────────────────────────────────────
function openRef(id, evt) {
  const ref = REF_INDEX[id];
  const pop = document.getElementById("popover");
  const backdrop = document.getElementById("backdrop");
  if (!ref) {
    pop.innerHTML = `<header><h3>${escapeHtml(id)}</h3><button class="close" id="popClose">×</button></header><p>Not found.</p>`;
  } else {
    const mini = miniDrawing(ref.mini || guessMini(id));
    pop.innerHTML = `
      <header>
        <div>
          <div class="tag">${escapeHtml(ref.kind)}${ref.num != null ? " " + ref.num : ""}</div>
          <h3>${escapeHtml(ref.term)}</h3>
        </div>
        <button class="close" id="popClose">×</button>
      </header>
      <p class="official">${escapeHtml(ref.text)}</p>
      ${ref.kid ? `<div class="kid">💡 ${escapeHtml(ref.kid)}</div>` : ""}
      <div class="mini-draw">${mini}</div>
      ${id.startsWith("thm:") ? `<button class="btn goto" id="popGo">Open Theorem ${ref.num}</button>` : ""}
    `;
  }
  pop.classList.add("show");
  backdrop.classList.add("show");
  const x = Math.min(window.innerWidth - 440, Math.max(12, (evt?.clientX || 80) - 40));
  const y = Math.min(window.innerHeight - 200, Math.max(12, (evt?.clientY || 80) + 16));
  pop.style.left = x + "px";
  pop.style.top = y + "px";
  document.getElementById("popClose")?.addEventListener("click", closePopover);
  document.getElementById("popGo")?.addEventListener("click", () => { closePopover(); openTheorem(id); });
  hideTip();
}
function closePopover() {
  document.getElementById("popover").classList.remove("show");
  document.getElementById("backdrop").classList.remove("show");
}
function showTip(id, e) {
  const ref = REF_INDEX[id];
  if (!ref) return;
  const tip = document.getElementById("tooltip");
  tip.innerHTML = `<strong>${escapeHtml(ref.kind)}${ref.num != null ? " " + ref.num : ""}</strong><br>${escapeHtml(ref.term)}`;
  tip.classList.add("show");
  moveTip(e);
}
function hideTip() { document.getElementById("tooltip").classList.remove("show"); }
function guessMini(id) {
  if (id.startsWith("def:")) return DATA.definitions.find(d => d.id === id)?.mini;
  if (id.startsWith("post:")) return DATA.postulates.find(d => d.id === id)?.mini;
  if (id.startsWith("cn:")) return DATA.commonNotions.find(d => d.id === id)?.mini;
  return "point";
}

// ─── Mini drawings (unchanged compact set) ──────────────────
function miniDrawing(kind) {
  const drawings = {
    solid: `<polygon points="40,70 70,85 120,70 120,35 90,20 40,35" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>`,
    surface: `<polygon points="30,70 80,85 130,60 80,45" fill="#ccfbf1" stroke="#0f766e" stroke-width="2"/>`,
    line: `<line x1="25" y1="50" x2="135" y2="50" stroke="#0f172a" stroke-width="3"/><circle cx="25" cy="50" r="3" fill="#ef4444"/><circle cx="135" cy="50" r="3" fill="#ef4444"/>`,
    point: `<circle cx="80" cy="50" r="5" fill="#ef4444"/>`,
    straight: `<line x1="20" y1="70" x2="140" y2="30" stroke="#0f172a" stroke-width="3"/>`,
    plane: `<polygon points="25,65 70,80 140,50 95,35" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>`,
    angle: `<path d="M80,75 L80,25 M80,75 L130,75" stroke="#0f172a" stroke-width="3" fill="none"/><path d="M80,55 A20,20 0 0,1 100,75" fill="rgba(59,130,246,0.25)" stroke="#2563eb"/>`,
    "rect-angle": `<path d="M50,75 L50,30 M50,75 L120,75" stroke="#0f172a" stroke-width="3" fill="none"/>`,
    right: `<path d="M50,75 L50,30 M50,75 L120,75" stroke="#0f172a" stroke-width="3" fill="none"/><path d="M50,75 L50,60 L65,60 L65,75 Z" fill="none" stroke="#2563eb" stroke-width="2"/>`,
    perp: `<line x1="30" y1="75" x2="130" y2="75" stroke="#0f172a" stroke-width="3"/><line x1="80" y1="75" x2="80" y2="25" stroke="#0f172a" stroke-width="3"/><rect x="80" y="65" width="10" height="10" fill="none" stroke="#2563eb"/>`,
    circle: `<circle cx="80" cy="50" r="32" fill="rgba(59,130,246,0.12)" stroke="#2563eb" stroke-width="2.5"/><circle cx="80" cy="50" r="3" fill="#ef4444"/>`,
    radius: `<circle cx="80" cy="50" r="32" fill="none" stroke="#94a3b8" stroke-width="2"/><line x1="80" y1="50" x2="112" y2="50" stroke="#2563eb" stroke-width="3"/><circle cx="80" cy="50" r="3" fill="#0f172a"/>`,
    triangle: `<polygon points="80,22 125,78 35,78" fill="rgba(20,184,166,0.15)" stroke="#0f766e" stroke-width="2.5"/>`,
    "tri-types": `<polygon points="35,75 55,30 75,75" fill="rgba(59,130,246,0.15)" stroke="#2563eb"/>`,
    "right-tri": `<polygon points="40,75 40,30 120,75" fill="rgba(168,85,247,0.12)" stroke="#7c3aed" stroke-width="2"/><rect x="40" y="65" width="10" height="10" fill="none" stroke="#2563eb"/>`,
    parallel: `<line x1="30" y1="35" x2="130" y2="35" stroke="#2563eb" stroke-width="3"/><line x1="30" y1="70" x2="130" y2="70" stroke="#0f766e" stroke-width="3"/>`,
    quads: `<rect x="25" y="30" width="40" height="40" fill="none" stroke="#2563eb" stroke-width="2"/>`,
    post1: `<circle cx="40" cy="60" r="3"/><circle cx="120" cy="35" r="3"/><line x1="40" y1="60" x2="120" y2="35" stroke="#2563eb" stroke-width="2.5"/>`,
    post3: `<circle cx="80" cy="50" r="30" fill="none" stroke="#2563eb" stroke-width="2.5"/><circle cx="80" cy="50" r="3" fill="#ef4444"/>`,
    post5: `<line x1="30" y1="20" x2="55" y2="90" stroke-width="2"/><line x1="120" y1="20" x2="75" y2="90" stroke-width="2"/>`,
    cn1: `<text x="20" y="55" font-size="14" font-family="sans-serif">A=C, B=C ⇒ A=B</text>`,
    cn5: `<circle cx="80" cy="50" r="30" fill="rgba(244,63,94,0.12)" stroke="#e11d48"/><circle cx="80" cy="50" r="14" fill="rgba(244,63,94,0.25)"/>`,
    "two-lines": `<line x1="30" y1="25" x2="130" y2="75"/><line x1="30" y1="75" x2="130" y2="25"/><circle cx="80" cy="50" r="4" fill="#ef4444"/>`,
  };
  return `<svg viewBox="0 0 160 100" width="100%" height="120">${drawings[kind] || drawings.point}</svg>`;
}

// ─── SVG helpers ────────────────────────────────────────────
function el(tag, attrs, kids = "") {
  const a = Object.entries(attrs).filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`).join(" ");
  return `<${tag} ${a}>${kids}</${tag}>`;
}
function point(id, x, y, label, ox = 8, oy = -8) {
  return el("circle", { class: "el clickable point", "data-id": id, "data-label": label || id, cx: x, cy: y, r: 4 }) +
    el("text", { class: "el label", "data-id": id + "-lab", x: x + ox, y: y + oy }, label || id);
}
function handle(id, x, y) {
  return el("circle", {
    class: "el handle",
    "data-handle": id,
    "data-id": "handle-" + id,
    "data-label": "Drag " + id,
    cx: x, cy: y, r: 9,
  });
}
function seg(id, x1, y1, x2, y2, label) {
  return el("line", { class: "el clickable seg", "data-id": id, "data-label": label || id, x1, y1, x2, y2 });
}
function circ(id, cx, cy, r, label) {
  return el("circle", { class: "el clickable circ", "data-id": id, "data-label": label || id, cx, cy, r });
}
function poly(id, pts, cls = "el clickable fill-soft") {
  return el("polygon", { class: cls, "data-id": id, "data-label": id, points: pts });
}
function angleArc(id, vx, vy, x1, y1, x2, y2, r = 22) {
  const a1 = Math.atan2(y1 - vy, x1 - vx);
  const a2 = Math.atan2(y2 - vy, x2 - vx);
  let dA = a2 - a1;
  while (dA <= -Math.PI) dA += 2 * Math.PI;
  while (dA > Math.PI) dA -= 2 * Math.PI;
  const large = Math.abs(dA) > Math.PI ? 1 : 0;
  const sweep = dA > 0 ? 1 : 0;
  const sx = vx + r * Math.cos(a1), sy = vy + r * Math.sin(a1);
  const ex = vx + r * Math.cos(a2), ey = vy + r * Math.sin(a2);
  const d = `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey} L ${vx} ${vy} Z`;
  return el("path", { class: "el clickable angle", "data-id": id, "data-label": id, d });
}
function rightMark(x, y, dx1, dy1, dx2, dy2, s = 12) {
  // square corner mark at (x,y) along unit dirs
  const l1 = Math.hypot(dx1, dy1) || 1, l2 = Math.hypot(dx2, dy2) || 1;
  const ux1 = dx1 / l1 * s, uy1 = dy1 / l1 * s;
  const ux2 = dx2 / l2 * s, uy2 = dy2 / l2 * s;
  const pts = `${x + ux1},${y + uy1} ${x + ux1 + ux2},${y + uy1 + uy2} ${x + ux2},${y + uy2}`;
  return el("polyline", { class: "el right-mark", points: pts, fill: "none", stroke: "#2563eb", "stroke-width": 1.8, "data-id": "right-mark" });
}

function renderDiagram(t) {
  const type = t.diagram?.type || "generic";
  const fn = DIAGRAMS[type] || DIAGRAMS.generic;
  const inner = fn(t);
  return `<svg class="diagram" viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ─── High-fidelity diagrams ─────────────────────────────────
const DIAGRAMS = {
  equilateral(t) {
    const g = state.geom || { ax: 120, ay: 250, bx: 320, by: 250 };
    const A = [g.ax, g.ay], B = [g.bx, g.by];
    const side = Math.hypot(B[0] - A[0], B[1] - A[1]) || 200;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const h = Math.sqrt(3) / 2 * side;
    const nx = -dy / side, ny = dx / side;
    const C = [mx + nx * h, my + ny * h];
    const D = [mx - nx * h, my - ny * h];
    return [
      circ("circleA", A[0], A[1], side, "circle about A"),
      circ("circleB", B[0], B[1], side, "circle about B"),
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      seg("AB", ...A, ...B, "AB"),
      seg("AC", ...A, ...C, "AC"),
      seg("BC", ...B, ...C, "BC"),
      point("A", ...A, "A", -16, 6),
      point("B", ...B, "B", 8, 6),
      point("C", ...C, "C", 4, -10),
      point("D", ...D, "D", 4, 16),
      handle("A", A[0], A[1]),
      handle("B", B[0], B[1]),
    ].join("");
  },

  isosceles(t) {
    const g = state.geom || { ax: 220, ay: 70, bx: 110, by: 250, cx: 330, cy: 250 };
    const A = [g.ax, g.ay], B = [g.bx, g.by], C = [g.cx, g.cy ?? 250];
    // D, E below base for "angles under base"
    const D = [B[0] - 30, B[1] + 70], E = [C[0] + 30, C[1] + 70];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triADC", `${A[0]},${A[1]} ${D[0]},${D[1]} ${C[0]},${C[1]}`),
      poly("triAEB", `${A[0]},${A[1]} ${E[0]},${E[1]} ${B[0]},${B[1]}`),
      poly("triBDC", `${B[0]},${B[1]} ${D[0]},${D[1]} ${C[0]},${C[1]}`),
      poly("triCEB", `${C[0]},${C[1]} ${E[0]},${E[1]} ${B[0]},${B[1]}`),
      circ("circleC", C[0], C[1], Math.hypot(D[0] - C[0], D[1] - C[1]) * 0.9, "cut-off circle"),
      seg("AB", ...A, ...B, "AB"), seg("AC", ...A, ...C, "AC"), seg("BC", ...B, ...C, "BC"),
      seg("AD", ...A, ...D, "AD"), seg("AE", ...A, ...E, "AE"),
      seg("BD", ...B, ...D, "BD"), seg("CE", ...C, ...E, "CE"),
      seg("BE", ...B, ...E, "BE"), seg("CD", ...C, ...D, "CD"),
      angleArc("angA", ...A, ...B, ...C, 20),
      angleArc("angB", ...B, ...A, ...C, 22),
      angleArc("angC", ...C, ...A, ...B, 22),
      angleArc("angDBC", ...B, ...D, ...C, 16),
      angleArc("angECB", ...C, ...E, ...B, 16),
      point("A", ...A, "A", -4, -12), point("B", ...B, "B", -16, 6), point("C", ...C, "C", 8, 6),
      point("D", ...D, "D", -16, 6), point("E", ...E, "E", 8, 6),
      handle("A", A[0], A[1]), handle("B", B[0], B[1]), handle("C", C[0], C[1]),
    ].join("");
  },

  "isosceles-converse"() { return DIAGRAMS.isosceles(); },

  sas() {
    const A = [70, 250], B = [200, 250], C = [120, 120];
    const D = [250, 250], E = [380, 250], F = [330, 130];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triDEF", `${D[0]},${D[1]} ${E[0]},${E[1]} ${F[0]},${F[1]}`),
      seg("AB", ...A, ...B, "AB"), seg("BC", ...B, ...C, "BC"), seg("AC", ...A, ...C, "AC"),
      seg("DE", ...D, ...E, "DE"), seg("EF", ...E, ...F, "EF"), seg("DF", ...D, ...F, "DF"),
      angleArc("angB", ...B, ...A, ...C), angleArc("angE", ...E, ...D, ...F),
      angleArc("angA", ...A, ...B, ...C, 18), angleArc("angD", ...D, ...E, ...F, 18),
      angleArc("angC", ...C, ...A, ...B, 18), angleArc("angF", ...F, ...D, ...E, 18),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C", 8, -8),
      point("D", ...D, "D"), point("E", ...E, "E"), point("F", ...F, "F", 8, -8),
    ].join("");
  },

  rigid() {
    // Wide base and well-separated apexes M, N so ∠1–∠4 at the top are
    // clearly distinct (Augros: MN joins two equal-sided triangles on AB).
    // Layout: from M, ray order is MA → MB → MN, so ∠AMN = ∠1 + ∠2;
    // from N, ray order is NB → NA → NM, so ∠BNM = ∠3 + ∠4.
    const A = [50, 300], B = [280, 300];
    const M = [100, 40], N = [360, 70];
    // Flexible square (motivation) tucked lower-right, clear of the main figure
    const sq = "310,200 410,200 400,290 300,290";
    // Angle labels placed out from M and N along angle bisectors (approx)
    const labelAng = (id, x, y, text) =>
      el("text", { class: "el label", "data-id": id + "-lab", x, y, fill: "#1d4ed8", "font-size": "14" }, text);
    return [
      poly("square", sq),
      el("text", { x: 318, y: 250, class: "label", fill: "#64748b" }, "flexible"),
      // Filled triangles — longer sides, open apex region
      poly("triRigid", `${A[0]},${A[1]} ${B[0]},${B[1]} ${M[0]},${M[1]}`),
      poly("triABM", `${A[0]},${A[1]} ${B[0]},${B[1]} ${M[0]},${M[1]}`),
      poly("triABN", `${A[0]},${A[1]} ${B[0]},${B[1]} ${N[0]},${N[1]}`),
      // Sides first (under arcs), then MN across the top
      seg("AM", ...A, ...M, "AM"),
      seg("BM", ...B, ...M, "BM"),
      seg("AN", ...A, ...N, "AN"),
      seg("BN", ...B, ...N, "BN"),
      seg("AB", ...A, ...B, "AB"),
      seg("MN", ...M, ...N, "MN"),
      // At M: ∠1 = ∠AMB (between MA and MB), ∠2 = ∠BMN (between MB and MN)
      angleArc("ang1", ...M, ...A, ...B, 36),
      angleArc("ang2", ...M, ...B, ...N, 32),
      // At N: ∠3 = ∠ANM (between NA and NM), ∠4 = ∠BNA (between NB and NA)
      angleArc("ang3", ...N, ...A, ...M, 34),
      angleArc("ang4", ...N, ...B, ...A, 30),
      labelAng("ang1", 118, 95, "1"),
      labelAng("ang2", 175, 58, "2"),
      labelAng("ang3", 300, 55, "3"),
      labelAng("ang4", 310, 120, "4"),
      point("A", ...A, "A", -16, 14),
      point("B", ...B, "B", 8, 14),
      point("M", ...M, "M", -18, 4),
      point("N", ...N, "N", 10, 2),
    ].join("");
  },

  sss() {
    const C = [100, 250], D = [340, 250], A = [180, 90], B = [260, 110];
    return [
      poly("triA", `${A[0]},${A[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      poly("triB", `${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      seg("CA", ...C, ...A), seg("DA", ...D, ...A),
      seg("CB", ...C, ...B), seg("DB", ...D, ...B), seg("CD", ...C, ...D),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D"),
    ].join("");
  },

  "angle-bisector"(t) {
    const g = state.geom || { open: 55 };
    const B = [220, 270];
    const ang = g.open * Math.PI / 180;
    const A = [B[0] - 160 * Math.cos(ang), B[1] - 160 * Math.sin(ang)];
    const C = [B[0] + 160 * Math.cos(ang * 0.7), B[1] - 160 * Math.sin(ang * 0.7)];
    const r = 90;
    const D = [B[0] + r * (A[0] - B[0]) / Math.hypot(A[0] - B[0], A[1] - B[1]),
               B[1] + r * (A[1] - B[1]) / Math.hypot(A[0] - B[0], A[1] - B[1])];
    const E = [B[0] + r * (C[0] - B[0]) / Math.hypot(C[0] - B[0], C[1] - B[1]),
               B[1] + r * (C[1] - B[1]) / Math.hypot(C[0] - B[0], C[1] - B[1])];
    const mx = (D[0] + E[0]) / 2, my = (D[1] + E[1]) / 2;
    const side = Math.hypot(E[0] - D[0], E[1] - D[1]);
    const hx = -(E[1] - D[1]) / (side || 1), hy = (E[0] - D[0]) / (side || 1);
    const F = [mx + hx * side * Math.sqrt(3) / 2, my + hy * side * Math.sqrt(3) / 2];
    return [
      poly("triDEF", `${D[0]},${D[1]} ${E[0]},${E[1]} ${F[0]},${F[1]}`),
      poly("triFBD", `${F[0]},${F[1]} ${B[0]},${B[1]} ${D[0]},${D[1]}`),
      poly("triFBE", `${F[0]},${F[1]} ${B[0]},${B[1]} ${E[0]},${E[1]}`),
      circ("circleB", B[0], B[1], r),
      seg("BA", ...B, ...A), seg("BC", ...B, ...C),
      seg("BD", ...B, ...D), seg("BE", ...B, ...E),
      seg("DE", ...D, ...E), seg("DF", ...D, ...F), seg("EF", ...E, ...F),
      seg("BF", ...B, ...F, "bisector"),
      angleArc("angFBD", ...B, ...F, ...D, 28),
      angleArc("angFBE", ...B, ...F, ...E, 34),
      point("A", ...A, "A"), point("B", ...B, "B", -4, 16), point("C", ...C, "C"),
      point("D", ...D, "D"), point("E", ...E, "E"), point("F", ...F, "F"),
      handle("open", A[0], A[1]),
    ].join("");
  },

  "segment-bisector"(t) {
    const g = state.geom || { half: 140 };
    const A = [220 - g.half, 250], B = [220 + g.half, 250];
    const side = B[0] - A[0];
    const C = [220, 250 - side * Math.sqrt(3) / 2];
    const D = [220, 250];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triACD", `${A[0]},${A[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      poly("triBCD", `${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      seg("AB", ...A, ...B), seg("AC", ...A, ...C), seg("CB", ...C, ...B),
      seg("CD", ...C, ...D, "bisector"), seg("AD", ...A, ...D), seg("DB", ...D, ...B),
      angleArc("angACB", ...C, ...A, ...B, 24),
      angleArc("angACD", ...C, ...A, ...D, 18),
      angleArc("angBCD", ...C, ...B, ...D, 18),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D", 8, 16),
      handle("end", B[0], B[1]),
    ].join("");
  },

  "perp-on"(t) {
    const g = state.geom || { px: 220 };
    const A = [50, 250], B = [390, 250], P = [g.px, 250];
    const r = 70;
    const C = [P[0] - r, 250], D = [P[0] + r, 250];
    const R = [P[0], 250 - r * Math.sqrt(3)];
    return [
      poly("triCDR", `${C[0]},${C[1]} ${D[0]},${D[1]} ${R[0]},${R[1]}`),
      poly("triRPC", `${R[0]},${R[1]} ${P[0]},${P[1]} ${C[0]},${C[1]}`),
      poly("triRPD", `${R[0]},${R[1]} ${P[0]},${P[1]} ${D[0]},${D[1]}`),
      circ("circleP", P[0], P[1], r),
      seg("AB", ...A, ...B), seg("PR", ...P, ...R, "perpendicular"),
      seg("PC", ...P, ...C), seg("PD", ...P, ...D),
      seg("CR", ...C, ...R), seg("DR", ...D, ...R), seg("CD", ...C, ...D),
      angleArc("angRPC", ...P, ...R, ...C, 22),
      angleArc("angRPD", ...P, ...R, ...D, 22),
      rightMark(P[0], P[1], 0, -1, 1, 0),
      point("A", ...A, "A"), point("B", ...B, "B"), point("P", ...P, "P", -4, 16),
      point("C", ...C, "C", -14, 6), point("D", ...D, "D", 8, 6), point("R", ...R, "R"),
      handle("P", P[0], P[1]),
    ].join("");
  },

  "perp-drop"(t) {
    const g = state.geom || { px: 220, py: 80 };
    const A = [40, 240], B = [400, 240], P = [g.px, g.py];
    const H = [P[0], 240];
    const r = Math.hypot(P[0] - (P[0] - 80), P[1] - 300) * 0.5 + 100;
    const half = Math.sqrt(Math.max(10, r * r - (240 - P[1]) ** 2));
    const G = [P[0] - half, 240], E = [P[0] + half, 240];
    const Dpt = [P[0], 240 + 60];
    return [
      poly("triPHG", `${P[0]},${P[1]} ${H[0]},${H[1]} ${G[0]},${G[1]}`),
      poly("triPHE", `${P[0]},${P[1]} ${H[0]},${H[1]} ${E[0]},${E[1]}`),
      circ("circleP", P[0], P[1], Math.hypot(G[0] - P[0], G[1] - P[1])),
      seg("AB", ...A, ...B), seg("PH", ...P, ...H, "perpendicular"),
      seg("PG", ...P, ...G), seg("PE", ...P, ...E),
      seg("GP", ...G, ...P), seg("EP", ...E, ...P),
      seg("GE", ...G, ...E), seg("HG", ...H, ...G), seg("HE", ...H, ...E),
      angleArc("angPHG", ...H, ...P, ...G, 20),
      angleArc("angPHE", ...H, ...P, ...E, 20),
      rightMark(H[0], H[1], 0, -1, 1, 0),
      point("A", ...A, "A"), point("B", ...B, "B"), point("P", ...P, "P"),
      point("G", ...G, "G", -14, 6), point("E", ...E, "E", 8, 6),
      point("H", ...H, "H", -4, 16), point("D", ...Dpt, "D"),
      handle("P", P[0], P[1]),
    ].join("");
  },

  "adjacent-straight"() {
    const C = [60, 220], D = [380, 220], B = [220, 220], A = [160, 80], P = [220, 80];
    return [
      seg("CD", ...C, ...D), seg("AB", ...A, ...B), seg("BP", ...B, ...P),
      angleArc("angABC", ...B, ...A, ...C, 28),
      angleArc("angABD", ...B, ...A, ...D, 36),
      angleArc("angPBC", ...B, ...P, ...C, 22),
      angleArc("angPBD", ...B, ...P, ...D, 22),
      angleArc("ang1", ...B, ...A, ...P, 16),
      angleArc("ang2", ...B, ...P, ...D, 18),
      angleArc("ang3", ...B, ...D, ...A, 14),
      point("A", ...A, "A"), point("B", ...B, "B", -4, 16), point("C", ...C, "C"),
      point("D", ...D, "D"), point("P", ...P, "P", 8, -8),
    ].join("");
  },
  "straight-converse"() {
    const A = [60, 200], P = [180, 200], B = [180, 80], C = [320, 200], X = [400, 200];
    return [
      seg("AP", ...A, ...P), seg("PB", ...P, ...B), seg("PC", ...P, ...C), seg("AX", ...A, ...X),
      angleArc("angAPB", ...P, ...A, ...B, 26),
      angleArc("angBPC", ...P, ...B, ...C, 26),
      angleArc("ang1", ...P, ...A, ...B, 18),
      angleArc("ang2", ...P, ...B, ...X, 18),
      angleArc("ang3", ...P, ...X, ...C, 14),
      point("A", ...A, "A"), point("P", ...P, "P", -4, 16), point("B", ...B, "B"),
      point("C", ...C, "C"), point("X", ...X, "X"),
    ].join("");
  },
  vertical(t) {
    const g = state.geom || { a: 35 };
    const ang = g.a * Math.PI / 180;
    const P = [220, 170];
    const L = 150;
    const A = [P[0] - L * Math.cos(ang), P[1] - L * Math.sin(ang)];
    const B = [P[0] + L * Math.cos(ang), P[1] + L * Math.sin(ang)];
    const ang2 = ang + Math.PI / 3;
    const C = [P[0] - L * Math.cos(ang2), P[1] - L * Math.sin(ang2)];
    const D = [P[0] + L * Math.cos(ang2), P[1] + L * Math.sin(ang2)];
    return [
      seg("AB", ...A, ...B), seg("CD", ...C, ...D),
      angleArc("ang1", ...P, ...A, ...C, 28),
      angleArc("ang2", ...P, ...C, ...B, 28),
      angleArc("ang3", ...P, ...B, ...D, 28),
      angleArc("ang4", ...P, ...D, ...A, 28),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"),
      point("D", ...D, "D"), point("P", ...P, "P", 8, -10),
      handle("rot", B[0], B[1]),
    ].join("");
  },
  exterior() {
    const A = [200, 70], B = [80, 240], C = [280, 240], D = [380, 240], E = [240, 155], F = [300, 70];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triAEB", `${A[0]},${A[1]} ${E[0]},${E[1]} ${B[0]},${B[1]}`),
      poly("triCEF", `${C[0]},${C[1]} ${E[0]},${E[1]} ${F[0]},${F[1]}`),
      seg("AB", ...A, ...B), seg("AC", ...A, ...C), seg("BC", ...B, ...C),
      seg("CD", ...C, ...D), seg("BE", ...B, ...E), seg("EF", ...E, ...F), seg("CF", ...C, ...F),
      angleArc("extAng", ...C, ...A, ...D, 30),
      angleArc("angA", ...A, ...B, ...C, 20),
      angleArc("angB", ...B, ...A, ...C, 20),
      angleArc("angAEB", ...E, ...A, ...B, 14),
      angleArc("angCEF", ...E, ...C, ...F, 14),
      angleArc("angECF", ...C, ...E, ...F, 14),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C", -4, 16),
      point("D", ...D, "D"), point("E", ...E, "E", 8, -8), point("F", ...F, "F"),
    ].join("");
  },
  "side-angle"() {
    const A = [220, 60], B = [100, 250], C = [360, 250], D = [280, 120];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      seg("AB", ...A, ...B), seg("AC", ...A, ...C), seg("BC", ...B, ...C),
      seg("AD", ...A, ...D), seg("BD", ...B, ...D),
      angleArc("angB", ...B, ...A, ...C, 24),
      angleArc("angC", ...C, ...A, ...B, 24),
      angleArc("angABD", ...B, ...A, ...D, 16),
      angleArc("angADB", ...D, ...A, ...B, 16),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D", 8, -8),
    ].join("");
  },
  "angle-side"() { return DIAGRAMS["side-angle"](); },
  "triangle-inequality"(t) {
    const g = state.geom || { ax: 160, ay: 160, bx: 80, by: 250, cx: 300, cy: 250 };
    // use triangle-vertices geom if present
    const A = [g.ax ?? 160, g.ay ?? 160], B = [g.bx ?? 80, g.by ?? 250], C = [g.cx ?? 300, g.cy ?? 250];
    const D = [A[0] + (A[0] - B[0]) * 0.4, A[1] + (A[1] - B[1]) * 0.4];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      seg("BA", ...B, ...A), seg("AC", ...A, ...C), seg("BC", ...B, ...C),
      seg("AD", ...A, ...D), seg("CD", ...C, ...D), seg("BD", ...B, ...D),
      angleArc("angBCD", ...C, ...B, ...D, 22),
      angleArc("angADC", ...D, ...A, ...C, 18),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D"),
      handle("A", A[0], A[1]), handle("B", B[0], B[1]), handle("C", C[0], C[1]),
    ].join("");
  },
  "shortest-perp"() {
    const A = [40, 240], B = [400, 240], P = [200, 70], L = [200, 240], R = [320, 240];
    return [
      poly("triPLR", `${P[0]},${P[1]} ${L[0]},${L[1]} ${R[0]},${R[1]}`),
      seg("AB", ...A, ...B), seg("PL", ...P, ...L, "shortest"), seg("PR", ...P, ...R),
      angleArc("angPLR", ...L, ...P, ...R, 20),
      rightMark(L[0], L[1], 0, -1, 1, 0),
      point("A", ...A, "A"), point("B", ...B, "B"), point("P", ...P, "P"),
      point("L", ...L, "L", -4, 16), point("R", ...R, "R", 8, 16),
    ].join("");
  },
  "sss-construct"() {
    const A = [140, 240], B = [300, 240], C = [200, 110], D = [60, 240], F = [380, 240];
    return [
      circ("circleA", A[0], A[1], Math.hypot(C[0] - A[0], C[1] - A[1])),
      circ("circleB", B[0], B[1], Math.hypot(C[0] - B[0], C[1] - B[1])),
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      seg("AB", ...A, ...B, "AB=Y"), seg("AC", ...A, ...C, "AC=X"), seg("CB", ...C, ...B, "CB=Z"),
      seg("DA", ...D, ...A, "X"), seg("BF", ...B, ...F, "Z"),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"),
      point("D", ...D, "D"), point("F", ...F, "F"),
    ].join("");
  },
  "copy-angle"() {
    const Xa = [80, 200], Xv = [80, 80], Xb = [180, 140];
    const P = [260, 220], R = [400, 220], Z = [300, 100], T = [360, 220];
    return [
      poly("triXAB", `${Xv[0]},${Xv[1]} ${Xa[0]},${Xa[1]} ${Xb[0]},${Xb[1]}`),
      poly("triPZT", `${P[0]},${P[1]} ${Z[0]},${Z[1]} ${T[0]},${T[1]}`),
      seg("PR", ...P, ...R),
      angleArc("angX", ...Xv, ...Xa, ...Xb, 28),
      angleArc("angZPT", ...P, ...Z, ...T, 28),
      point("A", ...Xa, "A"), point("X", ...Xv, "X"), point("B", ...Xb, "B"),
      point("P", ...P, "P"), point("R", ...R, "R"), point("Z", ...Z, "Z"), point("T", ...T, "T", -4, 16),
    ].join("");
  },
  asa() { return DIAGRAMS.sas(); },
  aas() { return DIAGRAMS.sas(); },
  "alt-parallel"(t) {
    const g = state.geom || { gap: 120, tilt: 25 };
    const y1 = 100, y2 = 100 + g.gap;
    const ang = (g.tilt || 25) * Math.PI / 180;
    const E = [100, 40], F = [100 + 280 * Math.cos(ang), 40 + 280 * Math.sin(ang)];
    // intersection helpers approx
    const X1 = [180, y1], X2 = [180 + g.gap * Math.tan(ang), y2];
    return [
      seg("AB", 50, y1, 400, y1, "AB"),
      seg("CD", 50, y2, 400, y2, "CD"),
      seg("EF", ...E, ...F, "transversal"),
      seg("trans", ...E, ...F),
      angleArc("ang1", ...X1, E[0], E[1], 50, y1, 24),
      angleArc("ang2", ...X2, 50, y2, F[0], F[1], 24),
      angleArc("ang3", ...X2, 400, y2, E[0], E[1], 20),
      point("A", 50, y1, "A"), point("B", 400, y1, "B"),
      point("C", 50, y2, "C"), point("D", 400, y2, "D"),
      handle("gap", 40, y2), handle("tilt", F[0], F[1]),
    ].join("");
  },
  "cointerior-parallel"() { return DIAGRAMS["alt-parallel"](); },
  "parallel-angles"() { return DIAGRAMS["alt-parallel"](); },
  "parallel-trans"() {
    const y = [90, 170, 250];
    return [
      seg("lineA", 50, y[0], 390, y[0], "A"),
      seg("lineB", 50, y[1], 390, y[1], "B"),
      seg("lineC", 50, y[2], 390, y[2], "C"),
      seg("transD", 120, 40, 300, 300, "D"),
      angleArc("ang1", 150, y[0], 50, y[0], 120, 40, 18),
      angleArc("ang2", 180, y[1], 50, y[1], 120, 40, 18),
      angleArc("ang3", 180, y[1], 300, 300, 390, y[1], 18),
      angleArc("ang4", 210, y[2], 300, 300, 390, y[2], 18),
      point("A", 40, y[0], "A"), point("B", 40, y[1], "B"), point("C", 40, y[2], "C"),
    ].join("");
  },
  "make-parallel"() {
    const A = [60, 260], B = [380, 260], P = [200, 100], X = [260, 260], L = [80, 100];
    return [
      seg("AB", ...A, ...B), seg("PX", ...P, ...X), seg("PL", ...P, ...L, "parallel"),
      angleArc("angPXB", ...X, ...P, ...B, 22),
      angleArc("angLPX", ...P, ...L, ...X, 22),
      point("A", ...A, "A"), point("B", ...B, "B"), point("P", ...P, "P"),
      point("X", ...X, "X", -4, 16), point("L", ...L, "L"),
    ].join("");
  },
  "angle-sum"(t) {
    const g = state.geom || { ax: 200, ay: 70, bx: 80, by: 250, cx: 320, cy: 250 };
    const A = [g.ax, g.ay], B = [g.bx, g.by], C = [g.cx, g.cy];
    // extend BC to X
    const vx = C[0] - B[0], vy = C[1] - B[1];
    const vl = Math.hypot(vx, vy) || 1;
    const X = [C[0] + vx / vl * 80, C[1] + vy / vl * 80];
    // CP parallel to BA: direction of BA
    const P = [C[0] + (A[0] - B[0]) * 0.55, C[1] + (A[1] - B[1]) * 0.55];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      seg("AB", ...A, ...B), seg("AC", ...A, ...C), seg("BC", ...B, ...C),
      seg("CX", ...C, ...X), seg("CP", ...C, ...P, "∥ BA"),
      angleArc("ang1", ...C, ...B, ...A, 24),
      angleArc("ang2", ...B, ...A, ...C, 24),
      angleArc("ang3", ...A, ...B, ...C, 24),
      angleArc("ext", ...C, ...A, ...X, 30),
      angleArc("ang4", ...C, ...A, ...P, 18),
      angleArc("ang5", ...C, ...P, ...X, 18),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C", -4, 16),
      point("X", ...X, "X"), point("P", ...P, "P"),
      handle("A", A[0], A[1]), handle("B", B[0], B[1]), handle("C", C[0], C[1]),
    ].join("");
  },
  "third-angle"() { return DIAGRAMS.sas(); },
  "para-one-pair"(t) {
    const g = state.geom || { shear: 40, h: 120 };
    const A = [100 + g.shear, 250 - g.h], B = [300 + g.shear, 250 - g.h];
    const C = [300, 250], D = [100, 250];
    return [
      poly("paraABCD", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      seg("AB", ...A, ...B), seg("BC", ...B, ...C), seg("CD", ...C, ...D), seg("DA", ...D, ...A),
      seg("AD", ...A, ...D),
      angleArc("ang1", ...A, ...B, ...D, 20),
      angleArc("ang2", ...D, ...C, ...A, 20),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D"),
      handle("shear", A[0], A[1]),
    ].join("");
  },
  "para-props"() { return DIAGRAMS["para-one-pair"](); },

  // High-fidelity Thm 32: two parallelograms same base, same parallels
  "para-same-base"(t) {
    const g = state.geom || { shear: 40, h: 120 };
    const baseY = 280, topY = 280 - g.h;
    const B = [100, baseY], E = [300, baseY];
    // first parallelogram ABED: A left-top, D right-top with shear
    const A = [100 + g.shear, topY], D = [300 + g.shear, topY];
    // second parallelogram CBEF: more shear
    const C = [100 + g.shear + 70, topY], F = [300 + g.shear + 70, topY];
    return [
      // parallels
      seg("top", 40, topY, 420, topY, "upper parallel"),
      seg("baseBE", ...B, ...E, "base BE"),
      el("line", { x1: 40, y1: baseY, x2: 420, y2: baseY, class: "el seg", "data-id": "lower", stroke: "#94a3b8", "stroke-dasharray": "4 4" }),
      poly("para1", `${A[0]},${A[1]} ${B[0]},${B[1]} ${E[0]},${E[1]} ${D[0]},${D[1]}`),
      poly("para2", `${C[0]},${C[1]} ${B[0]},${B[1]} ${E[0]},${E[1]} ${F[0]},${F[1]}`),
      seg("AB", ...A, ...B), seg("DE", ...D, ...E),
      seg("CB", ...C, ...B), seg("FE", ...F, ...E),
      // equal-area label
      el("text", { x: 150, y: 30, class: "label", fill: "#0f766e" }, "same base · same parallels · equal area"),
      point("A", ...A, "A"), point("B", ...B, "B", -4, 16), point("C", ...C, "C"),
      point("D", ...D, "D"), point("E", ...E, "E", -4, 16), point("F", ...F, "F"),
      handle("shear", D[0], D[1]),
    ].join("");
  },

  // High-fidelity Thm 33
  "tri-same-base"(t) {
    const g = state.geom || { cx: 160, gx: 300 };
    const baseY = 280, topY = 100;
    const A = [100, baseY], B = [340, baseY];
    const C = [g.cx, topY], G = [g.gx, topY];
    // parallelograms outline lightly
    const K = [A[0] + (G[0] - B[0]), topY], L = [B[0] + (C[0] - A[0]), topY];
    return [
      seg("top", 50, topY, 400, topY, "upper parallel"),
      seg("AB", ...A, ...B, "base AB"),
      poly("paraK", `${A[0]},${A[1]} ${B[0]},${B[1]} ${G[0]},${G[1]} ${K[0]},${K[1]}`, "el clickable fill-soft"),
      poly("paraL", `${A[0]},${A[1]} ${B[0]},${B[1]} ${L[0]},${L[1]} ${C[0]},${C[1]}`, "el clickable fill-soft"),
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triABG", `${A[0]},${A[1]} ${B[0]},${B[1]} ${G[0]},${G[1]}`),
      el("text", { x: 120, y: 40, class: "label", fill: "#0f766e" }, "equal bases in same parallels ⇒ equal areas"),
      point("A", ...A, "A", -4, 16), point("B", ...B, "B", -4, 16),
      point("C", ...C, "C"), point("G", ...G, "G"),
      handle("C", C[0], C[1]), handle("G", G[0], G[1]),
    ].join("");
  },

  // High-fidelity Thm 34 complements
  complements() {
    // Parallelogram ABCD with diagonal AC; lines through K on AC parallel to sides
    const A = [80, 80], B = [360, 80], C = [380, 280], D = [100, 280];
    // K midpoint-ish on AC
    const K = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    // EKF || AD (vertical-ish), HKG || AB (horizontal-ish)
    const E = [90, 160], F = [240, 150], H = [200, 80], G = [370, 200];
    // complements: EG region and HF region (schematic)
    const comp1 = `${E[0]},${E[1]} ${F[0]},${F[1]} ${K[0]},${K[1]} ${120},${K[1] + 40}`;
    const comp2 = `${H[0]},${H[1]} ${B[0]},${B[1]} ${G[0]},${G[1]} ${K[0]},${K[1]}`;
    return [
      poly("paraABCD", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      poly("comp1", "100,160 230,155 230,210 105,220", "el clickable sq"),
      poly("comp2", "230,80 360,80 370,150 250,155", "el clickable sq"),
      // small paras about diagonal
      poly("small1", "80,80 200,80 230,155 100,160", "el clickable fill-soft"),
      poly("small2", "230,155 370,150 380,280 250,270", "el clickable fill-soft"),
      seg("AC", ...A, ...C, "diagonal AC"),
      seg("EKF", 90, 160, 370, 150, "∥ AD"),
      seg("HKG", 200, 80, 250, 270, "∥ AB"),
      el("text", { x: 130, y: 195, class: "label", fill: "#b45309" }, "1"),
      el("text", { x: 290, y: 120, class: "label", fill: "#b45309" }, "2"),
      el("text", { x: 100, y: 40, class: "label", fill: "#0f766e" }, "complements of paras about diagonal are equal"),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"),
      point("D", ...D, "D"), point("K", ...K, "K", 10, 4),
    ].join("");
  },

  square() {
    const A = [120, 250], B = [300, 250], C = [300, 70], D = [120, 70];
    return [
      poly("squareABCD", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`, "el clickable sq"),
      poly("paraABCD", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}`),
      seg("AB", ...A, ...B), seg("BC", ...B, ...C), seg("CD", ...C, ...D), seg("DA", ...D, ...A),
      seg("AE", A[0], A[1], A[0], 40, "AE ⊥ AB"),
      rightMark(A[0], A[1], 0, -1, 1, 0),
      rightMark(B[0], B[1], 0, -1, -1, 0),
      rightMark(C[0], C[1], 0, 1, -1, 0),
      rightMark(D[0], D[1], 0, 1, 1, 0),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C"), point("D", ...D, "D"),
    ].join("");
  },

  // High-fidelity Pythagorean figure (right at A; squares outward)
  pythagoras(t) {
    const g = state.geom || { legAB: 100, legAC: 120 };
    const ax = 180, ay = 200;
    const ab = g.legAB, ac = g.legAC;
    // A, B down, C right — right angle at A
    const A = [ax, ay], B = [ax, ay + ab], C = [ax + ac, ay];
    // Square on AB outward (to the left): from A,B go left by ab
    const F = [ax - ab, ay], G = [ax - ab, ay + ab];
    // Square on AC outward (upward): from A,C go up by ac
    const H = [ax, ay - ac], K = [ax + ac, ay - ac];
    // Square on BC outward (away from A)
    const bcx = C[0] - B[0], bcy = C[1] - B[1];
    const bcl = Math.hypot(bcx, bcy) || 1;
    let nx = -bcy, ny = bcx;
    let nl = Math.hypot(nx, ny) || 1;
    nx = nx / nl * bcl;
    ny = ny / nl * bcl;
    const midx = (B[0] + C[0]) / 2, midy = (B[1] + C[1]) / 2;
    // if this offset moves midpoint toward A, flip
    const distIn = Math.hypot(midx + nx - A[0], midy + ny - A[1]);
    const distOut = Math.hypot(midx - nx - A[0], midy - ny - A[1]);
    if (distIn < distOut) { nx = -nx; ny = -ny; }
    const D = [B[0] + nx, B[1] + ny], E = [C[0] + nx, C[1] + ny];
    // L foot from A to DE
    // project A onto DE
    const dex = E[0] - D[0], dey = E[1] - D[1];
    const del = Math.hypot(dex, dey) || 1;
    const tproj = ((A[0] - D[0]) * dex + (A[1] - D[1]) * dey) / (del * del);
    const L = [D[0] + tproj * dex, D[1] + tproj * dey];

    return [
      // squares
      poly("sqAB", `${A[0]},${A[1]} ${B[0]},${B[1]} ${G[0]},${G[1]} ${F[0]},${F[1]}`, "el clickable sq"),
      poly("sqAC", `${A[0]},${A[1]} ${C[0]},${C[1]} ${K[0]},${K[1]} ${H[0]},${H[1]}`, "el clickable sq"),
      poly("sqBC", `${B[0]},${B[1]} ${C[0]},${C[1]} ${E[0]},${E[1]} ${D[0]},${D[1]}`, "el clickable sq"),
      // rectangles BL, CL in hypotenuse square
      poly("rectBL", `${B[0]},${B[1]} ${D[0]},${D[1]} ${L[0]},${L[1]} ${(B[0] + L[0] - D[0])},${(B[1] + L[1] - D[1])}`, "el clickable sq"),
      poly("rectCL", `${C[0]},${C[1]} ${E[0]},${E[1]} ${L[0]},${L[1]} ${(C[0] + L[0] - E[0])},${(C[1] + L[1] - E[1])}`, "el clickable sq"),
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triFBC", `${F[0]},${F[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triABD", `${A[0]},${A[1]} ${B[0]},${B[1]} ${D[0]},${D[1]}`),
      seg("AL", ...A, ...L, "AL"),
      seg("AD", ...A, ...D, "AD"),
      seg("CF", ...C, ...F, "CF"),
      seg("GAC", ...F, ...A, "GAC"), // F-A along top of AB square / extension
      // actually GAC is F-A-C? F to C through A if collinear when right at A: F is left of A, C right of A — yes F-A-C colinear
      seg("GAC", ...F, ...C, "GAC straight"),
      rightMark(A[0], A[1], 0, 1, 1, 0),
      point("A", ...A, "A", -14, -8),
      point("B", ...B, "B", -14, 14),
      point("C", ...C, "C", 8, -8),
      point("D", ...D, "D", -10, 12),
      point("E", ...E, "E", 8, 12),
      point("F", ...F, "F", -14, -4),
      point("G", ...G, "G", -14, 6),
      point("H", ...H, "H", -4, -10),
      point("K", ...K, "K", 8, -10),
      point("L", ...L, "L", 6, 14),
      handle("B", B[0], B[1]),
      handle("C", C[0], C[1]),
      el("text", { x: 20, y: 24, class: "label", fill: "#0f766e" }, "sq(AB) + sq(AC) = sq(BC)"),
    ].join("");
  },

  "pythagoras-converse"() {
    const A = [200, 80], B = [80, 260], C = [300, 260], N = [300, 140];
    return [
      poly("triABC", `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`),
      poly("triANC", `${A[0]},${A[1]} ${N[0]},${N[1]} ${C[0]},${C[1]}`),
      seg("AB", ...A, ...B), seg("AC", ...A, ...C), seg("BC", ...B, ...C),
      seg("CN", ...C, ...N), seg("NA", ...N, ...A),
      angleArc("angC", ...C, ...A, ...B, 24),
      rightMark(C[0], C[1], 0, -1, -1, 0),
      point("A", ...A, "A"), point("B", ...B, "B"), point("C", ...C, "C", -4, 16), point("N", ...N, "N"),
    ].join("");
  },

  generic() {
    return DIAGRAMS.equilateral({ interactive: { dragMode: "equilateral-base" } });
  },
};

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

// boot when DOM ready if EMBEDDED already set; assembler will call boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof EMBEDDED_DATA !== "undefined" || true) { /* boot called from HTML */ }
  });
}
