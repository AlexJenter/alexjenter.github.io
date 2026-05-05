<script>
    // Complex numbers as [re, im] tuples
    const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
    const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
    const cscale = (a, s) => [a[0] * s, a[1] * s];

    function makeCircle(k, x, y, depth) {
        return { k, kz: [k * x, k * y], depth };
    }

    function xyr({ k, kz }) {
        return [kz[0] / k, kz[1] / k, Math.abs(1 / k)];
    }

    // Linear Descartes: given 3 tangent circles and the excluded 4th,
    // find the circle on the opposite side.
    function nextCircle(a, b, c, excl, depth) {
        const k = 2 * (a.k + b.k + c.k) - excl.k;
        const kz = csub(cscale(cadd(cadd(a.kz, b.kz), c.kz), 2), excl.kz);
        return { k, kz, depth };
    }

    const MIN_R = 0.004;
    const MAX_DEPTH = 6;

    // (-1, 2, 2, 3) integer Apollonian gasket
    const c0 = makeCircle(-1, 0, 0, 0); // outer bounding circle
    const c1 = makeCircle(2, -0.5, 0, 0); // left
    const c2 = makeCircle(2, 0.5, 0, 0); // right
    const c3 = makeCircle(3, 0, -2 / 3, 0); // bottom

    function buildGasket() {
        const all = [c0, c1, c2, c3];
        const queue = [
            [c1, c2, c3, c0, 1],
            [c0, c2, c3, c1, 1],
            [c0, c1, c3, c2, 1],
            [c0, c1, c2, c3, 1],
        ];
        let qi = 0;
        while (qi < queue.length) {
            const [a, b, c, excl, d] = queue[qi++];
            if (d > MAX_DEPTH) continue;
            const cn = nextCircle(a, b, c, excl, d);
            const [, , r] = xyr(cn);
            if (!isFinite(r) || r < MIN_R) continue;
            all.push(cn);
            if (d < MAX_DEPTH) {
                queue.push([cn, b, c, a, d + 1]);
                queue.push([a, cn, c, b, d + 1]);
                queue.push([a, b, cn, c, d + 1]);
            }
        }
        return all.map((c, id) => ({ ...c, id }));
    }

    const allCircles = buildGasket();
    let depth = $state(0);
    const visible = $derived(allCircles.filter((c) => c.depth <= depth));
    const innerCount = $derived(visible.filter((c) => c.k > 0).length);
</script>

<figure>
    <svg viewBox="-1.1 -1.1 2.2 2.2">
        {#each visible as ci (ci.id)}
            {@const [x, y, r] = xyr(ci)}
            <circle
                cx={x}
                cy={-y}
                {r}
                class={ci.k < 0
                    ? "outer"
                    : ci.depth === depth
                      ? "new"
                      : "inner"}
            />
        {/each}
    </svg>

    <div class="controls">
        <button onclick={() => depth--} disabled={depth === 0}>←</button>
        <span>Generation {depth} of {MAX_DEPTH} · {innerCount} circles</span>
        <button onclick={() => depth++} disabled={depth === MAX_DEPTH}>→</button
        >
    </div>
</figure>

<style>
    figure {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        margin: var(--space-8) 0;
    }

    svg {
        width: 100%;
        max-width: 520px;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
    }

    circle {
        fill: none;
    }

    .outer {
        stroke: var(--color-border);
        stroke-width: 0.008;
    }

    .inner {
        stroke: var(--color-text);
        stroke-width: 0.005;
        opacity: 0.4;
    }

    .new {
        stroke: var(--color-accent-warm);
        stroke-width: 0.006;
        opacity: 1;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }

    button {
        border: 1px solid var(--color-border);
        background: none;
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-sm);
        cursor: pointer;
        color: var(--color-text);
        font-family: var(--font-serif);
        font-size: var(--text-sm);
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    button:hover:not(:disabled) {
        border-color: var(--color-text);
    }

    button:disabled {
        opacity: 0.3;
        cursor: default;
    }
</style>
