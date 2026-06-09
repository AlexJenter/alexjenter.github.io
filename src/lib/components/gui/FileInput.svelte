<script lang="ts">
    interface Props {
        value?: string;
        accept?: string;
        label?: string;
    }

    let { value = $bindable(), accept = 'image/*', label }: Props = $props();

    let inputEl: HTMLInputElement;
    let filename = $state<string | undefined>();

    function handleChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        filename = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
            value = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
</script>

<div class="row">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control" class:full={!label}>
        <input
            bind:this={inputEl}
            type="file"
            {accept}
            onchange={handleChange}
            class="hidden"
            tabindex="-1"
        />
        <button type="button" class="pick-btn" onclick={() => inputEl.click()}>
            {filename ?? 'Choose…'}
        </button>
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

    .hidden {
        display: none;
    }

    .pick-btn {
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        transition:
            background var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out);
    }

    .pick-btn:hover {
        background: var(--color-border);
        border-color: var(--color-text-muted);
    }
</style>
