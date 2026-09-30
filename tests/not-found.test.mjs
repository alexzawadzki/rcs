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
