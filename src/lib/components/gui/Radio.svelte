<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();

    const name = Math.random().toString(36).slice(2, 9);
</script>

<div class="row">
    {#if label}
        <span class="group-label">{label}</span>
    {/if}
    <fieldset class:full={!label}>
        {#each options as opt}
            <label>
                <input type="radio" {name} value={opt.value} bind:group={value} />
                {opt.label}
            </label>
        {/each}
    </fieldset>
</div>

<style>
    .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: start;
        gap: var(--space-2);
        min-height: 22px;
    }

    .group-label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        padding-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    fieldset {
        border: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    fieldset.full {
        grid-column: 1 / -1;
    }

    label {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        cursor: pointer;
    }

    input[type='radio'] {
        accent-color: var(--color-text);
        cursor: pointer;
        width: 12px;
        height: 12px;
    }
</style>
