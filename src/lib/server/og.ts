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
const SURFACE = "#eceae4";
const INK = "#1a1916";
const MUTED = "#5c5a56";
const ACCENT = "#ab4f1d"; // --color-accent-warm

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const PAD = 72;
// Artwork on the right, full height, in layout px (rendered at OG.scale). Its
// width is what's left of the card beside a column ART wide.
const ART = 630;
const ART_W = OG.width - ART;

// The big "A" stamped on the artwork: Fraunces at wght 900 in the display
// voice (opsz 72, SOFT 100, WONK 1), outlined with fontTools like the favicon
// glyph. Its box spans x 38–1506, y -1400–0 (2000 units/em).
const FAT_A =
  "M354 -638H958V-431H354ZM535 -100Q535 -54 508 -27Q482 0 424 0H149Q92 0 65 -27Q38 -54 38 -100Q38 -131 51 -153Q65 -175 94 -198L116 -215Q135 -230 147 -250Q159 -270 179 -337L406 -1079Q422 -1132 419 -1156Q416 -1179 383 -1197Q353 -1213 339 -1238Q324 -1263 324 -1300Q324 -1347 352 -1373Q380 -1400 436 -1400H1098Q1155 -1400 1182 -1373Q1210 -1347 1210 -1300Q1210 -1262 1194 -1237Q1179 -1212 1148 -1194Q1123 -1180 1120 -1155Q1118 -1131 1132 -1082L1340 -407Q1369 -314 1387 -273Q1405 -231 1437 -211Q1476 -187 1491 -163Q1506 -138 1506 -100Q1506 -55 1479 -28Q1452 0 1395 0H919Q861 0 835 -27Q808 -54 808 -100Q808 -136 824 -159Q840 -182 872 -199L900 -215Q919 -226 917 -250Q915 -274 897 -333L636 -1221L669 -1217L415 -380Q400 -330 393 -300Q386 -270 397 -251Q407 -232 441 -213L472 -197Q503 -180 519 -157Q535 -135 535 -100Z";

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
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Duotone: each grey level t maps linearly from ink (t = 0) to accent (t = 1).
    const [dark, light] = [rgb(INK), rgb(ACCENT)];
    const tones = Buffer.alloc(w * h * 3);
    for (let i = 0, j = 0; i < data.length; i += info.channels, j += 3) {
      const t = data[i] / 255;
      for (let c = 0; c < 3; c++)
        tones[j + c] = Math.round(dark[c] + (light[c] - dark[c]) * t);
    }
    base = sharp(tones, { raw: { width: w, height: h, channels: 3 } });
  } else {
    // No cover: a flat field of the duotone's light end.
    base = sharp({
      create: { width: w, height: h, channels: 3, background: ACCENT },
    });
  }
  // Glyph units → px: cap height 66% of the shorter side, so the A always
  // fits; its box (x 38–1506, y -1400–0) is centred.
  const k = (0.33 * Math.min(w, h)) / 1400;
  const a = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path fill="${SURFACE}" transform="translate(${w / 2 - ((38 + 1506) / 2) * k} ${h / 2 + 700 * k}) scale(${k})" d="${FAT_A}"/></svg>`;
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
