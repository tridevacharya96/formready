// Shared tool UI: drop zone → options → run → result with download.

export const fmtSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${+(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * @param {HTMLElement} root
 * @param {{accept:string, acceptLabel:string, optionsHtml?:string, button:string,
 *          validate?:(f:File)=>string|null, run:(file:File, opts:{root:HTMLElement, progress:(pct:number,msg?:string)=>void})=>Promise<{blob:Blob, filename:string, note?:string, preview?:boolean}>}} cfg
 */
export function mountTool(root, cfg) {
  root.innerHTML = `
    <label class="drop" tabindex="0">
      <input type="file" accept="${cfg.accept}" hidden>
      <span class="drop-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="drop-title">Choose file <span class="muted">or drop it here</span></span>
      <span class="drop-sub">${cfg.acceptLabel}</span>
    </label>
    <div class="picked" hidden>
      <span class="file-name"></span><span class="file-size muted"></span>
      <button type="button" class="link change">Change</button>
    </div>
    ${cfg.optionsHtml ? `<div class="opts">${cfg.optionsHtml}</div>` : ''}
    <button type="button" class="btn primary go" disabled>${cfg.button}</button>
    <div class="progress" hidden><div class="bar"><span></span></div><p class="msg muted"></p></div>
    <div class="result" hidden></div>
    <p class="error" hidden></p>`;

  const $ = (s) => root.querySelector(s);
  const input = $('input[type=file]');
  const drop = $('.drop');
  const go = $('.go');
  const progressBox = $('.progress');
  const bar = $('.bar span');
  const msg = $('.msg');
  const result = $('.result');
  const error = $('.error');
  let file = null;
  let lastUrl = null;

  const showError = (text) => { error.textContent = text; error.hidden = !text; };

  function setFile(f) {
    if (!f) return;
    const problem = cfg.validate?.(f);
    if (problem) { showError(problem); return; }
    showError('');
    file = f;
    $('.file-name').textContent = f.name;
    $('.file-size').textContent = fmtSize(f.size);
    $('.picked').hidden = false;
    drop.hidden = true;
    result.hidden = true;
    go.disabled = false;
    go.focus();
  }

  input.addEventListener('change', () => setFile(input.files[0]));
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => setFile(e.dataTransfer.files[0]));
  $('.change').addEventListener('click', () => { input.value = ''; input.click(); });

  const progress = (pct, text) => {
    bar.style.width = `${Math.max(3, Math.min(100, pct))}%`;
    if (text) msg.textContent = text;
  };

  go.addEventListener('click', async () => {
    if (!file) return;
    go.disabled = true;
    showError('');
    result.hidden = true;
    progressBox.hidden = false;
    progress(2, 'Starting…');
    const resultAd = document.getElementById('result-ad');
    if (resultAd) resultAd.hidden = false; // ad shown while people wait
    try {
      const t0 = performance.now();
      const out = await cfg.run(file, { root, progress });
      progress(100, 'Done');
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(out.blob);
      const saved = file.size > out.blob.size ? Math.round((1 - out.blob.size / file.size) * 100) : 0;
      result.innerHTML = `
        <div class="sizes">
          <div><small>Original</small><strong>${fmtSize(file.size)}</strong></div>
          <div class="arrow" aria-hidden="true">→</div>
          <div><small>New file</small><strong class="ok">${fmtSize(out.blob.size)}</strong></div>
          ${saved ? `<div class="saved">−${saved}%</div>` : ''}
        </div>
        ${out.preview ? `<img class="preview" src="${lastUrl}" alt="Preview of the compressed image">` : ''}
        ${out.note ? `<p class="note">${out.note}</p>` : ''}
        <a class="btn primary dl" href="${lastUrl}" download="${esc(out.filename)}">Download ${esc(out.filename)}</a>
        <p class="muted small">Finished in ${((performance.now() - t0) / 1000).toFixed(1)}s, on your device.</p>`;
      result.hidden = false;
      progressBox.hidden = true;
      result.querySelector('.dl').focus();
    } catch (err) {
      console.error(err);
      progressBox.hidden = true;
      showError(err?.userMessage || 'Something went wrong with this file. Please try another file.');
    } finally {
      go.disabled = false;
    }
  });

  return { getFile: () => file };
}

export class UserError extends Error {
  constructor(message) { super(message); this.userMessage = message; }
}

export const baseName = (name) => name.replace(/\.[^.]+$/, '');

export const yieldToUI = () => new Promise((r) => setTimeout(r, 0));
