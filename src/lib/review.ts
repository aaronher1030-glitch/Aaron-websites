import type { ReviewItem, Store } from "../data/types";

const INTERVALS = [1, 3, 7, 21];

export function scheduleReview(existing: ReviewItem | undefined, correct: boolean, now = Date.now()): ReviewItem {
  const step = existing ? Math.min(existing.step + (correct ? 1 : 0), INTERVALS.length - 1) : 0;
  const days = correct ? INTERVALS[step] : 1;
  return { qid: existing?.qid ?? "", dueAt: now + days * 86_400_000, step, lastSeen: now };
}

export function dueReview(store: Store, now = Date.now()) {
  return store.review.filter((r) => r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}