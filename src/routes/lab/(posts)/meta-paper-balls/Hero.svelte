<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Drawer, Button, Checkbox } from "$lib/components/gui";
    import {
        Drop,
        metaball,
        type MetaballCurve,
        type Vec2,
    } from "./metaballs.ts";

    let paused = $state(false);
    let debug = $state(false);

    // Sim state lives at module scope so setup/update share it. All
    // coordinates are in device pixels (Canvas hands us the raw backing
    // store); pointer input is converted on the way in.
    let drops: Drop[] = [];
    let mainDrop: Drop;
    let mainDropSize = 0;
    let diagonal = 0;
    let sceneState = false;
    let mouse = { x: 0, y: 0 };

    const randomSize = () =>
        (Math.random() * mainDropSize + mainDropSize) * 0.2;

    const setup = (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
        mainDropSize = Math.min(w, h) * 0.2;
        diagonal = Math.hypot(w, h);
        mouse = { x: w * 0.5, y: h * 0.5 };

        mainDrop = new Drop({ x: w * 0.5, y: h * 0.5 }, mainDropSize);
        mainDrop.fixed = false;
        drops = [mainDrop];
        for (let i = 0; i < 5; i++) {
            drops.push(
                new Drop(
                    { x: Math.random() * w, y: Math.random() * h },
                    randomSize(),
                ),
            );
        }
    };

    function traceCurve(ctx: CanvasRenderingContext2D, m: MetaballCurve) {
        ctx.beginPath();
        ctx.moveTo(m.p1a.x, m.p1a.y);
        ctx.bezierCurveTo(
            m.c1out.x,
            m.c1out.y,
            m.c2ain.x,
            m.c2ain.y,
            m.p2a.x,
            m.p2a.y,
        );
        ctx.lineTo(m.p2b.x, m.p2b.y);
        ctx.bezierCurveTo(
            m.c2out.x,
            m.c2out.y,
            m.c1bin.x,
            m.c1bin.y,
            m.p1b.x,
            m.p1b.y,
        );
        ctx.closePath();
    }

    // --- Illustrator-style debug overlay -----------------------------------
    // Deliberately pinned palette: the overlay impersonates Illustrator's
    // selection UI (Layer-1 blue paths, white-filled anchors), so it does NOT
    // follow the site theme — that's the joke, and the blue reads on both the
    // ink and paper scene states.
    const AI_BLUE = "#4f9eff";
    const AI_WHITE = "#ffffff";

    function anchor(
        ctx: CanvasRenderingContext2D,
        p: Vec2,
        size: number,
        solid: boolean,
    ) {
        const half = size / 2;
        if (solid) {
            ctx.fillStyle = AI_BLUE;
            ctx.fillRect(p.x - half, p.y - half, size, size);
        } else {
            ctx.fillStyle = AI_WHITE;
            ctx.fillRect(p.x - half, p.y - half, size, size);
            ctx.strokeRect(p.x - half, p.y - half, size, size);
        }
    }

    function handle(
        ctx: CanvasRenderingContext2D,
        from: Vec2,
        to: Vec2,
        dotRad: number,
    ) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(to.x, to.y, dotRad, 0, Math.PI * 2);
        ctx.fillStyle = AI_BLUE;
        ctx.fill();
    }

    function drawDebug(
        ctx: CanvasRenderingContext2D,
        curves: MetaballCurve[],
        dpr: number,
    ) {
        const px = (n: number) => n * dpr;
        ctx.save();
        ctx.lineWidth = px(1);
        ctx.strokeStyle = AI_BLUE;

        // Each drop: stroked circle, shape center cross, and the four
        // cardinal anchors an Illustrator ellipse carries (hollow =
        // unselected points on a selected path).
        for (const d of drops) {
            const { x, y } = d.pos;
            ctx.beginPath();
            ctx.arc(x, y, d.rad, 0, Math.PI * 2);
            ctx.stroke();

            const arm = px(3);
            ctx.beginPath();
            ctx.moveTo(x - arm, y);
            ctx.lineTo(x + arm, y);
            ctx.moveTo(x, y - arm);
            ctx.lineTo(x, y + arm);
            ctx.stroke();

            anchor(ctx, { x: x + d.rad, y }, px(5), false);
            anchor(ctx, { x: x - d.rad, y }, px(5), false);
            anchor(ctx, { x, y: y + d.rad }, px(5), false);
            anchor(ctx, { x, y: y - d.rad }, px(5), false);
        }

        // The metaball bridges are the interesting geometry, so they get the
        // full "selected point" treatment: stroked path, direction handles
        // with round ends, solid anchor squares.
        for (const m of curves) {
            traceCurve(ctx, m);
            ctx.stroke();

            handle(ctx, m.p1a, m.c1out, px(1.75));
            handle(ctx, m.p2a, m.c2ain, px(1.75));
            handle(ctx, m.p2b, m.c2out, px(1.75));
            handle(ctx, m.p1b, m.c1bin, px(1.75));

            anchor(ctx, m.p1a, px(5), true);
            anchor(ctx, m.p2a, px(5), true);
            anchor(ctx, m.p2b, px(5), true);
            anchor(ctx, m.p1b, px(5), true);
        }

        ctx.restore();
    }

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (!mainDrop) return; // Canvas starts the loop before setup has run

        // Pause freezes the simulation but not the render, so the debug
        // overlay (and a live theme switch) still applies to the held frame.
        if (!paused) {
            mainDrop.place(mouse);
            mainDrop.update(randomSize);

            if (mainDrop.rad > diagonal / 2) {
                mainDrop.setSize(mainDropSize * 2);
                sceneState = !sceneState;
            }

            for (let i = 1; i < drops.length; i++) {
                drops[i].follow(mainDrop.pos).update(randomSize);
                const dist = Math.hypot(
                    mainDrop.pos.x - drops[i].pos.x,
                    mainDrop.pos.y - drops[i].pos.y,
                );
                if (dist + drops[i].rad < mainDrop.rad) {
                    drops[i].teleport(w, h);
                    drops[i].fixed = true;
                    mainDrop.grow(1.03);
                }
            }
        }

        // Re-read each frame so the manual theme toggle applies immediately.
        const styles = getComputedStyle(document.documentElement);
        const bg = styles.getPropertyValue("--color-bg").trim();
        const fg = styles.getPropertyValue("--color-text").trim();

        ctx.fillStyle = sceneState ? fg : bg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = sceneState ? bg : fg;

        for (const drop of drops) {
            ctx.beginPath();
            ctx.arc(drop.pos.x, drop.pos.y, drop.rad, 0, Math.PI * 2);
            ctx.fill();
        }

        const curves: MetaballCurve[] = [];
        for (let i = 1; i < drops.length; i++) {
            if (!drops[i].fixed) {
                const curve = metaball(
                    mainDrop,
                    drops[i],
                    0.5,
                    drops[i].rad * 3 + mainDrop.rad,
                );
                if (curve) curves.push(curve);
            }
        }
        for (const curve of curves) {
            traceCurve(ctx, curve);
            ctx.fill();
        }

        if (debug) drawDebug(ctx, curves, window.devicePixelRatio || 1);
    };

    function onPointerMove(e: PointerEvent) {
        const dpr = window.devicePixelRatio || 1;
        mouse = { x: e.clientX * dpr, y: e.clientY * dpr };
    }
</script>

<!-- Pointer-only attractor affordance; the scene also evolves on its own, and
     the drawer's Pause button is the keyboard-reachable control. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hero hero-backdrop" onpointermove={onPointerMove}>
    <div class="inner">
        <Canvas
            {setup}
            {update}
            label="Meta paper balls — ink blobs that chase the pointer and merge"
        />
    </div>
</div>
<div class="hero-spacer" aria-hidden="true"></div>

<Drawer title="Metaballs" grid={true}>
    <div class="area-A">
        <Button
            onclick={() => (paused = !paused)}
            label={paused ? "Play" : "Pause"}
        />
    </div>
    <div class="area-B">
        <Checkbox bind:value={debug} label="debug" />
    </div>
</Drawer>

<style>
    /* fixed positioning/background come from the global .hero-backdrop */
    .hero {
        display: flex;
        cursor: none; /* the main blob is the cursor */

        > .inner {
            flex: 1;
            min-height: 0;
        }
    }
</style>
