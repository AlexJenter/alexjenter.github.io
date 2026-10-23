<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();

    // Stable across server and client render, unlike a random string.
    const name = $props.id();

    // The lit cell is one element that slides to the selected segment, so it
    // is measured from the real layout (any option count, wrapped rows too).
    let segmentsEl: HTMLElement;
    const segmentEls: HTMLElement[] = [];
    // The lit cell floats this far inside its segment, so its edge does not
    // double the frame's.
    const INSET = 2;
    let thumb = $state<{ x: number; y: number; w: number; h: number } | null>(
        null,
    );
    // Off for the first placement, so the cell appears in place instead of
    // sliding in from nothing.
    let animate = $state(false);

    function measure() {
        const el = segmentEls[options.findIndex((o) => o.value === value)];
        thumb = el
            ? {
                  x: el.offsetLeft + INSET,
                  y: el.offsetTop + INSET,
                  w: el.offsetWidth - 2 * INSET,
                  h: el.offsetHeight - 2 * INSET,
              }
            : null;
    }

    $effect(() => {
        measure();
    });

    $effect(() => {
        const observer = new ResizeObserver(measure);
        observer.observe(segmentsEl);
        const frame = requestAnimationFrame(() => (animate = true));
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    });
</script>

<!--
    Prototype: the segmented selector in the shared frame. Hairline-divided
    cells, a hatched cell slides to the chosen one, frame colour follows the
    shared hover/focus ladder. Without JS (or before the first measure) the chosen segment is
    hatched in place.
    Real radio inputs stay in the DOM for keyboard and group semantics.
-->
<div class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <fieldset class="segments" class:static={!thumb} bind:this={segmentsEl}>
        {#if label}
            <legend class="sr-only">{label}</legend>
        {/if}
        {#if thumb}
            <span
                class="thumb"
                class:animate
                style:left="{thumb.x}px"
                style:top="{thumb.y}px"
                style:width="{thumb.w}px"
                style:height="{thumb.h}px"
                aria-hidden="true"
            ></span>
        {/if}
        {#each options as opt, i (opt.value)}
            <label
                bind:this={segmentEls[i]}
                class="segment"
                class:selected={value === opt.value}
            >
                <input
                    type="radio"
                    {name}
                    value={opt.value}
                    bind:group={value}
                />
                <span>{opt.label}</span>
            </label>
        {/each}
    </fieldset>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .label {
        @include m.meta-label;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .segments {
        @include m.marks;
        position: relative;
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
        min-width: 0;
        @include m.frame;
    }

    .thumb {
        @include m.hatch;
        position: absolute;
        pointer-events: none;
    }

    @media (prefers-reduced-motion: no-preference) {
        .thumb.animate {
            transition:
                left var(--duration-base) var(--ease-out),
                top var(--duration-base) var(--ease-out),
                width var(--duration-base) var(--ease-out),
                height var(--duration-base) var(--ease-out);
        }
    }

    .segment {
        @include m.meta-label(var(--text-xs), 0.06em);
        position: relative;
        z-index: 1;
        @include m.transition(color, background);
        flex: 1 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: var(--space-1) var(--space-2);
        text-align: center;
        color: var(--color-text-muted);
        cursor: pointer;
        border-left: 1px solid var(--color-border);

        @media (pointer: coarse) {
            min-height: 44px;
        }
    }

    .segment:first-of-type {
        border-left: none;
    }

    @media (hover: hover) {
        .segment:hover {
            color: var(--color-text);
        }
    }

    .segment.selected {
        color: var(--color-text);
    }

    .static .segment.selected {
        @include m.hatch;
    }

    .segment input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
    }
</style>
