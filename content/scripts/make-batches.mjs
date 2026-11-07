/**
 * Split content/candidates.json into blind verification batches.
 *
 * Each batch item is exactly {id, stem, choices}: no answer, source key,
 * explanation, paper, or flags, so solvers cannot peek. Batches hold 20 items.
 * `manifest.json` records the count and sha256 of every batch so later steps
 * (adjudicate, apply) can detect stale or tampered inputs.
 *
 * Run with: npm run content:batches
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { sha256 } from "./lib.mjs";

const BATCH_SIZE = 20;
const OUT_DIR = "content/verification/batches";
const MANIFEST = "content/verification/manifest.json";

const candidates = JSON.parse(readFileSync("content/candidates.json", "utf8"));
if (!Array.isArray(candidates) || candidates.length === 0) {
  throw new Error("make-batches: content/candidates.json is empty; run content:merge first");
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const files = {};
for (let start = 0, index = 1; start < candidates.length; start += BATCH_SIZE, index += 1) {
  const name = `batch-${String(index).padStart(2, "0")}.json`;
  const items = candidates
    .slice(start, start + BATCH_SIZE)
    .map(({ id, stem, choices }) => ({ id, stem, choices }));
  const text = `${JSON.stringify(items, null, 2)}\n`;
  writeFileSync(join(OUT_DIR, name), text);
  files[name] = { count: items.length, sha256: sha256(text) };
}

const manifest = {
  total: candidates.length,
  batches: Object.keys(files).length,
  batchSize: BATCH_SIZE,
  createdAt: new Date().toISOString(),
  candidatesSha256: sha256(readFileSync("content/candidates.json", "utf8")),
  files,
};
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `make-batches: wrote ${manifest.batches} batches covering ${manifest.total} candidates ` +
    `(${BATCH_SIZE} per batch)`,
);
