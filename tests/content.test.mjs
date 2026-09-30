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
