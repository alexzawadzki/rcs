import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const FONT_DIR = path.join(import.meta.dirname, "fonts");
const CSS_API = "https://fonts.googleapis.com/css2";
// A non-browser user agent makes the Google Fonts CSS API answer with plain TrueType files.
const TTF_USER_AGENT = "curl/8.7.1";

const FONTS = [
  { family: "Cormorant Garamond", weight: 600, file: "CormorantGaramond-SemiBold.ttf" },
  { family: "Jost", weight: 500, file: "Jost-Medium.ttf" },
  { family: "Jost", weight: 400, file: "Jost-Regular.ttf" },
];
const LICENSES = [
  { url: "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt", file: "OFL-CormorantGaramond.txt" },
  { url: "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/OFL.txt", file: "OFL-Jost.txt" },
];

async function fetchOk(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} failed with HTTP ${res.status}`);
  return res;
}

async function ttfUrl({ family, weight }) {
  const query = `family=${family.replace(/ /g, "+")}:wght@${weight}`;
  const res = await fetchOk(`${CSS_API}?${query}`, { headers: { "User-Agent": TTF_USER_AGENT } });
  const css = await res.text();
  const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) throw new Error(`No TrueType URL for ${family} ${weight}. Response:\n${css}`);
  return match[1];
}

async function download(url, file) {
  const buf = Buffer.from(await (await fetchOk(url)).arrayBuffer());
  writeFileSync(path.join(FONT_DIR, file), buf);
  console.log(`saved ${file} (${buf.length} bytes)`);
}

mkdirSync(FONT_DIR, { recursive: true });
for (const font of FONTS) await download(await ttfUrl(font), font.file);
for (const license of LICENSES) await download(license.url, license.file);
