# QA checklist

Use this checklist before a production deployment and after any change to routing, state, content, or layout. It assumes a local build at `http://localhost:4173` (`npm run preview`) unless stated otherwise.

---

## 1. Automated gates

```bash
npm ci
npm run typecheck
npm run build
```

A build must produce:

- `dist/index.html`
- `dist/assets/*.js` and `dist/assets/*.css`
- `dist/_redirects`
- `dist/_headers`
- `dist/sitemap.xml`
- `dist/robots.txt`
- `dist/og.png`
- `dist/favicon.svg`
- `dist/manifest.webmanifest`

Inspect the build log for warnings. The current bundle is intentionally large because KaTeX is bundled; a chunk-size warning is expected and not a failure.

---

## 2. Route matrix

Open each route directly (not only by clicking) and confirm it renders with no console error:

| Route | Check |
| --- | --- |
| `/` | Hero, sample problem, stats, competition cards, technique cards, FAQ. |
| `/bank` | 248 results, collection filter, other filters, sort, search, random problem. |
| `/problem/alg-vieta-1` | Statement, answer input, check, solution, related problems. |
| `/problem/proof-vieta-squares` | Proof textarea, reveal model, rubric, grading. |
| `/problem/amo-2020-p1` | Official badge, source banner, AMT PDF link, Lemma outline wording. |
| `/techniques` | 16 cards grouped by four domains. |
| `/techniques/polynomials-vieta` | Guide sections, formula, tagged problems, next guide. |
| `/practice` | Six presets, builder, live count, start button. |
| `/amo-papers` | Five paper cards, Day 1/Day 2 problem lists, PDF links, drill launchers. |
| `/drill/<active-id>` | Question, timer, navigator, flag, finish modal. |
| `/drill/<id>/results` | Score, metrics, per-question rows, repair link. |
| `/amo-guide` | Comparison table, five profiles, sources, FAQ. |
| `/progress` | Empty state, then populated stats after an attempt. |
| `/review` | Wrong answers and stashed problems, repair drill. |
| `/about` | Method, independence, data, built-with. |
| `/does-not-exist` | 404 page, `noindex`, links home and to the bank. |

Deep-link checks on the deployed host are essential: Cloudflare must serve `index.html` for each path with a 200 status.

---

## 3. Answer flows

### Short answer (`int`)

- [ ] Type the correct answer; check; success feedback appears.
- [ ] Type a wrong answer; check; the correct answer is shown with the solution.
- [ ] Try an equivalent form (`1/2` vs `0.5`, spaces, unicode minus) where applicable.
- [ ] Press Enter in the input to submit.
- [ ] Confirm the attempt is stored under `lemma:v1`.

### Multiple choice (`mc`)

- [ ] Select an option; check; correct/incorrect feedback is accurate.
- [ ] Confirm the chosen letter is highlighted.
- [ ] Confirm keyboard shortcuts work inside a drill (`A`–`D`, `1`–`4`).
- [ ] Confirm the solution explains the reasoning.

### Proof

- [ ] Type into the textarea; the text persists while the page is open.
- [ ] Reveal the model proof or Lemma outline; the rubric is visible.
- [ ] Grade `got`, `partial`, and `miss`; confirm the result is stored.
- [ ] Confirm partial and miss remain in Review; `got` counts as correct.
- [ ] Confirm no claim of automatic proof grading appears anywhere.

### Retry

- [ ] `Try again` clears the input and feedback.
- [ ] A retry creates a new attempt; analytics use the latest attempt per question.

---

## 4. Drill lifecycle

- [ ] Start each preset from `/practice`.
- [ ] Confirm the drill opens at question 1 and the timer behaves as configured.
- [ ] Answer some questions; navigate with Previous/Next and the question map.
- [ ] Flag a question; the flag persists after navigation and refresh.
- [ ] Stash a question; it appears in `/review`.
- [ ] Refresh mid-drill; answers, index, flags, and elapsed time survive.
- [ ] Finish manually; the results page opens.
- [ ] Start a timed drill with a 1-minute limit; confirm auto-finish and results.
- [ ] Confirm unanswered questions are not counted as wrong in accuracy.
- [ ] Confirm the score is correct / total.
- [ ] Delete an in-progress drill from `/practice`; it disappears.
- [ ] Open a deleted drill id; an empty state appears, not a crash.

---

## 5. Progress and data

- [ ] Empty state on `/progress` before any attempt.
- [ ] Metrics populate after one attempt: attempted, solved, streak, average time.
- [ ] Accuracy by domain, difficulty, and technique.
- [ ] `Weakest first` reorders the technique table.
- [ ] Theme selector updates immediately and survives reload.
- [ ] Export downloads a JSON file.
- [ ] Import a valid export restores attempts, drills, stashed ids, and theme.
- [ ] Import malformed JSON reports an error and leaves data intact.
- [ ] Reset asks for confirmation, then clears attempts, drills, and stashes.
- [ ] Clear the `lemma:v1` key manually and reload; the app starts fresh.

---

## 6. Responsive checkpoints

Test at 390, 768, 1024, and 1440 px. For each:

- [ ] No horizontal scrollbar (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] Header navigation is usable; mobile menu opens, closes on route change, and on Escape.
- [ ] Hero text does not overlap the sample card.
- [ ] Bank filters wrap cleanly; the sort control remains reachable.
- [ ] Problem statement and side card stack correctly.
- [ ] Drill layout stacks; navigator and actions remain usable.
- [ ] Comparison table scrolls horizontally inside its container instead of breaking the page.
- [ ] Footer columns stack.
- [ ] Buttons meet a comfortable touch target (about 44 px high).
- [ ] Long LaTeX display equations scroll rather than clip.

---

## 7. Accessibility

- [ ] Skip link is the first focusable element and moves focus to `#main`.
- [ ] One `h1` per page.
- [ ] Landmarks: header, nav, main, footer.
- [ ] All icon-only buttons have an accessible name.
- [ ] Keyboard can reach every control; focus ring is visible.
- [ ] Modal traps focus and closes on Escape.
- [ ] Colour contrast is acceptable in light and dark themes.
- [ ] `prefers-reduced-motion` disables non-essential motion.
- [ ] Math is readable by assistive tech where possible; surrounding text carries the meaning.
- [ ] Form errors and status messages use `role="status"` or `aria-live` where appropriate.

---

## 8. Metadata and SEO

- [ ] Home title is `Lemma — AMO problem bank & proof training`.
- [ ] Sub-route titles use `Page — Lemma`.
- [ ] Description changes per route.
- [ ] Canonical URL matches the current path and production origin.
- [ ] `/progress`, `/review`, `/drill/*`, results, and 404 set `noindex, nofollow`.
- [ ] Open Graph and Twitter tags are present.
- [ ] `dist/sitemap.xml` contains public routes (including `/amo-papers`), 16 technique routes, and 248 problem routes.
- [ ] `dist/robots.txt` allows public pages and disallows private ones.
- [ ] `og.png` is 1200×630 and loads.
- [ ] Share preview looks correct in at least one unfurler.

---

## 9. Content quality

- [ ] Official Australian AMO questions are attributed to AMT, link to the official paper, and use Lemma-written outlines.
- [ ] No unauthorised paper text, logos, or organiser branding appears.
- [ ] Every problem is tagged to an existing technique.
- [ ] Every technique has at least one tagged problem.
- [ ] Every proof has four rubric points and either a model proof or a Lemma outline.
- [ ] Answers are canonical and render correctly.
- [ ] Competition facts link to official sources and carry the verification date.
- [ ] Independence disclaimer is visible on the home, AMO guide, about, and footer.

A quick data audit:

```bash
node -e "const d=require('./src/data/problems.json'); console.log('source',d.length); console.log(d.reduce((a,p)=>(a[p.type]=(a[p.type]||0)+1,a),{})); const ids=d.map(p=>p.id); console.log('unique',new Set(ids).size===ids.length)"
```

Expected: 192 source problems, unique ids, and a merged bank of 248 after the 16 Proof Lab prompts and 40 official AMO questions are added.

---

## 10. Performance

- [ ] Production JS and CSS are served from hashed `/assets/*` with immutable caching.
- [ ] `index.html` is not cached.
- [ ] First load completes without a long main-thread block on a mid-range device.
- [ ] Problem routes render within a frame after navigation.
- [ ] No network requests after load other than none (fonts are preloaded on first load).
- [ ] Lighthouse: performance, accessibility, best practices, and SEO are reviewed; record the numbers in the release notes.

---

## 11. Release sign-off

| Area | Pass | Notes |
| --- | --- | --- |
| Typecheck | ☐ | |
| Build | ☐ | |
| Route matrix | ☐ | |
| Answer flows | ☐ | |
| Drill lifecycle | ☐ | |
| Progress and import/export | ☐ | |
| Responsive 390/768/1024/1440 | ☐ | |
| Accessibility | ☐ | |
| Metadata and sitemap | ☐ | |
| Content policy | ☐ | |
| Live deep link | ☐ | |
| Live 404 | ☐ | |
