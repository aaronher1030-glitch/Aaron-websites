import { fireEvent, render, screen } from "@testing-library/react";
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
    <AlbumViewer albumId="nestedAlbum0000000000000" name="Nested album" onClose={onClose} />,
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
