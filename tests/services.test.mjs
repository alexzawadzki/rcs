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
