<script lang="ts">
    import { onMount } from "svelte";
    import { Drop, metaball, type MetaballCurve } from "./metaballs.ts";

    let canvasEl: HTMLCanvasElement;

    onMount(() => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        const diagonal = Math.hypot(W, H);
        const mainDropSize = Math.min(W, H) * 0.2;

        const ctx = canvasEl.getContext("2d")!;
        canvasEl.width = W * dpr;
        canvasEl.height = H * dpr;
        ctx.scale(dpr, dpr);

        const root = document.documentElement;
        const readColors = () => ({
            bg: getComputedStyle(root).getPropertyValue("--color-bg").trim(),
            fg: getComputedStyle(root).getPropertyValue("--color-text").trim(),
        });
        let colors = readColors();
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onSchemeChange = () => (colors = readColors());
        mq.addEventListener("change", onSchemeChange);

        let sceneState = false;
        let mousePos = { x: W * 0.5, y: H * 0.5 };

        const randomSize = () =>
            (Math.random() * mainDropSize + mainDropSize) * 0.2;

        const mainDrop = new Drop({ x: W * 0.5, y: H * 0.5 }, mainDropSize);
        mainDrop.fixed = false;
        const drops: Drop[] = [mainDrop];
        for (let i = 0; i < 5; i++) {
            drops.push(
                new Drop(
                    { x: Math.random() * W, y: Math.random() * H },
                    randomSize(),
                ),
            );
        }

        function drawCurve(m: MetaballCurve) {
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

        const onMouseMove = (e: MouseEvent) => {
            mousePos = { x: e.clientX, y: e.clientY };
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const t = e.touches[0];
            mousePos = { x: t.clientX, y: t.clientY };
        };
        canvasEl.addEventListener("mousemove", onMouseMove);
        canvasEl.addEventListener("touchmove", onTouchMove, { passive: false });

        let rafId: number;
        const frame = () => {
            ctx.fillStyle = sceneState ? colors.fg : colors.bg;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = sceneState ? colors.bg : colors.fg;

            mainDrop.place(mousePos);
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
                    drops[i].teleport(W, H);
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
                    if (curve) drawCurve(curve);
                }
            }

            rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafId);
            canvasEl.removeEventListener("mousemove", onMouseMove);
            canvasEl.removeEventListener("touchmove", onTouchMove);
            mq.removeEventListener("change", onSchemeChange);
        };
    });
</script>

<canvas bind:this={canvasEl} class="canvas"></canvas>

<style>
    .canvas {
        display: block;
        width: 100vw;
        height: 100svh;
        background: var(--color-bg);
        cursor: none;
    }
</style>
