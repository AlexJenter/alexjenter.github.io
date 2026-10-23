<script lang="ts">
    import ValueEdit from "./ValueEdit.svelte";
    import { clamp, formatValue, keyTarget, snap } from "./slider-math";

    interface Props {
        value: [number, number];
        min: number;
        max: number;
        step?: number;
        label?: string;
    }

    let {
        value = $bindable(),
        min,
        max,
        step = 1,
        label,
    }: Props = $props();

    const span = $derived(max - min);
    const loPct = $derived(((value[0] - min) / span) * 100);
    const hiPct = $derived(((value[1] - min) / span) * 100);

    const sides = ["minimum", "maximum"] as const;
    const pointerName = (i: 0 | 1) => `${label ?? "Range"} ${sides[i]}`;

    // The lower pointer can never pass the upper one, and the other way round.
    function setPointer(i: 0 | 1, v: number) {
        const next = snap(clamp(v, min, max), step);
        value =
            i === 0
                ? [Math.min(next, value[1]), value[1]]
                : [value[0], Math.max(next, value[0])];
    }

    // The whole range moves, its width kept.
    function setBand(lo: number, width: number) {
        const start = snap(clamp(lo, min, max - width), step);
        value = [start, snap(start + width, step)];
    }

    // Drag: one of the two pointers (0, 1), or the band between them (2).
    let trackEl: HTMLElement;
    let bandEl: HTMLElement;
    const pointerEls: HTMLElement[] = [];
    let active = $state<0 | 1 | 2 | null>(null);
    let lastX = 0;
    // The unsnapped position while dragging (the band's start for a band drag).
    let accum = 0;
    let bandWidth = 0;

    function onPointerDown(e: PointerEvent) {
        e.preventDefault();
        const rect = trackEl.getBoundingClientRect();
        const at = clamp(
            min + ((e.clientX - rect.left) / rect.width) * span,
            min,
            max,
        );
        const [lo, hi] = value;
        // Reach of a pointer in value units: 8 px either side.
        const reach = (8 / rect.width) * span;

        if (at > lo + reach && at < hi - reach) {
            // inside the band, away from both pointers: move the whole range
            active = 2;
            accum = lo;
            bandWidth = hi - lo;
            bandEl.focus();
        } else {
            active = at <= lo ? 0 : at >= hi ? 1 : at - lo < hi - at ? 0 : 1;
            accum = at;
            setPointer(active, accum);
            pointerEls[active]?.focus();
        }
        lastX = e.clientX;
        trackEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (active === null) return;
        const rect = trackEl.getBoundingClientRect();
        const dx = e.clientX - lastX;
        const delta = (dx / rect.width) * span * (e.shiftKey ? 0.1 : 1);
        lastX = e.clientX;

        if (active === 2) {
            accum = clamp(accum + delta, min, max - bandWidth);
            setBand(accum, bandWidth);
            return;
        }
        // Both pointers on the same mark: the drag direction picks the one to move.
        if (value[0] === value[1] && dx !== 0) {
            active = dx < 0 ? 0 : 1;
            pointerEls[active]?.focus();
        }
        accum = clamp(accum + delta, min, max);
        setPointer(active, accum);
    }

    function onPointerUp() {
        active = null;
    }

    function onPointerKeyDown(e: KeyboardEvent, i: 0 | 1) {
        const next = keyTarget(e, value[i], min, max, step);
        if (next === null) return;
        e.preventDefault();
        setPointer(i, next);
    }

    function onBandKeyDown(e: KeyboardEvent) {
        const width = value[1] - value[0];
        const next = keyTarget(e, value[0], min, max - width, step);
        if (next === null) return;
        e.preventDefault();
        setBand(next, width);
    }
</script>

<!--
    Prototype: the Slider's measuring scale with two pointers. The span
    between them is a diagonally hatched band, like a cut section on a
    drawing. Drag a pointer to move one end, drag inside the band to move the
    whole range, or click a value to type it. Tab order: lower pointer, the
    band, upper pointer. Marks follow the shared hover/focus ladder (m.marks),
    with focus per part: a pointer lights alone, the band lights with both
    pointers.
-->
<div class="slider">
    <div class="head">
        <span class="label" title={label}>{label ?? ""}</span>
        <span class="readout">
            <ValueEdit
                value={value[0]}
                text={formatValue(value[0], step)}
                {min}
                {max}
                {step}
                name={pointerName(0)}
                oncommit={(v) => setPointer(0, v)}
            />
            <span class="dash" aria-hidden="true">–</span>
            <ValueEdit
                value={value[1]}
                text={formatValue(value[1], step)}
                {min}
                {max}
                {step}
                name={pointerName(1)}
                oncommit={(v) => setPointer(1, v)}
            />
        </span>
    </div>
    <div
        bind:this={trackEl}
        class="track"
        role="presentation"
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
    >
        {#snippet pointer(i: 0 | 1)}
            <div
                bind:this={pointerEls[i]}
                class="pointer"
                class:lit={active === i || active === 2}
                style:left="{i === 0 ? loPct : hiPct}%"
                role="slider"
                tabindex="0"
                aria-valuemin={i === 0 ? min : value[0]}
                aria-valuemax={i === 0 ? value[1] : max}
                aria-valuenow={value[i]}
                aria-label={pointerName(i)}
                onkeydown={(e) => onPointerKeyDown(e, i)}
            ></div>
        {/snippet}
        <div class="scale" aria-hidden="true"></div>
        {@render pointer(0)}
        <div
            bind:this={bandEl}
            class="band"
            class:lit={active === 2}
            style:left="{loPct}%"
            style:width="{hiPct - loPct}%"
            role="slider"
            tabindex="0"
            aria-valuemin={min}
            aria-valuemax={max - (value[1] - value[0])}
            aria-valuenow={value[0]}
            aria-valuetext="{formatValue(value[0], step)} to {formatValue(
                value[1],
                step,
            )}"
            aria-label={`${label ?? "Range"}, move whole range`}
            onkeydown={onBandKeyDown}
        ></div>
        {@render pointer(1)}
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

    .readout {
        flex-shrink: 0;
        display: flex;
        align-items: baseline;
        gap: 0.5ch;
    }

    .dash {
        color: var(--color-text-muted);
    }

    /* hover lights every mark; focus is per part, set on the parts below */
    .track {
        @include m.marks($focus-within: false, $rest: var(--color-text-muted));
        position: relative;
        height: 24px;
        cursor: ew-resize;
        touch-action: none;

        @media (pointer: coarse) {
            height: 32px;
        }
    }

    .scale {
        @include m.scale-ticks;
    }

    /* the active segment: diagonal hatching over the full height, a solid
       edge on the baseline */
    .band {
        position: absolute;
        top: 0;
        bottom: 0;
        border-bottom: 2px solid var(--mark);
        background: repeating-linear-gradient(
            -45deg,
            var(--mark) 0 1px,
            transparent 1px 5px
        );
        opacity: 0.55;
        outline: none;
        pointer-events: none;
        @include m.transition(opacity);
    }

    .pointer {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--mark);
        outline: none;
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

    /* focus: a pointer lights alone; the band lights with both pointers */
    .band:focus,
    .band.lit {
        --mark: var(--color-accent-warm);
        opacity: 1;
    }

    .pointer:focus,
    .pointer.lit,
    .track:has(.band:focus) .pointer {
        --mark: var(--color-accent-warm);
    }

    .ends {
        @include m.scale-ends;
    }
</style>
