import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function slugsFromSource(path) {
  return [...read(path).matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const siteUrl = read("src/config.ts").match(/SITE_URL\s*=\s*"([^"]+)"/)?.[1];
if (!siteUrl) {
  throw new Error("generate-seo: SITE_URL was not found in src/config.ts");
}

const base = siteUrl.replace(/\/$/, "");
const questions = JSON.parse(read("src/data/questions.json"));
const noteSlugs = slugsFromSource("src/data/notes.ts");
const labSlugs = slugsFromSource("src/data/lab.ts");
const lastmod = new Date().toISOString().slice(0, 10);

const pages = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/bank", priority: "0.9", changefreq: "weekly" },
  { path: "/practice", priority: "0.9", changefreq: "monthly" },
  // /progress and /review are deliberately noindex (local-only working pages),
  // so they stay out of the sitemap.
  { path: "/notes", priority: "0.9", changefreq: "monthly" },
  ...noteSlugs.map((slug) => ({
    path: `/notes/${slug}`,
    priority: "0.8",
    changefreq: "monthly",
  })),
  { path: "/lab", priority: "0.9", changefreq: "monthly" },
  ...labSlugs.map((slug) => ({
    path: `/lab/${slug}`,
    priority: "0.8",
    changefreq: "monthly",
  })),
  { path: "/formulas", priority: "0.9", changefreq: "monthly" },
  { path: "/periodic-table", priority: "0.8", changefreq: "monthly" },
  { path: "/guide", priority: "0.8", changefreq: "monthly" },
  { path: "/about", priority: "0.6", changefreq: "yearly" },
  ...questions.map((question) => ({
    path: `/q/${question.id}`,
    priority: "0.5",
    changefreq: "yearly",
  })),
];

const seen = new Set();
const uniquePages = pages.filter((page) => {
  if (seen.has(page.path)) return false;
  seen.add(page.path);
  return true;
});

const urls = uniquePages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(`${base}${page.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n");

writeFileSync(
  resolve(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);

writeFileSync(
  resolve(dist, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`,
);

console.log(
  `generate-seo: wrote ${uniquePages.length} URLs, ${noteSlugs.length} notes, ${labSlugs.length} lab briefings, and ${questions.length} questions.`,
);
