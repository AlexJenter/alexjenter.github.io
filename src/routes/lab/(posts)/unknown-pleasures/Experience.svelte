<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { cssVar, theme } from "$lib/theme.svelte";
    import data from "./cp1919.json" with { type: "json" };

    const update = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const dpr = window.devicePixelRatio || 1;
        const px = (n: number) => n * dpr;

        ctx.lineWidth = px(1);
        ctx.strokeStyle = cssVar("--color-text", "#A9AFBC");

        const vw = 0.01 * w;
        const scale = 0.3 * vw;
        const marginTop = 10 * vw;
        const marginBottom = 1 * vw;
        const yIncrement = (h - marginBottom - marginTop) / data.pulses.length;
        const nPulses = data.pulses.length;
        const n = data.pulses[0].length;

        const pts = data.pulses.toReversed();

        let history: number[] = [];

        pts.forEach((pulse, pulseIndex) => {
            const pulseY = (nPulses - pulseIndex) * yIncrement + marginTop;
            ctx.beginPath();
            ctx.moveTo(0, pulseY);
            // history[0] = pulseY;

            pulse.forEach((y, i) => {
                const x = ((i + 1) / n) * w;
                const currentY = -1 * y * scale + pulseY;
                const maxY =
                    pulseIndex > 0 ? Math.min(currentY, history[i]) : currentY;

                ctx.lineTo(x, maxY);
                history[i] = maxY;
            });

            ctx.stroke();
        });
        return false;
    };
</script>

<div class="experience">
    {#key theme.resolved}
        <Canvas {update} />
    {/key}
</div>

<style>
    .experience {
        width: 100%;
        /*height: 800px;*/
        aspect-ratio: 1;
    }
</style>
