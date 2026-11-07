import { expect, test } from "vitest";

import prototypeJson from "../content/prototype.raw.json";

interface PrototypeItem {
  id: string;
  source: "mixed" | "textbook";
  domain: string;
  topic: string;
  difficulty: string;
  stem: string;
  choices: string[];
  answer: number;
  explanation: string;
}

const items = prototypeJson as unknown as PrototypeItem[];

const DOMAINS = ["General", "Physical", "Analytical", "Organic", "Laboratory"];
const DIFFICULTIES = ["Foundation", "Standard", "Olympiad"];
const KEYS = [
  "answer",
  "choices",
  "difficulty",
  "domain",
  "explanation",
  "id",
  "source",
  "stem",
  "topic",
].sort();
const PLACEHOLDER = /^(?:tbd|to do|todo|n\/a|none|lorem ipsum|placeholder|answer|question|\?+|\.+)$/i;

test("imports all three arrays", () => {
  expect(items).toHaveLength(234);
  expect(items.filter((q) => q.source === "mixed")).toHaveLength(80);
  expect(items.filter((q) => q.id.startsWith("proto-practice"))).toHaveLength(50);
  expect(items.filter((q) => q.id.startsWith("proto-textbook"))).toHaveLength(104);
});

test("every prototype item is a complete MCQ", () => {
  for (const q of items) {
    expect(q.choices, q.id).toHaveLength(4);
    expect(Number.isInteger(q.answer), q.id).toBe(true);
    expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
    expect(q.answer, q.id).toBeLessThanOrEqual(3);
    expect(q.stem.length, q.id).toBeGreaterThan(5);
    expect(q.explanation.length, q.id).toBeGreaterThan(10);
  }
});

test("ids are unique and follow the per-array scheme", () => {
  const ids = items.map((q) => q.id);
  expect(new Set(ids).size).toBe(ids.length);
  const schemes: Array<[string, number]> = [
    ["proto-mixed", 80],
    ["proto-practice", 50],
    ["proto-textbook", 104],
  ];
  for (const [prefix, count] of schemes) {
    const matching = items.filter((q) => q.id.startsWith(`${prefix}-`));
    expect(matching).toHaveLength(count);
    expect(matching.map((q) => q.id)).toEqual(
      Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(3, "0")}`),
    );
  }
});

test("every item is schema-complete and source-attributed", () => {
  for (const q of items) {
    expect(Object.keys(q).sort(), q.id).toEqual(KEYS);
    expect(["mixed", "textbook"], q.id).toContain(q.source);
    expect(typeof q.topic, q.id).toBe("string");
    expect(q.topic.trim().length, q.id).toBeGreaterThan(0);
    for (const choice of q.choices) {
      expect(typeof choice, q.id).toBe("string");
      expect(choice.trim().length, q.id).toBeGreaterThan(0);
    }
  }
});

test("every domain is one of the five allowed names", () => {
  for (const q of items) {
    expect(DOMAINS, q.id).toContain(q.domain);
  }
});

test("every difficulty is one of the three allowed names", () => {
  for (const q of items) {
    expect(DIFFICULTIES, q.id).toContain(q.difficulty);
  }
});

test("choices, stem, and explanation are not placeholders", () => {
  for (const q of items) {
    expect(q.stem, q.id).not.toMatch(PLACEHOLDER);
    expect(q.explanation, q.id).not.toMatch(PLACEHOLDER);
    for (const choice of q.choices) {
      expect(choice, q.id).not.toMatch(PLACEHOLDER);
    }
  }
});

test("HTML markup and unicode are preserved verbatim", () => {
  const first = items.find((q) => q.id === "proto-mixed-001");
  expect(first?.stem).toBe("How many neutrons are in a <sup>35</sup>Cl<sup>−</sup> ion?");
  const practice = items.find((q) => q.id === "proto-practice-001");
  expect(practice?.stem).toContain("cm<sup>3</sup>");
  expect(practice?.choices).toContain("3.86 × 10<sup>3</sup>");
  expect(items.filter((q) => /<su[bp]>/.test(q.stem)).length).toBeGreaterThan(50);
});

test("textbook items take their topic from the section table", () => {
  const first = items.find((q) => q.id === "proto-textbook-001");
  expect(first?.topic).toBe("Chemistry: A Science for the Twenty-First Century");
  for (const q of items) {
    if (q.id.startsWith("proto-textbook")) {
      expect(q.domain, q.id).toBe("General");
      expect(q.topic, q.id).not.toBe("Chapter 1–2 foundations");
    }
  }
});
