import { test } from "node:test";
import assert from "node:assert/strict";
import { siteFileExists } from "./helpers/site.mjs";

test("the build produces a home page", () => {
  assert.ok(siteFileExists("index.html"), "run `npm run build` first");
});
