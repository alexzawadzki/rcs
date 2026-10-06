# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-page static website for **Renata's Cleaning Service**, a family-owned residential and commercial cleaning company in Hartford County, CT. Live at `renatascleaning.com`, hosted as a static-assets Cloudflare Worker in the **Renatas Cleaning Service** Cloudflare account.

## Commands

```bash
npm install          # once
npm run serve        # dev server with live reload at http://localhost:8080
npm run build        # build to _site/
npm test             # all tests against _site/ (build first)
npm run check        # build + test — exactly what Cloudflare runs
npm run brand        # regenerate logo, icons and og-image (needs: brew install librsvg)
npm run brand:fonts  # re-download the fonts used to outline logo text
```

Single test file: `node --test tests/services.test.mjs`

## Deployment

Cloudflare Workers Builds (Worker `rcs`, account `Renatas Cleaning Service`, id in `wrangler.jsonc`) builds every push to `main` by running `npx wrangler deploy`. `wrangler.jsonc` makes that deploy run `npm run check` first and upload `_site` as static assets to the custom domains `renatascleaning.com` and `www.renatascleaning.com`; a failing test blocks the deploy. There is no `*.workers.dev` URL and no preview deploy. Never change `name` or `account_id`: the domain's zone exists only in that account, so a deploy elsewhere cannot bind the domain. Node comes from `.nvmrc`. Local deploy: `npx wrangler deploy` (after `npx wrangler login`); `tests/deploy-config.test.mjs` guards the config.

## Architecture

- Eleventy 3 + Nunjucks. Source in `src/`, output in `_site/` (gitignored).
- `src/_data/*.json` is the single source of truth: `site` (name, phone, email, Ads ID), `services` (8 service pages), `serviceGroups`, `towns`, `faqs`, `reviews`, `brand` (colors), `nav`.
- `src/_lib/filters.js` and `src/_lib/schema.js` are pure, unit-tested modules registered in `eleventy.config.js`.
- `src/_includes/layouts/base.njk` renders every `<head>` (SEO meta, Google Ads tag `AW-17838655328`, one JSON-LD `@graph`), header, CTA band, footer and mobile call bar. Pages set `title`, `description`, `breadcrumbs`, and optionally `noindex`, `hideCta`, `faqSchema`.
- Service pages come from `services.json` via pagination (`src/services/service.njk` + `layouts/service.njk`); add a service by adding an entry (tests enforce required fields and lengths).
- CSS load order: `tokens.css` → `base.css` → `components.css` → `pages.css`. Reference CSS/JS/icons through the `assetUrl` filter (adds `?v=<hash>`); never hardcode those paths.
- Icons live in `src/assets/icons/sprite.svg` and render through the `icon(name)` macro.

## Brand

- Logo geometry: `scripts/brand/geometry.mjs`. `npm run brand` regenerates everything in `src/assets/brand/`, the favicons, `og-image.png` and `src/_includes/partials/logo-mark.njk`. Never hand-edit generated files.
- Colors live in `src/_data/brand.json` and are mirrored in `tokens.css` (a test enforces the match). Pollen gold is never used for small text.
- Fonts: Cormorant Garamond (display, wordmark) + Jost (body, UI).
- Brand guidelines: https://claude.ai/code/artifact/d628c7f0-d24a-4b9e-b15b-f68faf2a478c

## Rules

- No pricing anywhere; tests fail on `$` followed by a digit.
- Copy only states facts the owner has confirmed (spec §2: `docs/superpowers/specs/2026-09-29-site-redesign-design.md`).
- Titles ≤ 60 chars, descriptions 120–160 chars, exactly one `<h1>` per page, internal links end in `/`.
- The FAQPage schema is generated from `faqs.json`, so the visible FAQ and schema cannot drift.
- `src/404.njk` must keep producing `/404.html`; `wrangler.jsonc` serves it (with a 404 status) for every unknown URL.
