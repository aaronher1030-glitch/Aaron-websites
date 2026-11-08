import { useEffect, useState } from "react";
import type { AlbumsResponse } from "../../shared/drive";
import { getJson } from "./api";

/**
 * The album tree is one request per page load, so the promise is shared by
 * every mount. A rejection clears the slot: caching a failed load would make
 * a retry (route re-entry, a later visit) impossible without a reload.
 */
let pending: Promise<AlbumsResponse> | null = null;

export function loadAlbums(): Promise<AlbumsResponse> {
  pending ??= getJson<AlbumsResponse>("/api/albums").catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

export interface AlbumsState {
  data: AlbumsResponse | null;
  error: string | null;
  loading: boolean;
}

export function useAlbums(): AlbumsState {
  const [state, setState] = useState<AlbumsState>({ data: null, error: null, loading: true });

  useEffect(() => {
    let alive = true;
    loadAlbums()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch(() => {
        if (alive) setState({ data: null, error: "Albums are unavailable right now.", loading: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
