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
