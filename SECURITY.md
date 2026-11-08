# Security policy

## Supported versions

Lemma is deployed from the `main` branch. Only the current production deployment is supported.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected route, a reproduction, and the impact.

If private reporting is unavailable, contact the repository maintainers through the contact method listed on their GitHub profile and ask for a private channel.

You can expect an acknowledgement within a few days. Please allow time for a fix before public disclosure.

## Scope

In scope:

- Cross-site scripting or unsafe HTML injection.
- Authentication or authorisation flaws (the app has no accounts, so this is unlikely).
- Dependency vulnerabilities with a practical exploit path.
- Supply-chain issues in the build or deployment workflow.
- Exposure of local progress data beyond the browser.
- Broken access controls on deployment secrets.

Out of scope:

- Denial of service through very large local data.
- Issues that require a compromised browser or device.
- Social engineering.
- Reports based only on a scanner output without a demonstrated impact.
- Missing headers that do not create an exploitable condition.

## Security model

- The app is a static bundle. There is no server, database, or API.
- Progress is stored in `localStorage` under `lemma:v1` and never transmitted.
- There is no authentication and no personal data collection.
- The only user-generated content is proof text, which is never sent to a server.
- Imported JSON is parsed and validated as data; it is not executed.
- The deployment sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` in `public/_headers`.
- Third-party requests are limited to Google Fonts on first load.
- Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) belong in GitHub Actions secrets, never in the repository or client bundle.

## Dependency updates

Dependabot is configured for npm and GitHub Actions. Major version updates are excluded from automatic grouping and should be reviewed manually.
