import { iconPng } from "$lib/server/icon";

export const prerender = true;

// Full-bleed: iOS rounds the corners of home-screen icons itself.
export async function GET() {
  return new Response(new Uint8Array(await iconPng(180, { rounded: false })), {
    headers: { "content-type": "image/png" },
  });
}
