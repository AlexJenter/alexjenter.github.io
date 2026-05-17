// @ts-ignore
import { Delaunay } from "d3-delaunay";

export function applyWeightedCentroid(
  pts: [number, number][],
  lum: Uint8ClampedArray,
  w: number,
  h: number,
): void {
  const n = pts.length;
  const sumX = new Float32Array(n);
  const sumY = new Float32Array(n);
  const sumW = new Float32Array(n);
  const delaunay = new Delaunay(Float64Array.from(pts.flat()));

  let nearest = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const weight = lum[y * w + x];
      if (weight === 0) continue;
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${nw} ${nh}" width="${nw}" height="${nh}"><g fill="currentColor">${circles}</g></svg>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  a.download = "stipple.svg";
  a.click();
  URL.revokeObjectURL(a.href);
}
