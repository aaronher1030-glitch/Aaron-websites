# Content verification pipeline

This directory holds the machine-readable trail from raw question imports to the
published bank. Nothing here is hand-edited during a release except the blind
solver output (which is checked in) and adjudication rows.

## Order of operations

```bash
npm run content:merge        # content/docx.raw.json + prototype.raw.json -> content/candidates.json
npm run content:batches      # candidates -> verification/batches/batch-NN.json + manifest.json
# solve every batch blind, save each response to verification/results/batch-NN.json
npm run content:adjudicate   # results -> verification/adjudication/batch-NN.json (only disputes)
# adjudicate every written row, save back in the same files
npm run content:apply        # results + adjudications -> ledger.json, audit.json, published.json
npm run content:validate     # validates published.json, then atomically writes src/data/questions.json
```

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
believes more than one choice is defensible.

## Adjudication

`npm run content:adjudicate` writes only the items that need a second opinion:
missing blind rows, disagreements with the source key, and ambiguous blind rows.
Each row includes the batch's `{id, stem, choices}` plus the blind answer as
context — never the source key. An adjudicator replies with:

```json
[{ "id": "ch1-3-theory-01", "answer": "D", "ambiguous": false,
   "cleanExplanation": "optional replacement solution" }]
```

`answer` must be A–D and `ambiguous` must not be true for the row to resolve an
item. `status: "flagged"` can be used to explicitly reject an item. With no
blind results the script prints a message and writes nothing.

## Apply rules

`apply-verification.mjs` refuses to run (exit 1, no files written) unless all 22
blind batch results exist. `-- --allow-partial` is for local debugging only and
still never publishes an unverified item.

- blind answer === source key, `ambiguous === false`, no adjudication → verified;
- otherwise a valid adjudication row is required; its answer wins, status
  defaults to `verified`;
- missing blind row, unresolved disagreement, or ambiguous row → flagged and
  **not** published.

Published explanations prefer the blind `cleanExplanation`, then the
adjudicated one, then the source explanation. Clearly meta sentences ("Wait,
check…", "Correct option: X", "Key fix…") are stripped; chemistry is never
rewritten. An explanation that becomes empty is flagged.

`verification/ledger.json` records every candidate with source/blind/adjudicated
answers, status, and any issue. `content/audit.json` records totals, corrections,
dedupe count, missing blind rows, adjudications, and `publishedByPaper`.

## Validate rules

`validate.mjs` hard-fails and leaves `src/data/questions.json` untouched when:

- fewer than 350 items would be published;
- ids are duplicated or required fields are missing/empty;
- a question does not have exactly four choices or an answer outside 0–3;
- a flagged item appears in the published bank (or any published item is not
  `verified`);
- an explanation still matches
  `wait|correct option|correct choice|key fix|re-verify|should be`;
- a field has an odd number of unescaped `$` or an unbalanced `\ce{…}`;
- source, paper, domain, difficulty, chapter, or topic is outside the registry;
- a supplied paper does not have exactly 50 published items;
- `audit.published` does not equal the bank length.

"General chemistry" topics are allowed but reported as a warning. On success the
bank is written via a temp file and rename.

## Notes

- Do not edit `src/data/questions.json`, `ledger.json`, or `audit.json` by hand.
- Do not invent verification answers or adjudications. An empty result set is a
  safe failure, not a publishable state.
- `tests/content-bank.test.ts` currently describes the Task 2 seed bank and is
  updated by the controller after the verified bank is published.
