// Compress a PDF to an exact maximum size, entirely in the browser.
// Step 1: lossless re-save (object streams). Step 2: if still too big, re-encode each page as an
// optimised JPEG, choosing the best resolution/quality that fits a per-page byte budget.
import { PDFDocument } from 'pdf-lib';
import { mountTool, UserError, fmtSize, baseName, yieldToUI } from '../lib/ui.js';
import { openPdf } from '../lib/pdfjs.js';

const DPI_LEVELS = [150, 130, 110, 96, 84, 72, 62, 54, 46, 40];
const Q_MAX = 0.88;
const Q_MIN = 0.35;
const MAX_PIXELS = 5_000_000; // keeps phones from running out of memory

export function mount(root, preset) {
  const kb = preset.targetKB || 200;
  const useMB = kb >= 1024 && kb % 1024 === 0;
  mountTool(root, {
    accept: 'application/pdf,.pdf',
    acceptLabel: 'PDF file · stays on your device',
    button: 'Compress PDF',
    optionsHtml: `
      <div class="field">
        <label for="target">Maximum file size</label>
        <div class="inline">
          <input id="target" type="number" min="1" step="any" inputmode="decimal" value="${useMB ? kb / 1024 : kb}">
          <select id="unit" aria-label="Unit"><option value="KB"${useMB ? '' : ' selected'}>KB</option><option value="MB"${useMB ? ' selected' : ''}>MB</option></select>
        </div>
      </div>
      <label class="check"><input type="checkbox" id="gray"> Black &amp; white <span class="muted">(sharper text at small sizes)</span></label>`,
    validate: (f) => (/\.pdf$/i.test(f.name) || f.type === 'application/pdf' ? null : 'Please choose a PDF file (.pdf).'),
    run: async (file, { root: r, progress }) => {
      const value = parseFloat(r.querySelector('#target').value);
      const unit = r.querySelector('#unit').value;
      const target = Math.floor(value * (unit === 'MB' ? 1024 * 1024 : 1024));
      if (!target || target < 10 * 1024) throw new UserError('Please enter a size of at least 10 KB.');
      const gray = r.querySelector('#gray').checked;
      const name = `${baseName(file.name)}-${unit === 'MB' ? value + 'MB' : value + 'KB'}.pdf`;

      if (file.size <= target) {
        return { blob: file, filename: file.name, note: `Your PDF is already under ${fmtSize(target)}. No compression needed, so you can upload it as it is.` };
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      // Step 1 — lossless
      progress(5, 'Optimising without quality loss…');
      try {
        const doc = await PDFDocument.load(bytes.slice(), { ignoreEncryption: true, updateMetadata: false });
        const out = await doc.save({ useObjectStreams: true });
        if (out.byteLength <= target) {
          return { blob: new Blob([out], { type: 'application/pdf' }), filename: name, note: 'Compressed with no loss of quality.' };
        }
      } catch {
        /* fall through to re-encoding */
      }

      // Step 2 — re-encode pages
      const pdf = await openPdf(bytes.slice());
      const n = pdf.numPages;
      const minNeeded = 2500 + n * 4500;
      if (target < minNeeded) {
        throw new UserError(`${n} pages cannot fit in ${fmtSize(target)}. Try at least ${fmtSize(minNeeded * 1.5)}, or remove pages you don't need.`);
      }

      let budget = target;
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await encodePages(pdf, budget, gray, (i) => progress(10 + (85 * i) / n, `Compressing page ${i} of ${n}…`));
        if (result.byteLength <= target) {
          const note = result.overBudget
            ? `This is the smallest we could make it while keeping it readable.`
            : `Pages were re-encoded to fit under ${fmtSize(target)}. Check that the text is readable before uploading.`;
          return { blob: new Blob([result], { type: 'application/pdf' }), filename: name, note };
        }
        if (result.overBudget) {
          return {
            blob: new Blob([result], { type: 'application/pdf' }),
            filename: name,
            note: `⚠️ Could not get below ${fmtSize(target)} without making it unreadable. This is the smallest version (${fmtSize(result.byteLength)}). Try removing pages.`,
          };
        }
        budget = Math.floor(budget * (target / result.byteLength) * 0.97);
        progress(10, 'Fine-tuning size…');
      }
      throw new UserError('Could not reach that size. Try a slightly larger limit.');
    },
  });
}

async function encodePages(pdf, totalBudget, gray, onPage) {
  const n = pdf.numPages;
  const out = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  const grayCanvas = gray ? document.createElement('canvas') : null;
  let remaining = totalBudget - 1500 - n * 600; // file + per-page overhead
  let overBudget = false;

  for (let i = 1; i <= n; i++) {
    onPage(i);
    await yieldToUI();
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 }); // points (1/72 inch), rotation applied
    const budget = remaining / (n - i + 1);

    // Skip resolutions that clearly can't fit (≈0.12 bytes/pixel for documents at mid quality)
    const areaIn = (base.width / 72) * (base.height / 72);
    const roughDpi = Math.sqrt(budget / 0.1 / areaIn);
    let levels = DPI_LEVELS.filter((d) => d <= roughDpi * 1.4);
    if (!levels.length) levels = DPI_LEVELS.slice(-3);

    let chosen = null;
    for (const dpi of levels) {
      let scale = dpi / 72;
      const px = base.width * scale * base.height * scale;
      if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
      const vp = page.getViewport({ scale });
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      let src = canvas;
      if (gray) {
        grayCanvas.width = canvas.width;
        grayCanvas.height = canvas.height;
        const g = grayCanvas.getContext('2d', { alpha: false });
        g.filter = 'grayscale(1) contrast(1.15)';
        g.drawImage(canvas, 0, 0);
        src = grayCanvas;
      }
      const fit = await fitJpeg(src, budget);
      chosen = fit;
      if (fit.fits) break;
    }
    if (!chosen.fits) overBudget = true;

    const img = await out.embedJpg(chosen.bytes);
    const p = out.addPage([base.width, base.height]);
    p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    remaining -= chosen.bytes.byteLength;
    page.cleanup();
  }
  canvas.width = canvas.height = 0;
  if (grayCanvas) grayCanvas.width = grayCanvas.height = 0;

  const bytes = await out.save({ useObjectStreams: true });
  bytes.overBudget = overBudget;
  return bytes;
}

const toJpeg = (canvas, q) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b.arrayBuffer().then((a) => new Uint8Array(a))), 'image/jpeg', q));

// Highest JPEG quality whose size is ≤ budget (binary search).
async function fitJpeg(canvas, budget) {
  const top = await toJpeg(canvas, Q_MAX);
  if (top.byteLength <= budget) return { bytes: top, fits: true };
  const low = await toJpeg(canvas, Q_MIN);
  if (low.byteLength > budget) return { bytes: low, fits: false };
  let lo = Q_MIN, hi = Q_MAX, best = low;
  for (let k = 0; k < 5; k++) {
    const mid = (lo + hi) / 2;
    const b = await toJpeg(canvas, mid);
    if (b.byteLength <= budget) { best = b; lo = mid; } else hi = mid;
  }
  return { bytes: best, fits: true };
}
