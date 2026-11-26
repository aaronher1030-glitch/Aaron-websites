import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StoreProvider, useStore } from "../src/store";
import type { Attempt, Drill } from "../src/data/types";

const STORAGE_KEY = "chembank:v1";

const attempt: Attempt = {
  qid: "q-1",
  correct: true,
  answer: "A",
  ts: 1,
  elapsedSec: 2,
  mode: "single",
};

function wrapper({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

test("hydrates the default store when nothing is persisted", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  expect(result.current.store).toMatchObject({
    version: 1,
    attempts: [],
    drills: [],
    review: [],
    stashed: [],
    theme: "auto",
  });
  expect(typeof result.current.store.createdAt).toBe("number");
});

test("exposes exactly the full store surface", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  expect(Object.keys(result.current).sort()).toEqual([
    "clearReview",
    "createDrill",
    "exportData",
    "importData",
    "recordAttempt",
    "reset",
    "setTheme",
    "store",
    "toggleStash",
    "updateDrill",
  ]);
});

test("createDrill appends, persists, and returns the new drill", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  let returned: Drill | undefined;
  act(() => {
    returned = result.current.createDrill({
      name: "Diagnostic 20",
      mode: "practice",
      qids: ["q-1", "q-2"],
      limitSec: 0,
    });
  });

  expect(returned).toBeDefined();
  expect(returned).toMatchObject({
    name: "Diagnostic 20",
    mode: "practice",
    qids: ["q-1", "q-2"],
    limitSec: 0,
    answers: {},
    checked: {},
    flagged: {},
    strikes: {},
    index: 0,
    elapsedSec: 0,
    done: false,
  });
  expect(typeof returned!.id).toBe("string");
  expect(typeof returned!.startedAt).toBe("number");
  expect(result.current.store.drills).toHaveLength(1);
  expect(result.current.store.drills[0]).toEqual(returned);
  const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  expect(persisted.drills).toEqual([returned]);
});

test("updateDrill replaces by id and persists; an unknown id is a no-op", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  let returned: Drill | undefined;
  act(() => {
    returned = result.current.createDrill({
      name: "Short timed",
      mode: "timed",
      qids: ["q-1"],
      limitSec: 90,
    });
  });
  const drill = returned!;

  act(() => {
    result.current.updateDrill({ ...drill, index: 1, elapsedSec: 5, answers: { "q-1": "B" } });
  });
  expect(result.current.store.drills).toHaveLength(1);
  expect(result.current.store.drills[0]).toMatchObject({
    id: drill.id,
    index: 1,
    elapsedSec: 5,
    answers: { "q-1": "B" },
  });
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").drills[0]).toMatchObject({
    id: drill.id,
    index: 1,
    elapsedSec: 5,
  });

  act(() => {
    result.current.updateDrill({ ...drill, id: "ghost", index: 9 });
  });
  expect(result.current.store.drills).toHaveLength(1);
  expect(result.current.store.drills[0].index).toBe(1);
});

test("recordAttempt appends and persists to chembank:v1", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  act(() => result.current.recordAttempt(attempt));

  expect(result.current.store.attempts).toEqual([attempt]);
  const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  expect(persisted.attempts).toEqual([attempt]);

  act(() => result.current.recordAttempt({ ...attempt, qid: "q-2", correct: false }));

  expect(result.current.store.attempts).toHaveLength(2);
  expect(result.current.store.attempts[1]).toMatchObject({ qid: "q-2", correct: false });
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").attempts).toHaveLength(2);
});

test("toggleStash adds then removes and persists each step", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  act(() => result.current.toggleStash("q-1"));
  expect(result.current.store.stashed).toEqual(["q-1"]);
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").stashed).toEqual(["q-1"]);

  act(() => result.current.toggleStash("q-2"));
  expect(result.current.store.stashed).toEqual(["q-1", "q-2"]);

  act(() => result.current.toggleStash("q-1"));
  expect(result.current.store.stashed).toEqual(["q-2"]);
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").stashed).toEqual(["q-2"]);
});

test("a new provider rehydrates persisted state", () => {
  const first = renderHook(() => useStore(), { wrapper });
  act(() => {
    first.result.current.recordAttempt(attempt);
    first.result.current.toggleStash("q-9");
  });
  const createdAt = first.result.current.store.createdAt;
  first.unmount();

  const second = renderHook(() => useStore(), { wrapper });
  expect(second.result.current.store.attempts).toEqual([attempt]);
  expect(second.result.current.store.stashed).toEqual(["q-9"]);
  expect(second.result.current.store.createdAt).toBe(createdAt);
});

test("corrupt persisted JSON falls back to defaults", () => {
  window.localStorage.setItem(STORAGE_KEY, "{not json");

  const { result } = renderHook(() => useStore(), { wrapper });
  expect(result.current.store.version).toBe(1);
  expect(result.current.store.attempts).toEqual([]);
  expect(result.current.store.stashed).toEqual([]);
});

test("a persisted store from another version falls back to defaults", () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 2, attempts: [attempt], drills: [], review: [], stashed: [], theme: "auto", createdAt: 1 }),
  );

  const { result } = renderHook(() => useStore(), { wrapper });
  expect(result.current.store.attempts).toEqual([]);
});

test("blocked storage does not crash the provider and state still updates in memory", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });

  const { result } = renderHook(() => useStore(), { wrapper });
  expect(result.current.store.attempts).toEqual([]);

  act(() => result.current.recordAttempt(attempt));
  expect(result.current.store.attempts).toEqual([attempt]);

  act(() => result.current.toggleStash("q-1"));
  expect(result.current.store.stashed).toEqual(["q-1"]);
});

test("useStore outside a provider fails loudly", () => {
  expect(() => renderHook(() => useStore())).toThrow(/StoreProvider/);
});

test("recordAttempt upserts a review item carrying the attempt qid in every mode", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  for (const mode of ["single", "practice", "timed"] as const) {
    act(() => result.current.recordAttempt({ ...attempt, qid: `q-${mode}`, mode, correct: false }));
  }

  expect(result.current.store.review.map((item) => item.qid).sort()).toEqual([
    "q-practice",
    "q-single",
    "q-timed",
  ]);
  for (const item of result.current.store.review) {
    expect(item.qid).not.toBe("");
    expect(item.step).toBe(0);
  }

  // A repeat attempt upserts the same qid rather than appending a duplicate.
  act(() => result.current.recordAttempt({ ...attempt, qid: "q-single", correct: true }));
  expect(result.current.store.review).toHaveLength(3);
  const single = result.current.store.review.find((item) => item.qid === "q-single")!;
  expect(single.step).toBe(1);
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").review).toHaveLength(3);
});

test("clearReview removes one review item, persists, and ignores unknown ids", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => {
    result.current.recordAttempt({ ...attempt, qid: "q-1", correct: false });
    result.current.recordAttempt({ ...attempt, qid: "q-2", correct: false });
  });

  act(() => result.current.clearReview("q-1"));
  expect(result.current.store.review.map((item) => item.qid)).toEqual(["q-2"]);
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").review.map((item: { qid: string }) => item.qid)).toEqual(["q-2"]);

  act(() => result.current.clearReview("ghost"));
  expect(result.current.store.review).toHaveLength(1);
});

test("exportData serializes the current store as JSON", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => result.current.recordAttempt(attempt));

  const json = result.current.exportData();
  expect(typeof json).toBe("string");
  const parsed = JSON.parse(json);
  expect(parsed.version).toBe(1);
  expect(parsed.attempts).toEqual([attempt]);
});

test("importData replaces the store when the payload is valid", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  const payload = {
    version: 1,
    attempts: [attempt],
    drills: [],
    review: [{ qid: "q-1", dueAt: 5, step: 0, lastSeen: 1 }],
    stashed: ["q-9"],
    theme: "light",
    createdAt: 42,
  };

  let ok = false;
  act(() => {
    ok = result.current.importData(JSON.stringify(payload));
  });

  expect(ok).toBe(true);
  expect(result.current.store.attempts).toEqual([attempt]);
  expect(result.current.store.stashed).toEqual(["q-9"]);
  expect(result.current.store.review).toEqual(payload.review);
  expect(result.current.store.createdAt).toBe(42);
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").attempts).toEqual([attempt]);
});

test("importData rejects invalid payloads and leaves the store unchanged", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => result.current.recordAttempt(attempt));
  const before = result.current.store;

  const badPayloads = [
    "{not json",
    JSON.stringify({ version: 2, attempts: [], drills: [], review: [], stashed: [] }),
    JSON.stringify({ version: 1, attempts: "nope", drills: [], review: [], stashed: [] }),
    JSON.stringify({ version: 1, attempts: [], drills: [], review: [], stashed: "nope" }),
  ];
  for (const bad of badPayloads) {
    let ok = true;
    act(() => {
      ok = result.current.importData(bad);
    });
    expect(ok).toBe(false);
    expect(result.current.store).toEqual(before);
  }
});

function importPayload() {
  return {
    version: 1,
    attempts: [{ ...attempt }],
    drills: [
      {
        id: "d-1",
        name: "Imported drill",
        mode: "practice",
        qids: ["q-1"],
        answers: {},
        checked: {},
        flagged: {},
        strikes: {},
        index: 0,
        limitSec: 0,
        elapsedSec: 0,
        startedAt: 1,
        done: false,
      },
    ],
    review: [{ qid: "q-1", dueAt: 5, step: 0, lastSeen: 1 }],
    stashed: ["q-9"],
    theme: "light",
    createdAt: 42,
  };
}

function omitKey<T extends object, K extends keyof T>(source: T, key: K): Omit<T, K> {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

/* One malformed element is enough to refuse the whole payload: a null attempt
   otherwise persists and crashes every page that reads latestAttemptMap. */
function malformedPayloads(): { label: string; payload: unknown }[] {
  const base = importPayload();
  const drill = base.drills[0];
  const reviewItem = base.review[0];
  return [
    { label: "null attempt", payload: { ...base, attempts: [null] } },
    { label: "empty attempt object", payload: { ...base, attempts: [{}] } },
    { label: "attempt qid not a string", payload: { ...base, attempts: [{ ...attempt, qid: 7 }] } },
    { label: "attempt correct not a boolean", payload: { ...base, attempts: [{ ...attempt, correct: "yes" }] } },
    { label: "attempt answer not a string", payload: { ...base, attempts: [{ ...attempt, answer: null }] } },
    { label: "attempt ts not a number", payload: { ...base, attempts: [{ ...attempt, ts: "1" }] } },
    { label: "attempt missing elapsedSec", payload: { ...base, attempts: [omitKey(attempt, "elapsedSec")] } },
    { label: "attempt mode outside the union", payload: { ...base, attempts: [{ ...attempt, mode: "exam" }] } },
    { label: "null review item", payload: { ...base, review: [null] } },
    { label: "review qid not a string", payload: { ...base, review: [{ ...reviewItem, qid: 3 }] } },
    { label: "review dueAt not a number", payload: { ...base, review: [{ ...reviewItem, dueAt: "5" }] } },
    { label: "review step not a number", payload: { ...base, review: [{ ...reviewItem, step: null }] } },
    { label: "review missing lastSeen", payload: { ...base, review: [omitKey(reviewItem, "lastSeen")] } },
    { label: "null drill", payload: { ...base, drills: [null] } },
    { label: "drill id not a string", payload: { ...base, drills: [{ ...drill, id: 5 }] } },
    { label: "drill missing name", payload: { ...base, drills: [omitKey(drill, "name")] } },
    { label: "drill mode outside practice|timed", payload: { ...base, drills: [{ ...drill, mode: "single" }] } },
    { label: "drill qids not an array", payload: { ...base, drills: [{ ...drill, qids: "q-1" }] } },
    { label: "drill qids entries not strings", payload: { ...base, drills: [{ ...drill, qids: [7] }] } },
    { label: "drill answers not an object", payload: { ...base, drills: [{ ...drill, answers: [] }] } },
    { label: "drill checked null", payload: { ...base, drills: [{ ...drill, checked: null }] } },
    { label: "drill flagged not an object", payload: { ...base, drills: [{ ...drill, flagged: "no" }] } },
    { label: "drill strikes not an object", payload: { ...base, drills: [{ ...drill, strikes: [] }] } },
    { label: "drill index not a number", payload: { ...base, drills: [{ ...drill, index: "0" }] } },
    { label: "drill missing limitSec", payload: { ...base, drills: [omitKey(drill, "limitSec")] } },
    { label: "drill elapsedSec not a number", payload: { ...base, drills: [{ ...drill, elapsedSec: null }] } },
    { label: "drill startedAt not a number", payload: { ...base, drills: [{ ...drill, startedAt: "x" }] } },
    { label: "drill done not a boolean", payload: { ...base, drills: [{ ...drill, done: "false" }] } },
    { label: "stashed entry null", payload: { ...base, stashed: [null] } },
    { label: "stashed entry not a string", payload: { ...base, stashed: [42] } },
    { label: "theme outside the union", payload: { ...base, theme: "neon" } },
    { label: "createdAt not a number", payload: { ...base, createdAt: "42" } },
    { label: "missing createdAt", payload: omitKey(base, "createdAt") },
  ];
}

test("importData rejects every malformed element shape and leaves the store unchanged", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => result.current.recordAttempt(attempt));
  const before = result.current.store;

  for (const { label, payload } of malformedPayloads()) {
    let ok = true;
    act(() => {
      ok = result.current.importData(JSON.stringify(payload));
    });
    expect(ok, label).toBe(false);
    expect(result.current.store, label).toEqual(before);
  }
});

test("importData accepts a well-formed payload that includes a drill", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  const payload = importPayload();

  let ok = false;
  act(() => {
    ok = result.current.importData(JSON.stringify(payload));
  });

  expect(ok).toBe(true);
  expect(result.current.store.attempts).toEqual(payload.attempts);
  expect(result.current.store.drills).toEqual(payload.drills);
  expect(result.current.store.review).toEqual(payload.review);
  expect(result.current.store.theme).toBe("light");
});

test("malformed persisted elements fall back to defaults on hydrate", () => {
  for (const { label, payload } of malformedPayloads()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const { result, unmount } = renderHook(() => useStore(), { wrapper });
    expect(result.current.store.version, label).toBe(1);
    expect(result.current.store.attempts, label).toEqual([]);
    expect(result.current.store.drills, label).toEqual([]);
    expect(result.current.store.review, label).toEqual([]);
    expect(result.current.store.stashed, label).toEqual([]);
    unmount();
  }
});

test("reset restores fresh defaults with a new createdAt", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => {
    result.current.recordAttempt(attempt);
    result.current.toggleStash("q-1");
  });
  const oldCreated = result.current.store.createdAt;
  vi.spyOn(Date, "now").mockReturnValue(oldCreated + 1000);

  act(() => result.current.reset());

  expect(result.current.store).toMatchObject({
    version: 1,
    attempts: [],
    drills: [],
    review: [],
    stashed: [],
    theme: "auto",
    createdAt: oldCreated + 1000,
  });
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").attempts).toEqual([]);
});

test("setTheme writes store.theme and delegates light/dark to the theme module", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  act(() => result.current.setTheme("dark"));
  expect(result.current.store.theme).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(window.localStorage.getItem("chembank:theme")).toBe("dark");

  act(() => result.current.setTheme("light"));
  expect(result.current.store.theme).toBe("light");
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(window.localStorage.getItem("chembank:theme")).toBe("light");
});

test("setTheme auto clears the stored override and applies the system theme", () => {
  const { result } = renderHook(() => useStore(), { wrapper });
  act(() => result.current.setTheme("dark"));
  act(() => result.current.setTheme("auto"));

  expect(result.current.store.theme).toBe("auto");
  expect(window.localStorage.getItem("chembank:theme")).toBeNull();
  expect(["light", "dark"]).toContain(document.documentElement.dataset.theme);
});

test("the provider hydrates store.theme from the stored theme override", () => {
  window.localStorage.setItem("chembank:theme", "dark");
  const { result } = renderHook(() => useStore(), { wrapper });
  expect(result.current.store.theme).toBe("dark");
});
