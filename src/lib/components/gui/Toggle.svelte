<script lang="ts">
    interface Props {
        value: boolean;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();
</script>

<!--
    A two-position switch with printed legends, like the mode
    selector on a camera body. The state shows twice: where the lit cell sits
    and which word it carries, so it never depends on colour alone. The frame
    follows the shared hover/focus ladder (m.marks), like the Slider's marks.
    Same label row as the Slider's head.
-->
<label class="toggle">
    {#if label}
        <span class="label">{label}</span>
    {/if}
    <input type="checkbox" role="switch" bind:checked={value} />
    <span class="switch" aria-hidden="true">
        <span class="thumb"></span>
        <span class="legend" class:lit={!value}>Off</span>
        <span class="legend" class:lit={value}>On</span>
    </span>
</label>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .toggle {
        @include m.marks;
        /* anchors the hidden input next to the switch, not to a far ancestor */
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-height: 28px;
        cursor: pointer;
        font-variant-numeric: tabular-nums;

        @media (pointer: coarse) {
            min-height: 44px;
        }
    }

    .label {
        @include m.meta-label;
        flex: 1;
        min-width: 0;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
        /* focus shows on the switch (m.marks), not on this hidden input */
        outline: none;
    }

    .switch {
        position: relative;
        flex-shrink: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        isolation: isolate;
        /* the lit cell floats inside the frame, so the two edges don't double */
        padding: 2px;
        @include m.frame;
    }

    .legend {
        @include m.meta-label(0.6875rem, 0.1em);
        z-index: 1;
        min-width: 3.25ch;
        padding: 3px 7px;
        text-align: center;
        color: var(--color-text-muted);
    }

    .legend.lit {
        color: var(--color-text);
    }

    /* The lit cell: slides between the two legends. It moves with `left`, not
       `transform`: in Firefox a transform animation dropped its first frames
       (the new compositor layer is rastered as it starts), while a small
       main-thread move is cheap. Its width is one column of the padded grid. */
    .thumb {
        position: absolute;
        top: 2px;
        bottom: 2px;
        left: 2px;
        width: calc(50% - 2px);
        @include m.hatch;
    }

    input:checked + .switch .thumb {
        left: 50%;
    }

    /* the cell and the legends share one duration and easing, so each word
       changes colour as the cell passes under it, not before it arrives */
    @media (prefers-reduced-motion: no-preference) {
        .thumb {
            transition: left var(--duration-base) var(--ease-out);
        }

        .legend {
            transition: color var(--duration-base) var(--ease-out);
        }
    }
</style>
