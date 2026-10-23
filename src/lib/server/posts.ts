import type { PostFrontmatter, PostSummary } from "$lib";

// Server-only (runs at prerender): the eager glob imports every post's full
// module — diagrams, d3 and all — just to read frontmatter. Pages that list
// posts load them in +page.server.ts, so the browser only gets the JSON.
const modules = import.meta.glob<PostFrontmatter>(
  "/src/routes/lab/**/+page.md",
  { eager: true, import: "metadata" },
);

// Covers are the frontmatter `cover` file, named cover*.<ext> (cover.png,
// cover-1bit.png, …); globbing only those keeps the other post images out of
// the enhanced:img pipeline.
// Each raster cover is available both ways; the frontmatter picks one.
const enhanced = import.meta.glob<Record<string, any>>(
  "/src/routes/lab/**/cover*.{jpg,jpeg,png,webp,avif}",
  { eager: true, query: { enhanced: true }, import: "default" },
);
// No query on these: vite-imagetools re-encodes any image imported with one
// (even ?url), which would undo a hand-made 1-bit PNG.
const files = import.meta.glob<string>(
  "/src/routes/lab/**/cover*.{svg,jpg,jpeg,png,gif,webp,avif}",
  { eager: true, import: "default" },
);

// Several routes list the posts, so one problem would print once per route
// (and per request in dev). Yellow only on a terminal that wants colour.
const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  const colour = process.stderr.isTTY && !process.env.NO_COLOR;
  const line = `[posts] ${message}`;
  console.warn(colour ? `\x1b[33m${line}\x1b[0m` : line);
}

/** Posts with the given status, newest first; a `featured` post leads. */
export function getPosts(status: "public" | "draft"): PostSummary[] {
  const matching = Object.entries(modules).filter(
    ([, meta]) => meta.status === status,
  );
  // The listings give the first post the big tile, so two featured posts
  // fight over it: warn, and the newer one wins.
  const featured = matching.filter(([, meta]) => meta.featured === true);
  if (featured.length > 1)
    warnOnce(
      `Only one ${status} post can be featured, found ${featured.length}: ` +
        featured.map(([path]) => path.split("/").at(-2)).join(", ") +
        ". The newest gets the big tile.",
    );

  return matching
    .map(([path, meta]) => {
      const coverPath = path.replace("+page.md", meta.cover?.replace("./", "") ?? "");
      // Re-encoding and resizing would blur pixel art (and SVGs need none):
      // those are served as the file itself.
      const pixelated = meta.coverPixelated === true;
      const cover: PostSummary["cover"] =
        enhanced[coverPath] && !pixelated
          ? { enhanced: true, src: enhanced[coverPath] }
          : files[coverPath]
            ? { enhanced: false, src: files[coverPath], pixelated }
            : undefined;
      // Fail the page (and the build) rather than quietly show no cover.
      if (meta.cover && !cover)
        throw new Error(
          `${path}: cover "${meta.cover}" wasn't found. Cover files must sit ` +
            `next to +page.md and be named cover*.<svg|png|jpg|webp|…>.`,
        );

      return {
        slug: path.split("/").at(-2)!,
        title: meta.title,
        date: meta.date,
        description: meta.description,
        cover,
        featured: meta.featured === true,
      };
    })
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
}
