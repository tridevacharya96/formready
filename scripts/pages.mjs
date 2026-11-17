// Every page on the site is defined here. Each keyword page = same tool, different preset.
// Add a page → run `npm run build` → it gets its own URL, sitemap entry and internal links.

const kbLabel = (kb) => (kb >= 1024 ? `${kb / 1024}MB` : `${kb}KB`);

const privacyLine =
  'Your file is processed inside your own browser and never uploaded to any server, so it stays private and the result is ready in seconds.';

// ── Compress PDF to an exact size ────────────────────────────
function pdfKbPage(kb) {
  const L = kbLabel(kb);
  return {
    slug: `compress-pdf-to-${L.toLowerCase()}`,
    nav: 'pdf',
    tool: 'compress-pdf',
    preset: { targetKB: kb },
    title: `Compress PDF to ${L} Online Free – Exact Size for Forms`,
    h1: `Compress PDF to ${L}`,
    lead: `Reduce any PDF to under ${L} for SSC, UPSC, bank, scholarship and job application uploads. Free, no sign-up.`,
    description: `Compress PDF to ${L} or less in seconds. Free online tool for exam and government form uploads. Files never leave your device.`,
    body: `
<h2>How to compress a PDF to ${L}</h2>
<ol>
  <li>Choose or drop your PDF in the box above.</li>
  <li>The target is already set to <strong>${L}</strong>. Change it if your form asks for a different limit.</li>
  <li>Press <strong>Compress PDF</strong> and download the smaller file.</li>
</ol>
<p>${privacyLine}</p>
<h2>Why do forms ask for a PDF under ${L}?</h2>
<p>Online application portals limit upload sizes to keep their servers fast during peak days. Certificates, mark sheets, caste or income certificates and ID proofs scanned on a phone are often 2–10MB, far above a ${L} limit. FormReady shrinks the file to fit while keeping the text readable.</p>
<h2>Tips for the clearest result</h2>
<ul>
  <li>Turn on <strong>Black &amp; white</strong> for text documents. It keeps more detail at small sizes.</li>
  <li>Split very long PDFs into the pages you actually need before compressing.</li>
  <li>If the text looks blurry, try a slightly higher limit if your form allows it.</li>
</ul>`,
    faq: [
      [`Will my PDF be exactly ${L}?`, `It will be at or just under ${L}. Portals reject files that are even 1KB over the limit, so the tool always stays below it.`],
      ['Is it safe to compress certificates here?', privacyLine],
      ['Can I still select the text after compressing?', 'To reach small sizes, pages are converted to optimised images, so the text becomes part of the image. It stays readable, which is all upload portals need.'],
    ],
  };
}

// ── Compress image / photo to KB ─────────────────────────────
function imgKbPage(kb, extra = {}) {
  const L = kbLabel(kb);
  return {
    slug: `compress-image-to-${L.toLowerCase()}`,
    nav: 'image',
    tool: 'compress-image',
    preset: { targetKB: kb },
    title: `Compress Image to ${L} Online – Photo Size Reducer for Forms`,
    h1: `Compress Image to ${L}`,
    lead: `Resize your photo or scanned image to under ${L} in JPG format for exam and job forms.`,
    description: `Reduce photo size to ${L} online free. JPG/PNG to ${L} for SSC, UPSC, railway and passport forms. No upload, works on mobile.`,
    body: `
<h2>How to reduce a photo to ${L}</h2>
<ol>
  <li>Pick your photo (JPG, PNG or WebP).</li>
  <li>Set the width and height in pixels if your form gives exact dimensions, or leave them empty.</li>
  <li>Press <strong>Compress image</strong> and download the JPG.</li>
</ol>
<p>${privacyLine}</p>
<h2>Common photo rules on Indian application forms</h2>
<ul>
  <li><strong>Passport-size photo:</strong> usually 20–50KB, JPG, light background.</li>
  <li><strong>Signature:</strong> usually 10–20KB, black or blue ink on white paper.</li>
  <li><strong>Documents:</strong> often 100–500KB. For multi-page documents use <a href="/compress-pdf/">Compress PDF</a>.</li>
</ul>
<p>Always check your notification or advertisement for the exact limits. They differ between exams.</p>`,
    faq: [
      [`Will my image be exactly ${L}?`, `It will be just under ${L}, the highest quality that fits the limit.`],
      ['Which format is the output?', 'JPG. It is accepted by almost every application portal.'],
      ['Does it work on phones?', 'Yes. It runs in Chrome, Safari and every modern mobile browser.'],
    ],
    ...extra,
  };
}

export const pages = [
  // ── Home ───────────────────────────────────────────────────
  {
    slug: '',
    nav: 'home',
    tool: null,
    title: 'FormReady – Compress PDF to 100KB, Word to PDF, PDF to Word Free',
    h1: 'Make your files form-ready',
    lead: 'Compress PDFs and photos to the exact KB your application form needs, and convert Word ⇄ PDF. Free, fast, and your files never leave your device.',
    description: 'Free online tools to compress PDF to 100KB/200KB, reduce photo size to 20KB, and convert Word to PDF and PDF to Word. Private: runs in your browser.',
    home: true,
    body: `
<h2>Built for Indian application forms</h2>
<p>SSC, UPSC, state PSC, banking, railway, scholarship and passport portals all set strict upload limits. FormReady hits those limits exactly, so your upload goes through the first time.</p>
<h2>Private by design</h2>
<p>${privacyLine} Nothing is stored, and there is nothing to sign up for.</p>`,
    faq: [
      ['Is FormReady free?', 'Yes. All tools are free to use with no sign-up and no watermark.'],
      ['Are my files uploaded anywhere?', privacyLine],
    ],
  },

  // ── Compress PDF (custom size) ─────────────────────────────
  {
    slug: 'compress-pdf',
    nav: 'pdf',
    tool: 'compress-pdf',
    preset: { targetKB: 200 },
    title: 'Compress PDF to Any KB Online Free – Reduce PDF Size',
    h1: 'Compress PDF',
    lead: 'Shrink a PDF to the exact size you need: 50KB, 100KB, 200KB, 500KB or any custom limit.',
    description: 'Reduce PDF file size to any KB limit online for free. Perfect for exam, job and government form uploads. No upload, private and fast.',
    body: `
<h2>How it works</h2>
<p>FormReady first tries to shrink your PDF without touching quality. If that is not enough, it re-encodes each page at the best quality that still fits your size limit. ${privacyLine}</p>
<h2>Popular sizes</h2>
<p>Most portals ask for 100KB, 200KB or 500KB. Use the quick buttons above or type any number.</p>`,
    faq: [
      ['How small can a PDF go?', 'A one-page document usually compresses to 30–50KB and stays readable. Very small limits on long PDFs will reduce clarity.'],
      ['Is there a file size limit?', 'Files up to about 100MB work on most computers. Phones handle smaller files best.'],
    ],
  },
  pdfKbPage(50),
  pdfKbPage(100),
  pdfKbPage(200),
  pdfKbPage(300),
  pdfKbPage(500),
  pdfKbPage(1024),

  // ── Word → PDF ─────────────────────────────────────────────
  {
    slug: 'word-to-pdf',
    nav: 'word2pdf',
    tool: 'word-to-pdf',
    preset: {},
    title: 'Word to PDF Converter Online Free – Small File Size DOCX to PDF',
    h1: 'Word to PDF',
    lead: 'Convert DOCX files to a clean, compact PDF. Images inside are optimised automatically so the PDF stays small.',
    description: 'Convert Word (DOCX) to PDF online for free with a small file size. No upload, no watermark, works on mobile.',
    body: `
<h2>How to convert Word to PDF</h2>
<ol>
  <li>Choose your <strong>.docx</strong> file.</li>
  <li>Press <strong>Convert to PDF</strong>.</li>
  <li>Download your PDF. Need it even smaller? Run it through <a href="/compress-pdf/">Compress PDF</a>.</li>
</ol>
<p>${privacyLine}</p>
<h2>What is kept</h2>
<p>Headings, paragraphs, bold/italic text, lists, tables and images. Complex layouts such as text boxes and multi-column pages are simplified. For pixel-perfect output, use "Save as PDF" in Microsoft Word or LibreOffice.</p>`,
    faq: [
      ['Does it support old .doc files?', 'Not yet. Open the .doc in Word or Google Docs and save it as .docx first.'],
      ['Why is the PDF so small?', 'Text stays as real text and pictures are recompressed, so the PDF is usually much smaller than PDFs printed from other tools.'],
    ],
  },

  // ── PDF → Word ─────────────────────────────────────────────
  {
    slug: 'pdf-to-word',
    nav: 'pdf2word',
    tool: 'pdf-to-word',
    preset: {},
    title: 'PDF to Word Converter Online Free – Editable DOCX',
    h1: 'PDF to Word',
    lead: 'Turn a PDF into an editable Word (.docx) file with headings, bold text and paragraphs kept.',
    description: 'Convert PDF to editable Word DOCX online for free. Keeps paragraphs, headings and bold text. Private: no upload.',
    body: `
<h2>How to convert PDF to Word</h2>
<ol>
  <li>Choose your PDF.</li>
  <li>Press <strong>Convert to Word</strong>.</li>
  <li>Open the .docx in Microsoft Word, Google Docs or LibreOffice and edit.</li>
</ol>
<p>${privacyLine}</p>
<h2>Works best with</h2>
<p>PDFs made from Word, Google Docs or other software where you can select the text. Scanned PDFs (photos of paper) contain no text, so they need OCR, which is coming soon.</p>`,
    faq: [
      ['Will the layout be identical?', 'Text, paragraphs, headings and bold are kept. Complex designs, columns and images are simplified so the document is easy to edit.'],
      ['My scanned PDF gives an empty file. Why?', 'A scanned PDF is a picture of text, not text. OCR support is on our roadmap.'],
    ],
  },

  // ── Images ─────────────────────────────────────────────────
  {
    slug: 'compress-image',
    nav: 'image',
    tool: 'compress-image',
    preset: { targetKB: 50 },
    title: 'Compress Image to KB Online – Reduce Photo Size for Forms',
    h1: 'Compress Image to KB',
    lead: 'Reduce any photo or scan to an exact KB limit, with optional exact pixel dimensions.',
    description: 'Reduce image size to 20KB, 50KB, 100KB or any limit. Resize photos and signatures for online application forms. Free and private.',
    body: `
<h2>How it works</h2>
<p>FormReady finds the highest JPG quality that fits under your limit. If that is not enough, it gently reduces the dimensions. ${privacyLine}</p>`,
    faq: [
      ['Can I set exact width and height?', 'Yes. Enter the pixel size your form requires. The photo is cropped to the centre to fit that shape.'],
    ],
  },
  imgKbPage(10),
  imgKbPage(20),
  imgKbPage(50),
  imgKbPage(100),
  {
    ...imgKbPage(20),
    slug: 'resize-signature-for-online-form',
    preset: { targetKB: 20, width: 140, height: 60 },
    title: 'Resize Signature for Online Form – 140×60 px, Under 20KB',
    h1: 'Resize Signature for Online Form',
    lead: 'Make your scanned signature the right size: 140×60 pixels and under 20KB, as most exam forms require.',
    description: 'Resize signature to 140x60 pixels and under 20KB for SSC, IBPS, railway and other online forms. Free and private.',
  },
  {
    ...imgKbPage(50),
    slug: 'passport-size-photo-for-online-form',
    preset: { targetKB: 50, width: 200, height: 230 },
    title: 'Passport Size Photo for Online Form – 200×230 px, Under 50KB',
    h1: 'Passport Photo for Online Forms',
    lead: 'Resize your photo to 200×230 pixels and under 50KB, the common size for exam and job applications.',
    description: 'Make a passport size photo for online forms: 200x230 pixels, under 50KB, JPG. Free, private, works on mobile.',
  },

  // ── Trust pages (required for AdSense approval) ───────────
  {
    slug: 'about', nav: 'none', tool: null, simple: true,
    title: 'About FormReady', h1: 'About FormReady',
    lead: 'Free tools that make your documents fit online application forms.',
    description: 'About FormReady, free private tools to compress and convert documents for online forms.',
    body: `<p>FormReady was built in Bhubaneswar, Odisha, for the millions of students and job seekers who lose time fighting upload limits on application portals.</p>
<p>Every tool runs entirely in your browser. Your files are never uploaded, stored or seen by anyone. The site is supported by advertising, which keeps every tool free.</p>`,
  },
  {
    slug: 'privacy-policy', nav: 'none', tool: null, simple: true,
    title: 'Privacy Policy – FormReady', h1: 'Privacy Policy',
    lead: 'Last updated: {{date}}',
    description: 'FormReady privacy policy: files are processed in your browser and never uploaded.',
    body: `<h2>Your files</h2>
<p>Files you choose are processed entirely on your own device by your web browser. They are never uploaded to our servers or to any third party, and we cannot see them.</p>
<h2>Cookies and advertising</h2>
<p>We use Google AdSense to show ads. Google and its partners may use cookies to serve ads based on your visits to this and other websites. You can opt out of personalised advertising at <a href="https://adssettings.google.com" rel="nofollow">Google Ads Settings</a>. Learn more at <a href="https://policies.google.com/technologies/ads" rel="nofollow">How Google uses information from sites that use its services</a>.</p>
<h2>Analytics</h2>
<p>We may use privacy-friendly analytics that count page views without cookies and without identifying you.</p>
<h2>Contact</h2>
<p>Questions? Email us at {{email}}.</p>`,
  },
  {
    slug: 'terms', nav: 'none', tool: null, simple: true,
    title: 'Terms of Use – FormReady', h1: 'Terms of Use',
    lead: 'Last updated: {{date}}',
    description: 'Terms of use for FormReady online file tools.',
    body: `<p>FormReady is provided free of charge and "as is", without warranty of any kind. Always check the converted file before submitting it to an application portal. You are responsible for the files you process and for having the right to use them.</p>
<p>We are not responsible for rejected applications, missed deadlines or any loss arising from the use of these tools.</p>`,
  },
  {
    slug: 'contact', nav: 'none', tool: null, simple: true,
    title: 'Contact – FormReady', h1: 'Contact us',
    lead: 'Found a bug or need a new tool for your form? Tell us.',
    description: 'Contact FormReady.',
    body: `<p>Email: <a href="mailto:{{email}}">{{email}}</a></p>
<p>Please do not send us your documents. We never need them, because every tool works on your device.</p>`,
  },
];

// Tool cards shown on the home page and in "Related tools"
export const toolCards = [
  { href: '/compress-pdf-to-100kb/', icon: 'pdf', title: 'Compress PDF to 100KB', text: 'Most-used size for certificates and ID proofs.' },
  { href: '/compress-pdf/', icon: 'pdf', title: 'Compress PDF to any size', text: '50KB, 200KB, 500KB or a custom limit.' },
  { href: '/word-to-pdf/', icon: 'word', title: 'Word to PDF', text: 'DOCX to a clean, compact PDF.' },
  { href: '/pdf-to-word/', icon: 'word', title: 'PDF to Word', text: 'Editable DOCX from any text PDF.' },
  { href: '/passport-size-photo-for-online-form/', icon: 'img', title: 'Photo for online form', text: '200×230 px, under 50KB.' },
  { href: '/resize-signature-for-online-form/', icon: 'img', title: 'Signature for online form', text: '140×60 px, under 20KB.' },
  { href: '/compress-image-to-20kb/', icon: 'img', title: 'Compress image to 20KB', text: 'Any photo, JPG output.' },
  { href: '/compress-image/', icon: 'img', title: 'Compress image to any KB', text: 'Custom KB and pixel size.' },
];
