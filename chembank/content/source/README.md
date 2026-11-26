# Prototype source

`chembank-accounts.html` is the user-supplied ChemBank prototype, copied
verbatim on 2026-11-07 from `chembank-accounts.html` inside the archive
`files (2).zip` (the archive was not modified). It is committed as the source
of record for `content/prototype.raw.json` so the import is reproducible; do
not hand-edit it.

- Size: 118,328 bytes
- SHA-256: `748d7337edf3f0f0ba3282f5beda71d9812d512469fab4bb95edbad53b4ee645`
- Archive location at import time:
  `C:\Users\Ma Christine\Downloads\files (2).zip`

The file is a single-page reviewer, not a document to render. Its three
question arrays are plain JavaScript literals:

- `raw` — 80 mixed sample questions
- `RP` — 50 practice-test questions
- `LQ` — 104 textbook questions, keyed to the `SEC` section table

`content/scripts/extract_prototype.mjs` reads only those array literals (in an
empty VM context; the page's DOM code is never run) and writes
`content/prototype.raw.json`. Stems, choices, explanations, HTML (`<sub>`,
`<sup>`) and unicode are copied unchanged for blind verification in Task 5.

Regenerate the JSON with:

```bash
npm run content:prototype
```
