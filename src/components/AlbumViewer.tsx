import { useEffect, useRef, useState } from "react";
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
  focusOnMount = false,
}: {
  albumId: string;
  name: string;
  onClose: () => void;
  /** True only when the panel opens as a disclosure (Photos): focus moves in.
   *  False when it is page content (an activity detail), so the initial load
   *  keeps focus at the top and the skip link stays the first stop. */
  focusOnMount?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<ViewerState>(() => {
    const hit = cache.get(albumId);
    return hit ? { data: hit, error: null, loading: false } : { data: null, error: null, loading: true };
  });

  // A disclosure moves keyboard focus into the panel it just opened; page
  // content must not steal focus from the top of the document on load.
  useEffect(() => {
    if (focusOnMount) closeRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  // Escape belongs to the disclosure only: page content (an activity detail)
  // must not treat Escape anywhere on the page as "leave". Listening on the
  // document covers focus that moved between panel controls, while requiring
  // focus inside keeps Escape from closing a stacked mobile menu *and* this
  // panel in one keypress. The nested lightbox handles Escape in the capture
  // phase and stops propagation, so this bubble-phase listener never sees it.
  useEffect(() => {
    if (!focusOnMount) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const panel = panelRef.current;
      if (!panel || !panel.contains(document.activeElement)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusOnMount, onClose]);

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
    <div className="album-panel" role="region" aria-label={`${name} album`} ref={panelRef}>
      <div className="album-panel__bar">
        <p className="album-panel__name">{name}</p>
        <button ref={closeRef} type="button" className="album-panel__close" onClick={onClose}>
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
