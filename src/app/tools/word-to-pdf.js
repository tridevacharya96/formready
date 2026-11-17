// DOCX → PDF in the browser: mammoth (DOCX → HTML) → html-to-pdfmake → pdfmake (real text PDF).
// Embedded pictures are downscaled and re-encoded as JPEG so the PDF stays small.
import mammoth from 'mammoth/mammoth.browser.js';
import htmlToPdfmake from 'html-to-pdfmake';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { mountTool, UserError, baseName } from '../lib/ui.js';

pdfMake.addVirtualFileSystem(pdfFonts);

const PAGE = { A4: [595.28, 841.89], Letter: [612, 792] };
const MARGIN = 56; // ~2 cm

export function mount(root) {
  mountTool(root, {
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    acceptLabel: 'Word .docx file · stays on your device',
    button: 'Convert to PDF',
    optionsHtml: `
      <div class="field"><label for="size">Page size</label>
        <select id="size"><option value="A4" selected>A4</option><option value="Letter">Letter</option></select></div>
      <div class="field"><label for="imgq">Picture quality</label>
        <select id="imgq"><option value="small">Smallest file</option><option value="balanced" selected>Balanced</option><option value="high">High quality</option></select></div>`,
    validate: (f) =>
      /\.docx$/i.test(f.name) ? null : /\.doc$/i.test(f.name)
        ? 'Old .doc files are not supported yet. Open it in Word or Google Docs and save as .docx first.'
        : 'Please choose a Word .docx file.',
    run: async (file, { root: r, progress }) => {
      const size = r.querySelector('#size').value;
      const imgq = { small: [800, 0.6], balanced: [1200, 0.75], high: [1800, 0.85] }[r.querySelector('#imgq').value];

      progress(10, 'Reading document…');
      const arrayBuffer = await file.arrayBuffer();
      let html;
      try {
        const res = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: ["p[style-name='Title'] => h1.doc-title:fresh", "p[style-name='Subtitle'] => h2:fresh"],
            convertImage: mammoth.images.imgElement(async (image) => {
              const b64 = await image.read('base64');
              return { src: await shrinkImage(`data:${image.contentType};base64,${b64}`, imgq[0], imgq[1]) };
            }),
          },
        );
        html = res.value;
      } catch {
        throw new UserError('This file could not be read. Make sure it is a valid .docx document.');
      }
      if (!html.trim()) throw new UserError('This document looks empty.');

      progress(55, 'Laying out pages…');
      const [w, h] = PAGE[size];
      const maxW = w - MARGIN * 2;
      const content = htmlToPdfmake(html, {
        imagesByReference: false,
        defaultStyles: {
          h1: { fontSize: 20, bold: true, marginBottom: 8, marginTop: 6 },
          h2: { fontSize: 16, bold: true, marginBottom: 6, marginTop: 6 },
          h3: { fontSize: 13.5, bold: true, marginBottom: 5, marginTop: 5 },
          p: { margin: [0, 0, 0, 6] },
          table: { marginBottom: 8 },
          th: { bold: true, fillColor: '#eef1f7' },
        },
      });
      fitImages(content, maxW, h - MARGIN * 2);

      const docDef = {
        pageSize: { width: w, height: h },
        pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN],
        content,
        defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.25 },
        compress: true,
        info: { title: baseName(file.name), producer: 'FormReady' },
      };

      progress(75, 'Creating PDF…');
      let blob;
      try {
        blob = await pdfMake.createPdf(docDef).getBlob();
      } catch (err) {
        console.error(err);
        throw new UserError('This document has content we could not convert. Try saving it again in Word and retry.');
      }
      return {
        blob,
        filename: `${baseName(file.name)}.pdf`,
        note: 'Converted with real, selectable text. Need it smaller still? Use <a href="/compress-pdf/">Compress PDF</a>.',
      };
    },
  });
}

// Recursively make images fit inside the printable area.
function fitImages(node, maxW, maxH) {
  if (Array.isArray(node)) return node.forEach((n) => fitImages(n, maxW, maxH));
  if (!node || typeof node !== 'object') return;
  if (node.image) {
    delete node.width;
    delete node.height;
    node.fit = [maxW, maxH * 0.9];
  }
  for (const key of ['stack', 'columns', 'ul', 'ol', 'text']) if (node[key]) fitImages(node[key], maxW, maxH);
  if (node.table?.body) node.table.body.forEach((row) => fitImages(row, maxW / Math.max(1, row.length), maxH));
}

// Downscale + JPEG re-encode (white background for transparent PNGs).
function shrinkImage(dataUrl, maxSide, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL('image/jpeg', quality);
      resolve(out.length < dataUrl.length ? out : dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg') ? dataUrl : out);
    };
    // Formats browsers can't draw (EMF/WMF) are replaced by a blank pixel so conversion still succeeds.
    img.onerror = () => resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');
    img.src = dataUrl;
  });
}
