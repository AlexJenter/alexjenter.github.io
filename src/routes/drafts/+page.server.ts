import { dev } from "$app/environment";
import { redirect } from "@sveltejs/kit";
import { getPosts } from "$lib/server/posts";
import type { PageServerLoad } from "./$types";

// Drafts are listed only while developing; the built site forwards to /.
export const load = (() => {
  if (!dev) redirect(307, "/");
  return { posts: getPosts("draft") };
}) satisfies PageServerLoad;
