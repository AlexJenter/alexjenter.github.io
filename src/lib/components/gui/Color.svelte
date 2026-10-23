<script lang="ts">
    interface Props {
        value: string;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();
</script>

<!--
    The whole row is one native label around a real colour input,
    so a click anywhere opens the picker and no click handler is needed. The
    input is hidden but still focusable, and focus shows on the swatch frame.
-->
<label class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <span class="control">
        <input type="color" bind:value />
        <span
            class="swatch"
            style:background-color={value}
            aria-hidden="true"
        ></span>
        <span class="hex">{value}</span>
    </span>
</label>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .field {
        @include m.marks;
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

    .control {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .swatch {
        position: relative;
        box-sizing: border-box;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        /* the colour sits in a 2px inset, clear of the frame */
        padding: 2px;
        background-clip: content-box;
        @include m.frame;
    }

    .hex {
        @include m.meta-label;
        color: var(--color-text);
    }
</style>
