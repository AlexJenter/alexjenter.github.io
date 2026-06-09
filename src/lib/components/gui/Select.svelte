<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();
</script>

<div class="row">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control" class:full={!label}>
        <select bind:value>
            {#each options as opt}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
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
    }

    .control.full {
        grid-column: 1 / -1;
    }

    select {
        width: 100%;
        padding: var(--space-1) var(--space-2);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: inherit;
        font-size: var(--text-xs);
        font-variation-settings: inherit;
        color: var(--color-text);
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235c5a56' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right var(--space-2) center;
        padding-right: calc(var(--space-2) + 14px);
    }
</style>
