import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AlbumViewer } from "../src/components/AlbumViewer";
import { PhotoGrid } from "../src/components/PhotoGrid";
import { loadAlbums } from "../src/lib/useAlbums";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("opens the lightbox, steps, and restores focus on Escape", () => {
  render(<PhotoGrid photos={[
    { id: "1", name: "IMG_0012.JPG", mime: "image/jpeg", thumb: "/a.jpg", full: "/b.jpg" },
    { id: "2", name: "IMG_0013.JPG", mime: "image/jpeg", thumb: "/c.jpg", full: "/d.jpg" },
  ]} />);
  const trigger = screen.getByRole("button", { name: /IMG 0012/i });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("1 / 2")).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "ArrowRight" });
  expect(screen.getByText("2 / 2")).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(trigger);
});

test("the lightbox cycles focus between close, previous and next", () => {
  render(<PhotoGrid photos={[
    { id: "1", name: "IMG_0012.JPG", mime: "image/jpeg", thumb: "/a.jpg", full: "/b.jpg" },
    { id: "2", name: "IMG_0013.JPG", mime: "image/jpeg", thumb: "/c.jpg", full: "/d.jpg" },
  ]} />);
  fireEvent.click(screen.getByRole("button", { name: /IMG 0012/i }));

  const close = screen.getByRole("button", { name: /Close photo viewer/i });
  const prev = screen.getByRole("button", { name: /Previous photo/i });
  const next = screen.getByRole("button", { name: /Next photo/i });
  // Opening focuses the close control.
  expect(document.activeElement).toBe(close);

  next.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(close);

  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(next);

  prev.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(close);
});

test("Escape inside the lightbox closes only the lightbox, not the album panel", async () => {
  const onClose = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        album: { id: "nestedAlbum0000000000000", name: "Nested album" },
        photos: [
          { id: "1", name: "IMG_0012.JPG", mime: "image/jpeg", thumb: "/a.jpg", full: "/b.jpg" },
          { id: "2", name: "IMG_0013.JPG", mime: "image/jpeg", thumb: "/c.jpg", full: "/d.jpg" },
        ],
        fetchedAt: "2026-11-08T00:00:00.000Z",
      }),
    })),
  );

  render(
    <AlbumViewer albumId="nestedAlbum0000000000000" name="Nested album" onClose={onClose} focusOnMount />,
  );

  const trigger = await screen.findByRole("button", { name: /IMG 0012/i });
  const panel = screen.getByRole("region", { name: /Nested album album/i });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  // Dispatch on the focused control INSIDE the panel so the event bubbles
  // through the panel's own Escape handler — the path that double-closed both
  // layers before the capture-phase guard.
  const close = screen.getByRole("button", { name: /Close photo viewer/i });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(close, { key: "Escape" });

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(panel).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(trigger);
});

test("an inline album leaves focus and Escape alone", async () => {
  // AlbumViewer also mounts as page content (an activity detail), where its
  // onClose navigates back to the index. Focusing the panel then would steal
  // focus on load, and a page-wide Escape would turn any dismiss gesture into
  // a navigation — including closing the mobile menu.
  const onClose = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        album: { id: "inlineAlbum00000000000", name: "Inline album" },
        photos: [],
        fetchedAt: "2026-11-08T00:00:00.000Z",
      }),
    })),
  );

  render(<AlbumViewer albumId="inlineAlbum00000000000" name="Inline album" onClose={onClose} />);

  const close = screen.getByRole("button", { name: "Close" });
  expect(document.activeElement).not.toBe(close);
  // Let the fetch settle inside act so the assertion above is not racing it.
  expect(await screen.findByText("This album has no photos yet.")).toBeInTheDocument();
  expect(document.activeElement).not.toBe(close);

  // focusOnMount defaults to false here, so Escape is not a close gesture.
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
});

test("focusOnMount moves focus to the panel Close and scopes Escape to it", async () => {
  const onClose = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        album: { id: "disclosureAlbum0000000", name: "Disclosure album" },
        photos: [],
        fetchedAt: "2026-11-08T00:00:00.000Z",
      }),
    })),
  );

  render(
    <AlbumViewer albumId="disclosureAlbum0000000" name="Disclosure album" onClose={onClose} focusOnMount />,
  );
  // Focus happens on mount; await the fetch to keep the state update in act.
  expect(await screen.findByText("This album has no photos yet.")).toBeInTheDocument();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));

  // Escape closes only while focus is inside the panel: a stacked menu owns
  // the key when focus has moved there.
  (document.activeElement as HTMLElement).blur();
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();

  screen.getByRole("button", { name: "Close" }).focus();
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("an empty album says so and still links to its Drive folder", async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      album: { id: "emptyAlbum00000000000000", name: "Empty album" },
      photos: [],
      fetchedAt: "2026-11-08T00:00:00.000Z",
    }),
  }));
  vi.stubGlobal("fetch", fetchMock);

  render(
    <AlbumViewer albumId="emptyAlbum00000000000000" name="Empty album" onClose={() => {}} />,
  );

  expect(screen.getByRole("status")).toHaveTextContent(/Loading photos/i);
  expect(await screen.findByText("This album has no photos yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open in Drive/i })).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/folders/emptyAlbum00000000000000",
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/photos?album=emptyAlbum00000000000000",
    expect.anything(),
  );
});

test("a failed album listing offers a retry that refetches", async () => {
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new Error("network down"))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        album: { id: "retryAlbum00000000000000", name: "Retry album" },
        photos: [],
        fetchedAt: "2026-11-08T00:00:00.000Z",
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  const onClose = vi.fn();
  render(
    <AlbumViewer albumId="retryAlbum00000000000000" name="Retry album" onClose={onClose} />,
  );

  // Scoped to the title: the body repeats the phrase ("…are unavailable right now.").
  expect(
    await screen.findByText(/photos are unavailable/i, { selector: ".empty-state__title" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /open in drive/i })).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/folders/retryAlbum00000000000000",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);

  // Try again refetches; the second response is an empty album, which proves
  // the panel replaced its error state with the new payload.
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  });
  expect(await screen.findByText("This album has no photos yet.")).toBeInTheDocument();
  expect(screen.queryByText(/photos are unavailable/i)).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("a failed album listing is not cached, so the next load retries", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
  );
  await expect(loadAlbums()).rejects.toThrow("503 /api/albums");

  const ok = vi.fn(async () => ({
    ok: true,
    json: async () => ({ years: [], fetchedAt: "2026-11-08T00:00:00.000Z" }),
  }));
  vi.stubGlobal("fetch", ok);

  await expect(loadAlbums()).resolves.toEqual({
    years: [],
    fetchedAt: "2026-11-08T00:00:00.000Z",
  });
  expect(ok).toHaveBeenCalledTimes(1);

  // A success stays cached: a later mount does not refetch.
  await expect(loadAlbums()).resolves.toEqual({
    years: [],
    fetchedAt: "2026-11-08T00:00:00.000Z",
  });
  expect(ok).toHaveBeenCalledTimes(1);
});
