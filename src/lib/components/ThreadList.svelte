<script lang="ts" module>
    import type { ThreadSource } from "./ThreadDiagram.svelte";

    export interface ThreadItem {
        label: string;
        /** Muted text before the label, e.g. a year. Defaults to the item's number. */
        tag?: string;
        /** Source links, drawn as small chips under the label. */
        sources?: ThreadSource[];
    }
</script>

<script lang="ts">
    interface Props {
        items: ThreadItem[];
        /** Accessible name of the list. */
        title: string;
    }

    let { items, title }: Props = $props();

    const tags = $derived(
        items.map((item, i) => item.tag ?? String(i + 1).padStart(2, "0")),
    );
    // One tag column for the whole list, so every label lines up.
    const tagCols = $derived(Math.max(...tags.map((tag) => tag.length)));
</script>

<!--
    A vertical ThreadDiagram as plain HTML: the browser wraps the text, so the
    server-rendered layout is the final one and nothing shifts after hydration.
    Same look: warm thread, pins on the first line, mono tag and label, source
    chips, one empty line between items.
-->
<ol class="thread" role="list" aria-label={title} style:--tag-cols={tagCols}>
    {#each items as item, i (i)}
        <li>
            <span class="tag">{tags[i]}</span>
            <span class="label">{item.label}</span>
            {#if item.sources?.length}
                <span class="sources">
                    {#each item.sources as source (source.href)}
                        <!-- The arrow is decoration: the link's name is its label. -->
                        <a href={source.href} rel="noopener"
                            >{source.label}<span aria-hidden="true">↗</span></a
                        >
                    {/each}
                </span>
            {/if}
        </li>
    {/each}
</ol>

<style>
    .thread {
        --pin: 8px;
        --string: 1.5px;
        --gap: 1.4em; /* one empty line between items */

        margin: var(--space-prose-block);
        list-style: none;
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        color: var(--color-text);
    }

    li {
        position: relative;
        display: grid;
        /* tag column, then the label (and chips) hanging under it */
        grid-template-columns: calc((var(--tag-cols) + 2) * 1ch) minmax(0, 1fr);
        padding-left: calc(var(--pin) + 9px);
    }

    li + li {
        margin-top: var(--gap);
    }

    /* The pin sits on the first line. */
    li::after {
        content: "";
        position: absolute;
        left: 0;
        top: calc(0.6em - var(--pin) / 2);
        width: var(--pin);
        height: var(--pin);
        border-radius: 50%;
        background: var(--color-accent-warm);
    }

    /* The string runs from this pin to the next one. */
    li:not(:last-child)::before {
        content: "";
        position: absolute;
        left: calc((var(--pin) - var(--string)) / 2);
        top: 0.6em;
        width: var(--string);
        height: calc(100% + var(--gap));
        background: var(--color-accent-warm);
    }

    .tag {
        color: var(--color-text-muted);
    }

    .label {
        overflow-wrap: anywhere;
    }

    .sources {
        grid-column: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 8px;
        margin-top: 6px;
    }

    /* Source chips use the controls' ladder: frame dim at rest, text on
       hover, warm on keyboard focus. */
    a {
        position: relative;
        box-sizing: border-box;
        height: 18px;
        padding: 0 6px;
        border: 1px solid var(--color-text-dim);
        border-radius: 2px;
        font-size: 11px;
        line-height: 16px;
        white-space: nowrap;
        text-decoration: none;
        color: var(--color-text-muted);
        outline: none;
    }

    /* Svelte trims a space inside the span, so the gap is a margin. */
    a span {
        margin-left: 1ch;
    }

    /* Hit area: half a line above the frame, a full line below. */
    a::before {
        content: "";
        position: absolute;
        inset: -7.2px -4px -14.4px;
    }

    a:hover {
        border-color: var(--color-text);
        color: var(--color-text);
    }

    a:focus-visible {
        border-color: var(--color-accent-warm);
        box-shadow: inset 0 0 0 1px var(--color-accent-warm);
        color: var(--color-accent-warm);
    }
</style>
