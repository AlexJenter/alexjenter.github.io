<script lang="ts">
    // @ts-ignore
    import { Delaunay } from "d3-delaunay";
    import Canvas from "$lib/components/Canvas.svelte";
    import imgSrc from "./img0.jpg";

    const N = 1500;
    const MAX_ITER = 150;

    let pts: [number, number][] = [];
    let lum: Uint8ClampedArray | null = null;
    let iterCount = 0;

    const setup = (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
        pts = Array.from(
            { length: N },
            () => [Math.random() * w, Math.random() * h] as [number, number],
        );

        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            const offscreen = new OffscreenCanvas(w, h);
            const offCtx = offscreen.getContext("2d")!;
            offCtx.drawImage(img, 0, 0, w, h);
            const { data } = offCtx.getImageData(0, 0, w, h);
            const buf = new Uint8ClampedArray(w * h);
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                buf[j] =
                    0.2126 * data[i] +
                    0.7152 * data[i + 1] +
                    0.0722 * data[i + 2];
            }
            lum = buf;
        };
    };

    function applyWeightedCentroid(w: number, h: number) {
        const n = pts.length;
        const sumX = new Float32Array(n);
        const sumY = new Float32Array(n);
        const sumW = new Float32Array(n);
        const delaunay = new Delaunay(Float64Array.from(pts.flat()));

        let nearest = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const weight = lum![y * w + x];
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

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (!lum) return;

        if (iterCount < MAX_ITER) {
            applyWeightedCentroid(w, h);
            iterCount++;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--color-text")
                .trim() || "#A9AFBC";

        for (const [x, y] of pts) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };
</script>

<div class="hero">
    <Canvas {setup} {update} />
</div>

<style>
    .hero {
        width: 100%;
        height: 100%;
    }
</style>
