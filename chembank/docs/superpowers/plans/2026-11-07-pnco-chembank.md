# ChemBank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a free, offline-capable PNCO/ACho chemistry reviewer with a verified question bank, practice and timed-paper modes, worked solutions, progress analytics, and mistake review, deployed as a static site on Cloudflare Pages.

**Architecture:** Fork the proven Lemma static SPA (Vite + React 19 + TypeScript + React Router + KaTeX) and replace its math content with chemistry content and a lab-notebook visual system. Content is generated offline from the user's DOCX papers and the ChemBank prototype, blind-verified by independent agents, validated at build time, and bundled as JSON. Progress is local-first; optional Supabase sync activates only when environment variables are present.

**Tech Stack:** Vite 8, React 19, TypeScript, React Router 7, KaTeX + mhchem, Vitest + React Testing Library, vite-plugin-pwa, Cloudflare Pages, optional Supabase.

**Spec:** `docs/superpowers/specs/2026-11-07-pnco-chembank-design.md`

## Global Constraints

- Never call the bank "official", "leaked", or endorsed by PFCS, PNCO, DepEd, ACheS, or Ateneo.
- Publish only questions whose answers have been independently re-solved and reconciled with the source key. Flagged items never appear in a published paper.
- All content is bundled at build time. No runtime API is required for questions, solutions, progress, or search.
- Local-first: the app must be fully usable with no account, no Supabase env vars, and no network after first load.
- No third-party fonts, analytics, trackers, ads, or remote scripts.
- Every page must work at 390 px, 1024 px, and 1440 px widths; keyboard-only operation is required.
- No secrets in the repository. Supabase anon key is public by design and only used with RLS.
- Node 22+; npm; Git Bash on Windows.
- Commit messages use conventional prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

---

## File Structure

```
chembank/
  package.json
  vite.config.ts
  vitest.config.ts
  tsconfig.json
  index.html
  wrangler.toml
  .env.example
  public/
    _redirects
    _headers
    favicon.svg
    icon.svg
    manifest.webmanifest
    offline.html
  content/
    raw/                      # pandoc output, committed for reproducibility
      ch1-3.md
      ch4-7.md
    source/
      chembank-accounts.html  # user-supplied prototype
    scripts/
      extract_docx.py
      extract_prototype.mjs
      merge.mjs
      make-batches.mjs
      apply-verification.mjs
      validate.mjs
    verification/
      results/                # blind-solve outputs, one JSON per batch
      ledger.json             # source key vs verified key vs corrections
    docx.raw.json             # generated
    prototype.raw.json        # generated
    audit.json                # generated
  src/
    main.tsx
    App.tsx
    config.ts
    data/
      types.ts
      topics.ts
      questions.json          # generated from content/
      questions.ts
      notes.ts
      lab.ts
      formulas.ts
      periodic.ts
      guide.ts
    components/
      SiteLayout.tsx
      Logo.tsx
      ThemeToggle.tsx
      PageMeta.tsx
      RichText.tsx
      Tex.tsx
      ChoiceList.tsx
      QuestionCard.tsx
      QuestionMap.tsx
      AccountMenu.tsx
      ui.tsx
      Icon.tsx
    lib/
      answer.ts
      drill.ts
      select.ts
      review.ts
      stats.ts
      supabase.ts
      format.ts
    store.tsx
    pages/
      Home.tsx
      Bank.tsx
      QuestionPage.tsx
      Practice.tsx
      Drill.tsx
      Results.tsx
      Progress.tsx
      Review.tsx
      Notes.tsx
      NotePage.tsx
      Lab.tsx
      LabPage.tsx
      Formulas.tsx
      PeriodicTable.tsx
      Guide.tsx
      About.tsx
      NotFound.tsx
    styles/
      tokens.css
      base.css
      components.css
      pages.css
      responsive.css
  tests/
    setup.ts
    answer.test.ts
    content-docx.test.ts
    content-prototype.test.ts
    content-bank.test.ts
    select.test.ts
    drill.test.ts
    review.test.ts
    rich-text.test.tsx
    pages.test.tsx
    sync.test.ts
  scripts/
    generate-seo.mjs
  .github/workflows/ci.yml
```

---

### Task 1: Scaffold the static app, shell, and CI

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.nvmrc`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/components/SiteLayout.tsx`, `src/components/Logo.tsx`, `src/components/ThemeToggle.tsx`, `public/_redirects`, `public/_headers`, `public/favicon.svg`, `wrangler.toml`, `.github/workflows/ci.yml`, `tests/setup.ts`
- Test: `tests/pages.test.tsx`

**Interfaces:**
- Produces: `SiteLayout` (renders header/nav/footer around `<Outlet />`), `ThemeToggle`, CSS tokens (`--paper`, `--ink`, `--cobalt`, `--copper`, `--acid`, `--hazard`, `--rule`, `--surface`, `--surface-2`), route table.

- [ ] **Step 1: Create `package.json` and install**

```json
{
  "name": "chembank",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Free, independent PNCO/ACho chemistry reviewer.",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && node scripts/generate-seo.mjs",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "content:docx": "python -X utf8 content/scripts/extract_docx.py",
    "content:prototype": "node content/scripts/extract_prototype.mjs",
    "content:merge": "node content/scripts/merge.mjs",
    "content:validate": "node content/scripts/validate.mjs",
    "content:batches": "node content/scripts/make-batches.mjs",
    "content:apply": "node content/scripts/apply-verification.mjs",
    "seo": "node scripts/generate-seo.mjs",
    "deploy": "npm run build && npx --yes wrangler pages deploy dist --project-name chembank"
  }
}
```

Run:

```bash
npm install react react-dom react-router-dom katex @supabase/supabase-js
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/katex vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-plugin-pwa @fontsource/instrument-serif @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

If `@fontsource/instrument-serif` does not resolve, use `@fontsource/fraunces` and replace the display font import in `src/styles/base.css`.

- [ ] **Step 2: Add Vite, TypeScript, and test config**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { target: "es2022" },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    globals: true,
  },
});
```

`tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Implement the shell and design tokens**

`src/styles/tokens.css`:

```css
:root {
  --paper: #f4f1e8;
  --paper-deep: #ebe5d6;
  --ink: #141414;
  --muted: #5c5a52;
  --cobalt: #1f3a8a;
  --copper: #b45309;
  --acid: #2f6b4f;
  --hazard: #b42318;
  --rule: #d8d2c4;
  --surface: #fffdf7;
  --surface-2: #f8f4e9;
  --radius: 14px;
  --shadow: 4px 4px 0 rgba(20, 20, 20, 0.08);
  --font-display: "Instrument Serif", Georgia, serif;
  --font-ui: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

:root[data-theme="dark"] {
  --paper: #121212;
  --paper-deep: #1b1b1b;
  --ink: #f2eee4;
  --muted: #b7b0a3;
  --cobalt: #8ba3ff;
  --copper: #f2b544;
  --acid: #7bc59a;
  --hazard: #ff8a80;
  --rule: #33312c;
  --surface: #1a1a18;
  --surface-2: #22211e;
  --shadow: 4px 4px 0 rgba(0, 0, 0, 0.35);
}
```

`src/components/SiteLayout.tsx`:

```tsx
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  ["/bank", "Bank"],
  ["/practice", "Practice"],
  ["/review", "Review"],
  ["/notes", "Notes"],
  ["/lab", "Lab"],
  ["/progress", "Progress"],
] as const;

export function SiteLayout() {
  return (
    <div className="site">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <NavLink to="/" aria-label="ChemBank home"><Logo /></NavLink>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <NavLink className="nav-more" to="/formulas">Formulas</NavLink>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="site-main"><Outlet /></main>
      <footer className="site-footer">
        <p>Independent reviewer. Not affiliated with PFCS, PNCO, DepEd, ACheS, or Ateneo.</p>
        <p><NavLink to="/about">Methodology and corrections</NavLink></p>
      </footer>
    </div>
  );
}
```

`src/App.tsx` starts with placeholder pages for every route; later tasks replace them:

```tsx
import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";

function Placeholder({ name }: { name: string }) {
  return <section className="page"><h1>{name}</h1><p>Coming online.</p></section>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Placeholder name="ChemBank" />} />
        <Route path="bank" element={<Placeholder name="Question bank" />} />
        <Route path="q/:id" element={<Placeholder name="Question" />} />
        <Route path="practice" element={<Placeholder name="Practice" />} />
        <Route path="drill/:id" element={<Placeholder name="Drill" />} />
        <Route path="drill/:id/results" element={<Placeholder name="Results" />} />
        <Route path="progress" element={<Placeholder name="Progress" />} />
        <Route path="review" element={<Placeholder name="Review" />} />
        <Route path="notes" element={<Placeholder name="Notes" />} />
        <Route path="notes/:slug" element={<Placeholder name="Note" />} />
        <Route path="lab" element={<Placeholder name="Lab bench" />} />
        <Route path="lab/:slug" element={<Placeholder name="Lab technique" />} />
        <Route path="formulas" element={<Placeholder name="Formula sheet" />} />
        <Route path="periodic-table" element={<Placeholder name="Periodic table" />} />
        <Route path="guide" element={<Placeholder name="PNCO guide" />} />
        <Route path="about" element={<Placeholder name="About" />} />
        <Route path="*" element={<Placeholder name="Not found" />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Write the failing shell test**

`tests/pages.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

test("renders the shell and primary navigation", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  expect(screen.getByText(/Independent reviewer/)).toBeInTheDocument();
});
```

Run `npm test -- --run`; it should pass once the shell exists.

- [ ] **Step 5: Add host config and CI**

`public/_redirects`:

```
/* /index.html 200
```

`public/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; script-src 'self'; connect-src 'self' https://*.supabase.co

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

`.github/workflows/ci.yml`:

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:run
      - run: npm run build
```

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run test:run
npm run build
git add package.json package-lock.json index.html vite.config.ts vitest.config.ts tsconfig.json .nvmrc src public wrangler.toml .github tests
git commit -m "feat: scaffold ChemBank shell and static build"
```

---

### Task 2: Chemistry schema, seed bank, and answer logic

**Files:**
- Create: `src/data/types.ts`, `src/data/topics.ts`, `src/data/questions.json` (5 seed items), `src/data/questions.ts`, `src/lib/answer.ts`, `src/lib/format.ts`
- Test: `tests/answer.test.ts`, `tests/content-bank.test.ts`

**Interfaces:**
- Produces:
  - `DOMAINS`, `DIFFICULTIES`, `SOURCES`, `Domain`, `Difficulty`, `SourceKind`, `Question`, `Attempt`, `Drill`, `ReviewItem`, `Store`.
  - `QUESTIONS: Question[]`, `QUESTION_BY_ID: Map<string, Question>`, `TOPICS`, `TOPIC_BY_SLUG`, `isCorrect(q, letter)`, `choiceLetter(index)`, `formatDuration(seconds)`, `normalizeText(s)`.
  - `Question.answer` is `0 | 1 | 2 | 3`; UI stores the letter `"A" | "B" | "C" | "D"`.

- [ ] **Step 1: Write the types**

`src/data/types.ts`:

```ts
export const DOMAINS = ["General", "Physical", "Analytical", "Organic", "Laboratory"] as const;
export type Domain = (typeof DOMAINS)[number];

export const DIFFICULTIES = ["Foundation", "Standard", "Olympiad"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SOURCES = ["supplied-paper", "textbook", "mixed", "gap-fill"] as const;
export type SourceKind = (typeof SOURCES)[number];

export type PaperId = "ch1-3-theory" | "ch1-3-lab" | "ch4-7-theory" | "ch4-7-lab" | "mixed-practice";

export interface Question {
  id: string;
  domain: Domain;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  source: SourceKind;
  paper?: PaperId;
  tags?: string[];
  verified: { status: "verified" | "flagged"; reviewedAt: string; note?: string };
  corrections?: string[];
}

export interface Attempt {
  qid: string;
  correct: boolean;
  answer: string;
  ts: number;
  elapsedSec: number;
  mode: "practice" | "timed" | "single";
}

export interface Drill {
  id: string;
  name: string;
  mode: "practice" | "timed";
  qids: string[];
  answers: Record<string, string>;
  checked: Record<string, boolean>;
  flagged: Record<string, boolean>;
  strikes: Record<string, string[]>;
  index: number;
  limitSec: number;
  elapsedSec: number;
  startedAt: number;
  finishedAt?: number;
  done: boolean;
}

export interface ReviewItem {
  qid: string;
  dueAt: number;
  step: number;
  lastSeen: number;
}

export interface Store {
  version: 1;
  attempts: Attempt[];
  drills: Drill[];
  review: ReviewItem[];
  stashed: string[];
  theme: "auto" | "light" | "dark";
  createdAt: number;
}
```

- [ ] **Step 2: Write the seed questions and loader**

Create `src/data/questions.json` with five real items, one per domain. Example item:

```json
{
  "id": "seed-gas-001",
  "domain": "Physical",
  "chapter": 5,
  "topic": "Gases",
  "difficulty": "Standard",
  "stem": "What is the density of $\\ce{CO2}$ at $750\\ \\mathrm{mmHg}$ and $27^{\\circ}\\mathrm{C}$? Use $R=0.08206\\ \\mathrm{L\\,atm\\,mol^{-1}\\,K^{-1}}$.",
  "choices": ["$1.42\\ \\mathrm{g/L}$", "$1.76\\ \\mathrm{g/L}$", "$2.24\\ \\mathrm{g/L}$", "$3.10\\ \\mathrm{g/L}$"],
  "answer": 1,
  "explanation": "$T=300.15\\ \\mathrm{K}$, $P=750/760=0.9868\\ \\mathrm{atm}$. Density $=PM/RT=(0.9868)(44.01)/(0.08206)(300.15)=1.76\\ \\mathrm{g/L}$.",
  "source": "gap-fill",
  "tags": ["calculation"],
  "verified": { "status": "verified", "reviewedAt": "2026-11-07" }
}
```

Add four more: a significant-figures item (General), a titration mole-ratio item (Analytical), a functional-group item (Organic), and a burette-reading item (Laboratory). Each must have four choices and a worked explanation.

`src/data/questions.ts`:

```ts
import raw from "./questions.json";
import type { Domain, Question } from "./types";

export const QUESTIONS = raw as Question[];
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const DOMAIN_COUNTS = QUESTIONS.reduce<Record<Domain, number>>(
  (acc, q) => { acc[q.domain] += 1; return acc; },
  { General: 0, Physical: 0, Analytical: 0, Organic: 0, Laboratory: 0 },
);

export const QUESTION_COUNT = QUESTIONS.length;
export function questionsForPaper(paper: string) {
  return QUESTIONS.filter((q) => q.paper === paper);
}
```

- [ ] **Step 3: Write answer checking and formatting**

`src/lib/answer.ts`:

```ts
import type { Question } from "../data/types";

export function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function isCorrect(question: Question, value: string): boolean {
  return value.trim().toUpperCase() === choiceLetter(question.answer);
}

export function correctLetter(question: Question): string {
  return choiceLetter(question.answer);
}
```

`src/lib/format.ts`:

```ts
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function percent(correct: number, attempted: number): number | null {
  return attempted === 0 ? null : Math.round((correct / attempted) * 100);
}
```

- [ ] **Step 4: Write the failing tests**

`tests/answer.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { choiceLetter, isCorrect } from "../src/lib/answer";
import type { Question } from "../src/data/types";

const q = { answer: 1 } as Question;

describe("answer checking", () => {
  test("accepts the correct letter in any case", () => {
    expect(isCorrect(q, "b")).toBe(true);
    expect(isCorrect(q, " B ")).toBe(true);
  });
  test("rejects other letters", () => {
    expect(isCorrect(q, "A")).toBe(false);
    expect(isCorrect(q, "")).toBe(false);
  });
  test("maps indexes to letters", () => {
    expect(choiceLetter(0)).toBe("A");
    expect(choiceLetter(3)).toBe("D");
  });
});
```

`tests/content-bank.test.ts`:

```ts
import { expect, test } from "vitest";
import { QUESTIONS } from "../src/data/questions";

test("the seed bank is structurally valid", () => {
  expect(QUESTIONS.length).toBeGreaterThanOrEqual(5);
  for (const q of QUESTIONS) {
    expect(q.id).toMatch(/^[a-z0-9-]+$/);
    expect(q.choices).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThanOrEqual(3);
    expect(q.explanation.trim().length).toBeGreaterThan(20);
    expect(q.stem.trim().length).toBeGreaterThan(10);
    expect(q.verified.status).toBe("verified");
  }
});
```

Run `npm test -- --run` and fix until green.

- [ ] **Step 5: Commit**

```bash
git add src/data src/lib tests/answer.test.ts tests/content-bank.test.ts
git commit -m "feat: add chemistry question schema and answer logic"
```

---

### Task 3: Extract the four DOCX papers

**Files:**
- Create: `content/raw/ch1-3.md`, `content/raw/ch4-7.md` (copy the already-converted pandoc output), `content/scripts/extract_docx.py`
- Generate: `content/docx.raw.json`
- Test: `tests/content-docx.test.ts`

**Interfaces:**
- Produces: `content/docx.raw.json` with 200 records:
  ```ts
  {
    id: string; paper: PaperId; number: number; section: string;
    stem: string; choices: [string,string,string,string];
    sourceKey: "A"|"B"|"C"|"D"; explanation: string;
    flags: string[]; sourceFile: string;
  }
  ```

**Parsing rules:**
- Each markdown file contains two 50-item papers. Split at `**Answer Key` headings.
- Question starts: `**N.**` or `**N. Title:**` at the start of a line.
- Choices are inline or split across lines; the first marker may be escaped by pandoc as `A\)`. Split on `(^|\s)([A-D])\\?[\).]\s`.
- Display math is fenced ` ``` math ... ``` `; convert to `$$...$$`.
- Pandoc inline math is `` $`...`$ ``; convert to `$...$`.
- Answer key entries: `N.  **A**` followed by explanation lines until the next entry.
- Map keys by question number within each paper.
- Flag an item when the explanation contains `Wait`, `check`, `Correct option`, `Correct Choice`, `Key fix`, `should be`, `re-verify`, `approx`, or a letter different from the key.

- [ ] **Step 1: Copy the converted markdown**

```bash
mkdir -p content/raw
cp "../content/raw/ch1-3.md" content/raw/ch1-3.md
cp "../content/raw/ch4-7.md" content/raw/ch4-7.md
```

The copied files are the committed source of record; the Python script can regenerate them with pandoc if `PANDOC` is set.

- [ ] **Step 2: Implement the parser**

`content/scripts/extract_docx.py` core:

```python
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"

def clean_math(text: str) -> str:
    text = re.sub(r"```\s*math\s*\n(.*?)\n```", lambda m: f"$${m.group(1).strip()}$$", text, flags=re.S)
    text = re.sub(r"\$`(.*?)`\$", lambda m: f"${m.group(1).strip()}$", text, flags=re.S)
    return text

def split_choices(body: str):
    marks = list(re.finditer(r"(?:^|\s)([A-D])\\?[\).]\s", body))
    if len(marks) != 4:
        return None, []
    stem = body[:marks[0].start()].strip()
    choices = []
    for i, mark in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
        choices.append(body[mark.end():end].strip())
    return stem, choices

def parse_paper(md: str, paper: str, source_file: str):
    qpart, keypart = md.split("**Answer Key", 1)
    starts = list(re.finditer(r"(?m)^\*\*(\d+)\.(?:\*\*|\s)", qpart))
    questions = []
    for i, start in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(qpart)
        body = qpart[start.end():end].strip()
        stem, choices = split_choices(body)
        if not choices:
            continue
        questions.append({
            "id": f"{paper}-{int(start.group(1)):02d}",
            "paper": paper,
            "number": int(start.group(1)),
            "stem": clean_math(stem),
            "choices": [clean_math(c) for c in choices],
            "sourceFile": source_file,
            "flags": [],
        })
    key_text = clean_math(keypart)
    entries = list(re.finditer(r"(?m)^(\d+)\.\s+\*\*([A-D])\*\*", key_text))
    for i, entry in enumerate(entries):
        end = entries[i + 1].start() if i + 1 < len(entries) else len(key_text)
        explanation = key_text[entry.end():end].strip()
        number = int(entry.group(1))
        target = next((q for q in questions if q["number"] == number), None)
        if not target:
            continue
        target["sourceKey"] = entry.group(2)
        target["explanation"] = explanation
        if re.search(r"wait|check|correct option|correct choice|key fix|re-verify|approx|should be", explanation, re.I):
            target["flags"].append("key-commentary")
        claimed = re.findall(r"correct option:?\s*\*{0,2}([A-D])|correct choice:?\s*\*{0,2}([A-D])", explanation, re.I)
        for pair in claimed:
            letter = next((x for x in pair if x), None)
            if letter and letter != target["sourceKey"]:
                target["flags"].append(f"claimed-{letter}")
    return questions

papers = [
    ("ch1-3.md", "ch1-3-theory", 0),
    ("ch1-3.md", "ch1-3-lab", 1),
    ("ch4-7.md", "ch4-7-theory", 0),
    ("ch4-7.md", "ch4-7-lab", 1),
]
out = []
for filename, paper, key_index in papers:
    text = (RAW / filename).read_text(encoding="utf-8")
    parts = text.split("**Answer Key")
    if len(parts) < 2:
        sys.exit(f"no answer key in {filename}")
    if key_index == 0:
        out.extend(parse_paper(parts[0] + "**Answer Key" + parts[1], paper, filename))
    else:
        out.extend(parse_paper(parts[1] + "**Answer Key" + parts[2], paper, filename))

(ROOT / "docx.raw.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {len(out)} questions")
```

Note: the exact split logic may need adjustment after inspecting the two files; the test below is the contract.

- [ ] **Step 3: Write the contract test**

`tests/content-docx.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const items = JSON.parse(readFileSync("content/docx.raw.json", "utf8"));

test("extracts four complete 50-item papers", () => {
  expect(items).toHaveLength(200);
  for (const paper of ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"]) {
    expect(items.filter((q: any) => q.paper === paper)).toHaveLength(50);
  }
});

test("every question has four choices, a key, and an explanation", () => {
  for (const q of items) {
    expect(q.choices).toHaveLength(4);
    expect(q.sourceKey).toMatch(/^[A-D]$/);
    expect(q.stem.length).toBeGreaterThan(10);
    expect(q.explanation.length).toBeGreaterThan(20);
  }
});

test("known contradictory keys are flagged", () => {
  expect(items.filter((q: any) => q.flags.length > 0).length).toBeGreaterThan(10);
});
```

- [ ] **Step 4: Run and fix**

```bash
npm run content:docx
npm test -- --run tests/content-docx.test.ts
```

Expected: 200 records; four papers of 50; at least 10 flagged.

- [ ] **Step 5: Commit**

```bash
git add content/raw content/scripts/extract_docx.py content/docx.raw.json tests/content-docx.test.ts
git commit -m "feat: parse the four supplied practice papers"
```

---

### Task 4: Import the ChemBank prototype bank

**Files:**
- Create: `content/source/chembank-accounts.html` (copy from the zip), `content/scripts/extract_prototype.mjs`
- Generate: `content/prototype.raw.json`
- Test: `tests/content-prototype.test.ts`

**Interfaces:**
- Produces 234 records: 80 mixed, 50 practice, 104 textbook.
- Raw tuple mappings (verified from the prototype):
  - `raw`: `[domain, topic, tier, difficulty, stem, choices, answerIndex, explanation]`
  - `RP`: `[domain, topic, difficulty, stem, choices, answerIndex, explanation]`
  - `LQ`: `[sectionCode, difficulty, stem, choices, answerIndex, explanation]`

- [ ] **Step 1: Copy the prototype source**

```bash
mkdir -p content/source
cd ../ && python -X utf8 -c "import zipfile; zipfile.ZipFile('files (2).zip').extract('chembank-accounts.html', 'WEBSITES/chembank/content/source')" && cd chembank
```

- [ ] **Step 2: Implement the extractor**

`content/scripts/extract_prototype.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("content/source/chembank-accounts.html", "utf8");

function grab(name) {
  const start = html.indexOf(`const ${name}=[`);
  if (start < 0) throw new Error(`missing ${name}`);
  const open = html.indexOf("[", start);
  let depth = 0;
  for (let i = open; i < html.length; i += 1) {
    if (html[i] === "[") depth += 1;
    else if (html[i] === "]") {
      depth -= 1;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced ${name}`);
}

function evaluate(name) {
  return vm.runInNewContext(`(${grab(name)})`, Object.create(null));
}

const raw = evaluate("raw");
const rp = evaluate("RP");
const lq = evaluate("LQ");
const sec = evaluate("SEC");
const sectionTitle = new Map(sec.map((s) => [s.n, s.t]));

const domainMap = { G: "General", R: "Physical", A: "Analytical", O: "Organic", M: "Laboratory" };
const diffMap = { E: "Foundation", M: "Standard", H: "Olympiad" };

const out = [
  ...raw.map((r, i) => ({
    id: `proto-mixed-${String(i + 1).padStart(3, "0")}`,
    source: "mixed",
    domain: domainMap[r[0]] ?? "General",
    topic: r[1],
    difficulty: diffMap[r[3]] ?? "Standard",
    stem: r[4],
    choices: r[5],
    answer: r[6],
    explanation: r[7],
  })),
  ...rp.map((r, i) => ({
    id: `proto-practice-${String(i + 1).padStart(3, "0")}`,
    source: "textbook",
    domain: domainMap[r[0]] ?? "General",
    topic: r[1],
    difficulty: diffMap[r[2]] ?? "Standard",
    stem: r[3],
    choices: r[4],
    answer: r[5],
    explanation: r[6],
  })),
  ...lq.map((r, i) => ({
    id: `proto-textbook-${String(i + 1).padStart(3, "0")}`,
    source: "textbook",
    domain: "General",
    topic: sectionTitle.get(r[0]) ?? "Chapter 1–2 foundations",
    difficulty: diffMap[r[1]] ?? "Foundation",
    stem: r[2],
    choices: r[3],
    answer: r[4],
    explanation: r[5],
  })),
];

writeFileSync("content/prototype.raw.json", JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} questions`);
```

- [ ] **Step 3: Write the contract test**

`tests/content-prototype.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const items = JSON.parse(readFileSync("content/prototype.raw.json", "utf8"));

test("imports all three arrays", () => {
  expect(items).toHaveLength(234);
  expect(items.filter((q: any) => q.source === "mixed")).toHaveLength(80);
  expect(items.filter((q: any) => q.id.startsWith("proto-practice"))).toHaveLength(50);
  expect(items.filter((q: any) => q.id.startsWith("proto-textbook"))).toHaveLength(104);
});

test("every prototype item is a complete MCQ", () => {
  for (const q of items) {
    expect(q.choices).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThanOrEqual(3);
    expect(q.stem.length).toBeGreaterThan(5);
    expect(q.explanation.length).toBeGreaterThan(10);
  }
});
```

- [ ] **Step 4: Run and commit**

```bash
npm run content:prototype
npm test -- --run tests/content-prototype.test.ts
git add content/source content/scripts/extract_prototype.mjs content/prototype.raw.json tests/content-prototype.test.ts
git commit -m "feat: import the ChemBank prototype question bank"
```

---

### Task 5: Merge, blind-verify, and publish the bank

**Files:**
- Create: `content/scripts/merge.mjs`, `content/scripts/make-batches.mjs`, `content/scripts/apply-verification.mjs`, `content/scripts/validate.mjs`, `content/verification/README.md`
- Generate: `content/candidates.json`, `content/verification/batches/*.json`, `content/verification/ledger.json`, `content/audit.json`, `src/data/questions.json`
- Test: `tests/content-bank.test.ts` (extend)

**Interfaces:**
- `merge.mjs` reads `docx.raw.json` + `prototype.raw.json`, normalizes provenance, maps topics/chapters, dedupes, and writes `content/candidates.json`.
- `make-batches.mjs` writes batches of 20 with `{id, stem, choices}` only, no keys.
- Blind-solve result schema:
  ```json
  {
    "id": "ch1-3-theory-01",
    "answer": "B",
    "confidence": "high",
    "work": "short calculation",
    "ambiguous": false,
    "cleanExplanation": "optional rewritten solution"
  }
  ```
- `apply-verification.mjs` compares `sourceKey` and blind answer:
  - agree → `verified`
  - differ → look for `content/verification/results/adjudication-*.json`; if the adjudicated answer matches one of them, use it; otherwise `flagged`
  - copy `cleanExplanation` when present
  - write `ledger.json` and `audit.json`
- `validate.mjs` enforces all invariants and copies the verified bank to `src/data/questions.json`.

- [ ] **Step 1: Implement normalization and dedupe**

`content/scripts/merge.mjs` core:

```js
import { readFileSync, writeFileSync } from "node:fs";

const docx = JSON.parse(readFileSync("content/docx.raw.json", "utf8"));
const proto = JSON.parse(readFileSync("content/prototype.raw.json", "utf8"));

const chapterByPaper = { "ch1-3-theory": 1, "ch1-3-lab": 1, "ch4-7-theory": 4, "ch4-7-lab": 4 };
const topicBySection = [
  [/matter|measurement|density|significant|unit/i, "Measurement and units"],
  [/atomic|isotope|nuclear|subatomic/i, "Atomic structure"],
  [/nomenclature|formula|name/i, "Nomenclature"],
  [/mole|stoichiometr|empirical|yield|limiting/i, "Stoichiometry"],
  [/aqueous|precipitat|redox|titrat|gravimetr|solution/i, "Aqueous reactions"],
  [/gas|effusion|pressure|kinetic/i, "Gases"],
  [/thermo|calorim|enthalpy|hess/i, "Thermochemistry"],
  [/quantum|electronic|periodic|spectro|flame|beer/i, "Electronic structure and spectroscopy"],
  [/organic|functional|isomer|stereo/i, "Organic chemistry"],
  [/equilibri|acid|base|ph|buffer/i, "Equilibrium and acid–base"],
  [/kinetic|rate|arrhenius/i, "Kinetics"],
  [/electrochem|cell|emf|nernst/i, "Electrochemistry"],
  [/lab|apparatus|burette|pipette|filtration|error/i, "Laboratory technique"],
];

function topicFor(text) {
  return topicBySection.find(([re]) => re.test(text))?.[1] ?? "General chemistry";
}

function normalizeStem(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\$[^$]*\$/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

const candidates = [];
for (const q of docx) {
  candidates.push({
    ...q,
    source: "supplied-paper",
    domain: q.paper.includes("lab") ? "Laboratory" : topicFor(q.section ?? q.stem),
    chapter: chapterByPaper[q.paper],
    topic: topicFor(q.section ?? q.stem),
    difficulty: q.paper.includes("lab") ? "Olympiad" : "Standard",
  });
}
for (const q of proto) {
  candidates.push({
    ...q,
    paper: q.source === "textbook" ? undefined : "mixed-practice",
    chapter: q.topic.startsWith("Chapter 1") || q.topic.startsWith("Chapter 2") ? 1 : undefined,
  });
}

const seen = new Map();
for (const q of candidates) {
  const key = normalizeStem(q.stem).slice(0, 120);
  const existing = seen.get(key);
  if (!existing) {
    seen.set(key, q);
  } else {
    existing.source = existing.source === q.source ? existing.source : "mixed";
    existing.tags = [...new Set([...(existing.tags ?? []), ...(q.tags ?? []), "merged"])];
  }
}

const unique = [...seen.values()].map((q, i) => ({
  ...q,
  id: q.id ?? `q-${String(i + 1).padStart(3, "0")}`,
  verified: { status: "flagged", reviewedAt: "2026-11-07" },
}));

writeFileSync("content/candidates.json", JSON.stringify(unique, null, 2));
console.log(`candidates: ${candidates.length}; unique: ${unique.length}`);
```

- [ ] **Step 2: Implement batch generation**

`content/scripts/make-batches.mjs`:

```js
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const items = JSON.parse(readFileSync("content/candidates.json", "utf8"));
const dir = "content/verification/batches";
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

for (let i = 0; i < items.length; i += 20) {
  const batch = items.slice(i, i + 20).map(({ id, stem, choices }) => ({ id, stem, choices }));
  const name = `batch-${String(i / 20 + 1).padStart(2, "0")}.json`;
  writeFileSync(`${dir}/${name}`, JSON.stringify(batch, null, 2));
}
console.log(`wrote ${Math.ceil(items.length / 20)} batches`);
```

**Blind-solve prompt for each batch (run with independent subagents):**

```text
You are solving chemistry multiple-choice questions without an answer key.
For each item, reason from the stem and choices, then return ONLY a JSON array:
[{"id":"...","answer":"A|B|C|D","confidence":"high|medium|low","work":"2-4 sentences with the key calculation or reasoning","ambiguous":false,"cleanExplanation":"a clean 2-4 sentence worked solution suitable for a student"}]
Rules: do not guess from answer patterns; mark ambiguous true if more than one choice is defensible; keep chemistry notation in plain text or $...$ LaTeX; do not add commentary outside the JSON.
```

Store each response as `content/verification/results/<batch-name>.json`.

- [ ] **Step 3: Apply verification and validate**

`content/scripts/apply-verification.mjs` core:

```js
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const candidates = JSON.parse(readFileSync("content/candidates.json", "utf8"));
const results = {};
for (const file of readdirSync("content/verification/results")) {
  if (!file.endsWith(".json") || file.startsWith("adjudication-")) continue;
  for (const row of JSON.parse(readFileSync(`content/verification/results/${file}`, "utf8"))) {
    results[row.id] = row;
  }
}

const adjudication = {};
for (const file of readdirSync("content/verification/results")) {
  if (!file.startsWith("adjudication-")) continue;
  for (const row of JSON.parse(readFileSync(`content/verification/results/${file}`, "utf8"))) {
    adjudication[row.id] = row;
  }
}

const ledger = [];
const final = [];
for (const q of candidates) {
  const blind = results[q.id];
  const sourceKey = q.sourceKey ?? q.sourceKeyFromChoices;
  const adjudged = adjudication[q.id];
  let status = "flagged";
  let answer = blind?.answer;
  let note;
  if (blind && sourceKey && blind.answer === sourceKey && !blind.ambiguous) {
    status = "verified";
  } else if (adjudged?.answer) {
    answer = adjudged.answer;
    status = adjudged.status ?? "verified";
    note = `source key ${sourceKey}; blind ${blind?.answer}; adjudicated ${adjudged.answer}`;
  }
  const index = "ABCD".indexOf(answer ?? "");
  if (index >= 0) {
    final.push({
      ...q,
      answer: index,
      explanation: blind?.cleanExplanation || q.explanation,
      verified: { status, reviewedAt: "2026-11-07", note },
    });
  }
  ledger.push({ id: q.id, sourceKey, blind: blind?.answer, adjudicated: adjudged?.answer, status, note });
}

writeFileSync("content/verification/ledger.json", JSON.stringify(ledger, null, 2));
writeFileSync("content/audit.json", JSON.stringify({
  total: final.length,
  verified: final.filter((q) => q.verified.status === "verified").length,
  flagged: final.filter((q) => q.verified.status === "flagged").length,
  corrections: ledger.filter((r) => r.sourceKey && r.blind && r.sourceKey !== r.blind).length,
}, null, 2));
writeFileSync("src/data/questions.json", JSON.stringify(final.filter((q) => q.verified.status === "verified"), null, 2));
console.log(`published ${final.filter((q) => q.verified.status === "verified").length}`);
```

`content/scripts/validate.mjs` must reject:

- fewer than 350 published questions;
- duplicate IDs;
- missing/empty fields;
- not exactly four choices;
- answer outside 0–3;
- `flagged` items inside a `paper`;
- leftover `/wait|check|correct option|correct choice|key fix|re-verify/i` in explanations;
- malformed math (`$` count odd, unclosed `\ce{`);
- source/paper fields outside the allowed sets.

It writes `src/data/questions.json` only after all checks pass.

- [ ] **Step 4: Extend the bank test**

`tests/content-bank.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
const audit = JSON.parse(readFileSync("content/audit.json", "utf8"));

test("publishes a verified bank of at least 350 items", () => {
  expect(bank.length).toBeGreaterThanOrEqual(350);
  expect(audit.flagged).toBeGreaterThanOrEqual(0);
});

test("every published item is complete and unique", () => {
  const ids = new Set<string>();
  for (const q of bank) {
    expect(ids.has(q.id)).toBe(false);
    ids.add(q.id);
    expect(q.choices).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThanOrEqual(3);
    expect(q.verified.status).toBe("verified");
    expect(q.explanation).not.toMatch(/wait|correct option|key fix|re-verify/i);
  }
});

test("all four supplied papers are represented and complete", () => {
  for (const paper of ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"]) {
    const items = bank.filter((q: any) => q.paper === paper);
    expect(items.length).toBe(50);
    expect(items.every((q: any) => q.verified.status === "verified")).toBe(true);
  }
});
```

- [ ] **Step 5: Run the full verification pass**

1. `npm run content:merge`
2. `npm run content:batches`
3. Dispatch independent subagents on each batch file; save JSON responses to `content/verification/results/`.
4. For every disagreement, dispatch a second adjudication agent; save `adjudication-XX.json`.
5. `npm run content:apply`
6. `npm run content:validate`
7. `npm test -- --run tests/content-bank.test.ts`

If fewer than 350 items survive, inspect `content/audit.json`, fix parse/merge issues, and re-run. Do not lower the bar by publishing flagged items.

- [ ] **Step 6: Commit**

```bash
git add content/scripts content/verification content/candidates.json content/audit.json src/data/questions.json tests/content-bank.test.ts
git commit -m "feat: verify and publish the chemistry question bank"
```

---

### Task 6: Rich chemistry rendering and UI primitives

**Files:**
- Create: `src/components/Tex.tsx`, `src/components/RichText.tsx`, `src/components/ChoiceList.tsx`, `src/components/ui.tsx`, `src/components/Icon.tsx`
- Test: `tests/rich-text.test.tsx`

**Interfaces:**
- `RichText({ text, className })` renders the safe HTML subset and `$...$` / `$$...$$` math.
- `Tex({ children, display })` renders bare LaTeX with mhchem enabled.
- `ChoiceList({ question, value, onChange, checked, strikes, onStrike })` renders A–D radio cards.
- `DomainBadge`, `DifficultyBadge`, `SourceBadge`, `VerificationBadge`, `SectionHead`, `Bar`, `ProgressRing`.

- [ ] **Step 1: Implement safe rich text**

`src/components/RichText.tsx`:

```tsx
import { useMemo, type ReactNode } from "react";
import { Tex } from "./Tex";

const ALLOWED = new Set(["SUB", "SUP", "B", "STRONG", "I", "EM", "BR"]);

function nodesFromHtml(html: string, keyPrefix: string): ReactNode[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return [];
  const walk = (node: Node, key: string): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return null;
    const children = Array.from(el.childNodes).map((child, i) => walk(child, `${key}-${i}`));
    if (!ALLOWED.has(el.tagName)) return <>{children}</>;
    switch (el.tagName) {
      case "SUB": return <sub key={key}>{children}</sub>;
      case "SUP": return <sup key={key}>{children}</sup>;
      case "B": case "STRONG": return <strong key={key}>{children}</strong>;
      case "I": case "EM": return <em key={key}>{children}</em>;
      case "BR": return <br key={key} />;
      default: return <>{children}</>;
    }
  };
  return Array.from(root.childNodes).map((child, i) => walk(child, `${keyPrefix}-${i}`));
}

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(TOKEN), [text]);
  return (
    <span className={`rich-text ${className}`.trim()}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return <span className="math-block" key={index}><Tex display>{part.slice(2, -2)}</Tex></span>;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return <Tex key={index}>{part.slice(1, -1)}</Tex>;
        }
        return <span key={index}>{nodesFromHtml(part, `t${index}`)}</span>;
      })}
    </span>
  );
}
```

`src/components/Tex.tsx`:

```tsx
import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem";

export function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch {
      return children;
    }
  }, [children, display]);
  return <span className={`tex ${display ? "tex-display" : ""}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

KaTeX output is generated from our own LaTeX; `trust: false` is the default and keeps it safe.

- [ ] **Step 2: Implement choice cards**

`src/components/ChoiceList.tsx` renders a `role="radiogroup"` with buttons, letter chips, `aria-checked`, right/wrong states, and optional strike-through:

```tsx
import type { Question } from "../data/types";
import { choiceLetter } from "../lib/answer";
import { RichText } from "./RichText";

export function ChoiceList({ question, value, onChange, checked, strikes = [], onStrike }: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  checked: boolean;
  strikes?: string[];
  onStrike?: (letter: string) => void;
}) {
  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer choices">
      {question.choices.map((choice, index) => {
        const letter = choiceLetter(index);
        const picked = value === letter;
        const right = checked && question.answer === index;
        const wrong = checked && picked && !right;
        return (
          <div key={letter} className={`choice ${picked ? "is-picked" : ""} ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""}`}>
            <button type="button" role="radio" aria-checked={picked} disabled={checked} onClick={() => onChange(letter)}>
              <span className="choice-letter">{letter}</span>
              <span className="choice-body"><RichText text={choice} /></span>
            </button>
            <button type="button" className="choice-strike" aria-label={`Eliminate ${letter}`} onClick={() => onStrike?.(letter)}>
              {strikes.includes(letter) ? "Undo" : "Eliminate"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Write the failing render tests**

`tests/rich-text.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { RichText } from "../src/components/RichText";

test("renders inline and display math with mhchem", () => {
  render(<RichText text="Water is $\\ce{H2O}$ and $x^2$." />);
  expect(document.querySelector(".katex")).toBeTruthy();
  expect(screen.getByText(/Water is/)).toBeInTheDocument();
});

test("renders the allowed chemistry HTML subset", () => {
  render(<RichText text="H<sub>2</sub>O and Fe<sup>3+</sup>" />);
  expect(document.querySelector("sub")?.textContent).toBe("2");
  expect(document.querySelector("sup")?.textContent).toBe("3+");
});

test("strips scripts and event handlers", () => {
  const { container } = render(<RichText text={'<script>alert(1)</script><img src=x onerror="alert(2)">safe'} />);
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("safe");
});
```

- [ ] **Step 4: Run and commit**

```bash
npm test -- --run tests/rich-text.test.tsx
git add src/components tests/rich-text.test.tsx
git commit -m "feat: add chemistry-rich text and choice components"
```

---

### Task 7: Home page

**Files:**
- Create: `src/pages/Home.tsx`
- Test: extend `tests/pages.test.tsx`

**Interfaces:**
- Consumes `QUESTIONS`, `QUESTION_COUNT`, `DOMAIN_COUNTS`, `RichText`, `ChoiceList`, `isCorrect`.
- Produces the landing page with a playable sample and CTAs to `/practice?preset=diagnostic-20`, `/bank`, `/guide`.

- [ ] **Step 1: Implement the home page**

Sections, in order:

1. **Hero:** display headline "The exam is a reaction. Train the conditions."; subhead; trust strip (`Free`, `No account required`, `${QUESTION_COUNT} verified questions`, `Works offline`). A sample question card with choices and a `Check` button; on check show the correct letter and explanation. `Try another` picks a random question with `difficulty === "Standard"`.
2. **Start here:** three buttons: `Start a 20-question diagnostic`, `Browse the bank`, `Read the PNCO guide`.
3. **Coverage:** counts by domain and chapter; four paper cards with item counts and a `Drill this paper` link.
4. **How it works:** Bank → Build → Drill → Review, with one sentence each.
5. **Honesty strip:** independent, unofficial, corrections link.

The sample uses local state, not a drill:

```tsx
const [sample, setSample] = useState(() => pickSample());
const [picked, setPicked] = useState("");
const [checked, setChecked] = useState(false);
```

- [ ] **Step 2: Write the failing behavior test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

test("the home sample can be answered and explained", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
  const choices = screen.getAllByRole("radio");
  expect(choices.length).toBeGreaterThanOrEqual(4);
  await user.click(choices[0]);
  await user.click(screen.getByRole("button", { name: /check/i }));
  expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run, fix, and commit**

```bash
npm test -- --run tests/pages.test.tsx
git add src/pages/Home.tsx tests/pages.test.tsx
git commit -m "feat: add the ChemBank home page"
```

---

### Task 8: Question bank and question detail

**Files:**
- Create: `src/pages/Bank.tsx`, `src/pages/QuestionPage.tsx`, `src/components/QuestionCard.tsx`, `src/lib/select.ts`
- Test: extend `tests/pages.test.tsx`, `tests/select.test.ts`

**Interfaces:**
- `FilterState { q: string; domain: string; chapter: string; topic: string; difficulty: string; source: string; status: "all"|"unseen"|"wrong"|"flagged" }`
- `filterQuestions(bank, filters, store)` returns `{ items, total }`.
- Bank persists filters in `useSearchParams`.
- QuestionPage reads `:id`, shows metadata, choices, check, solution, prev/next, report link.

- [ ] **Step 1: Implement filter logic**

`src/lib/select.ts`:

```ts
import type { Question, Store } from "../data/types";
import { isCorrect } from "./answer";

export interface FilterState {
  q: string;
  domain: string;
  chapter: string;
  topic: string;
  difficulty: string;
  source: string;
  status: "all" | "unseen" | "wrong" | "flagged";
}

export function filterQuestions(bank: Question[], filters: FilterState, store: Store) {
  const latest = new Map<string, boolean>();
  for (const a of store.attempts) latest.set(a.qid, a.correct);
  const needle = filters.q.trim().toLowerCase();
  const items = bank.filter((q) => {
    if (filters.domain && q.domain !== filters.domain) return false;
    if (filters.chapter && String(q.chapter ?? "") !== filters.chapter) return false;
    if (filters.topic && q.topic !== filters.topic) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.source && q.source !== filters.source) return false;
    if (filters.status === "unseen" && latest.has(q.id)) return false;
    if (filters.status === "wrong" && latest.get(q.id) !== false) return false;
    if (filters.status === "flagged" && !store.stashed.includes(q.id)) return false;
    if (needle) {
      const hay = `${q.stem} ${q.topic} ${q.explanation}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  return { items, total: items.length };
}

export function isAnswerCorrect(q: Question, answer: string) {
  return isCorrect(q, answer);
}
```

- [ ] **Step 2: Implement Bank and QuestionPage**

Bank: a sticky filter rail on desktop, collapsible on mobile; search input; selects for domain/chapter/topic/difficulty/source/status; `Showing N of M`; cards with stem preview, badges, and `Open` link. Reset button clears search params.

QuestionPage:

```tsx
const { id } = useParams();
const question = id ? QUESTION_BY_ID.get(id) : undefined;
const index = QUESTIONS.findIndex((q) => q.id === id);
const prev = QUESTIONS[index - 1];
const next = QUESTIONS[index + 1];
```

On check: record an attempt through the store, show right/wrong and the explanation. `Show solution` reveals without recording? Record as `correct: false` only if the user checked a wrong answer; a reveal alone does not create an attempt, but it does add the item to `stashed`? No; just reveal. Report link: `https://github.com/<owner>/<repo>/issues/new?template=question.yml&title=Question%20${id}` configured in `src/config.ts`.

- [ ] **Step 3: Write failing tests**

`tests/select.test.ts`:

```ts
import { expect, test } from "vitest";
import { filterQuestions } from "../src/lib/select";
import type { Question, Store } from "../src/data/types";

const bank = [
  { id: "a", domain: "General", topic: "Measurement", difficulty: "Foundation", source: "textbook", stem: "sig figs", choices: ["1","2","3","4"], answer: 0, explanation: "x", verified: { status: "verified", reviewedAt: "2026-11-07" } },
  { id: "b", domain: "Physical", topic: "Gases", difficulty: "Standard", source: "supplied-paper", stem: "gas law", choices: ["1","2","3","4"], answer: 1, explanation: "y", verified: { status: "verified", reviewedAt: "2026-11-07" } },
] as Question[];

const store: Store = { version: 1, attempts: [{ qid: "a", correct: false, answer: "B", ts: 1, elapsedSec: 1, mode: "single" }], drills: [], review: [], stashed: ["b"], theme: "auto", createdAt: 1 };

test("filters by domain, status, and search", () => {
  expect(filterQuestions(bank, { q: "", domain: "Physical", chapter: "", topic: "", difficulty: "", source: "", status: "all" }, store).total).toBe(1);
  expect(filterQuestions(bank, { q: "", domain: "", chapter: "", topic: "", difficulty: "", source: "", status: "wrong" }, store).items[0].id).toBe("a");
  expect(filterQuestions(bank, { q: "", domain: "", chapter: "", topic: "", difficulty: "", source: "", status: "flagged" }, store).items[0].id).toBe("b");
});
```

- [ ] **Step 4: Run, fix, commit**

```bash
npm test -- --run tests/select.test.ts tests/pages.test.tsx
git add src/pages/Bank.tsx src/pages/QuestionPage.tsx src/components/QuestionCard.tsx src/lib/select.ts tests
git commit -m "feat: add filterable question bank and question detail"
```

---

### Task 9: Practice builder and drill player

**Files:**
- Create: `src/pages/Practice.tsx`, `src/pages/Drill.tsx`, `src/components/QuestionMap.tsx`, `src/lib/drill.ts`
- Test: `tests/drill.test.ts`, extend `tests/pages.test.tsx`

**Interfaces:**
- `createDrill({ name, mode, qids, limitSec })`, `answeredCount`, `correctCount`, `drillStats`, `remainingSeconds`, `latestAttemptMap`.
- Presets: `diagnostic-20`, `daily-10`, `chapter`, `lab`, `paper`, `weak`, `due`, `random-10`, `custom`.
- Drill persists on every change to the store; resume after refresh; auto-submit at zero.

- [ ] **Step 1: Implement drill engine**

`src/lib/drill.ts`:

```ts
import type { Drill } from "../data/types";
import { QUESTION_BY_ID } from "../data/questions";
import { isCorrect } from "./answer";

export function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createDrill(input: { name: string; mode: "practice" | "timed"; qids: string[]; limitSec: number }): Drill {
  return { id: uid(), name: input.name, mode: input.mode, qids: input.qids, answers: {}, checked: {}, flagged: {}, strikes: {}, index: 0, limitSec: input.limitSec, elapsedSec: 0, startedAt: Date.now(), done: false };
}

export function answeredCount(drill: Drill): number {
  return drill.qids.filter((id) => Boolean(drill.answers[id]?.trim())).length;
}

export function isQuestionCorrect(drill: Drill, id: string): boolean {
  const q = QUESTION_BY_ID.get(id);
  return q ? isCorrect(q, drill.answers[id] ?? "") : false;
}

export function correctCount(drill: Drill): number {
  return drill.qids.filter((id) => isQuestionCorrect(drill, id)).length;
}

export function drillStats(drill: Drill) {
  const answered = answeredCount(drill);
  const correct = correctCount(drill);
  return { total: drill.qids.length, answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : null };
}

export function remainingSeconds(drill: Drill): number {
  return drill.limitSec ? Math.max(0, drill.limitSec - drill.elapsedSec) : 0;
}
```

- [ ] **Step 2: Implement the builder**

Practice page state: preset, mode, selected filters, count. Show a live `N questions match` via `filterQuestions`. Disable start when count is 0. Presets compute their own qids:

- Diagnostic 20: balanced by domain, 4 from each.
- Daily 10: unseen first, then weak topics.
- Chapter: filtered by selected chapter.
- Lab: `domain === "Laboratory"`.
- Paper: `paper === selectedPaper`, 50 items.
- Weak: topics with accuracy < 60% and at least 2 attempts.
- Due: `store.review` items with `dueAt <= Date.now()`.
- Random 10: shuffle.
- Custom: all filters.

On start: `createDrill`, add to store, navigate `/drill/:id`.

- [ ] **Step 3: Implement the player**

Behavior:

- Current question = `drill.qids[drill.index]`.
- Timer: `setInterval` 1 s; in timed mode, increment `elapsedSec`; at `remainingSeconds === 0`, set `done: true` and navigate to results.
- Autosave: every answer/flag/index change updates the store; on `beforeunload`, flush.
- Keyboard: `a`–`d` selects, `Enter` checks/advances, `f` flags, `ArrowLeft/Right` navigates.
- Practice mode: `Check` sets `checked[id]`, records an attempt, shows explanation. Timed mode: no check until submit; choices remain changeable; `Submit` confirms.
- `QuestionMap`: grid of numbers with states (answered, flagged, current), click to jump.
- `Submit`: confirm modal with unanswered/flagged counts; set `done`, `finishedAt`; navigate to results.

- [ ] **Step 4: Write tests**

`tests/drill.test.ts`:

```ts
import { expect, test } from "vitest";
import { createDrill, drillStats, isQuestionCorrect } from "../src/lib/drill";
import { QUESTIONS } from "../src/data/questions";

test("scores answered questions and ignores blanks", () => {
  const q = QUESTIONS[0];
  const drill = createDrill({ name: "t", mode: "practice", qids: [q.id], limitSec: 0 });
  expect(drillStats(drill).accuracy).toBeNull();
  drill.answers[q.id] = "A";
  expect(isQuestionCorrect(drill, q.id)).toBe(q.answer === 0);
  expect(drillStats(drill).answered).toBe(1);
});
```

Add a page test: start diagnostic → first question renders → choose an answer → check → next → submit → results route.

- [ ] **Step 5: Run, fix, commit**

```bash
npm test -- --run tests/drill.test.ts tests/pages.test.tsx
git add src/pages/Practice.tsx src/pages/Drill.tsx src/components/QuestionMap.tsx src/lib/drill.ts tests
git commit -m "feat: add practice builder and drill player"
```

---

### Task 10: Results, progress, and spaced review

**Files:**
- Create: `src/pages/Results.tsx`, `src/pages/Progress.tsx`, `src/pages/Review.tsx`, `src/lib/review.ts`, `src/lib/stats.ts`, `src/store.tsx`
- Test: `tests/review.test.ts`, extend `tests/pages.test.tsx`

**Interfaces:**
- `scheduleReview(existing, correct, now)`, `dueReview(store, now)`, `statsByDomain`, `statsByChapter`, `statsByTopic`, `streakDays`.
- `StoreProvider` exposes `store`, `recordAttempt`, `createDrill`, `updateDrill`, `toggleStash`, `clearReview`, `exportData`, `importData`, `reset`, `setTheme`.
- Storage key `chembank:v1`.

- [ ] **Step 1: Implement the store and review scheduling**

Use the Lemma store pattern: load defensively, write on every change, expose actions via context. Review scheduling:

```ts
const INTERVALS = [1, 3, 7, 21];
export function scheduleReview(existing: ReviewItem | undefined, correct: boolean, now = Date.now()): ReviewItem {
  const step = existing ? Math.min(existing.step + (correct ? 1 : 0), INTERVALS.length - 1) : 0;
  const days = correct ? INTERVALS[step] : 1;
  return { qid: existing?.qid ?? "", dueAt: now + days * 86_400_000, step, lastSeen: now };
}
export function dueReview(store: Store, now = Date.now()) {
  return store.review.filter((r) => r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}
```

Wrong checks call `scheduleReview(existing, false)`; correct checks call `scheduleReview(existing, true)`.

- [ ] **Step 2: Implement Results**

- Header: score `correct/total`, accuracy, time, mode.
- Breakdown by domain/topic/difficulty with bars.
- Per-question review list: chosen, correct, explanation, source.
- `Repair wrong` creates a drill of incorrect qids and navigates.
- `Retry` creates a new drill with the same qids (reshuffled) and navigates.

- [ ] **Step 3: Implement Progress and Review**

Progress: KPIs, ring for overall accuracy, bars by domain/chapter/topic, weakest topics with `Drill this`, recent attempts, export/import/reset, sync status (Task 13).

Review: tabs Wrong / Flagged / Due; counts; item list with stem preview and last result; `Review due` creates a drill; `Remove` clears a review item or stash.

- [ ] **Step 4: Write tests**

`tests/review.test.ts`:

```ts
import { expect, test } from "vitest";
import { scheduleReview } from "../src/lib/review";

test("wrong answers come back tomorrow and advance on success", () => {
  const now = Date.UTC(2026, 10, 7);
  const first = scheduleReview(undefined, false, now);
  expect(first.dueAt).toBe(now + 86_400_000);
  const second = scheduleReview({ ...first, qid: "q" }, true, now);
  expect(second.dueAt).toBe(now + 3 * 86_400_000);
});

test("correct answers advance through the intervals and cap", () => {
  let item = { qid: "q", dueAt: 0, step: 0, lastSeen: 0 };
  for (const days of [3, 7, 21, 21]) {
    item = scheduleReview(item, true, 0);
    expect(item.dueAt).toBe(days * 86_400_000);
  }
});
```

- [ ] **Step 5: Run, fix, commit**

```bash
npm test -- --run tests/review.test.ts tests/pages.test.tsx
git add src/store.tsx src/lib/review.ts src/lib/stats.ts src/pages/Results.tsx src/pages/Progress.tsx src/pages/Review.tsx tests
git commit -m "feat: add results, progress, and spaced review"
```

---

### Task 11: Reference content data

**Files:**
- Create: `src/data/notes.ts`, `src/data/lab.ts`, `src/data/formulas.ts`, `src/data/periodic.ts`, `src/data/guide.ts`
- Test: `tests/content-reference.test.ts`

**Interfaces:**
- `CHAPTER_NOTES: ChapterNote[]` (7 items; slug, chapter, title, bigIdea, formulas, traps, checklist).
- `LAB_TECHNIQUES: LabTechnique[]` (12 items; slug, title, purpose, steps, precision, errors, examTraps).
- `FORMULA_SECTIONS: FormulaSection[]` (constants, chapters 1–7, solubility, activity series, error propagation).
- `ELEMENTS: Element[]` (118 items; z, symbol, name, mass, category, group, period).
- `PNCO_GUIDE: GuideSection[]` with source links and lastVerified.

- [ ] **Step 1: Write the seven chapter notes**

Each note is 120–200 words of original prose plus 4–8 formula strings and 3–5 traps. Chapters:

1. Matter, measurement, significant figures, density.
2. Atoms, molecules, ions, isotopes, nomenclature.
3. Mass relationships, moles, limiting reagents, yield.
4. Aqueous reactions, precipitation, redox, titrations, gravimetry.
5. Gases, KMT, effusion, real gases, gas stoichiometry.
6. Thermochemistry, calorimetry, Hess's law, enthalpy.
7. Quantum theory, electronic structure, periodicity, spectroscopy.

- [ ] **Step 2: Write the lab bench and formula sheet**

Lab techniques: weighing, volumetric pipette, burette, titration, back-titration, gravimetric filtration, drying/ignition, calorimetry, gas collection over water, manometer, pH meter, spectrophotometry, flame test, error propagation. Pick 12–14.

Formula sheet sections: constants; measurement; stoichiometry; gases; thermochemistry; quantum; equilibrium/acid–base; electrochemistry; solutions; lab error.

- [ ] **Step 3: Add the periodic table data**

Use a compact array of 118 elements. Include at least `z`, `symbol`, `name`, `mass`, `category`, `group`, `period`. The prototype already contains a partial table; complete it. Categories: alkali metal, alkaline earth, transition metal, post-transition metal, metalloid, nonmetal, halogen, noble gas, lanthanide, actinide.

- [ ] **Step 4: Add the PNCO guide**

Use the research facts and sources in the spec. Sections:

- What PNCO is, who runs it, official contacts.
- Two-tier structure and the 2026 finals stages.
- Eligibility, school limits, fees, advancement.
- Awards and the published ambiguity.
- Scope and depth, no prescribed textbook.
- IChO relationship.
- ACho distinction.
- How to use this site.
- "Rules change yearly" caveat and last-verified date.
- Sources.

- [ ] **Step 5: Write completeness tests**

```ts
import { expect, test } from "vitest";
import { CHAPTER_NOTES } from "../src/data/notes";
import { LAB_TECHNIQUES } from "../src/data/lab";
import { ELEMENTS } from "../src/data/periodic";
import { PNCO_GUIDE } from "../src/data/guide";

test("reference content covers all chapters and lab techniques", () => {
  expect(CHAPTER_NOTES.map((n) => n.chapter)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(LAB_TECHNIQUES.length).toBeGreaterThanOrEqual(12);
  expect(ELEMENTS).toHaveLength(118);
  expect(PNCO_GUIDE.some((s) => s.title.includes("not affiliated"))).toBe(true);
});
```

- [ ] **Step 6: Commit**

```bash
npm test -- --run tests/content-reference.test.ts
git add src/data/notes.ts src/data/lab.ts src/data/formulas.ts src/data/periodic.ts src/data/guide.ts tests/content-reference.test.ts
git commit -m "feat: add chapter notes, lab bench, formulas, and PNCO guide data"
```

---

### Task 12: Reference pages and routes

**Files:**
- Create: `src/pages/Notes.tsx`, `src/pages/NotePage.tsx`, `src/pages/Lab.tsx`, `src/pages/LabPage.tsx`, `src/pages/Formulas.tsx`, `src/pages/PeriodicTable.tsx`, `src/pages/Guide.tsx`, `src/pages/About.tsx`, `src/pages/NotFound.tsx`
- Modify: `src/App.tsx`, `src/components/SiteLayout.tsx`
- Test: extend `tests/pages.test.tsx`

**Interfaces:**
- Routes from the spec; nav includes Bank, Practice, Review, Notes, Lab, Progress; overflow includes Formulas, Periodic Table, Guide, About.

- [ ] **Step 1: Implement Notes and Lab index/detail pages**

Index pages show cards with title, summary, and count. Detail pages render the structured fields with `RichText`; add a "Drill this chapter/topic" link to `/practice?chapter=N` or `/practice?lab=1`.

- [ ] **Step 2: Implement Formulas and Periodic Table**

Formulas: sections with formula cards; constants table; print styles.

Periodic table: CSS grid by group/period; each element is a button with symbol, number, mass; selecting opens a detail panel with category and a "questions on this topic" link if mapped. Keyboard: arrow keys move focus, Enter opens. Use a `<table>` with `role="grid"` only if implemented correctly; otherwise a grid of buttons with clear labels.

- [ ] **Step 3: Implement Guide, About, NotFound**

Guide: source-linked sections, "last verified" badge, disclaimer at top. About: methodology, verification ledger counts from `content/audit.json`, corrections, license, privacy, report link. NotFound: link back to bank.

- [ ] **Step 4: Add route tests**

```tsx
test.each([["/notes", /Chapter notes/i], ["/lab", /Lab bench/i], ["/formulas", /Formula/i], ["/periodic-table", /Periodic/i], ["/guide", /PNCO/i], ["/about", /Method/i]])(
  "renders %s",
  (path, heading) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  },
);
```

- [ ] **Step 5: Run, fix, commit**

```bash
npm test -- --run tests/pages.test.tsx
git add src/pages src/App.tsx src/components/SiteLayout.tsx tests
git commit -m "feat: add notes, lab, formula, periodic table, guide, and about pages"
```

---

### Task 13: Optional Supabase sync

**Files:**
- Create: `src/lib/supabase.ts`, `src/components/AccountMenu.tsx`, `.env.example`, `supabase/setup.sql`
- Modify: `src/store.tsx`, `src/components/SiteLayout.tsx`, `src/config.ts`
- Test: `tests/sync.test.ts`

**Interfaces:**
- `syncEnabled(): boolean` true only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist.
- `getClient()`, `signIn(email, password)`, `signUp(email, password)`, `signOut()`, `pullProgress(userId)`, `pushProgress(userId, store)`.
- Merge rule: latest attempt per qid wins; drills union by id; review latest dueAt wins; stashed union.

- [ ] **Step 1: Implement the adapter**

```ts
import type { Store } from "../data/types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function syncEnabled(): boolean {
  return Boolean(url && key);
}

let clientPromise: Promise<any> | null = null;
export async function getClient() {
  if (!syncEnabled()) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(url!, key!));
  }
  return clientPromise;
}

export function mergeStores(local: Store, remote: Store): Store {
  const attempts = new Map(local.attempts.map((a) => [`${a.qid}:${a.ts}`, a]));
  for (const a of remote.attempts) attempts.set(`${a.qid}:${a.ts}`, a);
  const drills = new Map(local.drills.map((d) => [d.id, d]));
  for (const d of remote.drills) if (!drills.has(d.id)) drills.set(d.id, d);
  const review = new Map(local.review.map((r) => [r.qid, r]));
  for (const r of remote.review) {
    const current = review.get(r.qid);
    if (!current || r.lastSeen > current.lastSeen) review.set(r.qid, r);
  }
  return {
    ...local,
    attempts: [...attempts.values()],
    drills: [...drills.values()],
    review: [...review.values()],
    stashed: [...new Set([...local.stashed, ...remote.stashed])],
  };
}
```

`pullProgress` selects `data` from `progress` where `user_id = auth.uid()`; `pushProgress` upserts `{ user_id, data, updated_at }`.

- [ ] **Step 2: Implement the account menu**

Hidden when `syncEnabled()` is false. When enabled: email/password sign in/up, sign out, sync status (`offline`, `syncing`, `synced`, `error`). On sign-in: pull, merge, update local store, push. On store changes while signed in: debounce 2 s and push. Never block local use on network failure.

- [ ] **Step 3: Add the SQL**

`supabase/setup.sql` = the supplied schema with RLS:

```sql
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
create policy "read own progress" on public.progress for select using (auth.uid() = user_id);
create policy "insert own progress" on public.progress for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 4: Test merge logic**

```ts
import { expect, test } from "vitest";
import { mergeStores } from "../src/lib/supabase";
import type { Store } from "../src/data/types";

const base: Store = { version: 1, attempts: [{ qid: "a", correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" }], drills: [], review: [{ qid: "a", dueAt: 1, step: 0, lastSeen: 1 }], stashed: ["a"], theme: "auto", createdAt: 1 };

test("merges attempts, drills, review, and stash without losing local data", () => {
  const remote: Store = { ...base, attempts: [{ qid: "b", correct: true, answer: "B", ts: 2, elapsedSec: 2, mode: "single" }], review: [{ qid: "b", dueAt: 2, step: 0, lastSeen: 2 }], stashed: ["b"] };
  const merged = mergeStores(base, remote);
  expect(merged.attempts.map((a) => a.qid).sort()).toEqual(["a", "b"]);
  expect(merged.stashed.sort()).toEqual(["a", "b"]);
});
```

- [ ] **Step 5: Run, fix, commit**

```bash
npm test -- --run tests/sync.test.ts
git add src/lib/supabase.ts src/components/AccountMenu.tsx src/store.tsx src/components/SiteLayout.tsx src/config.ts .env.example supabase/setup.sql tests/sync.test.ts
git commit -m "feat: add optional Supabase progress sync"
```

---

### Task 14: PWA, SEO, security, and performance

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon.svg`, `public/offline.html`, `src/components/PageMeta.tsx`, `scripts/generate-seo.mjs`
- Modify: `vite.config.ts`, `index.html`, `src/main.tsx`, `public/_headers`
- Test: build artifact checks; browser offline check

**Interfaces:**
- PWA `registerType: "prompt"`; offline fallback; install prompt.
- `PageMeta({ title, description, path })` renders `<title>`, `<meta name="description">`, canonical link.
- Sitemap includes `/`, `/bank`, `/notes`, `/notes/:slug`, `/lab`, `/lab/:slug`, `/guide`, and every `/q/:id`.

- [ ] **Step 1: Configure the PWA**

`vite.config.ts`:

```ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icon.svg", "offline.html"],
      manifest: {
        name: "ChemBank — PNCO Reviewer",
        short_name: "ChemBank",
        description: "Free, independent PNCO/ACho chemistry reviewer.",
        theme_color: "#1f3a8a",
        background_color: "#f4f1e8",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === "document",
          handler: "NetworkFirst",
          options: { cacheName: "pages", networkTimeoutSeconds: 4 },
        }],
      },
    }),
  ],
});
```

Register the prompt UI in `src/main.tsx`; show an "Update available" button, never force reload mid-drill.

- [ ] **Step 2: Add metadata and sitemap generation**

`PageMeta` uses React 19 metadata hoisting:

```tsx
export function PageMeta({ title, description, path }: { title: string; description: string; path?: string }) {
  return (
    <>
      <title>{title} · ChemBank</title>
      <meta name="description" content={description} />
      {path ? <link rel="canonical" href={`https://chembank.pages.dev${path}`} /> : null}
    </>
  );
}
```

`generate-seo.mjs` reads `src/data/questions.json`, `notes.ts`, `lab.ts`, writes `dist/sitemap.xml` and `dist/robots.txt`. Use a fixed `SITE_URL` constant in `src/config.ts`; document changing it when a custom domain is added.

- [ ] **Step 3: Add security headers and offline page**

Update `_headers` with the CSP from Task 1. Add `public/offline.html` with a branded message and a retry link. Confirm no inline scripts are required by the built app; if Vite emits an inline module preload, add its hash to CSP rather than `unsafe-inline` for scripts.

- [ ] **Step 4: Verify**

```bash
npm run build
test -f dist/sitemap.xml
test -f dist/robots.txt
grep -q "Content-Security-Policy" dist/_headers
grep -q "chembank" dist/manifest.webmanifest
```

Then run `npm run preview`, open the site with browser-use, go offline, reload, and confirm the bank/home still render from cache.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html src/main.tsx public src/components/PageMeta.tsx scripts/generate-seo.mjs
git commit -m "feat: add PWA, SEO, and security headers"
```

---

### Task 15: QA, documentation, GitHub, and Cloudflare

**Files:**
- Create: `README.md`, `NOTICE.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/QA.md`, `docs/DEPLOYMENT.md`, `.env.example`
- Modify: `.github/workflows/ci.yml`
- Test: full suite, browser QA, production build

**Interfaces:**
- No new runtime interfaces.

- [ ] **Step 1: Run the full local gate**

```bash
npm run typecheck
npm run test:run
npm run content:validate
npm run build
```

All must pass. Record the output in `docs/QA.md`.

- [ ] **Step 2: Browser QA**

Use the browser-use MCP against `npm run preview`:

- 1440 px: home sample, bank filters, question deep link, diagnostic, timed paper, results, progress, review, notes, lab, formulas, periodic table, guide, about.
- 1024 px and 390 px: nav, filter rail, choice cards, timer, question map, no horizontal overflow.
- Keyboard only: skip link, nav, answer choices, check, next, submit, modal focus trap.
- Dark mode: contrast, math rendering, charts.
- Offline: load home and bank, go offline, reload, open a cached question.
- Console: no errors or warnings; network: no third-party requests except Supabase when configured.

Fix any blocker and re-run.

- [ ] **Step 3: Write documentation**

`README.md`: what it is, non-affiliation, content provenance, features, stack, quick start, content pipeline, verification, deployment, scripts.

`NOTICE.md`: user-supplied and textbook-derived content rights; no official papers; code MIT; original prose/explanations CC BY-NC-SA 4.0.

`SECURITY.md`: reporting, local-only data, optional Supabase, no secrets, RLS.

`CONTRIBUTING.md`: question contribution rules, verification requirement, issue templates, style.

`docs/DEPLOYMENT.md`: GitHub creation, Cloudflare Pages setup, build command/output, env vars, custom domain, wrangler fallback, rollback.

- [ ] **Step 4: Prepare the repository and CI**

```bash
git add .
git commit -m "docs: add project, content, security, and deployment documentation"
```

Confirm `npm ci && npm run build` works from a clean checkout. Add a GitHub Actions status badge to the README after the repo exists.

- [ ] **Step 5: Wait for the user's GitHub link, then push**

Do not create a remote or push until the user supplies the repository URL and confirms. When supplied:

```bash
git remote add origin <repo-url>
git branch -M main
git push -u origin main
```

If the remote already has a README/commit, fetch and reconcile without force-pushing.

- [ ] **Step 6: Deploy to Cloudflare Pages**

Preferred: connect the GitHub repo in the Cloudflare dashboard, set build command `npm run build`, output `dist`, Node 22, no env vars required. Optional direct deploy:

```bash
npx --yes wrangler pages deploy dist --project-name chembank
```

Verify the live URL, all routes, assets, offline install, and mobile layout. Report the URL only after it resolves. If authentication is unavailable, stop and ask for a Cloudflare API token or dashboard access; do not claim deployment.

---

## Self-Review

- **Spec coverage:** Home, bank, question detail, builder, player, results, progress, review, notes, lab, formulas, periodic table, guide, about, optional Supabase, PWA, SEO, security, CI, deployment — each maps to a task.
- **Type consistency:** `Question.answer` is `0|1|2|3` everywhere; UI values are letters via `choiceLetter`; `Drill.answers` stores letters; `Store.version` is `1`; storage key is `chembank:v1`.
- **No placeholders:** every task names exact files, interfaces, test commands, and expected behavior. Content counts and tolerances are explicit.
- **Open risk:** the DOCX parser's split logic may need adjustment for the second paper in each file. The contract test (200 total, 50 per paper) is the gate; fix the parser, never weaken the test.
- **Open risk:** 350 verified items may not survive blind review. If the count falls short, add original gap-fill items with the same verification gate rather than publishing flagged material.

---

## Execution Handoff

Recommended: **subagent-driven development** — one fresh implementer per task, independent review between tasks, with the content-verification batches dispatched in parallel. Inline execution is the fallback if subagent capacity is unavailable.
