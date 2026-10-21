<script lang="ts">
    import { Slider } from "$lib/components/gui";

    // A top-down 2D scene in SVG units: the camera looks along +x, a near bar
    // hangs into the view from the top (seen end-on), a far surface closes it.
    // The march is the shader's loop, so the readout is what a pixel would do.
    const CAM = { x: 8, y: 45 };
    const BAR = { x0: 70, x1: 80, y0: 0, y1: 38 };
    const WALL = 150;
    const PIXEL = (0.4 * Math.PI) / 180; // one pixel as an angle (a fat one, to read)
    const HIT = 0.05;
    const GAP = 1; // a near miss must be this much nearer than the hit

    let angle = $state(5.2); // degrees above the axis
    let width = $state(3); // outline width in pixels

    function map(x: number, y: number) {
        const qx = Math.abs(x - (BAR.x0 + BAR.x1) / 2) - (BAR.x1 - BAR.x0) / 2;
        const qy = Math.abs(y - (BAR.y0 + BAR.y1) / 2) - (BAR.y1 - BAR.y0) / 2;
        const box =
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
            Math.min(Math.max(qx, qy), 0);
        return Math.min(box, WALL - x);
    }

    const trace = $derived.by(() => {
        const a = (-angle * Math.PI) / 180;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const samples: { x: number; y: number; d: number }[] = [];
        let t = 0;
        let ph = Infinity;
        let hit = false;
        let near: { t: number; z: number; angle: number } | null = null;
        for (let i = 0; i < 64 && t < 400; i++) {
            const x = CAM.x + dx * t;
            const y = CAM.y + dy * t;
            const d = map(x, y);
            samples.push({ x, y, d });
            if (d < HIT) {
                hit = true;
                break;
            }
            // a local minimum of d: the closest approach between two samples
            if (d > ph && d <= 2 * ph) {
                const s = (d * d) / (2 * ph);
                const z = Math.sqrt(Math.max(d * d - s * s, 0));
                const tc = t - s;
                const ang = z / Math.max(tc, 0.001);
                if (!near || ang < near.angle) near = { t: tc, z, angle: ang };
            }
            ph = d;
            t += d;
        }
        const end = { x: CAM.x + dx * t, y: CAM.y + dy * t };
        return { samples, hit, t, end, near, dx, dy };
    });

    const onBar = $derived(trace.end.x < WALL - 1);
    const nearPx = $derived(trace.near ? trace.near.angle / PIXEL : null);
    const outline = $derived(
        trace.hit &&
            trace.near !== null &&
            nearPx! < width &&
            trace.t - trace.near.t > GAP,
    );
    const nearPoint = $derived(
        trace.near && {
            x: CAM.x + trace.dx * trace.near.t,
            y: CAM.y + trace.dy * trace.near.t,
        },
    );

    const readout = $derived(
        onBar
            ? "The ray ends on the near bar. It has no near miss, so no outline."
            : nearPx === null
              ? "The ray never comes back out of a dip. No near miss, no outline."
              : `Near miss: ${nearPx.toFixed(1)} px from the bar. ${
                    outline
                        ? `That is inside the ${width.toFixed(1)} px line: this pixel is outline.`
                        : `That is outside the ${width.toFixed(1)} px line: no outline.`
                }`,
    );
</script>

<figure class="fig">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 90"
        role="img"
        aria-label="Top view of a ray passing a near bar and hitting a far surface"
        aria-describedby="outline-desc"
    >
        <desc id="outline-desc">
            A camera on the left shoots a ray past the end of a near bar. Circles
            along the ray show the distance to the nearest surface at each step.
            The smallest circle that is followed by a larger one is the near
            miss. If its angle is under the line width, the pixel is outline.
        </desc>

        <rect
            class="bar"
            x={BAR.x0}
            y={BAR.y0}
            width={BAR.x1 - BAR.x0}
            height={BAR.y1 - BAR.y0}
        />
        <line class="wall" x1={WALL} y1="0" x2={WALL} y2="90" />

        {#each trace.samples as s}
            <circle class="step" cx={s.x} cy={s.y} r={s.d} />
        {/each}

        <line
            class="ray"
            x1={CAM.x}
            y1={CAM.y}
            x2={trace.end.x}
            y2={trace.end.y}
        />

        {#if nearPoint && !onBar}
            <circle
                class="near"
                cx={nearPoint.x}
                cy={nearPoint.y}
                r={trace.near!.z}
            />
            <circle class="near-dot" cx={nearPoint.x} cy={nearPoint.y} r="0.9" />
        {/if}

        <circle class="cam" cx={CAM.x} cy={CAM.y} r="1.6" />
        <circle
            class="end"
            class:on={outline}
            cx={trace.end.x}
            cy={trace.end.y}
            r="1.6"
        />

        <text x={CAM.x} y={CAM.y + 6}>camera</text>
        <text x={(BAR.x0 + BAR.x1) / 2} y={BAR.y1 + 5}>near bar</text>
        <text class="end-label" x={WALL - 2} y="6">far surface</text>
    </svg>

    <div class="controls">
        <Slider
            bind:value={angle}
            min={2}
            max={7}
            step={0.01}
            label="Ray angle"
        />
        <Slider bind:value={width} min={0} max={6} step={0.1} label="Line width" />
    </div>
    <p class="readout" aria-live="polite">{readout}</p>
</figure>

<style>
    .fig {
        margin: var(--space-8) 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    svg {
        width: 100%;
        height: auto;
    }

    .bar {
        fill: color-mix(in oklab, var(--color-text) 85%, var(--color-bg));
    }

    .wall {
        stroke: var(--color-text);
        stroke-width: 2px;
        vector-effect: non-scaling-stroke;
    }

    .step {
        fill: none;
        stroke: var(--color-text);
        stroke-opacity: 0.25;
        stroke-width: 1px;
        vector-effect: non-scaling-stroke;
    }

    .ray {
        stroke: var(--color-text);
        stroke-width: 1px;
        vector-effect: non-scaling-stroke;
    }

    .near {
        fill: none;
        stroke: var(--color-accent-warm);
        stroke-width: 2px;
        vector-effect: non-scaling-stroke;
    }

    .near-dot {
        fill: var(--color-accent-warm);
    }

    .cam {
        fill: var(--color-text);
    }

    .end {
        fill: var(--color-bg);
        stroke: var(--color-text);
        stroke-width: 1px;
        vector-effect: non-scaling-stroke;
    }

    .end.on {
        fill: var(--color-accent-warm);
        stroke: var(--color-accent-warm);
    }

    text {
        fill: var(--color-text);
        font-family: var(--font-mono);
        font-size: 3px;
        text-anchor: middle;
    }

    .end-label {
        text-anchor: end;
    }

    .controls {
        display: grid;
        gap: var(--space-3);
        max-width: 28rem;
    }

    .readout {
        margin: 0;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
    }
</style>
