// Generates one static HTML page per entry in pages.mjs into src/, plus sitemap.xml and robots.txt.
// Run automatically by `npm run dev` and `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.js';
import { pages, toolCards } from './pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const PUBLIC = path.join(root, 'public');
const today = new Date().toISOString().slice(0, 10);

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s = '') => s.replace(/\{\{email\}\}/g, config.contactEmail).replace(/\{\{date\}\}/g, today);
const urlFor = (slug) => `${config.siteUrl}/${slug ? slug + '/' : ''}`;

const icons = {
  pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="currentColor" opacity=".15"/><path d="M14 2v6h6M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  word: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity=".15"/><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 8l1.8 8L12 9.5 15.2 16 17 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  img: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity=".15"/><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};

function adSlot(name) {
  if (!config.adsenseClient) return '';
  const slot = config.adSlots?.[name];
  if (!slot) return ''; // Auto ads will place ads by themselves
  return `<div class="ad ad-${name}"><span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${config.adsenseClient}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

const navItems = [
  ['pdf', '/compress-pdf/', 'Compress PDF'],
  ['word2pdf', '/word-to-pdf/', 'Word to PDF'],
  ['pdf2word', '/pdf-to-word/', 'PDF to Word'],
  ['image', '/compress-image/', 'Image to KB'],
];

function presetChips(p) {
  if (p.tool === 'compress-pdf') {
    const sizes = [['50KB', 'compress-pdf-to-50kb'], ['100KB', 'compress-pdf-to-100kb'], ['200KB', 'compress-pdf-to-200kb'], ['300KB', 'compress-pdf-to-300kb'], ['500KB', 'compress-pdf-to-500kb'], ['1MB', 'compress-pdf-to-1mb']];
    return `<nav class="chips" aria-label="Popular sizes">${sizes.map(([l, s]) => `<a href="/${s}/" class="chip${s === p.slug ? ' on' : ''}">${l}</a>`).join('')}</nav>`;
  }
  if (p.tool === 'compress-image') {
    const sizes = [['10KB', 'compress-image-to-10kb'], ['20KB', 'compress-image-to-20kb'], ['50KB', 'compress-image-to-50kb'], ['100KB', 'compress-image-to-100kb'], ['Photo 200×230', 'passport-size-photo-for-online-form'], ['Signature 140×60', 'resize-signature-for-online-form']];
    return `<nav class="chips" aria-label="Popular sizes">${sizes.map(([l, s]) => `<a href="/${s}/" class="chip${s === p.slug ? ' on' : ''}">${l}</a>`).join('')}</nav>`;
  }
  return '';
}

const cardsHtml = (cards) =>
  `<div class="cards">${cards.map((c) => `<a class="card" href="${c.href}"><span class="ic ic-${c.icon}">${icons[c.icon]}</span><span><strong>${c.title}</strong><small>${c.text}</small></span></a>`).join('')}</div>`;

function render(p) {
  const url = urlFor(p.slug);
  const faq = p.faq || [];
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': p.tool ? 'WebApplication' : 'WebSite',
      name: p.tool ? p.h1 : config.name,
      url,
      ...(p.tool ? { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } } : {}),
    },
  ];
  if (faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })),
    });
  }
  const related = toolCards.filter((c) => c.href !== `/${p.slug}/`).slice(0, 6);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${esc(config.name)}">
<meta name="theme-color" content="#1d3b8b">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app/styles.css">
${config.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClient}" crossorigin="anonymous"></script>` : ''}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body data-tool="${p.tool || ''}" data-preset='${JSON.stringify(p.preset || {})}'>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="${esc(config.name)} home">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1d3b8b"/><path d="M9 7h10l5 5v13H9z" fill="#fff"/><path d="M12 18l3 3 6-7" fill="none" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Form<b>Ready</b></span>
    </a>
    <nav class="nav" aria-label="Tools">
      ${navItems.map(([k, h, l]) => `<a href="${h}"${p.nav === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
    </nav>
  </div>
</header>

<main id="main" class="wrap">
  <section class="hero${p.home ? ' hero-home' : ''}">
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${esc(fill(p.lead))}</p>
    ${p.tool || p.home ? '<p class="trust"><span>🔒 Files never leave your device</span><span>⚡ No sign-up</span><span>₹0 Free</span></p>' : ''}
  </section>

  ${adSlot('top')}
  ${presetChips(p)}
  ${p.tool ? `<section id="tool" class="tool" aria-live="polite"><noscript>Please enable JavaScript to use this tool.</noscript></section>
  <div id="result-ad" hidden>${adSlot('result')}</div>` : ''}
  ${p.home ? cardsHtml(toolCards) : ''}

  <article class="content${p.simple ? ' simple' : ''}">
    ${fill(p.body || '')}
  </article>

  ${faq.length ? `<section class="faq"><h2>Frequently asked questions</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${fill(a)}</p></details>`).join('')}</section>` : ''}

  ${!p.home && !p.simple ? `<section class="related"><h2>More free tools</h2>${cardsHtml(related)}</section>` : ''}
  ${adSlot('bottom')}
</main>

<footer class="foot">
  <div class="wrap">
    <p><strong>${esc(config.name)}</strong> — ${esc(config.tagline)}.</p>
    <p class="links"><a href="/about/">About</a><a href="/privacy-policy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></p>
    <p class="small">© ${new Date().getFullYear()} ${esc(config.name)}. Files are processed on your device and never uploaded.</p>
  </div>
</footer>
<script type="module" src="/app/main.js"></script>
${config.cfAnalyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${config.cfAnalyticsToken}"}'></script>` : ''}
</body>
</html>
`;
}

// Clean old generated pages (everything in src/ except app/)
for (const entry of fs.readdirSync(SRC)) {
  if (entry === 'app') continue;
  fs.rmSync(path.join(SRC, entry), { recursive: true, force: true });
}

for (const p of pages) {
  const dir = p.slug ? path.join(SRC, p.slug) : SRC;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render(p));
}

// 404 page for Cloudflare Pages
fs.writeFileSync(
  path.join(SRC, '404.html'),
  render({ slug: '404', nav: 'none', simple: true, title: 'Page not found – FormReady', h1: 'Page not found', lead: 'That page does not exist, but these tools do:', description: 'Page not found', body: cardsHtml(toolCards) }),
);

fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(
  path.join(PUBLIC, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${urlFor(p.slug)}</loc><lastmod>${today}</lastmod><priority>${p.slug === '' ? '1.0' : p.simple ? '0.3' : '0.8'}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);
fs.writeFileSync(path.join(PUBLIC, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
if (config.adsenseClient) {
  fs.writeFileSync(path.join(PUBLIC, 'ads.txt'), `google.com, ${config.adsenseClient.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
}

console.log(`Generated ${pages.length} pages + 404, sitemap.xml, robots.txt`);
