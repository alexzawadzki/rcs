# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page website for **Renata's Cleaning Service** — a commercial and residential cleaning company in Hartford County, CT. Live at `renatascleaning.com`.

## Development

No build tools or dependencies. Open `index.html` directly or serve locally:

```bash
python -m http.server 8000
# or
npx serve
```

Deployment is automatic: every push to `main` triggers the GitHub Actions workflow (`.github/workflows/static.yml`), which deploys to GitHub Pages with the custom domain `renatascleaning.com`.

## Architecture

Everything lives in a single file: **`index.html`** (~1650 lines). It contains:

- **`<head>`**: Google Ads tag (`AW-17838655328`), SEO meta tags (Open Graph, Twitter Card, geo), two Schema.org JSON-LD blocks (`LocalBusiness` and `FAQPage`)
- **`<style>`**: All CSS, organized as global variables → base styles → component styles → media queries (768px breakpoint for mobile)
- **`<body>`**: Semantic HTML sections in order: `header/nav` → `hero` → `#about` → `#services` → `.pricing` → `#why-choose` → `#testimonials` → `#faq` → `.service-area` → `#contact` → `footer`
- **Inline `<script>`**: Mobile hamburger menu toggle and smooth scroll behavior

## Design System

CSS custom properties defined in `:root`:

| Variable | Value | Use |
|---|---|---|
| `--primary-red` | `#C41E3A` | Brand color, CTAs, nav accents |
| `--deep-red` | `#8B1A2F` | Hover states |
| `--soft-red` | `#E85D75` | Subtle accents |
| `--magnolia-white` | `#FFFEF9` | Header and page background |
| `--cream` | `#F8F5F0` | Section backgrounds |
| `--charcoal` | `#2C2C2C` | Body text |

Fonts: **Cormorant Garamond** (headings/logo) + **Montserrat** (body), loaded from Google Fonts.

## SVG Logo

The flower logo appears in three places with **separate SVG gradient IDs** to avoid conflicts:
- Header (`id="petal"`, `id="center"`) — 50×50px display
- Hero section (`id="hero-petal"`, `id="hero-center"`) — 120×120px display
- Footer (`id="footer-petal"`, `id="footer-center"`) — 60×60px display

When editing any logo SVG, keep the gradient IDs scoped to their section or all three will render identically.

## SEO Notes

The Schema.org `LocalBusiness` block (lines ~52–119) and `FAQPage` block (lines ~120–175) are critical for Google rich results. The `FAQPage` schema must stay in sync with the visible FAQ accordion content in `#faq`.

No pricing is shown anywhere on the site — all services are quote-based by design.
