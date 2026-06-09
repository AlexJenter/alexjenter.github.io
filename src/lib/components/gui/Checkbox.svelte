<script lang="ts">
    interface Props {
        value: boolean;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();

    const uid = Math.random().toString(36).slice(2, 9);
</script>

<div class="row">
    {#if label}
        <label class="label" for={uid}>{label}</label>
    {/if}
    <div class="control" class:full={!label}>
        <input type="checkbox" bind:checked={value} id={uid} />
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
        cursor: pointer;
    }

    .control {
        display: flex;
        align-items: center;
    }

    .control.full {
        grid-column: 1 / -1;
    }

    input[type='checkbox'] {
        accent-color: var(--color-text);
        cursor: pointer;
        width: 14px;
        height: 14px;
    }
</style>
