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
  assert.equal(manifest.theme_color, "#9A9AEB");
  manifest.icons.forEach((icon) => assert.ok(siteFileExists(icon.src), icon.src));
});

test("_headers sets security headers on every path", () => {
  const all = headerRules(readSiteFile("_headers")).get("/*") ?? [];
  assert.ok(all.includes("X-Frame-Options: DENY"));
  assert.ok(all.some((h) => h.startsWith("Permissions-Policy:")));
  assert.ok(all.includes("Referrer-Policy: strict-origin-when-cross-origin"));
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
