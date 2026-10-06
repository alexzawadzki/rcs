import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readJson } from "./helpers/site.mjs";

// The production Worker lives in the "Renatas Cleaning Service" Cloudflare account,
// which owns the renatascleaning.com zone. Deploying anywhere else cannot bind the domain.
const RCS_ACCOUNT_ID = "879437e71f120f1a94d874c92c863b45";
const WORKER_NAME = "rcs";
const CONFIG_PATH = "wrangler.jsonc";

// Comments live on their own lines so this stays a one-liner; URLs in strings are untouched.
const stripJsonc = (text) => text.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
const readJsonc = (relPath) => JSON.parse(stripJsonc(readFileSync(relPath, "utf8")));

const site = readJson("src/_data/site.json");
const apex = new URL(site.url).hostname;

test("wrangler.jsonc exists and parses", () => {
  assert.ok(existsSync(CONFIG_PATH), `${CONFIG_PATH} is required so Workers Builds does not guess the project layout`);
  assert.doesNotThrow(() => readJsonc(CONFIG_PATH));
});

test("deploy is pinned to the rcs Worker in the Renatas Cleaning Service account", () => {
  const config = readJsonc(CONFIG_PATH);
  assert.equal(config.name, WORKER_NAME);
  assert.equal(config.account_id, RCS_ACCOUNT_ID);
  assert.match(config.compatibility_date ?? "", /^\d{4}-\d{2}-\d{2}$/);
});

test("the Worker serves the Eleventy output as static assets with the real 404 page", () => {
  const config = readJsonc(CONFIG_PATH);
  assert.equal(config.main, undefined, "static site: no Worker script");
  assert.equal(config.assets?.directory, "_site");
  assert.equal(config.assets?.not_found_handling, "404-page");
});

test("only the custom domain is a deploy target", () => {
  const config = readJsonc(CONFIG_PATH);
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  const customDomains = (config.routes ?? []).filter((r) => r.custom_domain === true).map((r) => r.pattern).sort();
  assert.deepEqual(customDomains, [apex, `www.${apex}`].sort());
});

test("every deploy builds the site and runs the test suite first", () => {
  const config = readJsonc(CONFIG_PATH);
  assert.equal(config.build?.command, "npm run check");
});

test("wrangler is a pinned dev dependency so CI and local deploys use the same version", () => {
  const pkg = readJson("package.json");
  assert.match(pkg.devDependencies?.wrangler ?? "", /^\d+\.\d+\.\d+$/, "pin an exact wrangler version");
});
