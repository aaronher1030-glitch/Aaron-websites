# Architecture

Lemma is a **static single-page application**. There is no application server, database, authentication service, or runtime API. The production artefact is a folder of static files that can be hosted on any CDN; Cloudflare Pages is the reference target.

---

## 1. Design constraints

| Constraint | Consequence |
| --- | --- |
| Must be free to host | Static output, no server runtime, no database. |
| Must work without accounts | All progress is local to the browser. |
| Must load fast on school hardware | Small dependency surface, local KaTeX rendering, no tracking scripts. |
| Must be honest about AMO formats | Facts carry sources and a verification date. |
| Must respect copyright and attribution | Original content, plus attributed transcriptions of publicly released official questions with links to the source; no copied official solutions or branding. |
| Must be maintainable by a small team | Typed data, simple state, no over-engineered abstraction. |

### Non-goals

- Multi-user classrooms, teacher dashboards, or accounts.
- Server-side grading of proofs.
- Bulk reproduction of copyrighted papers, official solutions, or organiser branding.
- A native mobile application.
- Real-time collaboration.

---

## 2. Runtime model

```text
Browser
  └─ index.html
      └─ /assets/index-*.js
          └─ main.tsx
              ├─ StoreProvider        (localStorage state, stats, theme)
              ├─ BrowserRouter        (history API routing)
              └─ ErrorBoundary
                  └─ App
                      └─ SiteLayout   (header, nav, footer)
                          └─ route page
```

- `main.tsx` mounts React into `#root` and installs the providers.
- `BrowserRouter` uses the History API. Deep links are handled by Cloudflare Pages through `public/_redirects`:
  ```text
  /* /index.html 200
  ```
  Any unknown path returns the SPA shell with a 200 status, and React Router renders the correct page or the 404 page.
- `ScrollToTop` reacts to pathname/hash changes and restores either the top of the page or the anchored section.
- `ErrorBoundary` catches render-time failures and shows a recovery screen instead of a blank page.

### Route table

| Route | Component | Indexable |
| --- | --- | --- |
| `/` | `HomePage` | Yes |
| `/bank` | `BankPage` | Yes |
| `/problem/:id` | `ProblemPage` | Yes (valid id only) |
| `/practice` | `PracticePage` | Yes |
| `/drill/:id` | `DrillPage` | No |
| `/drill/:id/results` | `ResultsPage` | No |
| `/techniques` | `TechniquesPage` | Yes |
| `/techniques/:slug` | `TechniquePage` | Yes (valid slug only) |
| `/amo-guide` | `AmoGuidePage` | Yes |
| `/progress` | `ProgressPage` | No |
| `/review` | `ReviewPage` | No |
| `/about` | `AboutPage` | Yes |
| `*` | `NotFoundPage` | No |

The route table lives in `src/App.tsx`.

---

## 3. Data layer

```text
src/data/
├─ problems.json   192 source problems (authoring format)
├─ proofs.ts       16 original Proof Lab prompts (typed TS)
├─ amoPapers.ts    40 official Australian AMO questions + paper metadata
├─ problems.ts     merge + indexes + answer checking + helpers
├─ skills.ts       16 technique guides
├─ amo.ts          5 competition profiles, FAQ, study plan, sources
└─ types.ts        shared TypeScript types
```

`src/data/problems.ts` is the single import point for pages. It builds:

- `PROBLEMS` — merged bank of 248 problems (208 original, 40 official), source order preserved.
- `PROBLEM_BY_ID` — `Map<string, Problem>` for O(1) route lookup.
- `SKILL_BY_SLUG` / `SKILL_BY_NAME` — technique lookup.
- `SKILL_COUNTS`, `DOMAIN_COUNTS` — precomputed counts used by the UI.
- `relatedProblems(problem, n)` — same technique first, then same domain.
- `isCorrect(problem, value)` — normalised comparison.
- `answerLabel(problem)` — displayable answer text.

Because the bank is small (248 records), indexes are built synchronously at module load. There is no async data fetching and no loading state for content.

### Answer checking

Short answers are normalised before comparison:

- trimmed and lower-cased;
- spaces and commas removed;
- unicode minus and en-dashes converted to `-`;
- simple fractions and decimals compared numerically when both sides parse as numbers;
- multiple choice compared by letter.

The implementation lives in `src/data/problems.ts`. Proof answers are **not** auto-checked; the student selects a rubric grade.

---

## 4. State and persistence

`StoreProvider` (`src/store.tsx`) is the only global state container. It exposes:

```ts
interface StoreContextValue {
  state: Store;
  latest: Map<string, Attempt>;
  stats: Stats;
  setTheme(theme: Theme): void;
  recordAttempt(attempt: Omit<Attempt, "ts">): void;
  recordAttempts(attempts: Array<Omit<Attempt, "ts">>): void;
  toggleStash(qid: string): void;
  saveDrill(drill: Drill): void;
  deleteDrill(id: string): void;
  clearHistory(): void;
  exportData(): void;
  importData(json: string): boolean;
  resetTheme(): void;
}
```

### Persisted shape

One key: `lemma:v1`.

```ts
interface Store {
  attempts: Attempt[];
  drills: Drill[];
  stashed: string[];
  theme: "auto" | "light" | "dark";
  createdAt: number;
}
```

- `attempts` is append-only within a session; analytics use the **latest attempt per question** via `latestAttemptMap`.
- `drills` stores in-progress and finished drills. Finished drills remain available on the results page.
- `stashed` is a list of problem ids.
- `theme` is resolved against `prefers-color-scheme` when set to `auto`.
- The store is written to `localStorage` after every state change.
- `loadStore()` validates arrays and discards malformed entries instead of crashing.
- Import validates the JSON shape and replaces the local store.

### Drill lifecycle

1. `PracticePage` builds filters and calls `selectProblems`.
2. `createDrill` creates a record with empty `answers`, `checked`, `flagged`, and `grades`.
3. `DrillPage` saves progress after each answer and every 15 seconds of elapsed time.
4. On finish (manual or timer expiry), `done` and `finishedAt` are set and the user is routed to results.
5. `ResultsPage` scores answered questions and lets the user reopen any item in the bank or build a repair drill.

Scoring uses answered questions for accuracy so unanswered items are not counted as wrong. The score itself is correct / total.

---

## 5. Metadata and SEO

`src/lib/meta.ts` provides `usePageMeta`, which updates:

- `document.title` (`Title — Lemma`, or the default home title);
- description, author, robots;
- Open Graph and Twitter tags;
- canonical link.

The hook runs after render, so `index.html` carries complete baseline tags for crawlers and link unfurlers.

`scripts/generate-seo.mjs` runs after `vite build` and generates:

- `dist/sitemap.xml` — static routes (including `/amo-papers`), 16 technique routes, and 248 problem routes;
- `dist/robots.txt` — allows public routes and disallows `/progress`, `/review`, and `/drill/`.

Canonical origin comes from `VITE_SITE_URL` (default `https://lemma-478.pages.dev`).

`src/config.ts` centralises site name, description, default URL, GitHub URL, locale, keywords, and verification date.

---

## 6. Styling

CSS is authored as plain CSS, split by concern and imported from `src/styles.css`:

| File | Responsibility |
| --- | --- |
| `base.css` | tokens, reset, typography, themes |
| `shell.css` | header, nav, footer, page heroes |
| `components.css` | buttons, cards, chips, modals, badges, shared primitives |
| `pages-home.css` | home, bank, problem, technique, results, review layouts |
| `pages-app.css` | practice builder, drill, progress, settings |
| `pages-ref.css` | AMO guide, about, 404 |
| `responsive.css` | breakpoint overrides and print/reduced-motion rules |

Design tokens are CSS custom properties. The root element receives `data-theme="light|dark"`; the store resolves `auto` from the system preference.

No CSS framework is used. KaTeX ships its own stylesheet.

---

## 7. Performance

Production build (reference, Vite 8):

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| JS bundle | ~807 kB | ~240 kB |
| CSS | ~115 kB | ~23 kB |

The JS is dominated by React, React Router, and KaTeX. The bundle is acceptable for a static educational tool and is cached immutably under `/assets/*`.

Possible future improvements:

- Route-level `React.lazy` for the guide/about pages.
- Pre-render the public routes to HTML at build time for faster first paint and stronger SEO.
- Split KaTeX into a lazily loaded chunk once math rendering is isolated behind a boundary.

---

## 8. Security and privacy posture

- No backend and no database means no server-side attack surface.
- No third-party analytics, advertising, or tracking scripts.
- Outbound requests are limited to Google Fonts on first load; the app itself fetches nothing.
- `public/_headers` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- All user content stays in the browser. Imported JSON is parsed and validated, not executed.
- The only user-generated content is the proof textarea, which is never sent anywhere.

---

## 9. Failure modes

| Failure | Behaviour |
| --- | --- |
| `localStorage` unavailable or full | Writes are caught; the app keeps working for the session. |
| Corrupt stored JSON | `loadStore()` returns a fresh store. |
| Unknown problem id | `ProblemPage` renders the 404 page with `noindex`. |
| Unknown technique slug | `TechniquePage` renders the 404 page with `noindex`. |
| Deleted drill | `DrillPage` shows an empty state with a link to the builder. |
| Render exception | `ErrorBoundary` shows a reload/home recovery screen. |
| Direct deep-link load | Cloudflare `_redirects` serves `index.html`; the router resolves the path. |

---

## 10. Extension points

- **Add problems:** `src/data/problems.json` or `src/data/proofs.ts`.
- **Add a technique:** `src/data/skills.ts`; the slug becomes a route and sitemap entry automatically.
- **Add a preset:** `PRESETS` in `src/pages/Practice.tsx`.
- **Change scoring or selection:** `src/lib/drill.ts` and `src/lib/select.ts`.
- **Change site metadata:** `src/config.ts` and `index.html`.
- **Change host:** deploy `dist/` anywhere and keep the SPA rewrite.
