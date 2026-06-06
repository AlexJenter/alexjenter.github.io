<script lang="ts">
    import { onDestroy } from "svelte";
    // @ts-ignore
    import { Delaunay } from "d3-delaunay";
    import { polygonCentroid } from "d3";

    const W = 480;
    const H = 320;
    const N = 21;
    const PAD = 20;

    type Pt = [number, number];

    function rand(): Pt[] {
        return Array.from(
            { length: N },
            () =>
                [
                    PAD + Math.random() * (W - 2 * PAD),
                    PAD + Math.random() * (H - 2 * PAD),
                ] as Pt,
        );
    }

    function buildCells(pts: Pt[]) {
        const del = Delaunay.from(pts);
        const vor = del.voronoi([0, 0, W, H]);
        return pts.map((_, i) => {
            const poly = vor.cellPolygon(i) as Pt[] | null;
            if (!poly) return { points: "", cx: pts[i][0], cy: pts[i][1] };
            const [cx, cy] = polygonCentroid(poly);

            return {
                points: poly
                    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
                    .join(" "),
                cx,
                cy,
            };
        });
    }

    function lloydStep(pts: Pt[]): Pt[] {
        const del = Delaunay.from(pts);
        const vor = del.voronoi([0, 0, W, H]);
        return pts.map((s, i) => {
            const poly = vor.cellPolygon(i) as Pt[] | null;
            return poly ? polygonCentroid(poly) : s;
        });
    }

    let seeds = $state<Pt[]>(rand());
    let iter = $state(0);
    let playing = $state(false);
    let timerId: ReturnType<typeof setTimeout> | null = null;

    let cells = $derived(buildCells(seeds));

    let isConverged = $derived(
        cells.every(
            ({ cx, cy }, i) =>
                Math.hypot(seeds[i][0] - cx, seeds[i][1] - cy) < 0.05,
        ),
    );

    let label = $derived(
        iter === 0
            ? "General Voronoi"
            : isConverged
              ? "Centroidal Voronoi"
              : `Iteration ${iter}`,
    );

    function doStep() {
        seeds = lloydStep(seeds);
        iter++;
    }

    function tick() {
        if (isConverged) {
            playing = false;
            return;
        }
        doStep();
        if (playing) timerId = setTimeout(tick, 16);
    }

    function togglePlay() {
        if (playing) {
            playing = false;
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
        } else {
            if (isConverged) return;
            playing = true;
            timerId = setTimeout(tick, 320);
        }
    }

    function step() {
        if (playing) {
            playing = false;
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
        }
        if (!isConverged) doStep();
    }

    function reset() {
        playing = false;
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
        seeds = rand();
        iter = 0;
    }

    onDestroy(() => {
        if (timerId) clearTimeout(timerId);
    });
</script>

<figure class="fig">
    <div class="svg-wrap">
        <svg
            viewBox="0 0 {W} {H}"
            class="svg"
            role="img"
            aria-label="Interactive Voronoi diagram"
        >
            <defs>
                <clipPath id="clip">
                    <rect width={W} height={H} />
                </clipPath>
            </defs>

            <g clip-path="url(#clip)">
                <!-- Cell outlines -->
                {#each cells as { points }}
                    <polygon {points} class="cell-edge" />
                {/each}

                <!-- Update vectors: seed → centroid -->
                {#if !isConverged}
                    {#each cells as { cx, cy }, i}
                        {@const dx = cx - seeds[i][0]}
                        {@const dy = cy - seeds[i][1]}
                        {@const dist = Math.hypot(dx, dy)}
                        {#if dist > 2}
                            {@const ux = dx / dist}
                            {@const uy = dy / dist}
                            <line
                                x1={seeds[i][0]}
                                y1={seeds[i][1]}
                                x2={cx}
                                y2={cy}
                                class="vec"
                                marker-end="url(#arr)"
                            />
                        {/if}
                    {/each}
                {/if}

                <!-- Centroids -->
                {#each cells as { cx, cy }}
                    <circle {cx} {cy} r="2" class="centroid" />
                {/each}

                <!-- Seeds -->
                {#each seeds as [x, y]}
                    <circle cx={x} cy={y} r="2" class="seed" />
                {/each}
            </g>
        </svg>

        <div class="badge" class:badge--converged={isConverged}>{label}</div>
    </div>

    <div class="legend">
        <span class="leg-seed">
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
        <span class="leg-centroid">
            <svg width="10" height="10"
                ><circle
                    cx="5"
                    cy="5"
                    r="4.5"
                    fill="none"
                    stroke="var(--color-text)"
                    stroke-width="1.5"
                /></svg
            >
            centroid
        </span>
        {#if !isConverged}
            <span class="leg-vec">
                <svg width="18" height="10"
                    ><line
                        x1="0"
                        y1="5"
                        x2="14"
                        y2="5"
                        stroke="var(--color-text-muted)"
                        stroke-width="1"
                        stroke-dasharray="3 2"
                    /><polygon
                        points="12,2 18,5 12,8"
                        fill="var(--color-text-muted)"
                    /></svg
                >
                update
            </span>
        {/if}
    </div>

    <div class="controls">
        <button class="btn" onclick={reset}>Reset</button>
        <button class="btn" onclick={step} disabled={isConverged}>Step</button>
        <button
            class="btn btn-primary"
            onclick={togglePlay}
            disabled={isConverged}
        >
            {playing ? "Pause" : isConverged ? "Done" : "Play"}
        </button>
        <span class="iter">iter {iter}</span>
    </div>

    <figcaption>
        {#if iter === 0}
            <b>General Voronoi:</b> generator points (orange) are placed randomly
            and do not coincide with their cell centroids (outlined circles).
        {:else if isConverged}
            <b>Centroidal Voronoi:</b> after {iter} iterations of Lloyd's relaxation,
            each generator now sits exactly at its cell centroid.
        {:else}
            <b>Lloyd's relaxation, iteration {iter}:</b> dashed arrows show each generator
            moving toward its cell centroid. The process repeats until convergence.
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
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-bg);
        border: 1px solid var(--color-text);
    }

    .cell-edge {
        fill: none;
        stroke: var(--color-text);
        stroke-width: 1;
    }

    .vec {
        stroke: var(--color-text-muted);
        stroke-width: 1;
    }

    .seed {
        fill: var(--color-text);
        transition:
            cx 0.25s var(--ease-out),
            cy 0.25s var(--ease-out);
    }

    .centroid {
        stroke: var(--color-text);
        transition:
            cx 0.25s var(--ease-out),
            cy 0.25s var(--ease-out);
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

    .badge--converged {
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

    .leg-seed,
    .leg-centroid,
    .leg-vec {
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
