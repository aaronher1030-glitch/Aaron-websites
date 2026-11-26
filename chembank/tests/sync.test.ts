import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mergeStores } from "../src/lib/supabase";
import type { Store } from "../src/data/types";

/* The adapter reads import.meta.env at module scope, so env-dependent tests
   stub the vars, reset the module registry, and re-import. The Supabase
   package itself is mocked with a hoisted fake client: no live backend. */
const h = vi.hoisted(() => {
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(),
  };
  return { client, createClient: vi.fn(() => client) };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: h.createClient }));

const base: Store = { version: 1, attempts: [{ qid: "a", correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" }], drills: [], review: [{ qid: "a", dueAt: 1, step: 0, lastSeen: 1 }], stashed: ["a"], theme: "auto", createdAt: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  window.localStorage.clear();
});

function mockProgressTable(row: unknown, rowError: { message: string } | null = null) {
  const maybeSingle = vi.fn(async () => ({ data: row, error: rowError }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn(
    async (
      _payload: unknown,
      _options?: unknown,
    ): Promise<{ error: { message: string } | null }> => ({ error: null }),
  );
  h.client.from.mockReturnValue({ select, upsert });
  return { select, eq, maybeSingle, upsert };
}

test("merges attempts, drills, review, and stash without losing local data", () => {
  const remote: Store = { ...base, attempts: [{ qid: "b", correct: true, answer: "B", ts: 2, elapsedSec: 2, mode: "single" }], review: [{ qid: "b", dueAt: 2, step: 0, lastSeen: 2 }], stashed: ["b"] };
  const merged = mergeStores(base, remote);
  expect(merged.attempts.map((a) => a.qid).sort()).toEqual(["a", "b"]);
  expect(merged.stashed.sort()).toEqual(["a", "b"]);
});

test("merge dedupes attempts by qid:ts, keeps local drills on id collision, and picks the review item with the newest lastSeen", () => {
  const drill = {
    id: "d-1",
    name: "Local drill",
    mode: "practice" as const,
    qids: ["a"],
    answers: {},
    checked: {},
    flagged: {},
    strikes: {},
    index: 0,
    limitSec: 0,
    elapsedSec: 0,
    startedAt: 1,
    done: false,
  };
  const local: Store = {
    ...base,
    drills: [drill],
    review: [
      { qid: "a", dueAt: 10, step: 2, lastSeen: 5 },
      { qid: "c", dueAt: 1, step: 0, lastSeen: 1 },
    ],
  };
  const remote: Store = {
    ...base,
    attempts: [
      { qid: "a", correct: true, answer: "B", ts: 1, elapsedSec: 9, mode: "single" },
      { qid: "z", correct: true, answer: "C", ts: 7, elapsedSec: 3, mode: "timed" },
    ],
    drills: [
      { ...drill, name: "Remote duplicate" },
      { ...drill, id: "d-2", name: "Remote only" },
    ],
    review: [
      { qid: "a", dueAt: 99, step: 0, lastSeen: 2 },
      { qid: "c", dueAt: 8, step: 1, lastSeen: 9 },
    ],
    stashed: ["a", "z"],
  };
  const merged = mergeStores(local, remote);

  // Same qid:ts collapses to one entry (remote wins); distinct ts survives.
  expect(merged.attempts).toHaveLength(2);
  expect(merged.attempts.find((a) => a.qid === "a")).toMatchObject({ answer: "B", elapsedSec: 9 });
  expect(merged.attempts.map((a) => a.qid).sort()).toEqual(["a", "z"]);

  // Drills union by id with the local copy preserved on collision.
  expect(merged.drills.map((d) => d.id).sort()).toEqual(["d-1", "d-2"]);
  expect(merged.drills.find((d) => d.id === "d-1")!.name).toBe("Local drill");

  // Review winner is the larger lastSeen, not dueAt.
  expect(merged.review.find((r) => r.qid === "a")).toMatchObject({ dueAt: 10, lastSeen: 5 });
  expect(merged.review.find((r) => r.qid === "c")).toMatchObject({ dueAt: 8, lastSeen: 9 });

  expect(merged.stashed.sort()).toEqual(["a", "z"]);
  // Local identity fields survive the merge.
  expect(merged.theme).toBe(local.theme);
  expect(merged.createdAt).toBe(local.createdAt);
});

test("syncEnabled is false and getClient returns null when env vars are absent", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  vi.resetModules();
  const sync = await import("../src/lib/supabase");
  expect(sync.syncEnabled()).toBe(false);
  await expect(sync.getClient()).resolves.toBeNull();
  expect(h.createClient).not.toHaveBeenCalled();
});

test("syncEnabled requires both vars", async () => {
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  vi.resetModules();
  const sync = await import("../src/lib/supabase");
  expect(sync.syncEnabled()).toBe(false);
});

test("pullProgress returns null for a missing row, rejects malformed remote data, and accepts a valid store", async () => {
  vi.resetModules();
  const sync = await import("../src/lib/supabase");
  expect(sync.syncEnabled()).toBe(true);
  const table = mockProgressTable(null);

  await expect(sync.pullProgress("u-1")).resolves.toBeNull();
  expect(table.select).toHaveBeenCalledWith("data");
  expect(table.eq).toHaveBeenCalledWith("user_id", "u-1");

  // One malformed element must be refused wholesale, never merged.
  const malformed = [
    { data: { ...base, attempts: [null] } },
    { data: { ...base, attempts: [{ qid: "a", correct: "yes" }] } },
    { data: { ...base, review: [{ qid: "a", dueAt: 1 }] } },
    { data: { ...base, stashed: [42] } },
    { data: { ...base, theme: "neon" } },
    { data: { version: 2 } },
    { data: "not a store" },
  ];
  for (const row of malformed) {
    table.maybeSingle.mockResolvedValueOnce({ data: row, error: null });
    await expect(sync.pullProgress("u-1")).resolves.toBeNull();
  }

  table.maybeSingle.mockResolvedValueOnce({ data: { data: base }, error: null });
  await expect(sync.pullProgress("u-1")).resolves.toEqual(base);

  table.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "network down" } });
  await expect(sync.pullProgress("u-1")).rejects.toThrow("network down");
});

test("pushProgress upserts user_id, data, and updated_at, and surfaces errors", async () => {
  vi.resetModules();
  const sync = await import("../src/lib/supabase");
  const table = mockProgressTable(null);

  await sync.pushProgress("u-1", base);
  expect(table.upsert).toHaveBeenCalledTimes(1);
  const [payload, options] = table.upsert.mock.calls[0] as [
    { user_id: string; data: Store; updated_at: string },
    unknown,
  ];
  expect(payload).toMatchObject({ user_id: "u-1", data: base });
  expect(typeof payload.updated_at).toBe("string");
  expect(options).toEqual({ onConflict: "user_id" });

  table.upsert.mockResolvedValueOnce({ error: { message: "rls denied" } });
  await expect(sync.pushProgress("u-1", base)).rejects.toThrow("rls denied");
});
