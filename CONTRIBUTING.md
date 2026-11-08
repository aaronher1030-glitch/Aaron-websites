# Contributing to Lemma

Thanks for helping. Lemma is a small, independent project, so the most useful contributions are precise: a corrected answer, a clearer proof, an accessibility fix, or documentation.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Before you start

- **Content:** read [`docs/CONTENT.md`](docs/CONTENT.md). Original problems only; no reproduced official papers.
- **Architecture:** read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before changing state, routing, or the data layer.
- **Security:** do not open a public issue for a vulnerability. Follow [`SECURITY.md`](SECURITY.md).

---

## Development setup

```bash
git clone <your-fork-url>
cd lemma
npm ci
npm run dev
```

Requirements: Node 22+ (`.nvmrc`) and npm.

Useful commands:

```bash
npm run typecheck   # TypeScript
npm run build       # typecheck + production build + sitemap
npm run preview     # serve dist/
npm run seo         # regenerate sitemap/robots after content changes
```

---

## Workflow

1. Fork the repository and create a branch:
   ```bash
   git checkout -b fix/answer-nt-div-3
   ```
2. Make the smallest coherent change.
3. Run `npm run typecheck` and `npm run build`.
4. Test the affected route at 390 px and 1440 px.
5. Open a pull request using the template.

### Branch names

- `fix/...` — corrections
- `feat/...` — new capability
- `content/...` — problems, solutions, guides
- `docs/...` — documentation
- `chore/...` — tooling and dependencies

### Commit messages

Use a short imperative subject, then a body when the reason is not obvious.

```text
fix: correct the answer for nt-div-3

The remainder was computed mod 9 instead of mod 11. The solution now
shows the reduced residue and the final answer 4.
```

---

## Content contributions

A content pull request should include:

- the problem or correction;
- the full solution (not just the answer);
- domain, technique, difficulty, and format;
- for proofs: a model proof and four rubric points;
- a note confirming the item is original or supplied with permission.

Checklist:

- [ ] The id is unique and follows the `alg-`, `nt-`, `comb-`, `geo-`, or `proof-` prefix.
- [ ] `skill` matches a name in `src/data/skills.ts` exactly.
- [ ] The answer is canonical and in the expected format.
- [ ] LaTeX renders in the browser.
- [ ] The problem appears at `/problem/<id>`, in `/bank`, and on the technique page.
- [ ] No official paper text, logo, or organiser branding is included.

If a problem needs a technique that does not exist, add the guide in the same pull request and give it at least one tagged problem.

---

## Code style

- TypeScript strict mode is enabled; do not add `any` unless there is no practical alternative.
- Prefer function components and hooks. No class components except the error boundary.
- Keep server/network concerns out of the codebase; the app is static.
- Reuse existing primitives in `src/components/ui.tsx` and icons in `src/components/Icon.tsx`.
- Use CSS custom properties and the existing stylesheet files; do not introduce a CSS framework.
- Keep the bundle in mind: avoid heavy dependencies for small features.
- Comments should explain *why*, not restate code.

### Routing and metadata

- Add routes in `src/App.tsx`.
- Every page should call `usePageMeta` with a title, description, path, and `noindex` where appropriate.
- Do not add a second `h1` to a page.

### State

- Global state lives in `src/store.tsx`. Keep it focused.
- Persist only what must survive a reload.
- Validate imported or parsed data before trusting it.

---

## Testing

There is no automated browser suite yet. Before opening a PR:

- `npm run typecheck`
- `npm run build`
- Manually exercise the affected flow
- Check the route at 390 px and 1440 px
- Confirm no console errors

For changes to scoring, selection, or storage, also test import/export and a page refresh.

The full manual matrix is in [`docs/QA.md`](docs/QA.md).

---

## Reviews

A maintainer will check:

1. Correctness and originality.
2. Consistency with the design system.
3. Accessibility and responsive behaviour.
4. Bundle and performance impact.
5. Documentation updates.

Expect requests for a smaller diff or a clearer solution. That is normal and not personal.

---

## License

By contributing, you agree that your code is licensed under the repository's [MIT License](LICENSE), and that original problem content may be published as part of Lemma. Do not contribute material you do not have the right to license.
