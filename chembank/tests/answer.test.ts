import { describe, expect, test } from "vitest";
import { choiceLetter, correctLetter, isCorrect } from "../src/lib/answer";
import type { Question } from "../src/data/types";

const q = { answer: 1 } as Question;

describe("answer checking", () => {
  test("accepts the correct letter in any case", () => {
    expect(isCorrect(q, "b")).toBe(true);
    expect(isCorrect(q, " B ")).toBe(true);
  });
  test("rejects other letters", () => {
    expect(isCorrect(q, "A")).toBe(false);
    expect(isCorrect(q, "")).toBe(false);
  });
  test("maps indexes to letters", () => {
    expect(choiceLetter(0)).toBe("A");
    expect(choiceLetter(3)).toBe("D");
  });
  test("reports the correct letter for an item", () => {
    expect(correctLetter(q)).toBe("B");
    expect(correctLetter({ answer: 0 } as Question)).toBe("A");
    expect(correctLetter({ answer: 3 } as Question)).toBe("D");
  });
});
