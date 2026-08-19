/**
 * Capture each theorem (number, statement, given, finished labeled figure)
 * and write a print HTML + PNG fallbacks, then invoke Chrome to PDF.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(__dirname, 'index.html');
const OUT_DIR = path.join(__dirname, 'theorem-sheets');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

fs.mkdirSync(OUT_DIR, { recursive: true });

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--no-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });
await page.goto('file://' + INDEX, { waitUntil: 'networkidle0', timeout: 120000 });

// Wait for app boot
await page.waitForFunction(() => window.__EUCLID__ && window.__EUCLID__.ITEMS && window.FIGS, {
  timeout: 60000,
});

const theorems = await page.evaluate(() => {
  const E = window.__EUCLID__;
  return E.ITEMS.filter(i => i._group === 'theorems').map(t => ({
    id: t.id,
    num: t.num,
    title: t.title || '',
    aka: t.aka || '',
    kind: t.kind || 'theorem',
    statement: t.statement || t.text || '',
    // first proof step is the usual “given / setup” line
    given: (t.steps && t.steps[0] && t.steps[0].text) || '',
  }));
});

console.log('Theorems:', theorems.length);

const pages = [];
for (const t of theorems) {
  process.stdout.write(`  ${t.id} … `);
  await page.evaluate(async (id) => {
    const E = window.__EUCLID__;
    E.stopPlay && E.stopPlay();
    E.clearHlBeats && E.clearHlBeats();
    E.go(id);
    // finished figure, no step highlight
    E.setStep(null);
    E.UI.sel = null;
    E.UI.scaffold = false;
    // force redraw without scaffold
    const scaf = document.getElementById('b-scaf');
    if (scaf && scaf.checked) {
      scaf.checked = false;
      scaf.dispatchEvent(new Event('change', { bubbles: true }));
    }
    E.drawFig && E.drawFig();
  }, t.id);

  // Wait for SVG
  await page.waitForSelector('#figwrap svg', { timeout: 15000 }).catch(() => null);
  await new Promise(r => setTimeout(r, 120));

  const svg = await page.evaluate(() => {
    const el = document.querySelector('#figwrap svg');
    if (!el) return null;
    // Ensure explicit size for print
    el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const clone = el.cloneNode(true);
    if (!clone.getAttribute('viewBox') && clone.getAttribute('width')) {
      // keep as-is
    }
    return new XMLSerializer().serializeToString(clone);
  });

  pages.push({ ...t, svg });
  console.log(svg ? 'ok' : 'NO SVG');
}

await browser.close();

// Build print HTML — one theorem per printed page
const body = pages
  .map((t, i) => {
    const label =
      t.kind === 'construction'
        ? `Construction ${esc(String(t.num))}`
        : `Theorem ${esc(String(t.num))}`;
    const givenBlock = t.given
      ? `<div class="given"><div class="label">Given</div><p>${esc(t.given)}</p></div>`
      : '';
    const fig = t.svg
      ? `<div class="fig">${t.svg}</div>`
      : `<div class="fig missing">(no figure)</div>`;
    return `<section class="page${i === pages.length - 1 ? ' last' : ''}">
  <header>
    <div class="num">${label}</div>
    <h1>${esc(t.title)}</h1>
    ${t.aka ? `<div class="aka">${esc(t.aka)}</div>` : ''}
  </header>
  <div class="statement"><div class="label">Statement</div><p>${esc(t.statement)}</p></div>
  ${givenBlock}
  ${fig}
</section>`;
  })
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Classical Mathematics — Geometry · Theorems</title>
<style>
  @page { size: letter; margin: 0.65in 0.7in 0.65in 0.7in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", "Times New Roman", serif;
    color: #1a1a1a;
    font-size: 12.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    page-break-after: always;
    break-after: page;
    min-height: 9.5in;
  }
  .page.last { page-break-after: auto; break-after: auto; }
  header { margin-bottom: 14pt; }
  .num {
    font-family: ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7a2e2e;
    margin-bottom: 4pt;
  }
  h1 {
    font-size: 18pt;
    font-weight: 600;
    margin: 0 0 4pt;
    line-height: 1.25;
  }
  .aka { font-style: italic; color: #555; font-size: 11pt; margin-bottom: 8pt; }
  .label {
    font-family: ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 3pt;
  }
  .statement, .given { margin-bottom: 12pt; max-width: 42rem; }
  .statement p, .given p { margin: 0; }
  .fig {
    margin-top: 10pt;
    border: 1px solid #ddd2be;
    border-radius: 8pt;
    padding: 8pt;
    background: #fffdf8;
  }
  .fig svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 6.2in;
  }
  .fig.missing { color: #888; font-style: italic; padding: 24pt; }
</style>
</head>
<body>
${body}
</body>
</html>`;

const htmlPath = path.join(OUT_DIR, 'theorems-print.html');
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(pages.map(({ svg, ...r }) => r), null, 2));
console.log('Wrote', htmlPath);

const pdfPath = path.join(__dirname, 'Classical-Mathematics-Geometry-Theorems.pdf');
execFileSync(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + pdfPath,
    '--print-to-pdf-no-header',
    'file://' + htmlPath,
  ],
  { stdio: 'inherit' }
);
console.log('PDF →', pdfPath);
