import { useEffect } from "react";
import { SITE, absoluteUrl } from "../config";

export interface PageMetaOptions {
  /** Page title without the "— Lemma" suffix. Omit on the home page. */
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/bank". Defaults to the current pathname. */
  path?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

/**
 * Keeps document metadata in sync with the active route. This is deliberately
 * client-side only: Lemma is a static SPA, so crawlers get the base tags from
 * index.html and browsers get route-specific tags after hydration.
 */
export function usePageMeta({ title, description = SITE.description, path, type = "website", noindex = false }: PageMetaOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE.name}` : SITE.defaultTitle;
    const canonical = absoluteUrl(path ?? window.location.pathname);
    const image = absoluteUrl("/og.png");

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "author", SITE.author);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:locale", SITE.locale);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", `${SITE.name} — ${SITE.tagline}`);

    upsertLink("canonical", canonical);
  }, [title, description, path, type, noindex]);
}

/** Turns a LaTeX-heavy statement into a readable meta description. */
export function plainMath(input: string, maxLength = 155): string {
  const text = input
    .replace(/\$\$?/g, " ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
