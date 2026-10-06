# Renata's Cleaning Service — renatascleaning.com

Website for Renata's Cleaning Service, a family-owned residential and commercial cleaning company serving Hartford County, Connecticut for more than 25 years.

- **Stack:** Eleventy 3 (static HTML), vanilla CSS/JS, Node's built-in test runner
- **Hosting:** Cloudflare Workers (static assets), Renatas Cleaning Service account, via Workers Builds
- **Brand guidelines:** https://claude.ai/code/artifact/d628c7f0-d24a-4b9e-b15b-f68faf2a478c

## Local development

```bash
npm install
npm run serve      # http://localhost:8080 with live reload
npm run check      # build + all tests (what every deploy runs)
```

## Pages

| URL | Purpose |
|---|---|
| `/` | Home |
| `/services/` | All services |
| `/services/<slug>/` | 8 service pages generated from `src/_data/services.json` |
| `/service-area/` | The 12 towns, each with an anchor (`/service-area/#west-hartford`) |
| `/about/`, `/reviews/`, `/faq/`, `/contact/` | Company pages |
| `/404.html` | Not-found page, served with a 404 status for unknown URLs |

## Editing content

| To change… | Edit |
|---|---|
| Phone, email, tagline, Google Ads ID | `src/_data/site.json` |
| A service's copy, checklist or FAQs | `src/_data/services.json` |
| Add a service | Add an entry to `services.json` (the page, nav, footer, sitemap and schema update automatically) |
| Towns | `src/_data/towns.json` |
| FAQ page (and its Google FAQ markup) | `src/_data/faqs.json` |
| Rating or testimonials | `src/_data/reviews.json` |
| Colors | `src/_data/brand.json` **and** `src/assets/css/tokens.css` (a test checks they match), then `npm run brand` |

Run `npm run check` before pushing; the tests catch missing fields, over-long titles, broken links, prices and schema errors.

## Brand assets

`src/assets/brand/` holds the logo in three lockups (mark, horizontal, stacked) and four versions (color, reversed, ink, white) as SVG, plus PNG exports. Regenerate everything with `npm run brand` (requires `brew install librsvg`). The logo text is converted to outlines, so the SVGs print correctly without the fonts installed.

## Deploying on Cloudflare

The site is a static-assets Worker named `rcs` in the **Renatas Cleaning Service** Cloudflare account (the account that owns the `renatascleaning.com` zone). `wrangler.jsonc` pins the Worker name, the account id, the `_site` asset directory, the two custom domains and a pre-deploy `npm run check`, so a deploy cannot land on the wrong account or domain. `tests/deploy-config.test.mjs` enforces that file.

### Automatic deploys (Workers Builds)

The Worker is connected to `alexzawadzki/rcs`. Every push to `main` runs `npx wrangler deploy`, which rebuilds the site, runs the tests and uploads `_site`. Build history: Cloudflare dashboard → Renatas Cleaning Service → Workers & Pages → `rcs` → Deployments.

Dashboard build settings to keep: production branch `main`, deploy command `npx wrangler deploy`, root directory `/`. The build command can stay empty because `wrangler.jsonc` runs `npm run check` itself.

### Manual deploy

```bash
npx wrangler login      # once, browser OAuth as the account owner
npx wrangler deploy     # builds, tests, uploads _site to renatascleaning.com
```

### Verify after a deploy

- `curl -sI https://renatascleaning.com/` → `HTTP/2 200`
- `curl -sI https://renatascleaning.com/does-not-exist/` → `HTTP/2 404`
- `curl -sI https://www.renatascleaning.com/about/` → `301` to `https://renatascleaning.com/about/` once the Redirect Rule below exists

### Remaining dashboard items (zone `renatascleaning.com`)

1. **Rules → Redirect Rules**: when hostname equals `www.renatascleaning.com`, dynamic redirect to `concat("https://renatascleaning.com", http.request.uri.path)` with status 301.
2. **SSL/TLS → Edge Certificates → Always Use HTTPS**: on.
3. GitHub → repo **Settings → Pages**: disable GitHub Pages (its Jekyll build still runs and fails on every push).
4. The stale `renatascleaning.com` zone in the personal Cloudflare account shows **Moved**; delete it once the new zone has been active for a week.

## Project structure

```
├── eleventy.config.js      Eleventy config: filters, passthrough, JSON-LD global
├── scripts/brand/          Logo geometry, font outlining, asset generator
├── src/
│   ├── _data/              Site content and brand data (JSON)
│   ├── _includes/          Layouts, partials, generated logo macro
│   ├── _lib/               Pure filters and JSON-LD builders
│   ├── assets/             CSS, JS, icon sprite, brand files
│   ├── services/           Services hub + paginated service pages
│   ├── *.njk               Pages
│   ├── _headers            Cloudflare headers (security, caching)
│   └── robots.txt, sitemap.njk, site.webmanifest, icons, og-image.png
└── tests/                  Unit tests + checks against the built site
```

## License

Private and proprietary. All rights reserved. Fonts in `scripts/brand/fonts/` are licensed under the SIL Open Font License (see the OFL files there).
