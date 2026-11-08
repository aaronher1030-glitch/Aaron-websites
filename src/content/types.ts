export type Cover =
  | { kind: "album"; album: string }
  | { kind: "doc"; fileId: string }
  | { kind: "none" };

export interface Activity {
  slug: string;
  title: string;
  caption: string;
  cover: Cover;
  album?: string;
  date?: string;        // ISO date only when documented in the vault
  reportUrl?: string;   // Drive file or folder with the accomplishment report
  featured?: boolean;
}

export interface Officer {
  name: string;
  role: string;
  group: "executive" | "grade" | "school";
}

export interface DocumentGroup {
  key: "minutes" | "notices" | "elections" | "proposals" | "memorandums" | "finance";
  label: string;
  blurb: string;
}
