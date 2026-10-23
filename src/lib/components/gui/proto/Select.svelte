<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();
</script>

<!--
    Prototype: the dropdown as a framed readout. Same frame ladder as the
    Toggle; the caret is the Slider's pointer head, drawn in CSS so it follows
    the theme (the old chevron was an SVG with a pinned colour).
-->
<label class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <span class="frame">
        <select bind:value>
            {#each options as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
        <i class="caret" aria-hidden="true"></i>
    </span>
</label>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .field {
        @include m.marks;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-variant-numeric: tabular-nums;
    }

    .label {
        @include m.meta-label;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .frame {
        position: relative;
        display: block;
        @include m.frame;
    }

    select {
        display: block;
        width: 100%;
        min-height: 28px;
        padding: var(--space-1) calc(var(--space-2) + 14px) var(--space-1)
            var(--space-2);
        background: transparent;
        border: none;
        border-radius: 0;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text);
        cursor: pointer;
        appearance: none;
        /* focus shows on the frame, not on the field */
        outline: none;

        @media (pointer: coarse) {
            min-height: 44px;
        }
    }

    option {
        background: var(--color-bg);
        color: var(--color-text);
    }

    .caret {
        position: absolute;
        top: 50%;
        right: var(--space-2);
        translate: 0 -50%;
        border: 4px solid transparent;
        border-top-color: var(--mark);
        border-bottom-width: 0;
        pointer-events: none;
        @include m.transition(border-top-color);
    }
</style>
