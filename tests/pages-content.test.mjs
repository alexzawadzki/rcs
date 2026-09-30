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
