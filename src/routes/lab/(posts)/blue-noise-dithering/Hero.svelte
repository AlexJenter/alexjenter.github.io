<script lang="ts">
    import { theme, cssRGB } from "$lib/theme.svelte";
    import {
        Drawer,
        Slider,
        FileInput,
        Checkbox,
        Button,
    } from "$lib/components/gui";
    import FullscreenShader, {
        type ShaderApi,
    } from "$lib/components/FullscreenShader.svelte";

    // import imgSrc from "./test.jpg";
    import imgSrc from "./daan-verhoost-Ut8-FW6_KIM-unsplash.jpg";
    import noiseSrc from "./blue-noise-rgba.png";
    import FRAG from "./dither.frag.glsl?raw";

    // --- controls -----------------------------------------------------------
    const SCALE_MIN = 0.1;
    const SCALE_MAX = 42;

    let ditherScale = $state(7.99);
    let invert = $state(false);
    let uploadedImage = $state<string | undefined>(undefined);

    let shader = $state<ShaderApi>();

    const label = "Blue-noise dithered photograph";

    // The theme's ink/paper as [r,g,b] 0..1 for the shader.
    const unit = (rgb: number[]) => rgb.map((c) => c / 255);
    function readThemeColors() {
        return {
            ink: unit(cssRGB("--color-text", "#1a1916")),
            paper: unit(cssRGB("--color-bg", "#f5f4f0")),
        };
    }

    let colors = $state<{ ink: number[]; paper: number[] }>({
        ink: [0, 0, 0],
        paper: [1, 1, 1],
    });
    // Re-read when the *resolved* theme flips (manual toggle, not just the OS).
    $effect(() => {
        theme.resolved; // track
        colors = readThemeColors();
    });

    const uniforms = $derived({
        uDitherScale: ditherScale,
        uInvert: invert,
        uInk: colors.ink,
        uPaper: colors.paper,
    });
    const textures = $derived({
        uImage: { src: uploadedImage ?? imgSrc, wrap: "clamp" as const },
        uNoise: { src: noiseSrc, wrap: "repeat" as const },
    });

    // --- drag-to-scale (grab the noise) -------------------------------------
    // Press on the hero and drag: density scales as startRadius / radius about
    // the hero's centre (the grain's pivot) — moving toward the centre
    // densifies the grain (half the distance ⇒ double density), moving out
    // coarsens it. Mouse/pen only; touch is left free to scroll the page.
    let heroEl: HTMLElement;
    let dragging = $state(false);
    let startRadius = 0;
    let startScale = 0;

    function radiusFromCentre(e: PointerEvent): number {
        // the hero's rect, not the window: it scrolls with the page
        const r = heroEl.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return Math.max(Math.hypot(e.clientX - cx, e.clientY - cy), 1); // avoid /0
    }

    function onScaleDown(e: PointerEvent) {
        if (e.pointerType === "touch") return; // leave touch for scrolling
        e.preventDefault();
        startRadius = radiusFromCentre(e);
        startScale = ditherScale;
        dragging = true;
        heroEl.setPointerCapture(e.pointerId);
    }

    function onScaleMove(e: PointerEvent) {
        if (!dragging) return;
        // density ∝ 1/radius, continuous from the grab point
        ditherScale = Math.min(
            SCALE_MAX,
            Math.max(
                SCALE_MIN,
                (startScale * startRadius) / radiusFromCentre(e),
            ),
        );
    }

    function onScaleUp(e: PointerEvent) {
        if (!dragging) return;
        dragging = false;
        heroEl.releasePointerCapture?.(e.pointerId);
    }
</script>

<!-- Pointer-only scale affordance; the accessible equivalent is the labelled
     "Noise scale" Slider in the drawer (keyboard + ARIA). -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={heroEl}
    class="hero-stage"
    class:dragging
    onpointerdown={onScaleDown}
    onpointermove={onScaleMove}
    onpointerup={onScaleUp}
    onpointercancel={onScaleUp}
>
    <FullscreenShader
        frag={FRAG}
        {uniforms}
        {textures}
        {label}
        bind:api={shader}
    />
</div>

<Drawer title="Dither" grid={true}>
    <div class="area-A">
        <Slider
            bind:value={ditherScale}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.01}
            label="Noise scale"
        />
        <Checkbox bind:value={invert} label="Invert" />

        <Button
            label="Export PNG"
            onclick={() => shader?.download("dither.png", { from: "uImage" })}
        />
    </div>
    <div class="area-B">
        <FileInput bind:value={uploadedImage} label="Image" />
    </div>
</Drawer>

<!-- positioning/background come from the global .hero-stage -->
<style>
    /* grab-the-noise affordance */
    .hero-stage {
        cursor: grab;
    }
    .hero-stage.dragging {
        cursor: grabbing;
        user-select: none;
    }
</style>
