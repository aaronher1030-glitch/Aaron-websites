export interface Photo {
  id: string;
  name: string;
  mime: string;
  width?: number;
  height?: number;
  thumb: string;
  full: string;
}

export interface Album {
  id: string;
  name: string;
  count: number;
  cover: string | null;
}

export interface Term {
  id: string;
  name: string;
  albums: Album[];
}

export interface Year {
  id: string;
  name: string;
  terms: Term[];
}

export interface AlbumsResponse {
  years: Year[];
  fetchedAt: string;
}

export interface PhotosResponse {
  album: { id: string; name: string };
  photos: Photo[];
  fetchedAt: string;
}

export interface DocFolder {
  id: string;
  name: string;
  url: string;
}

export interface DocFile {
  id: string;
  name: string;
  mime: string;
  modified: string | null;
  thumb: string;
  view: string;
}

export interface DocumentsResponse {
  folders: DocFolder[];
  files: DocFile[];
  fetchedAt: string;
}

export const FOLDER_KEYS = [
  "finance",
  "minutes",
  "notices",
  "elections",
  "proposals",
  "memorandums",
] as const;

export type FolderKey = (typeof FOLDER_KEYS)[number];

export function isFolderKey(value: string): value is FolderKey {
  return (FOLDER_KEYS as readonly string[]).includes(value);
}

const isHeic = (mime: string) => /heic|heif/i.test(mime);

export function imageThumb(id: string, mime: string, width = 800): string {
  return isHeic(mime)
    ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
    : `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

export function imageFull(id: string, mime: string): string {
  return isHeic(mime)
    ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000`
    : `https://lh3.googleusercontent.com/d/${id}=w2000`;
}

export function docThumb(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
}
