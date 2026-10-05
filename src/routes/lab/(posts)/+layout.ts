import type { LayoutLoad } from "./$types";
import type { PostFrontmatter } from "$lib";

export const load = (async ({ url }) => {
  // Lazy glob + await ONLY the matching post's loader. Eager would statically
  // import every post's markdown — and transitively its diagrams (d3 etc.) —
  // into this universal chunk, shipped on every lab route. The matching page
  // module is being loaded by the route itself anyway, so awaiting it here
  // costs nothing extra. import: "metadata" narrows it to the frontmatter.
  const mdModules = import.meta.glob("/src/routes/lab/**/+page.md", {
    import: "metadata",
  });
  const slug = url.pathname.split("/").filter(Boolean).at(-1) ?? "";

  const mdKey = Object.keys(mdModules).find((path) =>
    path.includes(`/${slug}/+page.md`),
  );
  const metadata = mdKey
    ? ((await mdModules[mdKey]()) as PostFrontmatter)
    : undefined;

  return {
    title: metadata?.title,
    date: metadata?.date,
    description: metadata?.description,
    slug,
  };
}) satisfies LayoutLoad;
