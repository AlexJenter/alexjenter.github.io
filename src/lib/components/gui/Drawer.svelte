<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        children?: Snippet;
    }

    let { title, children }: Props = $props();
</script>

<!--
    "Viewfinder" control drawer. Lives in the flow directly after a hero's
    spacer. The hero is a fixed backdrop; this drawer is an opaque, relatively
    positioned layer (z-index: 1) that slides up over it as you scroll, with a
    gentle scroll-snap rest point (align: end). Mono "machine voice" (see
    typography memory). Internal grid is a first pass, meant to be iterated on.
-->
<section class="drawer" aria-label="{title} controls">
    <div class="frame">
        <span class="title">{title}</span>
        <div class="grid">
            {@render children?.()}
        </div>
    </div>
</section>

<style>
    .drawer {
        position: relative;
        z-index: 1; /* rides above the fixed hero backdrop (z-index: 0) */
        width: 100%;
        background: rgb(0 0 0 / 0.9);
        border-top: 1px solid var(--color-border);
        color: var(--color-text);
        padding: var(--space-4) var(--space-8);
        /* the "machine voice" — mono with aligned figures */
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        /* rest point once scrolled up over the hero */
        scroll-snap-align: end;
    }

    .frame {
        position: relative;
        padding: var(--space-5) var(--space-6);
    }

    .title {
        display: block;
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--color-text-muted);
        margin-bottom: var(--space-4);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: var(--space-3) var(--space-6);
        align-items: start;
    }
</style>
