import { getPosts } from "$lib/server/posts";
import type { PageServerLoad } from "./$types";

export const load = (() => ({ posts: getPosts("public") })) satisfies PageServerLoad;
