<script lang="ts">
    import { onDestroy } from "svelte";

    const W = 480;
    const H = 320;
    const STRIDE = 30;
    const STEP_MS = 55;
    const BATCH = 5;

    type Pt = [number, number];
    type Phase = "counting" | "settling" | "paused";

    const CELL: Pt[] = [
        [75, 30],
        [260, 15],
        [420, 70],
        [455, 180],
        [390, 300],
        [190, 312],
        [50, 255],
        [22, 125],
    ];
    const CELL_POINTS = CELL.map(([x, y]) => `${x},${y}`).join(" ");

    const BLOB_X = 155;
    const BLOB_Y = 110;
    const GENERATOR_START: Pt = [330, 228];

    function imgLum(x: number, y: number): number {
        const d2 = (x - BLOB_X) ** 2 + (y - BLOB_Y) ** 2;
        return Math.max(0, Math.min(255, 220 - 185 * Math.exp(-d2 / 7000)));
    }

    function pixelWeight(x: number, y: number): number {
        const raw = 255 - imgLum(x, y);
        return (raw * raw) / 255;
    }

    function inPoly(px: number, py: number): boolean {
        let inside = false;
        for (let i = 0, j = CELL.length - 1; i < CELL.length; j = i++) {
            const [xi, yi] = CELL[i];
            const [xj, yj] = CELL[j];
            if (
                yi > py !== yj > py &&
                px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
            )
                inside = !inside;
        }
        return inside;
    }

    type Sample = { x: number; y: number; w: number };

    // Precompute samples in raster order — mirrors the actual for-loop
    const SAMPLES: Sample[] = [];
    let _maxW = 0;
    for (let y = STRIDE / 2; y < H; y += STRIDE) {
        for (let x = STRIDE / 2; x < W; x += STRIDE) {
            if (!inPoly(x, y)) continue;
            const w = pixelWeight(x, y);
            SAMPLES.push({ x, y, w });
            if (w > _maxW) _maxW = w;
        }
    }
    const MAX_W = _maxW;
    const N = SAMPLES.length;

    // Precompute centroid at every step — O(N) incremental
    const TRAIL: (Pt | null)[] = [null];
    {
        let sx = 0,
            sy = 0,
            sw = 0;
        for (const { x, y, w } of SAMPLES) {
            sx += x * w;
            sy += y * w;
            sw += w;
            TRAIL.push([sx / sw, sy / sw]);
        }
    }
    const FINAL_CENTROID = TRAIL[N] as Pt;

    let currentIdx = $state(0);
    let phase = $state<Phase>("counting");
    let generatorPos = $state<Pt>([...GENERATOR_START]);
    let animate = $state(false);
    let playing = $state(false);
    let timerId: ReturnType<typeof setTimeout> | null = null;

    let centroid = $derived(TRAIL[currentIdx]);

    function clearTimer() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function finishCounting() {
        playing = false;
        phase = "settling";
        animate = true;
        generatorPos = [...FINAL_CENTROID];
        timerId = setTimeout(() => {
            phase = "paused";
            timerId = setTimeout(autoRestart, 1500);
        }, 600);
    }

    function advanceOne() {
        currentIdx = Math.min(currentIdx + 1, N);
        if (currentIdx >= N) {
            finishCounting();
        } else if (playing) {
            timerId = setTimeout(advanceOne, STEP_MS);
        }
    }

    function autoRestart() {
        animate = false;
        generatorPos = [...GENERATOR_START];
        currentIdx = 0;
        phase = "counting";
        playing = true;
        timerId = setTimeout(advanceOne, 400);
    }

    function togglePlay() {
        if (phase !== "counting") return;
        if (playing) {
            playing = false;
            clearTimer();
        } else {
            playing = true;
            if (currentIdx >= N) finishCounting();
            else timerId = setTimeout(advanceOne, STEP_MS);
        }
    }

    function stepForward() {
        if (phase !== "counting") return;
        clearTimer();
        playing = false;
        currentIdx = Math.min(currentIdx + BATCH, N);
        if (currentIdx >= N) finishCounting();
    }

    function reset() {
        clearTimer();
        playing = false;
        animate = false;
        phase = "counting";
        currentIdx = 0;
        generatorPos = [...GENERATOR_START];
    }

    onDestroy(clearTimer);
</script>

<figure class="fig">
    <div class="svg-wrap">
        <svg
            viewBox="0 0 {W} {H}"
            class="svg"
            role="img"
            aria-label="Weighted centroid accumulation diagram"
        >
            <defs>
                <clipPath id="wc2-clip">
                    <polygon points={CELL_POINTS} />
                </clipPath>
                <radialGradient
                    id="wc2-blob"
                    cx={BLOB_X}
                    cy={BLOB_Y}
                    r="170"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop
                        offset="0%"
                        stop-color="var(--color-text)"
                        stop-opacity="0.5"
                    />
                    <stop
                        offset="100%"
                        stop-color="var(--color-text)"
                        stop-opacity="0"
                    />
                </radialGradient>
                <marker
                    id="wc2-arr"
                    markerWidth="5"
                    markerHeight="5"
                    refX="4"
                    refY="2.5"
                    orient="auto"
                >
                    <path
                        d="M0,0.5 L4.5,2.5 L0,4.5 Z"
                        fill="var(--color-accent-warm)"
                        opacity="0.8"
                    />
                </marker>
            </defs>

            <rect width={W} height={H} class="bg" />

            <!-- Cell filled with synthetic image -->
            <polygon points={CELL_POINTS} class="cell-bg" />
            <rect
                width={W}
                height={H}
                fill="url(#wc2-blob)"
                clip-path="url(#wc2-clip)"
            />
            <polygon points={CELL_POINTS} class="cell-edge" />

            <!-- Revealed pixel samples, sized by weight -->
            <g transform="translate(-15, -15)">
                {#each SAMPLES.slice(0, currentIdx) as { x, y, w }, i}
                    {@const t = w / MAX_W}
                    {@const isLatest = i === currentIdx - 1}
                    <rect
                        {x}
                        {y}
                        width="30"
                        height="30"
                        stroke="white"
                        stroke-width={isLatest ? 2 : 1}
                        fill={isLatest
                            ? "var(--color-accent-warm)"
                            : "var(--color-text)"}
                        opacity={isLatest ? 1 : 0.15 + t * 0.7}
                    />
                {/each}
            </g>

            <!-- Pull line: latest sample → current centroid -->
            {#if phase === "counting" && currentIdx > 0 && centroid}
                {@const latest = SAMPLES[currentIdx - 1]}
                <line
                    x1={latest.x}
                    y1={latest.y}
                    x2={centroid[0]}
                    y2={centroid[1]}
                    class="pull-line"
                    marker-end="url(#wc2-arr)"
                />
            {/if}

            <!-- Running weighted centroid (×) -->
            {#if centroid}
                {@const [cx, cy] = centroid}
                <g transform="translate({cx},{cy})" class="centroid-mark">
                    <line x1="-5" y1="-5" x2="5" y2="5" />
                    <line x1="5" y1="-5" x2="-5" y2="5" />
                </g>
            {/if}

            <!-- Generator -->
            <circle
                cx={generatorPos[0]}
                cy={generatorPos[1]}
                r="5"
                class="seed"
                class:animate
            />
        </svg>

        <div class="badge" class:badge--done={phase === "paused"}>
            {#if phase === "counting"}
                pixel {currentIdx} / {N}
            {:else if phase === "settling"}
                settling
            {:else}
                done
            {/if}
        </div>
    </div>

    <div class="legend">
        <span class="leg-item">
            <svg width="10" height="10"
                ><circle
                    cx="5"
                    cy="5"
                    r="5"
                    fill="var(--color-accent-warm)"
                /></svg
            >
            generator
        </span>
        <span class="leg-item">
            <svg width="12" height="12">
                <line
                    x1="1"
                    y1="1"
                    x2="11"
                    y2="11"
                    stroke="var(--color-text)"
                    stroke-width="1.5"
                />
                <line
                    x1="11"
                    y1="1"
                    x2="1"
                    y2="11"
                    stroke="var(--color-text)"
                    stroke-width="1.5"
                />
            </svg>
            weighted centroid
        </span>
        <span class="leg-item">
            <svg width="10" height="10"
                ><circle
                    cx="5"
                    cy="5"
                    r="4"
                    fill="var(--color-text)"
                    opacity="0.5"
                /></svg
            >
            pixel weight
        </span>
    </div>

    <div class="controls">
        <button class="btn" onclick={reset}>Reset</button>
        <button
            class="btn"
            onclick={stepForward}
            disabled={phase !== "counting"}>Step</button
        >
        <button
            class="btn btn-primary"
            onclick={togglePlay}
            disabled={phase !== "counting"}
        >
            {playing ? "Pause" : phase === "paused" ? "Done" : "Play"}
        </button>
    </div>

    <figcaption>
        {#if currentIdx === 0}
            <b>Before accumulation:</b> the generator (orange) sits in the light region.
            Press Play to watch each pixel cast its weighted vote.
        {:else if phase === "counting"}
            <b>Pixel {currentIdx} / {N}:</b> dot size encodes darkness weight. Heavy
            dark pixels pull the centroid (×) strongly; pale pixels barely move it.
        {:else if phase === "settling"}
            <b>All {N} pixels counted.</b> The generator moves to the weighted centroid
            — the equilibrium of every pixel's pull.
        {:else}
            <b>Converged:</b> the generator has settled where the dark pixel mass
            balances.
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

    .svg-wrap {
        position: relative;
    }

    .svg {
        width: 100%;
        display: block;
        border: 1px solid var(--color-text);
        border-radius: var(--radius-lg);
    }

    .bg {
        fill: var(--color-bg);
    }

    .cell-bg {
        fill: var(--color-bg);
    }

    .cell-edge {
        fill: none;
        stroke: var(--color-text);
        stroke-width: 1;
    }

    .pull-line {
        stroke: var(--color-accent-warm);
        stroke-width: 1;
        stroke-dasharray: 3 2;
        opacity: 0.7;
    }

    .centroid-mark line {
        stroke: var(--color-text);
        stroke-width: 1.5;
    }

    .seed {
        fill: var(--color-accent-warm);
    }

    .seed.animate {
        transition:
            cx 0.5s var(--ease-out),
            cy 0.5s var(--ease-out);
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

    .badge--done {
        background: var(--color-accent-warm);
        border-color: var(--color-accent-warm);
        color: #fff;
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

    .btn-primary:hover:not(:disabled) {
        opacity: 0.8;
    }

    figcaption {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        line-height: var(--leading-normal);
    }
</style>
