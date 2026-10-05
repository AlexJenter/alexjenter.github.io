import sharp from "sharp";

// The site icon: the nav wordmark "A" (Fraunces wght 500, opsz 12, SOFT 100,
// WONK 1) on the surface colour. Favicons can't load web fonts, so the glyph
// is an outline, extracted from @fontsource-variable/fraunces with fontTools
// (2000 units/em, baseline at y=0, cap height 1400).
const A =
  "M362 -590H980L986 -456H353ZM494 -63Q494 -33 476 -17Q457 0 419 0H119Q81 0 63 -17Q44 -33 44 -63Q44 -84 56 -99Q68 -113 92 -127L127 -140Q151 -149 163 -168Q174 -187 192 -242L506 -1186Q519 -1226 514 -1242Q509 -1258 475 -1271Q445 -1282 430 -1297Q415 -1313 415 -1337Q415 -1367 434 -1383Q452 -1400 489 -1400H974Q1012 -1400 1030 -1383Q1048 -1366 1048 -1337Q1048 -1312 1032 -1296Q1017 -1280 986 -1269Q962 -1260 958 -1244Q954 -1227 964 -1194L1278 -262Q1297 -204 1316 -176Q1335 -149 1371 -135Q1406 -120 1419 -104Q1432 -88 1432 -63Q1432 -33 1414 -17Q1395 0 1357 0H950Q913 0 894 -17Q876 -33 876 -63Q876 -87 889 -103Q903 -118 928 -127L995 -141Q1020 -148 1018 -170Q1017 -191 1002 -236L657 -1283L683 -1284L344 -265Q332 -227 326 -205Q321 -182 331 -167Q341 -153 375 -139L442 -126Q466 -117 480 -102Q494 -87 494 -63Z";

// Mirrors tokens.css (--color-surface / --color-text); a static image can't
// read CSS variables.
const LIGHT = { surface: "#eceae4", ink: "#1a1916" };
const DARK = { surface: "#1a1916", ink: "#e8e6e0" };

type IconOptions = {
  /** Add a dark variant for browsers that apply prefers-color-scheme to SVG favicons. */
  adaptive?: boolean;
  /** false: a full-bleed square, for platforms that mask icons themselves (iOS). */
  rounded?: boolean;
};

export function iconSvg({ adaptive = false, rounded = true }: IconOptions = {}): string {
  const dark = adaptive
    ? `<style>@media (prefers-color-scheme: dark){.bg{fill:${DARK.surface}}.fg{fill:${DARK.ink}}}</style>`
    : "";
  // The glyph is centred in a 2000-unit square: its box spans x 44–1432 and
  // y -1400–0, so it fills 70% of the height.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000">${dark}<rect class="bg" width="2000" height="2000" rx="${rounded ? 280 : 0}" fill="${LIGHT.surface}"/><path class="fg" fill="${LIGHT.ink}" transform="translate(262 1700)" d="${A}"/></svg>`;
}

/** The icon rasterized to a square PNG. */
export function iconPng(size: number, options?: IconOptions): Promise<Buffer> {
  return sharp(Buffer.from(iconSvg(options))).resize(size, size).png().toBuffer();
}
