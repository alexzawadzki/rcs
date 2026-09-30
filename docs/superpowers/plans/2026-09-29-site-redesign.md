# Renata's Cleaning Service Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild renatascleaning.com as a 16-page Eleventy site with a refined flower logo, a documented brand system, full local-SEO markup, and Cloudflare Pages hosting.

**Architecture:** Eleventy 3 renders Nunjucks templates from JSON data files in `src/_data/` (single source of truth for services, towns, FAQs, reviews, brand colors). Pure JS modules in `src/_lib/` build filters and JSON-LD and are unit-tested; `node:test` suites assert SEO/link/content rules against the built `_site/`. A Node brand script turns the petal geometry + outlined font glyphs into SVG/PNG logo assets, which are committed.

**Tech Stack:** Node 22 (`.nvmrc`), Eleventy 3, Nunjucks, vanilla CSS/JS, `node:test`, opentype.js (brand script only), `rsvg-convert` (brand script only, local), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-29-site-redesign-design.md`

**File convention:** Code blocks whose info string contains `file=<path>` are the complete contents of that file.

## Global Constraints

- No prices anywhere; no `$` followed by a digit in visible text or data.
- Copy asserts only facts listed in spec §2 (25+ years, family-owned, insured & bonded, own supplies, move objects to dust, weekly/bi-weekly/monthly/one-time, free quotes, no hidden fees, satisfaction guaranteed, 24-hour email replies, the 12 towns, 4.6 rating from 11 Google reviews, 3 verbatim testimonials).
- Phone `(860) 796-5222` / `tel:+18607965222` / `sms:+18607965222`; email `Renata@renatascleaning.com`.
- Google Ads tag `AW-17838655328` on every page.
- Canonical origin `https://renatascleaning.com`; all page URLs end in `/` (except `/404.html`).
- `<title>` ≤ 60 chars; meta description 120–160 chars; exactly one `<h1>` per page.
- Colors (exact): crimson `#C41E3A`, garnet `#8B1A2F`, blush `#F7E6E4`, magnolia `#FFFEF9`, linen `#F8F5F0`, ink `#2B2527`, stone `#6B6360`, pollen `#E3A935`. Pollen is never used for text below 24px (18.66px bold).
- Fonts: Cormorant Garamond (500, 600, 700, italic 500) for display; Jost (400, 500, 600) for body.
- Logo files: no gradients, no `<text>` elements (outlined glyphs only).
- Only dev dependencies: `@11ty/eleventy`, `opentype.js`. Tests use `node:test` + `node:assert/strict`.
- Files ≤ 400 lines where practical, never > 800.
- Cloudflare Pages build: `npm run build && npm test`, output `_site`.
- Commit messages: conventional commits, ending with the session's `Co-Authored-By` / `Claude-Session` trailers.

## Review Focus

1. **Apostrophes and ampersands in data** (`Renata's`, `Insured & bonded`) must reach JSON-LD as real characters and meta tags as correctly-escaped HTML — never `&#39;` inside JSON or double-escaped `&amp;amp;`. Pinned: Task 4 `schema.test.mjs` "no HTML entities in JSON-LD" + exact business name; Task 3 `pages.test.mjs` `og:title === <title>`.
2. **Internal links without a trailing slash** (`/about`) trigger a Cloudflare 308 hop and split link equity. Pinned: Task 3 `links.test.mjs` "page links end with / or a file extension".
3. **Stale CSS/JS after a deploy** — assets are cached for a year, so every CSS/JS/icon URL must carry a content hash, and the long cache must not cover un-hashed files (brand PNGs linked from schema). Pinned: Task 3 `links.test.mjs` cache-busting test; Task 7 `seo-assets.test.mjs` `_headers` scoping test.
4. **Desktop visitors can't tap `tel:` links** — the phone number must be readable text on every page. Pinned: Task 3 `pages.test.mjs` "phone number visible as text".
5. **Visitors whose JavaScript fails** must still reach every section from the header. Pinned: Task 3 `content.test.mjs` "primary nav links are real links in the HTML" + `.js`-gated drawer CSS.

---

## File Map

| Path | Responsibility |
|---|---|
| `package.json`, `.nvmrc`, `.gitignore` | Tooling, scripts, Node pin |
| `eleventy.config.js` | Eleventy dirs, passthrough, filter/global registration |
| `src/_lib/filters.js` | Pure filters: `jsonLd`, `absoluteUrl`, `isoDate`, `createAssetUrl`, `serviceBySlug`, `whereCategory`, `sitemapPages` |
| `src/_lib/schema.js` | Pure JSON-LD builders + `buildSchemaGraph` |
| `src/_data/*.json` | site, nav, services, serviceGroups, towns, faqs, reviews, brand |
| `src/_includes/layouts/base.njk` | `<head>` SEO, gtag, header/footer/CTA/mobile bar, JSON-LD |
| `src/_includes/layouts/service.njk` | Service page body |
| `src/_includes/partials/*.njk` | header, footer, cta-band, mobile-bar, breadcrumbs, gtag, macros, logo-mark (generated) |
| `src/assets/css/{tokens,base,components,pages}.css` | Design tokens → primitives → components → page layouts |
| `src/assets/js/main.js` | Mobile drawer |
| `src/assets/icons/sprite.svg` | 20 line icons |
| `src/assets/brand/*` | Generated logo SVG/PNG |
| `src/*.njk`, `src/services/*` | Pages |
| `src/sitemap.njk`, `src/robots.txt`, `src/_headers`, `src/site.webmanifest` | Crawl + hosting config |
| `scripts/brand/*` | Font fetch, geometry, text outlining, asset build |
| `tests/helpers/site.mjs` | Built-site readers/parsers |
| `tests/*.test.mjs` | Unit + built-site suites |

---

### Task 1: Tooling, data, filters, test harness

**Files:**
- Create: `package.json`, `.nvmrc`, `.gitignore`, `eleventy.config.js`
- Create: `src/_lib/filters.js`
- Create: `src/_data/site.json`, `src/_data/nav.json`, `src/_data/services.json`, `src/_data/serviceGroups.json`, `src/_data/towns.json`, `src/_data/faqs.json`, `src/_data/reviews.json`, `src/_data/brand.json`
- Create: `src/index.njk` (smoke page; replaced in Task 3)
- Test: `tests/helpers/site.mjs`, `tests/filters.test.mjs`, `tests/data.test.mjs`, `tests/build.test.mjs`

**Interfaces:**
- Produces (filters, registered in Eleventy under the same names):
  - `jsonLd(data: object): string` — `JSON.stringify` with every `<` as `<`
  - `absoluteUrl(urlPath: string, base: string): string`
  - `isoDate(date: Date|string): string` — `YYYY-MM-DD`
  - `createAssetUrl(inputDir: string): { assetUrl(urlPath: string): string, reset(): void }` — returns `"/assets/x.css?v=<8 hex>"`
  - `serviceBySlug(services: Service[], slug: string): Service` — throws on unknown slug
  - `whereCategory(services: Service[], category: string): Service[]`
  - `sitemapPages(collection: EleventyItem[]): EleventyItem[]`
- Produces data globals: `site`, `nav`, `services`, `serviceGroups`, `towns`, `faqs`, `reviews`, `brand`, `buildDate`
- Produces test helpers (`tests/helpers/site.mjs`): `SITE_DIR`, `SITE_URL`, `readJson`, `decodeEntities`, `assertBuilt`, `siteFile`, `readSiteFile`, `siteFileExists`, `listSiteFiles`, `urlForFile`, `loadPages`, `isIndexable`, `parseAttributes`, `findTags`, `getTitle`, `getMetaContent`, `getCanonical`, `countTag`, `getJsonLdBlocks`, `getGraph`, `hasType`, `visibleText`, `getInnerTexts`, `getInternalRefs`, `getIds`, `resolveToFile`, `pngSize`
- `Service` shape: `{ slug, name, icon, category: "residential"|"commercial"|"specialty", featured?, metaTitle, metaDescription, h1, summary, intro: string[], included: string[], idealFor: string[], scheduling: string|null, faqs: {q,a}[], related: string[] }`

- [ ] **Step 1: Initialize tooling**

```json file=package.json
{
  "name": "renatas-cleaning-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve --port=8080",
    "test": "node --test \"tests/*.test.mjs\"",
    "check": "npm run build && npm test",
    "brand:fonts": "node scripts/brand/fetch-fonts.mjs",
    "brand": "node scripts/brand/build-brand.mjs"
  }
}
```

```text file=.nvmrc
22
```

```text file=.gitignore
node_modules/
_site/
.DS_Store
```

Run: `npm install --save-dev @11ty/eleventy@^3 opentype.js@^1`
Expected: `package.json` gains a `devDependencies` block; `package-lock.json` created.

- [ ] **Step 2: Write the test helpers**

```js file=tests/helpers/site.mjs
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const SITE_DIR = path.resolve("_site");
export const SITE_URL = "https://renatascleaning.com";

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", middot: "·", hellip: "…", copy: "©",
};

export function readJson(relPath) {
  return JSON.parse(readFileSync(path.resolve(relPath), "utf8"));
}

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code.startsWith("#")) {
      const isHex = code[1].toLowerCase() === "x";
      return String.fromCodePoint(parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10));
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function assertBuilt() {
  if (!existsSync(path.join(SITE_DIR, "index.html"))) {
    throw new Error("_site/index.html not found. Run `npm run build` before `npm test`.");
  }
}

export const siteFile = (relPath) => path.join(SITE_DIR, relPath.replace(/^\//, ""));
export const readSiteFile = (relPath) => readFileSync(siteFile(relPath), "utf8");
export const siteFileExists = (relPath) => existsSync(siteFile(relPath));

export function listSiteFiles(extension) {
  assertBuilt();
  return readdirSync(SITE_DIR, { recursive: true })
    .map((entry) => entry.split(path.sep).join("/"))
    .filter((entry) => entry.endsWith(extension))
    .sort();
}

export function urlForFile(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return `/${relPath.slice(0, -"index.html".length)}`;
  return `/${relPath}`;
}

export function loadPages() {
  return listSiteFiles(".html").map((rel) => ({ rel, url: urlForFile(rel), html: readSiteFile(rel) }));
}

export const isIndexable = (page) => page.url !== "/404.html";

export function parseAttributes(attrText) {
  const attrs = {};
  for (const m of attrText.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

export function findTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  return [...html.matchAll(re)].map((m) => parseAttributes(m[1]));
}

export function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

export function getMetaContent(html, key, value) {
  const tag = findTags(html, "meta").find((attrs) => attrs[key] === value);
  return tag ? tag.content : null;
}

export function getCanonical(html) {
  const tag = findTags(html, "link").find((attrs) => attrs.rel === "canonical");
  return tag ? tag.href : null;
}

export const countTag = (html, tagName) =>
  (html.match(new RegExp(`<${tagName}\\b`, "gi")) || []).length;

export function getJsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

export function getGraph(html) {
  return getJsonLdBlocks(html).flatMap((raw) => {
    const data = JSON.parse(raw);
    return data["@graph"] ?? [data];
  });
}

export function hasType(node, type) {
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.includes(type);
}

export function visibleText(html) {
  const body = html.replace(/^[\s\S]*?<body[^>]*>/i, "");
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

export function getInnerTexts(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return [...html.matchAll(re)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
  );
}

export function getInternalRefs(html) {
  return [...html.matchAll(/\s(?:href|src)="([^"]+)"/gi)]
    .map((m) => decodeEntities(m[1]))
    .filter((value) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value));
}

export const getIds = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/gi)].map((m) => m[1]));

export function resolveToFile(urlPath) {
  const clean = urlPath.split("#")[0].split("?")[0];
  return clean.endsWith("/") ? `${clean.slice(1)}index.html` : clean.slice(1);
}

export function pngSize(absPath) {
  const buf = readFileSync(absPath);
  const signature = buf.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error(`${absPath} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
```

- [ ] **Step 3: Write the failing filter unit tests**

```js file=tests/filters.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  jsonLd, absoluteUrl, isoDate, createAssetUrl, serviceBySlug, whereCategory, sitemapPages,
} from "../src/_lib/filters.js";

test("jsonLd escapes < so a string cannot close the script tag", () => {
  const out = jsonLd({ text: "</script><b>" });
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), { text: "</script><b>" });
});

test("jsonLd keeps apostrophes and ampersands as real characters", () => {
  assert.equal(JSON.parse(jsonLd({ name: "Renata's & Co" })).name, "Renata's & Co");
});

test("absoluteUrl joins a path onto the origin", () => {
  assert.equal(absoluteUrl("/about/", "https://renatascleaning.com"), "https://renatascleaning.com/about/");
  assert.equal(absoluteUrl("/", "https://renatascleaning.com"), "https://renatascleaning.com/");
});

test("isoDate formats YYYY-MM-DD", () => {
  assert.equal(isoDate(new Date("2026-09-29T15:00:00Z")), "2026-09-29");
});

test("assetUrl appends a stable 8-hex content hash", () => {
  const { assetUrl } = createAssetUrl("tests/fixtures");
  const first = assetUrl("/asset.txt");
  assert.match(first, /^\/asset\.txt\?v=[0-9a-f]{8}$/);
  assert.equal(assetUrl("/asset.txt"), first);
});

test("assetUrl names the missing file in its error", () => {
  const { assetUrl } = createAssetUrl("tests/fixtures");
  assert.throws(() => assetUrl("/missing.css"), /missing\.css/);
});

test("serviceBySlug finds a service and throws on unknown slugs", () => {
  const services = [{ slug: "a", name: "A" }];
  assert.equal(serviceBySlug(services, "a").name, "A");
  assert.throws(() => serviceBySlug(services, "nope"), /Unknown service slug "nope"/);
});

test("whereCategory filters without mutating", () => {
  const services = [{ slug: "a", category: "x" }, { slug: "b", category: "y" }];
  assert.deepEqual(whereCategory(services, "x").map((s) => s.slug), ["a"]);
  assert.equal(services.length, 2);
});

test("sitemapPages keeps indexable trailing-slash pages, sorted", () => {
  const items = [
    { url: "/b/", data: {} },
    { url: "/404.html", data: { noindex: true } },
    { url: "/a/", data: {} },
    { url: false, data: {} },
  ];
  assert.deepEqual(sitemapPages(items).map((i) => i.url), ["/a/", "/b/"]);
});
```

```text file=tests/fixtures/asset.txt
fixture for assetUrl hashing
```

- [ ] **Step 4: Run to verify failure**

Run: `node --test tests/filters.test.mjs`
Expected: FAIL — `Cannot find module '.../src/_lib/filters.js'`.

- [ ] **Step 5: Implement the filters**

```js file=src/_lib/filters.js
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const HASH_LENGTH = 8;

export function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function absoluteUrl(urlPath, base) {
  return new URL(urlPath, base).href;
}

export function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function createAssetUrl(inputDir) {
  const cache = new Map();

  function assetUrl(urlPath) {
    if (!cache.has(urlPath)) {
      const filePath = path.join(inputDir, urlPath);
      let contents;
      try {
        contents = readFileSync(filePath);
      } catch (cause) {
        throw new Error(`assetUrl: cannot read ${filePath}`, { cause });
      }
      const hash = createHash("sha256").update(contents).digest("hex").slice(0, HASH_LENGTH);
      cache.set(urlPath, `${urlPath}?v=${hash}`);
    }
    return cache.get(urlPath);
  }

  return { assetUrl, reset: () => cache.clear() };
}

export function serviceBySlug(services, slug) {
  const match = services.find((service) => service.slug === slug);
  if (!match) throw new Error(`Unknown service slug "${slug}"`);
  return match;
}

export function whereCategory(services, category) {
  return services.filter((service) => service.category === category);
}

export function sitemapPages(collection) {
  return collection
    .filter((item) => item.url && item.url.endsWith("/") && !item.data.noindex)
    .sort((a, b) => a.url.localeCompare(b.url));
}
```

- [ ] **Step 6: Run filter tests**

Run: `node --test tests/filters.test.mjs`
Expected: PASS (9 tests).

- [ ] **Step 7: Write the failing data-validation tests**

```js file=tests/data.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "./helpers/site.mjs";

const services = readJson("src/_data/services.json");
const groups = readJson("src/_data/serviceGroups.json");
const towns = readJson("src/_data/towns.json");
const faqs = readJson("src/_data/faqs.json");
const reviews = readJson("src/_data/reviews.json");
const brand = readJson("src/_data/brand.json");
const site = readJson("src/_data/site.json");
const nav = readJson("src/_data/nav.json");

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE = /\$\s?\d/;
const REQUIRED_SERVICE_FIELDS = ["slug", "name", "icon", "category", "metaTitle", "metaDescription", "h1", "summary"];

test("site identity is exact", () => {
  assert.equal(site.name, "Renata's Cleaning Service");
  assert.equal(site.url, "https://renatascleaning.com");
  assert.equal(site.phone.tel, "+18607965222");
  assert.equal(site.phone.display, "(860) 796-5222");
  assert.equal(site.email, "Renata@renatascleaning.com");
  assert.equal(site.googleAdsId, "AW-17838655328");
});

test("there are 8 services with unique kebab-case slugs", () => {
  assert.equal(services.length, 8);
  const slugs = services.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  slugs.forEach((slug) => assert.match(slug, KEBAB));
});

for (const service of services) {
  test(`service ${service.slug} is complete`, () => {
    REQUIRED_SERVICE_FIELDS.forEach((field) => assert.ok(service[field], `${field} missing`));
    assert.ok(groups.some((g) => g.key === service.category), `unknown category ${service.category}`);
    assert.ok(service.metaTitle.length <= 60, `metaTitle ${service.metaTitle.length} chars`);
    const d = service.metaDescription.length;
    assert.ok(d >= 120 && d <= 160, `metaDescription ${d} chars`);
    assert.ok(service.intro.length >= 2, "at least 2 intro paragraphs");
    assert.ok(service.included.length >= 4, "at least 4 included items");
    assert.ok(service.idealFor.length >= 3, "at least 3 idealFor items");
    assert.ok(service.faqs.length >= 2, "at least 2 FAQs");
    service.faqs.forEach((f) => assert.ok(f.q && f.a, "faq needs q and a"));
    assert.ok(service.related.length >= 3, "at least 3 related services");
    assert.ok(!service.related.includes(service.slug), "related must not include itself");
    service.related.forEach((slug) => assert.ok(services.some((s) => s.slug === slug), `unknown related ${slug}`));
  });
}

test("exactly house and commercial cleaning are featured", () => {
  assert.deepEqual(services.filter((s) => s.featured).map((s) => s.slug), ["house-cleaning", "commercial-cleaning"]);
});

test("12 towns with unique slugs and notes", () => {
  assert.equal(towns.length, 12);
  assert.equal(new Set(towns.map((t) => t.slug)).size, 12);
  towns.forEach((t) => { assert.match(t.slug, KEBAB); assert.ok(t.name && t.note); });
});

test("FAQs have unique ids and exactly 3 are featured", () => {
  assert.ok(faqs.length >= 8);
  assert.equal(new Set(faqs.map((f) => f.id)).size, faqs.length);
  assert.equal(faqs.filter((f) => f.featured).length, 3);
});

test("reviews match the real Google profile", () => {
  assert.equal(reviews.ratingValue, "4.6");
  assert.equal(reviews.reviewCount, 11);
  assert.equal(reviews.testimonials.length, 3);
});

test("brand palette is exact", () => {
  const byToken = Object.fromEntries(brand.colors.map((c) => [c.token, c.hex]));
  assert.deepEqual(byToken, {
    crimson: "#C41E3A", garnet: "#8B1A2F", blush: "#F7E6E4", magnolia: "#FFFEF9",
    linen: "#F8F5F0", ink: "#2B2527", stone: "#6B6360", pollen: "#E3A935",
  });
});

test("nav links are root-relative with trailing slashes", () => {
  nav.forEach((item) => assert.match(item.url, /^\/(?:[a-z0-9-]+\/)*$/));
});

test("no price patterns in any data file", () => {
  const all = JSON.stringify({ services, groups, towns, faqs, reviews, site });
  assert.doesNotMatch(all, PRICE);
});
```

- [ ] **Step 8: Run to verify failure**

Run: `node --test tests/data.test.mjs`
Expected: FAIL — `ENOENT ... src/_data/services.json`.

- [ ] **Step 9: Create the data files**

```json file=src/_data/site.json
{
  "name": "Renata's Cleaning Service",
  "shortName": "Renata's",
  "url": "https://renatascleaning.com",
  "tagline": "Pure Elegance in Every Detail",
  "phone": { "display": "(860) 796-5222", "tel": "+18607965222", "sms": "+18607965222" },
  "email": "Renata@renatascleaning.com",
  "googleAdsId": "AW-17838655328",
  "reviewUrl": "https://g.page/r/CS_Y3WFavzo8EAE/review",
  "locality": "Hartford",
  "region": "CT",
  "regionName": "Connecticut",
  "county": "Hartford County",
  "geo": { "latitude": 41.7637, "longitude": -72.6851 },
  "themeColor": "#C41E3A",
  "ogImage": "/og-image.png",
  "logo": "/assets/brand/renatas-mark-color-512.png"
}
```

```json file=src/_data/nav.json
[
  { "label": "Services", "url": "/services/", "hasSub": true },
  { "label": "Commercial", "url": "/services/commercial-cleaning/" },
  { "label": "Service Area", "url": "/service-area/" },
  { "label": "About", "url": "/about/" },
  { "label": "Reviews", "url": "/reviews/" },
  { "label": "FAQ", "url": "/faq/" },
  { "label": "Contact", "url": "/contact/" }
]
```

```json file=src/_data/serviceGroups.json
[
  { "key": "residential", "label": "For your home", "intro": "Recurring maid service, deep cleans and move-outs for houses, condos and apartments." },
  { "key": "commercial", "label": "For your business", "intro": "Office and commercial cleaning on a schedule that works around your business." },
  { "key": "specialty", "label": "Specialty cleaning", "intro": "Windows, carpets and post-construction cleanup for homes and businesses." }
]
```

```json file=src/_data/services.json
[
  {
    "slug": "house-cleaning",
    "name": "House Cleaning",
    "icon": "home",
    "category": "residential",
    "featured": true,
    "metaTitle": "House Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "House cleaning & maid service in Hartford County, CT: weekly, bi-weekly or monthly. 25+ years, insured & bonded. Free quote: (860) 796-5222.",
    "h1": "House Cleaning & Maid Service in Hartford County, CT",
    "summary": "Recurring or one-time home cleaning: dusting, vacuuming, mopping, kitchens and bathrooms, done with real attention to detail.",
    "intro": [
      "For more than 25 years, Renata's Cleaning Service has kept homes across Hartford County clean, calm and cared for. Our house cleaning is thorough by habit: we move objects to dust the surfaces underneath them, not around them, and put everything back where it belongs.",
      "Choose weekly, bi-weekly or monthly maid service, or book a one-time clean. Most of our residential clients prefer bi-weekly visits, and we're happy to build a schedule around your household."
    ],
    "included": [
      "Vacuuming all floors and carpets",
      "Mopping hard floors",
      "Dusting all surfaces, with objects moved rather than dusted around",
      "Full bathroom cleaning",
      "Kitchen surfaces and appliances wiped down",
      "General tidying, with items put back in an organized way"
    ],
    "idealFor": [
      "Busy households that want a consistently clean home",
      "Families who want a trusted, familiar team",
      "Homeowners and renters across Hartford County"
    ],
    "scheduling": "Weekly, bi-weekly, monthly or one-time. Need to reschedule? Call or text and we'll find a new time.",
    "faqs": [
      { "q": "Do I need to provide cleaning supplies?", "a": "No. We bring our own professional-grade supplies and equipment. If you'd like us to use specific products in your home, just let us know." },
      { "q": "Can I customize what gets cleaned?", "a": "Yes. We can tailor the scope to your preferences, and our deep cleaning service is available when your home needs a more intensive clean." },
      { "q": "How often should I schedule house cleaning?", "a": "It depends on your household. We offer weekly, bi-weekly, monthly and one-time cleaning; most residential clients choose bi-weekly." }
    ],
    "related": ["deep-cleaning", "condo-apartment-cleaning", "move-in-move-out-cleaning", "window-cleaning"]
  },
  {
    "slug": "commercial-cleaning",
    "name": "Commercial Cleaning",
    "icon": "building",
    "category": "commercial",
    "featured": true,
    "metaTitle": "Commercial Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Office & commercial cleaning in Hartford County, CT for offices, medical offices and retail. Insured & bonded. Free estimate: (860) 796-5222.",
    "h1": "Commercial & Office Cleaning in Hartford County, CT",
    "summary": "Reliable office and business cleaning on a weekly, bi-weekly or monthly schedule for offices, medical offices, retail spaces and more.",
    "intro": [
      "A clean workplace tells clients and employees that details matter. Renata's Cleaning Service provides commercial cleaning for offices, medical offices, retail spaces and other commercial properties throughout Hartford County, with the same meticulous standard that has built our reputation over 25+ years.",
      "We work around your business with weekly, bi-weekly or monthly office cleaning schedules, and we're fully insured and bonded for your peace of mind."
    ],
    "included": [
      "Dusting desks, shelves and surfaces",
      "Vacuuming carpets and mopping hard floors",
      "Restroom cleaning",
      "Break rooms and kitchenettes wiped down",
      "Reception and common areas kept presentable",
      "Window and carpet cleaning available as additional services"
    ],
    "idealFor": [
      "Professional and corporate offices",
      "Medical offices",
      "Retail stores and showrooms",
      "Other commercial properties in Hartford County"
    ],
    "scheduling": "Weekly, bi-weekly or monthly schedules tailored to your business.",
    "faqs": [
      { "q": "What types of businesses do you clean?", "a": "We clean offices, medical offices, retail spaces and other commercial properties throughout Hartford County, CT." },
      { "q": "Are you insured and bonded for commercial work?", "a": "Yes. Renata's Cleaning Service is fully insured and bonded, so your business is protected while our team is working." },
      { "q": "How do I get a commercial cleaning estimate?", "a": "Call or text (860) 796-5222 or email Renata@renatascleaning.com. We'll discuss your space and schedule and provide a free, no-obligation estimate." }
    ],
    "related": ["window-cleaning", "carpet-cleaning", "post-construction-cleaning", "deep-cleaning"]
  },
  {
    "slug": "deep-cleaning",
    "name": "Deep Cleaning",
    "icon": "sparkle",
    "category": "residential",
    "metaTitle": "Deep Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Deep cleaning for homes and offices in Hartford County, CT that reaches every corner. 25+ years, insured & bonded. Free quote: (860) 796-5222.",
    "h1": "Deep Cleaning Services in Hartford County, CT",
    "summary": "A top-to-bottom clean that reaches the corners regular cleaning doesn't, ideal for seasonal resets and fresh starts.",
    "intro": [
      "Deep cleaning is our most comprehensive service: a detailed clean that reaches every corner of your home or office. It's the right choice for seasonal cleaning, before or after a move, or whenever your space needs that extra touch of perfection.",
      "Many clients start with a deep clean and then keep things fresh with recurring house cleaning."
    ],
    "included": [
      "Everything in our standard house cleaning",
      "Detailed dusting of hard-to-reach surfaces",
      "Extra attention to corners, edges and buildup",
      "Kitchen and bathroom detail work",
      "Focus on the areas that matter most to you"
    ],
    "idealFor": [
      "Seasonal and spring cleaning",
      "Getting ready for guests or the holidays",
      "A first clean before starting recurring service",
      "Homes and offices that need a reset"
    ],
    "scheduling": "Booked as a one-time service, or as the first visit before a recurring schedule.",
    "faqs": [
      { "q": "What's the difference between deep cleaning and regular house cleaning?", "a": "Regular house cleaning maintains your home on a schedule. Deep cleaning is more intensive and detailed, reaching corners and areas that routine visits don't cover every time." },
      { "q": "Do you offer deep cleaning for offices?", "a": "Yes. Deep cleaning is available for both homes and commercial spaces in Hartford County." }
    ],
    "related": ["house-cleaning", "move-in-move-out-cleaning", "post-construction-cleaning", "carpet-cleaning"]
  },
  {
    "slug": "move-in-move-out-cleaning",
    "name": "Move-In / Move-Out Cleaning",
    "icon": "box",
    "category": "residential",
    "metaTitle": "Move-In/Move-Out Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Move-in & move-out cleaning in Hartford County, CT. Every surface cleaned and ready for the next chapter. Free quote: (860) 796-5222.",
    "h1": "Move-In & Move-Out Cleaning in Hartford County, CT",
    "summary": "Leave your old place spotless or start fresh in your new one, with every surface cleaned and ready.",
    "intro": [
      "Moving is stressful enough. Whether you're handing over the keys or unpacking in a new home, our move-in and move-out cleaning makes sure every surface is thoroughly cleaned and ready for the next chapter.",
      "Empty rooms are the best time for a truly thorough clean, and our team treats every space as if it were our own."
    ],
    "included": [
      "Dusting and wiping surfaces throughout empty rooms",
      "Kitchen cleaning, including surfaces and appliances",
      "Full bathroom cleaning",
      "Vacuuming and mopping all floors",
      "Closets, shelves and cabinets wiped out",
      "Window and carpet cleaning available as additional services"
    ],
    "idealFor": [
      "Homeowners selling or buying",
      "Renters moving out of an apartment or condo",
      "Landlords and property managers between tenants",
      "Anyone who wants a fresh start in a new home"
    ],
    "scheduling": "One-time service, scheduled around your moving date.",
    "faqs": [
      { "q": "Do you clean apartments and condos for move-outs?", "a": "Yes. We provide move-in and move-out cleaning for houses, condos and apartments throughout Hartford County." },
      { "q": "When should I schedule a move-out clean?", "a": "Ideally after your belongings are moved out, when every surface is accessible. Call or text us with your moving date and we'll find a time that works." }
    ],
    "related": ["deep-cleaning", "condo-apartment-cleaning", "carpet-cleaning", "window-cleaning"]
  },
  {
    "slug": "condo-apartment-cleaning",
    "name": "Condo & Apartment Cleaning",
    "icon": "apartment",
    "category": "residential",
    "metaTitle": "Condo & Apartment Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Condo & apartment cleaning in Hartford County, CT with flexible monthly or custom schedules. Insured & bonded. Free quote: (860) 796-5222.",
    "h1": "Condo & Apartment Cleaning in Hartford County, CT",
    "summary": "Specialized cleaning for condos and apartments, with flexible monthly or custom schedules.",
    "intro": [
      "Condos and apartments deserve the same meticulous care as any home. We provide specialized cleaning for condos and apartments across Hartford County with flexible monthly or custom schedules.",
      "After a thorough cleaning, our team puts things back in an organized way, so your space feels calm, not just clean."
    ],
    "included": [
      "Vacuuming and mopping",
      "Dusting, with objects moved rather than dusted around",
      "Kitchen surfaces and appliances wiped down",
      "Full bathroom cleaning",
      "Tidying and organizing as we go"
    ],
    "idealFor": [
      "Busy professionals",
      "Condo owners and renters",
      "Anyone who wants a clean home without giving up their weekends"
    ],
    "scheduling": "Monthly, bi-weekly, weekly or a custom schedule.",
    "faqs": [
      { "q": "Can I set a custom cleaning schedule?", "a": "Yes. We offer flexible monthly or custom schedules for condos and apartments, and you can call or text to reschedule when life happens." },
      { "q": "Do you bring your own supplies?", "a": "Yes. We bring professional-grade supplies and equipment, and we're happy to use your preferred products on request." }
    ],
    "related": ["house-cleaning", "move-in-move-out-cleaning", "deep-cleaning", "window-cleaning"]
  },
  {
    "slug": "window-cleaning",
    "name": "Window Cleaning",
    "icon": "window",
    "category": "specialty",
    "metaTitle": "Window Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Window cleaning inside and out for homes and businesses in Hartford County, CT. 25+ years, insured & bonded. Free quote: (860) 796-5222.",
    "h1": "Window Cleaning in Hartford County, CT",
    "summary": "Crystal-clear windows inside and out for homes and businesses.",
    "intro": [
      "Let the natural light shine through. Our professional window cleaning leaves windows crystal-clear inside and out for residential and commercial properties across Hartford County.",
      "Window cleaning pairs naturally with a deep clean, a move-in or move-out clean, or regular commercial cleaning."
    ],
    "included": [
      "Interior window cleaning",
      "Exterior window cleaning",
      "Sills and frames wiped down",
      "Residential and commercial properties"
    ],
    "idealFor": [
      "Homes that want more natural light",
      "Storefronts and offices that want a great first impression",
      "Seasonal cleaning",
      "Move-in and move-out cleans"
    ],
    "scheduling": null,
    "faqs": [
      { "q": "Do you clean windows inside and out?", "a": "Yes. We offer interior and exterior window cleaning for residential and commercial properties." },
      { "q": "Can window cleaning be added to another service?", "a": "Yes. Window cleaning pairs well with deep cleaning, move-in/move-out cleaning and commercial cleaning. Just mention it when you request your free quote." }
    ],
    "related": ["deep-cleaning", "commercial-cleaning", "house-cleaning", "move-in-move-out-cleaning"]
  },
  {
    "slug": "carpet-cleaning",
    "name": "Carpet Cleaning",
    "icon": "carpet",
    "category": "specialty",
    "metaTitle": "Carpet Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Carpet cleaning in Hartford County, CT that lifts deep-set dirt, stains and allergens. Insured & bonded. Free quote: (860) 796-5222.",
    "h1": "Carpet Cleaning in Hartford County, CT",
    "summary": "Refresh your carpets by removing deep-set dirt, stains and allergens.",
    "intro": [
      "Carpets hold on to more than you can see. Our carpet cleaning removes deep-set dirt, stains and allergens to refresh and revitalize your floors and restore them to their best.",
      "We clean carpets in homes and commercial spaces throughout Hartford County."
    ],
    "included": [
      "Removal of deep-set dirt",
      "Stain treatment",
      "Allergen reduction",
      "Residential and commercial carpets"
    ],
    "idealFor": [
      "High-traffic rooms and hallways",
      "Homes with kids or pets",
      "Offices with carpeted floors",
      "Move-in and move-out cleans"
    ],
    "scheduling": null,
    "faqs": [
      { "q": "Can carpet cleaning remove stains?", "a": "Our carpet cleaning targets deep-set dirt, stains and allergens. Results depend on the type and age of the stain, so ask us about yours when you request a quote." },
      { "q": "Do you clean carpets in offices?", "a": "Yes. Carpet cleaning is available for both homes and commercial spaces in Hartford County." }
    ],
    "related": ["deep-cleaning", "house-cleaning", "commercial-cleaning", "move-in-move-out-cleaning"]
  },
  {
    "slug": "post-construction-cleaning",
    "name": "Post-Construction Cleaning",
    "icon": "hammer",
    "category": "specialty",
    "metaTitle": "Post-Construction Cleaning in Hartford County, CT | Renata's",
    "metaDescription": "Post-construction cleaning in Hartford County, CT. We clear the dust and mess after your renovation. Insured & bonded. Call (860) 796-5222.",
    "h1": "Post-Construction Cleaning in Hartford County, CT",
    "summary": "Heavy-duty cleanup after renovation or construction, so you can enjoy your new space.",
    "intro": [
      "Renovation complete? We handle the heavy-duty cleanup so you can enjoy your newly transformed space without the dust, debris and construction mess.",
      "Construction dust settles everywhere, which is exactly where our attention to detail pays off."
    ],
    "included": [
      "Construction dust removed from surfaces",
      "Leftover light debris cleared",
      "Fixtures, cabinets and trim wiped down",
      "Kitchens and bathrooms cleaned after remodels",
      "Vacuuming and mopping all floors"
    ],
    "idealFor": [
      "Kitchen and bathroom remodels",
      "Home additions and renovations",
      "Commercial build-outs",
      "Contractors handing over a finished project"
    ],
    "scheduling": null,
    "faqs": [
      { "q": "When should post-construction cleaning be scheduled?", "a": "After the construction work is finished. Call or text us with your project timeline and we'll plan the cleanup around it." },
      { "q": "Do you clean after commercial renovations?", "a": "Yes. Post-construction cleaning is available for residential and commercial properties in Hartford County." }
    ],
    "related": ["deep-cleaning", "window-cleaning", "carpet-cleaning", "commercial-cleaning"]
  }
]
```

```json file=src/_data/towns.json
[
  { "slug": "hartford", "name": "Hartford", "note": "Homes, condos, apartments and downtown offices in Connecticut's capital city." },
  { "slug": "west-hartford", "name": "West Hartford", "note": "Homes and businesses across West Hartford, from West Hartford Center to Blue Back Square." },
  { "slug": "farmington", "name": "Farmington", "note": "Homes, condos and offices in Farmington and Unionville." },
  { "slug": "avon", "name": "Avon", "note": "House cleaning and office cleaning throughout Avon." },
  { "slug": "simsbury", "name": "Simsbury", "note": "Homes and businesses in Simsbury, Weatogue and West Simsbury." },
  { "slug": "canton", "name": "Canton", "note": "Homes and businesses in Canton and Collinsville." },
  { "slug": "bristol", "name": "Bristol", "note": "House cleaning and commercial cleaning across Bristol." },
  { "slug": "new-britain", "name": "New Britain", "note": "Homes, apartments and offices throughout New Britain." },
  { "slug": "glastonbury", "name": "Glastonbury", "note": "Homes and businesses in Glastonbury and South Glastonbury." },
  { "slug": "manchester", "name": "Manchester", "note": "House cleaning and office cleaning throughout Manchester." },
  { "slug": "wethersfield", "name": "Wethersfield", "note": "Homes and businesses in Wethersfield, including Old Wethersfield." },
  { "slug": "rocky-hill", "name": "Rocky Hill", "note": "Homes, condos and offices in Rocky Hill." }
]
```

```json file=src/_data/faqs.json
[
  { "id": "supplies", "q": "Do you bring your own cleaning supplies?", "a": "Yes! We bring all of our own professional-grade cleaning supplies and equipment. If you have specific products you prefer us to use, just let us know and we'll be happy to accommodate your preferences." },
  { "id": "insured", "featured": true, "q": "Are you insured and bonded?", "a": "Absolutely! Renata's Cleaning Service is fully insured and bonded for your peace of mind. You can trust that your home or business is protected when our team is working." },
  { "id": "reschedule", "q": "What if I need to reschedule?", "a": "No problem at all! We understand that life happens. Just give us a call or send a text as soon as you know you need to reschedule, and we'll work with you to find a new time that fits your schedule." },
  { "id": "quote", "q": "How do I get a free cleaning quote?", "a": "Getting a quote is easy! Give us a call at (860) 796-5222 or send us an email at Renata@renatascleaning.com. We'll discuss your home or business needs and provide a free, no-obligation estimate. You can also text us for a quick response!" },
  { "id": "areas", "q": "What areas do you serve?", "a": "We proudly serve Hartford County and the surrounding areas in Connecticut. This includes Hartford, West Hartford, Farmington, Avon, Simsbury, Canton, Bristol, New Britain, Glastonbury, Manchester, Wethersfield, Rocky Hill, and many other nearby communities. Not sure if we serve your area? Just ask!" },
  { "id": "frequency", "featured": true, "q": "How often should I schedule home cleaning?", "a": "It depends on your needs! We offer weekly, bi-weekly, monthly, and one-time cleaning options. Most of our residential clients prefer bi-weekly house cleaning, but we're happy to customize a schedule that works best for your lifestyle and budget." },
  { "id": "included", "featured": true, "q": "What does your house cleaning service include?", "a": "Our standard house cleaning includes vacuuming all floors and carpets, mopping hard floors, thorough dusting of all surfaces (we move objects, not dust around them), full bathroom cleaning, wiping down kitchen surfaces and appliances, and general tidying. We can customize the scope based on your preferences. Ask about our deep cleaning option for a more intensive clean." },
  { "id": "commercial", "q": "Do you offer commercial office cleaning services?", "a": "Yes! We provide professional commercial cleaning for offices, businesses, medical offices, retail spaces, and other commercial properties throughout Hartford County, CT. We offer weekly, bi-weekly, and monthly office cleaning schedules tailored to your business. Contact us at (860) 796-5222 for a free commercial cleaning estimate." }
]
```

```json file=src/_data/reviews.json
{
  "ratingValue": "4.6",
  "reviewCount": 11,
  "platform": "Google",
  "testimonials": [
    { "author": "Donald McMenemy", "rating": 5, "text": "Renata and her team are the best! They move objects to dust surfaces, they're not dusting around them! They put things back in an organized way. I really appreciate their attention to detail and complete cleaning. They arrive on time and are responsive to my requests." },
    { "author": "Karin Hunt", "rating": 5, "text": "I have been using Renata's Cleaning Service for about 10 years. Both she and her girls do an incredible job for me and I wouldn't use anyone else." },
    { "author": "Mark DeBisschop", "rating": 5, "text": "We are very satisfied with Renata's cleaning. Her work is consistently good. She has been with us for several years and is very reliable and flexible to work around scheduling changes. I highly recommend her service." }
  ]
}
```

```json file=src/_data/brand.json
{
  "colors": [
    { "token": "crimson", "name": "Renata Crimson", "hex": "#C41E3A", "rgb": "196, 30, 58", "cmyk": "0, 85, 70, 23", "role": "Primary brand color, calls to action, logo petals" },
    { "token": "garnet", "name": "Garnet", "hex": "#8B1A2F", "rgb": "139, 26, 47", "cmyk": "0, 81, 66, 45", "role": "Hover states, dark sections, footer, logo diagonal petals" },
    { "token": "blush", "name": "Blush", "hex": "#F7E6E4", "rgb": "247, 230, 228", "cmyk": "0, 7, 8, 3", "role": "Tinted cards and highlights" },
    { "token": "magnolia", "name": "Magnolia", "hex": "#FFFEF9", "rgb": "255, 254, 249", "cmyk": "0, 0, 2, 0", "role": "Page background, reversed logo" },
    { "token": "linen", "name": "Linen", "hex": "#F8F5F0", "rgb": "248, 245, 240", "cmyk": "0, 1, 3, 3", "role": "Alternate section background" },
    { "token": "ink", "name": "Ink", "hex": "#2B2527", "rgb": "43, 37, 39", "cmyk": "0, 14, 9, 83", "role": "Body text and headings" },
    { "token": "stone", "name": "Stone", "hex": "#6B6360", "rgb": "107, 99, 96", "cmyk": "0, 7, 10, 58", "role": "Secondary text" },
    { "token": "pollen", "name": "Pollen Gold", "hex": "#E3A935", "rgb": "227, 169, 53", "cmyk": "0, 26, 77, 11", "role": "Flower center, stars, accents (graphics and large text only)" }
  ]
}
```

- [ ] **Step 10: Run data tests**

Run: `node --test tests/data.test.mjs`
Expected: PASS.

- [ ] **Step 11: Write the failing build smoke test**

```js file=tests/build.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { siteFileExists } from "./helpers/site.mjs";

test("the build produces a home page", () => {
  assert.ok(siteFileExists("index.html"), "run `npm run build` first");
});
```

Run: `node --test tests/build.test.mjs`
Expected: FAIL — `the build produces a home page`.

- [ ] **Step 12: Eleventy config + smoke page**

```js file=eleventy.config.js
import {
  jsonLd, absoluteUrl, isoDate, createAssetUrl, serviceBySlug, whereCategory, sitemapPages,
} from "./src/_lib/filters.js";

const INPUT_DIR = "src";
const ROOT_PASSTHROUGH = [
  "src/*.{svg,png,ico,webmanifest,txt}",
  "src/_headers",
];

export default function (eleventyConfig) {
  const { assetUrl, reset } = createAssetUrl(INPUT_DIR);
  eleventyConfig.on("eleventy.before", reset);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  ROOT_PASSTHROUGH.forEach((glob) => eleventyConfig.addPassthroughCopy(glob));

  eleventyConfig.addFilter("assetUrl", assetUrl);
  eleventyConfig.addFilter("jsonLd", jsonLd);
  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("serviceBySlug", serviceBySlug);
  eleventyConfig.addFilter("whereCategory", whereCategory);
  eleventyConfig.addFilter("sitemapPages", sitemapPages);

  eleventyConfig.addGlobalData("buildDate", () => new Date());
}

export const config = {
  dir: { input: INPUT_DIR, includes: "_includes", data: "_data", output: "_site" },
  templateFormats: ["njk"],
  htmlTemplateEngine: "njk",
};
```

```njk file=src/index.njk
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>{{ site.name }}</title></head>
<body><h1>{{ site.name }}</h1></body>
</html>
```

- [ ] **Step 13: Build and run all tests**

Run: `npm run check`
Expected: Eleventy writes `_site/index.html`; all tests PASS.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json .nvmrc .gitignore eleventy.config.js src tests
git commit -m "feat: scaffold Eleventy build, site data, filters and test harness"
```

---
### Task 2: Logo and brand assets

**Files:**
- Create: `scripts/brand/fetch-fonts.mjs`, `scripts/brand/geometry.mjs`, `scripts/brand/text.mjs`, `scripts/brand/build-brand.mjs`
- Create (downloaded): `scripts/brand/fonts/CormorantGaramond-SemiBold.ttf`, `Jost-Medium.ttf`, `Jost-Regular.ttf`, `OFL-CormorantGaramond.txt`, `OFL-Jost.txt`
- Create (generated): `src/assets/brand/*.svg|png`, `src/favicon.svg`, `src/favicon-32.png`, `src/apple-touch-icon.png`, `src/icon-192.png`, `src/icon-512.png`, `src/og-image.png`, `src/_includes/partials/logo-mark.njk`
- Test: `tests/brand-geometry.test.mjs`, `tests/brand-assets.test.mjs`

**Interfaces:**
- Consumes: `src/_data/brand.json` colors (Task 1); `pngSize`, `siteFile`, `siteFileExists`, `readSiteFile` (Task 1 helpers)
- Produces:
  - `MARK_BOUNDS = { min: 14, size: 172 }` — the mark occupies `[14, 186]` on a 200×200 grid
  - `petalPath({ r0, r1, w }): string` — one upward petal as SVG path data
  - `markElements({ holes = true, paint }): string` — `paint(part: "main"|"diag"|"center") → attribute string`
  - `placedMark({ x, y, size, holes, paint }): string`
  - `loadFont(path)`, `textShape(font, text, { size, tracking }) → { d, box, width, height }`, `trackedToWidth(font, text, size, width)`
  - Nunjucks macro `logoMark(extraClass = "")` in `partials/logo-mark.njk` → `<svg class="logo-mark …" aria-hidden="true">` whose paths carry classes `lm-main`, `lm-diag`, `lm-center`
  - Brand files named `renatas-{mark|logo-horizontal|logo-stacked}-{color|reversed|ink|white}.svg`, PNGs `renatas-{mark|logo-horizontal}-{color|reversed}-{512|1024}.png`

- [ ] **Step 1: Write the failing geometry unit tests**

```js file=tests/brand-geometry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MARK_BOUNDS, petalPath, markElements, placedMark } from "../scripts/brand/geometry.mjs";

test("mark bounds describe a centered 172-unit square", () => {
  assert.deepEqual(MARK_BOUNDS, { min: 14, size: 172 });
});

test("petalPath is a closed path from base to tip and back", () => {
  const d = petalPath({ r0: 17, r1: 86, w: 21 });
  assert.match(d, /^M100 83C/);
  assert.match(d, /100 14C/);
  assert.match(d, /Z$/);
});

test("markElements draws 4 diagonal + 4 main petals and a center", () => {
  const parts = [];
  const svg = markElements({ paint: (part) => { parts.push(part); return `class="lm-${part}"`; } });
  assert.equal((svg.match(/<path /g) || []).length, 8);
  assert.equal((svg.match(/<circle /g) || []).length, 1);
  assert.deepEqual([...new Set(parts)].sort(), ["center", "diag", "main"]);
});

test("holes use even-odd fill on main petals only; small variant has none", () => {
  const withHoles = markElements({ paint: () => "" });
  assert.equal((withHoles.match(/fill-rule="evenodd"/g) || []).length, 4);
  const small = markElements({ holes: false, paint: () => "" });
  assert.doesNotMatch(small, /evenodd/);
});

test("placedMark scales the 172-unit mark to the requested size", () => {
  assert.match(placedMark({ x: 10, y: 20, size: 86, paint: () => "" }), /translate\(10 20\) scale\(0\.5\) translate\(-14 -14\)/);
});
```

Run: `node --test tests/brand-geometry.test.mjs`
Expected: FAIL — cannot find `scripts/brand/geometry.mjs`.

- [ ] **Step 2: Implement the geometry**

```js file=scripts/brand/geometry.mjs
// Flower mark geometry on a 200×200 grid centered at (100, 100).
// Four main petals (0/90/180/270°), four shorter diagonal petals (45/135/225/315°),
// optional even-odd "vein" cut-outs in the main petals, and a round center.

export const CENTER = 100;
export const MARK_BOUNDS = Object.freeze({ min: 14, size: 172 });

const PETALS = Object.freeze({
  main: { r0: 17, r1: 86, w: 21 },
  diag: { r0: 19, r1: 67, w: 15 },
  vein: { r0: 31, r1: 70, w: 7.5 },
});
const CENTER_RADIUS = 11;
const MAIN_ANGLES = [0, 90, 180, 270];
const DIAG_ANGLES = [45, 135, 225, 315];

const round = (n) => Math.round(n * 100) / 100;
const point = ([x, y]) => `${round(x)} ${round(y)}`;
const mirror = ([x, y]) => [2 * CENTER - x, y];

export function petalPath({ r0, r1, w }) {
  const len = r1 - r0;
  const base = [CENTER, CENTER - r0];
  const tip = [CENTER, CENTER - r1];
  const wideY = CENTER - (r0 + len * 0.55);
  const c1 = [CENTER - w * 0.35, base[1] - len * 0.08];
  const c2 = [CENTER - w, wideY + len * 0.22];
  const side = [CENTER - w, wideY];
  const c3 = [CENTER - w, wideY - len * 0.26];
  const c4 = [CENTER - w * 0.56, tip[1]];
  return [
    `M${point(base)}`,
    `C${point(c1)} ${point(c2)} ${point(side)}`,
    `C${point(c3)} ${point(c4)} ${point(tip)}`,
    `C${point(mirror(c4))} ${point(mirror(c3))} ${point(mirror(side))}`,
    `C${point(mirror(c2))} ${point(mirror(c1))} ${point(base)}Z`,
  ].join("");
}

export function markElements({ holes = true, paint }) {
  const mainD = petalPath(PETALS.main) + (holes ? petalPath(PETALS.vein) : "");
  const diagD = petalPath(PETALS.diag);
  const rotated = (deg, d, part, extra = "") =>
    `<path ${paint(part)}${extra} transform="rotate(${deg} ${CENTER} ${CENTER})" d="${d}"/>`;
  return [
    ...DIAG_ANGLES.map((deg) => rotated(deg, diagD, "diag")),
    ...MAIN_ANGLES.map((deg) => rotated(deg, mainD, "main", holes ? ' fill-rule="evenodd"' : "")),
    `<circle ${paint("center")} cx="${CENTER}" cy="${CENTER}" r="${CENTER_RADIUS}"/>`,
  ].join("");
}

export function placedMark({ x, y, size, holes = true, paint }) {
  const scale = Number((size / MARK_BOUNDS.size).toFixed(4));
  const offset = -MARK_BOUNDS.min;
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${scale}) translate(${offset} ${offset})">${markElements({ holes, paint })}</g>`;
}
```

Run: `node --test tests/brand-geometry.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 3: Fetch the fonts (OFL-licensed, committed for reproducible logo builds)**

```js file=scripts/brand/fetch-fonts.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const FONT_DIR = path.join(import.meta.dirname, "fonts");
const CSS_API = "https://fonts.googleapis.com/css2";
// A non-browser user agent makes the Google Fonts CSS API answer with plain TrueType files.
const TTF_USER_AGENT = "curl/8.7.1";

const FONTS = [
  { family: "Cormorant Garamond", weight: 600, file: "CormorantGaramond-SemiBold.ttf" },
  { family: "Jost", weight: 500, file: "Jost-Medium.ttf" },
  { family: "Jost", weight: 400, file: "Jost-Regular.ttf" },
];
const LICENSES = [
  { url: "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt", file: "OFL-CormorantGaramond.txt" },
  { url: "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/OFL.txt", file: "OFL-Jost.txt" },
];

async function fetchOk(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} failed with HTTP ${res.status}`);
  return res;
}

async function ttfUrl({ family, weight }) {
  const query = `family=${family.replace(/ /g, "+")}:wght@${weight}`;
  const res = await fetchOk(`${CSS_API}?${query}`, { headers: { "User-Agent": TTF_USER_AGENT } });
  const css = await res.text();
  const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) throw new Error(`No TrueType URL for ${family} ${weight}. Response:\n${css}`);
  return match[1];
}

async function download(url, file) {
  const buf = Buffer.from(await (await fetchOk(url)).arrayBuffer());
  writeFileSync(path.join(FONT_DIR, file), buf);
  console.log(`saved ${file} (${buf.length} bytes)`);
}

mkdirSync(FONT_DIR, { recursive: true });
for (const font of FONTS) await download(await ttfUrl(font), font.file);
for (const license of LICENSES) await download(license.url, license.file);
```

Run: `npm run brand:fonts`
Expected: five `saved …` lines; files exist in `scripts/brand/fonts/`.

- [ ] **Step 4: Text outlining helpers**

```js file=scripts/brand/text.mjs
import { readFileSync } from "node:fs";
import opentype from "opentype.js";

export function loadFont(filePath) {
  const buf = readFileSync(filePath);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function unionBox(boxes) {
  const finite = boxes.filter((b) => Number.isFinite(b.x1) && b.x2 > b.x1);
  return {
    x1: Math.min(...finite.map((b) => b.x1)),
    y1: Math.min(...finite.map((b) => b.y1)),
    x2: Math.max(...finite.map((b) => b.x2)),
    y2: Math.max(...finite.map((b) => b.y2)),
  };
}

// Lays out `text` on a baseline at y = 0 with kerning and optional tracking (in em).
export function textShape(font, text, { size, tracking = 0 }) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  let x = 0;
  const paths = glyphs.map((glyph, i) => {
    const path = glyph.getPath(x, 0, size);
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(glyph, next) : 0;
    x += (glyph.advanceWidth + kern) * scale + (next ? tracking * size : 0);
    return path;
  });
  const box = unionBox(paths.map((p) => p.getBoundingBox()));
  return {
    d: paths.map((p) => p.toPathData(2)).join(""),
    box,
    width: box.x2 - box.x1,
    height: box.y2 - box.y1,
  };
}

// Tracks `text` so its ink width equals `targetWidth`.
export function trackedToWidth(font, text, size, targetWidth) {
  const untracked = textShape(font, text, { size });
  const gaps = [...text].length - 1;
  const tracking = (targetWidth - untracked.width) / (gaps * size);
  return textShape(font, text, { size, tracking });
}
```

- [ ] **Step 5: Write the failing brand-asset tests**

```js file=tests/brand-assets.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteFile, siteFileExists, readSiteFile, pngSize } from "./helpers/site.mjs";

const VERSIONS = ["color", "reversed", "ink", "white"];
const LOCKUPS = ["mark", "logo-horizontal", "logo-stacked"];
const SVGS = VERSIONS.flatMap((v) => LOCKUPS.map((l) => `assets/brand/renatas-${l}-${v}.svg`));

for (const rel of [...SVGS, "favicon.svg"]) {
  test(`${rel} is a clean vector file`, () => {
    assert.ok(siteFileExists(rel), `${rel} missing`);
    const svg = readSiteFile(rel);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.doesNotMatch(svg, /<text\b/, "text must be outlined");
    assert.doesNotMatch(svg, /Gradient/, "no gradients");
  });
}

const PNGS = [
  ...["color", "reversed"].flatMap((v) => [512, 1024].flatMap((w) => [
    [`assets/brand/renatas-mark-${v}-${w}.png`, w, w],
    [`assets/brand/renatas-logo-horizontal-${v}-${w}.png`, w, null],
  ])),
  ["favicon-32.png", 32, 32],
  ["apple-touch-icon.png", 180, 180],
  ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512],
  ["og-image.png", 1200, 630],
];

for (const [rel, width, height] of PNGS) {
  test(`${rel} is ${width}${height ? `x${height}` : " wide"}`, () => {
    assert.ok(siteFileExists(rel), `${rel} missing`);
    const size = pngSize(siteFile(rel));
    assert.equal(size.width, width);
    if (height) assert.equal(size.height, height);
  });
}

test("inline logo macro is generated with themeable classes", () => {
  const macro = readFileSync("src/_includes/partials/logo-mark.njk", "utf8");
  assert.match(macro, /\{% macro logoMark\(/);
  ["main", "diag", "center"].forEach((part) => assert.ok(macro.includes(`class="lm-${part}"`), part));
  assert.match(macro, /aria-hidden="true"/);
});
```

Run: `npm run build && node --test tests/brand-assets.test.mjs`
Expected: FAIL — `assets/brand/renatas-mark-color.svg missing` (and the rest).

- [ ] **Step 6: Implement the asset builder**

```js file=scripts/brand/build-brand.mjs
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { MARK_BOUNDS, markElements, placedMark } from "./geometry.mjs";
import { loadFont, textShape, trackedToWidth } from "./text.mjs";

const HERE = import.meta.dirname;
const SRC = path.resolve(HERE, "../../src");
const FONT_DIR = path.join(HERE, "fonts");

const brand = JSON.parse(readFileSync(path.join(SRC, "_data/brand.json"), "utf8"));
const C = Object.freeze(Object.fromEntries(brand.colors.map((c) => [c.token, c.hex])));
const WHITE = "#FFFFFF";

const NAME = "Renata’s";
const SUB = "CLEANING SERVICE";
const FULL_NAME = "Renata’s Cleaning Service";

const VERSIONS = Object.freeze({
  color: { main: C.crimson, diag: C.garnet, center: C.pollen, name: C.crimson, sub: C.ink },
  reversed: { main: C.magnolia, diag: C.blush, center: C.pollen, name: C.magnolia, sub: C.magnolia },
  ink: { main: C.ink, diag: C.ink, center: C.ink, name: C.ink, sub: C.ink },
  white: { main: WHITE, diag: WHITE, center: WHITE, name: WHITE, sub: WHITE },
});

const LAYOUT = Object.freeze({
  nameSize: 118, subSize: 25, subGap: 20, horizontalGap: 36, stackedGap: 30,
});

const fonts = {
  display: loadFont(path.join(FONT_DIR, "CormorantGaramond-SemiBold.ttf")),
  medium: loadFont(path.join(FONT_DIR, "Jost-Medium.ttf")),
  regular: loadFont(path.join(FONT_DIR, "Jost-Regular.ttf")),
};

const round = (n) => Math.round(n * 100) / 100;
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const fillPaint = (palette) => (part) => `fill="${palette[part]}"`;

function svgDoc(width, height, body, label) {
  const w = round(width);
  const h = round(height);
  const safe = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${safe}"><title>${safe}</title>${body}</svg>\n`;
}

// Places a text shape so the top-left of its ink box lands at (x, y).
function placedText(shape, x, y, fill) {
  return `<path fill="${fill}" transform="translate(${round(x - shape.box.x1)} ${round(y - shape.box.y1)})" d="${shape.d}"/>`;
}

function wordmark() {
  const name = textShape(fonts.display, NAME, { size: LAYOUT.nameSize });
  const sub = trackedToWidth(fonts.medium, SUB, LAYOUT.subSize, name.width);
  return {
    name,
    sub,
    width: Math.max(name.width, sub.width),
    height: name.height + LAYOUT.subGap + sub.height,
  };
}

function markSvg(palette) {
  const s = MARK_BOUNDS.size;
  return svgDoc(s, s, placedMark({ x: 0, y: 0, size: s, paint: fillPaint(palette) }), FULL_NAME);
}

function horizontalSvg(palette) {
  const wm = wordmark();
  const markSize = MARK_BOUNDS.size;
  const top = (markSize - wm.height) / 2;
  const textX = markSize + LAYOUT.horizontalGap;
  const body = [
    placedMark({ x: 0, y: 0, size: markSize, paint: fillPaint(palette) }),
    placedText(wm.name, textX, top, palette.name),
    placedText(wm.sub, textX, top + wm.name.height + LAYOUT.subGap, palette.sub),
  ].join("");
  return svgDoc(textX + wm.width, markSize, body, FULL_NAME);
}

function stackedSvg(palette) {
  const wm = wordmark();
  const markSize = MARK_BOUNDS.size;
  const width = Math.max(markSize, wm.width);
  const nameY = markSize + LAYOUT.stackedGap;
  const body = [
    placedMark({ x: (width - markSize) / 2, y: 0, size: markSize, paint: fillPaint(palette) }),
    placedText(wm.name, (width - wm.name.width) / 2, nameY, palette.name),
    placedText(wm.sub, (width - wm.sub.width) / 2, nameY + wm.name.height + LAYOUT.subGap, palette.sub),
  ].join("");
  return svgDoc(width, nameY + wm.height, body, FULL_NAME);
}

function appIconSvg({ size, radius, markRatio }) {
  const markSize = size * markRatio;
  const inset = (size - markSize) / 2;
  const body = `<rect width="${size}" height="${size}" rx="${radius}" fill="${C.crimson}"/>`
    + placedMark({ x: inset, y: inset, size: markSize, holes: false, paint: fillPaint(VERSIONS.reversed) });
  return svgDoc(size, size, body, FULL_NAME);
}

function ogImageSvg() {
  const W = 1200;
  const H = 630;
  const PAD = 80;
  const maxWidth = W - PAD * 2;
  const fit = (font, text, size) => {
    const shape = textShape(font, text, { size });
    return shape.width <= maxWidth ? shape : textShape(font, text, { size: (size * maxWidth) / shape.width });
  };
  const title = fit(fonts.display, FULL_NAME, 84);
  const line2 = fit(fonts.regular, "House & office cleaning in Hartford County, CT", 38);
  const line3 = fit(fonts.regular, "25+ years  ·  Family-owned  ·  Insured & bonded", 28);
  const phone = textShape(fonts.medium, "(860) 796-5222", { size: 46 });
  const markSize = 104;
  const titleY = PAD + markSize + 44;
  const ruleY = titleY + title.height + 30;
  const line2Y = ruleY + 36;
  const line3Y = line2Y + line2.height + 22;
  const phoneY = H - PAD - phone.height;
  const body = [
    `<rect width="${W}" height="${H}" fill="${C.garnet}"/>`,
    `<g opacity="0.09">${placedMark({ x: W - 440, y: (H - 620) / 2, size: 620, paint: () => `fill="${C.magnolia}"` })}</g>`,
    placedMark({ x: PAD, y: PAD, size: markSize, paint: fillPaint(VERSIONS.reversed) }),
    placedText(title, PAD, titleY, C.magnolia),
    `<rect x="${PAD}" y="${round(ruleY)}" width="96" height="3" fill="${C.pollen}"/>`,
    placedText(line2, PAD, line2Y, C.blush),
    placedText(line3, PAD, line3Y, C.magnolia),
    placedText(phone, PAD, phoneY, C.pollen),
  ].join("");
  return svgDoc(W, H, body, `${FULL_NAME}: house & office cleaning in Hartford County, CT`);
}

function logoMacro() {
  const paint = (part) => `class="lm-${part}" fill="${VERSIONS.color[part]}"`;
  const { min, size } = MARK_BOUNDS;
  return [
    "{# Generated by scripts/brand/build-brand.mjs. Do not edit by hand. #}",
    '{% macro logoMark(extraClass="") -%}',
    `<svg class="logo-mark{% if extraClass %} {{ extraClass }}{% endif %}" viewBox="${min} ${min} ${size} ${size}" aria-hidden="true" focusable="false">${markElements({ holes: true, paint })}</svg>`,
    "{%- endmacro %}",
    "",
  ].join("\n");
}

function write(relPath, contents) {
  const abs = path.join(SRC, relPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  return abs;
}

function png(svgAbsPath, pngRelPath, width, height) {
  const args = ["-w", String(width), ...(height ? ["-h", String(height)] : []), "-o", path.join(SRC, pngRelPath), svgAbsPath];
  try {
    execFileSync("rsvg-convert", args, { stdio: "pipe" });
  } catch (cause) {
    throw new Error(`rsvg-convert failed for ${pngRelPath}. Install it with: brew install librsvg`, { cause });
  }
}

function main() {
  for (const [version, palette] of Object.entries(VERSIONS)) {
    write(`assets/brand/renatas-mark-${version}.svg`, markSvg(palette));
    write(`assets/brand/renatas-logo-horizontal-${version}.svg`, horizontalSvg(palette));
    write(`assets/brand/renatas-logo-stacked-${version}.svg`, stackedSvg(palette));
  }
  for (const version of ["color", "reversed"]) {
    for (const width of [512, 1024]) {
      png(path.join(SRC, `assets/brand/renatas-mark-${version}.svg`), `assets/brand/renatas-mark-${version}-${width}.png`, width, width);
      png(path.join(SRC, `assets/brand/renatas-logo-horizontal-${version}.svg`), `assets/brand/renatas-logo-horizontal-${version}-${width}.png`, width);
    }
  }

  const favicon = write("favicon.svg", appIconSvg({ size: 64, radius: 14, markRatio: 0.82 }));
  png(favicon, "favicon-32.png", 32, 32);

  const tmp = mkdtempSync(path.join(tmpdir(), "rcs-brand-"));
  try {
    const appIcon = path.join(tmp, "app-icon.svg");
    writeFileSync(appIcon, appIconSvg({ size: 512, radius: 0, markRatio: 0.7 }));
    png(appIcon, "apple-touch-icon.png", 180, 180);
    png(appIcon, "icon-192.png", 192, 192);
    png(appIcon, "icon-512.png", 512, 512);

    const og = path.join(tmp, "og-image.svg");
    writeFileSync(og, ogImageSvg());
    png(og, "og-image.png", 1200, 630);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  write("_includes/partials/logo-mark.njk", logoMacro());
  console.log("Brand assets written to src/assets/brand/, src/ icons, og-image.png and partials/logo-mark.njk");
}

main();
```

- [ ] **Step 7: Generate the assets**

Run: `npm run brand`
Expected: `Brand assets written to …`; 12 SVGs + 8 PNGs in `src/assets/brand/`.

- [ ] **Step 8: Visual review of the mark (manual gate)**

Run: `rsvg-convert -w 1024 src/assets/brand/renatas-logo-horizontal-color.svg -o /tmp/rcs-logo.png && rsvg-convert -w 64 src/favicon.svg -o /tmp/rcs-fav.png` and view both images.
Accept when: 8 petals with visible gaps between main and diagonal petals at 1024px; vein cut-outs read clearly; center sits inside a visible ring gap; "Renata’s" and "CLEANING SERVICE" are equal width and vertically centered on the mark; favicon reads as a flower at 64px.
If petals touch or look spiky, adjust only the `PETALS` numbers in `geometry.mjs` (keep main `r1: 86` so bounds stay 14–186), re-run `npm run brand`, re-view.

- [ ] **Step 9: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS.

- [ ] **Step 10: Commit**

```bash
git add scripts/brand src/assets/brand src/favicon.svg src/*.png src/_includes/partials/logo-mark.njk tests/brand-geometry.test.mjs tests/brand-assets.test.mjs
git commit -m "feat: refined flower logo, lockups, favicon set and social image"
```

---
### Task 3: Design system, site chrome and home page

**Files:**
- Create: `src/assets/css/tokens.css`, `src/assets/css/base.css`, `src/assets/css/components.css`, `src/assets/css/pages.css`
- Create: `src/assets/icons/sprite.svg`, `src/assets/js/main.js`
- Create: `src/_includes/partials/macros.njk`, `gtag.njk`, `header.njk`, `footer.njk`, `cta-band.njk`, `mobile-bar.njk`, `breadcrumbs.njk`
- Create: `src/_includes/layouts/base.njk`
- Modify: `src/index.njk` (replace smoke page)
- Create: `src/site.webmanifest`
- Test: `tests/design-tokens.test.mjs`, `tests/pages.test.mjs`, `tests/links.test.mjs`, `tests/content.test.mjs`

**Interfaces:**
- Consumes: data globals + filters (Task 1), `logoMark` macro (Task 2)
- Produces:
  - Layout `layouts/base.njk` reading page data: `title`, `description`, `noindex?`, `breadcrumbs?: {label,url}[]` (Home is implicit), `hideCta?`
  - Macros in `partials/macros.njk`: `icon(name, extraClass="")`, `stars(label)`, `serviceCard(service)`
  - CSS classes for later pages: `.section`, `.section--linen|--blush`, `.split`, `.split--top`, `.prose`, `.page-hero`, `.eyebrow`, `.lead`, `.section-head`, `.section-foot`, `.btn .btn-primary|-outline|-light|-ghost-light`, `.btn-row`, `.card-grid`, `.service-card`, `.icon-badge`, `.checklist`, `.checklist--columns`, `.testimonial`, `.testimonial-grid`, `.stars`, `.rating-chip`, `.faq-list`, `.faq-item`, `.faq-answer`, `.town-chips`, and page-specific classes in `pages.css`
  - Sprite symbol ids: `i-home i-building i-apartment i-sparkle i-window i-carpet i-hammer i-box i-shield i-clock i-calendar i-phone i-message i-mail i-map-pin i-star i-check i-arrow-right i-heart i-award`

- [ ] **Step 1: Write the failing design-token tests**

```js file=tests/design-tokens.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readJson } from "./helpers/site.mjs";

const CSS_FILES = ["tokens", "base", "components", "pages"].map((name) => `src/assets/css/${name}.css`);
const MAX_LINES = 800;
const brand = readJson("src/_data/brand.json");
const services = readJson("src/_data/services.json");

test("tokens.css mirrors every brand color", () => {
  const tokens = readFileSync("src/assets/css/tokens.css", "utf8");
  brand.colors.forEach(({ token, hex }) => assert.match(tokens, new RegExp(`--${token}:\\s*${hex};`, "i"), token));
});

test("every service icon exists in the sprite", () => {
  const sprite = readFileSync("src/assets/icons/sprite.svg", "utf8");
  services.forEach((s) => assert.ok(sprite.includes(`id="i-${s.icon}"`), `missing i-${s.icon}`));
});

test("CSS files stay focused", () => {
  CSS_FILES.forEach((file) => {
    const lines = readFileSync(file, "utf8").split("\n").length;
    assert.ok(lines <= MAX_LINES, `${file} has ${lines} lines`);
  });
});

test("pollen gold is never used as a text color", () => {
  CSS_FILES.forEach((file) => assert.doesNotMatch(readFileSync(file, "utf8"), /(?<![-\w])color:\s*var\(--pollen\)/, file));
});
```

Run: `node --test tests/design-tokens.test.mjs`
Expected: FAIL — `ENOENT … tokens.css`.

- [ ] **Step 2: Write the failing built-page tests**

```js file=tests/pages.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  loadPages, isIndexable, getTitle, getMetaContent, getCanonical, countTag, visibleText, SITE_URL,
} from "./helpers/site.mjs";

const pages = loadPages();
const indexable = pages.filter(isIndexable);
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;
const ADS_ID = "AW-17838655328";
const PHONE_DISPLAY = "(860) 796-5222";

describe("every page", () => {
  for (const page of pages) {
    test(`${page.url}: language, single h1, ads tag, phone`, () => {
      assert.match(page.html, /<html lang="en"/);
      assert.equal(countTag(page.html, "h1"), 1, "exactly one <h1>");
      assert.ok(page.html.includes(`googletagmanager.com/gtag/js?id=${ADS_ID}`), "gtag.js loaded");
      assert.ok(page.html.includes(`gtag('config', '${ADS_ID}')`), "gtag configured");
      assert.ok(page.html.includes('href="tel:+18607965222"'), "tap-to-call link");
      assert.ok(visibleText(page.html).includes(PHONE_DISPLAY), "phone number visible as text");
    });
  }
});

describe("indexable pages", () => {
  for (const page of indexable) {
    test(`${page.url}: SEO head`, () => {
      const title = getTitle(page.html);
      assert.ok(title, "has <title>");
      assert.ok(title.length <= TITLE_MAX, `title is ${title.length} chars: ${title}`);
      const desc = getMetaContent(page.html, "name", "description");
      assert.ok(desc, "has meta description");
      assert.ok(desc.length >= DESC_MIN && desc.length <= DESC_MAX, `description is ${desc.length} chars`);
      const url = `${SITE_URL}${page.url}`;
      assert.equal(getCanonical(page.html), url);
      assert.equal(getMetaContent(page.html, "name", "robots"), "index, follow, max-image-preview:large");
      assert.equal(getMetaContent(page.html, "property", "og:url"), url);
      assert.equal(getMetaContent(page.html, "property", "og:title"), title);
      assert.equal(getMetaContent(page.html, "property", "og:description"), desc);
      assert.equal(getMetaContent(page.html, "property", "og:image"), `${SITE_URL}/og-image.png`);
      assert.equal(getMetaContent(page.html, "name", "twitter:card"), "summary_large_image");
    });
  }

  test("titles are unique", () => {
    const titles = indexable.map((p) => getTitle(p.html));
    assert.equal(new Set(titles).size, titles.length);
  });

  test("descriptions are unique", () => {
    const descs = indexable.map((p) => getMetaContent(p.html, "name", "description"));
    assert.equal(new Set(descs).size, descs.length);
  });
});
```

```js file=tests/links.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, getInternalRefs, readSiteFile } from "./helpers/site.mjs";

const pages = loadPages();
const sprite = readSiteFile("assets/icons/sprite.svg");
const HASHED_ASSET = /^\/assets\/(?:css|js|icons)\//;
const CACHE_BUSTED = /\?v=[0-9a-f]{8}(?:#|$)/;

describe("internal link hygiene", () => {
  for (const page of pages) {
    const refs = getInternalRefs(page.html);

    test(`${page.url}: links are root-relative`, () => {
      refs.forEach((ref) => assert.ok(ref.startsWith("/") || ref.startsWith("#"), `"${ref}"`));
    });

    test(`${page.url}: page links end with / or a file extension`, () => {
      for (const ref of refs) {
        const pathname = ref.split(/[?#]/)[0];
        if (!pathname) continue;
        const last = pathname.split("/").pop();
        assert.ok(pathname.endsWith("/") || last.includes("."), `"${ref}" needs a trailing slash`);
      }
    });

    test(`${page.url}: CSS, JS and icon URLs are cache-busted`, () => {
      refs.filter((ref) => HASHED_ASSET.test(ref)).forEach((ref) => assert.match(ref, CACHE_BUSTED, ref));
    });

    test(`${page.url}: icon references exist in the sprite`, () => {
      refs.filter((ref) => ref.startsWith("/assets/icons/sprite.svg")).forEach((ref) => {
        const id = ref.split("#")[1];
        assert.ok(id && sprite.includes(`id="${id}"`), `missing symbol for ${ref}`);
      });
    });
  }
});
```

```js file=tests/content.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, visibleText, findTags } from "./helpers/site.mjs";

const pages = loadPages();
const PRIMARY_NAV = ["/services/", "/service-area/", "/about/", "/reviews/", "/faq/", "/contact/"];
const PRICE = /\$\s?\d/;

describe("content rules", () => {
  for (const page of pages) {
    test(`${page.url}: no prices in visible text`, () => {
      assert.doesNotMatch(visibleText(page.html), PRICE);
    });

    test(`${page.url}: images have alt text`, () => {
      findTags(page.html, "img").forEach((attrs) => assert.ok("alt" in attrs, JSON.stringify(attrs)));
    });

    test(`${page.url}: inline SVGs are hidden from or labelled for assistive tech`, () => {
      findTags(page.html, "svg").forEach((attrs) => {
        const labelled = attrs.role === "img" && attrs["aria-label"];
        assert.ok(attrs["aria-hidden"] === "true" || labelled, JSON.stringify(attrs));
      });
    });

    test(`${page.url}: primary nav links are real links in the HTML`, () => {
      const nav = page.html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/);
      assert.ok(nav, "site nav missing");
      PRIMARY_NAV.forEach((url) => assert.ok(nav[0].includes(`href="${url}"`), `nav missing ${url}`));
    });

    test(`${page.url}: new-tab links use rel=noopener`, () => {
      findTags(page.html, "a")
        .filter((attrs) => attrs.target === "_blank")
        .forEach((attrs) => assert.match(attrs.rel ?? "", /noopener/));
    });
  }
});
```

Run: `npm run build && node --test tests/pages.test.mjs tests/links.test.mjs tests/content.test.mjs`
Expected: FAIL — smoke page has no gtag, nav, description, or sprite.

- [ ] **Step 3: Design tokens**

```css file=src/assets/css/tokens.css
/* Design tokens. Brand colors mirror src/_data/brand.json (enforced by tests/design-tokens.test.mjs). */
:root {
  --crimson: #C41E3A;
  --garnet: #8B1A2F;
  --blush: #F7E6E4;
  --magnolia: #FFFEF9;
  --linen: #F8F5F0;
  --ink: #2B2527;
  --stone: #6B6360;
  --pollen: #E3A935;
  --white: #FFFFFF;

  --line: rgb(43 37 39 / 0.12);
  --line-strong: rgb(43 37 39 / 0.22);
  --on-dark: rgb(255 254 249 / 0.86);
  --on-dark-line: rgb(255 254 249 / 0.26);

  --font-display: "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  --font-body: "Jost", "Avenir Next", "Segoe UI", system-ui, sans-serif;

  --step--1: clamp(0.875rem, 0.85rem + 0.12vw, 0.94rem);
  --step-0: clamp(1.0625rem, 1.02rem + 0.2vw, 1.125rem);
  --step-1: clamp(1.2rem, 1.1rem + 0.45vw, 1.4rem);
  --step-2: clamp(1.55rem, 1.35rem + 0.9vw, 2.1rem);
  --step-3: clamp(2rem, 1.6rem + 1.8vw, 3rem);
  --step-4: clamp(2.5rem, 1.75rem + 3.4vw, 4.6rem);

  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-s: 0.75rem;
  --space-m: 1rem;
  --space-l: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: clamp(2.25rem, 1.8rem + 2vw, 3.25rem);
  --space-3xl: clamp(3.5rem, 2.5rem + 4.5vw, 6.5rem);

  --radius-s: 8px;
  --radius-m: 14px;
  --radius-l: 24px;
  --radius-pill: 999px;

  --shadow-s: 0 1px 2px rgb(43 37 39 / 0.06), 0 2px 8px rgb(43 37 39 / 0.05);
  --shadow-m: 0 2px 6px rgb(43 37 39 / 0.05), 0 16px 40px rgb(139 26 47 / 0.1);

  --container: 1200px;
  --header-h: 76px;
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
}
```

- [ ] **Step 4: Base styles and site chrome**

```css file=src/assets/css/base.css
/* Base: reset, typography, layout primitives, and site chrome (header, nav, footer, mobile bar). */

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-padding-top: calc(var(--header-h) + 1rem);
}

@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

body {
  min-height: 100vh;
  font-family: var(--font-body);
  font-size: var(--step-0);
  line-height: 1.65;
  color: var(--ink);
  background: var(--magnolia);
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}

body.nav-open { overflow: hidden; }

img, svg { display: block; max-width: 100%; }

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-wrap: balance;
}
h1 { font-size: var(--step-4); }
h2 { font-size: var(--step-3); }
h3 { font-size: var(--step-2); }
p, li { text-wrap: pretty; }

a { color: var(--crimson); text-decoration-thickness: 1px; text-underline-offset: 0.2em; }
a:hover { color: var(--garnet); }

:focus-visible { outline: 2px solid var(--crimson); outline-offset: 3px; border-radius: 4px; }
.site-footer :focus-visible,
.cta-band :focus-visible,
.feature-card--dark :focus-visible { outline-color: var(--magnolia); }

/* Layout primitives */
.container { width: min(100% - 2rem, var(--container)); margin-inline: auto; }
@media (min-width: 768px) { .container { width: min(100% - 4rem, var(--container)); } }

.section { padding-block: var(--space-3xl); }
.section--linen { background: var(--linen); }
.section--blush { background: var(--blush); }

.split { display: grid; gap: var(--space-2xl); align-items: center; }
.split--top { align-items: start; }
@media (min-width: 960px) { .split { grid-template-columns: 1fr 1fr; gap: var(--space-3xl); } }

.prose { max-width: 68ch; }
.prose > * + * { margin-top: 1.1em; }
.stack > * + * { margin-top: var(--space-m); }
.narrow { max-width: 52rem; margin-inline: auto; }

.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

.skip-link {
  position: absolute; left: 1rem; top: -100px; z-index: 300;
  padding: 0.75rem 1rem; border-radius: var(--radius-s);
  background: var(--ink); color: var(--magnolia); text-decoration: none;
}
.skip-link:focus { top: 1rem; color: var(--magnolia); }

/* Icons */
.icon {
  width: 1.5rem; height: 1.5rem; flex-shrink: 0;
  fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round;
}
.icon--fill { fill: currentColor; stroke: none; }

/* Logo mark (inline SVG from partials/logo-mark.njk) */
.logo-mark { width: 48px; height: 48px; }
.logo-mark .lm-main { fill: var(--crimson); }
.logo-mark .lm-diag { fill: var(--garnet); }
.logo-mark .lm-center { fill: var(--pollen); }
.logo-mark--reversed .lm-main { fill: var(--magnolia); }
.logo-mark--reversed .lm-diag { fill: var(--blush); }

/* HTML wordmark lockup */
.brand { display: inline-flex; align-items: center; gap: 0.7rem; flex-shrink: 0; color: var(--ink); text-decoration: none; }
.brand:hover { color: var(--ink); }
.brand .logo-mark { width: 46px; height: 46px; }
.brand-text { display: flex; flex-direction: column; line-height: 1; }
.brand-name { font-family: var(--font-display); font-size: 1.65rem; font-weight: 600; letter-spacing: -0.005em; color: var(--crimson); }
.brand-sub { margin-top: 0.3rem; font-size: 0.62rem; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase; }
.brand--light, .brand--light:hover { color: var(--magnolia); }
.brand--light .brand-name { color: var(--magnolia); }

/* Header + navigation (no transform/filter on the header: the mobile drawer is position: fixed inside it) */
.site-header {
  position: sticky; top: 0; z-index: 100;
  background: rgb(255 254 249 / 0.97);
  border-bottom: 1px solid var(--line);
}
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-l); min-height: var(--header-h); }

.site-nav { display: flex; align-items: center; gap: var(--space-m); }
.nav-list { display: flex; align-items: center; gap: 0.1rem; padding: 0; list-style: none; }
.nav-list > li > a {
  display: block; padding: 0.5rem 0.65rem; border-radius: var(--radius-pill);
  font-size: 0.95rem; font-weight: 500; color: var(--ink); text-decoration: none; white-space: nowrap;
}
.nav-list > li > a:hover { color: var(--crimson); }
.nav-list a[aria-current="page"] { color: var(--garnet); background: var(--blush); }

.has-sub { position: relative; }
.has-sub::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 0.6rem; }
.nav-sub {
  position: absolute; top: calc(100% + 0.4rem); left: 50%; z-index: 10;
  min-width: 270px; padding: 0.5rem; list-style: none;
  background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-m); box-shadow: var(--shadow-m);
  opacity: 0; visibility: hidden; transform: translate(-50%, 6px);
  transition: opacity 0.18s var(--ease), transform 0.18s var(--ease), visibility 0s linear 0.18s;
}
.has-sub:hover .nav-sub,
.has-sub:focus-within .nav-sub {
  opacity: 1; visibility: visible; transform: translate(-50%, 0);
  transition: opacity 0.18s var(--ease), transform 0.18s var(--ease);
}
.nav-sub a { display: block; padding: 0.55rem 0.8rem; border-radius: var(--radius-s); font-size: 0.95rem; color: var(--ink); text-decoration: none; }
.nav-sub a:hover { background: var(--blush); color: var(--garnet); }

.nav-call { white-space: nowrap; }

.nav-toggle {
  display: none; align-items: center; justify-content: center;
  width: 44px; height: 44px; padding: 0; cursor: pointer;
  background: var(--white); border: 1px solid var(--line-strong); border-radius: 50%;
}
.nav-toggle-bars,
.nav-toggle-bars::before,
.nav-toggle-bars::after {
  display: block; width: 18px; height: 1.5px; border-radius: 2px; background: var(--ink);
  transition: transform 0.2s var(--ease), background-color 0.2s var(--ease);
}
.nav-toggle-bars { position: relative; }
.nav-toggle-bars::before, .nav-toggle-bars::after { content: ""; position: absolute; left: 0; }
.nav-toggle-bars::before { top: -6px; }
.nav-toggle-bars::after { top: 6px; }
.nav-toggle[aria-expanded="true"] .nav-toggle-bars { background: transparent; }
.nav-toggle[aria-expanded="true"] .nav-toggle-bars::before { transform: translateY(6px) rotate(45deg); }
.nav-toggle[aria-expanded="true"] .nav-toggle-bars::after { transform: translateY(-6px) rotate(-45deg); }

.nav-backdrop { position: fixed; inset: var(--header-h) 0 0 0; z-index: -1; background: rgb(43 37 39 / 0.4); }

@media (min-width: 1100px) {
  .nav-backdrop { display: none; }
}

@media (min-width: 1100px) and (max-width: 1279px) {
  .nav-call-label {
    position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  .nav-call { padding-inline: 0.9rem; }
}

@media (max-width: 1099px) {
  .js .nav-toggle { display: inline-flex; }
  .js .site-nav {
    position: fixed; top: var(--header-h); right: 0; bottom: 0; z-index: 1;
    width: min(380px, 100%);
    flex-direction: column; align-items: stretch; gap: var(--space-l);
    padding: var(--space-l) var(--space-l) calc(var(--space-2xl) + env(safe-area-inset-bottom));
    background: var(--magnolia); border-left: 1px solid var(--line); overflow-y: auto;
    transform: translateX(100%); visibility: hidden;
    transition: transform 0.28s var(--ease), visibility 0s linear 0.28s;
  }
  .js .site-nav.is-open { transform: none; visibility: visible; transition: transform 0.28s var(--ease); }
  .js .nav-list { flex-direction: column; align-items: stretch; gap: 0; }
  .js .nav-list > li > a { padding: 0.85rem 0.5rem; border-radius: 0; border-bottom: 1px solid var(--line); font-size: 1.1rem; }
  .js .nav-list a[aria-current="page"] { background: none; color: var(--crimson); }
  .js .has-sub::after { display: none; }
  .js .nav-sub {
    position: static; min-width: 0; padding: 0.25rem 0 0.5rem 0.75rem;
    background: none; border: 0; box-shadow: none; opacity: 1; visibility: visible; transform: none;
  }
  .js .nav-sub a { padding: 0.45rem 0.5rem; color: var(--stone); }
  .nav-call { justify-content: center; }

  .no-js .header-inner { flex-wrap: wrap; padding-block: var(--space-s); }
  .no-js .site-nav { width: 100%; flex-wrap: wrap; }
  .no-js .nav-list { flex-wrap: wrap; }
  .no-js .nav-sub { display: none; }
}

/* Breadcrumbs */
.breadcrumbs { padding-top: var(--space-m); background: var(--linen); font-size: var(--step--1); color: var(--stone); }
.breadcrumbs ol { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0; list-style: none; }
.breadcrumbs li + li::before { content: "/"; margin-right: 0.4rem; color: var(--line-strong); }
.breadcrumbs a { color: var(--stone); text-decoration: none; }
.breadcrumbs a:hover { color: var(--crimson); text-decoration: underline; }

/* Footer */
.site-footer { padding-block: var(--space-3xl) var(--space-xl); background: var(--garnet); color: var(--on-dark); }
.footer-grid { display: grid; gap: var(--space-2xl); }
@media (min-width: 768px) { .footer-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .footer-grid { grid-template-columns: 1.5fr 1fr 0.9fr 1.2fr; } }
.footer-brand .logo-mark { width: 52px; height: 52px; }
.footer-tagline { margin-block: var(--space-l) var(--space-s); font-family: var(--font-display); font-size: 1.5rem; font-style: italic; color: var(--magnolia); }
.footer-title { margin-bottom: var(--space-m); font-family: var(--font-body); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--blush); }
.site-footer ul { display: grid; gap: 0.55rem; padding: 0; list-style: none; }
.site-footer a { color: var(--magnolia); text-decoration: none; }
.site-footer a:hover { color: var(--white); text-decoration: underline; }
.footer-contact li, .footer-contact a { display: flex; align-items: center; gap: 0.6rem; overflow-wrap: anywhere; }
.footer-contact .icon { width: 1.2rem; height: 1.2rem; color: var(--blush); }
.footer-bottom {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-s);
  margin-top: var(--space-2xl); padding-top: var(--space-l);
  border-top: 1px solid var(--on-dark-line); font-size: var(--step--1);
}

/* Mobile quick-contact bar */
.mobile-bar {
  position: fixed; inset: auto 0 0 0; z-index: 90;
  display: grid; grid-template-columns: repeat(3, 1fr);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--white); border-top: 1px solid var(--line); box-shadow: 0 -8px 24px rgb(43 37 39 / 0.08);
}
.mobile-bar a {
  display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
  padding: 0.55rem 0.25rem; font-size: 0.8rem; font-weight: 500; color: var(--ink); text-decoration: none;
}
.mobile-bar a:first-child { background: var(--crimson); color: var(--white); }
.mobile-bar .icon { width: 1.35rem; height: 1.35rem; }
@media (max-width: 767px) { body { padding-bottom: calc(4rem + env(safe-area-inset-bottom)); } }
@media (min-width: 768px) { .mobile-bar { display: none; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Components**

```css file=src/assets/css/components.css
/* Components: buttons, headings, cards, lists, testimonials, FAQ, CTA band, chips. */

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem;
  min-height: 48px; padding: 0.7rem 1.4rem; cursor: pointer;
  border: 1.5px solid transparent; border-radius: var(--radius-pill);
  font-family: var(--font-body); font-size: 1rem; font-weight: 500; letter-spacing: 0.01em; line-height: 1.2;
  text-decoration: none; white-space: nowrap;
  transition: background-color 0.2s var(--ease), color 0.2s var(--ease), border-color 0.2s var(--ease), transform 0.2s var(--ease);
}
.btn:active { transform: translateY(1px); }
.btn .icon { width: 1.15em; height: 1.15em; }
.btn-primary { background: var(--crimson); color: var(--white); }
.btn-primary:hover { background: var(--garnet); color: var(--white); }
.btn-outline { border-color: var(--crimson); color: var(--crimson); }
.btn-outline:hover { background: var(--crimson); color: var(--white); }
.btn-light { background: var(--magnolia); color: var(--garnet); }
.btn-light:hover { background: var(--blush); color: var(--garnet); }
.btn-ghost-light { border-color: var(--on-dark-line); color: var(--magnolia); }
.btn-ghost-light:hover { border-color: var(--magnolia); background: rgb(255 254 249 / 0.1); color: var(--white); }
.btn-row { display: flex; flex-wrap: wrap; gap: var(--space-s); }
@media (max-width: 479px) { .btn-row .btn { flex: 1 1 100%; } }

.eyebrow {
  display: inline-flex; align-items: center; gap: 0.6rem; margin-bottom: var(--space-m);
  font-size: 0.8rem; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--crimson);
}
.eyebrow::before { content: ""; width: 1.75rem; height: 1px; background: currentColor; }

.lead { font-size: var(--step-1); line-height: 1.55; color: var(--stone); }

.section-head { max-width: 46rem; margin-bottom: var(--space-2xl); }
.section-head .lead { margin-top: var(--space-m); }
.section-head--center { margin-inline: auto; text-align: center; }
.section-foot { margin-top: var(--space-xl); }

.icon-badge {
  display: inline-grid; place-items: center; flex-shrink: 0;
  width: 3.25rem; height: 3.25rem; border-radius: 50%;
  background: var(--blush); color: var(--crimson);
}
.icon-badge .icon { width: 1.55rem; height: 1.55rem; }

/* Cards */
.card-grid { display: grid; gap: var(--space-l); grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr)); }

.service-card {
  position: relative; display: flex; flex-direction: column; gap: var(--space-s);
  padding: var(--space-xl); background: var(--white);
  border: 1px solid var(--line); border-radius: var(--radius-m);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease), transform 0.2s var(--ease);
}
.service-card:hover { border-color: rgb(196 30 58 / 0.35); box-shadow: var(--shadow-m); transform: translateY(-2px); }
.service-card h3 { margin-top: var(--space-xs); font-size: 1.6rem; }
.service-card h3 a { color: var(--ink); text-decoration: none; }
.service-card h3 a::after,
.feature-card h3 a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.service-card p { font-size: 0.98rem; color: var(--stone); }
.card-link { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: auto; padding-top: var(--space-xs); font-weight: 500; color: var(--crimson); }
.card-link .icon { width: 1.1rem; height: 1.1rem; transition: transform 0.2s var(--ease); }
.service-card:hover .card-link .icon,
.feature-card:hover .card-link .icon { transform: translateX(3px); }

.feature-pair { display: grid; gap: var(--space-l); margin-bottom: var(--space-l); }
@media (min-width: 768px) { .feature-pair { grid-template-columns: 1fr 1fr; } }
.feature-card {
  position: relative; display: flex; flex-direction: column; gap: var(--space-s); min-height: 300px;
  padding: clamp(1.75rem, 1.2rem + 2vw, 2.75rem); overflow: hidden;
  background: var(--blush); border-radius: var(--radius-l);
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.feature-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-m); }
.feature-card .eyebrow { margin: var(--space-s) 0 0; }
.feature-card h3 { font-size: var(--step-3); }
.feature-card h3 a { color: inherit; text-decoration: none; }
.feature-card p { max-width: 32rem; color: var(--stone); }
.feature-card--dark { background: var(--garnet); color: var(--magnolia); }
.feature-card--dark h3,
.feature-card--dark .eyebrow,
.feature-card--dark .card-link { color: var(--magnolia); }
.feature-card--dark p { color: var(--on-dark); }
.feature-card--dark .icon-badge { background: rgb(255 254 249 / 0.12); color: var(--magnolia); }
.feature-card-petal { position: absolute; right: -3rem; bottom: -3rem; width: 14rem; height: 14rem; opacity: 0.1; pointer-events: none; }

/* Lists */
.checklist { display: grid; gap: 0.8rem; padding: 0; list-style: none; }
.checklist li { display: grid; grid-template-columns: 1.4rem 1fr; gap: 0.75rem; align-items: start; }
.checklist .icon { width: 1.4rem; height: 1.4rem; margin-top: 0.15rem; color: var(--crimson); }
@media (min-width: 640px) { .checklist--columns { grid-template-columns: 1fr 1fr; column-gap: var(--space-xl); } }

.feature-list { display: grid; gap: var(--space-l); margin-top: var(--space-xl); padding: 0; list-style: none; }
.feature-list li { display: grid; grid-template-columns: auto 1fr; gap: var(--space-m); align-items: start; }
.feature-list h3 { margin-bottom: 0.25rem; font-size: 1.45rem; }
.feature-list p { color: var(--stone); }

.trust-strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-l); padding: 0; list-style: none; }
@media (min-width: 960px) { .trust-strip { grid-template-columns: repeat(4, 1fr); } }
.trust-item { display: flex; align-items: center; gap: 0.85rem; }
.trust-item strong { display: block; font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; line-height: 1.1; }
.trust-item small { display: block; font-size: 0.9rem; color: var(--stone); }

.steps { display: grid; gap: var(--space-xl); padding: 0; list-style: none; counter-reset: step; }
@media (min-width: 900px) { .steps { grid-template-columns: repeat(3, 1fr); } }
.step { padding-top: var(--space-l); border-top: 1px solid var(--line-strong); }
.step::before {
  counter-increment: step; content: "0" counter(step);
  display: block; margin-bottom: var(--space-s);
  font-family: var(--font-display); font-size: 3.25rem; font-style: italic; font-weight: 500; line-height: 1; color: var(--crimson);
}
.step h3 { margin-bottom: 0.4rem; font-size: 1.6rem; }
.step p { color: var(--stone); }

/* Testimonials + ratings */
.testimonial-grid { display: grid; gap: var(--space-l); }
@media (min-width: 900px) { .testimonial-grid { grid-template-columns: repeat(3, 1fr); } }
.testimonial {
  display: flex; flex-direction: column; gap: var(--space-m);
  padding: var(--space-xl); background: var(--white);
  border: 1px solid var(--line); border-radius: var(--radius-m);
}
.testimonial blockquote { font-family: var(--font-display); font-size: 1.3rem; font-weight: 500; line-height: 1.45; }
.testimonial blockquote::before { content: "\201C"; display: block; height: 1.6rem; font-size: 3.5rem; line-height: 1; color: var(--crimson); }
.testimonial figcaption { margin-top: auto; font-size: 0.95rem; font-weight: 500; color: var(--stone); }
.testimonial--feature { padding: clamp(1.75rem, 1.2rem + 2vw, 3rem); box-shadow: var(--shadow-m); }
.testimonial--feature blockquote { font-size: var(--step-2); }

.stars { display: inline-flex; gap: 2px; }
.stars .icon { width: 1.1rem; height: 1.1rem; fill: var(--pollen); }

.rating-chip {
  display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.95rem;
  background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-pill);
  font-size: 0.92rem; color: var(--ink); text-decoration: none;
}
.rating-chip:hover { border-color: var(--crimson); color: var(--ink); }

/* FAQ (native <details>) */
.faq-list { display: grid; gap: var(--space-s); max-width: 52rem; }
.faq-item { background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-m); transition: border-color 0.2s var(--ease); }
.faq-item[open] { border-color: rgb(196 30 58 / 0.35); }
.faq-item summary {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-m);
  padding: 1.1rem 1.4rem; cursor: pointer; list-style: none;
  font-size: 1.05rem; font-weight: 500;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after {
  content: ""; flex-shrink: 0; width: 0.6rem; height: 0.6rem;
  border-right: 2px solid var(--crimson); border-bottom: 2px solid var(--crimson);
  transform: translateY(-25%) rotate(45deg); transition: transform 0.2s var(--ease);
}
.faq-item[open] summary::after { transform: translateY(25%) rotate(225deg); }
.faq-answer { padding: 0 1.4rem 1.3rem; color: var(--stone); }

/* CTA band */
.cta-band { position: relative; overflow: hidden; background: var(--crimson); color: var(--white); }
.cta-band-inner { position: relative; display: grid; gap: var(--space-l); align-items: center; padding-block: var(--space-3xl); }
@media (min-width: 960px) {
  .cta-band-inner { grid-template-columns: 1.2fr 1fr; }
  .cta-band .btn-row { justify-content: flex-end; }
}
.cta-band h2 { color: var(--white); }
.cta-band p { max-width: 36rem; margin-top: var(--space-s); color: rgb(255 255 255 / 0.92); }
.cta-band .logo-mark { position: absolute; left: -5rem; bottom: -7rem; width: 20rem; height: 20rem; opacity: 0.08; pointer-events: none; }

/* Chips */
.town-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; list-style: none; }
.town-chips a {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 1rem;
  background: var(--white); border: 1px solid var(--line-strong); border-radius: var(--radius-pill);
  font-size: 0.95rem; color: var(--ink); text-decoration: none;
}
.town-chips a:hover { border-color: var(--crimson); color: var(--crimson); }
.town-chips .icon { width: 1rem; height: 1rem; color: var(--crimson); }
```

- [ ] **Step 6: Page layouts**

```css file=src/assets/css/pages.css
/* Page layouts: home hero, page hero, service pages, contact, service area, about, reviews, 404. */

/* Home hero */
.hero {
  position: relative; overflow: hidden;
  padding-block: clamp(2.5rem, 1.5rem + 5vw, 6rem) clamp(3rem, 2rem + 4vw, 5.5rem);
  background: radial-gradient(60rem 36rem at 88% 8%, var(--blush), transparent 62%), var(--magnolia);
}
.hero-grid { display: grid; gap: var(--space-2xl); align-items: center; }
@media (min-width: 960px) { .hero-grid { grid-template-columns: 1.1fr 0.9fr; gap: var(--space-3xl); } }
.hero h1 { max-width: 15ch; }
.hero h1 em { display: block; font-style: italic; font-weight: 500; color: var(--crimson); }
.hero .lead { max-width: 34rem; margin-block: var(--space-l) var(--space-xl); }
.hero-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-s) var(--space-l); margin-top: var(--space-xl); font-size: 0.92rem; color: var(--stone); }
.hero-meta > span { display: inline-flex; align-items: center; gap: 0.4rem; }
.hero-meta .icon { width: 1.1rem; height: 1.1rem; color: var(--crimson); }

.hero-art { position: relative; justify-self: center; width: min(100%, 440px); }
.hero-arch {
  position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; overflow: hidden;
  border-radius: 999px 999px var(--radius-l) var(--radius-l);
  background: radial-gradient(circle at 50% 36%, var(--crimson), var(--garnet) 72%);
  box-shadow: var(--shadow-m);
}
.hero-arch::after { content: ""; position: absolute; inset: 14px; border: 1px solid var(--on-dark-line); border-radius: inherit; }
.hero-arch .logo-mark { width: 60%; height: auto; }
.hero-card {
  position: absolute; left: -1.25rem; bottom: 1.75rem;
  display: grid; gap: 0.55rem; padding: 1rem 1.25rem; list-style: none;
  background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-m); box-shadow: var(--shadow-m);
  font-size: 0.92rem; font-weight: 500;
}
.hero-card li { display: flex; align-items: center; gap: 0.55rem; }
.hero-card .icon { width: 1.15rem; height: 1.15rem; color: var(--crimson); }
@media (max-width: 959px) {
  .hero-art { width: min(100%, 340px); }
  .hero-arch { aspect-ratio: 1; }
  .hero-card { left: -0.5rem; bottom: -1rem; }
}

.trust { padding-block: var(--space-2xl); background: var(--white); border-block: 1px solid var(--line); }

/* Inner-page hero */
.page-hero { padding-block: var(--space-xl) var(--space-3xl); background: linear-gradient(var(--linen), var(--magnolia)); border-bottom: 1px solid var(--line); }
.page-hero h1 { max-width: 20ch; }
.page-hero .lead { max-width: 42rem; margin-top: var(--space-l); }
.page-hero .btn-row { margin-top: var(--space-xl); }

/* Service pages */
.service-layout { display: grid; gap: var(--space-2xl); align-items: start; }
@media (min-width: 960px) { .service-layout { grid-template-columns: minmax(0, 1fr) 340px; gap: var(--space-3xl); } }
.service-main { display: grid; gap: var(--space-2xl); min-width: 0; }
.service-main h2 { margin-bottom: var(--space-m); font-size: var(--step-2); }
.included-card { padding: clamp(1.5rem, 1rem + 2vw, 2.5rem); background: var(--linen); border-radius: var(--radius-l); }
.schedule-note {
  display: flex; gap: var(--space-m); padding: var(--space-l);
  background: var(--blush); border-left: 3px solid var(--crimson); border-radius: 0 var(--radius-m) var(--radius-m) 0;
}
.schedule-note .icon { margin-top: 0.2rem; color: var(--crimson); }
.service-main .schedule-note h2 { margin-bottom: 0.2rem; font-size: 1.4rem; }
.aside-card {
  position: sticky; top: calc(var(--header-h) + 1.5rem);
  padding: var(--space-xl); background: var(--white);
  border: 1px solid var(--line); border-radius: var(--radius-l); box-shadow: var(--shadow-s);
}
.aside-card h2 { margin-bottom: var(--space-s); font-size: 1.75rem; }
.aside-card p { font-size: 0.98rem; color: var(--stone); }
.aside-contact { display: grid; gap: 0.5rem; margin-block: var(--space-l); padding: 0; list-style: none; }
.aside-contact a {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem;
  background: var(--linen); border-radius: var(--radius-s);
  font-weight: 500; color: var(--ink); text-decoration: none; overflow-wrap: anywhere;
}
.aside-contact a:hover { background: var(--blush); color: var(--garnet); }
.aside-contact .icon { width: 1.2rem; height: 1.2rem; color: var(--crimson); }
.aside-card .checklist { font-size: 0.95rem; }
.area-line { display: flex; gap: 0.5rem; max-width: 60rem; margin-top: var(--space-2xl); color: var(--stone); }
.area-line .icon { width: 1.2rem; height: 1.2rem; margin-top: 0.3rem; color: var(--crimson); }

/* Contact */
.contact-grid { display: grid; gap: var(--space-l); margin-bottom: var(--space-3xl); }
@media (min-width: 768px) { .contact-grid { grid-template-columns: repeat(3, 1fr); } }
.contact-card {
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-s);
  padding: var(--space-xl); background: var(--white); color: var(--ink); text-decoration: none;
  border: 1px solid var(--line); border-radius: var(--radius-l);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease), transform 0.2s var(--ease);
}
.contact-card:hover { color: var(--ink); border-color: var(--crimson); box-shadow: var(--shadow-m); transform: translateY(-2px); }
.contact-card h2 { font-size: 1.75rem; }
.contact-value { font-family: var(--font-display); font-size: 1.45rem; font-weight: 600; color: var(--crimson); overflow-wrap: anywhere; }
.contact-note { font-size: 0.95rem; color: var(--stone); }

/* Service area */
.town-grid { display: grid; gap: var(--space-m); grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
.town-card {
  padding: var(--space-l); background: var(--white);
  border: 1px solid var(--line); border-radius: var(--radius-m);
  scroll-margin-top: calc(var(--header-h) + 1rem);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.town-card:target { border-color: var(--crimson); box-shadow: 0 0 0 4px var(--blush); }
.town-card h2 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.6rem; }
.town-card h2 .icon { width: 1.2rem; height: 1.2rem; color: var(--crimson); }
.town-card p { margin-top: 0.35rem; font-size: 0.98rem; color: var(--stone); }

/* About */
.highlight-card { display: grid; gap: var(--space-l); padding: clamp(1.5rem, 1rem + 2vw, 2.5rem); background: var(--linen); border-radius: var(--radius-l); list-style: none; }
.highlight { display: flex; align-items: center; gap: var(--space-m); font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; line-height: 1.2; }

/* Reviews */
.rating-summary {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-l) var(--space-2xl);
  margin-bottom: var(--space-2xl); padding: var(--space-xl);
  background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-l);
}
.rating-score { font-family: var(--font-display); font-size: 4.5rem; font-weight: 600; line-height: 1; color: var(--crimson); }
.rating-summary .stars .icon { width: 1.4rem; height: 1.4rem; }
.rating-meta { display: grid; gap: 0.3rem; color: var(--stone); }
.rating-summary .btn { margin-left: auto; }
@media (max-width: 639px) { .rating-summary .btn { margin-left: 0; } }

/* 404 */
.not-found { text-align: center; }
.not-found .logo-mark { width: 96px; height: 96px; margin: 0 auto var(--space-l); }
.not-found .lead { max-width: 36rem; margin: var(--space-m) auto 0; }
.not-found .btn-row { justify-content: center; margin-top: var(--space-xl); }
```

- [ ] **Step 7: Icon sprite**

```svg file=src/assets/icons/sprite.svg
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-5.5h4v5.5"/></symbol>
  <symbol id="i-building" viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="1"/><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15"/><path d="M10.5 20.5v-3h3v3"/></symbol>
  <symbol id="i-apartment" viewBox="0 0 24 24"><path d="M3.5 20.5h17"/><rect x="5" y="8" width="7" height="12.5"/><rect x="12" y="4" width="7" height="16.5"/><path d="M7.5 11.5h2M7.5 15h2M14.5 7.5h2M14.5 11h2M14.5 14.5h2"/></symbol>
  <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M11 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z"/><path d="M18.5 15c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5Z"/></symbol>
  <symbol id="i-window" viewBox="0 0 24 24"><rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M12 3.5v17M4.5 12h15"/><path d="m7 9 2-2M14.5 9.5 17 7"/></symbol>
  <symbol id="i-carpet" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1"/><path d="M8 5V3M11 5V3M13 5V3M16 5V3M8 19v2M11 19v2M13 19v2M16 19v2"/><path d="M9 9.5h6M9 12h6M9 14.5h6"/></symbol>
  <symbol id="i-hammer" viewBox="0 0 24 24"><path d="m11 7.5 4-4 5.5 5.5-4 4Z"/><path d="M13.25 9.75 4.5 18.5a1.5 1.5 0 0 0 2.1 2.1l8.75-8.75"/></symbol>
  <symbol id="i-box" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4Z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3.5 5 6.5v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9v-5Z"/><path d="m9 12 2 2 4-4"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
  <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M6.6 3.5h2.6l1.3 4-2 1.3a11 11 0 0 0 6.7 6.7l1.3-2 4 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></symbol>
  <symbol id="i-message" viewBox="0 0 24 24"><path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 6.5 8 6 8-6"/></symbol>
  <symbol id="i-map-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 19.5s-7.5-4.4-7.5-10a4 4 0 0 1 7.5-2 4 4 0 0 1 7.5 2c0 5.6-7.5 10-7.5 10Z"/></symbol>
  <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.3 7.5 20.5l4.5-2.3 4.5 2.3-1.1-7.2"/></symbol>
</svg>
```

- [ ] **Step 8: Mobile drawer script**

```js file=src/assets/js/main.js
// Mobile navigation drawer. Without JS the nav renders as a plain wrapped list (see .no-js CSS).
const DESKTOP_QUERY = "(min-width: 1100px)";

const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
const backdrop = document.querySelector(".nav-backdrop");

function setOpen(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  backdrop.hidden = !open;
  document.body.classList.toggle("nav-open", open);
}

if (toggle && nav && backdrop) {
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  backdrop.addEventListener("click", () => setOpen(false));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia(DESKTOP_QUERY).addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}
```

- [ ] **Step 9: Partials**

```njk file=src/_includes/partials/macros.njk
{% macro icon(name, extraClass="") -%}
<svg class="icon{% if extraClass %} {{ extraClass }}{% endif %}" aria-hidden="true" focusable="false"><use href="{{ '/assets/icons/sprite.svg' | assetUrl }}#i-{{ name }}"></use></svg>
{%- endmacro %}

{% macro stars(label) -%}
<span class="stars" role="img" aria-label="{{ label }}">
{%- for i in range(0, 5) %}<svg class="icon icon--fill" aria-hidden="true" focusable="false"><use href="{{ '/assets/icons/sprite.svg' | assetUrl }}#i-star"></use></svg>{% endfor -%}
</span>
{%- endmacro %}

{% macro serviceCard(service) -%}
<article class="service-card">
  <span class="icon-badge">{{ icon(service.icon) }}</span>
  <h3><a href="/services/{{ service.slug }}/">{{ service.name }}</a></h3>
  <p>{{ service.summary }}</p>
  <span class="card-link" aria-hidden="true">Learn more {{ icon("arrow-right") }}</span>
</article>
{%- endmacro %}
```

```njk file=src/_includes/partials/gtag.njk
<script async src="https://www.googletagmanager.com/gtag/js?id={{ site.googleAdsId }}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{{ site.googleAdsId }}');
</script>
```

```njk file=src/_includes/partials/header.njk
{% from "partials/macros.njk" import icon %}
{% from "partials/logo-mark.njk" import logoMark %}
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/">
      {{ logoMark() }}
      <span class="brand-text"><span class="brand-name">Renata’s</span><span class="brand-sub">Cleaning Service</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span><span class="visually-hidden">Menu</span>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul class="nav-list" role="list">
        {%- for item in nav %}
        <li class="nav-item{% if item.hasSub %} has-sub{% endif %}">
          <a href="{{ item.url }}"{% if page.url == item.url %} aria-current="page"{% endif %}>{{ item.label }}</a>
          {%- if item.hasSub %}
          <ul class="nav-sub" role="list">
            {%- for s in services %}
            {%- set serviceUrl = "/services/" ~ s.slug ~ "/" %}
            <li><a href="{{ serviceUrl }}"{% if page.url == serviceUrl %} aria-current="page"{% endif %}>{{ s.name }}</a></li>
            {%- endfor %}
          </ul>
          {%- endif %}
        </li>
        {%- endfor %}
      </ul>
      <a class="btn btn-primary nav-call" href="tel:{{ site.phone.tel }}">{{ icon("phone") }}<span class="nav-call-label">{{ site.phone.display }}</span></a>
    </nav>
  </div>
  <div class="nav-backdrop" hidden></div>
</header>
```

```njk file=src/_includes/partials/footer.njk
{% from "partials/macros.njk" import icon %}
{% from "partials/logo-mark.njk" import logoMark %}
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand brand--light" href="/">
          {{ logoMark("logo-mark--reversed") }}
          <span class="brand-text"><span class="brand-name">Renata’s</span><span class="brand-sub">Cleaning Service</span></span>
        </a>
        <p class="footer-tagline">{{ site.tagline }}</p>
        <p>Family-owned house and commercial cleaning serving {{ site.county }}, {{ site.regionName }} for more than 25 years. Fully insured &amp; bonded.</p>
      </div>
      <nav aria-label="Services">
        <h2 class="footer-title">Services</h2>
        <ul role="list">
          {%- for s in services %}
          <li><a href="/services/{{ s.slug }}/">{{ s.name }}</a></li>
          {%- endfor %}
        </ul>
      </nav>
      <nav aria-label="Company">
        <h2 class="footer-title">Company</h2>
        <ul role="list">
          <li><a href="/about/">About</a></li>
          <li><a href="/reviews/">Reviews</a></li>
          <li><a href="/faq/">FAQ</a></li>
          <li><a href="/service-area/">Service Area</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </nav>
      <div>
        <h2 class="footer-title">Get in touch</h2>
        <ul class="footer-contact" role="list">
          <li><a href="tel:{{ site.phone.tel }}">{{ icon("phone") }}{{ site.phone.display }}</a></li>
          <li><a href="sms:{{ site.phone.sms }}">{{ icon("message") }}Text us</a></li>
          <li><a href="mailto:{{ site.email }}">{{ icon("mail") }}{{ site.email }}</a></li>
          <li>{{ icon("map-pin") }}Serving {{ site.county }}, {{ site.region }}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ buildDate.getFullYear() }} {{ site.name }}. All rights reserved.</p>
      <p>Insured &amp; Bonded · Free Quotes · No Hidden Fees</p>
    </div>
  </div>
</footer>
```

```njk file=src/_includes/partials/cta-band.njk
{% from "partials/macros.njk" import icon %}
{% from "partials/logo-mark.njk" import logoMark %}
<section class="cta-band" aria-labelledby="cta-title">
  {{ logoMark("logo-mark--reversed") }}
  <div class="container cta-band-inner">
    <div>
      <h2 id="cta-title">Ready for a spotless home or office?</h2>
      <p>Free, no-obligation quotes. Call or text anytime, or email us and we’ll reply within 24 hours.</p>
    </div>
    <div class="btn-row">
      <a class="btn btn-light" href="tel:{{ site.phone.tel }}">{{ icon("phone") }}{{ site.phone.display }}</a>
      <a class="btn btn-ghost-light" href="sms:{{ site.phone.sms }}">{{ icon("message") }}Text us</a>
      <a class="btn btn-ghost-light" href="mailto:{{ site.email }}">{{ icon("mail") }}Email</a>
    </div>
  </div>
</section>
```

```njk file=src/_includes/partials/mobile-bar.njk
{% from "partials/macros.njk" import icon %}
<nav class="mobile-bar" aria-label="Quick contact">
  <a href="tel:{{ site.phone.tel }}">{{ icon("phone") }}<span>Call</span></a>
  <a href="sms:{{ site.phone.sms }}">{{ icon("message") }}<span>Text</span></a>
  <a href="mailto:{{ site.email }}">{{ icon("mail") }}<span>Email</span></a>
</nav>
```

```njk file=src/_includes/partials/breadcrumbs.njk
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <div class="container">
    <ol>
      <li><a href="/">Home</a></li>
      {%- for crumb in breadcrumbs %}
      <li>{% if loop.last %}<span aria-current="page">{{ crumb.label }}</span>{% else %}<a href="{{ crumb.url }}">{{ crumb.label }}</a>{% endif %}</li>
      {%- endfor %}
    </ol>
  </div>
</nav>
```

- [ ] **Step 10: Base layout**

```njk file=src/_includes/layouts/base.njk
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>document.documentElement.classList.replace("no-js", "js");</script>
  {% include "partials/gtag.njk" %}
  {%- set canonicalUrl = page.url | absoluteUrl(site.url) %}
  {%- set ogImageUrl = site.ogImage | absoluteUrl(site.url) %}
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
  {%- if noindex %}
  <meta name="robots" content="noindex, follow">
  {%- else %}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{{ canonicalUrl }}">
  {%- endif %}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{{ site.name }}">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="{{ title }}">
  <meta property="og:description" content="{{ description }}">
  <meta property="og:url" content="{{ canonicalUrl }}">
  <meta property="og:image" content="{{ ogImageUrl }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{{ site.name }}: {{ site.tagline }}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{ title }}">
  <meta name="twitter:description" content="{{ description }}">
  <meta name="twitter:image" content="{{ ogImageUrl }}">
  <meta name="geo.region" content="US-{{ site.region }}">
  <meta name="geo.placename" content="{{ site.county }}, {{ site.regionName }}">
  <meta name="geo.position" content="{{ site.geo.latitude }};{{ site.geo.longitude }}">
  <meta name="ICBM" content="{{ site.geo.latitude }}, {{ site.geo.longitude }}">
  <meta name="theme-color" content="{{ site.themeColor }}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&amp;family=Jost:wght@400;500;600&amp;display=swap">
  {%- for sheet in ["tokens", "base", "components", "pages"] %}
  <link rel="stylesheet" href="{{ ('/assets/css/' ~ sheet ~ '.css') | assetUrl }}">
  {%- endfor %}
  <script src="{{ '/assets/js/main.js' | assetUrl }}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  {% include "partials/header.njk" %}
  <main id="main">
    {%- if breadcrumbs %}{% include "partials/breadcrumbs.njk" %}{% endif %}
    {{ content | safe }}
  </main>
  {%- if not hideCta %}{% include "partials/cta-band.njk" %}{% endif %}
  {% include "partials/footer.njk" %}
  {% include "partials/mobile-bar.njk" %}
</body>
</html>
```

The layout links `/site.webmanifest`, so create it now (validated in Task 7):

```json file=src/site.webmanifest
{
  "name": "Renata's Cleaning Service",
  "short_name": "Renata's",
  "start_url": "/",
  "display": "browser",
  "background_color": "#FFFEF9",
  "theme_color": "#C41E3A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 11: Home page**

```njk file=src/index.njk
---
layout: layouts/base.njk
title: "House & Office Cleaning in Hartford County, CT | Renata's"
description: "House cleaning, office cleaning & deep cleaning in Hartford County, CT. Family-owned, 25+ years, insured & bonded. Free quote: (860) 796-5222."
---
{% from "partials/macros.njk" import icon, stars, serviceCard %}
{% from "partials/logo-mark.njk" import logoMark %}
<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">{{ site.tagline }}</p>
      <h1>House &amp; Office Cleaning <em>in Hartford County, CT</em></h1>
      <p class="lead">Family-owned for more than 25 years, we clean homes and businesses with real attention to detail. We move things to clean beneath them, not around them, and we’re fully insured &amp; bonded.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="tel:{{ site.phone.tel }}">{{ icon("phone") }}Call {{ site.phone.display }}</a>
        <a class="btn btn-outline" href="/contact/">Get a free quote</a>
      </div>
      <div class="hero-meta">
        <a class="rating-chip" href="/reviews/">{{ stars("Rated " ~ reviews.ratingValue ~ " out of 5") }}<span><strong>{{ reviews.ratingValue }}</strong> from {{ reviews.reviewCount }} Google reviews</span></a>
        <span>{{ icon("map-pin") }}Serving {{ site.county }} &amp; nearby towns</span>
      </div>
    </div>
    <div class="hero-art">
      <div class="hero-arch" aria-hidden="true">{{ logoMark("logo-mark--reversed") }}</div>
      <ul class="hero-card" role="list">
        <li>{{ icon("shield") }}Insured &amp; bonded</li>
        <li>{{ icon("award") }}25+ years of experience</li>
        <li>{{ icon("heart") }}Family-owned &amp; operated</li>
      </ul>
    </div>
  </div>
</section>

<section class="trust" aria-label="Why clients trust us">
  <div class="container">
    <ul class="trust-strip" role="list">
      <li class="trust-item"><span class="icon-badge">{{ icon("award") }}</span><div><strong>25+ years</strong><small>Serving {{ site.county }}</small></div></li>
      <li class="trust-item"><span class="icon-badge">{{ icon("heart") }}</span><div><strong>Family-owned</strong><small>&amp; operated</small></div></li>
      <li class="trust-item"><span class="icon-badge">{{ icon("shield") }}</span><div><strong>Insured &amp; bonded</strong><small>For your peace of mind</small></div></li>
      <li class="trust-item"><span class="icon-badge">{{ icon("check") }}</span><div><strong>Free quotes</strong><small>No hidden fees</small></div></li>
    </ul>
  </div>
</section>

<section class="section" id="services">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Our services</p>
      <h2>Cleaning for homes and businesses</h2>
      <p class="lead">From weekly house cleaning to post-renovation cleanups, every service gets the same meticulous standard.</p>
    </div>
    <div class="feature-pair">
      {%- for s in services | selectattr("featured") %}
      {%- set isCommercial = s.category == "commercial" %}
      <article class="feature-card{% if isCommercial %} feature-card--dark{% endif %}">
        {{ logoMark("feature-card-petal" ~ (" logo-mark--reversed" if isCommercial else "")) }}
        <span class="icon-badge">{{ icon(s.icon) }}</span>
        <p class="eyebrow">{{ "For your business" if isCommercial else "For your home" }}</p>
        <h3><a href="/services/{{ s.slug }}/">{{ s.name }}</a></h3>
        <p>{{ s.summary }}</p>
        <span class="card-link" aria-hidden="true">Explore {{ s.name | lower }} {{ icon("arrow-right") }}</span>
      </article>
      {%- endfor %}
    </div>
    <div class="card-grid">
      {%- for s in services | rejectattr("featured") %}{{ serviceCard(s) }}{% endfor %}
    </div>
  </div>
</section>

<section class="section section--linen">
  <div class="container split">
    <div>
      <p class="eyebrow">The Renata’s difference</p>
      <h2>Clean you can see in the details</h2>
      <ul class="feature-list" role="list">
        <li><span class="icon-badge">{{ icon("sparkle") }}</span><div><h3>Meticulous attention to detail</h3><p>We move objects to dust the surfaces beneath them, not around them, and put everything back in an organized way.</p></div></li>
        <li><span class="icon-badge">{{ icon("clock") }}</span><div><h3>Reliable &amp; punctual</h3><p>We arrive on time and deliver consistently high-quality results, visit after visit.</p></div></li>
        <li><span class="icon-badge">{{ icon("calendar") }}</span><div><h3>Flexible scheduling</h3><p>Weekly, bi-weekly, monthly or one-time. Need to reschedule? Just call or text.</p></div></li>
        <li><span class="icon-badge">{{ icon("shield") }}</span><div><h3>Insured &amp; bonded</h3><p>Your home or business is protected while our team is working.</p></div></li>
      </ul>
    </div>
    {%- set spotlight = reviews.testimonials[0] %}
    <figure class="testimonial testimonial--feature">
      {{ stars(spotlight.rating ~ " out of 5 stars") }}
      <blockquote><p>{{ spotlight.text }}</p></blockquote>
      <figcaption>{{ spotlight.author }}, {{ reviews.platform }} review</figcaption>
    </figure>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow">How it works</p>
      <h2>A spotless space in three easy steps</h2>
    </div>
    <ol class="steps" role="list">
      <li class="step"><h3>Reach out</h3><p>Call or text {{ site.phone.display }}, or email us. Tell us about your home or business and what you need.</p></li>
      <li class="step"><h3>Get a free quote</h3><p>We’ll talk through your space and schedule and give you an honest, no-obligation quote with no hidden fees.</p></li>
      <li class="step"><h3>Enjoy the results</h3><p>We clean on the schedule that suits you (weekly, bi-weekly, monthly or one-time) with care in every detail.</p></li>
    </ol>
  </div>
</section>

<section class="section section--blush">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Client reviews</p>
      <h2>Trusted by Hartford County families and businesses</h2>
      <p class="lead">Rated {{ reviews.ratingValue }} out of 5 across {{ reviews.reviewCount }} {{ reviews.platform }} reviews.</p>
    </div>
    <div class="testimonial-grid">
      {%- for t in reviews.testimonials %}
      <figure class="testimonial">
        {{ stars(t.rating ~ " out of 5 stars") }}
        <blockquote><p>{{ t.text }}</p></blockquote>
        <figcaption>{{ t.author }}</figcaption>
      </figure>
      {%- endfor %}
    </div>
    <p class="section-foot"><a class="btn btn-outline" href="/reviews/">Read all reviews</a></p>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div>
      <p class="eyebrow">Service area</p>
      <h2>Proudly serving Hartford County</h2>
      <p class="lead">House cleaning, maid service and commercial cleaning in these towns and the surrounding communities.</p>
      <p class="section-foot"><a class="btn btn-outline" href="/service-area/">See our service area</a></p>
    </div>
    <ul class="town-chips" role="list">
      {%- for t in towns %}
      <li><a href="/service-area/#{{ t.slug }}">{{ icon("map-pin") }}{{ t.name }}</a></li>
      {%- endfor %}
    </ul>
  </div>
</section>

<section class="section section--linen">
  <div class="container split split--top">
    <div>
      <p class="eyebrow">Questions</p>
      <h2>Good to know</h2>
      <p class="lead">Quick answers to what clients ask us most.</p>
      <p class="section-foot"><a class="btn btn-outline" href="/faq/">All FAQs</a></p>
    </div>
    <div class="faq-list">
      {%- for f in faqs | selectattr("featured") %}
      <details class="faq-item"><summary>{{ f.q }}</summary><div class="faq-answer"><p>{{ f.a }}</p></div></details>
      {%- endfor %}
    </div>
  </div>
</section>
```

- [ ] **Step 12: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS. If a Nunjucks macro can't see `icon` inside `serviceCard`, add `{% from "partials/macros.njk" import icon %}` as the first line inside the `serviceCard` macro body and re-run.

- [ ] **Step 13: CHECKPOINT — owner reviews logo + home page**

Run: `npm run serve` (background), then open `http://localhost:8080/`.
Capture screenshots at 375px, 768px and 1280px widths; open and close the mobile drawer; tab through the header to confirm the Services dropdown opens on focus.
Show the owner the home page and `src/assets/brand/renatas-logo-horizontal-color.svg`. Note that inner-page links 404 until Tasks 5–6.
**Stop and wait for approval.** Apply requested visual changes (CSS or `PETALS` constants) before continuing; re-run `npm run check` after each change.

- [ ] **Step 14: Commit**

```bash
git add src/assets/css src/assets/js src/assets/icons src/_includes src/index.njk src/site.webmanifest tests/design-tokens.test.mjs tests/pages.test.mjs tests/links.test.mjs tests/content.test.mjs
git commit -m "feat: brand design system, site chrome and new home page"
```

---
### Task 4: Structured data (JSON-LD)

**Files:**
- Create: `src/_lib/schema.js`
- Modify: `eleventy.config.js` (register `buildSchema` Nunjucks global)
- Modify: `src/_includes/layouts/base.njk` (emit one JSON-LD block)
- Test: `tests/schema-lib.test.mjs`, `tests/schema.test.mjs`

**Interfaces:**
- Consumes: `jsonLd` (Task 1), page data `breadcrumbs`, `service`, `faqSchema` (Tasks 3, 5, 6)
- Produces:
  - `businessId(siteUrl) → "https://renatascleaning.com/#business"`, `websiteId(siteUrl)`
  - `localBusiness({ site, towns, reviews, services })`, `webSite(site)`, `breadcrumbList(site, crumbs)`, `serviceNode(site, service)`, `faqPage(site, faqs, pageUrl)`
  - `buildSchemaGraph({ site, towns, reviews, services, pageUrl, breadcrumbs?, service?, includeFaq?, faqs? }) → { "@context", "@graph" }` — throws if `site.url` is missing
  - Nunjucks global `buildSchema(input) → string` (escaped JSON)

- [ ] **Step 1: Write the failing unit tests**

```js file=tests/schema-lib.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "./helpers/site.mjs";
import {
  businessId, localBusiness, webSite, breadcrumbList, serviceNode, faqPage, buildSchemaGraph,
} from "../src/_lib/schema.js";

const site = readJson("src/_data/site.json");
const towns = readJson("src/_data/towns.json");
const reviews = readJson("src/_data/reviews.json");
const services = readJson("src/_data/services.json");
const faqs = readJson("src/_data/faqs.json");
const base = { site, towns, reviews, services };
const types = (graph) => graph["@graph"].map((node) => node["@type"]).flat();

test("business node carries identity, area, rating and catalog", () => {
  const b = localBusiness(base);
  assert.equal(b["@id"], "https://renatascleaning.com/#business");
  assert.equal(b.name, "Renata's Cleaning Service");
  assert.equal(b.telephone, "+18607965222");
  assert.equal(b.logo, "https://renatascleaning.com/assets/brand/renatas-mark-color-512.png");
  assert.equal(b.areaServed.length, towns.length);
  assert.equal(b.areaServed[1].name, "West Hartford, CT");
  assert.equal(b.aggregateRating.ratingValue, "4.6");
  assert.equal(b.aggregateRating.reviewCount, "11");
  assert.equal(b.review.length, 3);
  assert.equal(b.hasOfferCatalog.itemListElement.length, services.length);
  assert.equal(b.hasOfferCatalog.itemListElement[0].itemOffered.url, "https://renatascleaning.com/services/house-cleaning/");
});

test("website node is published by the business", () => {
  assert.deepEqual(webSite(site).publisher, { "@id": businessId(site.url) });
});

test("breadcrumbs start at Home and number from 1", () => {
  const list = breadcrumbList(site, [{ label: "Services", url: "/services/" }, { label: "Deep Cleaning", url: "/services/deep-cleaning/" }]);
  assert.deepEqual(list.itemListElement.map((i) => [i.position, i.name, i.item]), [
    [1, "Home", "https://renatascleaning.com/"],
    [2, "Services", "https://renatascleaning.com/services/"],
    [3, "Deep Cleaning", "https://renatascleaning.com/services/deep-cleaning/"],
  ]);
});

test("service node points at the business", () => {
  const node = serviceNode(site, services[0]);
  assert.equal(node.name, "House Cleaning");
  assert.equal(node.url, "https://renatascleaning.com/services/house-cleaning/");
  assert.deepEqual(node.provider, { "@id": businessId(site.url) });
});

test("faqPage maps questions and answers in order", () => {
  const node = faqPage(site, faqs, "/faq/");
  assert.deepEqual(node.mainEntity.map((q) => q.name), faqs.map((f) => f.q));
  assert.equal(node.mainEntity[0].acceptedAnswer.text, faqs[0].a);
});

test("graph includes optional nodes only when their data is present", () => {
  assert.deepEqual(types(buildSchemaGraph({ ...base, pageUrl: "/" })), ["HomeAndConstructionBusiness", "ProfessionalService", "WebSite"]);
  const faqGraph = buildSchemaGraph({ ...base, pageUrl: "/faq/", breadcrumbs: [{ label: "FAQ", url: "/faq/" }], includeFaq: true, faqs });
  assert.ok(types(faqGraph).includes("BreadcrumbList"));
  assert.ok(types(faqGraph).includes("FAQPage"));
  const notFaq = buildSchemaGraph({ ...base, pageUrl: "/", includeFaq: false, faqs });
  assert.ok(!types(notFaq).includes("FAQPage"));
  const svcGraph = buildSchemaGraph({ ...base, pageUrl: "/services/house-cleaning/", service: services[0] });
  assert.ok(types(svcGraph).includes("Service"));
});

test("graph fails fast without site data", () => {
  assert.throws(() => buildSchemaGraph({}), /site\.url/);
});
```

Run: `node --test tests/schema-lib.test.mjs`
Expected: FAIL — cannot find `src/_lib/schema.js`.

- [ ] **Step 2: Implement the builders**

```js file=src/_lib/schema.js
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
```

Run: `node --test tests/schema-lib.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 3: Write the failing built-site schema tests**

```js file=tests/schema.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, isIndexable, getJsonLdBlocks, getGraph, hasType, readJson, SITE_URL } from "./helpers/site.mjs";

const pages = loadPages();
const towns = readJson("src/_data/towns.json");
const BUSINESS_ID = `${SITE_URL}/#business`;
const HTML_ENTITY = /&(?:#\d+|#x[0-9a-f]+|[a-z]+);/i;

describe("structured data", () => {
  for (const page of pages) {
    test(`${page.url}: one JSON-LD block that parses and names the business exactly`, () => {
      const blocks = getJsonLdBlocks(page.html);
      assert.equal(blocks.length, 1);
      assert.doesNotMatch(blocks[0], HTML_ENTITY, "HTML entities leaked into JSON-LD");
      const business = getGraph(page.html).find((node) => node["@id"] === BUSINESS_ID);
      assert.ok(business, "business node missing");
      assert.equal(business.name, "Renata's Cleaning Service");
      assert.equal(business.telephone, "+18607965222");
      assert.equal(business.areaServed.length, towns.length);
    });
  }

  test("home has no breadcrumbs", () => {
    const home = pages.find((p) => p.url === "/");
    assert.ok(!getGraph(home.html).some((node) => hasType(node, "BreadcrumbList")));
  });

  for (const page of pages.filter((p) => p.url !== "/" && isIndexable(p))) {
    test(`${page.url}: breadcrumbs run from Home to this page`, () => {
      const crumbs = getGraph(page.html).find((node) => hasType(node, "BreadcrumbList"));
      assert.ok(crumbs, "BreadcrumbList missing");
      const items = crumbs.itemListElement;
      assert.equal(items[0].item, `${SITE_URL}/`);
      assert.equal(items.at(-1).item, `${SITE_URL}${page.url}`);
      items.forEach((item, i) => assert.equal(item.position, i + 1));
    });
  }
});
```

Run: `npm run build && node --test tests/schema.test.mjs`
Expected: FAIL — `one JSON-LD block … 0 !== 1`.

- [ ] **Step 4: Wire the global and the layout**

In `eleventy.config.js`, add the import and registration:

```js
import { buildSchemaGraph } from "./src/_lib/schema.js";
```

```js
  eleventyConfig.addNunjucksGlobal("buildSchema", (input) => jsonLd(buildSchemaGraph(input)));
```

(place the `addNunjucksGlobal` line directly after the `addFilter` calls).

In `src/_includes/layouts/base.njk`, insert directly after the stylesheet `{%- endfor %}` line:

```njk
  <script type="application/ld+json">{{ buildSchema({ "site": site, "towns": towns, "reviews": reviews, "services": services, "pageUrl": page.url, "breadcrumbs": breadcrumbs, "service": service, "includeFaq": faqSchema, "faqs": faqs }) | safe }}</script>
```

- [ ] **Step 5: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/_lib/schema.js eleventy.config.js src/_includes/layouts/base.njk tests/schema-lib.test.mjs tests/schema.test.mjs
git commit -m "feat: LocalBusiness, WebSite, breadcrumb, service and FAQ structured data"
```

---

### Task 5: Services hub and eight service pages

**Files:**
- Create: `src/_includes/layouts/service.njk`, `src/services/index.njk`, `src/services/service.njk`, `src/services/service.11tydata.js`
- Test: `tests/services.test.mjs`

**Interfaces:**
- Consumes: `services`, `serviceGroups`, `towns` data; `serviceBySlug`, `whereCategory` filters; `icon`, `serviceCard` macros; base layout contract (`title`, `description`, `breadcrumbs`) and the `service` variable read by `buildSchema`
- Produces: `/services/` and `/services/<slug>/` for all 8 slugs; each service page exposes `service` (pagination alias) to the layouts

- [ ] **Step 1: Write the failing tests**

```js file=tests/services.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  readJson, readSiteFile, siteFileExists, getTitle, getInnerTexts, visibleText, getGraph, hasType, SITE_URL,
} from "./helpers/site.mjs";

const services = readJson("src/_data/services.json");
const BUSINESS_ID = `${SITE_URL}/#business`;

test("the hub links to every service", () => {
  const hub = readSiteFile("services/index.html");
  services.forEach((s) => assert.ok(hub.includes(`href="/services/${s.slug}/"`), s.slug));
});

describe("service pages", () => {
  for (const s of services) {
    const rel = `services/${s.slug}/index.html`;

    test(`${s.slug}: page exists with its own title and h1`, () => {
      assert.ok(siteFileExists(rel));
      const html = readSiteFile(rel);
      assert.equal(getTitle(html), s.metaTitle);
      assert.deepEqual(getInnerTexts(html, "h1"), [s.h1]);
    });

    test(`${s.slug}: shows included items, FAQs and internal links`, () => {
      const html = readSiteFile(rel);
      const text = visibleText(html);
      s.included.forEach((item) => assert.ok(text.includes(item), item));
      const summaries = getInnerTexts(html, "summary");
      s.faqs.forEach((f) => assert.ok(summaries.includes(f.q), f.q));
      s.related.forEach((slug) => assert.ok(html.includes(`href="/services/${slug}/"`), `related ${slug}`));
      assert.ok(html.includes('href="/service-area/"'));
      assert.ok(html.includes('href="/contact/"'));
    });

    test(`${s.slug}: Service schema points at the business`, () => {
      const node = getGraph(readSiteFile(rel)).find((n) => hasType(n, "Service"));
      assert.ok(node, "Service node missing");
      assert.equal(node.name, s.name);
      assert.deepEqual(node.provider, { "@id": BUSINESS_ID });
    });
  }
});
```

Run: `npm run build && node --test tests/services.test.mjs`
Expected: FAIL — `ENOENT … services/index.html`.

- [ ] **Step 2: Service layout**

```njk file=src/_includes/layouts/service.njk
---
layout: layouts/base.njk
---
{% from "partials/macros.njk" import icon, serviceCard %}
{%- set categoryLabels = { "residential": "Residential cleaning", "commercial": "Commercial cleaning", "specialty": "Specialty cleaning" } %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">{{ categoryLabels[service.category] }}</p>
    <h1>{{ service.h1 }}</h1>
    <p class="lead">{{ service.summary }}</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="tel:{{ site.phone.tel }}">{{ icon("phone") }}Call {{ site.phone.display }}</a>
      <a class="btn btn-outline" href="/contact/">Get a free quote</a>
    </div>
  </div>
</section>

<div class="section">
  <div class="container service-layout">
    <div class="service-main">
      <div class="prose">
        {%- for paragraph in service.intro %}
        <p>{{ paragraph }}</p>
        {%- endfor %}
      </div>

      <section class="included-card" aria-labelledby="included-title">
        <h2 id="included-title">What’s included</h2>
        <ul class="checklist checklist--columns" role="list">
          {%- for item in service.included %}
          <li>{{ icon("check") }}<span>{{ item }}</span></li>
          {%- endfor %}
        </ul>
      </section>

      <section aria-labelledby="ideal-title">
        <h2 id="ideal-title">Ideal for</h2>
        <ul class="checklist" role="list">
          {%- for item in service.idealFor %}
          <li>{{ icon("check") }}<span>{{ item }}</span></li>
          {%- endfor %}
        </ul>
      </section>

      {%- if service.scheduling %}
      <section class="schedule-note" aria-labelledby="schedule-title">
        {{ icon("calendar") }}
        <div>
          <h2 id="schedule-title">Scheduling</h2>
          <p>{{ service.scheduling }}</p>
        </div>
      </section>
      {%- endif %}

      <section aria-labelledby="service-faq-title">
        <h2 id="service-faq-title">{{ service.name }} questions</h2>
        <div class="faq-list">
          {%- for f in service.faqs %}
          <details class="faq-item"><summary>{{ f.q }}</summary><div class="faq-answer"><p>{{ f.a }}</p></div></details>
          {%- endfor %}
        </div>
      </section>
    </div>

    <aside class="aside-card" aria-labelledby="quote-title">
      <h2 id="quote-title">Free, no-obligation quote</h2>
      <p>Tell us about your space and schedule. Call or text anytime, or email us and we’ll reply within 24 hours.</p>
      <ul class="aside-contact" role="list">
        <li><a href="tel:{{ site.phone.tel }}">{{ icon("phone") }}{{ site.phone.display }}</a></li>
        <li><a href="sms:{{ site.phone.sms }}">{{ icon("message") }}Text us</a></li>
        <li><a href="mailto:{{ site.email }}">{{ icon("mail") }}{{ site.email }}</a></li>
      </ul>
      <ul class="checklist" role="list">
        <li>{{ icon("award") }}<span>25+ years of experience</span></li>
        <li>{{ icon("shield") }}<span>Fully insured &amp; bonded</span></li>
        <li>{{ icon("heart") }}<span>Family-owned &amp; operated</span></li>
      </ul>
    </aside>
  </div>
</div>

<section class="section section--linen" aria-labelledby="related-title">
  <div class="container">
    <div class="section-head">
      <h2 id="related-title">Related services</h2>
    </div>
    <div class="card-grid">
      {%- for slug in service.related %}{{ serviceCard(services | serviceBySlug(slug)) }}{% endfor %}
    </div>
    <p class="area-line">{{ icon("map-pin") }}<span>{{ service.name }} is available in
      {%- for t in towns %} <a href="/service-area/#{{ t.slug }}">{{ t.name }}</a>{{ "," if not loop.last }}{% endfor %}
      and surrounding {{ site.county }} towns. <a href="/service-area/">See our full service area</a>.</span></p>
  </div>
</section>
```

- [ ] **Step 3: Paginated template, computed data, and hub**

```njk file=src/services/service.njk
---
pagination:
  data: services
  size: 1
  alias: service
permalink: "/services/{{ service.slug }}/"
layout: layouts/service.njk
---
```

```js file=src/services/service.11tydata.js
// Computed with functions (not Nunjucks strings) so apostrophes are never HTML-escaped into data.
export default {
  eleventyComputed: {
    title: (data) => data.service?.metaTitle,
    description: (data) => data.service?.metaDescription,
    breadcrumbs: (data) => [
      { label: "Services", url: "/services/" },
      { label: data.service?.name, url: `/services/${data.service?.slug}/` },
    ],
  },
};
```

```njk file=src/services/index.njk
---
layout: layouts/base.njk
title: "Cleaning Services in Hartford County, CT | Renata's"
description: "Residential and commercial cleaning in Hartford County, CT: house, office, deep, move-out, condo, window, carpet and post-construction cleaning."
breadcrumbs:
  - label: Services
    url: /services/
---
{% from "partials/macros.njk" import serviceCard %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Our services</p>
    <h1>Cleaning Services in Hartford County, CT</h1>
    <p class="lead">Residential and commercial cleaning with the same meticulous standard. Every service is quoted free, based on your space and your schedule.</p>
  </div>
</section>
{%- for group in serviceGroups %}
<section class="section{% if loop.index % 2 == 0 %} section--linen{% endif %}" aria-labelledby="group-{{ group.key }}">
  <div class="container">
    <div class="section-head">
      <h2 id="group-{{ group.key }}">{{ group.label }}</h2>
      <p class="lead">{{ group.intro }}</p>
    </div>
    <div class="card-grid">
      {%- for s in services | whereCategory(group.key) %}{{ serviceCard(s) }}{% endfor %}
    </div>
  </div>
</section>
{%- endfor %}
```

- [ ] **Step 4: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS (including `pages.test.mjs` title/description checks and `schema.test.mjs` breadcrumbs for the 9 new pages).
If `title` is undefined on service pages, Eleventy did not expose the pagination alias to the template data file's computed functions. Fallback: delete `service.11tydata.js` and add to `service.njk` front matter

```yaml
eleventyComputed:
  title: "{{ service.metaTitle | safe }}"
  description: "{{ service.metaDescription | safe }}"
  breadcrumbs:
    - label: Services
      url: /services/
    - label: "{{ service.name | safe }}"
      url: "/services/{{ service.slug }}/"
```

then re-run `npm run check`; `pages.test.mjs` (`og:title === <title>`) and `schema.test.mjs` (no entities in JSON-LD) confirm apostrophes survive.

- [ ] **Step 5: Commit**

```bash
git add src/_includes/layouts/service.njk src/services tests/services.test.mjs
git commit -m "feat: services hub and eight service landing pages"
```

---

### Task 6: About, Reviews, FAQ, Contact, Service Area and 404 pages

**Files:**
- Create: `src/about.njk`, `src/reviews.njk`, `src/faq.njk`, `src/contact.njk`, `src/service-area.njk`, `src/404.njk`
- Test: `tests/not-found.test.mjs`, `tests/pages-content.test.mjs`, `tests/faq-schema.test.mjs`, `tests/link-targets.test.mjs`

**Interfaces:**
- Consumes: base layout contract (`title`, `description`, `breadcrumbs`, `noindex`, `hideCta`, `faqSchema`, `eleventyExcludeFromCollections`); macros; `logoMark`
- Produces: `/about/`, `/reviews/`, `/faq/` (with `FAQPage`), `/contact/` (no CTA band), `/service-area/` (a `#<town-slug>` anchor per town), `/404.html` (noindex, excluded from collections)

- [ ] **Step 1: Write the failing tests**

```js file=tests/not-found.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { siteFileExists, readSiteFile, getMetaContent, getCanonical } from "./helpers/site.mjs";

test("404.html exists at the root (otherwise Cloudflare Pages serves / for unknown URLs)", () => {
  assert.ok(siteFileExists("404.html"));
});

test("404 page is noindex and has no canonical", () => {
  const html = readSiteFile("404.html");
  assert.equal(getMetaContent(html, "name", "robots"), "noindex, follow");
  assert.equal(getCanonical(html), null);
});

test("404 page links back to home, services and contact", () => {
  const html = readSiteFile("404.html");
  ['href="/"', 'href="/services/"', 'href="/contact/"'].forEach((href) => assert.ok(html.includes(href), href));
});
```

```js file=tests/pages-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson, readSiteFile, getIds, getInnerTexts, visibleText } from "./helpers/site.mjs";

const site = readJson("src/_data/site.json");
const towns = readJson("src/_data/towns.json");
const reviews = readJson("src/_data/reviews.json");
const faqs = readJson("src/_data/faqs.json");

test("service area has an anchor card for every town", () => {
  const ids = getIds(readSiteFile("service-area/index.html"));
  towns.forEach((t) => assert.ok(ids.has(t.slug), t.slug));
});

test("reviews page shows every testimonial and links to Google", () => {
  const html = readSiteFile("reviews/index.html");
  const text = visibleText(html);
  reviews.testimonials.forEach((t) => assert.ok(text.includes(t.author), t.author));
  assert.ok(html.includes(`href="${site.reviewUrl}"`));
});

test("contact page offers call, text and email", () => {
  const html = readSiteFile("contact/index.html");
  [`href="tel:${site.phone.tel}"`, `href="sms:${site.phone.sms}"`, `href="mailto:${site.email}"`]
    .forEach((href) => assert.ok(html.includes(href), href));
});

test("contact page skips the CTA band", () => {
  assert.ok(!readSiteFile("contact/index.html").includes('id="cta-title"'));
});

test("FAQ page lists every FAQ in order", () => {
  assert.deepEqual(getInnerTexts(readSiteFile("faq/index.html"), "summary"), faqs.map((f) => f.q));
});

test("about page states the core facts", () => {
  const text = visibleText(readSiteFile("about/index.html"));
  ["25 years", "Family-owned", "insured", "bonded"].forEach((fact) => assert.ok(text.includes(fact), fact));
});
```

```js file=tests/faq-schema.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPages, readSiteFile, getGraph, getInnerTexts, hasType, readJson } from "./helpers/site.mjs";

const faqs = readJson("src/_data/faqs.json");

test("FAQPage schema appears only on /faq/", () => {
  for (const page of loadPages()) {
    const hasFaq = getGraph(page.html).some((node) => hasType(node, "FAQPage"));
    assert.equal(hasFaq, page.url === "/faq/", page.url);
  }
});

test("FAQPage schema matches the visible FAQ exactly", () => {
  const html = readSiteFile("faq/index.html");
  const faq = getGraph(html).find((node) => hasType(node, "FAQPage"));
  assert.deepEqual(faq.mainEntity.map((q) => q.name), getInnerTexts(html, "summary"));
  assert.deepEqual(faq.mainEntity.map((q) => q.acceptedAnswer.text), faqs.map((f) => f.a));
});
```

```js file=tests/link-targets.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, getInternalRefs, getIds, resolveToFile, siteFileExists } from "./helpers/site.mjs";

const pages = loadPages();
const idsByFile = new Map(pages.map((p) => [p.rel, getIds(p.html)]));

describe("internal link targets exist", () => {
  for (const page of pages) {
    test(`${page.url}: every internal link and fragment resolves`, () => {
      for (const ref of getInternalRefs(page.html)) {
        const [pathAndQuery, fragment] = ref.split("#");
        const target = pathAndQuery ? resolveToFile(pathAndQuery) : page.rel;
        assert.ok(siteFileExists(target), `${ref} → ${target} missing`);
        if (fragment && target.endsWith(".html")) {
          assert.ok(idsByFile.get(target)?.has(fragment), `#${fragment} missing in ${target}`);
        }
      }
    });
  }
});
```

Run: `npm run build && node --test tests/not-found.test.mjs tests/pages-content.test.mjs tests/faq-schema.test.mjs tests/link-targets.test.mjs`
Expected: FAIL — missing pages.

- [ ] **Step 2: Create the pages**

```njk file=src/about.njk
---
layout: layouts/base.njk
title: "About Renata's Cleaning Service | Hartford County, CT"
description: "Family-owned and operated for 25+ years, Renata's Cleaning Service cleans homes and businesses across Hartford County, CT. Insured & bonded."
breadcrumbs:
  - label: About
    url: /about/
---
{% from "partials/macros.njk" import icon, stars %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Our story</p>
    <h1>About Renata’s Cleaning Service</h1>
    <p class="lead">Family-owned and operated, caring for Hartford County homes and businesses for more than 25 years.</p>
  </div>
</section>

<section class="section">
  <div class="container split split--top">
    <div class="prose">
      <p>For over 25 years, Renata’s Cleaning Service has been bringing spotless homes and offices to Hartford County and the surrounding Connecticut communities. What started as a passion for creating clean, healthy spaces has grown into a trusted business built on dedication, reliability and an unwavering commitment to excellence.</p>
      <p>Our team takes pride in treating every home and business as if it were our own. We believe cleaning isn’t just about appearances; it’s about creating environments where families thrive and businesses succeed. That’s why we go beyond surface cleaning to deliver thorough, detail-oriented service that makes a real difference.</p>
      <p>When you choose Renata’s, you’re choosing a team that genuinely cares about your space and your satisfaction.</p>
    </div>
    <ul class="highlight-card" role="list">
      <li class="highlight"><span class="icon-badge">{{ icon("award") }}</span>Over 25 years of trusted service</li>
      <li class="highlight"><span class="icon-badge">{{ icon("heart") }}</span>Family-owned &amp; operated</li>
      <li class="highlight"><span class="icon-badge">{{ icon("shield") }}</span>Fully insured &amp; bonded</li>
      <li class="highlight"><span class="icon-badge">{{ icon("sparkle") }}</span>Meticulous attention to detail</li>
    </ul>
  </div>
</section>

<section class="section section--linen">
  <div class="container split split--top">
    <div>
      <p class="eyebrow">Our standards</p>
      <h2>How we take care of your space</h2>
    </div>
    <ul class="checklist" role="list">
      <li>{{ icon("check") }}<span>We move objects to clean beneath them and never just dust around them.</span></li>
      <li>{{ icon("check") }}<span>We put everything back in an organized way.</span></li>
      <li>{{ icon("check") }}<span>We arrive on time and stay responsive to your requests.</span></li>
      <li>{{ icon("check") }}<span>We bring our own professional-grade supplies, or use yours if you prefer.</span></li>
      <li>{{ icon("check") }}<span>We’re flexible when life happens: call or text to reschedule.</span></li>
      <li>{{ icon("check") }}<span>We’re fully insured and bonded, so your home or business is protected.</span></li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    {%- set spotlight = reviews.testimonials[1] %}
    <figure class="testimonial testimonial--feature">
      {{ stars(spotlight.rating ~ " out of 5 stars") }}
      <blockquote><p>{{ spotlight.text }}</p></blockquote>
      <figcaption>{{ spotlight.author }}, {{ reviews.platform }} review</figcaption>
    </figure>
  </div>
</section>
```

```njk file=src/reviews.njk
---
layout: layouts/base.njk
title: "Reviews | Renata's Cleaning Service, Hartford County CT"
description: "Read what Hartford County clients say about Renata's Cleaning Service, rated 4.6 on Google. Meticulous, reliable house and office cleaning."
breadcrumbs:
  - label: Reviews
    url: /reviews/
---
{% from "partials/macros.njk" import stars %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Client reviews</p>
    <h1>What Our Clients Say</h1>
    <p class="lead">Real reviews from homeowners and businesses across {{ site.county }}.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="rating-summary">
      <span class="rating-score">{{ reviews.ratingValue }}</span>
      <div class="rating-meta">
        {{ stars("Rated " ~ reviews.ratingValue ~ " out of 5") }}
        <span>Average from {{ reviews.reviewCount }} {{ reviews.platform }} reviews</span>
      </div>
      <a class="btn btn-primary" href="{{ site.reviewUrl }}" target="_blank" rel="noopener noreferrer">Leave us a Google review<span class="visually-hidden"> (opens in a new tab)</span></a>
    </div>
    <div class="testimonial-grid">
      {%- for t in reviews.testimonials %}
      <figure class="testimonial">
        {{ stars(t.rating ~ " out of 5 stars") }}
        <blockquote><p>{{ t.text }}</p></blockquote>
        <figcaption>{{ t.author }}</figcaption>
      </figure>
      {%- endfor %}
    </div>
  </div>
</section>
```

```njk file=src/faq.njk
---
layout: layouts/base.njk
title: "Cleaning Service FAQ | Renata's Cleaning Service"
description: "Answers about supplies, insurance, scheduling, service areas and what our house and office cleaning includes. Free quotes: (860) 796-5222."
faqSchema: true
breadcrumbs:
  - label: FAQ
    url: /faq/
---
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Good questions</p>
    <h1>Frequently Asked Questions</h1>
    <p class="lead">How we work, what’s included and how to book. Don’t see your question? Call or text {{ site.phone.display }}.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="faq-list">
      {%- for f in faqs %}
      <details class="faq-item" id="{{ f.id }}"><summary>{{ f.q }}</summary><div class="faq-answer"><p>{{ f.a }}</p></div></details>
      {%- endfor %}
    </div>
  </div>
</section>
```

```njk file=src/contact.njk
---
layout: layouts/base.njk
title: "Contact Us for a Free Cleaning Quote | Renata's"
description: "Call or text (860) 796-5222 or email Renata@renatascleaning.com for a free, no-obligation cleaning quote anywhere in Hartford County, CT."
hideCta: true
breadcrumbs:
  - label: Contact
    url: /contact/
---
{% from "partials/macros.njk" import icon %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Free quotes</p>
    <h1>Get a Free Cleaning Quote</h1>
    <p class="lead">Call, text or email, whichever is easiest. Quotes are free and there’s no obligation.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="contact-grid">
      <a class="contact-card" href="tel:{{ site.phone.tel }}">
        <span class="icon-badge">{{ icon("phone") }}</span>
        <h2>Call</h2>
        <span class="contact-value">{{ site.phone.display }}</span>
        <span class="contact-note">Call anytime</span>
      </a>
      <a class="contact-card" href="sms:{{ site.phone.sms }}">
        <span class="icon-badge">{{ icon("message") }}</span>
        <h2>Text</h2>
        <span class="contact-value">{{ site.phone.display }}</span>
        <span class="contact-note">Text us for a quick response</span>
      </a>
      <a class="contact-card" href="mailto:{{ site.email }}">
        <span class="icon-badge">{{ icon("mail") }}</span>
        <h2>Email</h2>
        <span class="contact-value">{{ site.email }}</span>
        <span class="contact-note">We reply within 24 hours</span>
      </a>
    </div>
    <div class="split split--top">
      <div class="stack">
        <h2>Help us quote accurately</h2>
        <p class="lead">When you reach out, it helps to mention:</p>
        <ul class="checklist" role="list">
          <li>{{ icon("check") }}<span>The type of cleaning you need: house, office, deep clean, move-out and so on</span></li>
          <li>{{ icon("check") }}<span>Your town</span></li>
          <li>{{ icon("check") }}<span>The approximate size of your home or business</span></li>
          <li>{{ icon("check") }}<span>How often you’d like cleaning: weekly, bi-weekly, monthly or one-time</span></li>
        </ul>
      </div>
      <div class="stack">
        <h2>Where we clean</h2>
        <p class="lead">Homes and businesses across {{ site.county }} and the surrounding communities.</p>
        <ul class="town-chips" role="list">
          {%- for t in towns %}
          <li><a href="/service-area/#{{ t.slug }}">{{ icon("map-pin") }}{{ t.name }}</a></li>
          {%- endfor %}
        </ul>
      </div>
    </div>
  </div>
</section>
```

```njk file=src/service-area.njk
---
layout: layouts/base.njk
title: "Cleaning Service Area: Hartford County, CT | Renata's"
description: "House and office cleaning in Hartford, West Hartford, Farmington, Avon, Simsbury, Glastonbury, Manchester and more of Hartford County, CT."
breadcrumbs:
  - label: Service Area
    url: /service-area/
---
{% from "partials/macros.njk" import icon %}
<section class="page-hero">
  <div class="container">
    <p class="eyebrow">Service area</p>
    <h1>Cleaning Services Across Hartford County, CT</h1>
    <p class="lead">We clean homes and businesses in {{ towns | length }} {{ site.county }} towns and the surrounding communities. Not sure if we reach you? Just ask.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="tel:{{ site.phone.tel }}">{{ icon("phone") }}Call {{ site.phone.display }}</a>
      <a class="btn btn-outline" href="/contact/">Get a free quote</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="town-grid">
      {%- for t in towns %}
      <article class="town-card" id="{{ t.slug }}">
        <h2>{{ icon("map-pin") }}{{ t.name }}</h2>
        <p>{{ t.note }}</p>
      </article>
      {%- endfor %}
    </div>
  </div>
</section>

<section class="section section--linen">
  <div class="container">
    <div class="section-head">
      <h2>Services across our service area</h2>
      <p class="lead">Every service is quoted free for your space and schedule.</p>
    </div>
    <ul class="town-chips" role="list">
      {%- for s in services %}
      <li><a href="/services/{{ s.slug }}/">{{ icon(s.icon) }}{{ s.name }}</a></li>
      {%- endfor %}
    </ul>
  </div>
</section>
```

```njk file=src/404.njk
---
layout: layouts/base.njk
permalink: /404.html
title: "Page Not Found | Renata's Cleaning Service"
description: "The page you were looking for could not be found. Explore our cleaning services or contact Renata's Cleaning Service for a free quote."
noindex: true
eleventyExcludeFromCollections: true
---
{% from "partials/logo-mark.njk" import logoMark %}
<section class="section not-found">
  <div class="container narrow">
    {{ logoMark() }}
    <h1>We couldn’t find that page</h1>
    <p class="lead">The page may have moved. These links will get you back on track.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="/">Home</a>
      <a class="btn btn-outline" href="/services/">Our services</a>
      <a class="btn btn-outline" href="/contact/">Contact us</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS. `link-targets.test.mjs` fails only for `/sitemap.xml` or `/robots.txt` if some page links them (none should); fix any other missing target at its source.

- [ ] **Step 4: Commit**

```bash
git add src/about.njk src/reviews.njk src/faq.njk src/contact.njk src/service-area.njk src/404.njk tests/not-found.test.mjs tests/pages-content.test.mjs tests/faq-schema.test.mjs tests/link-targets.test.mjs
git commit -m "feat: about, reviews, FAQ, contact, service area and 404 pages"
```

---

### Task 7: Sitemap, robots, Cloudflare headers; retire GitHub Pages

**Files:**
- Create: `src/sitemap.njk`, `src/robots.txt`, `src/_headers`
- Delete: `index.html`, `robots.txt`, `sitemap.xml`, `CNAME`, `.github/workflows/static.yml` (repo root)
- Test: `tests/seo-assets.test.mjs`

**Interfaces:**
- Consumes: `sitemapPages`, `absoluteUrl`, `isoDate` filters; `buildDate`; `site.webmanifest` (Task 3); icons (Task 2)
- Produces: `/sitemap.xml`, `/robots.txt`, `/_headers` in `_site/`

- [ ] **Step 1: Write the failing tests**

```js file=tests/seo-assets.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { loadPages, isIndexable, readSiteFile, siteFileExists, SITE_URL } from "./helpers/site.mjs";

const IMMUTABLE = "Cache-Control: public, max-age=31536000, immutable";

function headerRules(text) {
  const rules = new Map();
  let current = null;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\S/.test(line)) {
      current = trimmed;
      rules.set(current, []);
    } else if (current) {
      rules.get(current).push(trimmed);
    }
  }
  return rules;
}

test("sitemap lists exactly the indexable pages", () => {
  const xml = readSiteFile("sitemap.xml");
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const expected = loadPages().filter(isIndexable).map((p) => `${SITE_URL}${p.url}`).sort();
  assert.deepEqual(locs, expected);
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test("robots.txt allows crawling and points at the sitemap", () => {
  const txt = readSiteFile("robots.txt");
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, /^Allow: \/$/m);
  assert.doesNotMatch(txt, /^Disallow: \/\s*$/m);
  assert.ok(txt.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
});

test("web manifest parses and its icons exist", () => {
  const manifest = JSON.parse(readSiteFile("site.webmanifest"));
  assert.equal(manifest.theme_color, "#C41E3A");
  manifest.icons.forEach((icon) => assert.ok(siteFileExists(icon.src), icon.src));
});

test("_headers sets security headers on every path", () => {
  const all = headerRules(readSiteFile("_headers")).get("/*") ?? [];
  assert.ok(all.includes("X-Frame-Options: DENY"));
  assert.ok(all.some((h) => h.startsWith("Permissions-Policy:")));
});

test("_headers caches only content-hashed assets immutably", () => {
  const rules = headerRules(readSiteFile("_headers"));
  ["/assets/css/*", "/assets/js/*", "/assets/icons/*"].forEach((path) => {
    assert.ok(rules.get(path)?.includes(IMMUTABLE), path);
  });
  assert.ok(!rules.has("/assets/*"), "never mark all of /assets/ immutable");
  assert.ok(!(rules.get("/assets/brand/*") ?? []).some((h) => h.includes("immutable")));
});

test("_headers keeps *.pages.dev out of search results", () => {
  const rule = headerRules(readSiteFile("_headers")).get("https://:project.pages.dev/*") ?? [];
  assert.ok(rule.includes("X-Robots-Tag: noindex"));
});

test("GitHub Pages leftovers are gone from the repo root", () => {
  ["CNAME", ".github/workflows/static.yml", "index.html", "sitemap.xml", "robots.txt"].forEach((file) => {
    assert.ok(!existsSync(file), `${file} should be deleted`);
  });
});
```

Run: `npm run build && node --test tests/seo-assets.test.mjs`
Expected: FAIL — `ENOENT … sitemap.xml`.

- [ ] **Step 2: Create the crawl and hosting files**

```njk file=src/sitemap.njk
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for item in collections.all | sitemapPages %}
  <url>
    <loc>{{ item.url | absoluteUrl(site.url) }}</loc>
    <lastmod>{{ buildDate | isoDate }}</lastmod>
  </url>
{%- endfor %}
</urlset>
```

```text file=src/robots.txt
User-agent: *
Allow: /

Sitemap: https://renatascleaning.com/sitemap.xml
```

```text file=src/_headers
# Cloudflare Pages response headers. Pages already adds X-Content-Type-Options and Referrer-Policy.
/*
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

# Content-hashed via ?v= in templates, so safe to cache for a year.
/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/assets/icons/*
  Cache-Control: public, max-age=31536000, immutable

# Not hashed (linked from schema and shared externally), so cache for a day.
/assets/brand/*
  Cache-Control: public, max-age=86400

# Only the custom domain should be indexed.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
```

- [ ] **Step 3: Retire the GitHub Pages setup**

Run: `git rm index.html robots.txt sitemap.xml CNAME .github/workflows/static.yml`
Expected: five files staged for deletion.

- [ ] **Step 4: Build and run all tests**

Run: `npm run check`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sitemap.njk src/robots.txt src/_headers tests/seo-assets.test.mjs
git commit -m "feat: sitemap, robots and Cloudflare headers; retire GitHub Pages deploy"
```

---
### Task 8: Browser verification, Lighthouse and code review

**Files:**
- Modify: any file with a defect found below (CSS most likely)
- Test: existing suites; manual browser checks; Lighthouse JSON in the scratchpad (not committed)

**Interfaces:**
- Consumes: the complete site from Tasks 1–7
- Produces: a verified branch ready for owner copy review

- [ ] **Step 1: Full check**

Run: `npm run check`
Expected: all tests PASS. Paste the final `# pass` / `# fail` lines into the task notes.

- [ ] **Step 2: Responsive and interaction checks in Chrome**

Run `npm run serve` in the background. For each of `/`, `/services/house-cleaning/`, `/services/`, `/faq/`, `/contact/`, `/service-area/`, `/404.html` at widths 375, 768 and 1280:
- Evaluate `document.documentElement.scrollWidth <= window.innerWidth` → must be `true` (no horizontal scroll).
- Screenshot above the fold and at the footer.

Interaction checks:
- 375px: tap the menu button → drawer slides in, backdrop appears, body stops scrolling; Escape closes and returns focus to the button; tapping a link closes the drawer.
- 1280px: hover and keyboard-focus "Services" → dropdown shows all 8 services; header stays on one line; the phone button shows the number.
- 1100–1279px: header on one line; phone button collapses to icon only.
- Keyboard: Tab from page load → the skip link appears first; focus rings are visible on every link and button.
Fix any defect, re-run `npm run check`.

- [ ] **Step 3: Lighthouse (mobile)**

Run for `/` and `/services/house-cleaning/`:

```bash
npx --yes lighthouse@12 http://localhost:8080/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$SCRATCH/lh-home.json" --chrome-flags="--headless=new" --quiet
node -e 'const r=require(process.argv[1]);for(const[k,v]of Object.entries(r.categories))console.log(k,Math.round(v.score*100))' "$SCRATCH/lh-home.json"
```

Expected: each category ≥ 95. If Best Practices is held below 95 only by third-party cookies from the Google Ads tag, record that as accepted (the tag is required). Fix anything else and re-run.

- [ ] **Step 4: Whole-branch code review**

Dispatch a fresh reviewer (superpowers:requesting-code-review) over `git diff main...redesign` with the spec and this plan. Fix every Critical and Important finding; re-run `npm run check` after fixes.

- [ ] **Step 5: Commit fixes**

```bash
git add -A src tests eleventy.config.js
git commit -m "fix: address verification and review findings"
```

---

### Task 9: Brand guidelines document

**Files:**
- None in the repo (hosted, shareable document); logo files it references already exist in `src/assets/brand/`

**Interfaces:**
- Consumes: `src/_data/brand.json`, generated logo SVG/PNGs, `scripts/brand/geometry.mjs` constants, spec §4
- Produces: a published brand guidelines URL (recorded for Task 10)

- [ ] **Step 1: Choose the document type**

Call the Artifact tool with `action: "quickstart"`, `intent: "document"`, and follow its routing (a Docs type or docs skill if offered; otherwise the `artifact-design` skill for a single self-contained HTML page).

- [ ] **Step 2: Write the guidelines with these sections and exact values**

1. **Brand story & positioning** — family-owned, 25+ years, Hartford County; tagline "Pure Elegance in Every Detail"; promise: meticulous, reliable, insured & bonded.
2. **Voice & tone** — warm, precise, reassuring, local. Do: "We move things to clean beneath them, not around them." Don't: "Best cleaners in the universe!!!" Do: concrete facts (25+ years, insured & bonded). Don't: unverifiable claims, prices, exclamation-heavy copy, jargon.
3. **Logo** — horizontal, stacked, mark-only; versions color / reversed / ink / white; embed the SVGs. Construction: 4 main petals (Crimson), 4 diagonal petals (Garnet), vein cut-outs, Pollen center, on a 200-unit grid. Clear space: the length of one main petal (40% of the mark's height) on every side. Minimum size: mark 16px / 0.25in; horizontal lockup 140px / 1.25in wide. Small-size variant (no veins) for favicons and app icons.
4. **Logo misuse** — don't recolor outside the palette, add gradients, shadows or outlines, stretch, rotate, rearrange the lockup, reset the wordmark in another font, or place the full-color logo on crimson/garnet or busy backgrounds (use reversed).
5. **Color** — the 8 swatches from `brand.json` with name, hex, RGB, approximate CMYK (label "approximate: confirm with a printed proof"), role; the contrast table from spec §4.2; the rule "Pollen Gold is for graphics and large text only".
6. **Typography** — Cormorant Garamond 500/600/700 + italic 500 for headings and the wordmark; Jost 400/500/600 for body and UI; eyebrow style (Jost 500, uppercase, 0.18em tracking, Crimson); fluid scale from `tokens.css`; pairing sample.
7. **Iconography & motif** — 24px line icons, 1.75 stroke, round caps; the petal as a sparing decorative motif; the arched-window hero frame.
8. **UI components** — primary / outline / light buttons, service card, CTA band (colors and radii from `tokens.css`).
9. **Photography** — natural light, real team and real spaces (with client permission), warm neutral interiors, no staged stock or visible logos of other brands.
10. **Applications** — business card (3.5×2in: front horizontal color lockup on Magnolia; back Crimson with reversed stacked lockup, phone and email in Jost); vehicle/yard sign (reversed stacked lockup on Crimson, phone number in Jost Medium at maximum size).
11. **Asset list** — every file in `src/assets/brand/` plus favicons and `og-image.png`, with what each is for.

- [ ] **Step 3: Publish and record the URL**

Publish (private by default), open it for the owner, and note the URL for Task 10.

---

### Task 10: Project docs and Cloudflare cutover checklist

**Files:**
- Modify: `CLAUDE.md`, `README.md` (full rewrites)

**Interfaces:**
- Consumes: brand guidelines URL (Task 9)
- Produces: accurate onboarding docs; the owner's Cloudflare cutover checklist

- [ ] **Step 1: Rewrite CLAUDE.md**

Replace `<BRAND_GUIDELINES_URL>` with the Task 9 URL.

````markdown file=CLAUDE.md
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-page static website for **Renata's Cleaning Service**, a family-owned residential and commercial cleaning company in Hartford County, CT. Live at `renatascleaning.com`, hosted on Cloudflare Pages.

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

Cloudflare Pages builds every push: build command `npm run build && npm test`, output `_site`, Node from `.nvmrc`. A failing test blocks the deploy. Non-`main` branches get preview URLs (auto-noindexed).

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
- Brand guidelines: <BRAND_GUIDELINES_URL>

## Rules

- No pricing anywhere; tests fail on `$` followed by a digit.
- Copy only states facts the owner has confirmed (spec §2: `docs/superpowers/specs/2026-09-29-site-redesign-design.md`).
- Titles ≤ 60 chars, descriptions 120–160 chars, exactly one `<h1>` per page, internal links end in `/`.
- The FAQPage schema is generated from `faqs.json`, so the visible FAQ and schema cannot drift.
- `src/404.njk` must keep producing `/404.html`; without it Cloudflare Pages serves the home page for every unknown URL.
````

- [ ] **Step 2: Rewrite README.md**

````markdown file=README.md
# Renata's Cleaning Service — renatascleaning.com

Website for Renata's Cleaning Service, a family-owned residential and commercial cleaning company serving Hartford County, Connecticut for more than 25 years.

- **Stack:** Eleventy 3 (static HTML), vanilla CSS/JS, Node's built-in test runner
- **Hosting:** Cloudflare Pages
- **Brand guidelines:** <BRAND_GUIDELINES_URL>

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
````

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document the Eleventy site, brand assets and Cloudflare cutover"
```

- [ ] **Step 4: Hand off**

Tell the owner: branch `redesign` is ready; list anything accepted as a known limitation (e.g., Best Practices score held by the Ads tag); ask them to review the new service-page copy before merging; point them to the README cutover checklist and the brand guidelines URL.
