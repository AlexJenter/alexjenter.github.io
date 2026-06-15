<script lang="ts">
    import { onMount } from 'svelte';

    let canvasEl: HTMLCanvasElement;

    type Vec2 = { x: number; y: number };
    const vadd   = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
    const vsub   = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
    const vmul   = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
    const vnorm  = (a: Vec2): Vec2 => { const l = Math.hypot(a.x, a.y); return l ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 }; };
    const vpolar = (angle: number, r: number): Vec2 => ({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });

    onMount(() => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        const diagonal = Math.hypot(W, H);
        const mainDropSize = Math.min(W, H) * 0.2;

        const ctx = canvasEl.getContext('2d')!;
        canvasEl.width = W * dpr;
        canvasEl.height = H * dpr;
        ctx.scale(dpr, dpr);

        let sceneState = false;
        let mousePos: Vec2 = { x: W * 0.5, y: H * 0.5 };

        function randomSize() {
            return (Math.random() * mainDropSize + mainDropSize) * 0.2;
        }

        class Drop {
            pos: Vec2;
            vel: Vec2 = { x: 0, y: 0 };
            acc: Vec2 = { x: 0, y: 0 };
            rad: number;
            handleScaleFactor = 0.13;
            handle_len_rate: number;
            attraction = 0.06;
            friction = -0.02;
            age = 0;
            fixed = true;

            constructor(pos: Vec2, rad: number) {
                this.pos = { ...pos };
                this.rad = rad;
                this.handle_len_rate = rad * this.handleScaleFactor;
            }

            setSize(newSize: number) {
                const scale = newSize / (this.rad * 2);
                this.rad *= scale;
                this.handle_len_rate = this.rad * this.handleScaleFactor;
                return this;
            }

            grow(rate: number) {
                return this.setSize(this.rad * 2 * rate);
            }

            animateIn(targetRad: number) {
                this.acc = { x: 0, y: 0 };
                if (this.rad < targetRad) {
                    this.grow(1.1);
                } else {
                    this.fixed = false;
                }
            }

            place(vec: Vec2) {
                this.pos.x = vec.x;
                this.pos.y = vec.y;
            }

            follow(vec: Vec2) {
                const delta   = vmul(vnorm(vsub(vec, this.pos)), this.attraction);
                const friction = vmul(vnorm(this.vel), this.friction);
                this.acc = vadd(delta, friction);
                return this;
            }

            teleport() {
                this.pos = { x: Math.random() * W, y: Math.random() * H };
                this.vel = { x: 0, y: 0 };
                this.age = 0;
                this.setSize(1);
                this.fixed = true;
            }

            update() {
                if (this.fixed) this.animateIn(randomSize());
                this.vel.x += this.acc.x;
                this.vel.y += this.acc.y;
                this.pos.x += this.vel.x;
                this.pos.y += this.vel.y;
                this.age++;
            }
        }

        function metaball(b1: Drop, b2: Drop, v: number, maxDistance: number) {
            const r1 = b1.rad, r2 = b2.rad;
            if (r1 === 0 || r2 === 0) return;

            const dx = b2.pos.x - b1.pos.x;
            const dy = b2.pos.y - b1.pos.y;
            const d = Math.hypot(dx, dy);
            if (d > maxDistance || d <= Math.abs(r1 - r2)) return;

            const pi2 = Math.PI / 2;
            let u1 = 0, u2 = 0;
            if (d < r1 + r2) {
                u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
                u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
            }

            const a1  = Math.atan2(dy, dx);
            const a2  = Math.acos((r1 - r2) / d);
            const a1a = a1 + u1 + (a2 - u1) * v;
            const a1b = a1 - u1 - (a2 - u1) * v;
            const a2a = a1 + Math.PI - u2 - (Math.PI - u2 - a2) * v;
            const a2b = a1 - Math.PI + u2 + (Math.PI - u2 - a2) * v;

            const p1a = vadd(b1.pos, vpolar(a1a, r1));
            const p1b = vadd(b1.pos, vpolar(a1b, r1));
            const p2a = vadd(b2.pos, vpolar(a2a, r2));
            const p2b = vadd(b2.pos, vpolar(a2b, r2));

            const totalR = r1 + r2;
            let d2 = Math.min(v * b2.handle_len_rate, Math.hypot(p1a.x - p2a.x, p1a.y - p2a.y) / totalR);
            d2 *= Math.min(1, d * 2 / totalR);
            const h1 = r1 * d2, h2 = r2 * d2;

            const c1out = vadd(p1a, vpolar(a1a - pi2, h1));
            const c2ain = vadd(p2a, vpolar(a2a + pi2, h2));
            const c2out = vadd(p2b, vpolar(a2b - pi2, h2));
            const c1bin = vadd(p1b, vpolar(a1b + pi2, h1));

            ctx.beginPath();
            ctx.moveTo(p1a.x, p1a.y);
            ctx.bezierCurveTo(c1out.x, c1out.y, c2ain.x, c2ain.y, p2a.x, p2a.y);
            ctx.lineTo(p2b.x, p2b.y);
            ctx.bezierCurveTo(c2out.x, c2out.y, c1bin.x, c1bin.y, p1b.x, p1b.y);
            ctx.closePath();
            ctx.fill();
        }

        const mainDrop = new Drop({ x: W * 0.5, y: H * 0.5 }, mainDropSize);
        mainDrop.fixed = false;
        const drops: Drop[] = [mainDrop];

        for (let i = 0; i < 5; i++) {
            drops.push(new Drop({ x: Math.random() * W, y: Math.random() * H }, randomSize()));
        }

        const onMouseMove = (e: MouseEvent) => { mousePos = { x: e.clientX, y: e.clientY }; };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const t = e.touches[0];
            mousePos = { x: t.clientX, y: t.clientY };
        };

        canvasEl.addEventListener('mousemove', onMouseMove);
        canvasEl.addEventListener('touchmove', onTouchMove, { passive: false });

        let rafId: number;

        const frame = () => {
            ctx.fillStyle = sceneState ? 'white' : 'black';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = sceneState ? 'black' : 'white';

            mainDrop.place(mousePos);
            mainDrop.update();

            if (mainDrop.rad > diagonal / 2) {
                mainDrop.setSize(mainDropSize * 2);
                sceneState = !sceneState;
            }

            for (let i = 1; i < drops.length; i++) {
                drops[i].follow(mainDrop.pos).update();
                const dist = Math.hypot(mainDrop.pos.x - drops[i].pos.x, mainDrop.pos.y - drops[i].pos.y);
                if (dist + drops[i].rad < mainDrop.rad) {
                    drops[i].teleport();
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
                    metaball(mainDrop, drops[i], 0.5, drops[i].rad * 3 + mainDrop.rad);
                }
            }

            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafId);
            canvasEl.removeEventListener('mousemove', onMouseMove);
            canvasEl.removeEventListener('touchmove', onTouchMove);
        };
    });
</script>

<canvas bind:this={canvasEl} class="canvas"></canvas>

<style>
    .canvas {
        display: block;
        width: 100vw;
        height: 100svh;
        background: black;
        cursor: none;
    }
</style>
