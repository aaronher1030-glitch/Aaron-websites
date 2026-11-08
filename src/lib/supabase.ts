import type { SupabaseClient } from "@supabase/supabase-js";
import { PROGRESS_TABLE } from "../config";
import type { Store } from "../data/types";
import { isValidStore } from "../store";

/* Optional, env-gated progress sync. With no VITE_SUPABASE_* vars the client
   is never created and the Supabase bundle is never loaded (dynamic import),
   so the local-first app behaves exactly as it does without an account. */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function syncEnabled(): boolean {
  return Boolean(url && key);
}

let clientPromise: Promise<SupabaseClient> | null = null;
export async function getClient(): Promise<SupabaseClient | null> {
  if (!syncEnabled()) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(url!, key!));
  }
  return clientPromise;
}

export function mergeStores(local: Store, remote: Store): Store {
  const attempts = new Map(local.attempts.map((a) => [`${a.qid}:${a.ts}`, a]));
  for (const a of remote.attempts) attempts.set(`${a.qid}:${a.ts}`, a);
  const drills = new Map(local.drills.map((d) => [d.id, d]));
  for (const d of remote.drills) if (!drills.has(d.id)) drills.set(d.id, d);
  const review = new Map(local.review.map((r) => [r.qid, r]));
  for (const r of remote.review) {
    const current = review.get(r.qid);
    if (!current || r.lastSeen > current.lastSeen) review.set(r.qid, r);
  }
  return {
    ...local,
    attempts: [...attempts.values()],
    drills: [...drills.values()],
    review: [...review.values()],
    stashed: [...new Set([...local.stashed, ...remote.stashed])],
  };
}

export async function signIn(email: string, password: string): Promise<string> {
  const client = await getClient();
  if (!client) throw new Error("Sync is not configured.");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign-in failed.");
  return data.user.id;
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ id: string; needsConfirmation: boolean }> {
  const client = await getClient();
  if (!client) throw new Error("Sync is not configured.");
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign-up failed.");
  // With email confirmation enabled Supabase returns a user but no session;
  // the account cannot sync until the address is confirmed.
  return { id: data.user.id, needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  const client = await getClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function pullProgress(userId: string): Promise<Store | null> {
  const client = await getClient();
  if (!client) throw new Error("Sync is not configured.");
  const { data, error } = await client
    .from(PROGRESS_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const payload: unknown = data?.data;
  if (payload == null) return null;
  // A malformed remote notebook must never reach the merge: refuse it whole
  // and let the next push overwrite it with the validated local store.
  if (!isValidStore(payload)) return null;
  return payload;
}

export async function pushProgress(userId: string, store: Store): Promise<void> {
  const client = await getClient();
  if (!client) throw new Error("Sync is not configured.");
  const { error } = await client.from(PROGRESS_TABLE).upsert(
    { user_id: userId, data: store, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}