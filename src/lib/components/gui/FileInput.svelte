<script lang="ts">
    interface Props {
        value?: string;
        accept?: string;
        label?: string;
    }

    let { value = $bindable(), accept = "image/*", label }: Props = $props();

    let inputEl: HTMLInputElement;
    let dragging = $state(false);

    function processFile(file: File) {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            value = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    function handleChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) processFile(file);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        dragging = false;
        const file = e.dataTransfer?.files[0];
        if (file) processFile(file);
    }
</script>

<div class="row" class:no-label={!label}>
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div
        class="zone"
        class:drag-over={dragging}
        class:has-image={!!value}
        role="button"
        tabindex="0"
        aria-label={label ?? "Image input"}
        onclick={() => inputEl.click()}
        onkeydown={(e) => e.key === "Enter" && inputEl.click()}
        ondragover={(e) => {
            e.preventDefault();
            dragging = true;
        }}
        ondragleave={() => (dragging = false)}
        ondrop={handleDrop}
    >
        {#if value}
            <img src={value} alt="Preview" />
        {:else}
            <span class="hint">Drop or click</span>
        {/if}
    </div>
    <input
        bind:this={inputEl}
        type="file"
        {accept}
        onchange={handleChange}
        class="hidden"
        tabindex="-1"
    />
</div>

<style>
    .row {
        display: grid;
        grid-template-columns: 1fr;
        align-items: start;
        gap: var(--space-2);
    }

    .row.no-label .zone {
        grid-column: 1 / -1;
    }

    .label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-top: var(--space-1);
    }

    .hidden {
        display: none;
    }

    .zone {
        aspect-ratio: 1;
        width: 100%;
        border: 3px dashed var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--color-bg);
        transition:
            border-color var(--duration-fast) var(--ease-out),
            background var(--duration-fast) var(--ease-out);
    }

    .zone:hover,
    .zone.drag-over {
        border-style: solid;
        border-color: var(--color-text-muted);
        background: var(--color-surface);
    }

    .zone.has-image {
        border-style: solid;
        border-color: var(--color-border);
    }

    .zone.has-image:hover,
    .zone.has-image.drag-over {
        border-color: var(--color-text-muted);
    }

    .hint {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        pointer-events: none;
        user-select: none;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
    }
</style>
