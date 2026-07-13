<script lang="ts">
    // Poke three cells, read them as binary → a number from 0 to 7.
    let bits = $state<number[]>([1, 0, 1]);
    const labels = ["left", "self", "right"];
    const index = $derived((bits[0] << 2) | (bits[1] << 1) | bits[2]);

    function toggle(i: number) {
        bits[i] = bits[i] ? 0 : 1;
    }
</script>

<figure class="nb">
    <div class="row">
        <div class="cells">
            {#each bits as b, i}
                <button
                    type="button"
                    class="cell"
                    class:on={b}
                    onclick={() => toggle(i)}
                    aria-label={`Toggle ${labels[i]} cell (currently ${b ? "on" : "off"})`}
                >
                    <span class="tag">{labels[i]}</span>
                </button>
            {/each}
        </div>
        <span class="eq">=</span>
        <span class="bin">{bits.join("")}</span>
        <span class="eq">=</span>
        <span class="dec">{index}</span>
    </div>
    <figcaption>
        A cell and its two neighbours, read left&#8202;→&#8202;right as binary,
        are a number from 0 to 7. Tap them.
    </figcaption>
</figure>

<style>
    .nb {
        margin: var(--space-8) 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
    }

    .row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-family: var(--font-mono);
        background-color: var(--color-surface);
        padding: 2rem 3rem 4rem;
        border-radius: var(--radius-lg);
    }

    .cells {
        display: flex;
        gap: 2px;
    }

    .cell {
        position: relative;
        width: 38px;
        height: 38px;
        padding: 0;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background var(--duration-fast) var(--ease-out);
    }

    .cell.on {
        background: var(--color-text);
        border-color: var(--color-text);
    }

    .tag {
        position: absolute;
        /*top: 0em;*/
        left: 0;
        right: 0;
        bottom: -2.4em;
        font-size: 0.6rem;
        color: var(--color-text-muted);
        letter-spacing: 0.02em;
    }

    .eq {
        color: var(--color-text-muted);
    }

    .bin {
        font-size: var(--text-lg);
        letter-spacing: 0.12em;
        color: var(--color-text);
    }

    .dec {
        font-size: var(--text-2xl);
        color: var(--color-accent-warm, var(--color-text));
        min-width: 1ch;
        text-align: center;
    }

    figcaption {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        text-align: center;
        max-width: 42ch;
        margin-block-start: 2em;
    }
</style>
