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
