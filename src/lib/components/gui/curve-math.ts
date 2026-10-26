// Pure helpers for the CurveEditor: a curve through control points on the unit
// square, evaluated without overshoot.

export interface CurvePoint {
    x: number;
    y: number;
    /** Smooth: the curve passes through softly. Vector: a sharp corner. */
    smooth: boolean;
}

/** Closest two points may sit in x, so the curve stays a function of x. */
export const MIN_GAP = 0.01;

/** The default curve: input passes through unchanged. */
export function identityCurve(): CurvePoint[] {
    return [
        { x: 0, y: 0, smooth: true },
        { x: 1, y: 1, smooth: true },
    ];
}

/**
 * Tangent slope at every point. Smooth points get a monotone (Fritsch–
 * Carlson) tangent, so the curve never overshoots its points; a flat spot at
 * a local extreme. Vector points get none: their segments are straight.
 */
function tangents(pts: CurvePoint[]): number[] {
    const n = pts.length;
    const d: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        d.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));
    }
    const t = pts.map((_, i) => {
        if (i === 0) return d[0];
        if (i === n - 1) return d[n - 2];
        return d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    });
    for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) {
            t[i] = t[i + 1] = 0;
            continue;
        }
        const a = t[i] / d[i];
        const b = t[i + 1] / d[i];
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            t[i] = k * a * d[i];
            t[i + 1] = k * b * d[i];
        }
    }
    return t;
}

/** Evaluator for `pts` (sorted by x). Flat beyond the first and last point. */
export function curveFn(pts: CurvePoint[]): (x: number) => number {
    const n = pts.length;
    const t = tangents(pts);
    return (x) => {
        if (x <= pts[0].x) return pts[0].y;
        if (x >= pts[n - 1].x) return pts[n - 1].y;
        let i = 0;
        while (x > pts[i + 1].x) i++;
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const h = p1.x - p0.x;
        const u = (x - p0.x) / h;
        const secant = (p1.y - p0.y) / h;
        const m0 = p0.smooth ? t[i] : secant;
        const m1 = p1.smooth ? t[i + 1] : secant;
        const u2 = u * u;
        const u3 = u2 * u;
        const y =
            (2 * u3 - 3 * u2 + 1) * p0.y +
            (u3 - 2 * u2 + u) * h * m0 +
            (-2 * u3 + 3 * u2) * p1.y +
            (u3 - u2) * h * m1;
        return Math.min(1, Math.max(0, y));
    };
}

/** The curve sampled at `n` evenly spaced inputs 0…1 (n ≥ 2). */
export function sampleCurve(pts: CurvePoint[], n: number): Float32Array {
    const f = curveFn(pts);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = f(i / (n - 1));
    return out;
}

/** `pts` with a new point at x, on the curve. Returns the list and its index. */
export function insertPoint(
    pts: CurvePoint[],
    x: number,
): { points: CurvePoint[]; index: number } {
    const f = curveFn(pts);
    let index = 1;
    while (index < pts.length - 1 && pts[index].x < x) index++;
    const lo = pts[index - 1].x + MIN_GAP;
    const hi = pts[index].x - MIN_GAP;
    if (lo > hi) return { points: pts, index: -1 }; // no room
    const nx = Math.min(hi, Math.max(lo, x));
    const points = pts.slice();
    points.splice(index, 0, { x: nx, y: f(nx), smooth: true });
    return { points, index };
}

/** Moves point `i`, keeping the order of the points. */
export function movePoint(
    pts: CurvePoint[],
    i: number,
    x: number,
    y: number,
): CurvePoint[] {
    const last = pts.length - 1;
    // the ends may slide too, within 0…1; the curve stays flat beyond them
    const lo = i === 0 ? 0 : pts[i - 1].x + MIN_GAP;
    const hi = i === last ? 1 : pts[i + 1].x - MIN_GAP;
    const nx = Math.min(hi, Math.max(lo, x));
    const next = pts.slice();
    next[i] = { ...pts[i], x: nx, y: Math.min(1, Math.max(0, y)) };
    return next;
}
