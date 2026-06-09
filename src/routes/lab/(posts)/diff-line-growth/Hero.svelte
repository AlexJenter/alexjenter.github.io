<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Pane, Slider, Button } from "$lib/components/gui";

    type Vec2 = { x: number; y: number };
    type Point = { pos: Vec2; oldpos: Vec2; index: number };
    type Stick = { p1: Point; p2: Point };

    const vadd = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
    const vsub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
    const vscale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
    const vlen = (v: Vec2) => Math.hypot(v.x, v.y);
    const vnorm = (v: Vec2): Vec2 => {
        const l = vlen(v) || 1;
        return { x: v.x / l, y: v.y / l };
    };

    class Grid {
        w: number;
        h: number;
        cell: number;
        cols: number;
        rows: number;
        cells: number[][];

        constructor(w: number, h: number, cell: number) {
            this.w = w;
            this.h = h;
            this.cell = cell;
            this.cols = Math.max(1, Math.ceil(w / cell));
            this.rows = Math.max(1, Math.ceil(h / cell));
            this.cells = Array.from(
                { length: this.cols * this.rows },
                () => [],
            );
        }

        resize(w: number, h: number, cell: number) {
            this.w = w;
            this.h = h;
            this.cell = cell;
            this.cols = Math.max(1, Math.ceil(w / cell));
            this.rows = Math.max(1, Math.ceil(h / cell));
            this.clear();
        }

        clear() {
            const n = this.cols * this.rows;
            if (this.cells.length !== n) {
                this.cells = Array.from({ length: n }, () => []);
            } else {
                for (const c of this.cells) c.length = 0;
            }
        }

        insert(id: number, x: number, y: number) {
            const gx = Math.floor(x / this.cell);
            const gy = Math.floor(y / this.cell);
            if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows)
                this.cells[gy * this.cols + gx].push(id);
        }

        query(x: number, y: number, r: number, out: number[]) {
            out.length = 0;
            const sr = Math.ceil(r / this.cell);
            const cx = Math.floor(x / this.cell);
            const cy = Math.floor(y / this.cell);
            for (
                let gy = Math.max(0, cy - sr);
                gy <= Math.min(this.rows - 1, cy + sr);
                gy++
            ) {
                for (
                    let gx = Math.max(0, cx - sr);
                    gx <= Math.min(this.cols - 1, cx + sr);
                    gx++
                ) {
                    for (const id of this.cells[gy * this.cols + gx])
                        out.push(id);
                }
            }
        }
    }

    const NUM_POINTS = 1500;
    const STICK_ITERATIONS = 8;
    const CENTER_PULL = 0.002;
    const INNER_RADIUS = 100;
    const INNER_FORCE = -10;
    let bendStiffness = $state(0.001);

    let restLength = $state(10);
    let repulsionRadius = $state(20);
    let repulsionStrength = $state(0.6);
    let resetKey = $state(0);
    let paused = $state(false);

    let points: Point[] = [];
    let sticks: Stick[] = [];
    let grid: Grid;
    let simW = 0;
    let simH = 0;
    const nearby: number[] = [];
    let dx: Float64Array = new Float64Array(0);
    let dy: Float64Array = new Float64Array(0);
    let snapX: Float64Array = new Float64Array(0);
    let snapY: Float64Array = new Float64Array(0);

    function initSim(w: number, h: number) {
        simW = w;
        simH = h;
        points = [];
        sticks = [];

        const rl = restLength;
        const radius = ((NUM_POINTS * rl) / (2 * Math.PI)) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        for (let i = 0; i < NUM_POINTS; i++) {
            const angle = (i / NUM_POINTS) * 2 * Math.PI;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            points.push({ pos: { x, y }, oldpos: { x, y }, index: i });
        }

        for (let i = 0; i < NUM_POINTS; i++) {
            sticks.push({ p1: points[i], p2: points[(i + 1) % NUM_POINTS] });
        }

        grid = new Grid(w, h, repulsionRadius * 2);
        dx = new Float64Array(NUM_POINTS);
        dy = new Float64Array(NUM_POINTS);
        snapX = new Float64Array(NUM_POINTS);
        snapY = new Float64Array(NUM_POINTS);
    }

    function stepSim() {
        const center: Vec2 = { x: simW / 2, y: simH / 2 };
        const rr = repulsionRadius;
        const rs = repulsionStrength;
        const rl = restLength;
        const n = points.length;

        // Verlet — velocity normalized to 1px/frame for constant-speed growth
        for (const p of points) {
            const vel = vsub(p.pos, p.oldpos);
            p.oldpos = { ...p.pos };
            p.pos = vadd(p.pos, vnorm(vel));
        }

        // Center pull + inner ring repulsion keeps the loop from collapsing
        for (const p of points) {
            const toCenter = vsub(center, p.pos);
            p.pos = vadd(p.pos, vscale(toCenter, CENTER_PULL));
            if (vlen(toCenter) < INNER_RADIUS) {
                p.pos = vadd(p.pos, vscale(vnorm(toCenter), INNER_FORCE));
            }
        }

        for (let iter = 0; iter < STICK_ITERATIONS; iter++) {
            // Stick length constraints — Jacobi style: snapshot, accumulate, apply
            for (let j = 0; j < n; j++) {
                snapX[j] = points[j].pos.x;
                snapY[j] = points[j].pos.y;
            }
            dx.fill(0);
            dy.fill(0);
            for (const s of sticks) {
                const i1 = s.p1.index;
                const i2 = s.p2.index;
                const diffX = snapX[i2] - snapX[i1];
                const diffY = snapY[i2] - snapY[i1];
                const dist = Math.hypot(diffX, diffY);
                if (dist === 0) continue;
                const ratio = (rl - dist) / dist / 2;
                const ox = diffX * ratio;
                const oy = diffY * ratio;
                dx[i1] -= ox;
                dy[i1] -= oy;
                dx[i2] += ox;
                dy[i2] += oy;
            }
            for (let j = 0; j < n; j++) {
                points[j].pos.x += dx[j];
                points[j].pos.y += dy[j];
            }

            // Boundary reflection
            for (const p of points) {
                const vel = vsub(p.pos, p.oldpos);
                if (p.pos.x > simW) {
                    p.pos.x = simW;
                    p.oldpos.x = simW + vel.x;
                } else if (p.pos.x < 0) {
                    p.pos.x = 0;
                    p.oldpos.x = vel.x;
                }
                if (p.pos.y > simH) {
                    p.pos.y = simH;
                    p.oldpos.y = simH + vel.y;
                } else if (p.pos.y < 0) {
                    p.pos.y = 0;
                    p.oldpos.y = vel.y;
                }
            }

            // Kirchhoff bending — bilaplacian (5-point stencil), Jacobi style.
            // Penalises changes in curvature rather than curvature itself,
            // driving the curve toward constant-curvature arcs between folds.
            for (let j = 0; j < n; j++) {
                snapX[j] = points[j].pos.x;
                snapY[j] = points[j].pos.y;
            }
            dx.fill(0);
            dy.fill(0);
            const kb = bendStiffness;
            for (let j = 0; j < n; j++) {
                const jm2 = (j + n - 2) % n;
                const jm1 = (j + n - 1) % n;
                const jp1 = (j + 1) % n;
                const jp2 = (j + 2) % n;
                const fx =
                    snapX[jm2] -
                    4 * snapX[jm1] +
                    6 * snapX[j] -
                    4 * snapX[jp1] +
                    snapX[jp2];
                const fy =
                    snapY[jm2] -
                    4 * snapY[jm1] +
                    6 * snapY[j] -
                    4 * snapY[jp1] +
                    snapY[jp2];
                dx[j] -= kb * fx;
                dy[j] -= kb * fy;
            }
            for (let j = 0; j < n; j++) {
                points[j].pos.x += dx[j];
                points[j].pos.y += dy[j];
            }

            // Self-repulsion via spatial grid
            grid.clear();
            for (const p of points) grid.insert(p.index, p.pos.x, p.pos.y);

            for (let j = 0; j < n; j++) {
                const p1 = points[j];
                grid.query(p1.pos.x, p1.pos.y, rr, nearby);

                for (const idx of nearby) {
                    const p2 = points[idx];
                    if (p1 === p2) continue;
                    // Skip immediate neighbors — they're held together by sticks
                    if (Math.abs(p1.index - p2.index) % (n - 1) <= 1) continue;

                    const diff = vsub(p2.pos, p1.pos);
                    const dist = vlen(diff);
                    if (dist > 0 && dist < rr) {
                        const ratio = ((rr - dist) / dist / 2) * rs;
                        const offset = vscale(diff, ratio);
                        p1.pos = vsub(p1.pos, offset);
                        p2.pos = vadd(p2.pos, offset);
                    }
                }
            }
        }
    }

    const setup = (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
        initSim(w, h);
    };

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (w === 0 || h === 0) return;
        if (!grid || w !== simW || h !== simH) initSim(w, h);

        const rr = repulsionRadius;
        if (grid.cell !== rr * 2) grid.resize(simW, simH, rr * 2);
        if (paused) return;

        stepSim();

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--color-text")
                .trim() || "#1a1916";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const s of sticks) {
            ctx.moveTo(s.p1.pos.x, s.p1.pos.y);
            ctx.lineTo(s.p2.pos.x, s.p2.pos.y);
        }
        ctx.stroke();
    };
</script>

<div class="hero">
    <div class="inner">
        {#key resetKey}
            <Canvas
                {setup}
                {update}
                label="Differential line growth animation"
            />
        {/key}
    </div>
    <Pane title="Controls" fadeZone={200}>
        <Slider
            bind:value={restLength}
            min={4}
            max={30}
            step={0.5}
            label="Rest length"
        />
        <Slider
            bind:value={repulsionRadius}
            min={10}
            max={60}
            step={1}
            label="Repulsion radius"
        />
        <Slider
            bind:value={repulsionStrength}
            min={0}
            max={2}
            step={0.01}
            label="Repulsion strength"
        />
        <Slider
            bind:value={bendStiffness}
            min={0}
            max={0.1}
            step={0.0001}
            label="Bend stiffness"
        />
        <Button onclick={() => (paused = !paused)} label={paused ? "Play" : "Pause"} />
        <Button onclick={() => resetKey++} label="Reset" />
    </Pane>
</div>

<style>
    .hero {
        width: 100vw;
        height: 100svh;
        display: flex;
        margin-block-end: 7rem;

        > .inner {
            flex: 1;
            min-height: 0;
        }
    }
</style>
