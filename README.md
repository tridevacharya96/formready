# FormReady

Free tools that make files fit Indian online application forms (SSC, UPSC, banking, railway, scholarships, passports).

- **Compress PDF to an exact size**: 50KB, 100KB, 200KB, 300KB, 500KB, 1MB or a custom size
- **Word → PDF**: real selectable text, with pictures recompressed so the file stays small
- **PDF → Word**: editable .docx that keeps paragraphs, headings, bold text and centred lines
- **Image to KB**: photos and signatures to an exact KB, with optional exact pixel size (200×230, 140×60)

Everything runs **in the visitor's browser**. Files are never uploaded. That means:

- ₹0 server cost however many people use it (static hosting only)
- A strong privacy promise you can show on every page
- Instant results, with no queue and no upload wait

## Tech stack

| Part | Tool | Why |
|---|---|---|
| Build | **Vite 5**, multi-page | Each SEO page is a real static HTML file and loads fast |
| Pages | `scripts/pages.mjs` → `scripts/generate.mjs` | Add a keyword page in 10 lines, and the sitemap updates itself |
| PDF reading/rendering | **pdf.js** (Mozilla) | Renders pages and extracts text |
| PDF writing | **pdf-lib** | Rebuilds compressed PDFs |
| Word → PDF | **mammoth** + **html-to-pdfmake** + **pdfmake** | Gives a text-based PDF instead of screenshots |
| PDF → Word | pdf.js text + **docx** | Rebuilds lines, paragraphs, headings and bold |
| Images | Canvas API | Binary-searches the best JPEG quality under the limit |
| Hosting | **Cloudflare Pages** (free) | Unlimited bandwidth, free SSL, custom domain, deploys on every push |
| Money | Google AdSense (+ Pro plan later) | Ad slots are already built into the template |

Each page loads only its own tool. The home page ships about 10KB of JS, and the heavy PDF libraries load only on PDF pages.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/
npm run preview   # serve dist/ at http://localhost:4173
```

## Project layout

```
site.config.js          ← site name, URL, AdSense ID, analytics token
scripts/pages.mjs       ← every page: title, description, preset, content, FAQ
scripts/generate.mjs    ← turns pages.mjs into HTML + sitemap.xml + robots.txt (+ ads.txt)
src/app/main.js         ← loads the right tool for the page
src/app/lib/ui.js       ← shared upload → options → progress → download UI
src/app/tools/*.js      ← compress-pdf, word-to-pdf, pdf-to-word, compress-image
src/app/styles.css
public/                 ← favicon and static files
```

`src/*` except `src/app/` is generated, so don't edit those HTML files by hand.

### Add a new keyword page

In `scripts/pages.mjs`, add e.g. `pdfKbPage(150)` or `imgKbPage(30)`, or copy an object and change the `slug`, text and `preset`. Then run `npm run build`.

## Deploy free on Cloudflare Pages

1. Sign up at <https://dash.cloudflare.com> (free, no card).
2. **Workers & Pages → Create → Pages → Connect to Git**, then choose this repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `20`
4. Deploy. The site goes live at `https://<project-name>.pages.dev`.
5. Put that URL in `site.config.js → siteUrl` and push. Every push redeploys automatically.

(GitHub Pages also works, but Cloudflare Pages is faster in India and handles clean URLs and the 404 page without extra setup.)

## Custom domain + AdSense

1. Buy a domain. A `.in` or `.com` costs about ₹100–900 for the first year (watch renewal prices). Cloudflare Registrar sells `.com` at cost.
2. Cloudflare Pages → your project → **Custom domains** → add it. SSL is automatic.
3. Change `siteUrl` in `site.config.js`, push, and submit `https://yourdomain/sitemap.xml` in **Google Search Console**.
4. When you have a few weeks of traffic and content, apply for **AdSense**. After approval:
   - put `ca-pub-…` in `adsenseClient`
   - (optional) create 3 display ad units and put their IDs in `adSlots` (`top`, `result`, `bottom`)
   - push. `ads.txt` and the ad script are generated automatically.

Free subdomains (`*.pages.dev`, `*.github.io`) are fine for launch and SEO testing. AdSense requires a domain you own, so buy one before you apply.

## Roadmap

**Phase 1 — Launch (done in this repo)**
- [x] Compress PDF to exact KB (lossless first, then smart re-encode, plus a B&W mode)
- [x] Word → PDF, PDF → Word, image/photo/signature to KB
- [x] 19 SEO pages with FAQ schema, sitemap, robots, and About/Privacy/Terms/Contact (needed for AdSense)

**Phase 2 — Traffic (months 1–3)**
- [ ] Deploy, connect a domain, Search Console, Cloudflare Web Analytics
- [ ] One new keyword page per week (`compress-pdf-to-150kb`, `ssc-photo-size`, `ibps-signature-size`, …)
- [ ] Merge PDF, split PDF, JPG → PDF (each is a new search niche)
- [ ] Hindi and Odia pages (`/hi/…`) and Noto fonts for Indic text in Word → PDF

**Phase 3 — Money (months 3–6)**
- [ ] AdSense approval, then add ad units
- [ ] OCR for scanned PDFs (tesseract.js, including Odia/Hindi)
- [ ] "Pro" plan (₹49–99/month via Razorpay): batch files, no ads. This needs a small backend (Laravel or Cloudflare Workers + D1)

**Phase 4 — Scale**
- [ ] Server-side high-fidelity Word → PDF with LibreOffice in Docker (for complex layouts)
- [ ] Paid API for cyber cafés and developers
- [ ] Exam-specific pages updated with each new notification
