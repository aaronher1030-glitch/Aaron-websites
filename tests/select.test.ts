import { expect, test } from "vitest";
import { filterQuestions, isAnswerCorrect, type FilterState } from "../src/lib/select";
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

const empty: FilterState = {
  q: "",
  domain: "",
  chapter: "",
  topic: "",
  difficulty: "",
  source: "",
  status: "all",
};

test("no filters returns the whole bank and total tracks items", () => {
  const result = filterQuestions(bank, empty, store);
  expect(result.items.map((q) => q.id)).toEqual(["a", "b"]);
  expect(result.total).toBe(result.items.length);
});

test("filters by chapter, treating unassigned items as no chapter", () => {
  const chapterBank = [...bank, { ...bank[0], id: "c", chapter: 3 } as Question];
  expect(filterQuestions(chapterBank, { ...empty, chapter: "3" }, store).items.map((q) => q.id)).toEqual(["c"]);
  expect(filterQuestions(chapterBank, { ...empty, chapter: "1" }, store).total).toBe(0);
  expect(filterQuestions(bank, { ...empty, chapter: "" }, store).total).toBe(2);
});

test("filters by topic display name", () => {
  expect(filterQuestions(bank, { ...empty, topic: "Gases" }, store).items.map((q) => q.id)).toEqual(["b"]);
  expect(filterQuestions(bank, { ...empty, topic: "Measurement" }, store).items.map((q) => q.id)).toEqual(["a"]);
  expect(filterQuestions(bank, { ...empty, topic: "Kinetics" }, store).total).toBe(0);
});

test("filters by difficulty", () => {
  expect(filterQuestions(bank, { ...empty, difficulty: "Foundation" }, store).items.map((q) => q.id)).toEqual(["a"]);
  expect(filterQuestions(bank, { ...empty, difficulty: "Standard" }, store).items.map((q) => q.id)).toEqual(["b"]);
  expect(filterQuestions(bank, { ...empty, difficulty: "Olympiad" }, store).total).toBe(0);
});

test("filters by source", () => {
  expect(filterQuestions(bank, { ...empty, source: "textbook" }, store).items.map((q) => q.id)).toEqual(["a"]);
  expect(filterQuestions(bank, { ...empty, source: "supplied-paper" }, store).items.map((q) => q.id)).toEqual(["b"]);
  expect(filterQuestions(bank, { ...empty, source: "mixed" }, store).total).toBe(0);
});

test("search spans stem, topic, and explanation, trimmed and case-insensitive", () => {
  const searchBank = [
    { ...bank[0], id: "s1", stem: "A titration curve", topic: "Acids", explanation: "Equivalence point at pH 7." },
    { ...bank[1], id: "s2", stem: "Ideal gas law", topic: "Gases", explanation: "PV = nRT rearranged." },
  ] as Question[];
  expect(filterQuestions(searchBank, { ...empty, q: "TITRATION" }, store).items.map((q) => q.id)).toEqual(["s1"]);
  expect(filterQuestions(searchBank, { ...empty, q: "gases" }, store).items.map((q) => q.id)).toEqual(["s2"]);
  expect(filterQuestions(searchBank, { ...empty, q: "equivalence" }, store).items.map((q) => q.id)).toEqual(["s1"]);
  expect(filterQuestions(searchBank, { ...empty, q: "  PV = nRT  " }, store).items.map((q) => q.id)).toEqual(["s2"]);
  expect(filterQuestions(searchBank, { ...empty, q: "   " }, store).total).toBe(2);
  expect(filterQuestions(searchBank, { ...empty, q: "zzz-no-match" }, store).total).toBe(0);
});

test("unseen excludes every question that has any attempt", () => {
  expect(filterQuestions(bank, { ...empty, status: "unseen" }, store).items.map((q) => q.id)).toEqual(["b"]);
  const fresh: Store = { ...store, attempts: [] };
  expect(filterQuestions(bank, { ...empty, status: "unseen" }, fresh).total).toBe(2);
});

test("the latest attempt decides wrong status", () => {
  const redeemed: Store = {
    ...store,
    attempts: [
      { qid: "a", correct: false, answer: "B", ts: 1, elapsedSec: 1, mode: "single" },
      { qid: "a", correct: true, answer: "A", ts: 2, elapsedSec: 1, mode: "single" },
    ],
  };
  expect(filterQuestions(bank, { ...empty, status: "wrong" }, redeemed).total).toBe(0);
  expect(filterQuestions(bank, { ...empty, status: "unseen" }, redeemed).items.map((q) => q.id)).toEqual(["b"]);

  const relapsed: Store = {
    ...store,
    attempts: [
      { qid: "a", correct: true, answer: "A", ts: 1, elapsedSec: 1, mode: "single" },
      { qid: "a", correct: false, answer: "B", ts: 2, elapsedSec: 1, mode: "single" },
    ],
  };
  expect(filterQuestions(bank, { ...empty, status: "wrong" }, relapsed).items.map((q) => q.id)).toEqual(["a"]);
});

test("flagged follows the stash list only", () => {
  expect(filterQuestions(bank, { ...empty, status: "flagged" }, { ...store, stashed: [] }).total).toBe(0);
  expect(filterQuestions(bank, { ...empty, status: "flagged" }, { ...store, stashed: ["a", "b"] }).total).toBe(2);
});

test("filters compose", () => {
  expect(filterQuestions(bank, { ...empty, domain: "Physical", status: "flagged" }, store).items.map((q) => q.id)).toEqual(["b"]);
  expect(filterQuestions(bank, { ...empty, domain: "General", status: "flagged" }, store).total).toBe(0);
  expect(filterQuestions(bank, { ...empty, q: "gas", domain: "Physical", difficulty: "Standard", source: "supplied-paper" }, store).items.map((q) => q.id)).toEqual(["b"]);
});

test("isAnswerCorrect delegates to the answer key", () => {
  expect(isAnswerCorrect(bank[0], "A")).toBe(true);
  expect(isAnswerCorrect(bank[0], "b")).toBe(false);
  expect(isAnswerCorrect(bank[1], "B")).toBe(true);
  expect(isAnswerCorrect(bank[1], "")).toBe(false);
});