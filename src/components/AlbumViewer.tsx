import { useEffect, useState } from "react";
import type { PhotosResponse } from "../../shared/drive";
import { getJson } from "../lib/api";
import { EmptyState, Loading } from "./EmptyState";
import { PhotoGrid } from "./PhotoGrid";

/** One album costs one Drive listing, so a hit survives reopening the panel. */
const cache = new Map<string, PhotosResponse>();

const folderUrl = (albumId: string) => `https://drive.google.com/drive/folders/${albumId}`;

interface ViewerState {
  data: PhotosResponse | null;
  error: string | null;
  loading: boolean;
}

/**
 * The inline panel that an album card discloses. Not a dialog: it sits in
 * the page flow, keeps the album grid visible and returns focus to the card
 * that opened it when it closes.
 */
export function AlbumViewer({
  albumId,
  name,
  onClose,
}: {
  albumId: string;
  name: string;
  onClose: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ViewerState>(() => {
    const hit = cache.get(albumId);
    return hit ? { data: hit, error: null, loading: false } : { data: null, error: null, loading: true };
  });

  useEffect(() => {
    const hit = cache.get(albumId);
    if (hit) {
      setState({ data: hit, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, error: null, loading: true });
    getJson<PhotosResponse>(
      `/api/photos?album=${encodeURIComponent(albumId)}`,
      controller.signal,
    )
      .then((data) => {
        cache.set(albumId, data);
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error as Error | null)?.name === "AbortError") return;
        setState({ data: null, error: "Photos are unavailable right now.", loading: false });
      });
    return () => controller.abort();
  }, [albumId, attempt]);

  const driveUrl = folderUrl(albumId);

  return (
    <div
      className="album-panel"
      role="region"
      aria-label={`${name} album`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="album-panel__bar">
        <p className="album-panel__name">{name}</p>
        <button type="button" className="album-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      {state.loading ? <Loading label="Loading photos…" /> : null}

      {state.error ? (
        <EmptyState
          title="Photos are unavailable"
          body={state.error}
          onRetry={() => setAttempt((value) => value + 1)}
          action={{ href: driveUrl, label: "Open in Drive", external: true }}
        />
      ) : null}

      {state.data && state.data.photos.length === 0 ? (
        <EmptyState
          title="This album has no photos yet."
          body="The folder exists in Drive, but the PIO has not added photographs to it."
          action={{ href: driveUrl, label: "Open in Drive", external: true }}
        />
      ) : null}

      {state.data && state.data.photos.length > 0 ? (
        <PhotoGrid photos={state.data.photos} label={`${name} photos`} />
      ) : null}
    </div>
  );
}
