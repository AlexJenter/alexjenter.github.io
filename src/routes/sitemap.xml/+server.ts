import type { PostFrontmatter } from "$lib";
import { SITE_URL } from "$lib/site";

// Endpoints do NOT inherit the root layout's `prerender = true`, so set it here
// explicitly. `/sitemap.xml` has no route params, so SvelteKit includes it in
// the default prerender entries automatically.
export const prerender = true;

type SitemapUrl = { loc: string; lastmod?: string };

export function GET() {
  const modules = import.meta.glob("/src/routes/lab/**/+page.md", {
    eager: true,
  });

  const posts = Object.entries(modules)
    .filter(
      ([, mod]: [string, any]) =>
        (mod.metadata as PostFrontmatter).status === "public",
    )
    .map(([path, mod]: [string, any]) => ({
      slug: path.split("/").at(-2)!,
      date: (mod.metadata as PostFrontmatter).date,
    }))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const urls: SitemapUrl[] = [
    { loc: `${SITE_URL}/` },
    { loc: `${SITE_URL}/lab` },
    { loc: `${SITE_URL}/resume` },
    ...posts.map((p) => ({
      loc: `${SITE_URL}/lab/${p.slug}`,
      lastmod: p.date,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "max-age=0, s-maxage=3600",
    },
  });
}
