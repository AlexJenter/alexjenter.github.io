<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { Drawer, Button } from "$lib/components/gui";
    import { Drop, metaball, type MetaballCurve } from "./metaballs.ts";

    let paused = $state(false);

    // Sim state lives at module scope so setup/update share it. All
    // coordinates are in device pixels (Canvas hands us the raw backing
    // store); pointer input is converted on the way in.
    let drops: Drop[] = [];
    let mainDrop: Drop;
    let mainDropSize = 0;
    let diagonal = 0;
    let sceneState = false;
    let mouse = { x: 0, y: 0 };

    const randomSize = () => (Math.random() * mainDropSize + mainDropSize) * 0.2;

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

    function drawCurve(ctx: CanvasRenderingContext2D, m: MetaballCurve) {
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
        ctx.fill();
    }

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        if (!mainDrop) return; // Canvas starts the loop before setup has run
        if (paused) return;

        // Re-read each frame so the manual theme toggle applies immediately.
        const styles = getComputedStyle(document.documentElement);
        const bg = styles.getPropertyValue("--color-bg").trim();
        const fg = styles.getPropertyValue("--color-text").trim();

        ctx.fillStyle = sceneState ? fg : bg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = sceneState ? bg : fg;

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

        for (const drop of drops) {
            ctx.beginPath();
            ctx.arc(drop.pos.x, drop.pos.y, drop.rad, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 1; i < drops.length; i++) {
            if (!drops[i].fixed) {
                const curve = metaball(
                    mainDrop,
                    drops[i],
                    0.5,
                    drops[i].rad * 3 + mainDrop.rad,
                );
                if (curve) drawCurve(ctx, curve);
            }
        }
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

<Drawer title="Metaballs">
    <Button
        onclick={() => (paused = !paused)}
        label={paused ? "Play" : "Pause"}
    />
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
