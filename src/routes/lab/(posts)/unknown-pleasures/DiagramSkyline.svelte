<script lang="ts">
    import Canvas from "$lib/components/Canvas.svelte";
    import { cssVar, theme } from "$lib/theme.svelte";
    import data from "./cp1919.json" with { type: "json" };

    const maxLength = 13;
    let t = $state(0);
    let tSec = $derived(0.001 * t);
    let step = $derived(Math.floor(tSec) % maxLength);
    let frac = $derived(tSec - Math.floor(tSec));

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
        const scale = 0.4 * vw;
        const marginTop = 12 * vw;
        const yIncrement = 21;
        const n = data.pulses[0].length;

        ctx.clearRect(0, 0, w, h);

        const pulses = data.pulses.toReversed();
        pulses.length = maxLength;

        let history: number[] = [];

        let active: Path2D | undefined;
        pulses.forEach((pulse, pulseIndex) => {
            const pulseY = (maxLength - pulseIndex) * yIncrement + marginTop;
            const path = new Path2D();
            path.moveTo(0, pulseY);

            pulse.forEach((y, i) => {
                const x = ((i + 1) / n) * w;
                const currentY = -1 * y * scale + pulseY;
                const maxY =
                    pulseIndex > 0 ? Math.min(currentY, history[i]) : currentY;

                path.lineTo(x, maxY);
                history[i] = maxY;
            });
            if (pulseIndex === step) active = path;

            ctx.strokeStyle =
                pulseIndex < step
                    ? cssVar("--color-accent-warm", "#ab4f1d")
                    : cssVar("--color-text-dim", "#8a877f");
            ctx.stroke(path);
            ctx.stroke();

            ctx.stroke();
        });

        if (active) {
            ctx.strokeStyle = cssVar("--color-text", "#1a1916");
            ctx.stroke(active);
        }

        if (step > maxLength) {
            t = 0;
        }
    };
</script>

<div class="experience">
    <div class="readout">
        <output>#{String(step).padStart(3, "0")}</output>
    </div>
    {#key theme.resolved}
        <Canvas {update} />
    {/key}
</div>

<style scoped>
    .experience {
        margin: var(--space-prose-block);
        width: 100%;
        aspect-ratio: 3/1;
        position: relative;
        /*outline: 1px dashed white;*/
    }
    .readout {
        font-family: var(--font-mono);
        position: absolute;
        inset: 0;
    }
</style>
