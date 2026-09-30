import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadPages, getInternalRefs, readSiteFile } from "./helpers/site.mjs";

const pages = loadPages();
const sprite = readSiteFile("assets/icons/sprite.svg");
const HASHED_ASSET = /^\/assets\/(?:css|js|icons)\//;
const CACHE_BUSTED = /\?v=[0-9a-f]{8}(?:#|$)/;

describe("internal link hygiene", () => {
  for (const page of pages) {
    const refs = getInternalRefs(page.html);

    test(`${page.url}: links are root-relative`, () => {
      refs.forEach((ref) => assert.ok(ref.startsWith("/") || ref.startsWith("#"), `"${ref}"`));
    });

    test(`${page.url}: page links end with / or a file extension`, () => {
      for (const ref of refs) {
        const pathname = ref.split(/[?#]/)[0];
        if (!pathname) continue;
        const last = pathname.split("/").pop();
        assert.ok(pathname.endsWith("/") || last.includes("."), `"${ref}" needs a trailing slash`);
      }
    });

    test(`${page.url}: CSS, JS and icon URLs are cache-busted`, () => {
      refs.filter((ref) => HASHED_ASSET.test(ref)).forEach((ref) => assert.match(ref, CACHE_BUSTED, ref));
    });

    test(`${page.url}: icon references exist in the sprite`, () => {
      refs.filter((ref) => ref.startsWith("/assets/icons/sprite.svg")).forEach((ref) => {
        const id = ref.split("#")[1];
        assert.ok(id && sprite.includes(`id="${id}"`), `missing symbol for ${ref}`);
      });
    });
  }
});
