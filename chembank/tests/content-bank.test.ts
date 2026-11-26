import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { QUESTION_BY_ID, QUESTIONS } from "../src/data/questions";
import { DOMAINS } from "../src/data/types";
import { topicByName } from "../src/data/topics";

interface BankItem {
  id: string;
  domain: string;
  topic: string;
  difficulty: string;
  source: string;
  stem: string;
  choices: string[];
  answer: number;
  explanation: string;
  paper?: string;
  verified: { status: string };
}

interface Audit {
  published: number;
  flagged: number;
  exclusions: number;
  exclusionsApplied: number;
  excludedIds: string[];
}

interface Exclusion {
  id: string;
  reason: string;
  evidence: string;
}

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8")) as BankItem[];
const audit = JSON.parse(readFileSync("content/audit.json", "utf8")) as Audit;
const exclusions = JSON.parse(
  readFileSync("content/verification/exclusions.json", "utf8"),
) as Exclusion[];

const SUPPLIED_PAPERS = ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"];
const EXCLUDED_IDS = [
  "ch1-3-theory-40",
  "ch1-3-lab-49",
  "ch4-7-theory-06",
  "ch4-7-theory-23",
];
const DIFFICULTIES = ["Foundation", "Standard", "Olympiad"];
const SOURCES = ["supplied-paper", "textbook", "mixed", "gap-fill"];
const MIN_PAPER_SIZE = 45;
const MAX_PAPER_SIZE = 50;

test("publishes a verified bank of at least 350 items", () => {
  expect(bank.length).toBeGreaterThanOrEqual(350);
  expect(QUESTIONS.length).toBe(bank.length);
  expect(audit.flagged).toBeGreaterThanOrEqual(0);
  expect(audit.published).toBe(QUESTIONS.length);
});

test("ids are unique and the by-id index covers the bank exactly once", () => {
  const ids = bank.map((q) => q.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(QUESTION_BY_ID.size).toBe(QUESTIONS.length);
  for (const id of ids) expect(QUESTION_BY_ID.has(id), `missing index entry: ${id}`).toBe(true);
});

test("every published item is complete and well formed", () => {
  for (const q of bank) {
    expect(q.choices, q.id).toHaveLength(4);
    for (const choice of q.choices) {
      expect(typeof choice, q.id).toBe("string");
      expect(choice.trim().length, q.id).toBeGreaterThan(0);
    }
    expect(Number.isInteger(q.answer), q.id).toBe(true);
    expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
    expect(q.answer, q.id).toBeLessThanOrEqual(3);
    expect(q.verified?.status, q.id).toBe("verified");
    expect(q.stem.trim().length, q.id).toBeGreaterThan(0);
    expect(q.explanation.trim().length, q.id).toBeGreaterThan(0);
    expect((DOMAINS as readonly string[]).includes(q.domain), `${q.id}: ${q.domain}`).toBe(true);
    expect(DIFFICULTIES.includes(q.difficulty), `${q.id}: ${q.difficulty}`).toBe(true);
    expect(SOURCES.includes(q.source), `${q.id}: ${q.source}`).toBe(true);
    expect(topicByName(q.topic), `unknown topic: ${q.topic}`).toBeDefined();
  }
});

test("all four supplied papers publish 45-50 items each", () => {
  for (const paper of SUPPLIED_PAPERS) {
    const items = bank.filter((q) => q.paper === paper);
    expect(items.length, paper).toBeGreaterThanOrEqual(MIN_PAPER_SIZE);
    expect(items.length, paper).toBeLessThanOrEqual(MAX_PAPER_SIZE);
    expect(items.every((q) => q.verified.status === "verified"), paper).toBe(true);
  }
});

test("excluded items are auditable and absent from the bank", () => {
  expect(Array.isArray(exclusions)).toBe(true);
  expect(exclusions.map((row) => row.id).sort()).toEqual([...EXCLUDED_IDS].sort());
  for (const row of exclusions) {
    expect(row.reason.trim().length, row.id).toBeGreaterThan(0);
    expect(row.evidence.trim().length, row.id).toBeGreaterThan(0);
    expect(QUESTION_BY_ID.has(row.id), `published excluded id: ${row.id}`).toBe(false);
    expect(bank.some((q) => q.id === row.id), `published excluded id: ${row.id}`).toBe(false);
  }

  expect(audit.exclusions).toBe(exclusions.length);
  expect(audit.exclusionsApplied).toBe(exclusions.length);
  for (const row of exclusions) {
    expect(audit.excludedIds, `audit.excludedIds lacks ${row.id}`).toContain(row.id);
  }
  expect(audit.published).toBe(QUESTIONS.length);
});

test("all five domains are represented", () => {
  for (const domain of DOMAINS) {
    expect(
      QUESTIONS.some((q) => q.domain === domain),
      `no question in domain ${domain}`,
    ).toBe(true);
  }
});
