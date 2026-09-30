import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, findTags, siteFileExists, readSiteFile } from "./helpers/site.mjs";

const pages = loadPages();
const FONT_FILES = ["cormorant-garamond-latin.woff2", "cormorant-garamond-italic-latin.woff2", "jost-latin.woff2"];
const PRELOADED = ["/assets/fonts/cormorant-garamond-latin.woff2", "/assets/fonts/jost-latin.woff2"];

test("self-hosted font files are published", () => {
  FONT_FILES.forEach((file) => assert.ok(siteFileExists(`assets/fonts/${file}`), file));
});

test("_headers caches font files for a year", () => {
  assert.match(readSiteFile("_headers"), /\/assets\/fonts\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
});

describe("critical rendering path", () => {
  for (const page of pages) {
    test(`${page.url}: CSS is inlined and fonts are self-hosted`, () => {
      assert.ok(!page.html.includes("fonts.googleapis.com"), "no Google Fonts CSS request");
      assert.ok(!page.html.includes("fonts.gstatic.com"), "no Google Fonts file request");
      const stylesheets = findTags(page.html, "link").filter((a) => a.rel === "stylesheet");
      assert.equal(stylesheets.length, 0, "no render-blocking stylesheet requests");
      assert.match(page.html, /<style>[\s\S]*--crimson: #C41E3A;[\s\S]*<\/style>/, "tokens inlined");
      const preloads = findTags(page.html, "link").filter((a) => a.rel === "preload" && a.as === "font");
      assert.deepEqual(preloads.map((a) => a.href).sort(), [...PRELOADED].sort());
      preloads.forEach((a) => assert.ok("crossorigin" in a, "font preloads need crossorigin"));
    });

    test(`${page.url}: Google Ads tag is queued immediately but loaded after the page paints`, () => {
      assert.ok(!/<script[^>]+src="https:\/\/www\.googletagmanager\.com/.test(page.html), "gtag.js is not a blocking head script");
      assert.ok(page.html.includes("addEventListener('load'"), "gtag.js injected on window load");
    });
  }
});
