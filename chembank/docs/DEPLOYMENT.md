# Deployment

ChemBank is a static single-page app. The production artefact is `dist/`; there
is no server, database, or runtime environment variable. Hosting is Cloudflare
Pages, project **chembank**, live at <https://chembank.pages.dev>.

## Build

```bash
npm ci
npm run build
```

`npm run build` runs, in order:

1. `tsc --noEmit` — typecheck.
2. `vite build` — bundle the app and the PWA service worker into `dist/`.
3. `node scripts/generate-seo.mjs` — write `dist/sitemap.xml` and `dist/robots.txt`.

The SEO step reads `SITE_URL` from [`src/config.ts`](../src/config.ts) and the
published content (`src/data/questions.json`, `notes.ts`, `lab.ts`). It only
lists indexable public pages; the local-only working pages (`/progress`,
`/review`, drills, results, 404) are `noindex` and stay out of the sitemap.

To regenerate just the sitemap and robots file against an existing `dist/`:

```bash
npm run seo
```

Node **22+** is required (see `.nvmrc`).

## Deploy

The Cloudflare account on this machine is already OAuth-authenticated, so no
login step is needed. Deploy the built `dist/` with Wrangler:

```bash
npm run build
npx wrangler pages deploy dist --project-name chembank --branch main --commit-dirty=true
```

- `--project-name chembank` targets the existing Pages project.
- `--branch main` publishes to the production branch.
- `--commit-dirty=true` allows deploying with uncommitted local changes.

`npm run deploy` is a convenience wrapper that builds and then runs
`npx --yes wrangler pages deploy dist --project-name chembank` (without the
branch flags). Use the explicit command above for a production deploy.

If Wrangler ever prompts for authentication on a new machine, run
`npx wrangler login` once and complete the OAuth flow in the browser.

`public/_redirects` (`/* /index.html 200`) provides SPA fallback so deep links
resolve, and `public/_headers` sets the CSP, security, and cache headers.
[`wrangler.toml`](../wrangler.toml) pins `pages_build_output_dir = "dist"`.

## Custom domain

The canonical URL, Open Graph URL, sitemap, and robots file all derive from a
single constant. To move to a custom domain:

1. Edit `SITE_URL` in [`src/config.ts`](../src/config.ts), e.g.
   `export const SITE_URL = "https://chembank.example.org";` (no trailing slash).
2. Rebuild so the new value is bundled **and** the SEO files are regenerated:

   ```bash
   npm run build
   ```

   `PageMeta` reads `SITE_URL` at runtime for canonical/`og:url`, and
   `generate-seo.mjs` reads it for every `<loc>` and the `Sitemap:` line, so a
   rebuild is required — `npm run seo` alone updates the sitemap but not the
   bundle.
3. Add the custom domain in Cloudflare (**Workers & Pages → chembank → Custom
   domains**) and point DNS at Pages.
4. Deploy:

   ```bash
   npx wrangler pages deploy dist --project-name chembank --branch main --commit-dirty=true
   ```

## Rollback

Each deploy is immutable. To roll back, open **Workers & Pages → chembank →
Deployments**, find the last known-good deployment, and choose **Rollback to
this deployment**. To inspect history from the CLI:

```bash
npx wrangler pages deployment list --project-name chembank
```

Alternatively, rebuild a known-good commit and redeploy with the command above.

## Troubleshooting

- **Missing `sitemap.xml` / `robots.txt`** — run `npm run build` (it runs
  `generate-seo` last). `npm run seo` requires `dist/` to already exist.
- **Deep links return 404** — confirm `public/_redirects` contains
  `/* /index.html 200` and was copied into `dist/`.
- **Blocked scripts/styles or CSP errors** — review `public/_headers`; the CSP
  restricts resources to the site origin. Add a hash rather than `unsafe-inline`
  for scripts if Vite emits an inline module preload.
- **Wrangler authentication errors** — run `npx wrangler login`.
- **Wrong Node version** — use Node 22+ (`.nvmrc`).

Quick artefact check after a build:

```bash
test -f dist/sitemap.xml && test -f dist/robots.txt && test -f dist/manifest.webmanifest
```