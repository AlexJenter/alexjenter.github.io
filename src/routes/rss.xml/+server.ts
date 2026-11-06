import { getPosts } from "$lib/server/posts";
import { PAGES, SITE_NAME, SITE_URL } from "$lib/site";

// Endpoints do NOT inherit the root layout's `prerender = true`, so set it here
// explicitly. `/rss.xml` has no route params, so SvelteKit includes it in the
// default prerender entries automatically.
export const prerender = true;

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// RSS wants RFC 822 dates; frontmatter has plain dates ("2026-10-30"), which
// `Date` reads as UTC midnight.
const rfc822 = (date: string) => new Date(date).toUTCString();

export function GET() {
  // Public posts only, newest first (a `featured` post leads the listings, but
  // a feed reads by date).
  const posts = getPosts("public").sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const items = posts.map((post) => {
    const url = `${SITE_URL}/lab/${post.slug}`;
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc822(post.date)}</pubDate>`,
      post.description
        ? `      <description>${escapeXml(post.description)}</description>`
        : "",
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(PAGES.index.description)}</description>
    <language>en</language>
${posts.length ? `    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>\n` : ""}    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "max-age=0, s-maxage=3600",
    },
  });
}
