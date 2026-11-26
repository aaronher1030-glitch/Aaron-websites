/**
 * Build the adjudication worklist from blind results.
 *
 * Reads content/candidates.json and content/verification/results/*.json, and
 * writes only the items that need a second opinion to
 * content/verification/adjudication/batch-NN.json. The hand-off deliberately
 * omits `sourceKey` so adjudicators keep solving blind; only the disputed blind
 * answer is included as context.
 *
 * Routing rules:
 *  - missing or invalid blind row                    -> missing-blind / invalid-blind
 *  - blind answer differs from the source key         -> source-disagreement
 *  - blind marked ambiguous (boolean true or "true")  -> ambiguous
 *  - candidate carries any `claimed-*` flag          -> claimed-key-conflict
 *
 * A `claimed-*` flag means the supplied paper itself names a different key, so
 * those items go to adjudication even when blind and source agree.
 *
 * File locations: prompts are written to content/verification/adjudication/;
 * adjudicator answers are read back from
 * content/verification/results/adjudication-NN.json. Answers are never written
 * into the prompt directory and the results directory is never cleared here.
 *
 * Safe no-op: with no blind results it prints a message and writes nothing.
 *
 * Run with: npm run content:adjudicate
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { claimedKeyFlags, isAmbiguous, KEY_LETTERS, sha256 } from "./lib.mjs";

const RESULTS_DIR = "content/verification/results";
const BATCHES_DIR = "content/verification/batches";
const MANIFEST = "content/verification/manifest.json";
const OUT_DIR = "content/verification/adjudication";

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function listBatchFiles() {
  if (existsSync(MANIFEST)) {
    const manifest = readJson(MANIFEST);
    return Object.keys(manifest.files ?? {}).map((name) => join(BATCHES_DIR, name));
  }
  if (!existsSync(BATCHES_DIR)) return [];
  return readdirSync(BATCHES_DIR)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort()
    .map((name) => join(BATCHES_DIR, name));
}

function sourceKeyOf(candidate) {
  if (typeof candidate.sourceKey === "string" && KEY_LETTERS.includes(candidate.sourceKey)) {
    return candidate.sourceKey;
  }
  return KEY_LETTERS[candidate.answer] ?? "";
}

function main() {
  const resultFiles = existsSync(RESULTS_DIR)
    ? readdirSync(RESULTS_DIR).filter((name) => name.endsWith(".json") && !name.startsWith("adjudication"))
    : [];

  if (resultFiles.length === 0) {
    console.log("make-adjudication: no blind results in content/verification/results; nothing written.");
    return;
  }

  const candidates = readJson("content/candidates.json");
  const candidateById = new Map(candidates.map((item) => [item.id, item]));

  const blindById = new Map();
  for (const name of resultFiles.sort()) {
    const rows = readJson(join(RESULTS_DIR, name));
    if (!Array.isArray(rows)) {
      console.warn(`make-adjudication: skipping ${name} (not a JSON array)`);
      continue;
    }
    for (const row of rows) {
      if (row && typeof row.id === "string") blindById.set(row.id, row);
    }
  }

  if (existsSync(MANIFEST)) {
    const manifest = readJson(MANIFEST);
    for (const [name, entry] of Object.entries(manifest.files ?? {})) {
      const file = join(BATCHES_DIR, name);
      if (!existsSync(file)) {
        console.warn(`make-adjudication: stale manifest — ${name} is missing; run content:batches`);
        continue;
      }
      const actual = sha256(readFileSync(file, "utf8"));
      if (actual !== entry.sha256) {
        console.warn(`make-adjudication: checksum mismatch for ${name}; batches may have changed`);
      }
    }
  }

  const batchFiles = listBatchFiles();
  const worklist = [];
  const counts = {
    missingBlind: 0,
    invalidBlind: 0,
    disagreements: 0,
    ambiguous: 0,
    claimedKeyConflicts: 0,
  };

  for (const file of batchFiles) {
    const name = file.split(/[\\/]/).pop();
    const batch = readJson(file);
    const items = [];
    for (const item of batch) {
      const candidate = candidateById.get(item.id);
      if (!candidate) {
        console.warn(`make-adjudication: ${item.id} is not in candidates.json; skipping`);
        continue;
      }
      const blind = blindById.get(item.id);
      const sourceKey = sourceKeyOf(candidate);
      const blindAnswer =
        blind && typeof blind.answer === "string" && KEY_LETTERS.includes(blind.answer)
          ? blind.answer
          : null;
      const blindAmbiguous = isAmbiguous(blind?.ambiguous);
      const claimed = claimedKeyFlags(candidate.flags);

      const reasons = [];
      if (!blind) reasons.push("missing-blind");
      else if (blindAnswer === null) reasons.push("invalid-blind");
      else if (blindAnswer !== sourceKey) reasons.push("source-disagreement");
      if (blind && blindAmbiguous) reasons.push("ambiguous");
      if (claimed.length > 0) reasons.push("claimed-key-conflict");
      if (reasons.length === 0) continue;

      if (!blind) counts.missingBlind += 1;
      else if (blindAnswer === null) counts.invalidBlind += 1;
      else if (blindAnswer !== sourceKey) counts.disagreements += 1;
      if (blindAmbiguous) counts.ambiguous += 1;
      if (claimed.length > 0) counts.claimedKeyConflicts += 1;

      items.push({
        id: item.id,
        stem: item.stem,
        choices: item.choices,
        reason: reasons[0],
        reasons,
        blind: blind
          ? {
              answer: blind.answer ?? null,
              confidence: blind.confidence ?? null,
              work: blind.work ?? null,
              ambiguous: blindAmbiguous,
            }
          : null,
      });
    }
    if (items.length > 0) worklist.push({ name, items });
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const { name, items } of worklist) {
    writeFileSync(join(OUT_DIR, name), `${JSON.stringify(items, null, 2)}\n`);
  }

  const manifest = {
    total: worklist.reduce((sum, batch) => sum + batch.items.length, 0),
    batches: worklist.length,
    missingBlind: counts.missingBlind,
    invalidBlind: counts.invalidBlind,
    disagreements: counts.disagreements,
    ambiguous: counts.ambiguous,
    claimedKeyConflicts: counts.claimedKeyConflicts,
    createdAt: new Date().toISOString(),
    files: Object.fromEntries(worklist.map(({ name, items }) => [name, items.length])),
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `make-adjudication: ${manifest.total} item(s) in ${manifest.batches} batch file(s) ` +
      `(missing blind ${manifest.missingBlind}, invalid blind ${manifest.invalidBlind}, ` +
      `disagreements ${manifest.disagreements}, ambiguous ${manifest.ambiguous}, ` +
      `claimed-key conflicts ${manifest.claimedKeyConflicts})`,
  );
  console.log(
    `make-adjudication: prompts in ${OUT_DIR}; save answers to ` +
      `${RESULTS_DIR}/adjudication-NN.json (the results directory is never cleared)`,
  );
}

main();
