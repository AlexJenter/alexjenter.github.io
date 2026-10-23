<script lang="ts">
    import ValueEdit from "./ValueEdit.svelte";
    import { clamp, formatValue, keyTarget, snap } from "./slider-math";

    interface Props {
        value: number;
        min: number;
        max: number;
        step?: number;
        label?: string;
    }

    let { value = $bindable(), min, max, step = 1, label }: Props = $props();

    const span = $derived(max - min);
    const pct = $derived(((value - min) / span) * 100);

    let trackEl: HTMLElement;
    let dragging = $state(false);
    // True after a typed value, so the pointer glides there. Any pointer or key
    // use ends it: dragging must follow the pointer exactly, arrows stay instant.
    let settling = $state(false);
    let lastX = 0;
    // The unsnapped position while dragging, so Shift and snapping don't fight.
    let accum = 0;

    function onPointerDown(e: PointerEvent) {
        settling = false;
        const rect = trackEl.getBoundingClientRect();
        accum = clamp(min + ((e.clientX - rect.left) / rect.width) * span, min, max);
        value = snap(accum, step);
        dragging = true;
        lastX = e.clientX;
        trackEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        const rect = trackEl.getBoundingClientRect();
        const scale = e.shiftKey ? 0.1 : 1;
        accum = clamp(
            accum + ((e.clientX - lastX) / rect.width) * span * scale,
            min,
            max,
        );
        lastX = e.clientX;
        value = snap(accum, step);
    }

    function onPointerUp() {
        dragging = false;
    }

    // Only the glide ends it, not the shorter colour fades.
    function onTransitionEnd(e: TransitionEvent) {
        if (e.propertyName === "left" || e.propertyName === "width") {
            settling = false;
        }
    }

    function onKeyDown(e: KeyboardEvent) {
        settling = false;
        const next = keyTarget(e, value, min, max, step);
        if (next === null) return;
        e.preventDefault();
        value = snap(clamp(next, min, max), step);
    }
</script>

<!--
    The Slider as a measuring scale. Twenty divisions, a long tick
    every fifth, the end values printed under the ends, and a pointer with a
    fiducial head that reads the scale from above (a light-meter / vernier
    reading). Marks follow the shared hover/focus ladder (see m.marks).
-->
<div class="slider">
    <div class="head">
        <span class="label" title={label}>{label ?? ""}</span>
        <ValueEdit
            {value}
            text={formatValue(value, step)}
            {min}
            {max}
            {step}
            name={label ?? "value"}
            oncommit={(v) => {
                settling = true;
                value = v;
            }}
        />
    </div>
    <div
        bind:this={trackEl}
        class="track"
        class:dragging
        class:settling
        role="slider"
        tabindex="0"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        onkeydown={onKeyDown}
        ontransitionend={onTransitionEnd}
    >
        <div class="scale" aria-hidden="true"></div>
        <div class="fill" style="width: {pct}%"></div>
        <div class="pointer" style="left: {pct}%"></div>
    </div>
    <div class="ends" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
    </div>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

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
        @include m.meta-label;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .track {
        @include m.marks($rest: var(--color-text-muted));
        position: relative;
        height: 24px;
        cursor: ew-resize;
        touch-action: none;
        outline: none;

        @media (pointer: coarse) {
            height: 32px;
        }
    }

    .track.dragging {
        --mark: var(--color-accent-warm);
        cursor: col-resize;
    }

    .scale {
        @include m.scale-ticks;
    }

    /* a typed value: the pointer and fill glide to it, as the Radio's cell does */
    @media (prefers-reduced-motion: no-preference) {
        .track.settling .fill {
            transition:
                background var(--duration-fast) var(--ease-out),
                width var(--duration-base) var(--ease-out);
        }

        .track.settling .pointer {
            transition:
                background var(--duration-fast) var(--ease-out),
                left var(--duration-base) var(--ease-out);
        }
    }

    /* magnitude from the start of the scale to the pointer */
    .fill {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 2px;
        background: var(--mark);
        pointer-events: none;
        @include m.transition(background);
    }

    /* the pointer: a fine line down to the scale, a fiducial head on top */
    .pointer {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--mark);
        pointer-events: none;
        @include m.transition(background);
    }

    .pointer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--mark);
        border-bottom-width: 0;
    }

    .ends {
        @include m.scale-ends;
    }
</style>
