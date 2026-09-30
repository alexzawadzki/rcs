# Renata's Cleaning Service — renatascleaning.com

Website for Renata's Cleaning Service, a family-owned residential and commercial cleaning company serving Hartford County, Connecticut for more than 25 years.

- **Stack:** Eleventy 3 (static HTML), vanilla CSS/JS, Node's built-in test runner
- **Hosting:** Cloudflare Pages
- **Brand guidelines:** https://claude.ai/code/artifact/d628c7f0-d24a-4b9e-b15b-f68faf2a478c

## Local development

```bash
npm install
npm run serve      # http://localhost:8080 with live reload
npm run check      # build + all tests (what Cloudflare runs)
```

## Pages

| URL | Purpose |
|---|---|
| `/` | Home |
| `/services/` | All services |
| `/services/<slug>/` | 8 service pages generated from `src/_data/services.json` |
| `/service-area/` | The 12 towns, each with an anchor (`/service-area/#west-hartford`) |
| `/about/`, `/reviews/`, `/faq/`, `/contact/` | Company pages |
| `/404.html` | Not-found page (required by Cloudflare Pages) |

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

## Deploying on Cloudflare Pages

### One-time setup

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose `alexzawadzki/rcs`.
2. Production branch: `main`. Framework preset: **None**. Build command: `npm run build && npm test`. Build output directory: `_site`.
3. Save and deploy. Every branch push gets a preview URL; `main` deploys to production.

### Cutover from GitHub Pages

1. Open the preview deployment for the `redesign` branch and review every page.
2. Merge `redesign` into `main`; wait for the production deploy to finish.
3. Pages project → **Custom domains** → add `renatascleaning.com` and `www.renatascleaning.com`. If the domain's DNS is on Cloudflare the records are created for you; otherwise follow the CNAME/nameserver instructions shown.
4. Redirect `www` to the bare domain: **Rules → Redirect Rules** → when hostname equals `www.renatascleaning.com`, dynamic redirect to `concat("https://renatascleaning.com", http.request.uri.path)` with status 301.
5. Verify:
   - `curl -sI https://renatascleaning.com/does-not-exist/` → `HTTP/2 404`
   - `curl -sI https://<project>.pages.dev/` → includes `x-robots-tag: noindex`
   - `curl -sI https://www.renatascleaning.com/about/` → `301` to `https://renatascleaning.com/about/`
6. GitHub → repo **Settings → Pages** → unpublish / disable GitHub Pages so the site isn't served twice.
7. Google Search Console → **Sitemaps** → submit `https://renatascleaning.com/sitemap.xml`; use **URL Inspection** to request indexing for the home page and the house-cleaning and commercial-cleaning pages.
8. Google Business Profile → confirm the website field is `https://renatascleaning.com/`.

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
│   ├── _headers            Cloudflare headers (security, caching, pages.dev noindex)
│   └── robots.txt, sitemap.njk, site.webmanifest, icons, og-image.png
└── tests/                  Unit tests + checks against the built site
```

## License

Private and proprietary. All rights reserved. Fonts in `scripts/brand/fonts/` are licensed under the SIL Open Font License (see the OFL files there).
