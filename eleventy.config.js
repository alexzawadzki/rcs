import {
  jsonLd, absoluteUrl, isoDate, createAssetUrl, serviceBySlug, whereCategory, sitemapPages,
} from "./src/_lib/filters.js";
import { buildSchemaGraph } from "./src/_lib/schema.js";

const INPUT_DIR = "src";
const ROOT_PASSTHROUGH = [
  "src/*.{svg,png,ico,webmanifest,txt}",
  "src/_headers",
];

export default function (eleventyConfig) {
  const { assetUrl, reset } = createAssetUrl(INPUT_DIR);
  eleventyConfig.on("eleventy.before", reset);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  ROOT_PASSTHROUGH.forEach((glob) => eleventyConfig.addPassthroughCopy(glob));

  eleventyConfig.addFilter("assetUrl", assetUrl);
  eleventyConfig.addFilter("jsonLd", jsonLd);
  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("serviceBySlug", serviceBySlug);
  eleventyConfig.addFilter("whereCategory", whereCategory);
  eleventyConfig.addFilter("sitemapPages", sitemapPages);

  eleventyConfig.addNunjucksGlobal("buildSchema", (input) => jsonLd(buildSchemaGraph(input)));

  eleventyConfig.addGlobalData("buildDate", () => new Date());
}

export const config = {
  dir: { input: INPUT_DIR, includes: "_includes", data: "_data", output: "_site" },
  templateFormats: ["njk"],
  htmlTemplateEngine: "njk",
};
