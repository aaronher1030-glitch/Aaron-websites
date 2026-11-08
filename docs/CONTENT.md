# Content guide

This document is the editorial contract for Lemma's bank. It covers what may be added, how a problem is structured, how answers are checked, and how to review a contribution.

---

## 1. Editorial policy

1. **Two collections, one provenance rule.** Original problems are written for Lemma or supplied with permission. Official Australian AMO questions may be transcribed only from publicly released papers; record the year, day, problem number, and official URL, and attribute copyright to the Australian Mathematics Trust.
2. **Style, not borrowed solutions.** Difficulty and wording may imitate the olympiad range. For original problems, the text must be Lemma's own. For official questions, transcribe the statement faithfully and never copy the official solution text.
3. **No organiser branding.** Do not use official logos, paper headers, or claims of affiliation.
4. **Facts carry sources.** Competition details belong in `src/data/amo.ts`, link to public official pages, and carry the verification date.
5. **Solutions are complete.** A solution must justify the answer, not merely state it. If a step is routine, say why it is routine.
6. **Proofs are honest.** Original proof prompts include a model proof and a four-point rubric. Official questions include a Lemma outline and rubric, clearly labelled as Lemma's own. Never imply that the app grades proofs automatically.

If a contribution's origin is unclear, reject or rewrite it before merging.

---

## 2. Where content lives

| File | Contents |
| --- | --- |
| `src/data/problems.json` | 192 short-answer and multiple-choice problems. |
| `src/data/proofs.ts` | 16 Proof Lab prompts with model proofs and rubrics. |
| `src/data/amoPapers.ts` | 40 official Australian AMO questions (2016–2020), paper metadata, PDF links, Lemma outlines and rubrics. |
| `src/data/skills.ts` | 16 technique guides. |
| `src/data/amo.ts` | Competition profiles, FAQ, eight-week plan, sources. |
| `src/data/types.ts` | TypeScript schema. |

`src/data/problems.ts` merges the three problem sources. Do not duplicate a problem across them.

---

## 3. Problem schema

```ts
interface Problem {
  id: string;
  domain: "Algebra" | "Number Theory" | "Combinatorics" | "Geometry";
  skill: string;                 // must match a skill name exactly
  difficulty: "Easy" | "Medium" | "Hard" | "Challenge";
  type: "int" | "mc" | "proof";
  stem: string;                  // LaTeX allowed
  choices?: string[];            // required for mc, four choices
  answer: string;                // digits, fraction, decimal, or A–D
  explanation: string;           // full worked solution or Lemma outline
  rubric?: string[];             // required for proof, four points
  source?: string;               // defaults to "Lemma original bank"
  sourceUrl?: string;            // official paper link, if any
  collection?: "original" | "official";  // defaults to "original"
  paper?: PaperRef;              // required for official questions
}
```

### Required fields by type

| Field | `int` | `mc` | `proof` |
| --- | :---: | :---: | :---: |
| `stem` | ✓ | ✓ | ✓ |
| `answer` | numeric | `A`–`D` | `"proof"` |
| `explanation` | ✓ | ✓ | model proof |
| `choices` | — | 4 | — |
| `rubric` | — | — | 4 points |

### Id rules

- Lower-case, hyphenated, stable, and unique across all files.
- Prefix original problems with the domain: `alg-`, `nt-`, `comb-`, `geo-`, or `proof-`.
- Official Australian AMO problems use `amo-<year>-p<number>`, for example `amo-2020-p4`.
- Never rename an id after release: links, sitemap entries, and saved attempts depend on it.
- Pattern used by the existing bank: `alg-vieta-1`, `nt-div-3`, `comb-prob-2`, `geo-angle-8`.

### Technique names

`skill` must match one of the 16 names in `src/data/skills.ts` exactly, including capitalisation and punctuation. The app groups by string equality; a typo creates a problem that no technique page lists.

Current techniques:

| Domain | Techniques |
| --- | --- |
| Algebra | Polynomials and Vieta's Formulas · Functional Equations · Inequalities and AM-GM · Sequences and Series |
| Number Theory | Divisibility and Primes · Modular Arithmetic · Diophantine Equations · GCD and LCM |
| Combinatorics | Counting Principles · Probability · Pigeonhole and Invariants · Recursion and Games |
| Geometry | Angles and Triangles · Circles and Cyclic Quadrilaterals · Area and Similarity · Coordinates and Trigonometry |

---

## 4. Adding a problem

1. Choose the technique first. If no technique fits, the problem is probably out of scope or needs a new guide.
2. Write the statement so it can be read without the diagram. If a configuration is needed, describe it in words or give coordinates.
3. Solve it independently. Write the solution for a student who knows the technique but not this trick.
4. Check the answer format:
   - `int`: a single number, integer where possible, or a simple fraction or decimal.
   - `mc`: four plausible choices, one correct letter.
   - `proof`: four rubric points that name what a complete argument must contain.
5. Add the record to `src/data/problems.json`, `src/data/proofs.ts`, or `src/data/amoPapers.ts`.
6. Run `npm run typecheck` and `npm run build`.
7. Open the problem at `/problem/<id>` and confirm:
   - the answer checks correctly;
   - a wrong answer is rejected;
   - the solution renders;
   - the technique link resolves;
   - the problem appears in the bank and on the technique page.

### Example: short answer

```json
{
  "id": "alg-vieta-1",
  "domain": "Algebra",
  "skill": "Polynomials and Vieta's Formulas",
  "difficulty": "Easy",
  "type": "int",
  "stem": "Let $r$ and $s$ be the roots of $x^2 - 7x + 3 = 0$. What is $r^2 + s^2$?",
  "answer": "43",
  "explanation": "By Vieta, $r+s=7$ and $rs=3$. Hence $r^2+s^2=(r+s)^2-2rs=49-6=43$."
}
```

### Example: multiple choice

```json
{
  "id": "nt-mod-1",
  "domain": "Number Theory",
  "skill": "Modular Arithmetic",
  "difficulty": "Medium",
  "type": "mc",
  "stem": "What is the remainder when $3^{100}$ is divided by $7$?",
  "choices": ["$1$", "$2$", "$4$", "$5$"],
  "answer": "C",
  "explanation": "Since $3^6\\equiv 1\\pmod 7$ and $100\\equiv 4\\pmod 6$, $3^{100}\\equiv 3^4=81\\equiv 4\\pmod 7$."
}
```

### Example: proof

```ts
{
  id: "proof-example",
  domain: "Combinatorics",
  skill: "Pigeonhole and Invariants",
  difficulty: "Hard",
  type: "proof",
  stem: "Prove that among any $n+1$ integers chosen from $\\{1,\\dots,2n\\}$, two are coprime.",
  answer: "proof",
  explanation: "...",
  rubric: [
    "Groups the integers into $n$ pairs of consecutive integers.",
    "Applies the pigeonhole principle to $n+1$ integers and $n$ pairs.",
    "Notes that consecutive integers are coprime.",
    "Concludes that two chosen integers are coprime.",
  ],
  source: "Lemma Proof Lab",
}
```

---

## 5. LaTeX rules

- Inline math: `$...$`. Display math: `$$...$$`.
- In JSON strings, escape backslashes: `\\frac`, `\\pmod`, `\\mathbb`.
- In TypeScript template or string literals, escape backslashes the same way unless using `String.raw`.
- Prefer `\dfrac` for standalone fractions, `\tfrac` inside dense expressions.
- Use `\left` and `\right` only when the delimiters need to grow.
- Do not mix HTML tags into `stem` or `explanation`. The renderer handles text and math only; line breaks are preserved.
- Use `\pmod{n}` for congruence annotations and `\mid` / `\nmid` for divisibility.
- Test every changed string in the browser: KaTeX is configured with `throwOnError: false`, so a malformed expression renders as raw text rather than crashing.

### Answer normalisation

`isCorrect` in `src/data/problems.ts`:

- strips spaces, commas, and `$`;
- converts unicode minus and en-dashes to `-`;
- removes a leading `+`;
- parses integers, decimals, and `a/b` fractions numerically;
- requires an exact match for non-numeric answers;
- compares multiple choice by letter.

Consequences for authors:

- Write the canonical answer as the simplest form (`1/2`, not `2/4`). Both parse numerically, but the displayed answer should be canonical.
- Avoid answers that rely on units, words, or intervals. Those are not numeric and require exact string matching.
- For multiple choice, the answer is the letter, not the text of the choice.

---

## 6. Difficulty calibration

| Label | Intended student |
| --- | --- |
| Easy | Comfortable with the technique after one guide; 3–5 minutes. |
| Medium | Requires a clean idea and careful execution; 5–10 minutes. |
| Hard | Multi-step; one non-obvious reduction; 10–25 minutes. |
| Challenge | Olympiad proof-level or a genuinely difficult short answer; 25+ minutes. |

Proof prompts are `Hard` or `Challenge` only. The proof paper preset filters on those two labels.

A useful check: if the solution is longer than the statement by more than about 4×, the difficulty label is probably too low. If the solution is a one-line substitution and the label says Challenge, it is too high.

---

## 7. Technique guide schema

```ts
interface Skill {
  slug: string;         // route: /techniques/<slug>
  name: string;         // must match problem.skill
  domain: Domain;
  code: string;         // 2–3 letter badge
  formula: string;      // bare LaTeX, no dollar signs
  blurb: string;        // one sentence, used on cards and metadata
  bigIdea: string;      // 2–4 sentences, LaTeX allowed
  whenToUse: string[];  // 3–5 triggers
  traps: string[];      // 3–5 failure modes
  checklist: string[];  // exactly 4 steps
}
```

Guidelines:

- The big idea explains **why** the technique works, not just what to compute.
- "When to use" entries describe observable features of a problem.
- Traps describe errors that look correct at first glance.
- The checklist is an execution order a student can follow under pressure.
- Add the guide before or with the first problem that uses it; a technique with zero problems is a dead end.

---

## 8. AMO facts

`src/data/amo.ts` holds the five competition profiles. Each profile includes organiser, format, duration, marks, eligibility, pathway, topics, a note, and an official source URL.

When updating:

1. Verify against the organiser's own page, not a news article or forum.
2. Update `VERIFIED` in `src/data/amo.ts` and the footer note.
3. Link the exact page, not a homepage if a stable page exists.
4. Record structural changes as a `note` rather than silently editing history.
5. Run the build and check the AMO guide page, including table layout at 390 px.

---

## 9. Review checklist

Before merging content:

- [ ] Original wording for original problems; official transcriptions are faithful, attributed, and linked to the AMT paper.
- [ ] Official solutions are not copied; the outline and rubric are Lemma's own.
- [ ] Id is unique and follows the domain or `amo-<year>-p<number>` convention.
- [ ] Technique name matches `skills.ts` exactly.
- [ ] Difficulty matches the calibration table.
- [ ] Statement is self-contained and unambiguous.
- [ ] Answer is canonical and in the expected format.
- [ ] Solution is complete and correct.
- [ ] Proof rubric has four distinct, checkable points.
- [ ] LaTeX renders in the browser.
- [ ] Problem appears at `/problem/<id>`, in `/bank`, and on the technique page.
- [ ] Typecheck and build pass.
