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

        // Example: animated circle
        const cx = w / 2 + Math.cos(t) * w * 0.2;
        const cy = h / 2 + Math.sin(t) * h * 0.2;
        const r = Math.min(w, h) * 0.08;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-accent-warm")
            .trim();
        ctx.fill();
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
