<script lang="ts">
    interface Props {
        value: number;
        min: number;
        max: number;
        step?: number;
        label?: string;
    }

    let { value = $bindable(), min, max, step = 1, label }: Props = $props();

    const pct = $derived(((value - min) / (max - min)) * 100);

    const display = $derived(
        Number.isInteger(step) ? String(Math.round(value)) : value.toFixed(2),
    );

    function snap(v: number): number {
        return Math.round(v / step) * step;
    }

    function clamp(v: number): number {
        return Math.max(min, Math.min(max, v));
    }

    // Custom drag
    let trackEl: HTMLElement;
    let dragging = false;
    let lastX = 0;
    let accumValue = 0;

    function onPointerDown(e: PointerEvent) {
        const rect = trackEl.getBoundingClientRect();
        const ratio = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        accumValue = clamp(min + ratio * (max - min));
        value = snap(accumValue);
        dragging = true;
        lastX = e.clientX;
        trackEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        const rect = trackEl.getBoundingClientRect();
        const scale = e.shiftKey ? 0.1 : 1;
        const delta = ((e.clientX - lastX) / rect.width) * (max - min) * scale;
        lastX = e.clientX;
        accumValue = clamp(accumValue + delta);
        value = snap(accumValue);
    }

    function onPointerUp() {
        dragging = false;
    }

    function onKeyDown(e: KeyboardEvent) {
        const inc = e.shiftKey
            ? Math.max(step * 0.1, (max - min) / 1000)
            : step;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            value = snap(clamp(value + inc));
            accumValue = value;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            value = snap(clamp(value - inc));
            accumValue = value;
        }
    }

    // Click-to-type
    let editing = $state(false);
    let editStr = $state("");
    let editEl = $state<HTMLInputElement | undefined>(undefined);

    function startEdit() {
        editStr = String(value);
        editing = true;
    }

    $effect(() => {
        if (editing && editEl) {
            editEl.focus();
            editEl.select();
        }
    });

    function commit() {
        const parsed = parseFloat(editStr);
        if (!isNaN(parsed)) {
            value = snap(clamp(parsed));
            accumValue = value;
        }
        editing = false;
    }

    function handleEditKey(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            commit();
        }
        if (e.key === "Escape") {
            editing = false;
        }
    }
</script>

<div class="row">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <div class="control" class:full={!label}>
        <div
            bind:this={trackEl}
            class="track"
            class:dragging
            role="slider"
            tabindex="0"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-label={label}
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
            onkeydown={onKeyDown}
        >
            <div class="track-line">
                <div class="fill" style="width: {pct}%"></div>
            </div>
            <div class="thumb" style="left: {pct}%"></div>
        </div>
        {#if editing}
            <input
                bind:this={editEl}
                type="number"
                bind:value={editStr}
                {min}
                {max}
                {step}
                class="edit-input"
                onblur={commit}
                onkeydown={handleEditKey}
            />
        {:else}
            <div
                class="output-wrapper"
                onclick={startEdit}
                role="button"
                title="Click to edit"
                tabindex="0"
                onkeydown={(e) => e.key === "Enter" && startEdit()}
            >
                <output>{display}</output>
            </div>
        {/if}
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

    .track {
        flex: 1;
        min-width: 0;
        position: relative;
        height: 18px;
        cursor: ew-resize;
        display: flex;
        align-items: center;
        touch-action: none;
        outline: none;
    }

    .track.dragging {
        cursor: col-resize;
    }

    .track:focus-visible .thumb {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }

    .track-line {
        position: absolute;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--color-border);
        border-radius: 2px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: var(--color-text-muted);
        border-radius: 2px;
    }

    .thumb {
        position: absolute;
        top: 50%;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-text);
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: background var(--duration-fast) var(--ease-out);
    }

    output {
        font-family: monospace;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        width: 2em;
        display: block;
        text-align: right;
        cursor: text;
        border-bottom: 1px solid transparent;
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    .edit-input {
        width: 4ch;
        font-size: var(--text-xs);
        font-family: var(--font-serif);
        font-variation-settings:
            "opsz" var(--font-opsz-body),
            "WONK" 0,
            "SOFT" 0;
        font-variant-numeric: tabular-nums;
        color: var(--color-text);
        background: none;
        border: none;
        border-bottom: 1px solid var(--color-text-muted);
        outline: none;
        text-align: right;
        padding: 0;
        appearance: textfield;
        -moz-appearance: textfield;
    }

    .edit-input::-webkit-inner-spin-button,
    .edit-input::-webkit-outer-spin-button {
        appearance: none;
    }
</style>
