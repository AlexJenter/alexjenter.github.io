<script lang="ts">
    interface Props {
        value: number;
        min: number;
        max: number;
        step?: number;
        label?: string;
    }

    let { value = $bindable(), min, max, step = 1, label }: Props = $props();

    const display = $derived(
        Number.isInteger(step) ? String(Math.round(value)) : value.toFixed(1)
    );
</script>

<div class="row">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control" class:full={!label}>
        <input type="range" bind:value {min} {max} {step} />
        <output>{display}</output>
    </div>
</div>

<style>
    .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: var(--space-2);
        min-height: 22px;
    }

    .label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .control {
        display: flex;
        align-items: center;
        gap: var(--space-1);
    }

    .control.full {
        grid-column: 1 / -1;
    }

    input[type='range'] {
        flex: 1;
        min-width: 0;
        accent-color: var(--color-text);
        cursor: pointer;
    }

    output {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        min-width: 3ch;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
</style>
