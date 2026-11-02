<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { cssVar, theme } from "$lib/theme.svelte";
    import data from "./cp1919.json" with { type: "json" };

    let t = 0;

    const update = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        dt: number,
    ) => {
        const dpr = window.devicePixelRatio || 1;
        const px = (n: number) => n * dpr;
        t += dt;

        ctx.lineWidth = px(1);
        ctx.strokeStyle = cssVar("--color-accent-warm", "#ab4f1d");

        // console.log(t);

        const vw = 0.01 * w;
        const scale = 0.3 * vw;
        const marginTop = 12 * vw;
        const yIncrement = 21;
        const nPulses = 20;
        const n = data.pulses[0].length;

        const pts = data.pulses.toReversed();
        const maxLength = 13;
        const interval = 888;
        pts.length = maxLength;

        let history: number[] = [];

        pts.forEach((pulse, pulseIndex) => {
            const pulseY = (maxLength - pulseIndex) * yIncrement + marginTop;
            ctx.beginPath();
            ctx.moveTo(0, pulseY);
            // history[0] = pulseY;

            pulse.forEach((y, i) => {
                const x = ((i + 1) / n) * w;
                const currentY = -1 * y * scale + pulseY;
                const maxY =
                    pulseIndex > 0 ? Math.min(currentY, history[i]) : currentY;

                if (pulseIndex > t / interval) {
                    ctx.strokeStyle = "transparent";
                } else if (pulseIndex + 1 > t / interval) {
                    ctx.strokeStyle = cssVar("--color-text", "#A9AFBC");
                }

                ctx.lineTo(x, maxY);
                history[i] = maxY;
            });

            ctx.stroke();
        });

        if (t / interval > maxLength) {
            t = 0;
            ctx.clearRect(0, 0, w, h);
        }
        // return false;
    };
</script>

<div class="experience">
    {#key theme.resolved}
        <Canvas {update} />
    {/key}
</div>

<style>
    .experience {
        margin: var(--space-prose-block);
        width: 100%;
        /*height: 800px;*/
        aspect-ratio: 3/1;
        /*outline: 1px dashed white;*/
    }
</style>
