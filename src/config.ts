/**
 * Site-wide constants.
 *
 * VITE_SITE_URL and VITE_GITHUB_URL are optional build-time overrides. They
 * let the same source deploy to a preview URL, a custom domain, or a fork
 * without editing components. Defaults point at the canonical production site.
 */

const rawSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;

export const SITE = {
  name: "Lemma",
  tagline: "Proof is a muscle. Train it.",
  defaultTitle: "Lemma — AMO problem bank & proof training",
  description:
    "Lemma is an independent AMO problem bank: 248 olympiad problems including all 40 official Australian AMO questions from 2016–2020, 16 technique guides, worked solutions, timed drills, and honest guidance on every competition called AMO.",
  shortDescription:
    "An independent AMO-family problem bank with 248 problems, including all 40 official Australian AMO questions from 2016–2020, plus 16 technique guides and timed drills.",
  url: (rawSiteUrl?.trim().replace(/\/+$/, "") || "https://lemma.pages.dev"),
  githubUrl: (import.meta.env.VITE_GITHUB_URL as string | undefined)?.trim() || "",
  author: "Lemma contributors",
  license: "MIT",
  verified: "November 2026",
  locale: "en_AU",
  keywords: [
    "olympiad mathematics",
    "AMO",
    "Australian Maths Olympiad",
    "Asia AMO",
    "ASMO",
    "PAMO",
    "problem bank",
    "proof practice",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${clean}`;
}
