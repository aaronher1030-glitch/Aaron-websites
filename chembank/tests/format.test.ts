import { expect, test } from "vitest";
import { formatDuration, normalizeText, percent } from "../src/lib/format";

test("normalizeText produces a lowercase plain-text search key", () => {
  expect(normalizeText("  What is the <b>density</b> of $\\ce{CO2}$?  ")).toBe(
    "what is the density of",
  );
  expect(normalizeText("Rate $$k[A]$$ law!")).toBe("rate law");
  expect(normalizeText("  SAME    text ")).toBe("same text");
});

test("formatDuration renders m:ss and h:mm:ss", () => {
  expect(formatDuration(0)).toBe("0:00");
  expect(formatDuration(75)).toBe("1:15");
  expect(formatDuration(3725)).toBe("1:02:05");
  expect(formatDuration(-5)).toBe("0:00");
});

test("percent rounds and returns null when nothing was attempted", () => {
  expect(percent(0, 0)).toBeNull();
  expect(percent(3, 4)).toBe(75);
  expect(percent(1, 3)).toBe(33);
});
