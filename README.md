# Renata's Cleaning Service

A professional, responsive website for Renata's Cleaning Service - a residential and commercial cleaning company with over 25 years of experience.

## Overview

This is a modern, single-page static website showcasing cleaning services, customer testimonials, and contact information. The site is designed with a clean, professional aesthetic and is fully responsive for both desktop and mobile devices.

## Features

- **Responsive Design**: Optimized for all screen sizes (desktop, tablet, and mobile)
- **Single-Page Application**: All content in one streamlined HTML file
- **Professional Styling**: Custom color scheme with elegant typography
- **Service Showcase**: Highlights eight core service offerings:
  - Residential Cleaning
  - Commercial Cleaning
  - Condo/Apartment Cleaning
  - Deep Cleaning
  - Window Cleaning
  - Carpet Cleaning
  - Post-Construction Cleaning
  - Move-In / Move-Out Cleaning
- **Customer Testimonials**: Features customer reviews with 5-star ratings
- **Accessibility**: Includes ARIA labels, semantic HTML, skip-link, and keyboard navigation support
- **Fast Loading**: No external dependencies (except Google Fonts)
- **SEO Optimized**: Rich structured data, Open Graph, Twitter Card, and FAQ schema markup

## Technologies Used

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Grid, Flexbox, gradients, and animations
- **SVG Graphics**: Custom inline SVG logo
- **Google Fonts**: Cormorant Garamond and Montserrat
- **GitHub Actions**: Automated deployment workflow
- **GitHub Pages**: Hosting platform

## Design

### Color Palette
- Primary Red: `#C41E3A`
- Deep Red: `#8B1A2F`
- Soft Green: `#8BA888`
- Cream/Off-white backgrounds
- Charcoal text

### Typography
- **Headings**: Cormorant Garamond (serif)
- **Body Text**: Montserrat (sans-serif)

## Getting Started

### Prerequisites

No build tools or dependencies required! This is a static website that runs directly in any modern web browser.

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/alexzawadzki/rcs.git
   cd rcs
   ```

2. Open `index.html` in your web browser:
   ```bash
   # On macOS
   open index.html

   # On Linux
   xdg-open index.html

   # On Windows
   start index.html
   ```

   Or use a local development server:
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (with npx)
   npx serve
   ```

3. Visit `http://localhost:8000` in your browser

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment

Every push to the `main` branch triggers an automatic deployment via the GitHub Actions workflow defined in `.github/workflows/static.yml`.

### Manual Deployment

The site can also be deployed to any static hosting service by uploading the `index.html` file.

## Project Structure

```
rcs/
├── .github/
│   └── workflows/
│       └── static.yml        # GitHub Pages deployment workflow
├── .gitattributes            # Git configuration
├── index.html                # Main website (all HTML, CSS, and SVG)
└── README.md                 # This file
```

## Customization

To customize the website:

1. **Update Content**: Edit `index.html` directly
2. **Change Colors**: Modify the CSS color variables in the `<style>` section
3. **Update Services**: Edit the service cards in the services section
4. **Modify Testimonials**: Update customer reviews in the testimonials section
5. **Change Contact Info**: Update phone numbers and contact details

## Browser Support

This website is compatible with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Performance

- **Lightweight**: Single HTML file (~86 KB)
- **Fast Loading**: No external CSS or JavaScript files
- **Optimized**: Inline SVG graphics for faster rendering

## SEO Audit (February 2026)

A full SEO review was conducted. Results:

### Passing
- `<html lang="en">` language attribute declared
- Keyword-rich `<title>` tag (~72 chars)
- Meta description (155 chars) with location, keywords, and phone CTA
- Canonical URL (`https://renatascleaning.com`)
- `robots: index, follow`
- Open Graph tags: `title`, `description`, `type`, `url`, `image`, `locale`, `site_name`
- Twitter Card tags: `card`, `title`, `description`, `image`
- Geo meta tags: `geo.region`, `geo.placename`, `geo.position`, `ICBM`
- Schema.org `LocalBusiness` with name, URL, phone, email, address, geo, service area, price range, aggregate rating, and 3 inline reviews
- `FAQPage` schema (6 items — eligible for FAQ rich results in Google Search)
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Single `<h1>` with location keyword ("Hartford County, CT")
- Proper heading hierarchy: H1 → H2 → H3
- ARIA labels on interactive elements and decorative icons
- Skip-to-content link for keyboard users
- Google Fonts `preconnect` for reduced render-blocking

### Fixed
| Issue | Fix Applied |
|---|---|
| No favicon | Added SVG data-URI favicon (`<link rel="icon">`) |
| Missing `og:site_name` | Added `<meta property="og:site_name">` |
| Missing `twitter:image` | Added `<meta name="twitter:image">` |
| Missing `theme-color` | Added `<meta name="theme-color" content="#C41E3A">` |
| Missing `apple-touch-icon` | Added `<link rel="apple-touch-icon">` for iOS home-screen |

## Responsiveness Audit (February 2026)

Testing performed across mobile (320px–428px), tablet (768px–1024px), and desktop (1280px+) widths.

### Passing
- Viewport meta tag (`width=device-width, initial-scale=1.0`)
- Mobile hamburger menu with slide-in drawer and semi-transparent overlay
- 768px media query handles font scaling, grid collapsing, and layout stacking
- `auto-fit` + `minmax()` CSS Grid for services, features, and testimonials
- Single-column grid override on mobile for all card grids
- CTA buttons stack vertically on mobile
- About section switches from 2-column grid to single column
- Contact cards stack vertically and remove fixed min-width on mobile
- Hero padding and margin-top adjusted for reduced mobile header height
- FAQ accordion `max-height` increased (400px) on mobile to prevent clipping
- Logo overflow handled with `text-overflow: ellipsis` on narrow screens
- `overflow-x: hidden` on `body`

### Fixed
| Issue | Fix Applied |
|---|---|
| `overflow-x: hidden` missing on `html` element | Added `html { overflow-x: hidden }` — prevents Safari/iOS from scrolling the root element horizontally |
| No `prefers-reduced-motion` support | Added `@media (prefers-reduced-motion: reduce)` — disables all CSS transitions and animations for users who opt out of motion |

## Contact

For business inquiries or service bookings, call:
- **Main**: (860) 796-5222
- **Email**: Renata@renatascleaning.com

## License

This project is private and proprietary. All rights reserved.

---

**Built with care for Renata's Cleaning Service** 🧹✨
