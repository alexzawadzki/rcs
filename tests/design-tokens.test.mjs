import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readJson } from "./helpers/site.mjs";

const CSS_FILES = ["tokens", "base", "components", "pages"].map((name) => `src/assets/css/${name}.css`);
const MAX_LINES = 800;
const brand = readJson("src/_data/brand.json");
const services = readJson("src/_data/services.json");

test("tokens.css mirrors every brand color", () => {
  const tokens = readFileSync("src/assets/css/tokens.css", "utf8");
  brand.colors.forEach(({ token, hex }) => assert.match(tokens, new RegExp(`--${token}:\\s*${hex};`, "i"), token));
});

test("every service icon exists in the sprite", () => {
  const sprite = readFileSync("src/assets/icons/sprite.svg", "utf8");
  services.forEach((s) => assert.ok(sprite.includes(`id="i-${s.icon}"`), `missing i-${s.icon}`));
});

test("CSS files stay focused", () => {
  CSS_FILES.forEach((file) => {
    const lines = readFileSync(file, "utf8").split("\n").length;
    assert.ok(lines <= MAX_LINES, `${file} has ${lines} lines`);
  });
});

test("pollen gold is never used as a text color", () => {
  CSS_FILES.forEach((file) => assert.doesNotMatch(readFileSync(file, "utf8"), /(?<![-\w])color:\s*var\(--pollen\)/, file));
});

test("the mobile drawer is only off-canvas when JavaScript has run", () => {
  const css = readFileSync("src/assets/css/base.css", "utf8");
  const chunks = css.split("}").filter((chunk) => chunk.includes("translateX(100%)"));
  assert.ok(chunks.length > 0, "expected at least one translateX(100%) rule");
  chunks.forEach((chunk) => assert.match(chunk, /\.js\s+\.site-nav/, chunk));
});
