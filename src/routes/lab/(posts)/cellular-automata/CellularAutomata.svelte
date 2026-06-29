<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Slider, Radio } from "$lib/components/gui";

    let rule = $state(90);
    let cells = $state(160);
    let seed = $state<"single" | "random">("single");
    let regen = $state(0);

    const seedOptions = [
        { value: "single", label: "single cell" },
        { value: "random", label: "random row" },
    ];

    const presets = [
        { n: 90, name: "Sierpiński" },
        { n: 30, name: "chaos" },
        { n: 110, name: "Turing-complete" },
        { n: 73, name: "the old default" },
        { n: 150, name: "XOR³" },
        { n: 184, name: "traffic" },
    ];

    // The eight neighbourhoods (left,centre,right), most-significant first,
    // each paired with the output bit this rule assigns to it.
    const legend = $derived(
        Array.from({ length: 8 }, (_, k) => {
            const i = 7 - k;
            return {
                l: (i >> 2) & 1,
                c: (i >> 1) & 1,
                r: i & 1,
                out: (rule >> i) & 1,
            };
        }),
    );

    const binary = $derived(rule.toString(2).padStart(8, "0"));

    function cssVar(name: string, fallback: string) {
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
        return v || fallback;
    }

    function nextRow(row: Uint8Array, table: Uint8Array): Uint8Array {
        const n = row.length;
        const out = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            // toroidal wrap on both edges — the 2016 version only wrapped the left
            const l = row[(i - 1 + n) % n];
            const c = row[i];
            const r = row[(i + 1) % n];
            out[i] = table[(l << 2) | (c << 1) | r];
        }
        return out;
    }

    type Sim = {
        grid: Uint8Array[];
        rows: number;
        cols: number;
        cell: number;
        cw: number;
        drawn: number;
        perFrame: number;
        alive: string;
    };

    let sim: Sim | null = null;

    function setup(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const alive = cssVar("--color-text", "#1a1916");
        const dead = cssVar("--color-surface", "#f5f4f0");
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const cols = Math.max(8, Math.round(cells));
        const cell = w / cols;
        const rows = Math.max(1, Math.floor(h / cell));

        const table = new Uint8Array(8);
        for (let i = 0; i < 8; i++) table[i] = (rule >> i) & 1;

        let row: Uint8Array = new Uint8Array(cols);
        if (seed === "single") row[cols >> 1] = 1;
        else for (let i = 0; i < cols; i++) row[i] = Math.random() < 0.5 ? 1 : 0;

        const grid: Uint8Array[] = [row];
        for (let y = 1; y < rows; y++) grid.push((row = nextRow(row, table)));

        ctx.fillStyle = dead;
        ctx.fillRect(0, 0, w, h);

        // Reveal generation by generation: rows are time, so it grows downward.
        // For instant redraws instead, set perFrame to `rows`.
        sim = {
            grid,
            rows,
            cols,
            cell,
            cw: Math.ceil(cell),
            drawn: 0,
            perFrame: reduced ? rows : Math.max(1, Math.ceil(rows / 22)),
            alive,
        };
    }

    function update(ctx: CanvasRenderingContext2D) {
        if (!sim || sim.drawn >= sim.rows) return false;
        const { grid, cols, cell, cw } = sim;
        ctx.fillStyle = sim.alive;
        const end = Math.min(sim.rows, sim.drawn + sim.perFrame);
        for (let y = sim.drawn; y < end; y++) {
            const py = Math.round(y * cell);
            const r = grid[y];
            for (let x = 0; x < cols; x++)
                if (r[x]) ctx.fillRect(Math.round(x * cell), py, cw, cw);
        }
        sim.drawn = end;
        return sim.drawn < sim.rows;
    }
</script>

<figure class="ca">
    <div class="stage">
        {#key `${rule}-${cells}-${seed}-${regen}`}
            <Canvas {setup} {update} label={`Elementary cellular automaton, rule ${rule}`} />
        {/key}
    </div>

    <div class="legend" aria-hidden="true">
        {#each legend as g}
            <div class="cellgroup">
                <div class="neigh">
                    <span class:on={g.l}></span>
                    <span class:on={g.c}></span>
                    <span class:on={g.r}></span>
                </div>
                <div class="out" class:on={g.out}></div>
            </div>
        {/each}
    </div>

    <div class="panel">
        <div class="readout">
            <span class="rule-no">rule {rule}</span>
            <span class="bits">{binary}</span>
        </div>

        <Slider bind:value={rule} min={0} max={255} label="rule" />
        <Slider bind:value={cells} min={32} max={320} step={8} label="cells" />
        <Radio bind:value={seed} options={seedOptions} label="seed" />

        <div class="presets">
            {#each presets as p}
                <button
                    type="button"
                    class:active={rule === p.n}
                    title={p.name}
                    onclick={() => (rule = p.n)}>{p.n}</button
                >
            {/each}
        </div>

        {#if seed === "random"}
            <button type="button" class="shuffle" onclick={() => regen++}
                >↻ new random seed</button
            >
        {/if}
    </div>

    <figcaption>
        Rule {rule} ({binary}) — drag <em>rule</em> through all 256, or tap a preset.
    </figcaption>
</figure>

<style>
    .ca {
        margin: var(--space-10) 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
    }

    .stage {
        width: 100%;
        max-width: 560px;
        aspect-ratio: 1 / 1;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    /* Wolfram rule icon: eight neighbourhood → output mappings */
    .legend {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-3);
    }

    .cellgroup {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
    }

    .neigh {
        display: flex;
        gap: 1px;
    }

    .neigh span,
    .out {
        width: 9px;
        height: 9px;
        background: var(--color-surface);
        box-shadow: inset 0 0 0 1px var(--color-border);
    }

    .neigh span.on,
    .out.on {
        background: var(--color-text);
        box-shadow: none;
    }

    .out {
        margin-top: 2px;
    }

    .panel {
        width: 100%;
        max-width: 360px;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-family: var(--font-serif);
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .readout {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        margin-bottom: var(--space-1);
    }

    .rule-no {
        color: var(--color-text);
    }

    .bits {
        color: var(--color-text-muted);
        letter-spacing: 0.15em;
    }

    .presets {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        margin-top: var(--space-1);
    }

    .presets button,
    .shuffle {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: var(--space-1) var(--space-2);
        cursor: pointer;
        transition:
            color var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out);
    }

    .presets button {
        flex: 1;
        min-width: 2.5em;
    }

    .presets button:hover,
    .shuffle:hover {
        color: var(--color-text);
        border-color: var(--color-text-muted);
    }

    .presets button.active {
        color: var(--color-bg);
        background: var(--color-text);
        border-color: var(--color-text);
    }

    .shuffle {
        margin-top: var(--space-1);
    }

    figcaption {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        text-align: center;
        max-width: 40ch;
    }
</style>
