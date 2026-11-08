import { useEffect, useId, useRef, useState } from "react";
import type { Album } from "../../shared/drive";
import { PIO_FOLDER_URL } from "../config";
import { AlbumViewer } from "../components/AlbumViewer";
import { Band, SectionTitle } from "../components/Band";
import { EmptyState, Loading } from "../components/EmptyState";
import { PageHero } from "../components/Hero";
import { PageMeta } from "../components/PageMeta";
import { SmartImage } from "../components/SmartImage";
import { useAlbums } from "../lib/useAlbums";

/**
 * No cover art is shipped for albums without a first photograph, so the card
 * falls back to a ruled plate with the album initials. Inside the card the
 * plate is decorative: the album name is real text directly below it.
 */
function AlbumPlate({ name, labelled = true }: { name: string; labelled?: boolean }) {
  const initials =
    name
      .split(/\s+/)
      .filter((word) => /[A-Za-z0-9]/.test(word))
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <span
      className="album-plate"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? name : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <span className="album-plate__initials">{initials}</span>
    </span>
  );
}

export default function Photos() {
  const { data, error, loading } = useAlbums();
  const [open, setOpen] = useState<Album | null>(null);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closePanel = () => {
    setOpen(null);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [open]);

  return (
    <section className="page">
      <PageMeta
        title="Photos"
        description="Photo albums from SSLG and LGCC activities."
        path="/photos"
      />
      <PageHero
        title="Photos"
        lead="Albums from the SSLG and LGCC. Photos are added by the PIO; this page reads the public Drive albums directly."
      />
      <Band variant="deep">
        <SectionTitle
          title="Albums"
          lead="Every album below is a folder in the PIO's public Drive vault. Select an album to read its photographs without leaving this page."
        />

        {loading ? <Loading label="Loading albums…" /> : null}

        {error ? (
          <EmptyState
            title="Albums are unavailable"
            body={error}
            action={{ href: PIO_FOLDER_URL, label: "Open the Drive folder", external: true }}
          />
        ) : null}

        {data && data.years.length === 0 ? (
          <EmptyState
            title="No albums yet"
            body="The public folder is empty, or the PIO has not published an album for this school year."
            action={{ href: PIO_FOLDER_URL, label: "Open the Drive folder", external: true }}
          />
        ) : null}

        {data?.years.map((year) => (
          <section key={year.id} className="album-year">
            <h2>{year.name}</h2>
            {year.terms.map((term) => (
              <div key={term.id} className="album-term">
                <h3>{term.name}</h3>
                <ul className="album-grid">
                  {term.albums.map((album) => {
                    const expanded = open?.id === album.id;
                    return (
                      <li key={album.id}>
                        <button
                          type="button"
                          className="album-card"
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          onClick={(event) => {
                            triggerRef.current = event.currentTarget;
                            setOpen(expanded ? null : album);
                          }}
                        >
                          {album.cover ? (
                            <SmartImage
                              src={album.cover}
                              alt=""
                              ratio="4 / 3"
                              sizes="(min-width: 896px) 352px, (min-width: 560px) 45vw, 90vw"
                            />
                          ) : (
                            <AlbumPlate name={album.name} labelled={false} />
                          )}
                          <span className="album-card__name">{album.name}</span>
                          <span className="album-card__count">
                            {album.count} {album.count === 1 ? "photo" : "photos"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))}

        <div id={panelId} className="album-panel-host" ref={panelRef}>
          {open ? (
            <AlbumViewer
              key={open.id}
              albumId={open.id}
              name={open.name}
              onClose={closePanel}
            />
          ) : null}
        </div>
      </Band>
    </section>
  );
}
