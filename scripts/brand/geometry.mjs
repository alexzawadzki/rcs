// Flower mark geometry on a 200×200 grid centered at (100, 100).
// Four main petals (0/90/180/270°), four shorter diagonal petals (45/135/225/315°),
// optional even-odd "vein" cut-outs in the main petals, and a round center.

export const CENTER = 100;
export const MARK_BOUNDS = Object.freeze({ min: 14, size: 172 });

const PETALS = Object.freeze({
  main: { r0: 17, r1: 86, w: 12 },
  diag: { r0: 22, r1: 64, w: 8 },
  vein: { r0: 31, r1: 70, w: 7.5 },
});
const CENTER_RADIUS = 11;
const MAIN_ANGLES = [0, 90, 180, 270];
const DIAG_ANGLES = [45, 135, 225, 315];

const round = (n) => Math.round(n * 100) / 100;
const point = ([x, y]) => `${round(x)} ${round(y)}`;
const mirror = ([x, y]) => [2 * CENTER - x, y];

export function petalPath({ r0, r1, w }) {
  const len = r1 - r0;
  const base = [CENTER, CENTER - r0];
  const tip = [CENTER, CENTER - r1];
  const wideY = CENTER - (r0 + len * 0.55);
  const c1 = [CENTER - w * 0.35, base[1] - len * 0.08];
  const c2 = [CENTER - w, wideY + len * 0.22];
  const side = [CENTER - w, wideY];
  const c3 = [CENTER - w, wideY - len * 0.26];
  const c4 = [CENTER - w * 0.56, tip[1]];
  return [
    `M${point(base)}`,
    `C${point(c1)} ${point(c2)} ${point(side)}`,
    `C${point(c3)} ${point(c4)} ${point(tip)}`,
    `C${point(mirror(c4))} ${point(mirror(c3))} ${point(mirror(side))}`,
    `C${point(mirror(c2))} ${point(mirror(c1))} ${point(base)}Z`,
  ].join("");
}

export function markElements({ holes = true, paint }) {
  const mainD = petalPath(PETALS.main) + (holes ? petalPath(PETALS.vein) : "");
  const diagD = petalPath(PETALS.diag);
  const rotated = (deg, d, part, extra = "") =>
    `<path ${paint(part)}${extra} transform="rotate(${deg} ${CENTER} ${CENTER})" d="${d}"/>`;
  return [
    ...DIAG_ANGLES.map((deg) => rotated(deg, diagD, "diag")),
    ...MAIN_ANGLES.map((deg) => rotated(deg, mainD, "main", holes ? ' fill-rule="evenodd"' : "")),
    `<circle ${paint("center")} cx="${CENTER}" cy="${CENTER}" r="${CENTER_RADIUS}"/>`,
  ].join("");
}

export function placedMark({ x, y, size, holes = true, paint }) {
  const scale = Number((size / MARK_BOUNDS.size).toFixed(4));
  const offset = -MARK_BOUNDS.min;
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${scale}) translate(${offset} ${offset})">${markElements({ holes, paint })}</g>`;
}
