# Resume Autofill (V1)

A local, rule-based Chrome extension that extracts your resume once and
autofills job application forms across LinkedIn, Greenhouse, Lever, Workday,
Ashby, BambooHR, Indeed, Internshala, Wellfound, and most company career pages.

**No AI. No servers. Everything runs and stays on your machine**
(`chrome.storage.local`).

## Install (unpacked, for your own use)

1. Open `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked**
4. Select the `resume-autofill` folder
5. Pin the extension from the puzzle-piece icon in the toolbar

## Use it

1. Click the extension icon → **Upload Resume** → choose your PDF resume
2. Click **Extract Resume** — this parses the PDF locally and stores a
   structured JSON version of your resume (name, email, phone, education,
   experience, projects, skills, links)
3. Go to any job application page
4. Click **Autofill** — detected fields get matched against your resume and
   filled in automatically
5. **Detect Inputs** is a debug helper — it just counts/logs fields on the
   page without filling anything, useful when troubleshooting a site

Your resume data persists between sessions (stored in `chrome.storage.local`),
so you only need to upload + extract once. Use **Clear stored resume** to
wipe it.

## What V1 supports

- Text inputs, textareas, and `<select>` dropdowns
- React/Vue-controlled inputs (dispatches `input`/`change`/`blur` events and
  writes through the native value setter so frameworks pick up the change)
- Field classification via a keyword dictionary (`utils/labels.js`) — checks
  label text, `aria-label`, placeholder, `name`, `id`, and `autocomplete`
- PDF resumes only (`.pdf`, parsed via PDF.js)

## What's intentionally skipped in V1 (per project spec)

- Checkboxes and radio buttons
- File upload fields (e.g. "Attach your resume")
- Cover letter / free-text essay questions
- DOCX resumes (stubbed in `parser/docxParser.js` for a future version)
- Any AI — every match is a deterministic regex/keyword lookup

## Extending it

- **New field types**: add keywords to `utils/labels.js`'s `DICTIONARY`, then
  map the new type to a resume JSON path in `content/matcher.js`'s
  `resolveValue()`.
- **New resume sections**: extend `parser/extractor.js`. Extraction is
  regex/heuristic based and works best with resumes that have clear section
  headers (Education, Experience, Projects, Skills).
- **AI fallback for unmatched fields (V2 idea from the spec)**: when
  `matcher.js` classifies a field as unknown, send `{ label, nearbyText,
  placeholder, resumeJson }` to an LLM from `background/background.js`
  (service workers can make network calls without CSP restrictions that
  content scripts on arbitrary sites may have) and fill in the returned
  value. Everything else stays rule-based.

## Folder structure

```
resume-autofill/
├── manifest.json
├── popup/            popup UI (upload / extract / autofill controls)
├── content/           detector.js, matcher.js, autofill.js — run on every page
├── background/        service worker (currently minimal)
├── parser/             PDF.js + pdfParser.js + extractor.js (regex parsing)
├── storage/            chrome.storage.local wrapper
├── utils/               helpers.js, regex.js, labels.js — shared utilities
└── icons/
```

## Known limitations to be aware of

- Name extraction, and experience/project sectioning, are heuristic best-effort
  — resumes with unusual layouts (2-column, heavy graphics, non-standard
  section titles) will extract less cleanly. You can always re-extract after
  editing your PDF, or (for now) manually correct `chrome.storage.local`'s
  `resumeData` key via DevTools → Application → Storage.
- Cross-origin iframes (some ATS embed the application form in an iframe from
  a different domain) are not scanned — Chrome's content script isolation
  prevents reaching into those without additional host permissions per site.
- Dropdown matching does exact/partial text matching against `<option>`
  values — highly custom dropdown widgets (non-native, div-based) aren't
  supported in V1.
