<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Slider, Toggle, Radio, Button } from "$lib/components/gui";
    import { theme, cssVar } from "$lib/theme.svelte";
    // The font as a data URL: the name is drawn through an SVG image, which
    // cannot see the page's fonts, so the file travels inside the SVG.
    import fontData from "@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2?inline";

    // LinkedIn's cover is 1584×396 (4:1); the PNG goes out at 2× for retina.
    const BANNER_W = 1584;
    const BANNER_H = 396;
    const EXPORT_SCALE = 2;
    // The name map is a quarter of the banner: it is blurred anyway.
    const MAP_SCALE = 0.5;

    // --- controls -----------------------------------------------------------
    let name = $state("Alex\nJenter");
    let weight = $state(900);
    let opsz = $state(30);
    let soft = $state(100);
    let wonk = $state(true);
    let size = $state(64); // font size, % of the banner height
    let leading = $state(1); // line distance, in font sizes
    let align = $state("center"); // of the lines, on the offset X position
    let offsetX = $state(23); // % of the width, right of centre
    let offsetY = $state(0); // % of the height, below centre

    let tagline = $state("Frontend developer & creative coder".toUpperCase());
    let tagSize = $state(13); // px in the banner

    let blur = $state(7); // blur radius of the name map, banner px
    let pitch = $state(13); // distance between two arms of the spiral, px
    let wavelength = $state(7); // px along the line
    let amplitude = $state(4.5); // px, where the map is darkest
    let gamma = $state(0.6); // <1 widens the waves toward the light, >1 narrows
    let lineWidth = $state(1);

    // The profile photo, in banner units (measured from a LinkedIn screenshot).
    const AVATAR = { x: 250, y: 362, r: 160 };
    let guides = $state(false);

    // What shapes the name map. Changing any of it rebuilds the map, which is
    // debounced (a dragged slider would rebuild it on every tick).
    const shape = () => ({
        name,
        weight,
        opsz,
        soft,
        wonk,
        size,
        leading,
        align,
        offsetX,
        offsetY,
        blur,
        dark: theme.resolved === "dark",
    });
    let committed = $state(shape());
    $effect(() => {
        const next = shape();
        if (JSON.stringify(next) === JSON.stringify(committed)) return;
        const timer = setTimeout(() => (committed = next), 200);
        return () => clearTimeout(timer);
    });

    // --- name map -----------------------------------------------------------
    // Darkness of the (blurred) name, 0–255 per pixel, MAP_SCALE× the banner.
    type NameMap = { data: Float32Array; w: number; h: number; sig: string };
    let map: NameMap | null = null;
    let building = "";

    const ANCHOR: Record<string, string> = {
        left: "start",
        center: "middle",
        right: "end",
    };

    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    /** Ink of the name, 0–1, as the SVG renders it (no blur yet). */
    async function renderName(
        w: number,
        h: number,
        s: ReturnType<typeof shape>,
        dx = 0, // shifts the whole block sideways, map px
    ): Promise<Float32Array> {
        const k = w / BANNER_W;
        const fontSize = (s.size / 100) * BANNER_H * k;
        const parts = s.name.split(/\\n|\n/);
        const cx = w / 2 + (s.offsetX / 100) * w + dx;
        const cy = h / 2 + (s.offsetY / 100) * h;
        const lines = parts
            .map((part, i) => {
                const y =
                    cy + (i - (parts.length - 1) / 2) * s.leading * fontSize;
                return `<text x="${cx}" y="${y}" text-anchor="${ANCHOR[s.align]}" dominant-baseline="central" fill="#000"
                font-family="F" font-size="${fontSize}" font-weight="${s.weight}"
                style="font-variation-settings:'opsz' ${s.opsz},'WONK' ${s.wonk ? 1 : 0},'SOFT' ${s.soft}">${esc(part)}</text>`;
            })
            .join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <style>@font-face{font-family:F;src:url(${fontData}) format("woff2");font-weight:100 900}</style>
            <rect width="100%" height="100%" fill="#fff"/>
            ${lines}
        </svg>`;

        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await img.decode();
        const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const ink = new Float32Array(w * h);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            ink[j] =
                1 -
                (0.2126 * data[i] +
                    0.7152 * data[i + 1] +
                    0.0722 * data[i + 2]) /
                    255;
        }
        return ink;
    }

    /** Three box blurs approximate a Gaussian (ctx.filter is missing in Safari). */
    function boxBlur(buf: Float32Array, w: number, h: number, radius: number) {
        const r = Math.round(radius);
        if (r < 1) return;
        const tmp = new Float32Array(buf.length);
        const pass = (
            src: Float32Array,
            dst: Float32Array,
            len: number,
            lines: number,
            stride: number,
            lineStride: number,
        ) => {
            const norm = 1 / (2 * r + 1);
            for (let l = 0; l < lines; l++) {
                const o = l * lineStride;
                let sum = 0;
                // edges repeat their last pixel
                for (let i = -r; i <= r; i++)
                    sum += src[o + Math.min(len - 1, Math.max(0, i)) * stride];
                for (let i = 0; i < len; i++) {
                    dst[o + i * stride] = sum * norm;
                    sum +=
                        src[o + Math.min(len - 1, i + r + 1) * stride] -
                        src[o + Math.max(0, i - r) * stride];
                }
            }
        };
        for (let n = 0; n < 3; n++) {
            pass(buf, tmp, w, h, 1, w);
            pass(tmp, buf, h, w, w, 1);
        }
    }

    async function buildMap(s: ReturnType<typeof shape>, sig: string) {
        const w = Math.round(BANNER_W * MAP_SCALE);
        const h = Math.round(BANNER_H * MAP_SCALE);
        let data = await renderName(w, h, s);
        if (s.align !== "center") {
            // The anchor is the left or right edge of the lines, which moves
            // the block off the offset: find where its ink spans and shift the
            // block back so its middle is on the offset.
            let lo = w;
            let hi = -1;
            for (let i = 0; i < data.length; i++) {
                if (data[i] < 0.5) continue;
                const x = i % w;
                lo = Math.min(lo, x);
                hi = Math.max(hi, x);
            }
            if (hi >= 0) {
                const target = w / 2 + (s.offsetX / 100) * w;
                data = await renderName(w, h, s, target - (lo + hi + 1) / 2);
            }
        }
        boxBlur(data, w, h, (s.blur * MAP_SCALE) / 1.7); // 3 passes widen ×~1.7
        // Stretch so the darkest point of the blurred name is 1.
        let max = 0;
        for (let i = 0; i < data.length; i++) max = Math.max(max, data[i]);
        if (max > 0) for (let i = 0; i < data.length; i++) data[i] /= max;
        return { data, w, h, sig };
    }

    /** Bilinear sample of the map at banner coordinates; 0 outside. */
    function darkness(m: NameMap, x: number, y: number) {
        const u = x * MAP_SCALE - 0.5;
        const v = y * MAP_SCALE - 0.5;
        const x0 = Math.floor(u);
        const y0 = Math.floor(v);
        const fx = u - x0;
        const fy = v - y0;
        const at = (X: number, Y: number) =>
            X < 0 || Y < 0 || X >= m.w || Y >= m.h ? 0 : m.data[Y * m.w + X];
        return (
            (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
            (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
        );
    }

    // --- drawing ------------------------------------------------------------
    /**
     * One Archimedean spiral, r = k·θ with k = pitch / 2π, from the centre of
     * the name out past the farthest corner. Every point is pushed sideways
     * (along the radius) by amplitude · darkness · sin(2π s / wavelength),
     * where s is the length walked along the spiral so the wavelength holds
     * from the centre to the rim. The darkness is read at the unpushed point.
     */
    function spiral(
        m: NameMap,
        cx: number,
        cy: number,
        emit: (x: number, y: number, first: boolean) => void,
    ) {
        const k = pitch / (2 * Math.PI);
        const reach = Math.max(
            Math.hypot(cx, cy),
            Math.hypot(BANNER_W - cx, cy),
            Math.hypot(cx, BANNER_H - cy),
            Math.hypot(BANNER_W - cx, BANNER_H - cy),
        );
        const rMax = reach + amplitude + pitch;
        const STEP = 1; // px of arc per point
        let theta = 0;
        let s = 0;
        let first = true;
        while (k * theta < rMax) {
            const r = k * theta;
            const bx = cx + r * Math.cos(theta);
            const by = cy + r * Math.sin(theta);
            const d = Math.pow(darkness(m, bx, by), gamma);
            const push =
                amplitude * d * Math.sin((2 * Math.PI * s) / wavelength);
            emit(
                bx + push * Math.cos(theta),
                by + push * Math.sin(theta),
                first,
            );
            first = false;
            // ds = √(r² + k²) dθ
            theta += STEP / Math.hypot(r, k);
            s += STEP;
        }
    }

    const colors = () => ({
        paper: cssVar("--color-bg", "#f5f4f0"),
        ink: cssVar("--color-text", "#1a1916"),
        muted: cssVar("--color-text-muted", "#6b685f"),
        mono: cssVar("--font-mono", "monospace"),
    });

    /** The whole cover, drawn in banner units scaled by `f`. */
    function draw(
        ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
        f: number,
        m: NameMap,
    ) {
        const { paper, ink, muted, mono } = colors();
        const s = committed;
        ctx.setTransform(f, 0, 0, f, 0, 0);
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, BANNER_W, BANNER_H);

        // const cx = BANNER_W / 2 + (s.offsetX / 100) * BANNER_W;
        const cx = AVATAR.x;
        const cy = AVATAR.y;

        ctx.strokeStyle = ink;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.beginPath();
        spiral(m, cx, cy, (x, y, first) =>
            first ? ctx.moveTo(x, y) : ctx.lineTo(x, y),
        );
        ctx.stroke();

        // The tagline sits on a paper halo, so no arm runs through the letters.
        if (tagline) {
            ctx.font = `400 ${tagSize}px ${mono}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineJoin = "round";
            ctx.strokeStyle = paper;
            ctx.lineWidth = tagSize * 1.1;
            // at the centre of the name block
            const nx = BANNER_W / 2 + (s.offsetX / 100) * BANNER_W;
            const ny = BANNER_H / 2 + (s.offsetY / 100) * BANNER_H;

            const TAGLINE_X = nx;
            const TAGLINE_y = BANNER_H / 2;
            ctx.strokeText(tagline, TAGLINE_X, TAGLINE_y);
            ctx.fillStyle = muted;
            ctx.fillText(tagline, TAGLINE_X, TAGLINE_y);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // --- canvas -------------------------------------------------------------
    let drawn = "";
    let status = $state("");

    const setup = async () => {
        await document.fonts.load(
            `400 16px ${cssVar("--font-mono", "monospace")}`,
        );
    };

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const sig = JSON.stringify(committed);
        if (map?.sig !== sig) {
            if (building !== sig) {
                building = sig;
                const s = committed;
                buildMap(s, sig).then((built) => {
                    if (building === sig) map = built;
                });
            }
            if (!map) return;
        }
        if (!map) return;
        const frame = `${w}×${h} ${map.sig} ${cssVar("--color-bg")} ${tagline} ${tagSize}${pitch} ${wavelength} ${amplitude} ${gamma} ${lineWidth}`;
        if (frame === drawn) return;
        drawn = frame;
        const t0 = performance.now();
        draw(ctx, w / BANNER_W, map);
        status = `${Math.round(performance.now() - t0)} ms to draw`;
    };

    // --- export -------------------------------------------------------------
    const outW = BANNER_W * EXPORT_SCALE;
    const outH = BANNER_H * EXPORT_SCALE;

    async function downloadPNG() {
        if (!map) return;
        const canvas = new OffscreenCanvas(outW, outH);
        draw(canvas.getContext("2d")!, EXPORT_SCALE, map);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
            await canvas.convertToBlob({ type: "image/png" }),
        );
        a.download = "linkedin-cover.png";
        a.click();
        URL.revokeObjectURL(a.href);
    }
</script>

<svelte:head>
    <title>LinkedIn cover — v2</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
    <h1>LinkedIn cover</h1>
    <p class="hint">
        {BANNER_W}×{BANNER_H}, exported at {outW}×{outH}. The colors follow the
        theme: flip it in the nav to pick the palette.
    </p>
    <p class="hint">{status}</p>

    <div class="banner">
        <Canvas {setup} {update} label="Name written in a spiral line" />
        {#if guides}
            <!-- LinkedIn's own UI on top of the cover: the profile photo. -->
            <svg
                class="guides"
                viewBox="0 0 {BANNER_W} {BANNER_H}"
                aria-hidden="true"
            >
                <circle cx={AVATAR.x} cy={AVATAR.y} r={AVATAR.r} />
            </svg>
        {/if}
    </div>

    <div class="controls">
        <div class="col">
            <label class="field">
                <span>Name (\n = new line)</span>
                <input type="text" bind:value={name} />
            </label>
            <Slider
                bind:value={size}
                min={10}
                max={100}
                step={1}
                label="Size %"
            />
            <Slider
                bind:value={leading}
                min={0.6}
                max={1.5}
                step={0.01}
                label="Line distance"
            />
            <Radio
                bind:value={align}
                label="Align"
                options={[
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                ]}
            />
            <Slider
                bind:value={offsetX}
                min={-50}
                max={50}
                step={0.5}
                label="Offset X %"
            />
            <Slider
                bind:value={offsetY}
                min={-50}
                max={50}
                step={0.5}
                label="Offset Y %"
            />
        </div>
        <div class="col">
            <Slider
                bind:value={weight}
                min={100}
                max={900}
                step={10}
                label="Weight"
            />
            <Slider
                bind:value={opsz}
                min={9}
                max={144}
                step={1}
                label="Optical size"
            />
            <Slider bind:value={soft} min={0} max={100} step={1} label="Soft" />
            <Toggle bind:value={wonk} label="Wonk" />
            <Slider bind:value={blur} min={0} max={60} step={1} label="Blur" />
        </div>
        <div class="col">
            <Slider
                bind:value={pitch}
                min={4}
                max={40}
                step={0.5}
                label="Spiral pitch"
            />
            <Slider
                bind:value={wavelength}
                min={3}
                max={40}
                step={0.5}
                label="Wavelength"
            />
            <Slider
                bind:value={amplitude}
                min={0}
                max={60}
                step={0.5}
                label="Amplitude"
            />
            <Slider
                bind:value={gamma}
                min={0.3}
                max={3}
                step={0.05}
                label="Contrast"
            />
            <Slider
                bind:value={lineWidth}
                min={0.4}
                max={4}
                step={0.1}
                label="Line width"
            />
        </div>
        <div class="col">
            <label class="field">
                <span>Tagline</span>
                <input type="text" bind:value={tagline} />
            </label>
            <Slider
                bind:value={tagSize}
                min={8}
                max={40}
                step={0.5}
                label="Tagline size"
            />
            <Toggle bind:value={guides} label="Guides" />
        </div>
        <div class="col">
            <Button label="Download PNG" onclick={downloadPNG} />
        </div>
    </div>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .page {
        max-width: var(--max-w-wide);
        margin: 0 auto;
        padding: var(--space-8) var(--space-4);
    }

    .hint {
        @include m.meta-label;
        color: var(--color-text-muted);
        margin: var(--space-2) 0 var(--space-6);
    }

    .banner {
        position: relative;
        width: 100%;
        max-width: 1584px;
        aspect-ratio: 4 / 1;
        outline: 1px solid var(--color-text-muted);
    }

    .guides {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        fill: none;
        stroke: var(--color-accent-warm);
        stroke-width: 2;
        stroke-dasharray: 8 6;
    }

    .controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: var(--space-8) var(--space-6);
        margin-top: var(--space-8);
    }

    .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);

        span {
            @include m.meta-label;
            color: var(--color-text-muted);
        }

        input {
            font: inherit;
            font-family: var(--font-mono);
            color: var(--color-text);
            background: transparent;
            border: 1px solid var(--color-text-muted);
            padding: var(--space-2);

            &:focus-visible {
                @include m.focus-ring;
            }
        }
    }
</style>
