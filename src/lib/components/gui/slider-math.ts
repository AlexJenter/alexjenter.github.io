// Pure helpers shared by the Slider and RangeSlider.

export function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

export function snap(v: number, step: number): number {
    return Math.round(v / step) * step;
}

/** Whole numbers print bare; fractional steps print two decimals. */
export function formatValue(v: number, step: number): string {
    return Number.isInteger(step) ? String(Math.round(v)) : v.toFixed(2);
}

/**
 * Where a key press sends a slider currently at `value`, or null when the key
 * is not a slider key. Arrows move one step (Shift: a tenth of that, at least
 * a thousandth of the range); Home and End jump to the ends. The result is
 * not clamped or snapped: that stays with the caller.
 */
export function keyTarget(
    e: KeyboardEvent,
    value: number,
    min: number,
    max: number,
    step: number,
): number | null {
    const inc = e.shiftKey ? Math.max(step * 0.1, (max - min) / 1000) : step;
    switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
            return value + inc;
        case "ArrowLeft":
        case "ArrowDown":
            return value - inc;
        case "Home":
            return min;
        case "End":
            return max;
        default:
            return null;
    }
}
