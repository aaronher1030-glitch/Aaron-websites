# Lemma — Implementation Plan

**Product:** Lemma, an independent AMO-family problem bank and training studio.
**Tagline:** *Proof is a muscle. Train it.*
**Stack:** Vite + React + TypeScript + KaTeX, static deployment on Cloudflare Pages.
**Source:** GitHub repository, production build in `dist/`.

---

## 1. Product decisions

### Positioning
- Lemma is **independent** and **not affiliated** with AMT, SIMCC, ASMO, or any AMO organiser.
- It trains the **AMO family**, not one contest: Australian AMO, American AMO (SIMCC), Asia AMO, ASMO, and PAMO.
- The 208 original problems are **written for Lemma** or user-supplied. The 40 official Australian AMO questions (2016–2020) are **transcribed with attribution** to AMT; outlines and rubrics are Lemma's own.
- The AMO Guide includes a source-linked comparison and a "last verified" date.

### Audience
- Strong students in Years 7–12 preparing for proof-based olympiads.
- Students preparing for short-answer AMO variants who want harder thinking.
- Coaches looking for a free, no-account problem bank.

### Core promise
> 248 olympiad problems (208 original plus 40 official Australian AMO questions), organized by 16 techniques, with worked solutions, timed drills, mistake review, and honest AMO guidance. No ads, no paywall, no account.

---

## 2. Feature set

| Area | Feature |
|---|---|
| Home | Editorial hero, answerable sample problem, AMO-family selector, live inventory stats, training loop, domain/technique previews, FAQ |
| Problem bank | Search, domain/skill/difficulty/type filters, live count, cards, deep links |
| Problem page | KaTeX statement, answer input, check, full solution, stash, retry, related problems |
| Practice builder | Presets (diagnostic, daily 5, proof paper, sprint, weak spots), filters, mode, timer, live count |
| Drill player | One-question-at-a-time, MCQ/int/proof types, flag, stash, timer, keyboard shortcuts, resume |
| Results | Score, accuracy, time, domain breakdown, per-question review, retry wrong |
| Techniques | 16 technique pages: big idea, when to use it, traps, checklist, drill CTA |
| AMO Guide | Comparison of five AMO competitions, formats, syllabus, study plan, sources, disclaimer |
| Progress | Accuracy, attempted, average time, domain/skill breakdown, streak, recent activity |
| Review | Wrong answers + stashed problems, retry as a set, clear history |
| System | Dark/light theme, localStorage persistence, JSON export/import, responsive, print styles, reduced motion |

---

## 3. Content model

```ts
type Domain = "Algebra" | "Number Theory" | "Combinatorics" | "Geometry";
type Difficulty = "Easy" | "Medium" | "Hard" | "Challenge";
type ProblemType = "int" | "mc" | "proof";

interface Problem {
  id: string;
  domain: Domain;
  skill: string;
  difficulty: Difficulty;
  type: ProblemType;
  stem: string;          // LaTeX inside $...$
  choices?: string[];
  answer: string;        // integer, choice letter, or proof reference
  explanation: string;
  rubric?: string[];     // proof self-assessment
}
```

- **192** problems extracted from the supplied Lemma bank.
- **16** new original proof-lab problems, one per technique → **208 original**.
- **40** official Australian AMO questions (2016–2020) → **248 total**.
- Choices use letters A–D; integer answers normalize whitespace, `+`, commas, fractions, and decimals.
- Proof answers are self-assessed against a rubric (no fake auto-grading).

---

## 4. Design system

- **Mood:** a mathematician's field notebook, not a corporate LMS.
- **Palette:** warm paper, deep ink, forest green, signal orange, ochre.
- **Type:** Fraunces (display serif), Inter (UI), JetBrains Mono (labels), KaTeX (math).
- **Form:** 1.5px ink borders, offset "slip" shadows, ruled-paper texture, numbered section labels, restrained motion.
- **Two surfaces:** editorial paper for browsing; a cleaner "exam slip" for active practice.
- **Responsive:** 3-column → 2-column → single column; mobile-first problem text at 17px+.
- **Accessibility:** skip link, semantic headings, visible focus, 44px targets, aria labels, keyboard answer selection, reduced-motion support.

---

## 5. Routes

```
/                         Home
/bank                     Problem bank
/problem/:id              Single problem
/practice                 Drill builder + presets
/drill/:id                Drill player
/drill/:id/results        Results + review
/progress                 Analytics
/review                   Mistakes + stashed
/techniques               Technique index
/techniques/:slug         Technique detail
/amo-guide                AMO comparison + study plan
/about                    Methodology, independence, sources
*                         Not found
```

Static host fallback: `public/_redirects` → `/* /index.html 200`.

---

## 6. Data + state

`localStorage` key `lemma:v1`:

```ts
interface Store {
  attempts: Attempt[];   // qid, correct, answer, ts, elapsedSec, mode
  drills: Drill[];       // qids, answers, checked, flags, index, timer, done
  stashed: string[];
  theme: "auto" | "light" | "dark";
  createdAt: number;
}
```

- Attempts are appended; analytics uses the latest attempt per question.
- Streak = consecutive days with at least one checked answer.
- Export/import JSON in Progress → Data.
- No accounts, no tracking, no network calls after load.

---

## 7. Build phases

### Phase 0 — Setup
- Scaffold Vite React TS, install `react-router-dom`, `katex`, `@types/katex`.
- Add fonts, favicon, `_redirects`, base meta.
- Convert extracted problems to typed JSON; add proof problems.
- **Exit:** `npm run build` clean.

### Phase 1 — Shell + design system
- CSS tokens, reset, typography, buttons, cards, forms, header/footer, theme toggle.
- Router, skip link, 404.
- **Exit:** every route renders with correct chrome; light/dark verified.

### Phase 2 — Bank + problem player
- Filters, search, counts, cards.
- `RichText` KaTeX renderer.
- Answer checking (MCQ/int), solution reveal, stash, related.
- **Exit:** all 248 problems render; answer logic tested on a sample of each type.

### Phase 3 — Practice loop
- Builder with presets, live count, smart selection (unseen/weak), timer.
- Drill player with navigation, flag, autosave, keyboard.
- Results, review, retry wrong.
- **Exit:** start → answer → finish → results → retry works and survives refresh.

### Phase 4 — Content pages
- 16 technique pages.
- AMO Guide comparison table and study plan.
- About/methodology/sources.
- **Exit:** every link resolves; sources and disclaimers visible.

### Phase 5 — Analytics + review
- Progress dashboard, domain/skill bars, streak, recent attempts.
- Review page combining wrong + stashed.
- Export/import.
- **Exit:** data updates from drills; empty states are clean.

### Phase 6 — QA
- Browser QA at 1440, 1024, 390 widths.
- Console/network clean, Lighthouse accessibility pass, keyboard test.
- Verify no horizontal overflow; check math rendering on all hard problems.
- **Exit:** screenshots reviewed; no blocker bugs.

### Phase 7 — Ship
- `npm run build`; preview `dist/`.
- Initialize git, commit, push to GitHub.
- Deploy to Cloudflare Pages with `wrangler pages deploy dist`.
- Verify production URL, routes, assets, and mobile.
- **Exit:** live URL + repo URL reported.

---

## 8. Acceptance criteria

- [x] 248 problems, all with answers and full solutions or Lemma outlines.
- [ ] KaTeX renders correctly in statements, choices, and explanations.
- [ ] Filters and search return correct counts.
- [ ] A drill can be created, resumed after refresh, finished, and reviewed.
- [ ] Wrong answers and stashed questions appear in Review.
- [ ] Analytics reflect actual attempts.
- [ ] AMO Guide distinguishes the five competitions and cites sources.
- [ ] Site is usable at 390px, 1024px, and 1440px.
- [ ] Production build deploys to Cloudflare Pages.
- [ ] Source is pushed to GitHub.

---

## 9. Risks / mitigations

| Risk | Mitigation |
|---|---|
| AMO rules change yearly | Date-stamp facts; link official sources; label "verify with organiser" |
| Copyright of official problems | Transcribe only publicly released papers, with attribution and a link; write Lemma's own outlines |
| Proof answers can't be auto-graded | Rubric-based self-assessment, clearly labelled |
| No auth for GitHub/Cloudflare | Prepare repo + build; request login only at deploy step |
| Subagent content errors | Treat research as leads; verify formats against official pages; spot-check math |

---

## 10. Definition of done

A student can land on Lemma, try a real problem, build a focused set, complete it, see what went wrong, and know what to drill next — without creating an account. The site is fast, readable on a phone, honest about what "AMO" means, and live on Cloudflare with public source on GitHub.
