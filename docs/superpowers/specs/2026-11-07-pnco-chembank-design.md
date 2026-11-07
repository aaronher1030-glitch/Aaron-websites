# ChemBank — PNCO Chemistry Reviewer

**Date:** 2026-11-07  
**Status:** Approved direction; implementation spec  
**Working title:** ChemBank (renameable)  
**Stack:** Vite + React 19 + TypeScript + KaTeX/mhchem, static Cloudflare Pages

---

## 1. Product

ChemBank is a free, independent chemistry reviewer for the **Philippine National Chemistry Olympiad (PNCO)** and the **Ateneo Chemistry Olympiad (ACho)**. It is a question bank and training studio: one question at a time, worked solutions, timed papers, mistake review, and progress analytics.

It is **not affiliated** with the Philippine Federation of Chemistry Societies (PFCS), the PNCO National Committee, DepEd, the Ateneo Chemistry Society, or Ateneo de Manila University. It does **not** reproduce official past papers. All practice items are user-supplied or original, and every published answer carries a verification status.

**Promise:** practice the chemistry the exam actually tests, without an account wall, ads, or time-wasting interface.

**Audience:** Filipino high-school students preparing for regional eliminations, national finals, or ACho; teachers and coaches building drills; students on low-bandwidth mobile connections.

**Success:** a student can land on the site, answer a real question above the fold, build a focused set, finish it, see what went wrong, and know what to review next — offline if needed.

---

## 2. Source material and provenance

| Source | Content | Count |
| --- | --- | ---: |
| `Chapter-1-3-Chang-PNCO-ACho.docx` | Ch 1–3 theory paper + Ch 1–3 laboratory paper | 100 |
| `Chapter-4-7-PNCO-Chang.docx` | Ch 4–7 theory paper + Ch 4–7 laboratory paper | 100 |
| `files (2).zip` → `chembank-accounts.html` | Mixed-topic bank + 50-item practice paper + Ch 1–2 textbook questions | ~234 |
| Same zip | 16 lesson sections + topic review notes | 16 sections |

Candidate pool is roughly 430 items. Publish only after deduplication and verification; target **350–400 live questions**.

Provenance labels, shown on every question:

- `supplied-paper` — from the user's four practice papers.
- `textbook` — written for the lesson sections in the prototype.
- `mixed` — from the prototype's mixed-topic bank.
- `gap-fill` — newly written only if a later release fills a thin topic.

The DOCX answer keys contain self-contradictions ("wait, check…", key says B but the solution concludes D). **The source keys are drafts, not truth.** The published site must never call the bank "official" or imply endorsement.

**Copyright:** code is MIT. Original site copy and newly written explanations are CC BY-NC-SA 4.0. User-supplied and textbook-derived question text remains the property of its respective owners; the repository must include a `NOTICE.md` explaining this. If the user cannot establish redistribution rights, the repository should be private and the site unlisted.

---

## 3. Content model

```ts
export const DOMAINS = [
  "General",
  "Physical",
  "Analytical",
  "Organic",
  "Laboratory",
] as const;

export type Domain = (typeof DOMAINS)[number];
export type Difficulty = "Foundation" | "Standard" | "Olympiad";
export type SourceKind = "supplied-paper" | "textbook" | "mixed" | "gap-fill";
export type Verification = "verified" | "flagged";

export interface Question {
  id: string;                 // stable, e.g. "ch04-aq-013"
  domain: Domain;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  topic: string;              // one of ~30 canonical topics
  difficulty: Difficulty;
  stem: string;               // rich text: safe HTML subset + $...$ LaTeX
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;        // rich text, clean worked solution
  source: SourceKind;
  paper?: "ch1-3-theory" | "ch1-3-lab" | "ch4-7-theory" | "ch4-7-lab" | "mixed-practice";
  tags?: string[];
  verified: {
    status: Verification;
    reviewedAt: string;       // ISO date
    note?: string;            // e.g. "key corrected from B to D"
  };
  corrections?: string[];
}
```

**Rich text.** A deliberately small markup:

- HTML subset: `<sub>`, `<sup>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<br>`.
- Inline math: `$...$`.
- Display math: `$$...$$`.
- Chemical equations: `$\ce{...}$` via KaTeX mhchem.

No raw `<script>`, `<img>`, `on*` attributes, or arbitrary HTML. Content is authored and bundled, but it is still sanitized at render time.

**Taxonomy.** Five domains and ~30 topics, mapped to Chang chapters:

- General: matter, measurement, atoms/ions, nomenclature, stoichiometry, solutions.
- Physical: gases, thermochemistry, quantum/periodicity, bonding, liquids/solids, kinetics, equilibrium, thermodynamics, electrochemistry.
- Analytical: acid–base, titrations, gravimetry, spectrophotometry, chromatography, electroanalytical.
- Organic: functional groups, isomerism, reactions, biomolecules.
- Laboratory: apparatus, weighing, pipetting, burette, filtration, drying, calorimetry, gas collection, spectroscopy, error analysis.

Difficulty is editorial, not official: `Foundation`, `Standard`, `Olympiad`. The UI must not claim an official PNCO difficulty rating.

---

## 4. Verification pipeline

This is the core quality differentiator.

1. **Extract.** Convert both DOCX files with pandoc to GFM + math. Parse the four papers, answer keys, and explanations. Parse the prototype's arrays and lesson sections. Preserve original IDs and source text.
2. **Normalize.** Convert HTML sub/sup to the rich-text subset; convert OMML-derived LaTeX; normalize units, arrows, charges, and significant figures. Flag malformed equations.
3. **Deduplicate.** Fuzzy-match stems; keep the cleaner explanation; merge provenance.
4. **Blind solve.** Independent subagents receive stem + choices only (no key) in batches. Each returns `{id, answer, confidence, work, ambiguity}` as strict JSON.
5. **Compare and adjudicate.** Key agreement → candidate verified. Disagreement → a second independent agent sees both answers and the source work and adjudicates. Remaining ambiguity → `flagged`, excluded from timed papers and from the "verified" count.
6. **Rewrite explanations.** Clean worked solutions replace source meta-commentary ("wait, check", "correct option: D"). For corrected items, record the original key and the correction reason.
7. **Validate at build time.** Fail the build on: duplicate IDs, missing fields, not exactly four choices, answer out of range, empty explanation, unresolved math, placeholder text, or any item still `flagged` inside a published paper.
8. **Publish the ledger.** `content/audit.json` and an About-page corrections log list totals, corrections, and flagged items. A "Report an issue" link opens a GitHub issue template.

No item is labelled "official". The honest label is: **independently re-solved and checked; corrections documented**.

---

## 5. Information architecture

```
/                         Home
/bank                     Question bank
/q/:id                    Question detail (deep link)
/practice                 Practice builder
/drill/:id                Drill player
/drill/:id/results        Results + review
/progress                 Progress and analytics
/review                   Mistakes, flagged, due review
/notes                    Chapter notes index
/notes/:slug              Chapter guide
/lab                      Lab bench index
/lab/:slug                Lab technique guide
/formulas                 Formula sheet + constants
/periodic-table           Interactive periodic table
/guide                    PNCO / ACho guide
/about                    Methodology, corrections, license
*                         Not found
```

Global nav: **Bank, Practice, Review, Notes, Lab, Progress**; overflow menu for Formulas, Periodic Table, Guide, About. On mobile, a compact top bar plus a bottom tab bar for Bank, Practice, Review, Progress.

Every question has a stable URL and a share button. Filters encode in the URL so a coach can share a drill.

---

## 6. UX flows

### Home

- Above the fold: one playable chemistry question with choices and a worked solution; "Try another" and "Start a 20-question diagnostic".
- Trust strip: `Free`, `No account required`, `N verified questions`, `Works offline`.
- Coverage: counts by domain and chapter; the four practice papers; lab coverage.
- "How it works": Bank → Build → Drill → Review.
- Honesty banner: independent, unofficial, sources and corrections linked.

### Bank

- Search across stem, topic, and explanation.
- Filters: domain, chapter, topic, difficulty, source, verification, attempted/unseen, wrong, flagged.
- Live result count; sort by chapter/topic/difficulty; random question; card list with stem preview, metadata, and status.
- URL state for all filters.

### Question detail

- Full stem, four choices, keyboard A–D / 1–4.
- `Check answer` in practice; solution reveals after checking. `Show solution` is always available, but warns that it marks the item as seen.
- Source, paper, topic, difficulty, verification badge, correction note.
- Prev/next, copy link, report issue.

### Practice builder

Presets:

- Diagnostic 20 — balanced across chapters and domains.
- Daily 10 — unseen first, then weak topics.
- Chapter drill — pick Ch 1–7.
- Lab drill — laboratory domain only.
- Full paper — one of the four 50-item supplied papers.
- Weak spots — lowest accuracy topics with at least one attempt.
- Due review — spaced-repetition queue.
- Random 10.
- Custom — all filters, live count, cap at 50.

Modes:

- **Practice:** instant feedback, explanation after each check, timer inert or optional.
- **Timed:** explanations deferred, countdown, auto-submit at zero. Default 90 seconds per item; full 50-item papers 75 minutes, clearly labelled as a simulation, not official timing.

### Player

- One question at a time; progress `7 / 20`; timer.
- Flag for review; strike through eliminated choices; question map; previous/next.
- Autosave every change, resume after refresh, flush on unload.
- Keyboard: A–D to answer, Enter to check/next, F to flag, arrows to navigate.
- Submit confirmation showing unanswered and flagged counts.

### Results

- Score, accuracy on answered, time used, per-topic and per-difficulty breakdown.
- Per-question review with chosen vs correct, solution, and source.
- `Repair wrong` creates a new drill from incorrect items.
- Retry same set (reshuffled) or return to builder.

### Progress

- KPIs: attempted, accuracy, average time, streak, verified bank coverage.
- Accuracy by domain, chapter, and topic; recent activity.
- Weakest topics with a "drill this" action.
- Export/import JSON, reset data, sync status.

### Review

- Three tabs: **Wrong**, **Flagged**, **Due**.
- Spaced repetition intervals: 1, 3, 7, 21 days after a wrong answer or flag.
- `Review due` builds a drill; `Clear` removes an item from the queue.

### Notes, Lab, Formulas, Periodic Table

- Seven chapter guides: big ideas, formulas, traps, and links to tagged questions.
- Lab bench: apparatus, technique, precision, common errors, exam traps; one page per technique plus an index.
- Formula sheet: constants, equations by chapter, solubility rules, activity series, error propagation.
- Periodic table: interactive element cards with symbol, name, number, mass, category; keyboard accessible.

### Guide

Source-linked, date-stamped, and explicitly unofficial. Cover:

- Two-tier structure: regional eliminations → national finals.
- 2026 finals: 2-hour theory paper with 80–100 multiple-choice items (top 20 advance); laboratory practical with technique demerits (top 10 advance); three-round quiz bee (3/5/7 points).
- Eligibility, school limits, fees, advancement, awards, and the published ambiguities.
- Scope: general, analytical, organic, physical, and laboratory; no prescribed textbook.
- IChO relationship: top four gold awardees form the delegation.
- ACho distinction: separate organizer, separate format, not an IChO qualifier.
- "Rules change yearly; verify with PFCS and your regional coordinator."
- Sources and last-verified date.

### About

Methodology, verification ledger, corrections, content license, non-affiliation, privacy, and report-an-issue.

---

## 7. Visual direction

**Concept:** a chemistry lab notebook crossed with an exam slip. Editorial, tactile, and specific — not a generic SaaS dashboard.

- **Palette:** warm paper `#F4F1E8`, ink `#141414`, cobalt `#1F3A8A`, copper `#B45309`, acid green `#2F6B4F`, hazard red `#B42318`, rule line `#D8D2C4`.
- **Dark mode:** charcoal `#121212`, warm off-white ink, amber `#F2B544`, muted cobalt.
- **Type:** Instrument Serif for display; IBM Plex Sans for UI; IBM Plex Mono for metadata and reagent labels. Self-hosted WOFF2, no Google Fonts request.
- **Motifs:** reagent labels for metadata (`CH 04 / AQUEOUS / 013`), hazard-diamond verification badges, ruled-paper backgrounds, thin hexagon grid, test-tube progress bars, numbered margin notes.
- **Question surface:** clean exam slip with a colored spine by domain; choices as large radio cards with letter chips.
- **Motion:** short fades and progress transitions; respect `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast, visible focus, 44px targets, semantic landmarks, skip link, `aria-live` for answer feedback, no color-only status.

No emojis. No purple gradient SaaS look. No fake lab photography.

---

## 8. Technical architecture

### Base

Fork the proven Lemma implementation (the sibling project at `../lemma`), not the single-file prototype. Reuse:

- Vite/React/TS/Router structure and build.
- Typed data indexes, selection logic, drill engine, local store, review loop, export/import.
- SEO generation, `_redirects`, `_headers`, `wrangler.toml`.
- CSS token/primitives/responsive structure.

Replace:

- Domains, topics, question data, copy, page names, visual identity.
- Math renderer: add mhchem and the safe HTML subset.
- Answer checking: MCQ only for v1; keep a numeric-answer type in the schema for future use.
- Analytics dimensions: domain/chapter/topic/difficulty instead of math domains.

### Data and state

- `src/data/questions.json` generated from `content/`.
- Build-time indexes: by ID, topic, chapter, domain, paper.
- `localStorage` key `chembank:v1`: attempts, drills, review queue, flags, theme, settings, schema version.
- Defensive load, migrations, export/import, reset.
- No tracking, no cookies, no third-party analytics.

### Optional Supabase sync

Local-first by default. Sync activates only when both env vars exist:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

- Email/password or magic-link auth. If unset, the account UI is hidden and the app remains fully functional.
- One row per user in `public.progress` (`user_id uuid`, `data jsonb`, `updated_at timestamptz`), with RLS select/insert/update policies from the supplied SQL.
- Merge strategy: latest attempt per question wins; drills union by ID; flags union; delete only locally.
- Debounced push after changes; pull on sign-in; visible sync status.
- No question content or PII beyond the auth email is stored.

### PWA and offline

- Web app manifest, icons, theme color.
- Service worker: precache shell and data; network-first for navigation; cache-first for hashed assets; offline fallback page.
- "Install app" prompt; offline badge.
- Update flow: new version waits, user sees "Update available" rather than a silent refresh mid-drill.

### SEO

- Per-route title/description/canonical.
- `sitemap.xml` for home, bank, notes, lab, guide, and question pages.
- `robots.txt`.
- JSON-LD `LearningResource` for the site and `Quiz`/`Question` only where accurate; no fake ratings.
- Static `_redirects` fallback to `index.html`.

### Security and privacy

- CSP: `default-src 'self'`; `style-src 'self' 'unsafe-inline'` for KaTeX and React inline styles; `font-src 'self' data:`; `img-src 'self' data:`; `connect-src 'self'` plus the configured Supabase origin; no third-party scripts.
- `_headers`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame denial.
- Sanitize rich text; never render arbitrary HTML.
- No secrets in the repo; `.env.example` only.
- RLS on Supabase; anon key is public by design.
- Report security issues via `SECURITY.md`.

### Performance

- Route-level code splitting.
- Self-hosted fonts, preloaded; `font-display: swap`.
- Data compressed by Cloudflare; keep the initial JS+CSS under ~250KB gzip excluding KaTeX, and lazy-load KaTeX only on routes that render math if measurement shows a win.
- Lighthouse targets: performance ≥ 90 on mobile, accessibility ≥ 95, best practices ≥ 95.

### Testing

- **Vitest** for selection, scoring, answer checking, store migrations, rich-text sanitization, spaced repetition.
- **Content validation** as a test and as a build step.
- **React Testing Library** for builder, player keyboard flow, review queue.
- **Browser QA** with the browser-use MCP at 390, 1024, and 1440 widths; golden path, refresh/resume, offline, dark mode, keyboard.
- **CI:** typecheck, test, content audit, build on every push; deploy preview on pull requests.

### Deployment

- GitHub repository (user supplies the repo URL and auth).
- Cloudflare Pages: build `npm run build`, output `dist`, Node 22.
- `wrangler.toml` for direct deploys; `npm run deploy`.
- GitHub Actions CI; Cloudflare Pages Git integration for previews.
- Free tier only: static hosting, no functions required, Supabase optional free tier.

---

## 9. Non-goals for v1

- Official past papers or "leaked" material.
- Auto-graded free-response, lab practical, or quiz-bee buzzer simulation.
- AI tutor/chat.
- Leaderboards, XP, or social features.
- User-submitted questions (the prototype had this; defer until moderation exists).
- Full textbook notes for Ch 3–7; chapter guides and formula sheets only.
- Native mobile apps.
- Ads, payments, or affiliate links.
- Claiming official affiliation or official difficulty ratings.

---

## 10. Acceptance criteria

- [ ] 350+ published questions, zero `flagged` items inside published papers, zero unresolved answer-key conflicts.
- [ ] Four supplied 50-item papers playable in practice and timed modes.
- [ ] Every question has a stable deep link, source label, topic, difficulty, and worked solution.
- [ ] Bank filters/search/counts work and survive refresh via URL state.
- [ ] A drill can be built, resumed after refresh, submitted, reviewed, and repaired.
- [ ] Progress, weak topics, and spaced review reflect actual attempts.
- [ ] Notes, lab bench, formula sheet, periodic table, and PNCO guide are complete and source-linked.
- [ ] Optional Supabase sync works when configured and is invisible when not.
- [ ] Offline shell and bank work after first load; update prompt does not interrupt a drill.
- [ ] WCAG AA, keyboard-only flow, 390/1024/1440 layouts verified.
- [ ] Typecheck, tests, content validation, and production build clean.
- [ ] CI green; GitHub repo and Cloudflare Pages URL reported after credentials are supplied.
- [ ] Disclaimers, corrections log, and report-an-issue link visible.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Source answers are wrong or contradictory | Blind re-solve, adjudication, corrections ledger, exclude unresolved items |
| AI verification is not human review | Label "independently re-solved", invite reports, never call it official |
| Copyright of textbook-derived items | Provenance labels, `NOTICE.md`, private/unlisted option, user confirms rights |
| PNCO rules change yearly | Date-stamped guide, official links, visible caveat |
| Supabase keys unavailable | Sync hidden; local-first works; deploy needs no backend |
| Scope creep | Non-goals list; v1 is MCQ + static content only |
| Low-bandwidth users | Offline PWA, self-hosted fonts, compressed data, no heavy media |
| Cloudflare/GitHub auth unavailable | Prepare repo, build, CI, and deploy config; wait for user credentials; never claim deployment before it is live |

---

## 12. Sources for the guide

- PFCS 25PNCO2026 Guidelines and Mechanics, circulated via DepEd Bohol DM No. 048, s. 2026: <https://www.depedbohol.org/wp-content/uploads/2026/01/DM-No.-048-s.-2026.pdf>
- PFCS IChO/PNCO news: <https://pfcs.org.ph/category/icho-pnco/>
- UP Manila 24th PNCO finals: <https://www.upm.edu.ph/cpt_news/cas-hosts-national-finals-of-24th-philippine-national-chemistry-olympiad/>
- IChO 2026: <https://www.icho2026.uz/>
- IChO Philippines results: <https://www.icho-official.org/results/country_info.php?country=Philippines>
- Ateneo Chemistry Society projects (ACho): <https://ateneochemsoc.org/projects/>
- SAT Slayer (UX reference): <https://satslayer.org/>
- College Board Student Question Bank: <https://satsuite.collegeboard.org/practice/student-question-bank>
- mhchem manual: <https://mhchem.github.io/MathJax-mhchem/>

**Last verified:** 2026-11-07. Rules and eligibility must be re-checked before each competition cycle.
