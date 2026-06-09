<script lang="ts">
    interface Props {
        value: string;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();

    let inputEl: HTMLInputElement;
</script>

<div class="row">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control" class:full={!label}>
        <input
            bind:this={inputEl}
            type="color"
            bind:value
            class="hidden-input"
            tabindex="-1"
        />
        <button
            type="button"
            class="swatch"
            style="background: {value}"
            onclick={() => inputEl.click()}
            aria-label="Pick color"
        ></button>
        <span class="hex">{value}</span>
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
        gap: var(--space-2);
    }

    .control.full {
        grid-column: 1 / -1;
    }

    .hidden-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .swatch {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        padding: 0;
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    .swatch:hover {
        border-color: var(--color-text-muted);
    }

    .hex {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        font-family: var(--font-mono);
    }
</style>
