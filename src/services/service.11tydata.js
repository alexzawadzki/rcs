// Computed with functions (not Nunjucks strings) so apostrophes are never HTML-escaped into data.
export default {
  eleventyComputed: {
    title: (data) => data.service?.metaTitle,
    description: (data) => data.service?.metaDescription,
    breadcrumbs: (data) => [
      { label: "Services", url: "/services/" },
      { label: data.service?.name, url: `/services/${data.service?.slug}/` },
    ],
  },
};
