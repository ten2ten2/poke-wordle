// Inline in the site head; parser-blocking in the console so preferences apply before paint.
(() => {
  const key = 'poke-wordle-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = (value) => value === 'light' || value === 'dark' ? value : null;
  let preference = null;
  try { preference = valid(localStorage.getItem(key)); } catch { /* Storage can be unavailable. */ }

  function apply() {
    const theme = preference ?? (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    // Own this tag outside React: changing a hoisted meta's content would defeat head deduplication.
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.append(meta);
    }
    meta.setAttribute('content', theme === 'dark' ? '#111318' : '#f9fafb');
    window.dispatchEvent(new Event('poke-wordle-theme-change'));
  }

  window.addEventListener('poke-wordle-theme-toggle', () => {
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, preference); } catch { /* Keep the choice for this page. */ }
    apply();
  });
  system.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue);
      apply();
    }
  });
  // Locale navigation reapplies the root layout's attributes. Restore the preference before paint.
  new MutationObserver(() => {
    const theme = preference ?? (system.matches ? 'dark' : 'light');
    if (root.dataset.theme !== theme) apply();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  apply();
})();
