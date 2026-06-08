<script lang="ts">
    import { onMount } from "svelte";
    import Canvas from "$lib/components/Canvas.svelte";
    import {
        Button,
        Image as ImageControl,
        Pane,
        Slider,
    } from "svelte-tweakpane-ui";
    import { applyWeightedCentroid, downloadSVG } from "./utils";
    import { usePaneFade } from "./usePaneFade.svelte";

    import imgSrc from "./img0.jpg";

    const paneFadeZone = 200;
    usePaneFade({ fadeZone: paneFadeZone, ready: () => ar !== null });

    const MAX_ITER = 10000;

    let pts: [number, number][] = [];
    let lum: Uint8ClampedArray | null = null;
    let iterCount = 0;
    let ar = $state<number | null>(null);
    let img: HTMLImageElement | null = null;
    let canvasW = 0;
    let canvasH = 0;

    let isDark = $state(false);
    let dotRadius = $state(10);
    let pendingPointCount = $state(1000);
    let pointCount = $state(1000);
    let uploadedImage = $state<string | undefined>(undefined);
    let resetKey = $state(0);

    $effect(() => {
        const n = pendingPointCount;
        const timer = setTimeout(() => {
            if (n === pointCount) return;
            lum = null;
            iterCount = 0;
            pointCount = n;
            resetKey++;
        }, 400);
        return () => clearTimeout(timer);
    });

    $effect(() => {
        const src = uploadedImage;
        if (!src) return;
        const image = new Image();
        image.src = src;
        image.onload = () => {
            lum = null;
            iterCount = 0;
            img = image;
            ar = image.naturalWidth / image.naturalHeight;
            resetKey++;
        };
    });

    onMount(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        isDark = mq.matches;
        const onSchemeChange = (e: MediaQueryListEvent) => {
            isDark = e.matches;
            lum = null;
            iterCount = 0;
            resetKey++;
        };
        mq.addEventListener("change", onSchemeChange);

        const image = new Image();
        image.src = imgSrc;
        image.onload = () => {
            img = image;
            ar = image.naturalWidth / image.naturalHeight;
            resetKey++;
        };

        return () => mq.removeEventListener("change", onSchemeChange);
    });

    const setup = (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
        canvasW = w;
        canvasH = h;
        pts = Array.from(
            { length: pointCount },
            () => [Math.random() * w, Math.random() * h] as [number, number],
        );
        iterCount = 0;

        const offscreen = new OffscreenCanvas(w, h);
        const offCtx = offscreen.getContext("2d")!;
        offCtx.drawImage(img!, 0, 0, w, h);
        const { data } = offCtx.getImageData(0, 0, w, h);
        const buf = new Uint8ClampedArray(w * h);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            buf[j] =
                0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        lum = buf;
    };

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (!lum) return;

        if (iterCount < MAX_ITER) {
            applyWeightedCentroid(pts, lum!, w, h, !isDark);
            iterCount++;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--color-text")
                .trim() || "#A9AFBC";

        for (const [x, y] of pts) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (iterCount >= MAX_ITER) return false;
    };
</script>

<div class="hero">
    {#if ar !== null}
        <div class="inner" style="--ar: {ar}">
            {#key `${resetKey}`}
                <Canvas
                    {setup}
                    {update}
                    label="Weighted Voronoi stipple animation"
                />
            {/key}
        </div>
        <Pane position="draggable" title="Stipple">
            <Slider
                bind:value={dotRadius}
                min={1}
                max={20}
                label="Dot radius"
            />
            <Slider
                bind:value={pendingPointCount}
                min={100}
                max={10000}
                step={100}
                label="Points"
            />
            <ImageControl
                bind:value={uploadedImage}
                fit="contain"
                label="Image"
            />
            <Button
                on:click={() =>
                    downloadSVG(pts, img!, canvasW, canvasH, dotRadius)}
                title="Download SVG"
                label=""
            />
            <Button on:click={() => resetKey++} title="Reset" label="" />
        </Pane>
    {/if}
</div>

<style>
    .hero {
        width: 100vw;
        height: 100svh;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-block-end: 7rem;

        > .inner {
            aspect-ratio: var(--ar);
            width: min(100vw, 100svh * var(--ar));
            height: min(100svh, 100vw / var(--ar));
        }
    }
</style>
