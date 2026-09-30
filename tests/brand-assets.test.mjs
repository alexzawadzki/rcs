import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteFile, siteFileExists, readSiteFile, pngSize } from "./helpers/site.mjs";

const VERSIONS = ["color", "reversed", "ink", "white"];
const LOCKUPS = ["mark", "logo-horizontal", "logo-stacked"];
const SVGS = VERSIONS.flatMap((v) => LOCKUPS.map((l) => `assets/brand/renatas-${l}-${v}.svg`));

for (const rel of [...SVGS, "favicon.svg"]) {
  test(`${rel} is a clean vector file`, () => {
    assert.ok(siteFileExists(rel), `${rel} missing`);
    const svg = readSiteFile(rel);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.doesNotMatch(svg, /<text\b/, "text must be outlined");
    assert.doesNotMatch(svg, /Gradient/, "no gradients");
  });
}

const PNGS = [
  ...["color", "reversed"].flatMap((v) => [512, 1024].flatMap((w) => [
    [`assets/brand/renatas-mark-${v}-${w}.png`, w, w],
    [`assets/brand/renatas-logo-horizontal-${v}-${w}.png`, w, null],
  ])),
  ["favicon-32.png", 32, 32],
  ["apple-touch-icon.png", 180, 180],
  ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512],
  ["og-image.png", 1200, 630],
];

for (const [rel, width, height] of PNGS) {
  test(`${rel} is ${width}${height ? `x${height}` : " wide"}`, () => {
    assert.ok(siteFileExists(rel), `${rel} missing`);
    const size = pngSize(siteFile(rel));
    assert.equal(size.width, width);
    if (height) assert.equal(size.height, height);
  });
}

test("inline logo macro is generated with themeable classes", () => {
  const macro = readFileSync("src/_includes/partials/logo-mark.njk", "utf8");
  assert.match(macro, /\{% macro logoMark\(/);
  ["main", "diag", "center"].forEach((part) => assert.ok(macro.includes(`class="lm-${part}"`), part));
  assert.match(macro, /aria-hidden="true"/);
});
