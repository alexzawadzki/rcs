import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const SITE_DIR = path.resolve("_site");
export const SITE_URL = "https://renatascleaning.com";

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", middot: "·", hellip: "…", copy: "©",
};

export function readJson(relPath) {
  return JSON.parse(readFileSync(path.resolve(relPath), "utf8"));
}

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code.startsWith("#")) {
      const isHex = code[1].toLowerCase() === "x";
      return String.fromCodePoint(parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10));
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function assertBuilt() {
  if (!existsSync(path.join(SITE_DIR, "index.html"))) {
    throw new Error("_site/index.html not found. Run `npm run build` before `npm test`.");
  }
}

export const siteFile = (relPath) => path.join(SITE_DIR, relPath.replace(/^\//, ""));
export const readSiteFile = (relPath) => readFileSync(siteFile(relPath), "utf8");
export const siteFileExists = (relPath) => existsSync(siteFile(relPath));

export function listSiteFiles(extension) {
  assertBuilt();
  return readdirSync(SITE_DIR, { recursive: true })
    .map((entry) => entry.split(path.sep).join("/"))
    .filter((entry) => entry.endsWith(extension))
    .sort();
}

export function urlForFile(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return `/${relPath.slice(0, -"index.html".length)}`;
  return `/${relPath}`;
}

export function loadPages() {
  return listSiteFiles(".html").map((rel) => ({ rel, url: urlForFile(rel), html: readSiteFile(rel) }));
}

export function parseAttributes(attrText) {
  const attrs = {};
  for (const m of attrText.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

export function findTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  return [...html.matchAll(re)].map((m) => parseAttributes(m[1]));
}

export function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

export function getMetaContent(html, key, value) {
  const tag = findTags(html, "meta").find((attrs) => attrs[key] === value);
  return tag ? tag.content : null;
}

export const isIndexable = (page) => !/noindex/i.test(getMetaContent(page.html, "name", "robots") ?? "");

export function getCanonical(html) {
  const tag = findTags(html, "link").find((attrs) => attrs.rel === "canonical");
  return tag ? tag.href : null;
}

export const countTag = (html, tagName) =>
  (html.match(new RegExp(`<${tagName}\\b`, "gi")) || []).length;

export function getJsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

export function getGraph(html) {
  return getJsonLdBlocks(html).flatMap((raw) => {
    const data = JSON.parse(raw);
    return data["@graph"] ?? [data];
  });
}

export function hasType(node, type) {
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.includes(type);
}

export function visibleText(html) {
  const body = html.replace(/^[\s\S]*?<body[^>]*>/i, "");
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

export function getInnerTexts(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return [...html.matchAll(re)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
  );
}

export function getInternalRefs(html) {
  return [...html.matchAll(/\s(?:href|src)="([^"]+)"/gi)]
    .map((m) => decodeEntities(m[1]))
    .filter((value) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value));
}

export const getIds = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/gi)].map((m) => m[1]));

export function resolveToFile(urlPath) {
  const clean = urlPath.split("#")[0].split("?")[0];
  return clean.endsWith("/") ? `${clean.slice(1)}index.html` : clean.slice(1);
}

export function pngSize(absPath) {
  const buf = readFileSync(absPath);
  const signature = buf.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error(`${absPath} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
