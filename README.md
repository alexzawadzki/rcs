# Renata's Cleaning Service

A professional, responsive website for Renata's Cleaning Service - a residential and commercial cleaning company with over 10 years of experience.

## Overview

This is a modern, single-page static website showcasing cleaning services, customer testimonials, and contact information. The site is designed with a clean, professional aesthetic and is fully responsive for both desktop and mobile devices.

## Features

- **Responsive Design**: Optimized for all screen sizes (desktop, tablet, and mobile)
- **Single-Page Application**: All content in one streamlined HTML file
- **Professional Styling**: Custom color scheme with elegant typography
- **Service Showcase**: Highlights four core service offerings:
  - Residential Cleaning
  - Commercial Cleaning
  - Condo/Apartment Cleaning
  - Deep Cleaning
- **Customer Testimonials**: Features customer reviews with 5-star ratings
- **Accessibility**: Includes ARIA labels, semantic HTML, and keyboard navigation support
- **Fast Loading**: No external dependencies (except Google Fonts)

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

- **Lightweight**: Single HTML file (~34 KB)
- **Fast Loading**: No external CSS or JavaScript files
- **Optimized**: Inline SVG graphics for faster rendering

## Contact

For business inquiries or service bookings, call:
- **Main**: (631) 793-2046
- **Alternative**: (631) 275-0660

## License

This project is private and proprietary. All rights reserved.

---

**Built with care for Renata's Cleaning Service** 🧹✨
