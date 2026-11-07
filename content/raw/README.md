# Raw paper sources

`ch1-3.md` and `ch4-7.md` are conversions of the user-supplied DOCX practice
papers, produced with **pandoc 3.13**. They are committed verbatim as the
source of record so the extracted bank in `content/docx.raw.json` is
reproducible; do not hand-edit them.

- `ch1-3.md` — Chapters 1–3: a 50-item theory paper, its answer key, a 50-item
  laboratory paper, and its answer key.
- `ch4-7.md` — Chapters 4–7: the same four-part layout, with theory questions
  labelled by topic (`**1. Title:**`) instead of plain numbers.

Structure of each file: both 50-question sets come first (theory, then
laboratory), followed by both answer keys in the same order. Question numbering
restarts at 1 for the second paper.

Regenerate the JSON with:

```bash
npm run content:docx
```
