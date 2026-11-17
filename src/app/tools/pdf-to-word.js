// PDF → editable DOCX in the browser.
// pdf.js gives positioned text fragments; we rebuild lines → paragraphs, detect headings,
// bold/italic and centred lines, then write a .docx with the `docx` library.
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { mountTool, UserError, baseName, yieldToUI } from '../lib/ui.js';
import { openPdf } from '../lib/pdfjs.js';

export function mount(root) {
  mountTool(root, {
    accept: 'application/pdf,.pdf',
    acceptLabel: 'PDF file · stays on your device',
    button: 'Convert to Word',
    validate: (f) => (/\.pdf$/i.test(f.name) || f.type === 'application/pdf' ? null : 'Please choose a PDF file (.pdf).'),
    run: async (file, { progress }) => {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const n = pdf.numPages;
      const pagesData = [];
      let chars = 0;
      let firstSize = null;

      for (let i = 1; i <= n; i++) {
        progress(5 + (75 * i) / n, `Reading page ${i} of ${n}…`);
        await yieldToUI();
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        if (!firstSize) firstSize = vp;
        const tc = await page.getTextContent();
        try { await page.getOperatorList(); } catch { /* fonts unavailable: no bold detection */ }
        const items = [];
        for (const it of tc.items) {
          if (!it.str) continue;
          items.push(toItem(it, page, vp));
          chars += it.str.trim().length;
        }
        pagesData.push({ lines: buildLines(items), width: vp.width });
        page.cleanup();
      }

      if (chars === 0) {
        throw new UserError('This PDF has no selectable text. It is probably a scanned image. OCR support for scanned PDFs is coming soon.');
      }

      progress(85, 'Building Word document…');
      const allSizes = pagesData.flatMap((p) => p.lines.flatMap((l) => l.runs.map((r) => [r.size, r.text.length])));
      const body = weightedMedian(allSizes) || 11;

      const children = [];
      pagesData.forEach((pg, idx) => {
        const paras = buildParagraphs(pg.lines, pg.width, body);
        paras.forEach((para, j) => {
          const heading = para.size >= body * 1.25;
          children.push(
            new Paragraph({
              pageBreakBefore: idx > 0 && j === 0,
              alignment: para.center ? AlignmentType.CENTER : AlignmentType.LEFT,
              spacing: { after: heading ? 120 : 160, before: heading ? 160 : 0 },
              children: para.runs.map(
                (r) => new TextRun({ text: r.text, bold: r.bold || heading, italics: r.italic, size: Math.round(clamp(r.size, 6, 48) * 2) }),
              ),
            }),
          );
        });
        if (!paras.length && idx > 0) children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
      });

      const doc = new Document({
        creator: 'FormReady',
        title: baseName(file.name),
        styles: { default: { document: { run: { font: 'Calibri' } } } },
        sections: [{
          properties: { page: { size: { width: Math.round(firstSize.width * 20), height: Math.round(firstSize.height * 20) }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
          children,
        }],
      });
      const blob = await Packer.toBlob(doc);
      return {
        blob,
        filename: `${baseName(file.name)}.docx`,
        note: chars < 40 * n ? 'Only a little text was found. Parts of this PDF may be scanned images, which are not converted yet.' : 'Paragraphs, headings and bold text were kept. Images and complex layouts are not included.',
      };
    },
  });
}

function toItem(it, page, vp) {
  const t = it.transform;
  const size = Math.hypot(t[2], t[3]) || it.height || 10;
  let bold = false, italic = false;
  try {
    const f = page.commonObjs.get(it.fontName);
    const fname = `${f?.name || ''} ${f?.loadedName || ''}`;
    bold = !!f?.bold || /bold|black|heavy|semibold|demi/i.test(fname);
    italic = !!f?.italic || /italic|oblique/i.test(fname);
  } catch { /* font not resolved */ }
  return { str: it.str, x: t[4], y: t[5], w: it.width, size, bold, italic };
}

// Group fragments into visual lines (top → bottom, left → right).
function buildLines(items) {
  const sorted = items.filter((i) => i.str.length).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    const line = lines.find((l) => Math.abs(l.y - it.y) < Math.max(2, Math.min(l.size, it.size) * 0.5));
    if (line) { line.items.push(it); line.size = Math.max(line.size, it.size); } else lines.push({ y: it.y, size: it.size, items: [it] });
  }
  lines.sort((a, b) => b.y - a.y);
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x);
    l.left = l.items[0].x;
    l.right = Math.max(...l.items.map((i) => i.x + i.w));
    const runs = [];
    let prevEnd = null;
    for (const it of l.items) {
      let text = it.str;
      if (prevEnd !== null && it.x - prevEnd > it.size * 0.2) {
        const last = runs[runs.length - 1];
        if (last && !/\s$/.test(last.text) && !/^\s/.test(text)) text = ' ' + text;
      }
      prevEnd = it.x + it.w;
      const last = runs[runs.length - 1];
      if (last && last.bold === it.bold && last.italic === it.italic && Math.abs(last.size - it.size) < 0.6) last.text += text;
      else runs.push({ text, bold: it.bold, italic: it.italic, size: it.size });
    }
    l.runs = runs.filter((r) => r.text.length);
    l.text = l.runs.map((r) => r.text).join('');
  }
  return lines.filter((l) => l.text.trim());
}

// Merge lines into paragraphs using spacing, size changes, short lines and bullets.
function buildParagraphs(lines, pageWidth, body) {
  if (!lines.length) return [];
  const maxRight = Math.max(...lines.map((l) => l.right));
  const minLeft = Math.min(...lines.map((l) => l.left));
  const paras = [];
  let cur = null;
  let prev = null;
  for (const l of lines) {
    const center = Math.abs((l.left + l.right) / 2 - pageWidth / 2) < pageWidth * 0.04 && l.left - minLeft > pageWidth * 0.12;
    const bullet = /^\s*([•\-–▪●◦*]|\d{1,2}[.)]|[a-z][.)])\s/.test(l.text);
    let newPara = !cur;
    if (prev && cur) {
      const gap = prev.y - l.y;
      if (gap > Math.max(prev.size, l.size) * 1.65) newPara = true;
      if (Math.abs(prev.size - l.size) > 1.2) newPara = true;
      if (prev.right < maxRight - (maxRight - minLeft) * 0.22) newPara = true; // previous line was short → paragraph ended
      if (bullet || center || cur.center) newPara = true;
      if (l.size >= body * 1.25 || prev.size >= body * 1.25) newPara = newPara || gap > l.size * 1.3;
    }
    if (newPara) {
      cur = { runs: l.runs.map((r) => ({ ...r })), size: l.size, center };
      paras.push(cur);
    } else {
      const lastRun = cur.runs[cur.runs.length - 1];
      const firstRun = l.runs[0];
      if (/[a-z]-$/.test(lastRun.text) && /^[a-z]/.test(firstRun.text)) lastRun.text = lastRun.text.slice(0, -1); // re-join hyphenated words
      else if (!/\s$/.test(lastRun.text)) lastRun.text += ' ';
      for (const r of l.runs) {
        const last = cur.runs[cur.runs.length - 1];
        if (last.bold === r.bold && last.italic === r.italic && Math.abs(last.size - r.size) < 0.6) last.text += r.text;
        else cur.runs.push({ ...r });
      }
      cur.size = Math.max(cur.size, l.size);
    }
    prev = l;
  }
  return paras;
}

function weightedMedian(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (const [v, w] of [...pairs].sort((a, b) => a[0] - b[0])) { acc += w; if (acc >= total / 2) return v; }
  return null;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
