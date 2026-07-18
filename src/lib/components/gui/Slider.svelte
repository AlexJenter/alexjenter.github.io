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
    let dragging = $state(false);
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
        } else if (e.key === "Home") {
            e.preventDefault();
            value = min;
            accumValue = min;
        } else if (e.key === "End") {
            e.preventDefault();
            value = max;
            accumValue = max;
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

<!--
    Ticked-gauge slider (viewfinder language): label + readout stacked above a
    full-width graduated track with a playhead marker. Skin only — drag
    (shift = fine), keyboard, and click-to-type behaviour are unchanged.
-->
<div class="slider">
    <div class="head">
        <span class="label" title={label}>{label ?? ""}</span>
        {#if editing}
            <input
                bind:this={editEl}
                type="number"
                bind:value={editStr}
                {min}
                {max}
                {step}
                class="edit-input"
                aria-label={label ? `${label} value` : "Value"}
                onblur={commit}
                onkeydown={handleEditKey}
            />
        {:else}
            <button
                type="button"
                class="value"
                title="Click to edit"
                aria-label={label ? `Edit ${label} value` : "Edit value"}
                onclick={startEdit}
            >
                {display}
            </button>
        {/if}
    </div>
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
        <div class="ticks" aria-hidden="true"></div>
        <div class="fill" style="width: {pct}%"></div>
        <div class="marker" style="left: {pct}%"></div>
    </div>
</div>

<style>
    .slider {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: var(--text-xs);
    }

    .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-2);
        min-width: 0;
    }

    .label {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .value {
        flex-shrink: 0;
        font: inherit;
        background: none;
        padding: 0;
        color: var(--color-text);
        cursor: text;
        border: none;
        border-bottom: 1px solid transparent;
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    .value:hover {
        border-bottom-color: var(--color-text-muted);
    }

    .value:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }

    .edit-input {
        flex-shrink: 0;
        width: 6ch;
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

    .track {
        position: relative;
        height: 16px;
        cursor: ew-resize;
        touch-action: none;
        outline: none;
    }

    .track.dragging {
        cursor: col-resize;
    }

    /* ruler: a hairline baseline with short vertical graduation ticks */
    .ticks {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 7px;
        background:
            linear-gradient(var(--color-border), var(--color-border)) 0 50% /
                100% 1px no-repeat,
            repeating-linear-gradient(
                90deg,
                var(--color-border) 0 1px,
                transparent 1px 10px
            );
    }

    /* magnitude fill from 0 to the value, along the baseline */
    .fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 2px;
        background: var(--color-text-muted);
        pointer-events: none;
    }

    /* playhead marker at the current value — the bright, tall element */
    .marker {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        transform: translateX(-1px);
        background: var(--color-text);
        pointer-events: none;
        transition: background var(--duration-fast) var(--ease-out);
    }

    .track:focus-visible .marker {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }
</style>
