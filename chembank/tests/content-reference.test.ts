import { expect, test } from "vitest";
import { CHAPTER_NOTES } from "../src/data/notes";
import { LAB_TECHNIQUES } from "../src/data/lab";
import {
  ACTIVITY_SERIES,
  CONSTANTS,
  FORMULA_SECTIONS,
  SOLUBILITY_RULES,
} from "../src/data/formulas";
import {
  ACTINIDES,
  ELEMENT_BY_SYMBOL,
  ELEMENTS,
  LANTHANIDES,
} from "../src/data/periodic";
import { GUIDE_LAST_VERIFIED, PNCO_GUIDE } from "../src/data/guide";

test("chapter notes cover all seven chapters with usable detail", () => {
  expect(CHAPTER_NOTES.map((note) => note.chapter)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(new Set(CHAPTER_NOTES.map((note) => note.slug)).size).toBe(7);
  for (const note of CHAPTER_NOTES) {
    expect(note.title.length).toBeGreaterThan(10);
    expect(note.bigIdea.length).toBeGreaterThan(120);
    expect(note.formulas.length).toBeGreaterThanOrEqual(4);
    expect(note.traps.length).toBeGreaterThanOrEqual(3);
    expect(note.checklist.length).toBeGreaterThanOrEqual(2);
  }
});

test("lab bench has at least twelve unique techniques", () => {
  expect(LAB_TECHNIQUES.length).toBeGreaterThanOrEqual(12);
  expect(new Set(LAB_TECHNIQUES.map((technique) => technique.slug)).size).toBe(
    LAB_TECHNIQUES.length,
  );
  for (const technique of LAB_TECHNIQUES) {
    expect(technique.steps.length).toBeGreaterThanOrEqual(3);
    expect(technique.errors.length).toBeGreaterThanOrEqual(2);
    expect(technique.examTraps.length).toBeGreaterThanOrEqual(2);
    expect(technique.precision.length).toBeGreaterThan(20);
  }
});

test("formula sheet covers the constants and every chapter", () => {
  expect(CONSTANTS.length).toBeGreaterThanOrEqual(12);
  expect(CONSTANTS.every((constant) => constant.value && constant.unit)).toBe(true);

  const slugs = FORMULA_SECTIONS.map((section) => section.slug);
  for (const slug of [
    "measurement",
    "stoichiometry",
    "gases",
    "thermochemistry",
    "quantum",
    "equilibrium",
    "electrochemistry",
    "solutions",
    "laboratory",
  ]) {
    expect(slugs).toContain(slug);
  }
  expect(new Set(FORMULA_SECTIONS.map((section) => section.slug)).size).toBe(
    FORMULA_SECTIONS.length,
  );

  const chapterSections = FORMULA_SECTIONS.filter(
    (section) => section.chapter !== undefined,
  );
  expect(new Set(chapterSections.map((section) => section.chapter))).toEqual(
    new Set([1, 2, 3, 4, 5, 6, 7]),
  );

  for (const section of FORMULA_SECTIONS) {
    expect(section.formulas.length).toBeGreaterThanOrEqual(4);
    for (const formula of section.formulas) {
      expect(formula.tex.length).toBeGreaterThan(2);
      expect(formula.tex).not.toContain("```");
    }
  }

  expect(SOLUBILITY_RULES.length).toBeGreaterThanOrEqual(2);
  expect(ACTIVITY_SERIES.length).toBeGreaterThanOrEqual(10);
});

test("periodic table is complete and internally consistent", () => {
  expect(ELEMENTS).toHaveLength(118);
  expect(ELEMENTS.map((element) => element.z)).toEqual(
    Array.from({ length: 118 }, (_, index) => index + 1),
  );
  expect(new Set(ELEMENTS.map((element) => element.symbol)).size).toBe(118);
  expect(ELEMENT_BY_SYMBOL.get("H")?.name).toBe("Hydrogen");
  expect(ELEMENT_BY_SYMBOL.get("Og")?.z).toBe(118);
  expect(LANTHANIDES.map((element) => element.z)).toEqual(
    Array.from({ length: 15 }, (_, index) => 57 + index),
  );
  expect(ACTINIDES.map((element) => element.z)).toEqual(
    Array.from({ length: 15 }, (_, index) => 89 + index),
  );

  for (const element of ELEMENTS) {
    expect(element.mass).toBeGreaterThan(0);
    expect(element.period).toBeGreaterThanOrEqual(1);
    expect(element.period).toBeLessThanOrEqual(7);
    if (element.category === "lanthanide" || element.category === "actinide") {
      expect(element.group).toBeNull();
    } else {
      expect(element.group).toBeGreaterThanOrEqual(1);
      expect(element.group).toBeLessThanOrEqual(18);
    }
  }
});

test("PNCO guide is dated, source-linked, and carries the disclaimer", () => {
  expect(PNCO_GUIDE.length).toBeGreaterThanOrEqual(9);
  expect(new Set(PNCO_GUIDE.map((section) => section.id)).size).toBe(
    PNCO_GUIDE.length,
  );
  expect(PNCO_GUIDE.some((section) => section.title.includes("not affiliated"))).toBe(
    true,
  );
  expect(PNCO_GUIDE.some((section) => section.title.toLowerCase().includes("source"))).toBe(
    true,
  );
  expect(GUIDE_LAST_VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  const allSources = PNCO_GUIDE.flatMap((section) => section.sources ?? []);
  expect(allSources.length).toBeGreaterThanOrEqual(5);
  for (const source of allSources) {
    expect(source.url.startsWith("https://")).toBe(true);
  }
});
