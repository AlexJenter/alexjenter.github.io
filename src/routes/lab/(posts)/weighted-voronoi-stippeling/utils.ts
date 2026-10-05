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

/** Ink weight of pixel i, 0.01–255: darkness squared (or lightness, inverted). */
function weightAt(lum: Uint8ClampedArray, i: number, invert: boolean): number {
  const raw = invert ? 255 - lum[i] : lum[i];
  return Math.max((raw * raw) / 255, MIN_WEIGHT);
}

/**
 * Starting points placed where the image has ink (rejection sampling on the
 * same weights). Lloyd relaxation only moves points locally, so from a
 * uniform start about half of them stay stranded in an empty background.
 */
export function seedPoints(
  n: number,
  lum: Uint8ClampedArray,
  w: number,
  h: number,
  invert = false,
): [number, number][] {
  const pts: [number, number][] = [];
  // a nearly blank image would take forever; past this, accept anything
  const maxTries = n * 1000;
  for (let tries = 0; pts.length < n; tries++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const p = weightAt(lum, (y | 0) * w + (x | 0), invert) / 255;
    if (tries > maxTries || Math.random() < p) pts.push([x, y]);
  }
  return pts;
}

export function applyWeightedCentroid(
  pts: [number, number][],
  lum: Uint8ClampedArray,
  w: number,
  h: number,
  invert = false,
): void {
  const n = pts.length;
  const sumX = new Float32Array(n);
  const sumY = new Float32Array(n);
  const sumW = new Float32Array(n);
  const delaunay = new Delaunay(Float64Array.from(pts.flat()));

  let nearest = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const weight = weightAt(lum, y * w + x, invert);
      nearest = delaunay.find(x, y, nearest);
      sumX[nearest] += x * weight;
      sumY[nearest] += y * weight;
      sumW[nearest] += weight;
    }
  }

  for (let i = 0; i < n; i++) {
    if (sumW[i] > 0) {
      pts[i][0] = sumX[i] / sumW[i];
      pts[i][1] = sumY[i] / sumW[i];
    }
  }
}

export function downloadSVG(
  pts: [number, number][],
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  dotRadius: number,
): void {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const scaleX = nw / canvasW;
  const scaleY = nh / canvasH;
  const r = (dotRadius * scaleX).toFixed(2);

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
