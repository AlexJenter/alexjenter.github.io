<script lang="ts">
    import { onMount } from "svelte";

    let canvasEl: HTMLCanvasElement;

    onMount(() => {
        let destroy: (() => void) | undefined;

        (async () => {
            const paper = (await import("paper")).default;

            const W = window.innerWidth;
            const H = window.innerHeight;
            const diagonal = Math.sqrt(W * W + H * H);
            const center = new paper.Point(W * 0.5, H * 0.5);
            const mainDropSize = Math.min(W, H) * 0.2;

            paper.setup(canvasEl);

            let sceneState = false;
            let mousePos = center.clone();
            class Drop {
                pos: paper.Point;
                vel: paper.Point;
                acc: paper.Point;
                rad: number;
                handleScaleFactor: number;
                handle_len_rate: number;
                attraction: number;
                friction: number;
                age: number;
                fixed: boolean;
                dot: paper.Path;

                constructor(pos: paper.Point, rad: number) {
                    this.pos = pos.clone();
                    this.vel = new paper.Point(0, 0);
                    this.acc = new paper.Point(0, 0);
                    this.rad = rad;
                    this.handleScaleFactor = 0.13;
                    this.handle_len_rate = rad * this.handleScaleFactor;
                    this.attraction = 0.06;
                    this.friction = -0.02;
                    this.age = 0;
                    this.fixed = true;
                    this.dot = new paper.Path.Circle({
                        center: this.pos,
                        radius: rad,
                    });
                    this.dot.fillColor = new paper.Color("white");
                }

                setSize(newSize: number) {
                    const scale = newSize / this.dot.bounds.width;
                    this.dot.scale(scale);
                    this.rad *= scale;
                    return this;
                }

                grow(rate: number) {
                    return this.setSize(this.dot.bounds.width * rate);
                }

                animateIn(targetRad: number) {
                    this.acc.x = 0;
                    this.acc.y = 0;
                    if (this.dot.bounds.width * 0.5 < targetRad) {
                        this.grow(1.1);
                        this.rad = this.dot.bounds.width * 0.5;
                        this.handle_len_rate =
                            this.rad * this.handleScaleFactor;
                    } else {
                        this.fixed = false;
                    }
                }

                place(vec: paper.Point) {
                    this.pos.x = vec.x;
                    this.pos.y = vec.y;
                }

                follow(vec: paper.Point) {
                    const delta = vec
                        .subtract(this.pos)
                        .normalize()
                        .multiply(this.attraction);
                    const friction = this.vel
                        .normalize()
                        .multiply(this.friction);
                    this.acc = delta.add(friction);
                    return this;
                }

                teleport() {
                    this.pos = new paper.Point(
                        Math.random() * W,
                        Math.random() * H,
                    );
                    this.vel = new paper.Point(0, 0);
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
                    this.dot.position = this.pos;
                    this.age++;
                }
            }

            function randomSize() {
                return (Math.random() * mainDropSize + mainDropSize) * 0.2;
            }

            function getVector(radians: number, length: number) {
                return new paper.Point({
                    angle: (radians * 180) / Math.PI,
                    length,
                });
            }

            function metaball(b1: Drop, b2: Drop, v: number, maxDist: number) {
                const r1 = b1.rad,
                    r2 = b2.rad;
                if (r1 === 0 || r2 === 0) return null;
                const d = b1.pos.getDistance(b2.pos);
                if (d > maxDist || d <= Math.abs(r1 - r2)) return null;

                const pi2 = Math.PI / 2;
                let u1 = 0,
                    u2 = 0;
                if (d < r1 + r2) {
                    u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
                    u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
                }

                const a1 = b2.pos.subtract(b1.pos).angle * (Math.PI / 180);
                const a2 = Math.acos((r1 - r2) / d);
                const a1a = a1 + u1 + (a2 - u1) * v;
                const a1b = a1 - u1 - (a2 - u1) * v;
                const a2a = a1 + Math.PI - u2 - (Math.PI - u2 - a2) * v;
                const a2b = a1 - Math.PI + u2 + (Math.PI - u2 - a2) * v;

                const p1a = b1.pos.add(getVector(a1a, r1));
                const p1b = b1.pos.add(getVector(a1b, r1));
                const p2a = b2.pos.add(getVector(a2a, r2));
                const p2b = b2.pos.add(getVector(a2b, r2));

                const totalR = r1 + r2;
                let d2 = Math.min(
                    v * b2.handle_len_rate,
                    p1a.subtract(p2a).length / totalR,
                );
                d2 *= Math.min(1, (d * 2) / totalR);
                const h1 = r1 * d2,
                    h2 = r2 * d2;

                const path = new paper.Path({
                    segments: [p1a, p2a, p2b, p1b],
                    closed: true,
                    fillColor: b1.dot.fillColor!.clone(),
                });
                path.segments[0].handleOut = getVector(a1a - pi2, h1);
                path.segments[1].handleIn = getVector(a2a + pi2, h2);
                path.segments[2].handleOut = getVector(a2b - pi2, h2);
                path.segments[3].handleIn = getVector(a1b + pi2, h1);
                return path;
            }

            function switchColors(state: boolean) {
                const fg = state ? "black" : "white";
                const bg = state ? "white" : "black";
                for (const drop of drops) {
                    drop.dot.fillColor = new paper.Color(fg);
                }
                canvasEl.style.backgroundColor = bg;
            }

            const mainDrop = new Drop(center, mainDropSize);
            mainDrop.fixed = false;
            const drops: Drop[] = [mainDrop];

            for (let i = 0; i < 5; i++) {
                const pos = new paper.Point(
                    Math.random() * W,
                    Math.random() * H,
                );
                drops.push(new Drop(pos, randomSize()));
            }

            const connections = new paper.Group();

            paper.view.onMouseMove = (e: paper.MouseEvent) => {
                mousePos = e.point;
            };

            canvasEl.addEventListener(
                "touchmove",
                (e) => {
                    e.preventDefault();
                    const t = e.touches[0];
                    const rect = canvasEl.getBoundingClientRect();
                    mousePos = new paper.Point(
                        t.clientX - rect.left,
                        t.clientY - rect.top,
                    );
                },
                { passive: false },
            );

            paper.view.onFrame = () => {
                switchColors(sceneState);

                mainDrop.place(mousePos);
                mainDrop.update();

                if (mainDrop.dot.bounds.width * 0.5 > diagonal) {
                    mainDrop.setSize(mainDropSize * 2);
                    sceneState = !sceneState;
                }

                for (let i = 1; i < drops.length; i++) {
                    drops[i].follow(mainDrop.pos).update();
                    const dist = mainDrop.pos.getDistance(drops[i].pos);
                    if (dist + drops[i].rad < mainDrop.rad) {
                        drops[i].teleport();
                        drops[i].fixed = true;
                        mainDrop.grow(1.03);
                    }
                }

                connections.removeChildren();
                for (let i = 1; i < drops.length; i++) {
                    if (!drops[i].fixed) {
                        const path = metaball(
                            mainDrop,
                            drops[i],
                            0.5,
                            drops[i].rad * 3 + mainDrop.rad,
                        );
                        if (path) connections.addChild(path);
                    }
                }
            };

            destroy = () => paper.project.remove();
        })();

        return () => destroy?.();
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
