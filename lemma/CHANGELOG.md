# Changelog

All notable changes to Lemma are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-08

### Added

- Initial public release of Lemma, an independent AMO-family problem bank.
- 248 problems: 208 original (148 short-answer, 44 multiple-choice, and 16 proof prompts) plus all 40 official Australian AMO questions from 2016–2020.
- Official Australian AMO collection with paper/day/problem attribution, official PDF links, a collection filter, and timed Day 1, Day 2, and full-paper drills.
- 16 technique guides across algebra, number theory, combinatorics, and geometry.
- Problem bank with search, domain/difficulty/format/technique filters, sorting, and random-problem navigation.
- Practice builder with six presets and a custom filter builder.
- Timed drills with a visible clock, flags, question map, keyboard shortcuts, and automatic submission.
- Short-answer checking with numeric and fraction normalisation; exact multiple-choice checking; rubric-based proof self-assessment.
- Results pages with score, accuracy on answered questions, time, flags, and per-question review.
- Progress dashboard with latest-attempt analytics by domain, difficulty, and technique, plus streaks and average time.
- Mistake and stash review with repair drills.
- AMO comparison guide covering Australian AMO, American AMO (SIMCC), Asia AMO, ASMO, and PAMO, with source links and a verification date.
- Local-only persistence under `lemma:v1`, JSON export/import, and a clear-all reset.
- Auto, light, and dark themes.
- Accessible layout with a skip link, focus styles, reduced-motion support, and responsive behaviour from 360 px.
- Route-specific metadata, Open Graph/Twitter cards, generated sitemap and robots, and a 1200×630 social image.
- GitHub Actions CI, production deployment, and pull-request preview deployment workflows.
- Cloudflare Pages configuration, cache/security headers, and SPA fallback.
- Documentation for architecture, content, deployment, QA, contribution, and security.

### Notes

- Lemma is independent and not affiliated with any competition organiser.
- The 40 official Australian AMO question statements remain copyright © Australian Mathematics Trust. They are transcribed with attribution; Lemma's outlines and rubrics are its own. Other official papers are not reproduced.
