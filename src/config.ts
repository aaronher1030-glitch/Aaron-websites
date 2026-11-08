export const SITE_URL = "https://chembank.pages.dev";

export const APP_NAME = "ChemBank";

export const SITE_DESCRIPTION =
  "Free, independent chemistry reviewer for the Philippine National Chemistry Olympiad, with verified questions, worked solutions, and drills.";

/* Empty until the GitHub repository is published: QuestionPage falls back to
   copyable diagnostics and the local corrections log rather than inventing an
   owner/repo. Set to the repo base URL to enable the pre-filled issue link. */
export const REPORT_ISSUE_BASE_URL = "";

/* Optional Supabase progress sync: non-secret constants only. Credentials
   live exclusively in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see
   .env.example); with both absent, sync stays fully disabled. */
export const PROGRESS_TABLE = "progress";

export const SYNC_DEBOUNCE_MS = 2000;
