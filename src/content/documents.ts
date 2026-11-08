import type { DocumentGroup } from "./types";

export const DOCUMENT_GROUPS: DocumentGroup[] = [
  { key: "minutes", label: "Minutes of the Meeting", blurb: "Signed minutes of every SSLG meeting." },
  { key: "notices", label: "Notice of Meeting", blurb: "Call and agenda for each meeting." },
  { key: "elections", label: "Elections", blurb: "Election materials and results." },
  { key: "proposals", label: "Project Proposals", blurb: "Approved activity proposals (AP-SSLG series)." },
  { key: "memorandums", label: "School Memorandums", blurb: "School, Division, and DepEd issuances." },
  { key: "finance", label: "Financial Reports", blurb: "Latest financial reports, prepared by the Treasurer." },
];
