import { expect, test } from "vitest";

import rawItems from "../content/docx.raw.json";
import type { PaperId } from "../src/data/types";

interface DocxItem {
  id: string;
  paper: PaperId;
  number: number;
  section: string;
  stem: string;
  choices: [string, string, string, string];
  sourceKey: "A" | "B" | "C" | "D";
  explanation: string;
  flags: string[];
  sourceFile: string;
}

const PAPERS: PaperId[] = ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"];

const items = rawItems as unknown as DocxItem[];

test("extracts four complete 50-item papers", () => {
  expect(items).toHaveLength(200);
  for (const paper of PAPERS) {
    expect(items.filter((q) => q.paper === paper)).toHaveLength(50);
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
  expect(items.filter((q) => q.flags.length > 0).length).toBeGreaterThan(10);
  // Named contradictions from the source papers: each states a key on the key
  // line that its own worked solution contradicts. A regression that loses a
  // per-item flag must fail here, not just shrink the aggregate count.
  const known: Record<string, string> = {
    "ch1-3-theory-01": "B",
    "ch4-7-theory-46": "D",
    "ch4-7-lab-10": "B",
  };
  for (const [id, claimed] of Object.entries(known)) {
    const item = items.find((q) => q.id === id);
    expect(item, `missing ${id}`).toBeDefined();
    expect(item!.flags).toContain("key-commentary");
    expect(item!.flags).toContain(`claimed-${claimed}`);
    expect(item!.sourceKey).not.toBe(claimed);
  }
});

test("explanations never carry the next key section's chapter heading", () => {
  for (const q of items) {
    expect(q.explanation).not.toMatch(/\n\n(?:Chapter|Part|Section)\s/);
  }
});

test("ids are unique, kebab-case, and follow <paper>-<number:02d>", () => {
  const ids = items.map((q) => q.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const q of items) {
    expect(q.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(q.id).toBe(`${q.paper}-${String(q.number).padStart(2, "0")}`);
  }
});

test("each paper numbers 1..50 with no gaps or duplicates", () => {
  for (const paper of PAPERS) {
    const numbers = items
      .filter((q) => q.paper === paper)
      .map((q) => q.number)
      .sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  }
});

test("every record is schema-complete and source-attributed", () => {
  const files: Record<string, string> = {
    "ch1-3-theory": "ch1-3.md",
    "ch1-3-lab": "ch1-3.md",
    "ch4-7-theory": "ch4-7.md",
    "ch4-7-lab": "ch4-7.md",
  };
  for (const q of items) {
    expect(Object.keys(q).sort()).toEqual(
      [
        "choices",
        "explanation",
        "flags",
        "id",
        "number",
        "paper",
        "section",
        "sourceFile",
        "sourceKey",
        "stem",
      ].sort(),
    );
    expect(q.sourceFile).toBe(files[q.paper]);
    expect(typeof q.section).toBe("string");
    expect(Array.isArray(q.flags)).toBe(true);
    for (const flag of q.flags) {
      expect(flag).toMatch(/^(?:key-commentary|claimed-[A-D])$/);
    }
    for (const choice of q.choices) {
      expect(choice.trim().length).toBeGreaterThan(0);
    }
    expect(q.stem.trim().length).toBeGreaterThan(10);
    expect(q.explanation.trim().length).toBeGreaterThan(20);
    expect(q.stem).not.toContain("**");
    expect(q.explanation).not.toContain("**");
  }
});

test("pandoc math artifacts are converted to dollar math", () => {
  for (const q of items) {
    const text = [q.stem, q.explanation, ...q.choices].join("\n");
    expect(text).not.toContain("$`");
    expect(text).not.toContain("```");
  }
  expect(items.some((q) => q.stem.includes("$") || q.choices.some((c) => c.includes("$")))).toBe(true);
  expect(items.some((q) => q.stem.includes("$$"))).toBe(true);
});
