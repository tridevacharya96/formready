// Compress a photo/scan to a maximum KB, optionally to exact pixel dimensions (centre-cropped).
import { mountTool, UserError, fmtSize, baseName } from '../lib/ui.js';

export function mount(root, preset) {
  const kb = preset.targetKB || 50;
  mountTool(root, {
    accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp',
    acceptLabel: 'JPG, PNG or WebP · stays on your device',
    button: 'Compress image',
    optionsHtml: `
      <div class="field"><label for="target">Maximum size (KB)</label>
        <input id="target" type="number" min="2" step="1" inputmode="numeric" value="${kb}"></div>
      <div class="field"><label>Exact size in pixels <span class="muted">(optional)</span></label>
        <div class="inline">
          <input id="w" type="number" min="10" placeholder="Width" inputmode="numeric" value="${preset.width || ''}" aria-label="Width in pixels">
          <span class="x">×</span>
          <input id="h" type="number" min="10" placeholder="Height" inputmode="numeric" value="${preset.height || ''}" aria-label="Height in pixels">
        </div></div>`,
    validate: (f) => (/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name) ? null : 'Please choose an image (JPG, PNG or WebP).'),
    run: async (file, { root: r, progress }) => {
      const target = Math.floor(parseFloat(r.querySelector('#target').value) * 1024);
      if (!target || target < 2048) throw new UserError('Please enter at least 2 KB.');
      const W = parseInt(r.querySelector('#w').value, 10) || 0;
      const H = parseInt(r.querySelector('#h').value, 10) || 0;

      progress(15, 'Reading image…');
      let bmp;
      try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch { throw new UserError('This image could not be opened. Try a JPG or PNG. iPhone HEIC photos must be converted first.'); }

      // Output size: exact W×H (cover-crop), one side given (keep ratio), or original.
      let outW = bmp.width, outH = bmp.height;
      if (W && H) { outW = W; outH = H; }
      else if (W) { outW = W; outH = Math.round(bmp.height * (W / bmp.width)); }
      else if (H) { outH = H; outW = Math.round(bmp.width * (H / bmp.height)); }

      const draw = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d', { alpha: false });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingQuality = 'high';
        const s = Math.max(w / bmp.width, h / bmp.height); // cover
        const dw = bmp.width * s, dh = bmp.height * s;
        ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh);
        return c;
      };

      const fixedSize = !!(W || H);
      let scale = 1;
      // Huge phone photos: start at a sensible size so it's fast
      if (!fixedSize && outW * outH > 6_000_000) scale = Math.sqrt(6_000_000 / (outW * outH));

      for (let step = 0; step < 14; step++) {
        const w = Math.max(16, Math.round(outW * scale)), h = Math.max(16, Math.round(outH * scale));
        progress(25 + step * 5, `Trying ${w}×${h}px…`);
        const canvas = draw(w, h);
        const res = await bestQuality(canvas, target);
        if (res) {
          const note = `${w}×${h} pixels, JPG quality ${Math.round(res.q * 100)}%.` + (fixedSize && scale < 1 ? ` The pixel size had to be reduced to fit under ${fmtSize(target)}.` : '');
          return { blob: res.blob, filename: `${baseName(file.name)}-${Math.round(target / 1024)}kb.jpg`, note, preview: true };
        }
        scale *= 0.82;
      }
      throw new UserError(`Could not get this image under ${fmtSize(target)}. Try a larger limit.`);
    },
  });
}

const toBlob = (canvas, q) => new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));

// Highest quality in [0.4, 0.95] that fits; null if even 0.4 is too big.
async function bestQuality(canvas, target) {
  let lo = 0.4, hi = 0.95;
  const top = await toBlob(canvas, hi);
  if (top.size <= target) return { blob: top, q: hi };
  const low = await toBlob(canvas, lo);
  if (low.size > target) return null;
  let best = { blob: low, q: lo };
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    const b = await toBlob(canvas, mid);
    if (b.size <= target) { best = { blob: b, q: mid }; lo = mid; } else hi = mid;
  }
  return best;
}
