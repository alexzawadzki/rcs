import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const HASH_LENGTH = 8;

export function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function absoluteUrl(urlPath, base) {
  return new URL(urlPath, base).href;
}

export function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function createAssetUrl(inputDir) {
  const cache = new Map();

  function assetUrl(urlPath) {
    if (!cache.has(urlPath)) {
      const filePath = path.join(inputDir, urlPath);
      let contents;
      try {
        contents = readFileSync(filePath);
      } catch (cause) {
        throw new Error(`assetUrl: cannot read ${filePath}`, { cause });
      }
      const hash = createHash("sha256").update(contents).digest("hex").slice(0, HASH_LENGTH);
      cache.set(urlPath, `${urlPath}?v=${hash}`);
    }
    return cache.get(urlPath);
  }

  return { assetUrl, reset: () => cache.clear() };
}

// Returns a source file's contents for inlining into a template (cached per build).
export function createInlineAsset(inputDir) {
  const cache = new Map();

  function inlineAsset(urlPath) {
    if (!cache.has(urlPath)) {
      const filePath = path.join(inputDir, urlPath);
      try {
        cache.set(urlPath, readFileSync(filePath, "utf8"));
      } catch (cause) {
        throw new Error(`inlineAsset: cannot read ${filePath}`, { cause });
      }
    }
    return cache.get(urlPath);
  }

  return { inlineAsset, reset: () => cache.clear() };
}

export function serviceBySlug(services, slug) {
  const match = services.find((service) => service.slug === slug);
  if (!match) throw new Error(`Unknown service slug "${slug}"`);
  return match;
}

export function whereCategory(services, category) {
  return services.filter((service) => service.category === category);
}

export function sitemapPages(collection) {
  return collection
    .filter((item) => item.url && item.url.endsWith("/") && !item.data.noindex)
    .sort((a, b) => a.url.localeCompare(b.url));
}
