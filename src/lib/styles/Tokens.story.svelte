<script lang="ts">
    import { theme } from "$lib/theme.svelte";
    import tokensRaw from "./tokens.css?raw";

    // Token names parsed straight from tokens.css at build time, so this page
    // can't drift from the source of truth. First occurrence wins, keeping
    // declaration order; the dark-theme blocks redeclare the same names and
    // dedupe away.
    const names = [...new Set(tokensRaw.match(/--[\w-]+(?=\s*:)/g) ?? [])];

    const colors = names.filter((n) => n.startsWith("--color-"));
    const syntax = names.filter((n) => n.startsWith("--syntax-"));
    const sizes = names.filter((n) => n.startsWith("--text-"));
    const spaces = names.filter((n) => n.startsWith("--space-"));
    const radii = names.filter((n) => n.startsWith("--radius-"));
    const misc = names.filter(
        (n) =>
            ![colors, syntax, sizes, spaces, radii].some((g) => g.includes(n)),
    );

    let root = $state<HTMLElement>();
    let values = $state<Record<string, string>>({});

    // Resolved values, re-read whenever the effective theme changes (toggle
    // or OS), so labels always show the palette actually on screen.
    $effect(() => {
        void theme.resolved;
        if (!root) return;
        const cs = getComputedStyle(root);
        values = Object.fromEntries(
            names.map((n) => [n, cs.getPropertyValue(n).trim()]),
        );
    });

    // WCAG 2.x contrast, to verify the guarantees annotated in tokens.css
    // (e.g. accent-warm ≥ 4.5:1 on bg and surface).
    function luminance(hex: string): number | null {
        const m = hex.match(/^#([0-9a-f]{6})$/i);
        if (!m) return null;
        const [r, g, b] = [0, 2, 4].map((i) => {
            const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const PAIRS = [
        ["--color-text", "--color-bg"],
        ["--color-text", "--color-surface"],
        ["--color-text-muted", "--color-bg"],
        ["--color-text-muted", "--color-surface"],
        ["--color-accent-warm", "--color-bg"],
        ["--color-accent-warm", "--color-surface"],
    ] as const;

    const contrasts = $derived(
        PAIRS.map(([fg, bg]) => {
            const lf = luminance(values[fg] ?? "");
            const lb = luminance(values[bg] ?? "");
            const ratio =
                lf === null || lb === null
                    ? null
                    : (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
            return {
                label: `${fg.slice(8)} on ${bg.slice(8)}`,
                ratio,
                pass: ratio !== null && ratio >= 4.5,
            };
        }),
    );

    const short = (n: string) =>
        n.replace(/^--(color|syntax|text|space|radius)-/, "");
</script>

<div class="tokens" bind:this={root}>
    <section>
        <h3 class="label">color</h3>
        <div class="grid">
            {#each colors as n (n)}
                <div class="card">
                    <div class="swatch" style:background={`var(${n})`}></div>
                    <p class="name">{short(n)}</p>
                    <p class="value">{values[n] ?? ""}</p>
                </div>
            {/each}
        </div>
    </section>

    <section>
        <h3 class="label">contrast · wcag 2 target ≥ 4.5</h3>
        <ul class="contrast">
            {#each contrasts as c (c.label)}
                <li>
                    <span class="name">{c.label}</span>
                    <span class="value">
                        {c.ratio === null ? "—" : `${c.ratio.toFixed(2)}:1`}
                        {c.ratio === null ? "" : c.pass ? " AA ✓" : " AA ✗"}
                    </span>
                </li>
            {/each}
        </ul>
    </section>

    <section>
        <h3 class="label">syntax</h3>
        <div class="grid">
            {#each syntax as n (n)}
                <div class="card">
                    <div class="swatch code" style:color={`var(${n})`}>
                        {"{ }"}
                    </div>
                    <p class="name">{short(n)}</p>
                    <p class="value">{values[n] ?? ""}</p>
                </div>
            {/each}
        </div>
    </section>

    <section>
        <h3 class="label">type scale</h3>
        {#each sizes as n (n)}
            <div class="row">
                <span class="name">{short(n)}</span>
                <span class="value">{values[n] ?? ""}</span>
                <span class="sample" style:font-size={`var(${n})`}
                    >Aante quixotic</span
                >
            </div>
        {/each}
    </section>

    <section>
        <h3 class="label">spacing</h3>
        {#each spaces as n (n)}
            <div class="row">
                <span class="name">{short(n)}</span>
                <span class="value">{values[n] ?? ""}</span>
                <span class="bar" style:width={`var(${n})`}></span>
            </div>
        {/each}
    </section>

    <section>
        <h3 class="label">radius</h3>
        <div class="grid">
            {#each radii as n (n)}
                <div class="card">
                    <div
                        class="swatch chip"
                        style:border-radius={`var(${n})`}
                    ></div>
                    <p class="name">{short(n)}</p>
                    <p class="value">{values[n] ?? ""}</p>
                </div>
            {/each}
        </div>
    </section>

    <section>
        <h3 class="label">everything else</h3>
        <ul class="contrast">
            {#each misc as n (n)}
                <li>
                    <span class="name">{n}</span>
                    <span class="value clip">{values[n] ?? ""}</span>
                </li>
            {/each}
        </ul>
    </section>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .tokens {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
    }

    .label {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-4);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
        gap: var(--space-4);
    }

    .swatch {
        height: var(--space-12);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-2);
    }

    /* Syntax colors are foreground colors — show them as glyphs on surface. */
    .swatch.code {
        display: grid;
        place-items: center;
        background: var(--color-surface);
        font-family: var(--font-mono);
        font-size: var(--text-lg);
    }

    .swatch.chip {
        background: var(--color-surface);
    }

    .name {
        @include m.meta-label;
        margin: 0;
    }

    .value {
        @include m.meta-label;
        color: var(--color-text-muted);
        text-transform: none;
        margin: 0;
        font-variant-numeric: tabular-nums;
    }

    .value.clip {
        max-width: 24rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .contrast {
        list-style: none;
        padding: 0;
        margin: 0;
        max-width: 32rem;

        li {
            display: flex;
            justify-content: space-between;
            gap: var(--space-4);
            padding: var(--space-1) 0;
            border-bottom: 1px solid var(--color-border);
        }
    }

    .row {
        display: flex;
        align-items: baseline;
        gap: var(--space-4);
        padding: var(--space-1) 0;

        .name {
            flex: 0 0 5rem;
        }

        .value {
            flex: 0 0 4.5rem;
        }
    }

    .sample {
        line-height: var(--leading-tight);
        white-space: nowrap;
    }

    .bar {
        align-self: center;
        height: var(--space-2);
        background: var(--color-accent-warm);
        border-radius: var(--radius-sm);
    }
</style>
