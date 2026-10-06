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

    let section = $state<HTMLElement>();
    let open = $state(false);

    // The drawer's parent is the hero's scroller; the drawer is open when
    // that scroller sits at its end (by gesture, restore or the button).
    $effect(() => {
        const scroller = section!.parentElement!;
        const sync = () => {
            const max = scroller.scrollHeight - scroller.clientHeight;
            open = max > 0 && scroller.scrollTop >= max - 1;
        };
        sync();
        scroller.addEventListener("scroll", sync, { passive: true });
        return () => scroller.removeEventListener("scroll", sync);
    });

    function toggle() {
        const scroller = section!.parentElement!;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        scroller.scrollTo({
            top: open ? 0 : scroller.scrollHeight,
            behavior: reduce ? "instant" : "smooth",
        });
    }
</script>

<!--
    "Viewfinder" control drawer. Lives in the hero's scroller directly after
    its pinned .hero-stage; this drawer is a translucent, relatively
    positioned layer (z-index: 1) that slides up over the stage as the
    scroller scrolls, and the scroller's end is its rest point. Its head
    strip (--drawer-peek tall) overlaps the stage's bottom edge from the
    start (negative margin-top): the
    title opens and closes the drawer, "Read" jumps to the post layout's
    #article. Mono "machine voice" (see typography memory). Pass `grid` to
    opt into the structured responsive column grid (A–D slots) defined in
    the styles below.
-->
<section class="drawer" aria-label="{title} controls" bind:this={section}>
    <div class="head">
        <button type="button" onclick={toggle}>
            {title}
            <span aria-hidden="true">{open ? "↓" : "↑"}</span>
            <span class="sr-only">{open ? "hide" : "show"} controls</span>
        </button>
        <a href="#article">Read <span aria-hidden="true">↓</span></a>
    </div>
    <div class="grid" class:cols={grid}>
        {@render children?.()}
    </div>
</section>

<style>
    .drawer {
        position: relative;
        margin-top: calc(-1 * var(--drawer-peek));
        z-index: 1; /* rides above the sticky .hero-stage */
        width: 100%;
        /* Theme-aware translucent surface: the page bg at 0.9 letting the
           hero glow through — the theme's own inks stay legible on it. */
        background: rgb(from var(--color-bg) r g b / 0.9);
        border-top: 1px solid var(--color-border);
        color: var(--color-text);
        padding: 0 var(--space-8) var(--space-8);
        /* the "machine voice" — mono with aligned figures */
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
    }

    .head {
        height: var(--drawer-peek);
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-2);
    }

    .head > * {
        padding: var(--space-2) 0;
        background: none;
        border: none;
        font: inherit;
        font-size: var(--text-xs);
        text-transform: uppercase;
        text-decoration: none;
        letter-spacing: 0.18em;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: color var(--duration-fast) var(--ease-out);
    }

    .head > *:hover {
        color: var(--color-text);
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
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
