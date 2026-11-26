# Content verification pipeline

This directory holds the machine-readable trail from raw question imports to the
published bank. Nothing here is hand-edited during a release except the blind
solver output (which is checked in) and adjudication rows.

## Order of operations

```bash
npm run content:merge        # content/docx.raw.json + prototype.raw.json -> content/candidates.json
npm run content:batches      # candidates -> verification/batches/batch-NN.json + manifest.json
# solve every batch blind, save each response to verification/results/batch-NN.json
npm run content:adjudicate   # results -> verification/adjudication/batch-NN.json (prompts only)
# adjudicate every written row, save answers to verification/results/adjudication-NN.json
npm run content:apply        # results + adjudications -> ledger.json, audit.json, published.json
npm run content:validate     # validates published.json, then atomically writes src/data/questions.json
```

Two directories, two roles:

- `verification/adjudication/` holds **prompts only** (`batch-NN.json` plus a
  `manifest.json` count). It is rewritten by `content:adjudicate`; never save
  adjudicator answers there.
- `verification/results/` holds blind answers (`batch-NN.json`) and adjudicator
  answers (`adjudication-NN.json`). No script ever clears this directory.

`src/data/questions.json` is written **only** by `validate.mjs`, and only after
every check passes. `apply-verification.mjs` stages its output in
`verification/published.json`; it never touches the published bank.

## Inputs

- `content/docx.raw.json` — 200 items from the four supplied PNCO papers
  (50 per paper, `source: "supplied-paper"`, `sourceKey` A–D).
- `content/prototype.raw.json` — 234 imported prototype items
  (`proto-mixed-*`, `proto-practice-*`, `proto-textbook-*`).

Merge rulings:

- **LQ shuffle.** All 104 `proto-textbook` rows store the correct answer at index
  0 because the prototype shuffled at runtime. Merge re-shuffles each row
  deterministically from an FNV-1a hash of its id (mulberry32 + Fisher–Yates),
  then recomputes `answer` and `sourceKey`. `Math.random` is never used.
  `proto-mixed` and `proto-practice` keep their imported order.
- Every candidate has both `answer` (0–3) and `sourceKey` (A–D); the two always
  agree.
- `topic` is canonicalised through the registry mirrored by `TOPIC_META` in
  `content/scripts/merge.mjs`. `tests/content-pipeline.test.ts` asserts that
  table equals `src/data/topics.ts`. `chapter` comes from that registry; topics
  without a chapter stay undefined.
- Supplied-paper items are `Olympiad` difficulty. Lab papers get domain
  `Laboratory`; theory papers take the topic's registry domain. Prototype items
  keep their imported domain.
- Dedupe uses the full normalized stem plus the normalized first choice. The
  supplied-paper item wins, tags are unioned, and merged ids are listed in
  `content/merge-report.json`.

## Batches

`verification/batches/batch-NN.json` contains exactly 20 items:

```json
[{ "id": "ch1-3-theory-01", "stem": "...", "choices": ["...", "...", "...", "..."] }]
```

No answer, source key, explanation, paper, or flags. `verification/manifest.json`
records the total, batch count, size, and a sha256 per batch (plus a checksum of
`candidates.json`). `apply` and `adjudicate` warn or fail when a checksum no
longer matches.

## Blind results

Save one JSON array per batch to `verification/results/batch-NN.json`:

```json
[
  {
    "id": "ch1-3-theory-01",
    "answer": "B",
    "confidence": "high",
    "work": "short calculation",
    "ambiguous": false,
    "cleanExplanation": "a clean worked solution for students"
  }
]
```

Solvers must not be given the source key. `ambiguous: true` means the solver
believes more than one choice is defensible. The string `"true"` (any case) is
treated exactly like boolean `true`, by both `adjudicate` and `apply`.

## Adjudication

`npm run content:adjudicate` writes prompts to
`verification/adjudication/batch-NN.json` and a count manifest beside them. An
item is routed when any of these holds:

| reason | meaning |
| --- | --- |
| `missing-blind` | no blind row for the candidate |
| `invalid-blind` | blind `answer` is not A–D |
| `source-disagreement` | blind answer differs from the source key |
| `ambiguous` | blind row is ambiguous (boolean `true` or string `"true"`) |
| `claimed-key-conflict` | the candidate carries any `claimed-*` flag |

A `claimed-*` flag records that the supplied paper itself names a different
key, so those items are **always** adjudicated, even when the blind answer and
the source key agree. Each prompt row carries `reason` (the first matching
reason) and `reasons` (all matches), plus the batch's `{id, stem, choices}` and
the blind answer as context — never the source key or the claimed letter.

An adjudicator replies into `verification/results/adjudication-NN.json`:

```json
[{ "id": "ch1-3-theory-01", "answer": "D", "ambiguous": false,
   "cleanExplanation": "optional replacement solution" }]
```

`answer` must be A–D and `ambiguous` must not be true (boolean or `"true"`) for
the row to resolve an item. `status: "flagged"` can be used to explicitly reject
an item. With no blind results the script prints a message and writes nothing.
`apply` ignores anything that looks like an answer inside
`verification/adjudication/` and warns when it finds one.

## Apply rules

`apply-verification.mjs` refuses to run (exit 1, no files written) unless all 22
blind batch results exist. `-- --allow-partial` is for local debugging only and
still never publishes an unverified item.

- blind answer === source key, `ambiguous` not true, no adjudication → verified;
- otherwise a valid adjudication row is required **and** its answer must equal
  the source key or the blind answer. A third letter is never published: the
  item is flagged with `adjudicator disagrees with both`;
- a blind row must exist; adjudication cannot replace a missing blind result;
- missing blind row, unresolved disagreement, or ambiguous row → flagged and
  **not** published.

Published explanations are chosen after meta commentary is stripped from each
source: blind `cleanExplanation`, then the adjudicated one, then the source
explanation. When the adjudicator changed the letter, its own solution is tried
first so the reasoning matches the published answer. A solver explanation that
strips to nothing therefore falls through instead of emptying the field; an item
is flagged only when all three sources are empty after stripping. Clearly meta
sentences ("Wait, check…", "Correct option: X", "Key fix…") are removed;
chemistry is never rewritten.

`verification/ledger.json` records every candidate with source/blind/adjudicated
answers, the coerced `blindAmbiguous` flag (plus `blindAmbiguousRaw` when the
input was not a boolean), `flags`, status, issue, and published state.
`content/audit.json` records totals, corrections, dedupe count, missing blind
rows, adjudications, `claimedKeyConflicts` (candidates carrying a `claimed-*`
flag), `claimedKeyConflictsPublished`, `adjudicatorDisagreements`, and
`publishedByPaper`.

## Exclusions

`verification/exclusions.json` is the auditable record of items that cannot be
published because **no choice equals the computed answer**:

```json
[
  {
    "id": "ch1-3-theory-23",
    "reason": "no exact correct choice",
    "evidence": "Computed 14.0 L; choices 11.2 / 13.4 / 22.4 / 35.8 L (source key D)."
  }
]
```

`apply` forces every excluded id to `flagged` with answer `null` after normal
routing, so it never enters `published.json` even when the blind solver and the
adjudicator agree with the source key. Its ledger row carries
`excluded: true` and `exclusionReason`; `audit.json` records `exclusions`,
`exclusionsApplied`, and `excludedIds`. `validate` fails if any excluded id
reaches the staged bank or if the audit counts disagree with the file.

Keying such an item to the nearest choice would publish a wrong answer: the
test-taker who computes the stated value correctly would be marked wrong, and
the nearest-match rationale would not survive scrutiny in a printed key. An
explicit exclusion keeps the answer defensible; the paper is 1–2 items shorter
and `validate` allows 45–50 items per supplied paper.

## Validate rules

`validate.mjs` hard-fails and leaves `src/data/questions.json` untouched when:

- fewer than 350 items would be published;
- ids are duplicated or required fields are missing/empty;
- a question does not have exactly four choices or an answer outside 0–3;
- a flagged item appears in the published bank (or any published item is not
  `verified`);
- an explanation still matches
  `\bwait\b|correct option|correct choice|key fix|re-verify|should be`.

  **Deviation from the brief.** The brief listed `/wait|check|.../`, but the
  bare word "check" is ordinary chemistry instruction ("check the burette
  reading"), so it produced false positives and is no longer forbidden. "wait"
  is matched only as a standalone word or sentence opener (`\bwait\b`), so
  "await" and "waiting" are allowed. The remaining phrases are unchanged.
- a field has an odd number of unescaped `$` or an unbalanced `\ce{…}`;
- source, paper, domain, difficulty, chapter, or topic is outside the registry;
- a supplied paper has fewer than 45 or more than 50 published items;
- `exclusions.json` is missing/malformed, an excluded id appears in the staged
  bank, or `audit.exclusions` / `audit.exclusionsApplied` disagree with its
  length;
- `audit.published` does not equal the bank length.

"General chemistry" topics are allowed but reported as a warning. On success the
bank is written via a temp file and rename.

## Notes

- Do not edit `src/data/questions.json`, `ledger.json`, or `audit.json` by hand.
- Do not invent verification answers or adjudications. An empty result set is a
  safe failure, not a publishable state.
- `tests/content-verification.test.mjs` exercises `apply`/`adjudicate` against
  throwaway fixtures in the OS temp directory; it never reads the live results.
- `tests/content-bank.test.ts` describes the published bank (at least 350
  items, 45–50 per supplied paper, exclusion audit) and reads
  `src/data/questions.json` and `content/audit.json` directly.
