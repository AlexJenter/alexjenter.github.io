import { iconPng } from "$lib/server/icon";

export const prerender = true;

// One 32px PNG in an ICO container, for browsers and tools that only ever
// request /favicon.ico.
export async function GET() {
  const png = await iconPng(32);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14); // image size
  header.writeUInt32LE(header.length, 18); // image offset
  return new Response(new Uint8Array(Buffer.concat([header, png])), {
    headers: { "content-type": "image/x-icon" },
  });
}
