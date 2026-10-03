<script lang="ts">
    let d = 10;
    let g = Array.from(Array(9), (_, i) => i);
    let sourceImage = Array.from(Array(9), (_, i) => Math.random());
    let texture = Array.from(Array(9), (_, i) => Math.random());
    let result = Array.from(Array(9), (_, i) =>
        sourceImage[i] > texture[i] ? 1 : 0,
    );

    let hoverIndex = $state(-1);
    function updateHover(n: number) {
        hoverIndex = n;
    }
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="100%"
    height="100%"
    viewBox="0 0 200 200"
>
    <text x="40" y="30" fill="white">{hoverIndex}</text>

    <g onmouseleave={() => updateHover(-1)} transform="translate(10 10)">
        {#each sourceImage as value, index}
            <rect
                x={(index * d) % (d * 3)}
                y={Math.floor(index / 3) * d}
                width={d}
                height={d}
                fill={hoverIndex !== -1 && index === hoverIndex
                    ? "red"
                    : `rgb(from currentColor r g b /${value})`}
                stroke="currentColor"
                stroke-width="0.5"
                onmouseenter={() => updateHover(index)}
            ></rect>
        {/each}

        <g transform="translate(50)">
            {#each texture as value, index}
                <rect
                    x={(index * d) % (d * 3)}
                    y={Math.floor(index / 3) * d}
                    width={d}
                    height={d}
                    fill={hoverIndex !== -1 && index === hoverIndex
                        ? "red"
                        : `rgb(from currentColor r g b /${value})`}
                    stroke="currentColor"
                    stroke-width="0.5"
                    onmouseenter={() => updateHover(index)}
                ></rect>
            {/each}
        </g>

        <g transform="translate(100)">
            {#each result as value, index}
                <rect
                    x={(index * d) % (d * 3)}
                    y={Math.floor(index / 3) * d}
                    width={d}
                    height={d}
                    fill={hoverIndex !== -1 && index === hoverIndex
                        ? "red"
                        : `rgb(from currentColor r g b /${value})`}
                    stroke="currentColor"
                    stroke-width="0.5"
                    onmouseenter={() => updateHover(index)}
                ></rect>
            {/each}
        </g>
    </g>
    <!-- {#each [0, 50, 100] as o}
        {#each g as p, i}
            <rect
                x={((p * d) % (d * 3)) + o + 10}
                y={Math.floor(p / 3) * d + 10}
                width={d}
                height={d}
                fill="rgb(from currentColor r g b /{Math.random()})"
                stroke="currentColor"
                stroke-width="0.5"
                data-index={i}
            ></rect>
        {/each}
    {/each} -->
</svg>

<style scoped>
    rect:hover {
        fill: red;
    }
</style>
