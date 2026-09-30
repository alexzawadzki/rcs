import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { MARK_BOUNDS, markElements, placedMark } from "./geometry.mjs";
import { loadFont, textShape, trackedToWidth } from "./text.mjs";

const HERE = import.meta.dirname;
const SRC = path.resolve(HERE, "../../src");
const FONT_DIR = path.join(HERE, "fonts");

const brand = JSON.parse(readFileSync(path.join(SRC, "_data/brand.json"), "utf8"));
const C = Object.freeze(Object.fromEntries(brand.colors.map((c) => [c.token, c.hex])));
const WHITE = "#FFFFFF";

const NAME = "Renata’s";
const SUB = "CLEANING SERVICE";
const FULL_NAME = "Renata’s Cleaning Service";

const VERSIONS = Object.freeze({
  color: { main: C.crimson, diag: C.garnet, center: C.pollen, name: C.crimson, sub: C.ink },
  reversed: { main: C.magnolia, diag: C.blush, center: C.pollen, name: C.magnolia, sub: C.magnolia },
  ink: { main: C.ink, diag: C.ink, center: C.ink, name: C.ink, sub: C.ink },
  white: { main: WHITE, diag: WHITE, center: WHITE, name: WHITE, sub: WHITE },
});

const LAYOUT = Object.freeze({
  nameSize: 118, subSize: 25, subGap: 20, horizontalGap: 36, stackedGap: 30,
});

const fonts = {
  display: loadFont(path.join(FONT_DIR, "CormorantGaramond-SemiBold.ttf")),
  medium: loadFont(path.join(FONT_DIR, "Jost-Medium.ttf")),
  regular: loadFont(path.join(FONT_DIR, "Jost-Regular.ttf")),
};

const round = (n) => Math.round(n * 100) / 100;
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const fillPaint = (palette) => (part) => `fill="${palette[part]}"`;

function svgDoc(width, height, body, label) {
  const w = round(width);
  const h = round(height);
  const safe = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${safe}"><title>${safe}</title>${body}</svg>\n`;
}

// Places a text shape so the top-left of its ink box lands at (x, y).
function placedText(shape, x, y, fill) {
  return `<path fill="${fill}" transform="translate(${round(x - shape.box.x1)} ${round(y - shape.box.y1)})" d="${shape.d}"/>`;
}

function wordmark() {
  const name = textShape(fonts.display, NAME, { size: LAYOUT.nameSize });
  const sub = trackedToWidth(fonts.medium, SUB, LAYOUT.subSize, name.width);
  return {
    name,
    sub,
    width: Math.max(name.width, sub.width),
    height: name.height + LAYOUT.subGap + sub.height,
  };
}

function markSvg(palette) {
  const s = MARK_BOUNDS.size;
  return svgDoc(s, s, placedMark({ x: 0, y: 0, size: s, paint: fillPaint(palette) }), FULL_NAME);
}

function horizontalSvg(palette) {
  const wm = wordmark();
  const markSize = MARK_BOUNDS.size;
  const top = (markSize - wm.height) / 2;
  const textX = markSize + LAYOUT.horizontalGap;
  const body = [
    placedMark({ x: 0, y: 0, size: markSize, paint: fillPaint(palette) }),
    placedText(wm.name, textX, top, palette.name),
    placedText(wm.sub, textX, top + wm.name.height + LAYOUT.subGap, palette.sub),
  ].join("");
  return svgDoc(textX + wm.width, markSize, body, FULL_NAME);
}

function stackedSvg(palette) {
  const wm = wordmark();
  const markSize = MARK_BOUNDS.size;
  const width = Math.max(markSize, wm.width);
  const nameY = markSize + LAYOUT.stackedGap;
  const body = [
    placedMark({ x: (width - markSize) / 2, y: 0, size: markSize, paint: fillPaint(palette) }),
    placedText(wm.name, (width - wm.name.width) / 2, nameY, palette.name),
    placedText(wm.sub, (width - wm.sub.width) / 2, nameY + wm.name.height + LAYOUT.subGap, palette.sub),
  ].join("");
  return svgDoc(width, nameY + wm.height, body, FULL_NAME);
}

function appIconSvg({ size, radius, markRatio }) {
  const markSize = size * markRatio;
  const inset = (size - markSize) / 2;
  const body = `<rect width="${size}" height="${size}" rx="${radius}" fill="${C.crimson}"/>`
    + placedMark({ x: inset, y: inset, size: markSize, holes: false, paint: fillPaint(VERSIONS.reversed) });
  return svgDoc(size, size, body, FULL_NAME);
}

function ogImageSvg() {
  const W = 1200;
  const H = 630;
  const PAD = 80;
  const maxWidth = W - PAD * 2;
  const fit = (font, text, size) => {
    const shape = textShape(font, text, { size });
    return shape.width <= maxWidth ? shape : textShape(font, text, { size: (size * maxWidth) / shape.width });
  };
  const title = fit(fonts.display, FULL_NAME, 84);
  const line2 = fit(fonts.regular, "House & office cleaning in Hartford County, CT", 38);
  const line3 = fit(fonts.regular, "25+ years  ·  Family-owned  ·  Insured & bonded", 28);
  const phone = textShape(fonts.medium, "(860) 796-5222", { size: 46 });
  const markSize = 104;
  const titleY = PAD + markSize + 44;
  const ruleY = titleY + title.height + 30;
  const line2Y = ruleY + 36;
  const line3Y = line2Y + line2.height + 22;
  const phoneY = H - PAD - phone.height;
  const body = [
    `<rect width="${W}" height="${H}" fill="${C.garnet}"/>`,
    `<g opacity="0.09">${placedMark({ x: W - 440, y: (H - 620) / 2, size: 620, paint: () => `fill="${C.magnolia}"` })}</g>`,
    placedMark({ x: PAD, y: PAD, size: markSize, paint: fillPaint(VERSIONS.reversed) }),
    placedText(title, PAD, titleY, C.magnolia),
    `<rect x="${PAD}" y="${round(ruleY)}" width="96" height="3" fill="${C.pollen}"/>`,
    placedText(line2, PAD, line2Y, C.blush),
    placedText(line3, PAD, line3Y, C.magnolia),
    placedText(phone, PAD, phoneY, C.pollen),
  ].join("");
  return svgDoc(W, H, body, `${FULL_NAME}: house & office cleaning in Hartford County, CT`);
}

function logoMacro() {
  const paint = (part) => `class="lm-${part}" fill="${VERSIONS.color[part]}"`;
  const { min, size } = MARK_BOUNDS;
  return [
    "{# Generated by scripts/brand/build-brand.mjs. Do not edit by hand. #}",
    '{% macro logoMark(extraClass="") -%}',
    `<svg class="logo-mark{% if extraClass %} {{ extraClass }}{% endif %}" viewBox="${min} ${min} ${size} ${size}" aria-hidden="true" focusable="false">${markElements({ holes: true, paint })}</svg>`,
    "{%- endmacro %}",
    "",
  ].join("\n");
}

function write(relPath, contents) {
  const abs = path.join(SRC, relPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  return abs;
}

function png(svgAbsPath, pngRelPath, width, height) {
  const args = ["-w", String(width), ...(height ? ["-h", String(height)] : []), "-o", path.join(SRC, pngRelPath), svgAbsPath];
  try {
    execFileSync("rsvg-convert", args, { stdio: "pipe" });
  } catch (cause) {
    throw new Error(`rsvg-convert failed for ${pngRelPath}. Install it with: brew install librsvg`, { cause });
  }
}

function main() {
  for (const [version, palette] of Object.entries(VERSIONS)) {
    write(`assets/brand/renatas-mark-${version}.svg`, markSvg(palette));
    write(`assets/brand/renatas-logo-horizontal-${version}.svg`, horizontalSvg(palette));
    write(`assets/brand/renatas-logo-stacked-${version}.svg`, stackedSvg(palette));
  }
  for (const version of ["color", "reversed"]) {
    for (const width of [512, 1024]) {
      png(path.join(SRC, `assets/brand/renatas-mark-${version}.svg`), `assets/brand/renatas-mark-${version}-${width}.png`, width, width);
      png(path.join(SRC, `assets/brand/renatas-logo-horizontal-${version}.svg`), `assets/brand/renatas-logo-horizontal-${version}-${width}.png`, width);
    }
  }

  const favicon = write("favicon.svg", appIconSvg({ size: 64, radius: 14, markRatio: 0.82 }));
  png(favicon, "favicon-32.png", 32, 32);

  const tmp = mkdtempSync(path.join(tmpdir(), "rcs-brand-"));
  try {
    const appIcon = path.join(tmp, "app-icon.svg");
    writeFileSync(appIcon, appIconSvg({ size: 512, radius: 0, markRatio: 0.7 }));
    png(appIcon, "apple-touch-icon.png", 180, 180);
    png(appIcon, "icon-192.png", 192, 192);
    png(appIcon, "icon-512.png", 512, 512);

    const og = path.join(tmp, "og-image.svg");
    writeFileSync(og, ogImageSvg());
    png(og, "og-image.png", 1200, 630);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  write("_includes/partials/logo-mark.njk", logoMacro());
  console.log("Brand assets written to src/assets/brand/, src/ icons, og-image.png and partials/logo-mark.njk");
}

main();
