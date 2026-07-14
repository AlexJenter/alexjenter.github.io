<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        children?: Snippet;
    }

    let { title, children }: Props = $props();
</script>

<!--
    Sticky "viewfinder" control drawer. Lives in the flow directly after a hero;
    `position: sticky; bottom: 0` keeps it docked to the bottom of the viewport
    while the hero is on screen, then it releases and flows away as you scroll
    into the article — no JS, no drag. Mono "machine voice" (see typography memory).
    Internal grid is a first pass, meant to be iterated on.
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
        z-index: 10;
        width: 100%;
        margin-block-end: 7rem;
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
        color: var(--color-text);
        /* the "machine voice" — mono with aligned figures */
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        /*scroll-snap-type: y mandatory;
        scroll-snap-align: end;*/
    }

    .frame {
        position: relative;
        padding: var(--space-5) var(--space-6);
    }

    /* camera-viewfinder corner brackets */
    .corner {
        position: absolute;
        width: 9px;
        height: 9px;
        color: var(--color-text-muted);
        pointer-events: none;
    }
    .corner.tl {
        top: var(--space-2);
        left: var(--space-2);
        border-top: 1px solid;
        border-left: 1px solid;
    }
    .corner.tr {
        top: var(--space-2);
        right: var(--space-2);
        border-top: 1px solid;
        border-right: 1px solid;
    }
    .corner.bl {
        bottom: var(--space-2);
        left: var(--space-2);
        border-bottom: 1px solid;
        border-left: 1px solid;
    }
    .corner.br {
        bottom: var(--space-2);
        right: var(--space-2);
        border-bottom: 1px solid;
        border-right: 1px solid;
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
        /* never let a tall control set (e.g. a file drop-zone) eat the hero —
           cap the panel and scroll internally instead */
        max-height: 40svh;
        overflow-y: auto;
        overscroll-behavior: contain;
    }
</style>
