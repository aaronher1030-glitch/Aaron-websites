import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Store } from "../src/data/types";
import type { StoreApi } from "../src/store";

/* AccountMenu behavior against a hoisted fake Supabase client: sign-in
   pull→validate→merge→write→push, debounce pushes, and failure isolation.
   Env is stubbed before the dynamic imports because the adapter captures
   import.meta.env at module scope. */
const h = vi.hoisted(() => {
  const client = {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
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
  h.client.auth.getSession.mockImplementation(async () => ({
    data: { session: null },
    error: null,
  }));
  h.client.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
  h.client.auth.signOut.mockImplementation(async () => ({ error: null }));
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

function signInOk() {
  h.client.auth.signInWithPassword.mockImplementation(async () => ({
    data: { user: { id: "u-1", email: "student@example.com" }, session: {} },
    error: null,
  }));
}

test("AccountMenu renders nothing when sync is disabled", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  vi.resetModules();
  const { AccountMenu } = await import("../src/components/AccountMenu");
  const { StoreProvider } = await import("../src/store");
  const { container } = render(
    <StoreProvider>
      <AccountMenu />
    </StoreProvider>,
  );
  expect(container.firstChild).toBeNull();
  expect(h.createClient).not.toHaveBeenCalled();
});

test("sign-in pulls, merges into the local store, pushes, and debounce-pushes later edits", async () => {
  vi.resetModules();
  const { AccountMenu } = await import("../src/components/AccountMenu");
  const { StoreProvider, useStore } = await import("../src/store");

  const remote: Store = {
    ...base,
    attempts: [{ qid: "b", correct: true, answer: "B", ts: 2, elapsedSec: 2, mode: "single" }],
    stashed: ["b"],
  };
  const table = mockProgressTable({ data: remote });
  signInOk();

  let api: StoreApi | null = null;
  function Probe() {
    api = useStore();
    return <AccountMenu />;
  }
  const user = userEvent.setup();
  render(
    <StoreProvider>
      <Probe />
    </StoreProvider>,
  );

  // Seed a local attempt and stash the remote does not have.
  act(() => {
    api!.recordAttempt({ qid: "a", correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" });
    api!.toggleStash("a");
  });

  await user.click(screen.getByText("Sync"));
  await user.type(screen.getByLabelText("Email"), "student@example.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await screen.findByText("Synced", undefined, { timeout: 5000 });
  expect(h.client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: "student@example.com",
    password: "secret123",
  });
  // Local attempt survived and the remote one was merged in.
  expect(api!.store.attempts.map((a) => a.qid).sort()).toEqual(["a", "b"]);
  expect(api!.store.stashed.sort()).toEqual(["a", "b"]);
  // The merged notebook was pushed back.
  const firstPush = table.upsert.mock.calls[0][0] as { user_id: string; data: Store };
  expect(firstPush.user_id).toBe("u-1");
  expect(firstPush.data.attempts.map((a: { qid: string }) => a.qid).sort()).toEqual(["a", "b"]);

  // A later edit debounce-pushes within ~2 s without blocking local use.
  const pushesBefore = table.upsert.mock.calls.length;
  act(() => {
    api!.recordAttempt({ qid: "c", correct: true, answer: "C", ts: 3, elapsedSec: 1, mode: "single" });
  });
  expect(api!.store.attempts.map((a) => a.qid)).toContain("c");
  await waitFor(
    () => expect(table.upsert.mock.calls.length).toBeGreaterThan(pushesBefore),
    { timeout: 4000 },
  );
  const lastPush = table.upsert.mock.calls[table.upsert.mock.calls.length - 1][0] as { data: Store };
  expect(lastPush.data.attempts.map((a: { qid: string }) => a.qid)).toContain("c");
}, 20000);

test("a failed pull never blocks local use and shows an error status", async () => {
  vi.resetModules();
  const { AccountMenu } = await import("../src/components/AccountMenu");
  const { StoreProvider, useStore } = await import("../src/store");

  mockProgressTable(null, { message: "network down" });
  signInOk();

  let api: StoreApi | null = null;
  function Probe() {
    api = useStore();
    return <AccountMenu />;
  }
  const user = userEvent.setup();
  render(
    <StoreProvider>
      <Probe />
    </StoreProvider>,
  );
  act(() => {
    api!.recordAttempt({ qid: "a", correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" });
  });

  await user.click(screen.getByText("Sync"));
  await user.type(screen.getByLabelText("Email"), "student@example.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await screen.findByText("Sync error", undefined, { timeout: 5000 });
  // The local notebook is untouched and still writable.
  expect(api!.store.attempts.map((a) => a.qid)).toEqual(["a"]);
  act(() => {
    api!.toggleStash("q-9");
  });
  expect(api!.store.stashed).toEqual(["q-9"]);
}, 15000);

test("sign out returns the menu to the offline sign-in form", async () => {
  vi.resetModules();
  const { AccountMenu } = await import("../src/components/AccountMenu");
  const { StoreProvider } = await import("../src/store");

  mockProgressTable(null);
  signInOk();

  const user = userEvent.setup();
  render(
    <StoreProvider>
      <AccountMenu />
    </StoreProvider>,
  );

  await user.click(screen.getByText("Sync"));
  await user.type(screen.getByLabelText("Email"), "student@example.com");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText("Synced", undefined, { timeout: 5000 });

  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(h.client.auth.signOut).toHaveBeenCalledTimes(1);
  await screen.findByRole("button", { name: "Sign in" }, { timeout: 5000 });
  expect(screen.getByText("Offline — local only")).toBeInTheDocument();
}, 15000);