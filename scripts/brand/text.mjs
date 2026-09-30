import { readFileSync } from "node:fs";
import opentype from "opentype.js";

export function loadFont(filePath) {
  const buf = readFileSync(filePath);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function unionBox(boxes) {
  const finite = boxes.filter((b) => Number.isFinite(b.x1) && b.x2 > b.x1);
  return {
    x1: Math.min(...finite.map((b) => b.x1)),
    y1: Math.min(...finite.map((b) => b.y1)),
    x2: Math.max(...finite.map((b) => b.x2)),
    y2: Math.max(...finite.map((b) => b.y2)),
  };
}

// Lays out `text` on a baseline at y = 0 with kerning and optional tracking (in em).
export function textShape(font, text, { size, tracking = 0 }) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  let x = 0;
  const paths = glyphs.map((glyph, i) => {
    const path = glyph.getPath(x, 0, size);
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(glyph, next) : 0;
    x += (glyph.advanceWidth + kern) * scale + (next ? tracking * size : 0);
    return path;
  });
  const box = unionBox(paths.map((p) => p.getBoundingBox()));
  return {
    d: paths.map((p) => p.toPathData(2)).join(""),
    box,
    width: box.x2 - box.x1,
    height: box.y2 - box.y1,
  };
}

// Tracks `text` so its ink width equals `targetWidth`.
export function trackedToWidth(font, text, size, targetWidth) {
  const untracked = textShape(font, text, { size });
  const gaps = [...text].length - 1;
  const tracking = (targetWidth - untracked.width) / (gaps * size);
  return textShape(font, text, { size, tracking });
}
