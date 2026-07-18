<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();

    const name = Math.random().toString(36).slice(2, 9);
</script>

<!-- Segmented selector (viewfinder language): group label above a row of
     hairline-divided cells; the chosen cell fills solid. Real radio inputs are
     visually hidden but keep keyboard + group semantics. -->
<div class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <fieldset class="segments">
        {#if label}
            <!-- sr-only legend: the group name AT actually honours; the visible
                 .label span above stays purely presentational -->
            <legend class="sr-only">{label}</legend>
        {/if}
        {#each options as opt}
            <label class="segment" class:selected={value === opt.value}>
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

<style>
    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
    }

    .label {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .segments {
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
        border: 1px solid var(--color-border);
    }

    .segment {
        flex: 1 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-1) var(--space-2);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
        cursor: pointer;
        /* single hairline between cells; outer edge is the fieldset border */
        border-left: 1px solid var(--color-border);
        transition:
            color var(--duration-fast) var(--ease-out),
            background var(--duration-fast) var(--ease-out);
    }

    .segment:first-child {
        border-left: none;
    }

    .segment:hover {
        color: var(--color-text);
    }

    .segment.selected {
        background: var(--color-text);
        color: var(--color-bg);
    }

    .segment input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .segment:has(:focus-visible) {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
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
