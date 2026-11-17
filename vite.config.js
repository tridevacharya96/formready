import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, 'src');

// Every generated index.html under src/ (except src/app) becomes its own page.
function htmlInputs(dir = SRC, out = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== path.join(SRC, 'app')) htmlInputs(full, out);
    } else if (entry.name.endsWith('.html')) {
      const key = path.relative(SRC, full).replace(/\\/g, '/').replace(/\.html$/, '') || 'index';
      out[key] = full;
    }
  }
  return out;
}

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { input: htmlInputs() },
    chunkSizeWarningLimit: 2500,
  },
  optimizeDeps: { include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'] },
});
