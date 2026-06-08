// @ts-ignore
import { Delaunay } from "d3-delaunay";

// Density floor: keeps Lloyd relaxation alive in flat zero-tone regions.
// Per Secord §2.1, a *uniform* density still reduces the weighted centroid
// to the plain geometric centroid — but only if density is non-zero. Without
// a floor, a Voronoi cell sampling only raw=0 pixels (e.g. flat white
// background) ends up with sumW===0 and its point freezes in place instead
// of relaxing into an even spacing.
const MIN_WEIGHT = 1;

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
      const raw = invert ? 255 - lum[y * w + x] : lum[y * w + x];
      const weight = Math.max((raw * raw) / 255, MIN_WEIGHT);
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

  const fg = window
    .getComputedStyle(document.body)
    .getPropertyValue("--color-text");
  const bg = window
    .getComputedStyle(document.body)
    .getPropertyValue("--color-bg");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${nw} ${nh}" width="${nw}" height="${nh}">
    <style>:root{--fg:${fg};--bg:${bg}}</style>
    <rect width="100%" height="100%" fill="var(--bg)"/>
    <g fill="var(--fg)">${circles}</g>
  </svg>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  a.download = "stipple.svg";
  a.click();
  URL.revokeObjectURL(a.href);
}
