import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Attempt, Drill, Store } from "./data/types";
import { createDrill as buildDrill } from "./lib/drill";

const STORAGE_KEY = "chembank:v1";

export interface StoreApi {
  store: Store;
  recordAttempt: (attempt: Attempt) => void;
  createDrill: (input: {
    name: string;
    mode: "practice" | "timed";
    qids: string[];
    limitSec: number;
  }) => Drill;
  updateDrill: (drill: Drill) => void;
  toggleStash: (qid: string) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function defaultStore(): Store {
  return {
    version: 1,
    attempts: [],
    drills: [],
    review: [],
    stashed: [],
    theme: "auto",
    createdAt: Date.now(),
  };
}

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Store;
    if (
      parsed?.version !== 1 ||
      !Array.isArray(parsed.attempts) ||
      !Array.isArray(parsed.drills) ||
      !Array.isArray(parsed.review) ||
      !Array.isArray(parsed.stashed)
    ) {
      return defaultStore();
    }
    return { ...defaultStore(), ...parsed };
  } catch {
    // Private mode, blocked storage, or corrupt JSON: start clean for this visit.
    return defaultStore();
  }
}

function writeStore(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode or blocked storage: state still lives in memory for this visit.
    return;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(readStore);

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const recordAttempt = useCallback((attempt: Attempt) => {
    setStore((current) => ({
      ...current,
      attempts: [...current.attempts, attempt],
    }));
  }, []);

  const createDrill = useCallback(
    (input: { name: string; mode: "practice" | "timed"; qids: string[]; limitSec: number }) => {
      const drill = buildDrill(input);
      setStore((current) => ({
        ...current,
        drills: [...current.drills, drill],
      }));
      return drill;
    },
    [],
  );

  const updateDrill = useCallback((drill: Drill) => {
    setStore((current) => ({
      ...current,
      drills: current.drills.map((existing) => (existing.id === drill.id ? drill : existing)),
    }));
  }, []);

  const toggleStash = useCallback((qid: string) => {
    setStore((current) => ({
      ...current,
      stashed: current.stashed.includes(qid)
        ? current.stashed.filter((id) => id !== qid)
        : [...current.stashed, qid],
    }));
  }, []);

  const value = useMemo<StoreApi>(
    () => ({ store, recordAttempt, createDrill, updateDrill, toggleStash }),
    [store, recordAttempt, createDrill, updateDrill, toggleStash],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return context;
}
