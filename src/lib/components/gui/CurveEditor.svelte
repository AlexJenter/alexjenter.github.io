<script lang="ts">
    import Radio from "./Radio.svelte";
    import Button from "./Button.svelte";
    import ValueEdit from "./ValueEdit.svelte";
    import { clamp, snap } from "./slider-math";
    import {
        MIN_GAP,
        curveFn,
        identityCurve,
        insertPoint,
        movePoint,
        type CurvePoint,
    } from "./curve-math";

    interface Props {
        /** Control points, sorted by x. The curve is flat beyond the ends. */
        points: CurvePoint[];
        label?: string;
    }

    let { points = $bindable(), label }: Props = $props();

    const STEP = 0.01;
    // How close (px) a press must land to grab a point.
    const REACH = 12;
    const typeOptions = [
        { value: "smooth", label: "Smooth" },
        { value: "vector", label: "Vector" },
    ];

    let selected = $state(0);
    const sel = $derived(Math.min(selected, points.length - 1));
    const isEnd = $derived(sel === 0 || sel === points.length - 1);

    // The drawn curve: 64 samples as a polyline, y flipped for the SVG.
    const path = $derived.by(() => {
        const f = curveFn(points);
        let d = "";
        for (let i = 0; i <= 64; i++) {
            const x = i / 64;
            d += `${i ? "L" : "M"}${x * 100} ${(1 - f(x)) * 100}`;
        }
        return d;
    });

    const fmt = (v: number) => v.toFixed(2);
    const pointName = (i: number) =>
        `${label ?? "Curve"} point ${i + 1} of ${points.length}`;

    // Drag: one point.
    let plotEl: HTMLElement;
    const pointEls: HTMLElement[] = [];
    let drag: number | null = null;
    // The unsnapped position while dragging, in 0…1 of the plot.
    let ax = 0;
    let ay = 0;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
        e.preventDefault();
        const rect = plotEl.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        // nearest point within reach, else a new one
        let hit = -1;
        let best = REACH;
        points.forEach((p, i) => {
            const dist = Math.hypot(
                px - p.x * rect.width,
                py - (1 - p.y) * rect.height,
            );
            if (dist <= best) {
                best = dist;
                hit = i;
            }
        });

        if (hit >= 0) {
            selected = hit;
        } else {
            const x = px / rect.width;
            const added = insertPoint(points, clamp(x, 0, 1));
            if (added.index < 0) return;
            points = added.points;
            hit = added.index;
            selected = hit;
        }
        drag = hit;
        ax = points[hit].x;
        ay = points[hit].y;
        pointEls[hit]?.focus();
        lastX = e.clientX;
        lastY = e.clientY;
        plotEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (drag === null) return;
        const rect = plotEl.getBoundingClientRect();
        const fine = e.shiftKey ? 0.1 : 1;
        const dx = ((e.clientX - lastX) / rect.width) * fine;
        const dy = (-(e.clientY - lastY) / rect.height) * fine;
        lastX = e.clientX;
        lastY = e.clientY;
        ax = clamp(ax + dx, 0, 1);
        ay = clamp(ay + dy, 0, 1);
        points = movePoint(points, drag, ax, ay);
    }

    function onPointerUp() {
        drag = null;
    }

    function remove(i: number) {
        if (i === 0 || i === points.length - 1) return;
        points = points.filter((_, k) => k !== i);
        selected = i - 1;
        pointEls[i - 1]?.focus();
    }

    // Arrows nudge a point (Shift: finer), Delete removes it.
    function onPointKeyDown(e: KeyboardEvent, i: number) {
        const inc = e.shiftKey ? STEP / 10 : STEP;
        const p = points[i];
        switch (e.key) {
            case "ArrowLeft":
                points = movePoint(points, i, p.x - inc, p.y);
                break;
            case "ArrowRight":
                points = movePoint(points, i, p.x + inc, p.y);
                break;
            case "ArrowUp":
                points = movePoint(points, i, p.x, p.y + inc);
                break;
            case "ArrowDown":
                points = movePoint(points, i, p.x, p.y - inc);
                break;
            case "Delete":
            case "Backspace":
                remove(i);
                break;
            default:
                return;
        }
        e.preventDefault();
        selected = i;
    }

    function reset() {
        points = identityCurve();
        selected = 0;
    }

    // The allowed x for the selected point: between its neighbours.
    const xMin = $derived(sel === 0 ? 0 : points[sel - 1].x + MIN_GAP);
    const xMax = $derived(
        sel === points.length - 1 ? 1 : points[sel + 1].x - MIN_GAP,
    );
    const first = $derived(points[0]);
    const lastPt = $derived(points[points.length - 1]);
</script>

<!--
    A curve over the unit square, after Blender's curve widget: the line
    through the control points maps an input (x) to an output (y). Press on
    empty plot to add a point on the curve, drag to move one (Shift: finer),
    Delete or the button removes the selected one. The end points stay, but
    slide along x. A point is Smooth (soft, never overshooting) or Vector (a
    sharp corner). Beyond the end points the curve stays flat, so moving the
    first point right is a cutoff; that stretch is hatched. Tab through the
    points; arrows nudge. Marks follow the shared hover/focus ladder
    (m.marks), one part lit at a time.
-->
<div class="curve">
    <div class="head">
        <span class="label" title={label}>{label ?? ""}</span>
    </div>

    <div
        bind:this={plotEl}
        class="plot"
        role="presentation"
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
    >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path class="grid" d="M25 0V100M50 0V100M75 0V100M0 25H100M0 50H100M0 75H100" />
            <path class="diag" d="M0 100L100 0" />
            <rect class="flat" x="0" y="0" width={first.x * 100} height="100" />
            <rect
                class="flat"
                x={lastPt.x * 100}
                y="0"
                width={(1 - lastPt.x) * 100}
                height="100"
            />
            <path class="line" d={path} />
        </svg>

        {#each points as p, i (i)}
            <div
                bind:this={pointEls[i]}
                class="pt"
                class:vector={!p.smooth}
                class:sel={i === sel}
                style:left="{p.x * 100}%"
                style:bottom="{p.y * 100}%"
                role="slider"
                tabindex="0"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={p.y}
                aria-valuetext="input {fmt(p.x)}, output {fmt(p.y)}"
                aria-label={pointName(i)}
                onfocus={() => (selected = i)}
                onkeydown={(e) => onPointKeyDown(e, i)}
            ></div>
        {/each}
    </div>

    <div class="readout">
        <span class="coord">
            <span class="axis">x</span>
            <ValueEdit
                value={points[sel].x}
                text={fmt(points[sel].x)}
                min={xMin}
                max={xMax}
                step={STEP}
                name="Point {sel + 1} input"
                oncommit={(v) => (points = movePoint(points, sel, v, points[sel].y))}
            />
        </span>
        <span class="coord">
            <span class="axis">y</span>
            <ValueEdit
                value={points[sel].y}
                text={fmt(points[sel].y)}
                min={0}
                max={1}
                step={STEP}
                name="Point {sel + 1} output"
                oncommit={(v) => (points = movePoint(points, sel, points[sel].x, v))}
            />
        </span>
    </div>

    <Radio
        options={typeOptions}
        label="Point type"
        bind:value={
            () => (points[sel].smooth ? "smooth" : "vector"),
            (v) => {
                points = points.map((p, i) =>
                    i === sel ? { ...p, smooth: v === "smooth" } : p,
                );
            }
        }
    />
    <div class="actions">
        <Button label="Delete point" onclick={() => remove(sel)} disabled={isEnd} />
        <Button label="Reset" onclick={reset} />
    </div>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .curve {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: var(--text-xs);
    }

    .label {
        @include m.meta-label;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* hover lights the whole frame; focus belongs to a point or the cut line */
    .plot {
        @include m.marks($focus-within: false, $rest: var(--color-text-dim));
        position: relative;
        aspect-ratio: 1;
        border: 1px solid var(--mark);
        cursor: crosshair;
        touch-action: none;
        @include m.transition(border-color);
    }

    svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        fill: none;
        stroke-width: 1;
        vector-effect: non-scaling-stroke;

        path,
        rect {
            vector-effect: non-scaling-stroke;
        }
    }

    .grid {
        stroke: var(--color-border);
    }

    .diag {
        stroke: var(--color-text-dim);
        stroke-dasharray: 2 3;
    }

    .line {
        stroke: var(--color-text);
        stroke-width: 1.5;
    }

    /* where the curve is flat beyond the end points */
    .flat {
        fill: color-mix(in srgb, var(--color-text) 12%, transparent);
        stroke: none;
    }

    /* a point: a 24px target around a small mark; round = smooth, square =
       vector corner. The selected one is filled. */
    .pt {
        --mark: var(--color-text-muted);
        position: absolute;
        outline: none;
    }

    .pt {
        width: 24px;
        height: 24px;
        transform: translate(-50%, 50%);
    }

    .pt::before {
        content: "";
        position: absolute;
        inset: 8px;
        border: 1px solid var(--mark);
        border-radius: 50%;
        background: var(--color-bg);
        @include m.transition(border-color, background);
    }

    .pt.vector::before {
        border-radius: 0;
        transform: rotate(45deg);
        inset: 9px;
    }

    .pt.sel::before {
        background: var(--mark);
    }

    @media (hover: hover) {
        .pt:hover {
            --mark: var(--color-text);
        }
    }

    .pt:focus {
        --mark: var(--color-accent-warm);
    }

    .readout {
        display: flex;
        justify-content: space-between;
        gap: var(--space-2);
    }

    .coord {
        display: flex;
        align-items: baseline;
        gap: 0.5ch;
    }

    .axis {
        @include m.meta-label;
        color: var(--color-text-muted);
    }

    .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
    }
</style>
