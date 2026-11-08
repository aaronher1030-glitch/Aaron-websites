# Deployment

Lemma builds to a static folder (`dist/`) and deploys to **Cloudflare Pages**. This document covers the dashboard route, the CLI route, GitHub Actions, custom domains, and troubleshooting.

---

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| Node 22+ | Matches `.nvmrc`; Vite 8 needs a modern Node. |
| npm | `package-lock.json` is committed; use `npm ci` in CI. |
| Cloudflare account | Free plan is sufficient. |
| GitHub repository | Required for automatic deployments. |
| `wrangler` | Run through `npx`; no global install needed. |

Local verification:

```bash
npm ci
npm run typecheck
npm run build
npm run preview
```

`dist/` should contain `index.html`, `assets/`, `sitemap.xml`, `robots.txt`, `_headers`, `_redirects`, `og.png`, and the favicon/manifest.

---

## 2. Option A — Cloudflare Pages + GitHub (recommended)

1. Push the repository to GitHub.
2. Open the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Authorise GitHub and select the repository.
4. Configure the build:

   | Setting | Value |
   | --- | --- |
   | Project name | `lemma` (or another available name) |
   | Production branch | `main` |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (leave blank) |

5. Add environment variables (optional, see §5):

   ```text
   NODE_VERSION=22
   VITE_SITE_URL=https://your-domain.example
   VITE_GITHUB_URL=https://github.com/<owner>/<repo>
   ```

6. Click **Save and Deploy**.

Cloudflare installs dependencies and runs the build on every push. Pull requests can produce preview deployments automatically; the included `deploy-preview.yml` also does this through the API.

### Project name collision

If `lemma.pages.dev` is already taken, Cloudflare assigns a different subdomain. Update these references to the real project name:

- `wrangler.toml` → `name`
- `.github/workflows/deploy.yml` → `--project-name`
- `.github/workflows/deploy-preview.yml` → `--project-name`
- `src/config.ts` → default `SITE.url`
- `index.html` → canonical and Open Graph URLs
- `README.md` and docs

Then set `VITE_SITE_URL` to the final origin so the sitemap and runtime metadata are correct.

---

## 3. Option B — GitHub Actions

The repository includes:

- `.github/workflows/ci.yml` — typecheck + build on pushes and PRs.
- `.github/workflows/deploy.yml` — production deploy on `main`.
- `.github/workflows/deploy-preview.yml` — PR preview + comment.

### Create an API token

1. Cloudflare dashboard → **My Profile** → **API Tokens** → **Create Token**.
2. Use the **Edit Cloudflare Workers** template, or a custom token with:
   - Account → Cloudflare Pages → **Edit**
   - Account → Account Settings → **Read** (needed to resolve the account id in some setups)
3. Scope it to the correct account.
4. Copy the token once.

### Add repository secrets

GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | The token from above. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → **Workers & Pages** → account id in the sidebar/URL. |

### Add repository variables (optional)

| Variable | Value |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin, e.g. `https://lemma.example.com`. |
| `VITE_GITHUB_URL` | Repository URL; enables the footer source link. |

### How the deploy works

`deploy.yml` checks out the repository, installs with `npm ci`, typechecks, builds, and runs:

```bash
npx wrangler pages deploy dist --project-name=lemma
```

The workflow exposes the deployment URL through the `production` environment.

### Preview deployments

`deploy-preview.yml` runs only for pull requests whose head branch is in the same repository (forks cannot access secrets). It deploys with:

```bash
npx wrangler pages deploy dist --project-name=lemma --branch=pr-<number>
```

and updates a single marker comment on the PR with the preview URL.

---

## 4. Option C — CLI deploy

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` runs the full build, then:

```bash
npx wrangler pages deploy dist --project-name lemma
```

For a preview branch:

```bash
npm run deploy:preview
```

To deploy an existing build without rebuilding:

```bash
npx wrangler pages deploy dist --project-name lemma
```

If Wrangler reports that the project does not exist, create it first in the dashboard or run:

```bash
npx wrangler pages project create lemma --production-branch main
```

---

## 5. Environment variables

All variables are build-time. Changing one requires a rebuild.

| Name | Default | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://lemma.pages.dev` | Canonical origin for metadata and sitemap. No trailing slash needed. |
| `VITE_GITHUB_URL` | empty | Repository URL. When set, the footer shows “Source on GitHub”. |
| `NODE_VERSION` | `.nvmrc` (`22`) | Used by the Pages builder if the dashboard setting is not enough. |

`src/config.ts` reads the two `VITE_` values with `import.meta.env`. `scripts/generate-seo.mjs` reads `VITE_SITE_URL` from `process.env`.

---

## 6. Custom domain

1. Deploy once so the Pages project exists.
2. Pages project → **Custom domains** → **Set up a custom domain**.
3. Enter the domain and follow the DNS instructions (CNAME to `<project>.pages.dev`, or Cloudflare-managed DNS).
4. Wait for the certificate to become active.
5. Set the `VITE_SITE_URL` variable to `https://your-domain` and redeploy.
6. Confirm:

   ```text
   https://your-domain/sitemap.xml
   https://your-domain/robots.txt
   https://your-domain/problem/alg-vieta-1
   ```

7. Add the domain to Google Search Console and submit the sitemap.

Cloudflare Pages gives `*.pages.dev` by default and supports apex domains through Cloudflare DNS.

---

## 7. Caching and SPA routing

`public/_redirects`:

```text
/* /index.html 200
```

This makes deep links work on a static host. `public/_headers` sets:

- long-lived immutable caching for `/assets/*` (hashed filenames);
- `no-cache` for `/index.html`;
- a week for the OG image and favicon;
- one hour for sitemap and robots;
- baseline security headers.

If a new deploy appears stale, check that the HTML is not cached. The hashed asset filenames make cache-busting automatic for JS and CSS.

---

## 8. Rollback

- **Dashboard:** Pages project → **Deployments** → choose a previous deployment → **Rollback**.
- **CLI:** redeploy a known-good commit:
  ```bash
  git checkout <commit>
  npm ci
  npm run build
  npx wrangler pages deploy dist --project-name lemma
  ```
- Cloudflare keeps deployment history, so a rollback does not require a rebuild.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 404 after refresh on a sub-route | Missing SPA rewrite | Confirm `public/_redirects` exists in the deployed output and contains `/* /index.html 200`. |
| Blank page after deploy | Wrong output directory or a JS error | Check the Pages build log and the browser console; output must be `dist`. |
| `wrangler` says not authenticated | No login or token | Run `npx wrangler login`, or set `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. |
| GitHub Action cannot deploy | Missing or under-scoped token | Recreate the token with Cloudflare Pages: Edit; confirm both secrets exist. |
| Preview workflow skipped | PR from a fork | Expected; forks do not receive repository secrets. |
| Sitemap shows `lemma.pages.dev` after a custom domain | `VITE_SITE_URL` not set at build time | Set the variable and redeploy. |
| Open Graph image does not update | CDN cache | Wait for the one-week cache to expire, or purge the Cloudflare cache. |
| Fonts fail to load offline | Google Fonts is a network dependency | Expected; system font fallbacks apply. |
| Progress disappears | Different browser, private window, or cleared storage | Export/import JSON; storage is per browser. |

---

## 10. Release checklist

- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run preview` and spot-check `/`, `/bank`, a problem, a technique, `/practice`, `/amo-guide`
- [ ] `dist/_redirects` and `dist/_headers` exist
- [ ] `dist/sitemap.xml` references the production origin
- [ ] `dist/robots.txt` disallows `/drill/`, `/progress`, and `/review`
- [ ] `dist/og.png` exists and is 1200×630
- [ ] No QA artifacts (`qa-frames.html`, screenshots) in the commit
- [ ] Version and README live URL match the deployment
- [ ] Deploy and verify the live URL, a deep link, and a 404 route
- [ ] Submit the sitemap in Search Console after a domain change
