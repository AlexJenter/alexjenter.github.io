<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import data from "./cp1919.json";

    let t = 0;

    const setup = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        // dt: number,
    ) => {
        // t += dt * 0.001;
        ctx.clearRect(0, 0, w, h);

        const dpr = window.devicePixelRatio || 1;
        const px = (n: number) => n * dpr;

        ctx.lineWidth = px(1);
        ctx.strokeStyle = "#ffffff";

        const margin = 20;
        const scale = 2;

        data.pulses.forEach((pulse, pulseIndex) => {
            const n = pulse.length;
            const yBase =
                (pulseIndex * (h - 2 * margin * scale)) / data.pulses.length +
                margin * scale;
            ctx.moveTo(0, yBase);

            pulse.forEach((y, i) => {
                const x = (i / n) * w;
                const absY = -1 * y * scale + yBase;
                ctx.lineTo(x, absY);
            });

            ctx.stroke();
        });
    };
</script>

<div class="experience">
    <Canvas {setup} />
</div>

<style>
    .experience {
        width: 100%;
        /*height: 800px;*/
        aspect-ratio: 1;
    }
</style>
