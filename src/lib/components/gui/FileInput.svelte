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

<!-- Viewfinder plate (viewfinder language): corner brackets frame the hint /
     preview instead of a dashed box — literally a camera viewfinder. -->
<div class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <button
        type="button"
        class="zone"
        class:drag-over={dragging}
        class:has-image={!!value}
        aria-label={label ?? "Image input"}
        onclick={() => inputEl.click()}
        ondragover={(e) => {
            e.preventDefault();
            dragging = true;
        }}
        ondragleave={() => (dragging = false)}
        ondrop={handleDrop}
    >
        <i class="tick tl" aria-hidden="true"></i>
        <i class="tick tr" aria-hidden="true"></i>
        <i class="tick bl" aria-hidden="true"></i>
        <i class="tick br" aria-hidden="true"></i>
        {#if value}
            <img src={value} alt="Preview" />
        {:else}
            <span class="hint">Drop / Click</span>
        {/if}
    </button>
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

    .hidden {
        display: none;
    }

    .zone {
        position: relative;
        width: 100%;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-3);
        cursor: pointer;
        font: inherit;
        color: inherit;
        border: none;
        background: transparent;
        transition: background var(--duration-fast) var(--ease-out);
    }

    .zone:hover,
    .zone.drag-over {
        background: var(--color-surface);
    }

    .zone:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }

    /* camera-viewfinder corner brackets */
    .tick {
        position: absolute;
        width: 10px;
        height: 10px;
        color: var(--color-text-muted);
        pointer-events: none;
        transition: color var(--duration-fast) var(--ease-out);
    }
    .tick.tl {
        top: 0;
        left: 0;
        border-top: 1px solid;
        border-left: 1px solid;
    }
    .tick.tr {
        top: 0;
        right: 0;
        border-top: 1px solid;
        border-right: 1px solid;
    }
    .tick.bl {
        bottom: 0;
        left: 0;
        border-bottom: 1px solid;
        border-left: 1px solid;
    }
    .tick.br {
        bottom: 0;
        right: 0;
        border-bottom: 1px solid;
        border-right: 1px solid;
    }

    .zone:hover .tick,
    .zone.drag-over .tick,
    .zone:focus-visible .tick {
        color: var(--color-text);
    }

    .hint {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        pointer-events: none;
        user-select: none;
    }

    img {
        width: 100%;
        height: auto;
        max-height: 240px;
        object-fit: contain;
        display: block;
        pointer-events: none;
    }
</style>
