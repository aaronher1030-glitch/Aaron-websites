import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const site = (process.env.VITE_SITE_URL || "https://lemma.pages.dev").trim().replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function unique(values) {
  return [...new Set(values)];
}

const problems = JSON.parse(read("src/data/problems.json"));
const problemIds = problems.map((problem) => problem.id);

const proofsSource = read("src/data/proofs.ts");
const proofIds = [...proofsSource.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((match) => match[1]);

const officialSource = read("src/data/amoPapers.ts");
const officialSeeds = officialSource.split("const OFFICIAL_SEEDS")[1] ?? "";
const officialIds = [
  ...officialSeeds.matchAll(/year:\s*(\d{4}),\s*\r?\n\s*day:\s*(\d),\s*\r?\n\s*number:\s*(\d+),/g),
].map((match) => `amo-${match[1]}-p${match[3]}`);

const skillsSource = read("src/data/skills.ts");
const skillSlugs = [...skillsSource.matchAll(/\bslug:\s*["']([^"']+)["']/g)].map((match) => match[1]);

const staticRoutes = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "bank", priority: "0.9", changefreq: "weekly" },
  { path: "practice", priority: "0.8", changefreq: "monthly" },
  { path: "techniques", priority: "0.9", changefreq: "monthly" },
  { path: "amo-guide", priority: "0.8", changefreq: "monthly" },
  { path: "amo-papers", priority: "0.9", changefreq: "monthly" },
  { path: "about", priority: "0.5", changefreq: "yearly" },
];

const routes = [
  ...staticRoutes,
  ...unique(skillSlugs).map((slug) => ({ path: `techniques/${slug}`, priority: "0.7", changefreq: "monthly" })),
  ...unique([...problemIds, ...proofIds, ...officialIds]).map((id) => ({
    path: `problem/${encodeURIComponent(id)}`,
    priority: "0.6",
    changefreq: "yearly",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${site}/${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const robots = `# Lemma - AMO problem bank and proof training
User-agent: *
Allow: /
Disallow: /progress
Disallow: /review
Disallow: /drill/

Sitemap: ${site}/sitemap.xml
`;

const outDir = join(root, "dist");
writeFileSync(join(outDir, "sitemap.xml"), xml, "utf8");
writeFileSync(join(outDir, "robots.txt"), robots, "utf8");

console.log(`[seo] wrote ${routes.length} routes to dist/sitemap.xml and dist/robots.txt (${site})`);
