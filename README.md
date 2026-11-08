# ChemBank

**A free, independent chemistry reviewer for the PNCO and ACho.**

ChemBank is a static question bank and training studio for Filipino high-school students preparing for the **Philippine National Chemistry Olympiad (PNCO)** and the **Ateneo Chemistry Olympiad (ACho)**. It pairs **430 verified multiple-choice items** with worked solutions, timed drills, mistake review, chapter notes, lab technique guides, a formula sheet, and an interactive periodic table.

- **Live site:** <https://chembank.pages.dev>
- **Stack:** Vite 8 · React 19 · TypeScript · React Router · KaTeX/mhchem · static Cloudflare Pages
- **Cost:** free to use and free to host. No ads, accounts, paywalls, subscriptions, or payment flow.

> ChemBank is **not affiliated** with the Philippine Federation of Chemistry Societies (PFCS), the PNCO National Committee, the Department of Education (DepEd), the Ateneo Chemistry Society (ACheS), or Ateneo de Manila University. Competition names are descriptive. It does **not** reproduce official past papers. Rules and eligibility change yearly; always confirm with the organisers.

---

## What is in the bank

| | Count |
| --- | ---: |
| Published questions | **430** |
| Candidate items reviewed | 434 |
| Items withheld after verification | 4 |
| Documented key corrections | 24 |
| Items from the four supplied practice papers | 196 |
| Prototype and textbook-derived items | 234 |
| Chapter notes | 7 |
| Lab technique guides | 13 |
| PNCO guide sections | 11 |
| Periodic-table elements | 118 |

Every item is multiple choice with four options, one answer, and a worked solution. Each question carries a domain, chapter (where known), canonical topic, editorial difficulty, provenance label, and stable deep link.

The four supplied papers remain playable as complete sets:

| Paper | Published items |
| --- | ---: |
| Chapters 1–3 Theory | 49 |
| Chapters 1–3 Lab | 49 |
| Chapters 4–7 Theory | 48 |
| Chapters 4–7 Lab | 50 |

Four source items were withheld because independent solutions did not converge on a defensible answer. They are listed on the About page and never appear in a drill.

---

## Features

- **Question bank** — search stems, topics, and explanations; filter by domain, chapter, topic, difficulty, provenance, and attempt status; sort and jump to a random item. Filter state lives in the URL.
- **Practice builder** — diagnostic 20, daily 10, chapter drill, lab drill, full supplied paper, weak spots, due review, random 10, and a custom builder capped at 50 items.
- **Timed drills** — one question at a time, visible clock, flags, eliminated-choice strikes, question map, keyboard shortcuts, autosave, resume after refresh, and auto-submit at the limit.
- **Results** — score, accuracy on answered items, time used, per-topic and per-difficulty breakdown, and a per-question review. Wrong items can become a repair drill.
- **Progress** — attempted items, accuracy, average time, streaks, bank coverage, weak topics, recent activity, and JSON export/import.
- **Spaced review** — wrong and stashed items return after 1, 3, 7, and 21 days; due items become a drill.
- **Chapter notes** — seven exam-focused guides with formulas, traps, and links to tagged questions.
- **Lab bench** — thirteen technique pages covering apparatus, precision, common errors, and exam traps.
- **Formula sheet** — constants, chapter equations, solubility rules, activity series, and error propagation.
- **Interactive periodic table** — all 118 elements with keyboard navigation and element detail.
- **PNCO guide** — date-stamped, source-linked sections on structure, eligibility, scope, IChO, and ACho, with a visible non-affiliation statement.
- **Local-only data** — progress is stored in `localStorage` under `chembank:v1`. Nothing is transmitted. Export and import use a JSON file.
- **Offline PWA** — the shell and bank are precached; a manual update prompt never reloads an active drill.
- **Accessible shell** — skip link, semantic landmarks, visible focus, large targets, reduced-motion support, and layouts verified at 390, 1024, and 1440 px.
- **Light, dark, and system themes** — no third-party fonts, analytics, trackers, or remote scripts.

---

## Quick start

Requirements: **Node 22+** (see `.nvmrc`) and npm.

```bash
git clone <your-repository-url> chembank
cd chembank
npm ci
npm run dev
```

Vite prints a local URL, normally <http://localhost:5173>.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run test:run` | Run the Vitest suite once. |
| `npm run content:validate` | Validate the published bank and regenerate `src/data/questions.json`. |
| `npm run build` | Typecheck, build to `dist/`, then write `sitemap.xml` and `robots.txt`. |
| `npm run preview` | Serve the production build locally. |
| `npm run seo` | Regenerate the sitemap and robots file from content. |
| `npm run deploy` | Build and deploy `dist/` to Cloudflare Pages with Wrangler. |
| `npm run content:docx` | Re-extract the supplied DOCX papers (requires Python and pandoc). |
| `npm run content:prototype` | Re-extract question arrays from the prototype HTML. |
| `npm run content:merge` | Merge raw imports into candidates. |
| `npm run content:batches` | Create blind-verification batches. |
| `npm run content:adjudicate` | Build adjudication prompts from blind results. |
| `npm run content:apply` | Apply verification results to the published ledger. |

---

## Routes

| Path | Page |
| --- | --- |
| `/` | Home with a playable sample question |
| `/bank` | Searchable, filterable question bank |
| `/q/:id` | Question deep link |
| `/practice` | Practice builder |
| `/drill/:id` | Drill player |
| `/drill/:id/results` | Results and per-question review |
| `/progress` | Local progress dashboard |
| `/review` | Wrong, stashed, and due items |
| `/notes` | Chapter notes index |
| `/notes/:slug` | Chapter guide |
| `/lab` | Lab bench index |
| `/lab/:slug` | Lab technique guide |
| `/formulas` | Formula sheet and constants |
| `/periodic-table` | Interactive periodic table |
| `/guide` | PNCO / ACho guide |
| `/about` | Method, audit ledger, corrections, licence |
| `*` | Not found |

`/progress`, `/review`, drill pages, results, and the not-found page are `noindex`. Public content pages receive route-specific titles, descriptions, and canonical URLs.

---

## Project structure

```text
.
├── .github/workflows/ci.yml     # typecheck, tests, content validation, build
├── content/
│   ├── audit.json               # machine-readable publication ledger
│   ├── candidates.json          # merged candidates before verification
│   ├── script/                  # extraction, merge, adjudication, validation
│   ├── source/                  # user-supplied prototype, committed verbatim
│   └── verification/            # blind batches, results, adjudications
├── docs/
│   ├── DEPLOYMENT.md
│   ├── QA.md
│   └── superpowers/             # design spec and implementation plan
├── public/
│   ├── _headers                 # CSP and security headers
│   ├── _redirects               # SPA fallback
│   ├── icon.svg
│   └── offline.html
├── scripts/generate-seo.mjs     # sitemap + robots
├── src/
│   ├── components/              # layout, choices, rich text, math, UI primitives
│   ├── data/                    # questions, notes, lab, formulas, periodic table, guide
│   ├── lib/                     # drill, selection, scoring, stats, review
│   ├── pages/                   # route components
│   ├── styles/                  # token, base, component, page, responsive CSS
│   ├── App.tsx                  # route table
│   ├── config.ts                # site metadata
│   ├── main.tsx                 # providers, PWA update prompt
│   └── store.tsx                # localStorage store, export/import
├── tests/                       # Vitest + Testing Library
├── index.html
├── vite.config.ts               # PWA/workbox configuration
└── wrangler.toml
```

---

## Content model and provenance

Questions are bundled from `src/data/questions.json`, which is generated only by `content/scripts/validate.mjs`. A question looks like this:

```json
{
  "id": "ch1-3-theory-01",
  "domain": "General",
  "chapter": 1,
  "topic": "Stoichiometry",
  "difficulty": "Olympiad",
  "stem": "…",
  "choices": ["…", "…", "…", "…"],
  "answer": 2,
  "explanation": "…",
  "source": "supplied-paper",
  "paper": "ch1-3-theory",
  "verified": { "status": "verified", "reviewedAt": "2026-11-07" }
}
```

Provenance labels:

- `supplied-paper` — from the user's four practice papers (196 items).
- `textbook` — written for the prototype's lesson sections (154 items).
- `mixed` — from the prototype's mixed-topic bank (80 items).
- `gap-fill` — reserved for future original items.

The source keys were treated as claims, not truth. Every candidate was solved blind, disagreements went to a second adjudicator, and unresolved items were withheld. Corrections are recorded rather than silently applied. The full trail lives in [`content/verification/`](content/verification/) and is summarised in [`content/audit.json`](content/audit.json) and on `/about`.

The guide is date-stamped and links to its sources. It states plainly that rules change yearly and that ChemBank is independent.

---

## Content pipeline

The pipeline is reproducible from committed source files:

```bash
npm run content:docx          # DOCX -> content/docx.raw.json (pandoc + Python)
npm run content:prototype     # prototype HTML -> content/prototype.raw.json
npm run content:merge         # raw imports -> content/candidates.json
npm run content:batches       # candidates -> verification/batches/
# blind-solve each batch; save results to verification/results/
npm run content:adjudicate    # build adjudication prompts
# adjudicate each row; save results to verification/results/
npm run content:apply         # results -> ledger, audit, published
npm run content:validate      # validate and write src/data/questions.json
```

`validate.mjs` fails on duplicate IDs, missing fields, wrong choice counts, out-of-range answers, empty explanations, unresolved markup, placeholder text, or any non-verified item inside a published paper. The validation step is also part of the test suite.

Editorial changes should update the source record and rerun the pipeline rather than hand-editing `questions.json`.

---

## Deployment

This is a static SPA. The production artefact is `dist/`; no server, database, or environment variable is required.

### Cloudflare Pages

1. Push the repository to GitHub.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository and use:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | `22` (or set `NODE_VERSION=22`) |

4. Deploy. `public/_redirects` provides SPA fallback and `public/_headers` sets cache, CSP, and security headers.

### Command line

```bash
npx wrangler login
npm run deploy
```

Or deploy an existing build:

```bash
npm run build
npx wrangler pages deploy dist --project-name chembank
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for custom domains, rollback, and troubleshooting.

---

## Privacy and security

- No accounts, cookies, analytics, trackers, ads, or remote scripts.
- Progress stays in the browser under `localStorage["chembank:v1"]`.
- Exported JSON is the only copy that leaves the browser, and only when the user downloads it.
- The Content Security Policy restricts scripts, styles, fonts, images, connections, and workers to the site origin.
- Dependency and header details are documented in [`SECURITY.md`](SECURITY.md).

---

## Licence and rights

- **Code:** MIT. See [`LICENSE`](LICENSE).
- **Original site copy, guides, notes, and newly written explanations:** CC BY-NC-SA 4.0.
- **Question text:** remains the property of its respective owners. See [`NOTICE.md`](NOTICE.md).

No official PNCO, ACho, DepEd, PFCS, or Ateneo paper, logo, or branding is included. If you believe an item should not be redistributed, open an issue so it can be reviewed or removed.

---

## Contributing

Corrections, accessibility fixes, and clearer explanations are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. Do not open a public issue for a security vulnerability; follow [`SECURITY.md`](SECURITY.md).

---

**Last content verification:** 2026-11-07.  
**Guide sources last checked:** 2026-11-07.
