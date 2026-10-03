<script lang="ts">
    import { prefersReducedMotion } from "svelte/motion";
    import { Button } from "$lib/components/gui";
    import { mulberry32 } from "$lib/utils/random";
    // Site-wide only 400 is loaded; the operator glyphs want the real SemiBold.
    import "@fontsource/ibm-plex-mono/600.css";

    const uid = $props.id();
    const d = 10;
    const pitch = 5 * d; // grid-to-grid offset
    const STEP_MS = 1500;

    // Seeded so the prerendered HTML and the hydrated client draw the same grid.
    const random = mulberry32(6);

    const sourceImage = Array.from({ length: 9 }, () => random());
    const texture = Array.from({ length: 9 }, () => random());
    const result = sourceImage.map((value, i) => (value > texture[i] ? 1 : 0));

    // The linked pixel steps through the grid on a timer; hovering takes over.
    let active = $state(0);
    let hovering = $state(false);
    // Unset until the reader picks; until then, reduced motion means paused.
    let paused = $state<boolean>();
    const isPaused = $derived(paused ?? prefersReducedMotion.current);

    $effect(() => {
        if (isPaused || hovering) return;
        const id = setInterval(() => (active = (active + 1) % 9), STEP_MS);
        return () => clearInterval(id);
    });

    const x = $derived((active % 3) * d);
    const y = $derived(Math.floor(active / 3) * d);

    function onpointerover(e: PointerEvent) {
        const i = (e.target as SVGElement).dataset.index;
        if (i === undefined) return;
        active = +i;
        hovering = true;
    }
</script>

<figure class="fig">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-1 -1 {2 * pitch + 3 * d + 2} {3 * d + 2}"
        role="img"
        aria-label="Thresholding an image against noise"
        aria-describedby="{uid}-desc"
    >
        <desc id="{uid}-desc">
            Three 3×3 grids side by side: the source image, the noise texture,
            and the one-bit result. A result cell is on where the source cell is
            brighter than the noise cell at the same position, and off
            otherwise.
        </desc>

        <g
            role="presentation"
            {onpointerover}
            onpointerleave={() => (hovering = false)}
        >
            {#each [sourceImage, texture, result] as grid, g}
                <g transform="translate({g * pitch})">
                    {#each grid as value, index}
                        <rect
                            class="cell"
                            data-index={index}
                            x={(index * d) % (d * 3)}
                            y={Math.floor(index / 3) * d}
                            width={d}
                            height={d}
                            style:--v={value}
                        ></rect>
                    {/each}
                </g>
            {/each}

            <!-- Outlines the active pixel in each grid and wires them together -->
            <g class="link" style:transform="translate({x}px, {y}px)">
                {#each [0, 1, 2] as g}
                    <rect x={g * pitch} width={d} height={d} />
                {/each}
                <line x1={d} y1={d / 2} x2={pitch} y2={d / 2} />
                <line x1={pitch + d} y1={d / 2} x2={2 * pitch} y2={d / 2} />
            </g>

            <!-- Operators stay centred in the gaps and only follow the row -->
            <g class="link" style:transform="translate(0, {y}px)">
                {#each [">", "="] as label, i}
                    {@const cx = (3 * d + pitch) / 2 + i * pitch}
                    <circle {cx} cy={d / 2} r={d / 2} />
                    <text x={cx} y={d / 2 - 0.3}>{label}</text>
                {/each}
            </g>
        </g>
    </svg>

    <div class="controls">
        <Button
            label={isPaused ? "Play" : "Pause"}
            onclick={() => (paused = !isPaused)}
        />
    </div>
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

    /* Value is brightness in both themes: 0 → the darker token, 1 → the lighter. */
    .cell {
        --lo: light-dark(var(--color-text), var(--color-bg));
        --hi: light-dark(var(--color-bg), var(--color-text));
        fill: color-mix(in oklab, var(--hi) calc(var(--v) * 100%), var(--lo));
        stroke: var(--color-text);
        stroke-width: 1px;
        vector-effect: non-scaling-stroke;
    }

    .link {
        pointer-events: none;
        transition: transform 0.4s var(--ease-out);
    }

    .link rect,
    .link line,
    .link circle {
        stroke: var(--color-accent-warm);
        stroke-width: 2px;
        vector-effect: non-scaling-stroke;
    }

    .link rect {
        fill: none;
    }

    .link circle {
        fill: var(--color-accent-warm);
    }

    .link text {
        fill: var(--color-bg);
        font-family: var(--font-mono);
        font-size: 6px;
        font-weight: 600;
        text-anchor: middle;
        dominant-baseline: central;
    }

    .controls {
        align-self: flex-start;
    }

    @media (prefers-reduced-motion: reduce) {
        .link {
            transition: none;
        }
    }
</style>
