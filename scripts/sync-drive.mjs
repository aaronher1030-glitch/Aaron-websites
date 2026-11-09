// Build-time snapshot of the public SSLG Drive folders.
//
// The site has no Google API key, so the media layer reads a committed
// snapshot instead of calling the Drive API at runtime. This script scrapes
// the same server-rendered listing the public "embedded folder view" uses:
//
//   https://drive.google.com/embeddedfolderview?id=<FOLDER_ID>#list
//
// It never writes to Drive. If the network is unavailable it keeps the
// existing snapshot (the site must still build) and says so.
//
// Run with `npm run sync:drive`; `npm run deploy` runs it automatically so
// every deployment refreshes the lists.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = join(root, "src", "content", "drive-snapshot.json");

const read = (relative) => readFileSync(join(root, relative), "utf8");
const documentsSource = read("src/content/documents.ts");
const siteSource = read("src/content/site.ts");
const configSource = read("src/config.ts");

function folderId(url, label) {
  const match = url.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (!match) throw new Error(`sync-drive: no folder id in ${label}: ${url}`);
  return match[1];
}

/** Pull `key` + `folderUrl` pairs out of the document-group literals. */
function documentFolders() {
  const groups = [];
  const pattern = /key:\s*"([a-z]+)"[\s\S]*?folderUrl:\s*"([^"]+)"/g;
  for (const match of documentsSource.matchAll(pattern)) {
    groups.push({ key: match[1], id: folderId(match[2], match[1]) });
  }
  if (groups.length === 0) throw new Error("sync-drive: no document folders found");
  return groups;
}

const gpoaUrl = siteSource.match(
  /export const GPOA\s*=\s*\{[\s\S]*?folderUrl:\s*"([^"]+)"/,
);
if (!gpoaUrl) throw new Error("sync-drive: no GPOA folderUrl in src/content/site.ts");
const reportsUrl = configSource.match(/ACCOMPLISHMENT_REPORTS_URL\s*=\s*"([^"]+)"/);
if (!reportsUrl) throw new Error("sync-drive: no ACCOMPLISHMENT_REPORTS_URL in src/config.ts");
const pioUrl = configSource.match(/PIO_FOLDER_URL\s*=\s*"([^"]+)"/);
if (!pioUrl) throw new Error("sync-drive: no PIO_FOLDER_URL in src/config.ts");

const DOC_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
};

const IMAGE_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

const extension = (name) => name.slice(name.lastIndexOf(".") + 1).toLowerCase();
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const htmlEntities = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => htmlEntities[entity] ?? entity)
    .trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse the folder listing. Each entry carries its own id, target href and
 * title; folders point at /drive/folders/, files at /file/d/.
 */
function parseListing(html) {
  const entries = [];
  const pattern =
    /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([\s\S]*?)<\/div>/g;
  for (const match of html.matchAll(pattern)) {
    const [, id, href, title] = match;
    if (!id || !href || !title) continue;
    entries.push({
      id,
      title: decode(title),
      folder: href.includes("/drive/folders/"),
    });
  }
  return entries;
}

async function listFolder(id, label, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(
        `https://drive.google.com/embeddedfolderview?id=${id}#list`,
        {
          headers: { "user-agent": "Mozilla/5.0 BSANHS-SSLG-build" },
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseListing(await response.text());
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(400 * attempt);
    }
  }
  console.warn(`sync-drive: ${label} (${id}) failed: ${lastError?.message ?? lastError}`);
  return null;
}

function documentFile({ id, title }) {
  const ext = extension(title);
  return {
    id,
    name: title,
    mime: DOC_MIME[ext] ?? "application/octet-stream",
    // Drive's folder view prints only "Jun 5"; a year cannot be inferred, so
    // no date is stored rather than inventing one.
    modified: null,
    thumb: `https://drive.google.com/thumbnail?id=${id}&sz=w600`,
    view: `https://drive.google.com/file/d/${id}/view`,
  };
}

function photoFile({ id, title }) {
  const mime = IMAGE_MIME[extension(title)];
  if (!mime) return null;
  const heic = mime === "image/heic" || mime === "image/heif";
  return {
    id,
    name: title,
    mime,
    thumb: heic
      ? `https://drive.google.com/thumbnail?id=${id}&sz=w800`
      : `https://lh3.googleusercontent.com/d/${id}=w800`,
    full: heic
      ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000`
      : `https://lh3.googleusercontent.com/d/${id}=w2000`,
  };
}

function previousSnapshot() {
  if (!existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(readFileSync(snapshotPath, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const previous = previousSnapshot();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    documents: {},
    gpoa: null,
    reports: [],
    years: [],
  };

  for (const { key, id } of documentFolders()) {
    const entries = await listFolder(id, `documents/${key}`);
    if (entries === null) {
      snapshot.documents[key] = previous?.documents?.[key] ?? [];
      continue;
    }
    snapshot.documents[key] = entries
      .filter((entry) => !entry.folder)
      .map(documentFile)
      .sort((a, b) => natural.compare(a.name, b.name));
  }

  const gpoaId = folderId(gpoaUrl[1], "GPOA");
  const gpoaEntries = await listFolder(gpoaId, "gpoa");
  if (gpoaEntries === null) {
    snapshot.gpoa = previous?.gpoa ?? null;
  } else {
    const files = gpoaEntries
      .filter((entry) => !entry.folder)
      .map(documentFile)
      .sort((a, b) => natural.compare(a.name, b.name));
    snapshot.gpoa =
      files.find((file) => extension(file.name) === "docx") ?? files[0] ?? null;
  }

  const reportsId = folderId(reportsUrl[1], "reports");
  const reportEntries = await listFolder(reportsId, "reports");
  if (reportEntries === null) {
    snapshot.reports = previous?.reports ?? [];
  } else {
    snapshot.reports = reportEntries
      .filter((entry) => !entry.folder)
      .map(documentFile)
      .sort((a, b) => natural.compare(a.name, b.name));
  }

  const pioId = folderId(pioUrl[1], "PIO");
  const pioEntries = await listFolder(pioId, "pio");
  if (pioEntries === null) {
    snapshot.years = previous?.years ?? [];
  } else {
    const yearFolders = pioEntries
      .filter((entry) => entry.folder && /^S\.?Y\b/i.test(entry.title))
      .sort((a, b) => natural.compare(a.title, b.title));

    for (const yearFolder of yearFolders) {
      const year = { id: yearFolder.id, name: yearFolder.title, terms: [] };
      const termEntries = await listFolder(yearFolder.id, `album year ${yearFolder.title}`);
      const terms = (termEntries ?? [])
        .filter((entry) => entry.folder)
        .sort((a, b) => natural.compare(a.title, b.title));

      for (const termFolder of terms) {
        const term = { id: termFolder.id, name: termFolder.title, albums: [] };
        const albumEntries = await listFolder(
          termFolder.id,
          `album term ${termFolder.title}`,
        );
        const albums = (albumEntries ?? [])
          .filter((entry) => entry.folder)
          .sort((a, b) => natural.compare(a.title, b.title));

        for (const albumFolder of albums) {
          const albumEntries = await listFolder(
            albumFolder.id,
            `album ${albumFolder.title}`,
          );
          const photos = (albumEntries ?? [])
            .filter((entry) => !entry.folder)
            .map(photoFile)
            .filter(Boolean);
          term.albums.push({
            id: albumFolder.id,
            name: albumFolder.title,
            count: photos.length,
            cover: photos[0]?.thumb ?? null,
            photos,
          });
        }
        year.terms.push(term);
      }
      snapshot.years.push(year);
    }
  }

  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const docCount = Object.values(snapshot.documents).reduce(
    (sum, files) => sum + files.length,
    0,
  );
  const albumCount = snapshot.years.reduce(
    (sum, year) =>
      sum + year.terms.reduce((inner, term) => inner + term.albums.length, 0),
    0,
  );
  const photoCount = snapshot.years.reduce(
    (sum, year) =>
      sum +
      year.terms.reduce(
        (inner, term) =>
          inner + term.albums.reduce((count, album) => count + album.photos.length, 0),
        0,
      ),
    0,
  );
  console.log(
    `sync-drive: wrote ${snapshotPath.replace(root + "\\", "")} — ` +
      `${docCount} documents, ${albumCount} albums, ${photoCount} photos.`,
  );
}

main().catch((error) => {
  console.error(`sync-drive: ${error?.message ?? error}`);
  if (existsSync(snapshotPath)) {
    console.warn("sync-drive: kept the existing snapshot; the build may continue.");
    process.exit(0);
  }
  process.exit(1);
});
