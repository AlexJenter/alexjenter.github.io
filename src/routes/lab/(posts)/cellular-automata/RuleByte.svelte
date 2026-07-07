<script lang="ts">
    // A rule is one byte: eight patterns in, eight bits out.
    let rule = $state(90);

    const cols = $derived(
        Array.from({ length: 8 }, (_, k) => {
            const i = 7 - k; // most-significant bit first
            return {
                i,
                l: (i >> 2) & 1,
                c: (i >> 1) & 1,
                r: i & 1,
                out: (rule >> i) & 1,
            };
        }),
    );

    const binary = $derived(rule.toString(2).padStart(8, "0"));

    function toggle(i: number) {
        rule ^= 1 << i;
    }
</script>

<figure class="rb">
    <div class="grid">
        {#each cols as g, i}
            <div class="col">
                <div class="place">{7 - i}</div>
                &ShortDownArrow;
                <div class="place">{g.l}{g.c}{g.r}</div>
                <div class="pat" title={`pattern ${g.l}${g.c}${g.r}`}>
                    <span class:on={g.l}></span>
                    <span class:on={g.c}></span>
                    <span class:on={g.r}></span>
                </div>

                <button
                    type="button"
                    class="out"
                    class:on={g.out}
                    onclick={() => toggle(g.i)}
                    aria-label={`Output for pattern ${g.l}${g.c}${g.r} (bit ${g.i}), currently ${g.out}`}
                ></button>
                &ShortUpArrow;
                <div class="place-value">
                    {g.out}
                </div>
            </div>
        {/each}
    </div>
    <div class="input">
        <div>&ShortUpArrow;</div>
        <label>Rule: <input type="number" bind:value={rule} /></label>
    </div>

    <figcaption>
        Each pattern, read as binary, is the <em>place</em> of its answer in the
        rule number. Read the eight outputs left&#8202;→&#8202;right and you get
        {binary}. Which is {rule} in binary. Tap an output to flip it.
    </figcaption>
</figure>

<style>
    .rb {
        margin: var(--space-8) 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
    }

    .grid {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        justify-content: center;
    }

    .col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .pat {
        display: flex;
        gap: 1px;
    }

    .pat span {
        width: 11px;
        height: 11px;
        background: var(--color-surface);
        box-shadow: inset 0 0 0 1px var(--color-border);
    }

    .pat span.on {
        background: var(--color-text);
        box-shadow: none;
    }

    .out {
        width: 33px;
        height: 33px;
        padding: 0;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition:
            background var(--duration-fast) var(--ease-out),
            color var(--duration-fast) var(--ease-out);
    }

    .out.on {
        background: var(--color-text);
        border-color: var(--color-text);
        color: var(--color-bg);
    }

    .place {
        font-family: var(--font-mono);
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        color: var(--color-text-muted);
    }

    .place-value {
        font-family: var(--font-mono);
    }

    .input {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1em;

        input {
            width: 8ch;
        }
    }

    figcaption {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        text-align: center;
        max-width: 48ch;
    }
</style>
