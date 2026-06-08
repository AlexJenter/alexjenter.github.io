<script lang="ts">
    import { onMount } from 'svelte';

    // Grid dimensions per panel
    const GW = 100, GH = 72, GAP = 2;
    const IW = GW * 2 + GAP; // total ImageData width: 202

    // Gray-Scott parameters (stripe/labyrinth regime)
    const DU = 0.21, DV = 0.105;
    const F = 0.037, K = 0.060, DT = 1.0;

    // Anisotropic inhibitor diffusion (fast + slow eigenvalues)
    const D_FAST = 0.16, D_SLOW = 0.048;

    const STEPS = 10; // simulation steps per animation frame

    let playing = $state(false);
    let tickCount = $state(0);
    let canvas: HTMLCanvasElement;

    // Simulation buffers — plain vars, not reactive
    let uI = new Float32Array(GW * GH).fill(1);
    let vI = new Float32Array(GW * GH);
    let uIN = new Float32Array(GW * GH);
    let vIN = new Float32Array(GW * GH);
    let uA = new Float32Array(GW * GH).fill(1);
    let vA = new Float32Array(GW * GH);
    let uAN = new Float32Array(GW * GH);
    let vAN = new Float32Array(GW * GH);

    // Precomputed per-cell diffusion tensor for the anisotropic panel
    const Dxx = new Float32Array(GW * GH);
    const Dyy = new Float32Array(GW * GH);
    const Dxy = new Float32Array(GW * GH);
    const Ang = new Float32Array(GW * GH); // fast-axis angle, for overlay ticks

    function initTensor() {
        for (let y = 0; y < GH; y++) {
            for (let x = 0; x < GW; x++) {
                // Fast axis: mostly vertical, with sinusoidal waving across x and y
                const a =
                    Math.PI / 2 +
                    0.55 * Math.sin((2 * Math.PI * x) / GW) +
                    0.25 * Math.sin((2 * Math.PI * y) / GH + 0.8);
                const c = Math.cos(a),
                    s = Math.sin(a),
                    i = y * GW + x;
                Dxx[i] = D_FAST * c * c + D_SLOW * s * s;
                Dyy[i] = D_FAST * s * s + D_SLOW * c * c;
                Dxy[i] = (D_FAST - D_SLOW) * c * s;
                Ang[i] = a;
            }
        }
    }

    function initState() {
        uI.fill(1); vI.fill(0);
        uA.fill(1); vA.fill(0);
        // Identical random seed patches for both panels — fair comparison
        for (let n = 0; n < 10; n++) {
            const sx = 4 + Math.floor(Math.random() * (GW - 8));
            const sy = 4 + Math.floor(Math.random() * (GH - 8));
            for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    const x = sx + dx, y = sy + dy;
                    if (x < 0 || x >= GW || y < 0 || y >= GH) continue;
                    const i = y * GW + x;
                    const r = Math.random() * 0.05;
                    uI[i] = uA[i] = 0.5 + r;
                    vI[i] = vA[i] = 0.25 + r;
                }
            }
        }
    }

    // Standard isotropic Laplacian (5-point stencil, periodic boundaries)
    function lapIso(a: Float32Array, x: number, y: number): number {
        const xm = x > 0 ? x - 1 : GW - 1, xp = x < GW - 1 ? x + 1 : 0;
        const ym = y > 0 ? y - 1 : GH - 1, yp = y < GH - 1 ? y + 1 : 0;
        const c = a[y * GW + x];
        return a[y * GW + xp] + a[y * GW + xm] + a[yp * GW + x] + a[ym * GW + x] - 4 * c;
    }

    // Anisotropic Laplacian: ∇·(D∇v) with per-cell diffusion tensor
    // D = [[Dxx, Dxy],[Dxy,Dyy]], eigenaxes encode fast/slow diffusion directions
    function lapAni(a: Float32Array, x: number, y: number): number {
        const xm = x > 0 ? x - 1 : GW - 1, xp = x < GW - 1 ? x + 1 : 0;
        const ym = y > 0 ? y - 1 : GH - 1, yp = y < GH - 1 ? y + 1 : 0;
        const i = y * GW + x, c = a[i];
        const lx = a[y * GW + xp] + a[y * GW + xm] - 2 * c;
        const ly = a[yp * GW + x] + a[ym * GW + x] - 2 * c;
        // Mixed partial ∂²v/∂x∂y via 9-point cross term
        const cross =
            (a[yp * GW + xp] + a[ym * GW + xm] - a[ym * GW + xp] - a[yp * GW + xm]) * 0.25;
        return Dxx[i] * lx + Dyy[i] * ly + 2 * Dxy[i] * cross;
    }

    function simStep() {
        // Isotropic panel: both chemicals diffuse isotropically
        for (let y = 0; y < GH; y++) {
            for (let x = 0; x < GW; x++) {
                const i = y * GW + x;
                const u = uI[i], v = vI[i], uvv = u * v * v;
                uIN[i] = Math.min(1, Math.max(0, u + DT * (DU * lapIso(uI, x, y) - uvv + F * (1 - u))));
                vIN[i] = Math.min(1, Math.max(0, v + DT * (DV * lapIso(vI, x, y) + uvv - (F + K) * v)));
            }
        }
        let t = uI; uI = uIN; uIN = t;
        t = vI; vI = vIN; vIN = t;

        // Anisotropic panel: activator (U) isotropic, inhibitor (V) anisotropic
        // The anisotropic inhibitor diffusion steers stripe orientation
        for (let y = 0; y < GH; y++) {
            for (let x = 0; x < GW; x++) {
                const i = y * GW + x;
                const u = uA[i], v = vA[i], uvv = u * v * v;
                uAN[i] = Math.min(1, Math.max(0, u + DT * (DU * lapIso(uA, x, y) - uvv + F * (1 - u))));
                // lapAni already returns Dxx*lx + Dyy*ly + 2*Dxy*cross (actual diffusion values)
                vAN[i] = Math.min(1, Math.max(0, v + DT * (lapAni(vA, x, y) + uvv - (F + K) * v)));
            }
        }
        t = uA; uA = uAN; uAN = t;
        t = vA; vA = vAN; vAN = t;
    }

    onMount(() => {
        function cssRGB(varName: string): [number, number, number] {
            const tmp = document.createElement('canvas');
            tmp.width = tmp.height = 1;
            const c = tmp.getContext('2d')!;
            c.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue(varName)
                .trim();
            c.fillRect(0, 0, 1, 1);
            const d = c.getImageData(0, 0, 1, 1).data;
            return [d[0], d[1], d[2]];
        }

        const bg = cssRGB('--color-bg');
        const fg = cssRGB('--color-text');
        const mu = cssRGB('--color-text-muted');

        initTensor();
        initState();

        const ctx = canvas.getContext('2d')!;
        const imgData = new ImageData(IW, GH);
        const px = imgData.data;

        // Pre-fill the separator gap
        for (let y = 0; y < GH; y++) {
            for (let g = 0; g < GAP; g++) {
                const pi = (y * IW + GW + g) * 4;
                px[pi] = fg[0]; px[pi + 1] = fg[1]; px[pi + 2] = fg[2]; px[pi + 3] = 255;
            }
        }

        function render() {
            // Write pixel data for both panels
            for (let y = 0; y < GH; y++) {
                for (let x = 0; x < GW; x++) {
                    const gi = y * GW + x;

                    const tI = Math.min(1, vI[gi] / 0.35);
                    let pi = (y * IW + x) * 4;
                    px[pi]     = (bg[0] + (fg[0] - bg[0]) * tI) | 0;
                    px[pi + 1] = (bg[1] + (fg[1] - bg[1]) * tI) | 0;
                    px[pi + 2] = (bg[2] + (fg[2] - bg[2]) * tI) | 0;
                    px[pi + 3] = 255;

                    const tA = Math.min(1, vA[gi] / 0.35);
                    pi = (y * IW + GW + GAP + x) * 4;
                    px[pi]     = (bg[0] + (fg[0] - bg[0]) * tA) | 0;
                    px[pi + 1] = (bg[1] + (fg[1] - bg[1]) * tA) | 0;
                    px[pi + 2] = (bg[2] + (fg[2] - bg[2]) * tA) | 0;
                    px[pi + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);

            // Orientation field overlay on anisotropic panel
            // Ticks show stripe direction (perpendicular to fast-diffusion axis)
            ctx.globalAlpha = 0.55;
            ctx.strokeStyle = `rgb(${mu[0]},${mu[1]},${mu[2]})`;
            ctx.lineWidth = 0.7;
            const TICK_SPACING = 8;
            for (let y = TICK_SPACING / 2; y < GH; y += TICK_SPACING) {
                for (let x = TICK_SPACING / 2; x < GW; x += TICK_SPACING) {
                    const gi = Math.round(y) * GW + Math.round(x);
                    const stripeAngle = Ang[gi] + Math.PI / 2;
                    const R = 2.8;
                    const cx = GW + GAP + x, cy = y;
                    ctx.beginPath();
                    ctx.moveTo(cx - Math.cos(stripeAngle) * R, cy - Math.sin(stripeAngle) * R);
                    ctx.lineTo(cx + Math.cos(stripeAngle) * R, cy + Math.sin(stripeAngle) * R);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        }

        let rafId: number;
        const loop = () => {
            if (playing) {
                for (let s = 0; s < STEPS; s++) simStep();
                tickCount += STEPS;
            }
            render();
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    });

    function reset() {
        playing = false;
        initState();
        tickCount = 0;
    }

    function doStep() {
        for (let s = 0; s < STEPS; s++) simStep();
        tickCount += STEPS;
    }
</script>

<figure class="fig">
    <div class="canvas-wrap">
        <canvas bind:this={canvas} width={IW} height={GH}></canvas>
        <div class="badge">{tickCount} steps</div>
    </div>

    <div class="panel-labels">
        <span>isotropic</span>
        <span>anisotropic — tensor field</span>
    </div>

    <div class="legend">
        <span class="leg-item">
            <svg width="16" height="12" aria-hidden="true">
                <line x1="8" y1="1" x2="8" y2="11"
                    stroke="var(--color-text-muted)" stroke-width="1.5" />
            </svg>
            stripe direction (fast-axis ⊥)
        </span>
    </div>

    <div class="controls">
        <button class="btn" onclick={reset}>Reset</button>
        <button class="btn" onclick={doStep}>Step</button>
        <button class="btn btn-primary" onclick={() => (playing = !playing)}>
            {playing ? 'Pause' : 'Play'}
        </button>
        <span class="iter">step {tickCount}</span>
    </div>

    <figcaption>
        {#if tickCount === 0}
            Both panels start from identical random seeds. Press <b>Play</b> to run the simulation.
        {:else if tickCount < 300}
            Pattern nucleating from the seed patches. Both panels show the same early-stage chaos.
        {:else if tickCount < 1200}
            Stripes beginning to form. On the right, the tensor field is already steering orientation.
        {:else}
            Left: isotropic diffusion — stripes form but orient randomly. Right: the inhibitor
            diffuses faster along the tick-mark axis, forcing stripes to run perpendicular to it.
        {/if}
    </figcaption>
</figure>

<style>
    .fig {
        margin: var(--space-8) 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .canvas-wrap {
        position: relative;
    }

    canvas {
        display: block;
        width: 100%;
        height: auto;
        border: 1px solid var(--color-text);
        border-radius: var(--radius-lg);
        image-rendering: auto;
    }

    .badge {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        padding: 2px var(--space-3);
        border-radius: 999px;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
        pointer-events: none;
    }

    .panel-labels {
        display: flex;
        justify-content: space-around;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--color-text-muted);
    }

    .legend {
        display: flex;
        gap: var(--space-4);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        align-items: center;
    }

    .leg-item {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .btn {
        padding: 3px var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-text);
        font-size: var(--text-sm);
        cursor: pointer;
        line-height: 1.6;
    }

    .btn:hover:not(:disabled) {
        background: var(--color-border);
    }

    .btn:disabled {
        opacity: 0.35;
        cursor: default;
    }

    .btn-primary {
        background: var(--color-text);
        color: var(--color-bg);
        border-color: var(--color-text);
    }

    .btn-primary:hover {
        opacity: 0.8;
    }

    .iter {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }

    figcaption {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: var(--leading-normal);
    }
</style>
