import { useCallback, useEffect, useState } from "react";
import type { DocumentsResponse, FolderKey } from "../../shared/drive";
import { getJson } from "./api";

/**
 * Each folder is one request per page load, shared by every mount (tab
 * re-entry, the Finance page). A rejection clears its slot: caching a failed
 * load would make Retry — or a later visit — impossible without a reload.
 * Mirrors useAlbums, keyed per folder.
 */
const pending = new Map<FolderKey, Promise<DocumentsResponse>>();

export function loadDocuments(folder: FolderKey): Promise<DocumentsResponse> {
  let promise = pending.get(folder);
  if (!promise) {
    promise = getJson<DocumentsResponse>(`/api/documents?folder=${folder}`).catch(
      (error: unknown) => {
        pending.delete(folder);
        throw error;
      },
    );
    pending.set(folder, promise);
  }
  return promise;
}

export interface DocumentsState {
  data: DocumentsResponse | null;
  error: string | null;
  loading: boolean;
}

export function useDocuments(folder: FolderKey): DocumentsState & { reload: () => void } {
  const [state, setState] = useState<DocumentsState>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    // Reset on folder change so a previous folder's rows never flash under
    // the new heading while the shared promise resolves.
    setState({ data: null, error: null, loading: true });
    loadDocuments(folder)
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch(() => {
        if (alive) {
          setState({ data: null, error: "This folder could not be loaded right now.", loading: false });
        }
      });
    return () => {
      alive = false;
    };
  }, [folder, attempt]);

  /**
   * Retry: delete this folder's slot and refetch. The attempt counter
   * re-runs the effect, which subscribes to the fresh promise with the
   * alive guard intact (a fire-and-forget refetch here would risk an
   * unhandled rejection and a setState after unmount).
   */
  const reload = useCallback(() => {
    pending.delete(folder);
    setAttempt((n) => n + 1);
  }, [folder]);

  return { ...state, reload };
}