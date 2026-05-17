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
    import imgSrc from "./img0.jpg";

    const MAX_ITER = 10000;

    let pts: [number, number][] = [];
    let lum: Uint8ClampedArray | null = null;
    let iterCount = 0;
    let ar = $state<number | null>(null);
    let img: HTMLImageElement | null = null;
    let canvasW = 0;
    let canvasH = 0;

    let dotRadius = $state(5);
    let pendingPointCount = $state(5000);
    let pointCount = $state(5000);
    let uploadedImage = $state<string | undefined>(undefined);
    let imageKey = $state(0);

    $effect(() => {
        const n = pendingPointCount;
        const timer = setTimeout(() => {
            if (n === pointCount) return;
            lum = null;
            iterCount = 0;
            pointCount = n;
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
            imageKey++;
        };
    });

    onMount(() => {
        const image = new Image();
        image.src = imgSrc;
        image.onload = () => {
            img = image;
            ar = image.naturalWidth / image.naturalHeight;
        };
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
            applyWeightedCentroid(pts, lum!, w, h);
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

{#if ar !== null}
    <div class="hero" style="--ar: {ar}">
        {#key `${pointCount}-${imageKey}`}
            <Canvas {setup} {update} />
        {/key}
    </div>
    <Pane position="draggable" title="Stipple">
        <Slider bind:value={dotRadius} min={1} max={20} label="Dot radius" />
        <Slider
            bind:value={pendingPointCount}
            min={100}
            max={10000}
            step={100}
            label="Points"
        />
        <ImageControl bind:value={uploadedImage} fit="contain" label="Image" />
        <Button
            on:click={() => downloadSVG(pts, img!, canvasW, canvasH, dotRadius)}
            title="Download SVG"
            label=""
        />
    </Pane>
{/if}

<style>
    .hero {
        width: calc(100svh * var(--ar));
        max-width: 100vw;
        height: auto;
        aspect-ratio: var(--ar);
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        margin-top: calc(-1 * var(--space-16));
    }
</style>
