# Lemma

**Proof is a muscle. Train it.**

Lemma is an independent, free problem bank and proof-training studio for the **AMO family** of olympiad mathematics competitions. It pairs 248 problems — 208 original plus all 40 official Australian AMO questions from 2016–2020 — with 16 technique guides, worked solutions, timed drills, mistake review, and honest rubric-based proof marking.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f7c60)](LICENSE)

- **Live site:** <https://lemma-478.pages.dev>
- **Source:** this repository
- **Stack:** Vite · React 19 · TypeScript · React Router · KaTeX · static Cloudflare Pages

> Lemma is **not affiliated** with the Australian Maths Trust, SIMCC, the Asia AMO organisation, ASMO, PAMO, or any olympiad body. Competition names are descriptive. The 40 official Australian AMO questions are transcribed with attribution to AMT; Lemma's outlines and rubrics are its own. Other official papers are not reproduced.

---

## What is in the bank

| | Count |
| --- | ---: |
| Problems | **248** |
| Original Lemma problems | 208 |
| Official Australian AMO questions (2016–2020) | 40 |
| Short-answer (`int`) | 148 |
| Multiple-choice (`mc`) | 44 |
| Proof prompts (`proof`) | 56 |
| Technique guides | 16 |
| Domains | 4 |
| AMO formats explained | 5 |

The original bank covers Algebra, Number Theory, Combinatorics, and Geometry. Every problem is tagged to exactly one technique, so a drill has a target rather than a random difficulty label. The official collection adds every question from the publicly released Australian AMO papers for 2016–2020, each with paper, day, and problem attribution plus a link to the AMT PDF.

### The AMO family

Lemma treats “AMO” as five different competitions, not one:

1. **Australian AMO** — proof paper.
2. **American AMO (SIMCC)** — short-answer paper.
3. **Asia AMO** — primary-level contest.
4. **ASMO** — multi-subject olympiad.
5. **PAMO** — two days of proofs.

The AMO Guide compares formats, durations, eligibility, and sources, with a visible verification date. Rules change; always confirm with the official organiser.

---

## Features

- **Problem bank** — search, filter by domain, technique, difficulty, and format; sort and jump to a random problem.
- **Practice builder** — diagnostic, daily five, proof paper, short-answer sprint, weak-spots set, and long mixed set, plus a custom builder.
- **Timed drills** — one question at a time, visible clock, flags, question map, keyboard shortcuts, and automatic submission at the limit.
- **Three answer modes**:
  - short answers are checked in the browser with normalisation for spaces, signs, fractions, and decimals;
  - multiple choice is exact;
  - proofs use a written response, a model proof, and a four-point rubric for self-assessment.
- **Results** — score, accuracy on answered questions, time, flags, per-question review.
- **Progress** — latest-attempt accuracy by domain, difficulty, and technique; streaks; average time; recent activity.
- **Mistake review** — wrong answers and stashed problems can become a repair drill.
- **Technique guides** — big idea, when to use it, traps, checklist, formula, and every tagged problem.
- **Local-only data** — one `localStorage` key (`lemma:v1`), JSON export/import, clear-all reset. No account, no analytics script, no server profile.
- **Themes** — auto, light, and dark.
- **Accessible shell** — skip link, landmark structure, focus styles, reduced-motion support, responsive from 360 px up.

---

## Quick start

Requirements: **Node 22+** (see `.nvmrc`) and npm.

```bash
git clone <your-repository-url> lemma
cd lemma
npm ci
npm run dev
```

The dev server prints a local URL (Vite defaults to `http://localhost:5173`).

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run build` | Typecheck, build to `dist/`, then generate `sitemap.xml` and `robots.txt`. |
| `npm run preview` | Serve the production build locally. |
| `npm run seo` | Regenerate sitemap and robots from the content files. |
| `npm run deploy` | Build and deploy `dist/` to Cloudflare Pages with Wrangler. |
| `npm run deploy:preview` | Build and deploy a preview branch. |

---

## Project structure

```text
.
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml                # typecheck + build on every push/PR
│  │  ├─ deploy.yml            # production deploy on main
│  │  └─ deploy-preview.yml    # PR preview deployment + comment
│  ├─ ISSUE_TEMPLATE/
│  ├─ dependabot.yml
│  └─ PULL_REQUEST_TEMPLATE.md
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ CONTENT.md
│  ├─ DEPLOYMENT.md
│  └─ QA.md
├─ public/
│  ├─ _headers                # Cloudflare cache + security headers
│  ├─ _redirects              # SPA fallback
│  ├─ favicon.svg
│  ├─ manifest.webmanifest
│  └─ og.png / og.svg
├─ scripts/
│  └─ generate-seo.mjs        # sitemap + robots from content
├─ src/
│  ├─ components/             # layout, answer area, cards, icons, UI primitives
│  ├─ data/                   # problems.json, proofs.ts, skills.ts, amo.ts, types.ts
│  ├─ lib/                    # drill logic, selection, metadata, formatting
│  ├─ pages/                  # route components
│  ├─ styles/                 # split CSS modules
│  ├─ App.tsx                 # route table
│  ├─ config.ts               # site metadata + env overrides
│  ├─ main.tsx                # providers and error boundary
│  └─ store.tsx               # localStorage store, stats, import/export
├─ index.html
├─ vite.config.ts
├─ wrangler.toml
└─ package.json
```

### Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/bank` | Problem bank |
| `/problem/:id` | Single problem |
| `/practice` | Practice builder |
| `/drill/:id` | Active drill |
| `/drill/:id/results` | Drill results |
| `/techniques` | Technique index |
| `/techniques/:slug` | Technique guide |
| `/amo-guide` | AMO comparison guide |
| `/amo-papers` | Official Australian AMO papers, 2016–2020 |
| `/progress` | Local progress dashboard |
| `/review` | Mistake and stash review |
| `/about` | About and method |
| `*` | 404 |

`/progress`, `/review`, drill pages, results, and 404s are marked `noindex`. All other routes receive route-specific titles, descriptions, canonical URLs, and Open Graph tags via `src/lib/meta.ts`.

---

## Content model

Problems live in `src/data/problems.json` (the 192-problem source bank), `src/data/proofs.ts` (16 original Proof Lab prompts), and `src/data/amoPapers.ts` (40 official Australian AMO questions with paper metadata). `src/data/problems.ts` merges them and exposes helpers.

A problem looks like this:

```json
{
  "id": "alg-vieta-1",
  "domain": "Algebra",
  "skill": "Polynomials and Vieta's Formulas",
  "difficulty": "Easy",
  "type": "int",
  "stem": "Let $r$ and $s$ be the roots of $x^2 - 7x + 3 = 0$. What is $r^2 + s^2$?",
  "answer": "43",
  "explanation": "..."
}
```

- `type` is `int`, `mc`, or `proof`.
- `mc` problems add `choices` and an `answer` letter.
- `proof` problems add `proof`, `rubric`, and usually `hints`.
- Function names, variables, and the problem id are stable API: links and saved attempts depend on the id.

See [`docs/CONTENT.md`](docs/CONTENT.md) for the editorial rules and a step-by-step guide to adding a problem or technique.

---

## Deployment

Lemma is a static SPA. The production artefact is `dist/`; no application server or database is required.

### Cloudflare Pages dashboard (recommended)

1. Push this repository to GitHub.
2. In Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository.
4. Use these build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | `22` (or set `NODE_VERSION=22`) |

5. Add optional environment variables (see below).
6. Deploy. Every push to `main` produces a production deployment, and every branch can produce a preview URL.

`public/_redirects` contains the SPA fallback (`/* /index.html 200`), and `public/_headers` sets cache and security headers.

### GitHub Actions

The included workflows deploy on every push to `main` and on pull requests.

Add these repository **secrets**:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with the *Cloudflare Pages: Edit* permission. |
| `CLOUDFLARE_ACCOUNT_ID` | The account id from the Cloudflare dashboard. |

Optionally add these repository **variables**:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin, e.g. `https://lemma.example.com`. Defaults to `https://lemma-478.pages.dev`. |
| `VITE_GITHUB_URL` | Repository URL. When set, a “Source on GitHub” link appears in the footer. |

### Command line

```bash
npx wrangler login
npm run deploy
```

Or deploy an existing build:

```bash
npm run build
npx wrangler pages deploy dist --project-name lemma
```

For a custom domain, add it in **Pages → Custom domains**, then set `VITE_SITE_URL` to the canonical origin and redeploy so sitemap and Open Graph URLs are correct.

More detail: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Data and privacy

- Progress is stored under the single key `lemma:v1` in `localStorage`.
- There is no account, no backend, no tracking script, and no network request after the page loads.
- Export produces a JSON file; import validates and replaces local progress.
- Clearing browser storage deletes progress. Export first if it matters.
- Theme preference is stored in the same object.

The exported shape is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Editorial policy

- The 208 original problems are **written for Lemma or supplied with permission**.
- The 40 official Australian AMO questions are **transcribed with attribution** to the Australian Mathematics Trust and link to the official AMT papers. Their outlines and rubrics are Lemma's own, not official solutions.
- No official logos, paper headers, or organiser branding are used, and no affiliation is claimed.
- Competition facts are linked to public official sources and carry a “last verified” date.
- Proof prompts are marked against a rubric, not a fabricated automatic grader.
- A wrong first attempt stays in Review; a corrected problem stops dragging down accuracy because analytics use the latest attempt per question.

If you believe content infringes copyright, please open a **Content or answer issue** or follow [`SECURITY.md`](SECURITY.md) for private reporting.

---

## Contributing

Contributions are welcome: content corrections, accessibility fixes, new original problems, and documentation improvements. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first.

- Run `npm run typecheck` and `npm run build` before opening a pull request.
- Keep the editorial policy: original content, attributed official transcriptions only.
- For a new problem, include the statement, answer, full solution, domain, technique, difficulty, and format.
- For UI changes, check 390 px and 1440 px widths and keyboard navigation.

---

## License

Source code: [MIT](LICENSE).

Problem statements, solutions, and technique guides are Lemma content. The 40 official Australian AMO question statements remain copyright © Australian Mathematics Trust and are reproduced with attribution for study; the MIT license does not grant rights to that material. Competition names and trademarks belong to their respective owners.

---

## Acknowledgements

Built with React, Vite, TypeScript, React Router, and KaTeX. Deployed on Cloudflare Pages. Typefaces: Fraunces, Inter, and JetBrains Mono via Google Fonts.
