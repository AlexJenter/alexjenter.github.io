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

<!-- Prototype: a framed plate. The frame follows the shared hover/focus ladder
     (m.marks), and the empty state carries a centre crosshair (a fiducial)
     above the hint. -->
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
        {#if value}
            <img src={value} alt="Preview" />
        {:else}
            <span class="cross" aria-hidden="true"></span>
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

<style lang="scss">
    @use "$lib/styles/mixins" as m;

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
        @include m.marks;
        @include m.frame;
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: var(--space-2);
        justify-content: center;
        min-height: 88px;
        padding: var(--space-3);
        cursor: pointer;
        font: inherit;
        color: inherit;
        background: transparent;
        /* focus shows on the frame and crosshair, not as an outline */
        outline: none;
        @include m.transition(background);

        &.drag-over {
            --mark: var(--color-text);
            background: var(--color-surface);
        }

        @media (hover: hover) {
            &:hover {
                background: var(--color-surface);
            }
        }
    }

    /* centre crosshair: two hairlines, a gap-free plus sign */
    .cross {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
        color: var(--mark);
        background:
            linear-gradient(currentColor, currentColor) 50% 0 / 1px 100%
                no-repeat,
            linear-gradient(currentColor, currentColor) 0 50% / 100% 1px
                no-repeat;
        pointer-events: none;
        @include m.transition(color);
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
