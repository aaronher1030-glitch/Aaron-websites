export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function percent(correct: number, attempted: number): number | null {
  return attempted === 0 ? null : Math.round((correct / attempted) * 100);
}

/**
 * Plain-text search/dedupe key for rich question text: lowercase, no HTML tags,
 * no math (delimiters and contents), no punctuation, single-spaced.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
