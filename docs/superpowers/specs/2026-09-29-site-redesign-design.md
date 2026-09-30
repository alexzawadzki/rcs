# Renata's Cleaning Service — Site Redesign, Brand System & SEO

**Date:** 2026-09-29
**Status:** Approved in conversation, pending written-spec review
**Branch:** `redesign`

## 1. Intent

Redesign renatascleaning.com from a single long page into a full multi-page
local-SEO website with a refined logo and a documented brand system, hosted on
Cloudflare Pages.

**What the owner asked for**
1. Redesign the site with a proper logo and branding.
2. A full website with proper SEO.
3. A brand guidelines document.

**Decisions made in brainstorming**
| Topic | Decision |
|---|---|
| Logo | Refine the existing flower — flat, geometric, recognizable continuation |
| Scope | Full local-SEO site (~16 pages) |
| Brand doc | Shareable hosted brand book + logo files committed to repo |
| Lead capture | No form. Call / text / email CTAs only |
| Hosting | Cloudflare Pages (replaces GitHub Pages) |
| Build | Eleventy 3 static site generator |

**Success criteria**
- Every service has its own indexable URL with a unique title, description,
  H1, and `Service` schema.
- Logo reads clearly at 16px (favicon) and in one color; no gradients.
- All automated SEO/link checks pass in the Cloudflare build, and a failing
  check blocks deploy.
- Lighthouse (mobile) ≥ 95 for Performance, Accessibility, Best Practices, SEO
  on Home and one service page.
- All text meets WCAG 2.1 AA contrast.
- Brand book is published and shareable; logo SVG/PNG files are in the repo.

## 2. Content constraints (non-negotiable)

- **No prices anywhere.** All services are quote-based.
- **No invented facts.** Copy may only assert what the current site already
  claims:
  - 25+ years in business; family-owned & operated
  - Fully insured & bonded
  - Residential + commercial (offices, medical offices, retail)
  - Bring own professional-grade supplies; will use client's preferred products
  - Move objects to dust (not around them); put things back organized
  - Weekly, bi-weekly, monthly, one-time schedules; bi-weekly most popular
  - Flexible rescheduling by call or text
  - Free, no-obligation quotes; free in-home estimates; no hidden fees;
    satisfaction guaranteed
  - Email replies within 24 hours; call or text anytime
  - Service area: Hartford, West Hartford, Farmington, Avon, Simsbury, Canton,
    Bristol, New Britain, Glastonbury, Manchester, Wethersfield, Rocky Hill,
    and surrounding Hartford County
  - Rating 4.6 from 11 Google reviews; the 3 existing testimonials verbatim
- Service-page copy may **describe** what a service typically covers
  (e.g., a deep-clean checklist) but must not claim certifications, equipment
  brands, eco-products, background checks, guarantees, or hours that aren't
  listed above. The owner reviews all new copy before merge.
- Contact: `(860) 796-5222` (call/text), `Renata@renatascleaning.com`.
- Google Ads tag `AW-17838655328` on every page.

## 3. Architecture

### 3.1 Stack
- **Eleventy 3** (`@11ty/eleventy`), Nunjucks templates, zero client framework.
- Only dev dependency: Eleventy. Tests use Node's built-in `node:test`.
- Node version pinned via `.nvmrc`.
- Minimal vanilla JS (`main.js`): mobile nav, FAQ accordion. No smooth-scroll
  JS (use CSS `scroll-behavior`, respecting reduced motion).

### 3.2 Directory layout
```
rcs/
├── eleventy.config.js        # config: passthrough, filters, collections
├── package.json              # scripts: build, serve, test
├── .nvmrc
├── src/
│   ├── _data/
│   │   ├── site.json         # name, url, phone, email, geo, ads id, tagline
│   │   ├── services.json     # 8 services: slug, name, title, desc, body data
│   │   ├── towns.json        # 12 towns
│   │   ├── faqs.json         # FAQ entries (drives visible FAQ + schema)
│   │   └── reviews.json      # rating summary + 3 testimonials
│   ├── _includes/
│   │   ├── layouts/base.njk  # <head>, SEO meta, gtag, header, footer
│   │   ├── layouts/service.njk
│   │   ├── partials/         # header, footer, cta-band, breadcrumbs, logo
│   │   └── schema/           # local-business, service, breadcrumbs, faq
│   ├── assets/
│   │   ├── css/              # tokens.css, base.css, components.css, pages.css
│   │   ├── js/main.js
│   │   ├── icons/            # line-icon SVG sprite
│   │   └── brand/            # logo SVGs + PNG exports (see §4.5)
│   ├── index.njk, about.njk, reviews.njk, faq.njk, contact.njk,
│   │   service-area.njk, 404.njk
│   ├── services/index.njk    # hub
│   ├── services/service.njk  # paginated over services.json → 8 pages
│   ├── sitemap.njk           # → /sitemap.xml
│   ├── robots.txt
│   ├── _headers
│   └── favicon.svg, favicon-32.png, apple-touch-icon.png, site.webmanifest,
│       og-image.png
├── scripts/brand/            # logo source + export script (SVG → PNG)
├── tests/                    # node:test suites run against _site/
└── _site/                    # build output (gitignored)
```
Each CSS file stays under ~400 lines; no file over 800.

### 3.3 Data flow
Data files in `src/_data/` are the single source of truth. Templates render
both visible content and JSON-LD from the same data, so the FAQ schema can
never drift from the visible FAQ, and the sitemap is generated from the
Eleventy collection so it always lists every page.

## 4. Brand system

### 4.1 Logo — refined flower mark
- **Concept:** keep the current structure (4 main petals + 4 diagonal petals +
  4 inner petals + center) redrawn as flat geometric shapes on a 200×200 grid.
- **Construction:** petals built from symmetric curves, rotated copies of one
  petal path (true radial symmetry, unlike the current hand-tuned paths).
- **Color treatment (full color):** outer petals Crimson, diagonal petals
  Garnet, inner petals Magnolia (reads as white "cutouts"), center Pollen Gold.
- **No gradients, no hairline strokes**, no background circle.
- **Small-size variant (≤ 32px):** 4 main + 4 diagonal petals + center only.
- **Wordmark:** "Renata's" in Cormorant Garamond SemiBold; "CLEANING SERVICE"
  in Jost Medium, uppercase, letter-spacing 0.2em.
- **Lockups:** horizontal (mark left, stacked wordmark right), stacked (mark
  above centered wordmark), mark only.
- **Versions per lockup:** full color (on light), reversed (Magnolia + Pollen on
  Crimson or Garnet), one-color Ink, one-color white.
- **Clear space:** height of one main petal on all sides.
- **Minimum size:** mark 16px / 0.25in; horizontal lockup 140px / 1.25in wide.
- **File versions:** On the website the wordmark is live HTML text (SEO,
  accessibility) beside an inline SVG mark. Standalone logo files in
  `assets/brand/` have wordmark text **converted to outlines** (via fonttools or
  opentype.js from the Google Fonts TTFs) so they render correctly without the
  fonts installed.

### 4.2 Color
| Token | Name | Hex | Role |
|---|---|---|---|
| `--crimson` | Renata Crimson | `#C41E3A` | Primary brand, CTAs, logo |
| `--garnet` | Garnet | `#8B1A2F` | Hover, dark sections, footer |
| `--blush` | Blush | `#F7E6E4` | Tinted cards, highlights |
| `--magnolia` | Magnolia | `#FFFEF9` | Page background |
| `--linen` | Linen | `#F8F5F0` | Alternate section background |
| `--ink` | Ink | `#2B2527` | Body text, headings |
| `--stone` | Stone | `#6B6360` | Secondary text |
| `--pollen` | Pollen Gold | `#E3A935` | Flower center, stars, accents |

Retired: `#E85D75` soft red, `#8BA888` soft green.

**Measured contrast (WCAG 2.1)**
| Pair | Ratio | Allowed use |
|---|---|---|
| Ink on Magnolia / Linen / Blush | 14.89 / 13.83 / 12.45 | All text |
| Stone on Magnolia / Linen / Blush | 5.81 / 5.40 / 4.86 | All text |
| Crimson on Magnolia / Linen / Blush | 5.79 / 5.37 / 4.84 | All text, links |
| White on Crimson | 5.84 | Buttons, all text |
| Magnolia on Garnet | 9.10 | All text |
| Ink on Pollen | 7.15 | Badges |
| Pollen on Garnet | 4.37 | Large text (≥24px, or ≥18.66px bold) and graphics only |
| Pollen on Magnolia | 2.08 | **Graphics only**, always paired with a text equivalent |

The brand book also lists RGB and approximate CMYK (labelled approximate —
confirm with a printer proof).

### 4.3 Typography
- **Display / headings / wordmark:** Cormorant Garamond (500, 600, 700).
- **Body / UI:** Jost (400, 500, 600), replacing Montserrat.
- Loaded from Google Fonts with `preconnect` + `display=swap`, only the weights
  above.
- Fluid type scale using `clamp()`; body 17–18px, line-height 1.6; headings
  line-height 1.15.
- Eyebrow labels: Jost 500, uppercase, 0.18em tracking, Crimson.

### 4.4 Iconography & graphics
- One custom line-icon set (1.75px stroke, rounded caps, 24px grid) replaces
  all emoji: home, building, sparkle, window, carpet, hammer, box, apartment,
  shield, clock, calendar, phone, message, mail, map-pin, star, check.
- Decorative motif: a single petal shape used sparingly as section dividers
  and background accents.
- No stock photography. The brand book includes photo guidance for when real
  team/job photos are available.

### 4.5 Brand asset deliverables (`src/assets/brand/`)
- `renatas-mark-{color,reversed,ink,white}.svg`
- `renatas-logo-horizontal-{color,reversed,ink,white}.svg`
- `renatas-logo-stacked-{color,reversed,ink,white}.svg`
- PNG exports @ 512px and 1024px of mark + horizontal color/reversed
  (via `rsvg-convert`)
- Site icons: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png`, `og-image.png` (1200×630)

## 5. Site map & page intent

| URL | Primary search intent | Notes |
|---|---|---|
| `/` | house cleaning / cleaning service Hartford County CT | Hero, trust, services overview, reviews, area, CTA |
| `/services/` | cleaning services Hartford CT | Hub linking all 8 |
| `/services/house-cleaning/` | house cleaning, maid service Hartford County | Weekly/bi-weekly/monthly; what's included |
| `/services/commercial-cleaning/` | office / commercial cleaning Hartford CT | Offices, medical offices, retail |
| `/services/deep-cleaning/` | deep cleaning service Hartford CT | Checklist, when to book |
| `/services/move-in-move-out-cleaning/` | move-out cleaning CT | |
| `/services/condo-apartment-cleaning/` | apartment / condo cleaning Hartford | |
| `/services/window-cleaning/` | window cleaning Hartford County | Inside & out, residential & commercial |
| `/services/carpet-cleaning/` | carpet cleaning Hartford CT | |
| `/services/post-construction-cleaning/` | post-construction cleaning CT | |
| `/service-area/` | cleaning service + each town name | One page, a section per town; no doorway pages |
| `/about/` | about / family-owned cleaning company CT | |
| `/reviews/` | Renata's Cleaning reviews | 3 testimonials, Google review link |
| `/faq/` | cleaning service FAQ | Full FAQ + `FAQPage` schema |
| `/contact/` | contact / free cleaning quote | Call, text, email |
| `/404.html` | — | Required on Cloudflare Pages (see §7) |

**Each service page contains:** H1, intro, "what's included" checklist,
"who it's for", scheduling options (where relevant), 2–3 service-specific FAQs
(not included in `FAQPage` schema, to keep one canonical FAQ source),
related services, service-area line, CTA band.

**Navigation:** Services (dropdown on desktop, list in mobile drawer),
Commercial, Service Area, About, Reviews, FAQ, Contact, persistent "Call"
button. Mobile has a sticky bottom bar with Call / Text / Email.

## 6. SEO specification

**Every page**
- Unique `<title>` ≤ 60 chars, pattern `{Page topic} in Hartford County, CT | Renata's`
  (home keeps the brand-first variant).
- Unique meta description 120–160 chars including a CTA.
- `<link rel="canonical">` to the absolute `https://renatascleaning.com/...`
  URL with trailing slash.
- Open Graph + Twitter Card tags; `og:image` = `/og-image.png` (1200×630).
- Exactly one `<h1>`; logical H2/H3 hierarchy.
- `theme-color` Crimson; favicon set; web manifest.
- Google Ads gtag.

**Structured data**
- `LocalBusiness` (`HomeAndConstructionBusiness` + `ProfessionalService`) with
  `@id: https://renatascleaning.com/#business`, `logo`, `image`, `telephone`,
  `email`, `address` (Hartford, CT), `geo`, `areaServed` (towns from data),
  `priceRange`, `aggregateRating`, reviews. Rendered on every page (it is the
  site's entity; small payload).
- `WebSite` with `@id` and `publisher` → business.
- `Service` on each service page: `serviceType`, `provider` → `#business`,
  `areaServed`.
- `BreadcrumbList` on all non-home pages.
- `FAQPage` on `/faq/` only, generated from `faqs.json`.

**Technical**
- Auto-generated `sitemap.xml` (all indexable pages, `lastmod` = build date).
- `robots.txt` allowing all, pointing at the sitemap.
- Internal linking: every service page links to ≥ 3 related services,
  `/service-area/`, `/contact/`.
- No render-blocking JS; CSS minimal and cacheable; SVG-only imagery.

## 7. Cloudflare Pages

- **Build command:** `npm run build && npm test`
- **Output directory:** `_site`
- **Node:** from `.nvmrc`
- **`404.html` is required.** Without a top-level `404.html`, Pages treats the
  site as an SPA and serves `/` with HTTP 200 for unknown paths (soft 404s).
- **Route matching:** Pages serves `/about/index.html` at `/about/` and
  redirects `/about` → `/about/`. All canonicals and sitemap URLs use the
  trailing-slash form.
- **`_headers`:**
  - `/*`: `X-Frame-Options: DENY`, `Permissions-Policy` (camera, microphone,
    geolocation off), `Referrer-Policy: strict-origin-when-cross-origin`.
  - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`, with
    asset URLs cache-busted via a build-time content-hash query string.
  - `https://:project.pages.dev/*`: `X-Robots-Tag: noindex` so only the custom
    domain is indexed.
- **Remove:** `.github/workflows/static.yml` and `CNAME` (GitHub Pages).
- **Owner's dashboard steps (checklist delivered with the work):**
  1. Create Pages project from the GitHub repo with the settings above.
  2. Verify the preview deployment for the `redesign` branch.
  3. Add custom domain `renatascleaning.com`; add `www` → apex redirect rule.
  4. After cutover, disable GitHub Pages in repo settings.
  5. Resubmit the sitemap in Google Search Console.

## 8. Testing

Node `node:test` suites run against the built `_site/`:
- **Pages:** exactly one `<h1>`; `<title>` present, unique, ≤ 60 chars; meta
  description present, unique, 120–160 chars; canonical present, absolute,
  matches the page's own URL.
- **SEO assets:** every indexable page appears in `sitemap.xml`; `robots.txt`
  references sitemap; `og-image.png`, favicons, manifest exist; `404.html`
  exists at root.
- **Links:** every internal `href`/`src` resolves to a file in `_site/`.
- **Schema:** every JSON-LD block parses; `/faq/` `FAQPage` questions equal the
  visible FAQ questions; each service page has a `Service` block.
- **Content rules:** no price patterns (`$` followed by a digit) in visible
  text; Ads tag present on every page; phone link `tel:+18607965222` present.
- **Accessibility smoke:** every `<img>` has `alt`; every inline SVG icon is
  `aria-hidden` or labelled; `<html lang="en">`.
- **Brand assets:** all files listed in §4.5 exist.

Manual verification: Chrome at 375px, 768px, 1280px on Home + one service page
+ FAQ; Lighthouse mobile on Home + one service page.

## 9. Brand book

A hosted, shareable page (Claude Artifact) containing:
1. Brand story & positioning (tagline "Pure Elegance in Every Detail")
2. Voice & tone — principles with do / don't examples
3. Logo — lockups, versions, construction, clear space, minimum size, misuse
4. Color — swatches with hex / RGB / approximate CMYK, contrast rules
5. Typography — families, weights, scale, pairing examples
6. Iconography & graphic motif
7. UI components — buttons, cards, CTA band
8. Photography guidance (for future real photos)
9. Applications — business card and vehicle/yard-sign layout guidance
10. Asset list with file names

Logo SVGs are embedded directly so the page is self-contained.

## 10. Delivery sequence & checkpoints

1. Scaffold Eleventy + tests (red), tokens, base layout.
2. Logo + brand assets → **checkpoint: owner reviews logo + home page.**
3. Remaining pages, schema, sitemap, Cloudflare config (tests green).
4. Browser + Lighthouse verification; code review.
5. Brand book published.
6. Update `CLAUDE.md` and `README.md` for the new architecture.
7. Owner copy review; merge when ready; cutover checklist.

## 11. Non-goals

- Quote/contact form (possible later via Pages Functions).
- Individual town landing pages.
- Blog, booking system, CMS.
- Real photography (guidance only).
- Pricing of any kind.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Thin or fabricated service copy | §2 fact list; owner copy review before merge |
| Ranking dip during URL change | `/` stays; new pages add URLs; sitemap resubmitted; canonical everywhere |
| Duplicate content across GitHub Pages / pages.dev / domain | Remove GH Pages deploy + disable it; `noindex` pages.dev; canonicals |
| Logo change alienates existing customers | Refinement of same flower, same colors |
| Outlined-text logo tooling | Fallback: opentype.js via `npx` if fonttools unavailable |
