// Defaults for every page in src/pages/ (the folder Pages CMS edits).
export default {
  layout: "layouts/page.njk",
  eleventyComputed: {
    // index.md -> "/", about.md -> "/about/"
    // (fileSlug is the folder name for index files, so check the path instead.)
    permalink: (data) =>
      data.page.filePathStem === "/pages/index" ? "/" : `/${data.page.fileSlug}/`,
  },
};
