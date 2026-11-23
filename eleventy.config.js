import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import markdownIt from "markdown-it";

const md = markdownIt({ html: true, linkify: true, typographer: true });

export default function (eleventyConfig) {
  // Resize every <img> in the built HTML (block images and images inserted
  // into rich text alike) into several widths in AVIF, WebP and JPEG.
  // Blocks set their own `sizes` attribute; this is the fallback.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [480, 960, 1600, "auto"],
    urlPath: "/img/",
    outputDir: "./_site/img/",
    failOnError: false,
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
        sizes: "(min-width: 60rem) 60rem, 100vw",
      },
      pictureAttributes: {},
    },
  });

  // Rich-text fields from Pages CMS are stored as Markdown in front matter.
  eleventyConfig.addFilter("markdown", (content = "") => md.render(String(content)));

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  eleventyConfig.addPassthroughCopy("src/assets");
  // Keep the original uploads available too (e.g. for linking to a full-size file).
  eleventyConfig.addPassthroughCopy("src/media");

  eleventyConfig.addWatchTarget("src/assets/");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
