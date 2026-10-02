import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "./helpers/site.mjs";

const services = readJson("src/_data/services.json");
const groups = readJson("src/_data/serviceGroups.json");
const towns = readJson("src/_data/towns.json");
const faqs = readJson("src/_data/faqs.json");
const reviews = readJson("src/_data/reviews.json");
const brand = readJson("src/_data/brand.json");
const site = readJson("src/_data/site.json");
const nav = readJson("src/_data/nav.json");

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE = /\$\s?\d/;
const REQUIRED_SERVICE_FIELDS = ["slug", "name", "icon", "category", "metaTitle", "metaDescription", "h1", "summary"];

test("site identity is exact", () => {
  assert.equal(site.name, "Renata's Cleaning Service");
  assert.equal(site.url, "https://renatascleaning.com");
  assert.equal(site.phone.tel, "+18607965222");
  assert.equal(site.phone.display, "(860) 796-5222");
  assert.equal(site.email, "Renata@renatascleaning.com");
  assert.equal(site.googleAdsId, "AW-17838655328");
});

test("there are 8 services with unique kebab-case slugs", () => {
  assert.equal(services.length, 8);
  const slugs = services.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  slugs.forEach((slug) => assert.match(slug, KEBAB));
});

for (const service of services) {
  test(`service ${service.slug} is complete`, () => {
    REQUIRED_SERVICE_FIELDS.forEach((field) => assert.ok(service[field], `${field} missing`));
    assert.ok(groups.some((g) => g.key === service.category), `unknown category ${service.category}`);
    assert.ok(service.metaTitle.length <= 60, `metaTitle ${service.metaTitle.length} chars`);
    const d = service.metaDescription.length;
    assert.ok(d >= 120 && d <= 160, `metaDescription ${d} chars`);
    assert.ok(service.intro.length >= 2, "at least 2 intro paragraphs");
    assert.ok(service.included.length >= 4, "at least 4 included items");
    assert.ok(service.idealFor.length >= 3, "at least 3 idealFor items");
    assert.ok(service.faqs.length >= 2, "at least 2 FAQs");
    service.faqs.forEach((f) => assert.ok(f.q && f.a, "faq needs q and a"));
    assert.ok(service.related.length >= 3, "at least 3 related services");
    assert.ok(!service.related.includes(service.slug), "related must not include itself");
    service.related.forEach((slug) => assert.ok(services.some((s) => s.slug === slug), `unknown related ${slug}`));
  });
}

test("exactly house and commercial cleaning are featured", () => {
  assert.deepEqual(services.filter((s) => s.featured).map((s) => s.slug), ["house-cleaning", "commercial-cleaning"]);
});

test("12 towns with unique slugs and notes", () => {
  assert.equal(towns.length, 12);
  assert.equal(new Set(towns.map((t) => t.slug)).size, 12);
  towns.forEach((t) => { assert.match(t.slug, KEBAB); assert.ok(t.name && t.note); });
});

test("FAQs have unique ids and exactly 3 are featured", () => {
  assert.ok(faqs.length >= 8);
  assert.equal(new Set(faqs.map((f) => f.id)).size, faqs.length);
  assert.equal(faqs.filter((f) => f.featured).length, 3);
});

test("reviews match the real Google profile", () => {
  assert.equal(reviews.ratingValue, "4.6");
  assert.equal(reviews.reviewCount, 11);
  assert.equal(reviews.testimonials.length, 3);
});

test("brand palette is exact", () => {
  const byToken = Object.fromEntries(brand.colors.map((c) => [c.token, c.hex]));
  assert.deepEqual(byToken, {
    periwinkle: "#9A9AEB", iris: "#5454C4", indigo: "#2E2E7A", mist: "#EEEEFB", magnolia: "#FFFEF9",
    linen: "#F8F5F0", ink: "#2B2527", stone: "#6B6360", pollen: "#E3A935",
  });
});

test("every service group has a label, intro, eyebrow and cardLabel", () => {
  groups.forEach((g) => {
    ["label", "intro", "eyebrow", "cardLabel"].forEach((field) => {
      assert.ok(typeof g[field] === "string" && g[field].length > 0, `${g.key} missing ${field}`);
    });
  });
});

test("nav links are root-relative with trailing slashes", () => {
  nav.forEach((item) => assert.match(item.url, /^\/(?:[a-z0-9-]+\/)*$/));
});

test("no price patterns in any data file", () => {
  const all = JSON.stringify({ services, groups, towns, faqs, reviews, site });
  assert.doesNotMatch(all, PRICE);
});
