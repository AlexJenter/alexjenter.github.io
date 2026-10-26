// @ts-ignore
import { Delaunay } from "d3-delaunay";
import { cssVar } from "$lib/theme.svelte";

// Density floor: keeps Lloyd relaxation alive in flat zero-tone regions.
// Per Secord §2.1, a *uniform* density still reduces the weighted centroid
// to the plain geometric centroid — but only if density is non-zero. Without
// a floor, a Voronoi cell sampling only raw=0 pixels (e.g. flat white
// background) ends up with sumW===0 and its point freezes in place instead
// of relaxing into an even spacing. Kept tiny so blank areas still weigh
// next to nothing against ink: at 1, a white background held ~4% of the dots.
const MIN_WEIGHT = 0.01;

/**
 * Ink of every pixel, 0–255: darkness (or lightness, inverted) shaped by
 * `curve`, a lookup table that maps ink 0…1 to 0…1 (any length ≥ 2).
 */
export function inkBuffer(
  lum: Uint8ClampedArray,
  invert: boolean,
  curve: ArrayLike<number>,
): Uint8ClampedArray {
  const last = curve.length - 1;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const t = v / 255;
    // linear lookup between curve samples
    const at = t * last;
    const i = Math.min(last - 1, Math.floor(at));
    const y = curve[i] + (curve[i + 1] - curve[i]) * (at - i);
    lut[v] = Math.round(y * 255);
  }
  const ink = new Uint8ClampedArray(lum.length);
  for (let i = 0; i < lum.length; i++) {
    ink[i] = lut[invert ? 255 - lum[i] : lum[i]];
  }
  return ink;
}

/** Weight of pixel i, 0.01–255: ink squared. */
function weightAt(ink: Uint8ClampedArray, i: number): number {
  return Math.max((ink[i] * ink[i]) / 255, MIN_WEIGHT);
}

/**
 * Starting points placed where the image has ink (rejection sampling on the
 * same weights). Lloyd relaxation only moves points locally, so from a
 * uniform start about half of them stay stranded in an empty background.
 */
export function seedPoints(
  n: number,
  ink: Uint8ClampedArray,
  w: number,
  h: number,
): [number, number][] {
  const pts: [number, number][] = [];
  // a nearly blank image would take forever; past this, accept anything
  const maxTries = n * 1000;
  for (let tries = 0; pts.length < n; tries++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const p = weightAt(ink, (y | 0) * w + (x | 0)) / 255;
    if (tries > maxTries || Math.random() < p) pts.push([x, y]);
  }
  return pts;
}

/**
 * One weighted Lloyd iteration: every sampled pixel (every `step`-th, both
 * ways) votes for its nearest point with its ink weight, and each point moves
 * to the weighted centroid of its votes. Returns the largest distance any
 * point moved, so the caller can stop once the stipple has settled.
 */
export function applyWeightedCentroid(
  pts: [number, number][],
  ink: Uint8ClampedArray,
  w: number,
  h: number,
  step = 2,
): number {
  const n = pts.length;
  const sumX = new Float32Array(n);
  const sumY = new Float32Array(n);
  const sumW = new Float32Array(n);
  const delaunay = new Delaunay(Float64Array.from(pts.flat()));

  let nearest = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const weight = weightAt(ink, y * w + x);
      nearest = delaunay.find(x, y, nearest);
      sumX[nearest] += x * weight;
      sumY[nearest] += y * weight;
      sumW[nearest] += weight;
    }
  }

  let moved = 0;
  for (let i = 0; i < n; i++) {
    if (sumW[i] > 0) {
      const x = sumX[i] / sumW[i];
      const y = sumY[i] / sumW[i];
      moved = Math.max(moved, Math.hypot(x - pts[i][0], y - pts[i][1]));
      pts[i][0] = x;
      pts[i][1] = y;
    }
  }
  return moved;
}

/**
 * Dot radius in px for a size in % — measured, as SVG measures a circle's
 * percentage `r`, against the normalised diagonal √((w² + h²) / 2). So a
 * size means the same on any canvas and in the exported SVG, and the stipple
 * looks the same at every screen size and pixel density.
 */
export function percentRadius(pct: number, w: number, h: number): number {
  return (pct / 100) * Math.sqrt((w * w + h * h) / 2);
}

export function downloadSVG(
  pts: [number, number][],
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  dotSize: number,
): void {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const scaleX = nw / canvasW;
  const scaleY = nh / canvasH;
  // The same % the canvas uses (see percentRadius), worked out for the image
  // size: an absolute radius reads the same in every SVG tool and plotter.
  const r = percentRadius(dotSize, nw, nh).toFixed(2);

  const circles = pts
    .map(
      ([x, y]) =>
        `<circle cx="${(x * scaleX).toFixed(2)}" cy="${(y * scaleY).toFixed(2)}" r="${r}"/>`,
    )
    .join("");

  const fg = cssVar("--color-text");
  const bg = cssVar("--color-bg");

  // Literal colours, not CSS variables: most SVG tools outside the browser
  // (librsvg, editors, viewers) don't resolve var() and paint it black.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${nw} ${nh}" width="${nw}" height="${nh}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <g fill="${fg}">${circles}</g>
  </svg>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  a.download = "stipple.svg";
  a.click();
  URL.revokeObjectURL(a.href);
}
