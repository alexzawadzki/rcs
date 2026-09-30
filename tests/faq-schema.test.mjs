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
