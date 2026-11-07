/**
 * Build the adjudication worklist from blind results.
 *
 * Reads content/candidates.json and content/verification/results/*.json, and
 * writes only the items that need a second opinion to
 * content/verification/adjudication/batch-NN.json. The hand-off deliberately
 * omits `sourceKey` so adjudicators keep solving blind; only the disputed blind
 * answer is included as context.
 *
 * Safe no-op: with no blind results it prints a message and writes nothing.
 *
 * Run with: npm run content:adjudicate
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { KEY_LETTERS, sha256 } from "./lib.mjs";

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
  let missingBlind = 0;
  let disagreements = 0;
  let ambiguous = 0;

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
      const validLetter = blind && KEY_LETTERS.includes(blind.answer);
      const needs = !validLetter || blind.answer !== candidate.sourceKey || blind.ambiguous === true;
      if (!needs) continue;

      if (!blind) missingBlind += 1;
      else if (blind.answer !== candidate.sourceKey) disagreements += 1;
      if (blind?.ambiguous === true) ambiguous += 1;

      items.push({
        id: item.id,
        stem: item.stem,
        choices: item.choices,
        blind: blind
          ? {
              answer: blind.answer ?? null,
              confidence: blind.confidence ?? null,
              work: blind.work ?? null,
              ambiguous: blind.ambiguous === true,
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
    missingBlind,
    disagreements,
    ambiguous,
    createdAt: new Date().toISOString(),
    files: Object.fromEntries(worklist.map(({ name, items }) => [name, items.length])),
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `make-adjudication: ${manifest.total} item(s) in ${manifest.batches} batch file(s) ` +
      `(missing blind ${missingBlind}, disagreements ${disagreements}, ambiguous ${ambiguous})`,
  );
}

main();
