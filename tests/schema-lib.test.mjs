import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "./helpers/site.mjs";
import {
  businessId, localBusiness, webSite, breadcrumbList, serviceNode, faqPage, buildSchemaGraph,
} from "../src/_lib/schema.js";

const site = readJson("src/_data/site.json");
const towns = readJson("src/_data/towns.json");
const reviews = readJson("src/_data/reviews.json");
const services = readJson("src/_data/services.json");
const faqs = readJson("src/_data/faqs.json");
const base = { site, towns, reviews, services };
const types = (graph) => graph["@graph"].map((node) => node["@type"]).flat();

test("business node carries identity, area, rating and catalog", () => {
  const b = localBusiness(base);
  assert.equal(b["@id"], "https://renatascleaning.com/#business");
  assert.equal(b.name, "Renata's Cleaning Service");
  assert.equal(b.telephone, "+18607965222");
  assert.equal(b.logo, "https://renatascleaning.com/assets/brand/renatas-mark-color-512.png");
  assert.equal(b.areaServed.length, towns.length);
  assert.equal(b.areaServed[1].name, "West Hartford, CT");
  assert.equal(b.aggregateRating.ratingValue, "4.6");
  assert.equal(b.aggregateRating.reviewCount, "11");
  assert.equal(b.review.length, 3);
  assert.equal(b.hasOfferCatalog.itemListElement.length, services.length);
  assert.equal(b.hasOfferCatalog.itemListElement[0].itemOffered.url, "https://renatascleaning.com/services/house-cleaning/");
});

test("website node is published by the business", () => {
  assert.deepEqual(webSite(site).publisher, { "@id": businessId(site.url) });
});

test("breadcrumbs start at Home and number from 1", () => {
  const list = breadcrumbList(site, [{ label: "Services", url: "/services/" }, { label: "Deep Cleaning", url: "/services/deep-cleaning/" }]);
  assert.deepEqual(list.itemListElement.map((i) => [i.position, i.name, i.item]), [
    [1, "Home", "https://renatascleaning.com/"],
    [2, "Services", "https://renatascleaning.com/services/"],
    [3, "Deep Cleaning", "https://renatascleaning.com/services/deep-cleaning/"],
  ]);
});

test("service node points at the business", () => {
  const node = serviceNode(site, services[0]);
  assert.equal(node.name, "House Cleaning");
  assert.equal(node.url, "https://renatascleaning.com/services/house-cleaning/");
  assert.deepEqual(node.provider, { "@id": businessId(site.url) });
});

test("faqPage maps questions and answers in order", () => {
  const node = faqPage(site, faqs, "/faq/");
  assert.deepEqual(node.mainEntity.map((q) => q.name), faqs.map((f) => f.q));
  assert.equal(node.mainEntity[0].acceptedAnswer.text, faqs[0].a);
});

test("graph includes optional nodes only when their data is present", () => {
  assert.deepEqual(types(buildSchemaGraph({ ...base, pageUrl: "/" })), ["HomeAndConstructionBusiness", "ProfessionalService", "WebSite"]);
  const faqGraph = buildSchemaGraph({ ...base, pageUrl: "/faq/", breadcrumbs: [{ label: "FAQ", url: "/faq/" }], includeFaq: true, faqs });
  assert.ok(types(faqGraph).includes("BreadcrumbList"));
  assert.ok(types(faqGraph).includes("FAQPage"));
  const notFaq = buildSchemaGraph({ ...base, pageUrl: "/", includeFaq: false, faqs });
  assert.ok(!types(notFaq).includes("FAQPage"));
  const svcGraph = buildSchemaGraph({ ...base, pageUrl: "/services/house-cleaning/", service: services[0] });
  assert.ok(types(svcGraph).includes("Service"));
});

test("graph fails fast without site data", () => {
  assert.throws(() => buildSchemaGraph({}), /site\.url/);
});
