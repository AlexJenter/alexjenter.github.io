import { error } from "@sveltejs/kit";
import { ogSlugs, renderOg } from "$lib/server/og";
import type { EntryGenerator, RequestHandler } from "./$types";

export const prerender = true;

// The crawler never sees these (they're only referenced from <meta>), so list
// them explicitly.
export const entries: EntryGenerator = () => ogSlugs().map((slug) => ({ slug }));

export const GET: RequestHandler = async ({ params }) => {
  const png = await renderOg(params.slug);
  if (!png) error(404, "No preview card for this page");
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png" },
  });
};
