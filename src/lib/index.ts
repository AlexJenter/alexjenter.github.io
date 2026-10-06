export type PostFrontmatter = {
  title: string;
  /** shorter title for tight spots, e.g. the nav crumb on phones */
  short?: string;
  date: string;
  cover?: string;
  description?: string;
  status?: "draft" | "public";
};

/** A post as the listings show it (see $lib/server/posts). */
export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  /** svg: a URL; raster: an enhanced:img source object */
  cover?: { svg: true; src: string } | { svg: false; src: any };
};
