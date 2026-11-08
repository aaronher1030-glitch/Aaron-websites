/**
 * The media layer talks to the read-only Drive proxy in `functions/api/`.
 * Every surface needs the same three behaviours: abort on unmount, a typed
 * payload, and an error that the caller can render.
 */
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}
