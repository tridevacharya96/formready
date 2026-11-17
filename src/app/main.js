// Loads only the tool needed on this page (keeps every page fast for SEO).
const tools = {
  'compress-pdf': () => import('./tools/compress-pdf.js'),
  'word-to-pdf': () => import('./tools/word-to-pdf.js'),
  'pdf-to-word': () => import('./tools/pdf-to-word.js'),
  'compress-image': () => import('./tools/compress-image.js'),
};

const name = document.body.dataset.tool;
const root = document.getElementById('tool');
if (name && root && tools[name]) {
  let preset = {};
  try { preset = JSON.parse(document.body.dataset.preset || '{}'); } catch {}
  tools[name]()
    .then((m) => m.mount(root, preset))
    .catch((err) => {
      console.error(err);
      root.innerHTML = '<p class="error">This tool could not load. Please refresh the page.</p>';
    });
}
