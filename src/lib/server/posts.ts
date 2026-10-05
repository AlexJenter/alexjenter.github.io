import type { PostFrontmatter, PostSummary } from "$lib";

// Server-only (runs at prerender): the eager glob imports every post's full
// module — diagrams, d3 and all — just to read frontmatter. Pages that list
// posts load them in +page.server.ts, so the browser only gets the JSON.
const modules = import.meta.glob<PostFrontmatter>(
  "/src/routes/lab/**/+page.md",
  { eager: true, import: "metadata" },
);

// Covers are the frontmatter `cover` file, always named cover.*; globbing
// only those keeps the other post images out of the enhanced:img pipeline.
const rasters = import.meta.glob<Record<string, any>>(
  "/src/routes/lab/**/cover.{jpg,jpeg,png,webp,avif}",
  { eager: true, query: { enhanced: true }, import: "default" },
);
const svgs = import.meta.glob<string>("/src/routes/lab/**/cover.svg", {
  eager: true,
  import: "default",
});

/** Posts with the given status, newest first. */
export function getPosts(status: "public" | "draft"): PostSummary[] {
  return Object.entries(modules)
    .filter(([, meta]) => meta.status === status)
    .map(([path, meta]) => {
      const coverPath = path.replace("+page.md", meta.cover?.replace("./", "") ?? "");
      const cover: PostSummary["cover"] = svgs[coverPath]
        ? { svg: true, src: svgs[coverPath] }
        : rasters[coverPath]
          ? { svg: false, src: rasters[coverPath] }
          : undefined;

      return {
        slug: path.split("/").at(-2)!,
        title: meta.title,
        date: meta.date,
        description: meta.description,
        cover,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
