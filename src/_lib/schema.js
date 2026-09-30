// JSON-LD builders. Pure functions: site data in, plain schema.org objects out.

const CONTEXT = "https://schema.org";
const BUSINESS_TYPES = ["HomeAndConstructionBusiness", "ProfessionalService"];
const PRICE_RANGE = "$$";
const BEST_RATING = "5";

const absolute = (siteUrl, urlPath) => `${siteUrl}${urlPath}`;
const serviceUrl = (siteUrl, slug) => absolute(siteUrl, `/services/${slug}/`);

export const businessId = (siteUrl) => `${siteUrl}/#business`;
export const websiteId = (siteUrl) => `${siteUrl}/#website`;

export function localBusiness({ site, towns, reviews, services }) {
  return {
    "@type": BUSINESS_TYPES,
    "@id": businessId(site.url),
    name: site.name,
    url: absolute(site.url, "/"),
    logo: absolute(site.url, site.logo),
    image: absolute(site.url, site.ogImage),
    slogan: site.tagline,
    telephone: site.phone.tel,
    email: site.email,
    priceRange: PRICE_RANGE,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.locality,
      addressRegion: site.region,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude },
    areaServed: towns.map((town) => ({ "@type": "City", name: `${town.name}, ${site.region}` })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviews.ratingValue,
      reviewCount: String(reviews.reviewCount),
      bestRating: BEST_RATING,
      worstRating: "1",
    },
    review: reviews.testimonials.map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.author },
      reviewRating: { "@type": "Rating", ratingValue: String(t.rating), bestRating: BEST_RATING },
      reviewBody: t.text,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Cleaning Services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, url: serviceUrl(site.url, s.slug) },
      })),
    },
  };
}

export function webSite(site) {
  return {
    "@type": "WebSite",
    "@id": websiteId(site.url),
    url: absolute(site.url, "/"),
    name: site.name,
    publisher: { "@id": businessId(site.url) },
  };
}

export function breadcrumbList(site, crumbs) {
  const trail = [{ label: "Home", url: "/" }, ...crumbs];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: absolute(site.url, crumb.url),
    })),
  };
}

export function serviceNode(site, service) {
  const url = serviceUrl(site.url, service.slug);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    serviceType: service.name,
    description: service.summary,
    url,
    provider: { "@id": businessId(site.url) },
    areaServed: { "@type": "AdministrativeArea", name: `${site.county}, ${site.region}` },
  };
}

export function faqPage(site, faqs, pageUrl) {
  return {
    "@type": "FAQPage",
    "@id": `${absolute(site.url, pageUrl)}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function buildSchemaGraph({ site, towns, reviews, services, pageUrl, breadcrumbs, service, includeFaq, faqs }) {
  if (!site?.url) throw new Error("buildSchemaGraph: site.url is required");
  const optional = [
    breadcrumbs?.length ? breadcrumbList(site, breadcrumbs) : null,
    service ? serviceNode(site, service) : null,
    includeFaq && faqs?.length ? faqPage(site, faqs, pageUrl) : null,
  ].filter(Boolean);
  return {
    "@context": CONTEXT,
    "@graph": [localBusiness({ site, towns, reviews, services }), webSite(site), ...optional],
  };
}
