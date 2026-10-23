<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Slider, Checkbox, Button } from "$lib/components/gui";
    import { theme, cssVar, cssRGB } from "$lib/theme.svelte";
    // @ts-ignore
    import { Delaunay } from "d3-delaunay";
    // The font as a data URL: the name is drawn through an SVG image, which
    // cannot see the page's fonts, so the file travels inside the SVG.
    import fontData from "@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2?inline";

    // LinkedIn's cover is 1584×396 (4:1); the PNG goes out at 2× for retina.
    const BANNER_W = 1584;
    const BANNER_H = 396;
    const EXPORT_SCALE = 2;

    // --- controls -----------------------------------------------------------
    let name = $state("Alex\nJenter");
    let weight = $state(800);
    let opsz = $state(30); // low: sturdy hairlines, which a stipple can follow
    let soft = $state(100);
    let wonk = $state(true);
    let size = $state(50); // font size, % of the banner height
    let leading = $state(1); // line distance, in font sizes (two lines only)
    let offsetX = $state(22); // % of the width, right of centre
    let offsetY = $state(1); // % of the height, below centre

    let points = $state(3000); // dots inside the name
    let showBg = $state(false); // background dots, in variations of the accent
    let ratio = $state(6); // dot density in the name : in the background
    let fill = $state(90); // dot radius, % of the largest that still touches
    let bgStrength = $state(80); // % of the accent in the background dots

    // The profile photo, in banner units (measured from a LinkedIn screenshot).
    let avatarX = $state(250);
    let avatarY = $state(362);
    let avatarR = $state(160);
    let avatarMargin = $state(10); // no dots closer to the photo than this
    let falloff = $state(1000); // beyond the margin the dots grow back over this

    let guides = $state(true);

    // What shapes the stipple. Changing any of it restarts the relaxation, so
    // it is debounced (a dragged slider would restart it on every tick); the
    // fill, the color strength and the falloff only redraw.
    const shape = () => ({
        name,
        weight,
        opsz,
        soft,
        wonk,
        size,
        leading,
        offsetX,
        offsetY,
        points,
        showBg,
        ratio,
        avatarX,
        avatarY,
        avatarR,
        avatarMargin,
        dark: theme.resolved === "dark",
    });
    let committed = $state(shape());
    let key = $state(0);
    $effect(() => {
        const next = shape();
        if (JSON.stringify(next) === JSON.stringify(committed)) return;
        const timer = setTimeout(() => {
            committed = next;
            key++;
        }, 300);
        return () => clearTimeout(timer);
    });

    // --- stipple ------------------------------------------------------------
    // One set of dots for the name and the background. A weighted Lloyd
    // relaxation spaces dots by a density map: ratio× denser inside the name.
    // With one set there is no seam where the two kinds meet; the dots just
    // get smaller toward the contour. A dot's color says which kind it is.
    const MAX_ITER = 20000;
    // Tighter than the post's 0.1: the dots are packed close, so the last
    // fractions of a pixel are what evens out the thin strokes.
    const SETTLED_PX = 0.02;
    const INK_MIN = 16; // of 255: a pixel with less ink than this is paper
    const IN_NAME = 128; // of 255: a dot on at least this much ink is a name dot
    // Samples per dot for the relaxation, see setup(): below a few dozen the
    // cells hold too few pixels, the centroids snap to the pixel grid and the
    // dots freeze in a rough pattern.
    const SAMPLES_PER_DOT = 50;
    const MAX_SAMPLES = 900_000; // per iteration: keeps a step near 100 ms
    const MAX_SUPER = 4;

    type Dot = [number, number];
    let pts: Dot[] = [];
    let nn = new Float32Array(0); // distance from each dot to its nearest dot
    let rnd = new Float32Array(0); // per dot: hue, saturation, tint, size
    let lum: Uint8ClampedArray | null = null; // the name map, `sup`× the canvas
    // The relaxation's sample points: canvas px position and density weight.
    let sX = new Float32Array(0);
    let sY = new Float32Array(0);
    let sW = new Float32Array(0);
    let sup = 1;
    let mapW = 0;
    let canvasW = 0;
    let canvasH = 0;
    let iterCount = 0;
    let settled = false;
    let drawn = "";
    let run = 0; // a newer setup() makes an older, still-loading one stop
    let status = $state("");

    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    /** The name as a luminance map: ink where dots should gather. */
    async function nameMap(
        w: number,
        h: number,
        s: ReturnType<typeof shape>,
    ): Promise<Uint8ClampedArray> {
        // Light theme: dark text on white. Dark theme: the reverse.
        const bg = s.dark ? "#000" : "#fff";
        const fg = s.dark ? "#fff" : "#000";
        // "\n" typed in the field (or a real newline) starts a new line; the
        // block of lines stays centered on the offset position.
        const fontSize = (s.size / 100) * h;
        const parts = s.name.split(/\\n|\n/);
        const cx = w / 2 + (s.offsetX / 100) * w;
        const cy = h / 2 + (s.offsetY / 100) * h;
        const lines = parts
            .map((part, i) => {
                const y =
                    cy + (i - (parts.length - 1) / 2) * s.leading * fontSize;
                return `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${fg}"
                font-family="F" font-size="${fontSize}" font-weight="${s.weight}"
                style="font-variation-settings:'opsz' ${s.opsz},'WONK' ${s.wonk ? 1 : 0},'SOFT' ${s.soft}">${esc(part)}</text>`;
            })
            .join("");

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <style>@font-face{font-family:F;src:url(${fontData}) format("woff2");font-weight:100 900}</style>
            <rect width="100%" height="100%" fill="${bg}"/>
            ${lines}
        </svg>`;

        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await img.decode();

        const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const buf = new Uint8ClampedArray(w * h);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            buf[j] =
                0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        return buf;
    }

    const mulberry32 = (seed: number) => () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    /** How inked a map pixel is, 0–255. */
    const inkAt = (buf: Uint8ClampedArray, i: number, dark: boolean) =>
        dark ? buf[i] : 255 - buf[i];

    const setup = async (
        _ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
    ) => {
        const mine = ++run;
        lum = null;
        canvasW = w;
        canvasH = h;
        iterCount = 0;
        settled = false;
        drawn = "";

        const s = committed;

        // Draw the map at the canvas size first to learn how much ink there
        // is, then redraw it larger if the cells would hold too few pixels.
        let buf = await nameMap(w, h, s);
        if (mine !== run) return;
        let ink = 0;
        for (let i = 0; i < buf.length; i++) {
            if (inkAt(buf, i, s.dark) > INK_MIN) ink++;
        }
        // The background is sampled on a coarser grid: its cells are `ratio`×
        // bigger than a name cell.
        const bgStep = Math.max(
            1,
            Math.floor(Math.sqrt(((ink / s.points) * s.ratio) / 40)),
        );
        const samplesAt = (k: number) =>
            ink * k * k + (s.showBg ? (w * h) / (bgStep * bgStep) : 0);
        let k = Math.ceil(
            Math.sqrt(SAMPLES_PER_DOT / Math.max(ink / s.points, 1)),
        );
        k = Math.max(1, Math.min(MAX_SUPER, k));
        while (k > 1 && samplesAt(k) > MAX_SAMPLES) k--;
        if (k > 1) {
            buf = await nameMap(w * k, h * k, s);
            if (mine !== run) return;
        }
        sup = k;
        mapW = w * k;
        const mapH = h * k;

        // Where no dots may be: the profile photo and its margin (canvas px).
        const sc = w / BANNER_W;
        const ax = s.avatarX * sc;
        const ay = s.avatarY * sc;
        const clearR = (s.avatarR + s.avatarMargin) * sc;
        const clear = (x: number, y: number) =>
            Math.hypot(x - ax, y - ay) < clearR;

        // The density map as sample points. Name pixels: one per map pixel,
        // weight 1…ratio by how inked they are. Paper: every `bgStep`th canvas
        // pixel, weight 1 scaled for the area it stands for.
        const xs: number[] = [];
        const ys: number[] = [];
        const ws: number[] = [];
        let total = 0;
        let nameTotal = 0;
        const area = 1 / (k * k);
        for (let Y = 0; Y < mapH; Y++) {
            for (let X = 0; X < mapW; X++) {
                const raw = inkAt(buf, Y * mapW + X, s.dark);
                if (raw <= INK_MIN) continue;
                const x = (X + 0.5) / k;
                const y = (Y + 0.5) / k;
                if (clear(x, y)) continue;
                const wgt = (1 + ((s.ratio - 1) * raw) / 255) * area;
                xs.push(x);
                ys.push(y);
                ws.push(wgt);
                total += wgt;
                if (raw >= IN_NAME) nameTotal += wgt;
            }
        }
        if (s.showBg) {
            const stepK = bgStep * k;
            for (let Y = 0; Y < mapH; Y += stepK) {
                for (let X = 0; X < mapW; X += stepK) {
                    if (inkAt(buf, Y * mapW + X, s.dark) > INK_MIN) continue;
                    const x = (X + stepK / 2) / k;
                    const y = (Y + stepK / 2) / k;
                    if (clear(x, y)) continue;
                    const wgt = bgStep * bgStep;
                    xs.push(x);
                    ys.push(y);
                    ws.push(wgt);
                    total += wgt;
                }
            }
        }
        sX = Float32Array.from(xs);
        sY = Float32Array.from(ys);
        sW = Float32Array.from(ws);

        // Seed in proportion to the weights, with as many dots as it takes
        // for the name to get `points` of them.
        const n = Math.round((s.points * total) / Math.max(nameTotal, 1e-9));
        const cum = new Float64Array(sW.length);
        let acc = 0;
        for (let i = 0; i < sW.length; i++) cum[i] = acc += sW[i];
        const rand = mulberry32(20261021);
        pts = [];
        for (let i = 0; i < n; i++) {
            const target = rand() * acc;
            let lo = 0;
            let hi = cum.length - 1;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                if (cum[mid] < target) lo = mid + 1;
                else hi = mid;
            }
            pts.push([sX[lo] + (rand() - 0.5), sY[lo] + (rand() - 0.5)]);
        }
        rnd = Float32Array.from({ length: n * 4 }, rand);
        nn = new Float32Array(n);
        lum = buf;
    };

    /**
     * One weighted Lloyd step: every sample point votes for its nearest dot
     * with its weight, and each dot moves to the weighted centroid of its
     * votes. Also records each dot's distance to its nearest neighbor.
     * Returns the largest move, in canvas px.
     */
    function relax(): number {
        const n = pts.length;
        const sumX = new Float64Array(n);
        const sumY = new Float64Array(n);
        const sumW = new Float64Array(n);
        const delaunay = new Delaunay(Float64Array.from(pts.flat()));

        let nearest = 0;
        for (let k = 0; k < sW.length; k++) {
            nearest = delaunay.find(sX[k], sY[k], nearest);
            sumX[nearest] += sX[k] * sW[k];
            sumY[nearest] += sY[k] * sW[k];
            sumW[nearest] += sW[k];
        }

        const p = delaunay.points;
        for (let i = 0; i < n; i++) {
            let d = Infinity;
            for (const j of delaunay.neighbors(i)) {
                d = Math.min(
                    d,
                    Math.hypot(
                        p[2 * i] - p[2 * j],
                        p[2 * i + 1] - p[2 * j + 1],
                    ),
                );
            }
            nn[i] = d;
        }

        let moved = 0;
        for (let i = 0; i < n; i++) {
            if (sumW[i] === 0) continue;
            const x = sumX[i] / sumW[i];
            const y = sumY[i] / sumW[i];
            moved = Math.max(moved, Math.hypot(x - pts[i][0], y - pts[i][1]));
            pts[i][0] = x;
            pts[i][1] = y;
        }
        return moved;
    }

    // --- color --------------------------------------------------------------
    type RGB = [number, number, number];
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const smoothstep = (a: number, b: number, x: number) => {
        const t = clamp01((x - a) / (b - a));
        return t * t * (3 - 2 * t);
    };

    function rgbToHsl([r, g, b]: RGB): RGB {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (max === min) return [0, 0, l];
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        const h =
            max === r
                ? (g - b) / d + (g < b ? 6 : 0)
                : max === g
                  ? (b - r) / d + 2
                  : (r - g) / d + 4;
        return [h * 60, s, l];
    }

    function hslToRgb(h: number, s: number, l: number): RGB {
        h = (((h % 360) + 360) % 360) / 360;
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const f = (t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
    }

    const toHex = (c: number[]) =>
        "#" +
        c
            .map((v) =>
                Math.round(Math.min(255, Math.max(0, v)))
                    .toString(16)
                    .padStart(2, "0"),
            )
            .join("");

    /** A shade of the accent for one background dot: hue, saturation and
     *  strength jitter, mixed toward the paper. */
    function variant(
        accent: RGB,
        paper: RGB,
        r: ArrayLike<number>,
        o: number,
        strength: number,
    ) {
        const [h, s, l] = rgbToHsl(accent);
        const c = hslToRgb(
            h + (r[o] - 0.5) * 28,
            clamp01(s * (0.8 + r[o + 1] * 0.35)),
            l,
        );
        const t = strength * (0.4 + 0.6 * r[o + 2]);
        return toHex(c.map((v, i) => paper[i] + (v - paper[i]) * t));
    }

    const colors = () => ({
        paper: cssVar("--color-bg", "#f5f4f0"),
        ink: cssVar("--color-text", "#1a1916"),
        paperRGB: cssRGB("--color-bg", "#f5f4f0") as RGB,
        accentRGB: cssRGB("--color-accent-warm", "#ab4f1d") as RGB,
    });

    /**
     * Every dot as position, radius and color, scaled by `f` (the canvas, or
     * the export, which is bigger). A dot's radius is `fill`% of the largest
     * one that cannot touch its nearest neighbor, so sizes follow the spacing
     * across the contour. Near the profile photo the background dots shrink away.
     */
    function eachDot(
        f: number,
        emit: (x: number, y: number, r: number, color: string) => void,
    ) {
        const s = committed;
        const { ink, paperRGB, accentRGB } = colors();
        const sc = canvasW / BANNER_W;
        const near = (s.avatarR + s.avatarMargin) * sc;
        const far = near + falloff * sc;
        for (let i = 0; i < pts.length; i++) {
            const [x, y] = pts[i];
            const isName =
                lum !== null &&
                inkAt(lum, ((y * sup) | 0) * mapW + ((x * sup) | 0), s.dark) >=
                    IN_NAME;
            let r = (fill / 100) * 0.5 * nn[i];
            if (!isName) {
                // only the background fades toward the photo: the name stays whole
                r *= 0.8 + 0.2 * rnd[4 * i + 3];
                r *= smoothstep(
                    near,
                    far,
                    Math.hypot(x - s.avatarX * sc, y - s.avatarY * sc),
                );
            }
            if (r < 0.3) continue;
            emit(
                x * f,
                y * f,
                r * f,
                isName
                    ? ink
                    : variant(
                          accentRGB,
                          paperRGB,
                          rnd,
                          4 * i,
                          bgStrength / 100,
                      ),
            );
        }
    }

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (!lum) return;

        if (!settled && iterCount < MAX_ITER) {
            const moved = relax();
            settled = moved < SETTLED_PX;
            iterCount++;
            drawn = "";
            if (iterCount % 10 === 0 || settled)
                status = `${settled ? "settled" : "relaxing"} · iteration ${iterCount} · ${pts.length} dots · last move ${moved.toFixed(2)} px · ${sup}× map, ${sW.length} samples`;
        }

        const { paper } = colors();
        const frame = `${w}×${h} ${paper} ${fill} ${bgStrength} ${falloff}`;
        if (frame === drawn) return; // settled, and nothing to redraw
        drawn = frame;

        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, w, h);
        eachDot(1, (x, y, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    // --- export -------------------------------------------------------------
    const outW = BANNER_W * EXPORT_SCALE;
    const outH = BANNER_H * EXPORT_SCALE;

    function save(blob: Blob, filename: string) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function downloadSVG() {
        const { paper } = colors();
        const circles: string[] = [];
        // literal colors: most SVG tools outside the browser skip var()
        eachDot(outW / canvasW, (x, y, r, color) =>
            circles.push(
                `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${color}"/>`,
            ),
        );
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outW} ${outH}" width="${outW}" height="${outH}">
    <rect width="100%" height="100%" fill="${paper}"/>
    ${circles.join("")}
</svg>`;
        save(new Blob([svg], { type: "image/svg+xml" }), "linkedin-cover.svg");
    }

    async function downloadPNG() {
        const { paper } = colors();
        const canvas = new OffscreenCanvas(outW, outH);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, outW, outH);
        eachDot(outW / canvasW, (x, y, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });
        save(
            await canvas.convertToBlob({ type: "image/png" }),
            "linkedin-cover.png",
        );
    }
</script>

<svelte:head>
    <title>LinkedIn cover — v1</title>
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
        {#key key}
            <Canvas {setup} {update} label="Stippled name" />
        {/key}
        {#if guides}
            <!-- LinkedIn's own UI on top of the cover. The photo circle is
                 measured from a screenshot of the profile; the outer ring is
                 where the dots are back to full size. -->
            <svg
                class="guides"
                viewBox="0 0 {BANNER_W} {BANNER_H}"
                aria-hidden="true"
            >
                <circle cx={avatarX} cy={avatarY} r={avatarR} />
                <circle
                    class="faint"
                    cx={avatarX}
                    cy={avatarY}
                    r={avatarR + avatarMargin + falloff}
                />
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
            <Checkbox bind:value={wonk} label="Wonk" />
        </div>
        <div class="col">
            <Slider
                bind:value={points}
                min={500}
                max={12000}
                step={100}
                label="Name dots"
            />
            <Slider
                bind:value={fill}
                min={40}
                max={100}
                step={1}
                label="Dot fill %"
            />
            <Checkbox bind:value={showBg} label="Background dots" />
            <Slider
                bind:value={ratio}
                min={1}
                max={20}
                step={0.5}
                label="Density ratio"
            />
            <Slider
                bind:value={bgStrength}
                min={20}
                max={100}
                step={1}
                label="Color strength %"
            />
        </div>
        <div class="col">
            <Slider
                bind:value={avatarX}
                min={0}
                max={BANNER_W}
                step={1}
                label="Photo X"
            />
            <Slider
                bind:value={avatarY}
                min={0}
                max={BANNER_H + 200}
                step={1}
                label="Photo Y"
            />
            <Slider
                bind:value={avatarR}
                min={40}
                max={300}
                step={1}
                label="Photo radius"
            />
            <Slider
                bind:value={avatarMargin}
                min={0}
                max={80}
                step={1}
                label="Photo margin"
            />
            <Slider
                bind:value={falloff}
                min={0}
                max={1500}
                step={1}
                label="Falloff"
            />
            <Checkbox bind:value={guides} label="Guides" />
        </div>
        <div class="col">
            <Button label="Download PNG" onclick={downloadPNG} />
            <Button label="Download SVG" onclick={downloadSVG} />
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

        .faint {
            opacity: 0.4;
            stroke-dasharray: 2 6;
        }
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
