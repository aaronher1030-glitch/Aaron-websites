"""Extract the four supplied PNCO/ACho practice papers from pandoc markdown.

Sources of record: content/raw/ch1-3.md and content/raw/ch4-7.md (see the
README there for provenance). Each file contains two 50-item papers: both
question sets come first (theory, then laboratory), followed by both answer
keys in the same order. Output: content/docx.raw.json.

Run with: python -X utf8 content/scripts/extract_docx.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1]
RAW = CONTENT / "raw"
OUT = CONTENT / "docx.raw.json"

# paper ids, in document order, per source file
PAPERS = [
    ("ch1-3.md", ["ch1-3-theory", "ch1-3-lab"]),
    ("ch4-7.md", ["ch4-7-theory", "ch4-7-lab"]),
]

# "**12.**" (ch1-3) or "**12. Title:**" (ch4-7) starting a line
QSTART = re.compile(r"(?m)^\*\*(\d+)\.(?:\*\*[ \t]*|[ \t]+)")
KEYHEAD = re.compile(r"(?m)^\*\*Answer Key[^\n]*\*\*[ \t]*$")
KEYENTRY = re.compile(r"(?m)^[ \t]*(\d+)\.\s+\*\*([A-D])\*\*")
SECTION = re.compile(r"(?m)^\*\*((?:Section|Part)\s+[IVXL]+:[^\n]*?)\*\*[ \t]*$")

MATH_SPAN = re.compile(r"```[ \t]*math[ \t]*\n(.*?)\n```|\$`(.*?)`\$", re.S)
CHOICE_MARK = re.compile(r"([A-D])\\?[\)\.][ \t]+")
TITLE_TAIL = re.compile(r"[:]\*\*[ \t]*|\.\*\*[ \t]*")

COMMENTARY = re.compile(
    r"\b(?:wait|check|correct option|correct choice|key fix|re-?verify|approx|should be)\b",
    re.I,
)

CLAIMS = [
    re.compile(r"[Cc]orrect\s+(?:[Oo]ption|[Cc]hoice)\s*:?\s*\*{0,2}([A-D])\b"),
    re.compile(r"\(\s*\*{0,2}([A-D])\*{0,2}\s*\)"),
    re.compile(r"[Oo]ption\s*\*{0,2}([A-D])\*{0,2}\b"),
    re.compile(r"[Cc]heck\s+\*{0,2}([A-D])\*{0,2}\b"),
]


def mask_math(text: str) -> str:
    """Replace math spans with inert filler (same length) so markup regexes ignore them."""
    out: list[str] = []
    pos = 0
    for match in MATH_SPAN.finditer(text):
        out.append(text[pos : match.start()])
        out.append("x" * (match.end() - match.start()))
        pos = match.end()
    out.append(text[pos:])
    return "".join(out)


def clean_prose(text: str) -> str:
    """Undo pandoc escapes and emphasis markers in non-math text."""
    text = text.replace("\\<", "<").replace("\\>", ">")
    text = text.replace("**", "")
    text = re.sub(r"(?<![\w*])\*([^*\n]+?)\*(?![\w*])", r"\1", text)
    return text


def render(text: str) -> str:
    """Convert pandoc math to $...$ / $$...$$ and clean the surrounding prose."""
    out: list[str] = []
    pos = 0
    for match in MATH_SPAN.finditer(text):
        out.append(clean_prose(text[pos : match.start()]))
        if match.group(1) is not None:
            out.append("$$" + match.group(1).strip() + "$$")
        else:
            out.append("$" + match.group(2).strip() + "$")
        pos = match.end()
    out.append(clean_prose(text[pos:]))
    return "".join(out)


def tidy(text: str) -> str:
    text = text.replace("\r\n", "\n").strip()
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" ?\n ?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def inline(text: str) -> str:
    return re.sub(r"\s+", " ", tidy(text)).strip()


def drop_trailing_bold_paragraphs(text: str) -> str:
    """Remove section headings that pandoc appended after a block (e.g. '**Chapter 5**')."""
    paras = re.split(r"\n\s*\n", text.rstrip())
    while paras and paras[-1].strip().startswith("**"):
        paras.pop()
    return "\n\n".join(paras)


def split_question_sets(body: str) -> list[str]:
    """Split the question region where numbering restarts, keeping the next paper's
    title/scope/section preamble attached to that paper."""
    starts = list(QSTART.finditer(body))
    if not starts:
        return []
    cuts = []
    for index, match in enumerate(starts):
        if index and int(match.group(1)) == 1:
            pos = match.start()
            while True:
                trimmed = len(body[:pos].rstrip())
                break_at = body.rfind("\n\n", 0, trimmed)
                para_start = 0 if break_at == -1 else break_at + 2
                para = body[para_start:trimmed]
                if not para.startswith("**"):
                    break
                pos = para_start
            cuts.append(pos)
    bounds = [0, *cuts, len(body)]
    return [body[bounds[i] : bounds[i + 1]] for i in range(len(bounds) - 1)]


def extract_title(block: str) -> tuple[str, str]:
    """Return (title, rest) for ch4-7's '**N. Title:** stem' headings."""
    masked = mask_math(block)
    head = masked.split("\n", 1)[0]
    match = TITLE_TAIL.search(head)
    if match:
        title = block[: match.start()].strip()
        if match.group(0).startswith(":"):
            title = f"{title}:"
        if 0 < len(title) <= 100:
            rest = block[match.end() :]
            # Word line-break artifact: "Ideal Gas Law / Density:**nWhat ..."
            rest = re.sub(r"^n(?=[A-Z][a-z])", "", rest)
            return title, rest
    if head.rstrip().endswith("**"):
        line = re.search(r"([^\n]{1,100}?)\*\*[ \t]*$", masked, re.M)
        if line:
            return block[: line.end(1)].strip(), block[line.end() :]
    return "", block


def choice_markers(masked: str) -> list[re.Match[str]] | None:
    """Pick the last complete A-B-C-D marker run (earlier hits may be prose)."""
    candidates = list(CHOICE_MARK.finditer(masked))
    for index in range(len(candidates) - 1, -1, -1):
        if candidates[index].group(1) != "A":
            continue
        marks = [candidates[index]]
        want = "B"
        for cand in candidates[index + 1 :]:
            if cand.group(1) == want:
                marks.append(cand)
                if want == "D":
                    break
                want = chr(ord(want) + 1)
        if len(marks) == 4:
            return marks
    return None


def clean_explanation(raw: str) -> str:
    raw = drop_trailing_bold_paragraphs(raw)
    lines = [line.strip() for line in raw.splitlines()]
    kept: list[str] = []
    for line in lines:
        line = re.sub(r"^[-*]\s+", "", line)
        line = re.sub(r"^\*?Solution:\*?\s*", "", line)
        line = re.sub(r"^[—–]\s*", "", line)
        kept.append(line.strip())
    text = "\n\n".join(line for line in kept if line)
    return tidy(render(text))


def detect_flags(explanation: str, source_key: str) -> list[str]:
    flags: list[str] = []
    masked = mask_math(explanation)
    if COMMENTARY.search(masked):
        flags.append("key-commentary")
    claimed = set()
    for pattern in CLAIMS:
        for match in pattern.finditer(masked):
            letter = match.group(1)
            if letter != source_key:
                claimed.add(letter)
    flags.extend(f"claimed-{letter}" for letter in sorted(claimed))
    return flags


def parse_file(filename: str, paper_ids: list[str]) -> list[dict]:
    text = (RAW / filename).read_text(encoding="utf-8")
    headings = list(KEYHEAD.finditer(text))
    if len(headings) != len(paper_ids):
        sys.exit(f"{filename}: expected {len(paper_ids)} answer-key headings, found {len(headings)}")

    body = text[: headings[0].start()]
    question_sets = split_question_sets(body)
    if len(question_sets) != len(paper_ids):
        sys.exit(f"{filename}: expected {len(paper_ids)} question sets, found {len(question_sets)}")

    keys = []
    for i, heading in enumerate(headings):
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        keys.append(text[heading.end() : end])

    records: list[dict] = []
    for paper, qpart, keypart in zip(paper_ids, question_sets, keys):
        starts = list(QSTART.finditer(qpart))
        numbers = [int(m.group(1)) for m in starts]
        if numbers != list(range(1, 51)):
            sys.exit(f"{paper}: question numbering is not 1..50: {numbers}")

        sections = [(m.start(), tidy(m.group(1))) for m in SECTION.finditer(qpart)]
        entries = list(KEYENTRY.finditer(keypart))
        key_numbers = [int(entry.group(1)) for entry in entries]
        if len(set(key_numbers)) != len(key_numbers):
            sys.exit(f"{paper}: duplicate answer-key numbers")
        keys_by_number: dict[int, tuple[str, str]] = {}
        for position, entry in enumerate(entries):
            entry_end = entries[position + 1].start() if position + 1 < len(entries) else len(keypart)
            keys_by_number[int(entry.group(1))] = (entry.group(2), keypart[entry.end() : entry_end])

        missing = [n for n in numbers if n not in keys_by_number]
        if missing:
            print(f"WARNING {paper}: {len(missing)} questions without a key: {missing}", file=sys.stderr)
            sys.exit(f"{paper}: refusing to write an incomplete bank (missing keys)")

        for index, start in enumerate(starts):
            stop = starts[index + 1].start() if index + 1 < len(starts) else len(qpart)
            block = qpart[start.end() : stop]
            title, rest = extract_title(block)
            marks = choice_markers(mask_math(rest))
            if marks is None:
                sys.exit(f"{paper}: could not find four choices for question {numbers[index]}")
            extra = [m.group(1) for m in CHOICE_MARK.finditer(mask_math(rest))]
            if extra != ["A", "B", "C", "D"]:
                print(
                    f"note {paper} q{numbers[index]}: marker candidates {''.join(extra)} "
                    f"(selected A-D run)",
                    file=sys.stderr,
                )
            stem_raw = rest[: marks[0].start()]
            choices_raw = [
                rest[marks[i].end() : marks[i + 1].start() if i + 1 < 4 else len(rest)]
                for i in range(4)
            ]
            choices_raw[3] = drop_trailing_bold_paragraphs(choices_raw[3])

            stem = tidy(render(stem_raw))
            if title:
                clean_title = tidy(render(title))
                joiner = " " if clean_title.endswith(":") else ": "
                stem = f"{clean_title}{joiner}{stem}" if stem else clean_title
            choices = [inline(render(choice)) for choice in choices_raw]

            number = numbers[index]
            source_key, key_body = keys_by_number[number]
            explanation = clean_explanation(render(key_body))
            section = ""
            for offset, label in sections:
                if offset < start.start():
                    section = label
            records.append(
                {
                    "id": f"{paper}-{number:02d}",
                    "paper": paper,
                    "number": number,
                    "section": section,
                    "stem": stem,
                    "choices": choices,
                    "sourceKey": source_key,
                    "explanation": explanation,
                    "flags": detect_flags(explanation, source_key),
                    "sourceFile": filename,
                }
            )
    return records


def main() -> None:
    records: list[dict] = []
    for filename, paper_ids in PAPERS:
        records.extend(parse_file(filename, paper_ids))

    problems = []
    for record in records:
        if len(record["choices"]) != 4 or any(not c for c in record["choices"]):
            problems.append(f"{record['id']}: bad choices")
        if len(record["stem"]) <= 10:
            problems.append(f"{record['id']}: short stem")
        if len(record["explanation"]) <= 20:
            problems.append(f"{record['id']}: short explanation")
        for field in ("stem", "explanation", *record["choices"]):
            if "$`" in field or "```" in field or "**" in field:
                problems.append(f"{record['id']}: leftover pandoc markup")
                break
    if problems:
        sys.exit("extraction problems:\n  " + "\n  ".join(problems))

    OUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    by_paper = {paper: 0 for _, ids in PAPERS for paper in ids}
    for record in records:
        by_paper[record["paper"]] += 1
    flagged = sum(1 for record in records if record["flags"])
    sections = sorted({record["section"] for record in records})
    print(f"wrote {len(records)} questions to {OUT.relative_to(CONTENT.parent)}")
    print("per paper:", by_paper)
    print(f"flagged: {flagged}; sections: {len(sections)}")
    for label in sections:
        print(f"  section: {label!r}")


if __name__ == "__main__":
    main()
