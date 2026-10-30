<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";

    let t = 0;

    const update = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        dt: number,
    ) => {
        t += dt * 0.001;

        ctx.clearRect(0, 0, w, h);

        const nY = 10;
        const nX = 250;
        const dpr = window.devicePixelRatio || 1;
        const px = (n: number) => n * dpr;

        ctx.lineWidth = px(1);
        ctx.strokeStyle = "#ffffff";

        const pts = Array.from({ length: nY }, (_, iY) => {
            const y = (h / nY) * (iY + 1);
            const amp = 50;

            const off = 456.67 * Math.sin(y + 456.67) + Math.cos(y * 123.45);

            return Array.from({ length: nX }, (_, iX) => {
                const x = (w / nX) * iX;
                return { x, y: y + amp * Math.cos(0.1 * iX + off) };
            });
        });

        pts.forEach((row, rowIndex) => {
            ctx.moveTo(row[0].x, row[0].y);
            // const rowPrime = row.map(({ x: pX, y: pY }, pIndex) => {
            //     let maxY = pY;
            //     if (pts[rowIndex + 1])
            //         maxY = Math.max(pY, pts[rowIndex + 1][pIndex].y);
            //     return { x: pX, y: maxY };
            // });
            row.forEach(({ x, y }, iY) => ctx.lineTo(x, y));
            ctx.stroke();
        });
    };
</script>

<div class="experience">
    <Canvas {update} />
</div>

<style>
    .experience {
        width: 100%;
        height: 100%;
    }
</style>
