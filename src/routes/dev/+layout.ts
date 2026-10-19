import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";

// Development tools (the /dev/ui workbench) exist only while developing: the
// build skips them (see prerender.handleHttpError in svelte.config.js), and
// the 404.html fallback shows "not found" for their URLs.
export function load() {
  if (!dev) error(404, "Not found");
}
