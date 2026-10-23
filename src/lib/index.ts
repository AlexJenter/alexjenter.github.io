export type PostFrontmatter = {
  title: string;
  /** shorter title for tight spots, e.g. the nav crumb on phones */
  short?: string;
  date: string;
  cover?: string;
  /** the cover is pixel art (e.g. a 1-bit dither exported at one pixel per
      dot): served untouched instead of re-encoded and resized, and scaled up
      with hard pixel edges */
  coverPixelated?: boolean;
  description?: string;
  status?: "draft" | "public";
  /** pins the post to the big tile at the top of the listings, ahead of
      newer posts; at most one post per status may have it */
  featured?: boolean;
};

/** A post as the listings show it (see $lib/server/posts). */
export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  /** pinned to the first (big) tile; see PostFrontmatter */
  featured?: boolean;
  /** enhanced: an enhanced:img source object (photos); otherwise the file's
      URL, served as is (SVGs and `coverPixelated` covers) */
  cover?:
    | { enhanced: true; src: any }
    | { enhanced: false; src: string; pixelated: boolean };
};
