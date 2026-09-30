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
