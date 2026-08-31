
/* Which items get the fullscreen studio (⛶): every theorem. Definitions,
   postulates and hooks can be added here later. */
window.FSX_ENABLED = new Set((window.CONTENT.theorems || []).map(t => t.id));
Object.keys(window.FIGS || {}).forEach(k => {
  if (/^(thm:|b\d+:prop:)/.test(k)) window.FSX_ENABLED.add(k);
});
if (window.STORE && window.STORE.corpus) {
  (window.STORE.corpus.books || []).forEach(bk => {
    (bk.propositions || []).forEach(p => {
      if (p.figId || (window.FIGS && window.FIGS[p.id])) window.FSX_ENABLED.add(p.id);
    });
  });
}
