<script lang="ts">
    const uid = $props.id();
    const d = 10;

    // Seeded so the prerendered HTML and the hydrated client draw the same grid.
    function mulberry32(seed: number) {
        return () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const random = mulberry32(6);

    const sourceImage = Array.from({ length: 9 }, () => random());
    const texture = Array.from({ length: 9 }, () => random());
    const result = sourceImage.map((value, i) => (value > texture[i] ? 1 : 0));

    let hoverIndex = $state(-1);
    function onpointerover(e: PointerEvent) {
        const i = (e.target as SVGElement).dataset.index;
        if (i !== undefined) hoverIndex = +i;
    }
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 200 200"
    role="img"
    aria-label="Thresholding an image against noise"
    aria-describedby="{uid}-desc"
>
    <desc id="{uid}-desc">
        Three 3×3 grids side by side: the source image, the noise texture, and
        the one-bit result. A result cell is on where the source cell is
        brighter than the noise cell at the same position, and off otherwise.
    </desc>

    <g
        role="presentation"
        {onpointerover}
        onpointerleave={() => (hoverIndex = -1)}
        transform="translate(10 10)"
    >
        {#each [sourceImage, texture, result] as grid, g}
            <g transform="translate({g * 50})">
                {#each grid as value, index}
                    <rect
                        data-index={index}
                        x={(index * d) % (d * 3)}
                        y={Math.floor(index / 3) * d}
                        width={d}
                        height={d}
                        fill={index === hoverIndex
                            ? "red"
                            : `rgb(from currentColor r g b /${value})`}
                        stroke="currentColor"
                        stroke-width="0.5"
                    ></rect>
                {/each}
            </g>
        {/each}
    </g>
</svg>
