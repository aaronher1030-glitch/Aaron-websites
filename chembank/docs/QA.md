# ChemBank QA checklist

How to verify a change before deploying. Run the automated gates first, then
walk the manual flows that the change touches.

## Automated gates

```bash
npm run typecheck     # tsc --noEmit
npm run test:run      # full Vitest suite
npm run build         # typecheck + Vite build + SEO generation
```

On slow Windows machines the Vitest fork pool can time out spawning parallel
workers. If you see `Timeout waiting for worker to respond`, run single-file:

```bash
npx vitest run --no-file-parallelism --maxWorkers=1
```

Targeted runs while iterating:

```bash
npx vitest run --no-file-parallelism --maxWorkers=1 tests/store.test.tsx
```

Content pipeline checks (only when question data changes):

```bash
npm run content:validate
```

## Manual flows

Start the dev server (`npm run dev`) or preview the production build
(`npm run build && npm run preview`). Check each flow at 390px, 1024px, and
1440px wide, in both light and dark themes.

1. **Home** — hero renders, stats match the bank (430 questions), preset links
   navigate to Practice with the preset applied.
2. **Bank** — filter by domain/chapter/topic/difficulty/paper, search text;
   results, field values, and the URL stay in sync while changing filters
   rapidly; question detail shows choices, explanation, and source.
3. **Practice → Drill** — start a diagnostic; answer with mouse and with
   keyboard (`a`–`d`, `Enter`, `f`, arrows); flag a question; refresh
   mid-drill and confirm the drill resumes; in timed mode the clock counts
   down and auto-submits at zero; submit shows the confirm dialog with
   unanswered/flagged counts.
4. **Results** — score, accuracy, and breakdowns match the drill; per-question
   review shows chosen vs correct; "Repair wrong" and "Retry" start the
   right drills.
5. **Progress / Review** — KPIs and streak update after attempts; wrong
   answers appear in Review → Wrong and come back as Due after a day
   (intervals 1/3/7/21); export downloads JSON, import restores it, and a
   malformed import is refused without touching the current store; reset
   asks for confirmation.
6. **Reference pages** — Notes, Lab, Formulas (print button), Periodic table
   (arrow-key navigation), Guide, About all render; bad slugs show NotFound.
7. **PWA** — production build only: service worker registers; an update shows
   the UpdatePrompt (never a forced reload); the install chip appears only
   when the browser offers `beforeinstallprompt` and stays dismissed after
   dismissal; with the network disabled the shell still loads.
8. **Sync (optional)** — with no Supabase env vars the account menu is absent
   and everything above works unchanged. With env vars set, sign-in pulls and
   merges without losing local data, and a network failure never blocks
   local practice.

## SEO and metadata

- Public pages have a canonical URL and `index,follow`; private utility pages
  (drill, results, progress, review) have no canonical and `noindex,follow`.
- `dist/sitemap.xml` lists only public URLs; `dist/robots.txt` points at it.
- No inline scripts in `dist/index.html` (CSP in `public/_headers`).

## Deployment verification

After `wrangler pages deploy` (see [DEPLOYMENT.md](DEPLOYMENT.md)), confirm:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://chembank.pages.dev/
curl -s -o /dev/null -w "%{http_code}\n" https://chembank.pages.dev/bank
curl -s -o /dev/null -w "%{http_code}\n" https://chembank.pages.dev/sw.js
curl -s -o /dev/null -w "%{http_code}\n" https://chembank.pages.dev/sitemap.xml
```

All should return 200, and the home page title should read
`ChemBank — PNCO / ACho chemistry reviewer`.

## Content standards

- Every question carries a source attribution; supplied-paper items cite the
  Chang-based practice papers, prototype items are labeled as such.
- No claims of official affiliation with PFCS, PNCO, DepEd, ACheS, or Ateneo.
- Answer keys and explanations must agree; run `content:validate` after any
  bank edit.