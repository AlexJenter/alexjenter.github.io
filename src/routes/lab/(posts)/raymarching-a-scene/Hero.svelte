<script lang="ts">
    import { prefersReducedMotion } from "svelte/motion";
    import { theme, cssRGB } from "$lib/theme.svelte";
    import { Drawer, Slider, Checkbox, Button } from "$lib/components/gui";
    import FullscreenShader, {
        type ShaderApi,
    } from "$lib/components/FullscreenShader.svelte";

    import FRAG from "./raymarch.frag.glsl?raw";

    const MAX_STEPS = 128; // keep in sync with the shader's loop bound

    let blend = $state(0.01);
    let round = $state(0.01);
    let outline = $state(6);
    let steps = $state(MAX_STEPS);
    let debug = $state(false);
    // Unset until the reader picks; until then, reduced motion means still.
    let moving = $state<boolean>();
    const animate = $derived(moving ?? !prefersReducedMotion.current);

    let yaw = $state(0.6);
    let pitch = $state(0.45);

    let shader = $state<ShaderApi>();
    const label = "A raymarched rounded box and sphere on a floor";

    // The theme's ink/paper as [r,g,b] 0..1 for the shader.
    const unit = (rgb: number[]) => rgb.map((c) => c / 255);
    let colors = $state<{ ink: number[]; paper: number[] }>({
        ink: [0, 0, 0],
        paper: [1, 1, 1],
    });
    // Re-read when the *resolved* theme flips (manual toggle, not just the OS).
    $effect(() => {
        theme.resolved; // track
        colors = {
            ink: unit(cssRGB("--color-text", "#1a1916")),
            paper: unit(cssRGB("--color-bg", "#f5f4f0")),
        };
    });

    const uniforms = $derived({
        uYaw: yaw,
        uPitch: pitch,
        uBlend: blend,
        uRound: round,
        uOutline: outline,
        uSteps: steps,
        uDebug: debug,
        uInk: colors.ink,
        uPaper: colors.paper,
    });

    // --- drag to orbit -------------------------------------------------------
    // Mouse/pen only; touch is left free to scroll the page. The accessible
    // equivalent is the drawer (no orbit there: the scene is decorative).
    let dragging = $state(false);
    let lastX = 0;
    let lastY = 0;
    const RAD_PER_PX = 0.008;

    function onDown(e: PointerEvent) {
        if (e.pointerType === "touch") return;
        e.preventDefault();
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
        if (!dragging) return;
        yaw -= (e.clientX - lastX) * RAD_PER_PX;
        pitch = Math.min(
            1.3,
            Math.max(0.05, pitch + (e.clientY - lastY) * RAD_PER_PX),
        );
        lastX = e.clientX;
        lastY = e.clientY;
    }
    function onUp(e: PointerEvent) {
        if (!dragging) return;
        dragging = false;
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="hero-stage"
    class:dragging
    onpointerdown={onDown}
    onpointermove={onMove}
    onpointerup={onUp}
    onpointercancel={onUp}
>
    <FullscreenShader
        frag={FRAG}
        {uniforms}
        {label}
        {animate}
        maxPixelRatio={1.5}
        bind:api={shader}
    />
</div>

<Drawer title="Scene" grid={true}>
    <div class="area-A">
        <Slider
            bind:value={blend}
            min={0.001}
            max={1.2}
            step={0.001}
            label="Blend"
        />
        <Slider
            bind:value={round}
            min={0}
            max={0.05}
            step={0.001}
            label="Round"
        />
        <Slider
            bind:value={outline}
            min={0}
            max={6}
            step={0.1}
            label="Outline"
        />
        <Slider
            bind:value={steps}
            min={1}
            max={MAX_STEPS}
            step={1}
            label="Max steps"
        />
    </div>
    <div class="area-B">
        <Checkbox bind:value={debug} label="Show steps" />
        <Checkbox
            bind:value={() => animate, (v) => (moving = v)}
            label="Animate"
        />
        <Button
            label="Export PNG"
            onclick={() => shader?.download("raymarch.png")}
        />
    </div>
</Drawer>

<style>
    .hero-stage {
        cursor: grab;
    }
    .hero-stage.dragging {
        cursor: grabbing;
        user-select: none;
    }
</style>
