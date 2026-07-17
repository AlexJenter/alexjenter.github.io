<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Drawer, Slider, Radio, Button } from "$lib/components/gui";
    import { ruleTable, nextRow } from "./ca.js";

    let rule = $state(90); // applied live — drag it and the flow morphs
    let cells = $state(180); // hard reset (reseeds)
    let seed = $state<"single" | "random">("random");
    let paused = $state(false);
    let regen = $state(0);

    const seedOptions = [
        { value: "single", label: "single cell" },
        { value: "random", label: "random row" },
    ];

    const presets = [90, 30, 110, 73, 150, 184, 45, 22];

    function cssVar(name: string, fallback: string) {
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
        return v || fallback;
    }

    type Sim = {
        w: number;
        h: number;
        cell: number;
        cols: number;
        history: Uint8Array[]; // most recent generations, oldest first
        offset: number; // sub-cell scroll position, 0..cell
        alive: string;
        dead: string;
        reduced: boolean;
    };

    let sim: Sim | null = null;
    const GENS_PER_SEC = 16;

    function setup(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (w === 0 || h === 0) return;
        const alive = cssVar("--color-text", "#1a1916");
        const dead = cssVar("--color-bg", "#f5f4f0");
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const desired = Math.min(1000, Math.max(16, Math.round(cells)));
        const cell = Math.max(1, Math.round(w / desired));
        const cols = Math.ceil(w / cell);
        const visRows = Math.ceil(h / cell) + 2;

        const table = ruleTable(rule);
        let cur: Uint8Array = new Uint8Array(cols);
        if (seed === "single") cur[cols >> 1] = 1;
        else for (let i = 0; i < cols; i++) cur[i] = Math.random() < 0.5 ? 1 : 0;

        const history: Uint8Array[] = [];
        for (let y = 0; y < visRows; y++) {
            history.push(cur);
            cur = nextRow(cur, table);
        }

        sim = { w, h, cell, cols, history, offset: 0, alive, dead, reduced };
    }

    function step() {
        if (!sim) return;
        const last = sim.history[sim.history.length - 1];
        sim.history.push(nextRow(last, ruleTable(rule))); // live rule
        sim.history.shift();
    }

    // Full repaint every frame — robust to the canvas being cleared on resize.
    function render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (!sim) return;
        const { history, cols, cell, offset, alive, dead } = sim;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = dead;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = alive;
        for (let k = 0; k < history.length; k++) {
            const y = Math.round(k * cell - offset);
            const row = history[k];
            for (let x = 0; x < cols; x++)
                if (row[x]) ctx.fillRect(x * cell, y, cell, cell);
        }
    }

    function update(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) {
        if (w === 0 || h === 0) return;
        if (!sim || sim.w !== w || sim.h !== h) setup(ctx, w, h);
        if (!sim) return;
        if (sim.reduced) {
            render(ctx, w, h);
            return false;
        }
        if (!paused) {
            sim.offset += ((sim.cell * GENS_PER_SEC) / 1000) * dt;
            let guard = 0;
            while (sim.offset >= sim.cell && guard < 240) {
                sim.offset -= sim.cell;
                step();
                guard++;
            }
        }
        render(ctx, w, h);
    }
</script>

<div class="hero hero-backdrop">
    <div class="inner">
        {#key `${cells}-${seed}-${regen}`}
            <Canvas {setup} {update} label={`Elementary cellular automaton, rule ${rule}`} />
        {/key}
    </div>

</div>
<div class="hero-spacer" aria-hidden="true"></div>

<Drawer title="Rules" grid={true}>
    <!-- A: rule readout + live rule slider -->
    <div class="area-A">
        <div class="readout">
            <span>rule {rule}</span>
            <span class="bits">{rule.toString(2).padStart(8, "0")}</span>
        </div>
        <Slider bind:value={rule} min={0} max={255} label="rule" />
    </div>

    <!-- B: rule presets -->
    <div class="area-B">
        <div class="presets">
            {#each presets as p}
                <button
                    type="button"
                    class:active={rule === p}
                    onclick={() => (rule = p)}>{p}</button
                >
            {/each}
        </div>
    </div>

    <!-- C: grid size + seeding -->
    <div class="area-C">
        <Slider bind:value={cells} min={48} max={420} step={4} label="cells" />
        <Radio bind:value={seed} options={seedOptions} label="seed" />
    </div>

    <!-- D: playback -->
    <div class="area-D">
        <Button
            onclick={() => (paused = !paused)}
            label={paused ? "Play" : "Pause"}
        />
        {#if seed === "random"}
            <Button onclick={() => regen++} label="New random seed" />
        {/if}
    </div>
</Drawer>

<style>
    /* fixed positioning/background come from the global .hero-backdrop */
    .hero {
        display: flex;

        > .inner {
            flex: 1;
            min-height: 0;
        }
    }

    .readout {
        display: flex;
        justify-content: space-between;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text);
    }

    .readout .bits {
        color: var(--color-text-muted);
        letter-spacing: 0.15em;
    }

    .presets {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
    }

    .presets button {
        flex: 1 0 auto;
        min-width: 2.4em;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        font-variant-numeric: tabular-nums;
        color: var(--color-text-muted);
        background: transparent;
        border: 1px solid var(--color-border);
        padding: var(--space-1) 0;
        cursor: pointer;
        transition:
            color var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out),
            background var(--duration-fast) var(--ease-out);
    }

    .presets button:hover {
        color: var(--color-text);
        border-color: var(--color-text-muted);
    }

    .presets button.active {
        color: var(--color-bg);
        background: var(--color-text);
        border-color: var(--color-text);
    }

    .presets button:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }
</style>
