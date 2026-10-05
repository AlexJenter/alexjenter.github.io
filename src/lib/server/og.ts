import satori from "satori";
import sharp from "sharp";
import type { PostFrontmatter } from "$lib";
import { formatDate } from "$lib/date";
import { OG, PAGES, SITE_NAME } from "$lib/site";
// A static instance of the display voice (opsz 72, wght 400, SOFT 100,
// WONK 1), made from @fontsource-variable/fraunces with fontTools: satori
// reads neither woff2 nor variable fonts.
import frauncesDisplay from "./fonts/fraunces-display.ttf?inline";
import plexMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff?inline";

// Link preview cards, rendered at build time by the prerendered
// /og/[slug].png endpoint: satori lays out the card and outlines its text,
// sharp rasterizes the resulting SVG.

// Light theme tokens (tokens.css): a preview can't follow the viewer's theme.
const PAPER = "#f5f4f0";
const INK = "#1a1916";
const MUTED = "#5c5a56";
// The dark-theme --color-accent-warm, on purpose: lighter than the light
// theme's, so the ink monogram pushes through the artwork while the cover
// still clearly shows the post's topic.
const ACCENT = "#e07840";

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const PAD = 72;
// Artwork on the right, full height, in layout px (rendered at OG.scale). Its
// width is what's left of the card beside a column ART wide.
const ART = 630;
const ART_W = OG.width - ART;

// The big "A" stamped on the artwork: Fraunces in the display voice (wght 400,
// opsz 72, SOFT 100, WONK 1), outlined with fontTools like the favicon glyph.
// 2000 units/em, cap height 1400 (y -1400–0); x0–x1 is the width.
const A = {
  x0: 24,
  x1: 1341,
  d: "M329 -577H927L934 -464H321ZM446 -54Q446 -28 431 -14Q415 0 383 0H87Q56 0 40 -14Q24 -28 24 -54Q24 -73 35 -85Q46 -97 68 -109L105 -121Q130 -130 140 -149Q151 -167 167 -218L492 -1213Q504 -1250 498 -1264Q492 -1278 460 -1289Q432 -1299 417 -1312Q402 -1325 402 -1346Q402 -1372 418 -1386Q435 -1400 466 -1400H889Q921 -1400 937 -1386Q953 -1371 953 -1346Q953 -1325 938 -1311Q923 -1298 894 -1288Q869 -1280 864 -1266Q858 -1252 868 -1220L1197 -225Q1213 -174 1233 -150Q1252 -127 1287 -114Q1318 -102 1330 -89Q1341 -75 1341 -54Q1341 -29 1326 -14Q1310 0 1278 0H904Q872 0 856 -14Q840 -28 840 -54Q840 -75 853 -88Q865 -102 888 -109L959 -121Q982 -127 983 -147Q984 -167 970 -211L617 -1299L644 -1301L295 -236Q284 -200 281 -178Q278 -155 289 -143Q299 -130 326 -121L399 -108Q422 -101 434 -88Q446 -74 446 -54Z",
};

/** Decode a data: URL as Vite's ?inline gives it (base64, or URL-encoded SVG). */
function fromDataUrl(url: string): Buffer {
  const comma = url.indexOf(",");
  const data = url.slice(comma + 1);
  return url.slice(0, comma).endsWith(";base64")
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data));
}

const fonts = [
  {
    name: "Fraunces",
    data: fromDataUrl(frauncesDisplay),
    weight: 400,
    style: "normal",
  },
  {
    name: "Plex Mono",
    data: fromDataUrl(plexMono),
    weight: 400,
    style: "normal",
  },
] as const;

const posts = import.meta.glob<PostFrontmatter>("/src/routes/lab/**/+page.md", {
  eager: true,
  import: "metadata",
});
// Covers are the frontmatter `cover` file; only cover.* files are bundled here.
const covers = import.meta.glob<string>(
  "/src/routes/lab/**/cover.{svg,png,jpg,jpeg,webp}",
  { eager: true, query: "?inline", import: "default" },
);

const postsBySlug = new Map(
  Object.entries(posts).map(([path, meta]) => [
    path.split("/").at(-2)!,
    { path, meta },
  ]),
);

/** Slugs to prerender a card for: the pages plus every public post. */
export function ogSlugs(): string[] {
  const published = [...postsBySlug]
    .filter(([, post]) => post.meta.status === "public")
    .map(([slug]) => slug);
  return [...Object.keys(PAGES), ...published];
}

/** The artwork at its rendered size (ART_W × ART), so satori never stretches
    it: the cover cropped to fill and duotoned ink→accent (or a flat accent
    field), with the big surface-coloured "A" on top, distinct from both. */
async function artwork(cover?: Buffer): Promise<Buffer> {
  const w = ART_W * OG.scale;
  const h = ART * OG.scale;
  let base: sharp.Sharp;
  if (cover) {
    const { width = w, format } = await sharp(cover).metadata();
    // SVGs render at their intrinsic size; aim for about twice the target.
    const density =
      format === "svg"
        ? Math.min(2400, (72 * 2 * Math.max(w, h)) / width)
        : undefined;
    const { data, info } = await sharp(cover, density ? { density } : {})
      .resize(w, h, { fit: "cover" })
      .flatten({ background: PAPER })
      .grayscale()
      // stretch to the full range, so the ground lands exactly on paper and
      // doesn't seam against the text column
      .normalise()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Duotone, printed like accent ink on paper: each grey level maps linearly
    // between accent (the marks) and paper (the background). The cover's
    // dominant tone is taken as its background, so a dark-ground cover (light
    // marks on black, like the voronoi export) still gets a paper background.
    let sum = 0;
    for (let i = 0; i < data.length; i += info.channels) sum += data[i];
    const darkGround = sum / (data.length / info.channels) < 128;
    const [mark, ground] = [rgb(ACCENT), rgb(PAPER)];
    const tones = Buffer.alloc(w * h * 3);
    for (let i = 0, j = 0; i < data.length; i += info.channels, j += 3) {
      const v = darkGround ? 1 - data[i] / 255 : data[i] / 255; // 0 mark → 1 ground
      // Snap the last 4% at either end, so a near-white ground lands exactly
      // on paper (seamless with the text column) and marks on exact accent.
      const t = Math.min(1, Math.max(0, (v - 0.04) / 0.92));
      for (let c = 0; c < 3; c++)
        tones[j + c] = Math.round(mark[c] + (ground[c] - mark[c]) * t);
    }
    base = sharp(tones, { raw: { width: w, height: h, channels: 3 } });
  } else {
    // No cover: just paper.
    base = sharp({
      create: { width: w, height: h, channels: 3, background: PAPER },
    });
  }
  // Glyph units → px: cap height 33% of the shorter side; its box
  // (x0–x1, y -1400–0) is centred.
  const k = (0.66 * Math.min(w, h)) / 1400;
  const a = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path fill="${INK}" transform="translate(${w / 2 - ((A.x0 + A.x1) / 2) * k} ${h / 2 + 700 * k}) scale(${k})" d="${A.d}"/></svg>`;
  return base
    .composite([{ input: Buffer.from(a) }])
    .png()
    .toBuffer();
}

type Card = { kicker: string; title: string; footer: string; art: Buffer };

async function cardFor(slug: string): Promise<Card | undefined> {
  if (slug in PAGES) {
    const { heading, description } = PAGES[slug as keyof typeof PAGES];
    return {
      kicker: SITE_NAME,
      title: heading,
      footer: description,
      art: await artwork(),
    };
  }
  const post = postsBySlug.get(slug);
  if (!post) return;
  const { title, date, cover } = post.meta;
  const coverUrl =
    cover && covers[post.path.replace("+page.md", cover.replace("./", ""))];
  return {
    kicker: `${SITE_NAME} — Lab`,
    title,
    footer: formatDate(date),
    art: await artwork(coverUrl ? fromDataUrl(coverUrl) : undefined),
  };
}

// satori takes React-element-shaped objects; no JSX needed for one template.
type El = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children: unknown,
): El => ({
  type,
  props: { style, children },
});

function template({ kicker, title, footer, art }: Card): El {
  const titleSize = title.length > 24 ? 64 : 80;
  return el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: 56,
      padding: 0,
      background: PAPER,
      color: INK,
      fontFamily: "Plex Mono",
    },
    [
      el(
        "div",
        {
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: PAD,
        },
        [
          el(
            "div",
            {
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
            },
            kicker,
          ),
          el(
            "div",
            {
              fontFamily: "Fraunces",
              fontSize: titleSize,
              lineHeight: 1.1,
              letterSpacing: -0.02 * titleSize,
            },
            title,
          ),
          el("div", { fontSize: 26, lineHeight: 1.4, color: MUTED }, footer),
        ],
      ),
      {
        type: "img",
        props: {
          src: `data:image/png;base64,${art.toString("base64")}`,
          width: ART_W,
          height: ART,
          // style: { borderRadius: 8 },
        },
      },
    ],
  );
}

/** The slug's preview card as PNG, or undefined if there's no such page. */
export async function renderOg(slug: string): Promise<Buffer | undefined> {
  const card = await cardFor(slug);
  if (!card) return;
  const svg = await satori(template(card) as never, {
    width: OG.width,
    height: OG.height,
    fonts: [...fonts],
  });
  // satori's SVG is in layout px; rasterizing at a higher density scales it.
  return sharp(Buffer.from(svg), { density: 72 * OG.scale })
    .png()
    .toBuffer();
}
