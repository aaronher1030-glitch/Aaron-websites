/**
 * Verification-pipeline truth tables (review findings I1–I3, I5).
 *
 * Every case runs the real `content/scripts/*.mjs` files inside a throwaway
 * sandbox under the OS temp directory. The live `content/verification/results/`
 * directory is never read or written: fixtures are built from scratch here.
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, test } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = ["apply-verification.mjs", "lib.mjs", "make-adjudication.mjs", "make-batches.mjs"];
const sandboxes = [];

afterAll(() => {
  for (const root of sandboxes) rmSync(root, { recursive: true, force: true });
});

function makeCandidate(id, { sourceKey = "A", flags, explanation = "Source worked solution." } = {}) {
  return {
    id,
    source: "supplied-paper",
    domain: "General",
    topic: "Stoichiometry",
    difficulty: "Olympiad",
    chapter: 3,
    paper: "ch1-3-theory",
    stem: `Stem for ${id}`,
    choices: ["Choice A", "Choice B", "Choice C", "Choice D"],
    answer: "ABCD".indexOf(sourceKey),
    sourceKey,
    explanation,
    ...(flags ? { flags } : {}),
  };
}

function blindRow(id, answer, extra = {}) {
  return { id, answer, confidence: "high", work: "reasoning", ambiguous: false, ...extra };
}

function makeSandbox({ candidates, blind = [], adjudication = null, promptAnswers = null }) {
  const root = mkdtempSync(join(tmpdir(), "chembank-verify-"));
  sandboxes.push(root);

  mkdirSync(join(root, "content/scripts"), { recursive: true });
  for (const name of SCRIPTS) {
    cpSync(join(repoRoot, "content/scripts", name), join(root, "content/scripts", name));
  }
  writeFileSync(join(root, "content/candidates.json"), `${JSON.stringify(candidates, null, 2)}\n`);

  const verification = join(root, "content/verification");
  mkdirSync(join(verification, "batches"), { recursive: true });
  mkdirSync(join(verification, "results"), { recursive: true });
  const batch = candidates.map(({ id, stem, choices }) => ({ id, stem, choices }));
  writeFileSync(join(verification, "batches/batch-01.json"), `${JSON.stringify(batch, null, 2)}\n`);
  writeFileSync(join(verification, "results/batch-01.json"), `${JSON.stringify(blind, null, 2)}\n`);

  if (adjudication) {
    writeFileSync(
      join(verification, "results/adjudication-01.json"),
      `${JSON.stringify(adjudication, null, 2)}\n`,
    );
  }
  if (promptAnswers) {
    mkdirSync(join(verification, "adjudication"), { recursive: true });
    writeFileSync(
      join(verification, "adjudication/batch-01.json"),
      `${JSON.stringify(promptAnswers, null, 2)}\n`,
    );
  }
  return root;
}

function run(root, script, args = []) {
  return spawnSync(process.execPath, [join(root, "content/scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

function readJson(root, relative) {
  return JSON.parse(readFileSync(join(root, relative), "utf8"));
}

describe("apply-verification truth table", () => {
  const candidates = [
    makeCandidate("agree-clean"),
    makeCandidate("agree-ambiguous-string"),
    makeCandidate("agree-ambiguous-upper"),
    makeCandidate("agree-ambiguous-false-string"),
    makeCandidate("agree-ambiguous-boolean"),
    makeCandidate("source-explanation-fallback", {
      explanation: "Multiply the moles by Avogadro's number.",
    }),
    makeCandidate("all-meta", { explanation: "Correct choice: A." }),
    makeCandidate("adj-picks-source"),
    makeCandidate("adj-picks-blind"),
    makeCandidate("adj-third-letter"),
    makeCandidate("adj-string-ambiguous"),
    makeCandidate("disagree-no-adj"),
    makeCandidate("missing-blind-with-adj"),
    makeCandidate("blind-ambiguous-string-resolved"),
    makeCandidate("adj-explanation-fallback"),
    makeCandidate("claimed-agree", { flags: ["key-commentary", "claimed-B"] }),
  ];

  const blind = [
    blindRow("agree-clean", "A", { cleanExplanation: "Divide the mass by the molar mass." }),
    blindRow("agree-ambiguous-string", "A", { ambiguous: "true", cleanExplanation: "Solution." }),
    blindRow("agree-ambiguous-upper", "A", { ambiguous: " TRUE ", cleanExplanation: "Solution." }),
    blindRow("agree-ambiguous-false-string", "A", { ambiguous: "false", cleanExplanation: "Solution." }),
    blindRow("agree-ambiguous-boolean", "A", { ambiguous: true, cleanExplanation: "Solution." }),
    blindRow("source-explanation-fallback", "A", { cleanExplanation: "Wait, check the key." }),
    blindRow("all-meta", "A", { cleanExplanation: "Wait, the key says A." }),
    blindRow("adj-picks-source", "B", { cleanExplanation: "Blind solution." }),
    blindRow("adj-picks-blind", "B", { cleanExplanation: "Blind solution." }),
    blindRow("adj-third-letter", "B", { cleanExplanation: "Blind solution." }),
    blindRow("adj-string-ambiguous", "B", { cleanExplanation: "Blind solution." }),
    blindRow("disagree-no-adj", "B", { cleanExplanation: "Blind solution." }),
    blindRow("blind-ambiguous-string-resolved", "B", {
      ambiguous: "true",
      cleanExplanation: "Blind solution.",
    }),
    blindRow("adj-explanation-fallback", "B", { cleanExplanation: "Blind reasoning." }),
    blindRow("claimed-agree", "A", { cleanExplanation: "Solution." }),
  ];

  const adjudication = [
    { id: "adj-picks-source", answer: "A", cleanExplanation: "Adjudicated solution." },
    { id: "adj-picks-blind", answer: "B", cleanExplanation: "Adjudicated solution." },
    { id: "adj-third-letter", answer: "C", cleanExplanation: "Adjudicated solution." },
    { id: "adj-string-ambiguous", answer: "A", ambiguous: "true" },
    { id: "missing-blind-with-adj", answer: "A" },
    { id: "blind-ambiguous-string-resolved", answer: "A", ambiguous: false },
    { id: "adj-explanation-fallback", answer: "A", cleanExplanation: "Wait, meta only." },
    { id: "claimed-agree", answer: "A", cleanExplanation: "Adjudicated solution." },
  ];

  const root = makeSandbox({
    candidates,
    blind,
    adjudication,
    // Stale answers sitting in the prompt directory must be ignored.
    promptAnswers: [{ id: "disagree-no-adj", answer: "D" }],
  });
  const result = run(root, "apply-verification.mjs", ["--allow-partial"]);

  test("runs to completion on the fixture", () => {
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toMatch(/answers in the prompt directory are ignored/i);
  });

  const ledger = readJson(root, "content/verification/ledger.json");
  const published = readJson(root, "content/verification/published.json");
  const audit = readJson(root, "content/audit.json");
  const rowById = new Map(ledger.map((row) => [row.id, row]));
  const publishedById = new Map(published.map((item) => [item.id, item]));

  test("I1: strips every explanation source before falling back", () => {
    const fallback = publishedById.get("source-explanation-fallback");
    expect(fallback).toBeDefined();
    expect(fallback.explanation).toBe("Multiply the moles by Avogadro's number.");

    const allMeta = rowById.get("all-meta");
    expect(allMeta.status).toBe("flagged");
    expect(allMeta.published).toBe(false);
    expect(allMeta.issue).toMatch(/explanation empty after removing key commentary/);
    expect(publishedById.has("all-meta")).toBe(false);

    // An emptied adjudicated solution falls through to the blind reasoning.
    const changed = publishedById.get("adj-explanation-fallback");
    expect(changed).toBeDefined();
    expect(changed.answer).toBe(0);
    expect(changed.explanation).toBe("Blind reasoning.");
  });

  test("I2: an adjudicator may only confirm the source key or the blind answer", () => {
    expect(publishedById.get("adj-picks-source")).toMatchObject({
      answer: 0,
      verified: { note: "source A; blind B; adjudicated A" },
    });
    expect(publishedById.get("adj-picks-blind")).toMatchObject({
      answer: 1,
      verified: { note: "source A; blind B; adjudicated B" },
    });

    for (const id of ["adj-third-letter"]) {
      const row = rowById.get(id);
      expect(row.status).toBe("flagged");
      expect(row.issue).toBe("adjudicator disagrees with both");
      expect(row.adjudicatorDisagreesWithBoth).toBe(true);
      expect(publishedById.has(id)).toBe(false);
    }
    expect(audit.adjudicatorDisagreements).toBe(1);

    // A blind row is still required: an adjudicator alone cannot publish.
    expect(rowById.get("missing-blind-with-adj").status).toBe("flagged");
    expect(rowById.get("missing-blind-with-adj").issue).toMatch(/missing blind result/);
  });

  test("I3: ambiguous is true for boolean true and for the string \"true\"", () => {
    for (const id of ["agree-ambiguous-string", "agree-ambiguous-upper", "agree-ambiguous-boolean"]) {
      const row = rowById.get(id);
      expect(row.blindAmbiguous, id).toBe(true);
      expect(row.status, id).toBe("flagged");
      expect(publishedById.has(id), id).toBe(false);
    }
    expect(rowById.get("agree-ambiguous-string").blindAmbiguousRaw).toBe("true");
    expect(rowById.get("agree-ambiguous-upper").blindAmbiguousRaw).toBe(" TRUE ");

    const falseString = rowById.get("agree-ambiguous-false-string");
    expect(falseString.blindAmbiguous).toBe(false);
    expect(falseString.status).toBe("verified");

    // An adjudicator's string "true" blocks publication too.
    const adjudicatedAmbiguous = rowById.get("adj-string-ambiguous");
    expect(adjudicatedAmbiguous.status).toBe("flagged");
    expect(adjudicatedAmbiguous.issue).toBe("adjudication marked ambiguous");

    // A blind string "true" can still be resolved by a clean adjudication.
    expect(rowById.get("blind-ambiguous-string-resolved").status).toBe("verified");
  });

  test("answers in the adjudication prompt directory are never applied", () => {
    const row = rowById.get("disagree-no-adj");
    expect(row.status).toBe("flagged");
    expect(row.answer).toBeNull();
    expect(publishedById.has("disagree-no-adj")).toBe(false);
  });

  test("I5: the ledger keeps candidate flags and the audit counts claimed keys", () => {
    expect(rowById.get("claimed-agree").flags).toEqual(["key-commentary", "claimed-B"]);
    expect(rowById.get("agree-clean").flags).toEqual([]);
    expect(audit.claimedKeyConflicts).toBe(1);
    // The adjudicator confirmed the key, so the claimed item publishes.
    expect(publishedById.get("claimed-agree").answer).toBe(0);
    expect(audit.published).toBe(published.length);
    expect(audit.total).toBe(candidates.length);
  });
});

describe("make-adjudication routing", () => {
  const candidates = [
    makeCandidate("claimed-agree", { flags: ["key-commentary", "claimed-B"] }),
    makeCandidate("plain-agree"),
    makeCandidate("disagree"),
    makeCandidate("claimed-disagree", { flags: ["claimed-C"] }),
    makeCandidate("ambiguous"),
    makeCandidate("missing"),
  ];
  const blind = [
    blindRow("claimed-agree", "A"),
    blindRow("plain-agree", "A"),
    blindRow("disagree", "B"),
    blindRow("claimed-disagree", "B"),
    blindRow("ambiguous", "A", { ambiguous: "true" }),
  ];
  const sentinel = [{ id: "sentinel", answer: "A", note: "must survive" }];
  const root = makeSandbox({ candidates, blind, adjudication: sentinel });
  const result = run(root, "make-adjudication.mjs");

  test("routes claimed-key conflicts even when blind and source agree", () => {
    expect(result.status, result.stderr).toBe(0);

    const prompt = readJson(root, "content/verification/adjudication/batch-01.json");
    const byId = new Map(prompt.map((item) => [item.id, item]));
    expect([...byId.keys()].sort()).toEqual([
      "ambiguous",
      "claimed-agree",
      "claimed-disagree",
      "disagree",
      "missing",
    ]);

    expect(byId.get("claimed-agree").reason).toBe("claimed-key-conflict");
    expect(byId.get("claimed-agree").reasons).toEqual(["claimed-key-conflict"]);
    expect(byId.get("claimed-disagree").reason).toBe("source-disagreement");
    expect(byId.get("claimed-disagree").reasons).toEqual([
      "source-disagreement",
      "claimed-key-conflict",
    ]);
    expect(byId.get("ambiguous").reason).toBe("ambiguous");
    expect(byId.get("disagree").reason).toBe("source-disagreement");
    expect(byId.get("missing").reason).toBe("missing-blind");
    expect(byId.has("plain-agree")).toBe(false);

    // Prompts never leak a key or a claimed letter.
    for (const item of prompt) {
      expect(Object.keys(item)).not.toContain("sourceKey");
      expect(Object.keys(item)).not.toContain("claimedKeys");
    }
  });

  test("writes prompts only and never touches saved adjudicator answers", () => {
    const resultsDir = join(root, "content/verification/results");
    expect(readdirSync(resultsDir).sort()).toEqual(["adjudication-01.json", "batch-01.json"]);
    expect(readJson(root, "content/verification/results/adjudication-01.json")).toEqual(sentinel);

    const promptFiles = readdirSync(join(root, "content/verification/adjudication")).sort();
    expect(promptFiles).toEqual(["batch-01.json", "manifest.json"]);
    expect(promptFiles.some((name) => name.startsWith("adjudication-"))).toBe(false);
    expect(existsSync(join(root, "content/verification/adjudication/manifest.json"))).toBe(true);
  });

  test("the adjudication manifest counts each routing reason", () => {
    const manifest = readJson(root, "content/verification/adjudication/manifest.json");
    expect(manifest).toMatchObject({
      total: 5,
      batches: 1,
      missingBlind: 1,
      invalidBlind: 0,
      disagreements: 2,
      ambiguous: 1,
      claimedKeyConflicts: 2,
      files: { "batch-01.json": 5 },
    });
  });
});
