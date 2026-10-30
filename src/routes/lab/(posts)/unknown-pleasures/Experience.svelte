<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import data from "./cp1919.json" with { type: "json" };

    const setup = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const dpr = window.devicePixelRatio || 1;
        const px = (n: number) => n * dpr;

        ctx.lineWidth = px(2);
        ctx.strokeStyle = "#ffffff";

        const scale = 4;
        const marginTop = 30 * scale;
        const marginBottom = 2 * scale;

        data.pulses.forEach((pulse, pulseIndex, pulsesArray) => {
            const n = pulse.length;
            const yBase =
                (pulseIndex * (h - marginBottom - marginTop)) /
                    data.pulses.length +
                marginTop;

            ctx.beginPath();
            ctx.moveTo(0, yBase);
            pulse.forEach((y, i) => {
                const x = ((i + 1) / n) * w;
                const absY = -1 * y * scale + yBase;
                ctx.lineTo(x, absY);
            });
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
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
