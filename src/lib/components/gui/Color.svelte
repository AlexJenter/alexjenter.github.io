<script lang="ts">
    interface Props {
        value: string;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();

    let inputEl: HTMLInputElement;
</script>

<!-- Swatch + hex readout (viewfinder language): label left, a sharp swatch and
     uppercase mono hex on the right. -->
<div class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control">
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
    .field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-height: 22px;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        font-variant-numeric: tabular-nums;
    }

    .label {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .control {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .hidden-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .swatch {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        border: 1px solid var(--color-border);
        cursor: pointer;
        padding: 0;
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    .swatch:hover {
        border-color: var(--color-text-muted);
    }

    .swatch:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }

    .hex {
        color: var(--color-text);
        text-transform: uppercase;
    }
</style>
