import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, getInternalRefs, getIds, resolveToFile, siteFileExists } from "./helpers/site.mjs";

const pages = loadPages();
const idsByFile = new Map(pages.map((p) => [p.rel, getIds(p.html)]));

describe("internal link targets exist", () => {
  for (const page of pages) {
    test(`${page.url}: every internal link and fragment resolves`, () => {
      for (const ref of getInternalRefs(page.html)) {
        const [pathAndQuery, fragment] = ref.split("#");
        const target = pathAndQuery ? resolveToFile(pathAndQuery) : page.rel;
        assert.ok(siteFileExists(target), `${ref} → ${target} missing`);
        if (fragment && target.endsWith(".html")) {
          assert.ok(idsByFile.get(target)?.has(fragment), `#${fragment} missing in ${target}`);
        }
      }
    });
  }
});
