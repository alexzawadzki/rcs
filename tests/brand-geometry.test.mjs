import { test } from "node:test";
import assert from "node:assert/strict";
import { MARK_BOUNDS, petalPath, markElements, placedMark } from "../scripts/brand/geometry.mjs";

test("mark bounds describe a centered 172-unit square", () => {
  assert.deepEqual(MARK_BOUNDS, { min: 14, size: 172 });
});

test("petalPath is a closed path from base to tip and back", () => {
  const d = petalPath({ r0: 17, r1: 86, w: 21 });
  assert.match(d, /^M100 83C/);
  assert.match(d, /100 14C/);
  assert.match(d, /Z$/);
});

test("markElements draws 4 diagonal + 4 main petals and a center", () => {
  const parts = [];
  const svg = markElements({ paint: (part) => { parts.push(part); return `class="lm-${part}"`; } });
  assert.equal((svg.match(/<path /g) || []).length, 8);
  assert.equal((svg.match(/<circle /g) || []).length, 1);
  assert.deepEqual([...new Set(parts)].sort(), ["center", "diag", "main"]);
});

test("holes use even-odd fill on main petals only; small variant has none", () => {
  const withHoles = markElements({ paint: () => "" });
  assert.equal((withHoles.match(/fill-rule="evenodd"/g) || []).length, 4);
  const small = markElements({ holes: false, paint: () => "" });
  assert.doesNotMatch(small, /evenodd/);
});

test("placedMark scales the 172-unit mark to the requested size", () => {
  assert.match(placedMark({ x: 10, y: 20, size: 86, paint: () => "" }), /translate\(10 20\) scale\(0\.5\) translate\(-14 -14\)/);
});
