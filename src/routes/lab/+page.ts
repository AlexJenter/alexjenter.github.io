import { redirect } from "@sveltejs/kit";

// The lab index moved to the home page. Posts keep their /lab/<slug> URLs;
// prerendering writes this as a page that forwards to /.
export function load() {
  redirect(308, "/");
}
