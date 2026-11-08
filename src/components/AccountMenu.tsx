import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { SYNC_DEBOUNCE_MS } from "../config";
import type { Store } from "../data/types";
import {
  getClient,
  mergeStores,
  pullProgress,
  pushProgress,
  signIn,
  signOut,
  signUp,
  syncEnabled,
} from "../lib/supabase";
import { useStore } from "../store";

type SyncStatus = "offline" | "syncing" | "synced" | "error";

const STATUS_LABEL: Record<SyncStatus, string> = {
  offline: "Offline — local only",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync error",
};

interface Account {
  id: string;
  email: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Sync failed. Your local notebook is untouched.";
}

/**
 * Optional, env-gated account menu for the header tools. Renders nothing at
 * all unless both VITE_SUPABASE_* vars exist. Signing in pulls the remote
 * notebook, validates it, merges it into the local store, and pushes the
 * result; later edits debounce-push. Every network path fails soft: the
 * local notebook keeps working regardless.
 */
export function AccountMenu() {
  const enabled = syncEnabled();
  const { store, importData } = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  // True while a pull→merge→push cycle owns the remote write. Debounce pushes
  // must not race it: pushing the pre-merge store would drop remote-only data.
  const syncInFlightRef = useRef(false);

  const runSync = useCallback(
    async (userId: string) => {
      syncInFlightRef.current = true;
      setStatus("syncing");
      setMessage("");
      try {
        const remote = await pullProgress(userId);
        let next: Store = storeRef.current;
        if (remote) {
          next = mergeStores(storeRef.current, remote);
          // importData re-validates and persists through the normal store
          // path. The merge keeps the local theme, and store.theme is already
          // hydrated from the theme module, so theme authority is undisturbed.
          importData(JSON.stringify(next));
        }
        await pushProgress(userId, next);
        setStatus("synced");
      } catch (error) {
        setStatus("error");
        setMessage(errorMessage(error));
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [importData],
  );

  // Restore an existing session and follow auth changes (refresh, sign-out).
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    getClient()
      .then((client) => {
        if (!client || cancelled) return;
        client.auth
          .getSession()
          .then(({ data }) => {
            if (cancelled) return;
            const user = data.session?.user;
            setAccount(user ? { id: user.id, email: user.email ?? "" } : null);
          })
          .catch(() => {
            /* Offline or unreachable: stay local. */
          });
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          const user = session?.user;
          setAccount((current) => {
            if (!user) return null;
            // Keep the same object on token refreshes so sync does not re-run.
            if (current?.id === user.id) return current;
            return { id: user.id, email: user.email ?? "" };
          });
        });
        unsubscribe = data.subscription.unsubscribe;
      })
      .catch(() => {
        /* Sync unavailable: the notebook stays local. */
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);

  // Sign-in (or a restored session) triggers one pull → merge → push cycle.
  useEffect(() => {
    if (!enabled) return;
    if (!account) {
      setStatus("offline");
      return;
    }
    void runSync(account.id);
  }, [enabled, account, runSync]);

  // While signed in, debounce pushes so rapid answers batch into one upsert.
  useEffect(() => {
    if (!enabled || !account) return;
    const userId = account.id;
    let timer: number;
    const push = () => {
      if (syncInFlightRef.current) {
        // The sign-in cycle owns the remote write and its push already
        // includes edits made during the pull; retry once it has landed.
        timer = window.setTimeout(push, SYNC_DEBOUNCE_MS);
        return;
      }
      pushProgress(userId, storeRef.current)
        .then(() => {
          // Never clobber a newer sync's syncing/error status.
          if (!syncInFlightRef.current) setStatus("synced");
        })
        .catch((error) => {
          if (syncInFlightRef.current) return;
          setStatus("error");
          setMessage(errorMessage(error));
        });
    };
    timer = window.setTimeout(push, SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, account, store]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || !enabled) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "in") {
        const id = await signIn(email.trim(), password);
        setAccount({ id, email: email.trim() });
        setPassword("");
      } else {
        const result = await signUp(email.trim(), password);
        if (result.needsConfirmation) {
          setMessage("Account created. Check your inbox to confirm it, then sign in.");
          setMode("in");
        } else {
          setAccount({ id: result.id, email: email.trim() });
          setPassword("");
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } catch {
      /* The local session clears even if the network call fails. */
    }
    setAccount(null);
    setStatus("offline");
    setMessage("");
    setBusy(false);
  }

  if (!enabled) return null;

  return (
    <details className="account-menu">
      <summary className="nav-more account-summary" title={STATUS_LABEL[status]}>
        <span className={`account-dot account-dot-${status}`} aria-hidden="true" />
        Sync
      </summary>
      <div className="account-panel">
        {account ? (
          <div className="account-body">
            <p className="account-heading">Progress sync</p>
            <p className="account-email">{account.email || "Signed in"}</p>
            <p className={`account-status account-status-${status}`} role="status">
              {STATUS_LABEL[status]}
            </p>
            {message ? <p className="account-message">{message}</p> : null}
            <div className="account-actions">
              <button
                type="button"
                className="account-button"
                onClick={() => void runSync(account.id)}
                disabled={busy || status === "syncing"}
              >
                Sync now
              </button>
              <button
                type="button"
                className="account-button account-button-quiet"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={busy}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form
            className="account-body"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <p className="account-heading">Optional progress sync</p>
            <p className="account-copy">
              ChemBank stays local-first. Sign in only to back up this notebook
              across your devices.
            </p>
            <p className={`account-status account-status-${status}`} role="status">
              {STATUS_LABEL[status]}
            </p>
            <label className="account-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="account-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </label>
            {message ? (
              <p className="account-message" role="alert">
                {message}
              </p>
            ) : null}
            <button type="submit" className="account-button" disabled={busy}>
              {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              className="account-switch"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setMessage("");
              }}
            >
              {mode === "in"
                ? "Need an account? Sign up"
                : "Already registered? Sign in"}
            </button>
          </form>
        )}
        <p className="account-footnote">
          Optional backup only — everything still works offline.
        </p>
      </div>
    </details>
  );
}
