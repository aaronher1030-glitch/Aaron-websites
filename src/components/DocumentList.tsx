import { useState } from "react";
import type { DocFile, DocFolder, FolderKey } from "../../shared/drive";
import { useDocuments } from "../lib/useDocuments";
import { DocumentPlate } from "./DocumentPlate";
import { EmptyState, Loading } from "./EmptyState";

/** en-PH with day/month/year components renders month-first: "November 8, 2026". */
const modifiedFormat = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * The extension is the type tag. Native Drive files carry no extension, so
 * the mime supplies the familiar office tag instead; anything else is FILE.
 */
function typeTag(file: DocFile): string {
  const dot = file.name.lastIndexOf(".");
  if (dot > 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toUpperCase();
  }
  if (file.mime === "application/pdf") return "PDF";
  if (file.mime === "application/vnd.google-apps.document") return "DOC";
  if (file.mime === "application/vnd.google-apps.spreadsheet") return "XLS";
  if (file.mime === "application/vnd.google-apps.presentation") return "PPT";
  return "FILE";
}

/** Only when the API documented a modified time — never invent a date. */
function modifiedLabel(modified: string | null): string | null {
  if (!modified) return null;
  const date = new Date(modified);
  return Number.isNaN(date.getTime()) ? null : modifiedFormat.format(date);
}

/** Opens-in-new-tab affordance; decorative, the row text carries the name. */
function RowArrow() {
  return (
    <svg className="doc-row__arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The API already returns a thumbnail URL; use it. A missing or broken
 * thumbnail (Drive refuses previews for some types) falls back to the plate.
 */
function RowThumb({ file }: { file: DocFile }) {
  const [failed, setFailed] = useState(false);
  if (!file.thumb || failed) {
    return <DocumentPlate label={typeTag(file)} className="doc-plate--thumb" />;
  }
  return (
    <img
      className="doc-row__image"
      src={file.thumb}
      alt=""
      width={56}
      height={70}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function FileRow({ file }: { file: DocFile }) {
  const modified = modifiedLabel(file.modified);
  return (
    <li>
      <a className="doc-row" href={file.view} target="_blank" rel="noreferrer">
        <span className="doc-row__thumb"><RowThumb file={file} /></span>
        <span className="doc-row__body">
          <span className="doc-row__name">{file.name}</span>
          <span className="doc-row__meta">
            <span className="doc-row__tag">{typeTag(file)}</span>
            {modified ? (
              <time className="doc-row__date" dateTime={file.modified ?? undefined}>{modified}</time>
            ) : null}
          </span>
        </span>
        <RowArrow />
      </a>
    </li>
  );
}

/** Subfolders are navigation: same row, a plate thumb, no invented date. */
function FolderRow({ folder }: { folder: DocFolder }) {
  return (
    <li>
      <a className="doc-row" href={folder.url} target="_blank" rel="noreferrer">
        <span className="doc-row__thumb">
          <DocumentPlate label="Folder" className="doc-plate--thumb" />
        </span>
        <span className="doc-row__body">
          <span className="doc-row__name">{folder.name}</span>
          <span className="doc-row__meta">
            <span className="doc-row__tag">Folder</span>
          </span>
        </span>
        <RowArrow />
      </a>
    </li>
  );
}

/**
 * The three Drive states plus the rows themselves. The public folder link
 * is always offered because Drive remains the source of truth; Retry drops
 * the cached rejection so a failed listing can actually recover.
 */
export function DocumentList({
  folder,
  fallbackUrl,
}: {
  folder: FolderKey;
  fallbackUrl: string;
}) {
  const { data, error, loading, reload } = useDocuments(folder);
  const driveAction = { href: fallbackUrl, label: "Open the Drive folder", external: true };

  if (loading) return <Loading label="Loading documents…" />;

  if (error) {
    return (
      <EmptyState
        title="Documents are unavailable"
        body={error}
        onRetry={reload}
        retryLabel="Retry"
        action={driveAction}
      />
    );
  }

  if (!data || (data.files.length === 0 && data.folders.length === 0)) {
    return (
      <EmptyState
        title="No documents in this folder yet."
        body="Published documents appear here automatically once they land in the public Drive folder."
        action={driveAction}
      />
    );
  }

  return (
    <ul className="doc-list">
      {data.folders.map((sub) => <FolderRow key={sub.id} folder={sub} />)}
      {data.files.map((file) => <FileRow key={file.id} file={file} />)}
    </ul>
  );
}
