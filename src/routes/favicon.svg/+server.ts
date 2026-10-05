import { iconSvg } from "$lib/server/icon";

export const prerender = true;

export function GET() {
  return new Response(iconSvg({ adaptive: true }), {
    headers: { "content-type": "image/svg+xml" },
  });
}
