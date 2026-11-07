import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StoreProvider, useStore } from "../src/store";
import type { Attempt } from "../src/data/types";

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

test("exposes exactly store, recordAttempt, and toggleStash", () => {
  const { result } = renderHook(() => useStore(), { wrapper });

  expect(Object.keys(result.current).sort()).toEqual([
    "recordAttempt",
    "store",
    "toggleStash",
  ]);
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
