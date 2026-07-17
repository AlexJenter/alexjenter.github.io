<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        /** Opt into the structured responsive grid (1 / 2 / 4 columns with
            named A–D slots). Off by default = the original auto-fit flow. */
        grid?: boolean;
        children?: Snippet;
    }

    let { title, grid = false, children }: Props = $props();
</script>

<!--
    "Viewfinder" control drawer. Lives in the flow directly after a hero's
    spacer. The hero is a fixed backdrop; this drawer is an opaque, relatively
    positioned layer (z-index: 1) that slides up over it as you scroll, with a
    gentle scroll-snap rest point (align: end). Mono "machine voice" (see
    typography memory). Pass `grid` to opt into the structured responsive
    column grid (A–D slots) defined in the styles below.
-->
<section class="drawer" aria-label="{title} controls">
    <div class="frame">
        <span class="title">{title}</span>
        <div class="grid" class:cols={grid}>
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

    /* Opt-in structured grid (`grid` prop). Explicit column counts + named-area
       placement, per viewport. Breakpoints are the literals from tokens.css
       (media conditions can't read var()): tablet 48rem, desktop 75rem.
       mobile: 1 col · tablet: 2 cols · desktop: 4 cols with content centred in
       the middle two. Swap the desktop line to "A B C D" for a full-width 4-up.
       minmax(0, 1fr) so a wide control/label can't blow out its column. */
    .grid.cols {
        grid-template-columns: 1fr;
        grid-template-areas:
            "A"
            "B"
            "C"
            "D";
    }

    @media (min-width: 48rem) {
        .grid.cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-areas:
                "A B"
                "C D";
        }
    }

    @media (min-width: 75rem) {
        .grid.cols {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            grid-template-areas:
                ". A B ."
                ". C D .";
        }
    }

    /* Slot mapping. A slot holds one control or a stacked group; wrap it in
       <div class="area-A"> … </div>. Slotted children keep the *hero's* style
       scope, so the Drawer reaches them via :global — kept local by the
       `.grid.cols` prefix. Unused slots just leave their area empty. */
    .grid.cols :global(.area-A),
    .grid.cols :global(.area-B),
    .grid.cols :global(.area-C),
    .grid.cols :global(.area-D) {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }
    .grid.cols :global(.area-A) {
        grid-area: A;
    }
    .grid.cols :global(.area-B) {
        grid-area: B;
    }
    .grid.cols :global(.area-C) {
        grid-area: C;
    }
    .grid.cols :global(.area-D) {
        grid-area: D;
    }
</style>
