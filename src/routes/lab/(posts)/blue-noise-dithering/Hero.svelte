<script lang="ts">
    import { theme } from "$lib/theme.svelte";
    import { Drawer, Slider, FileInput, Checkbox, Button } from "$lib/components/gui";
    import FullscreenShader, {
        type ShaderApi,
    } from "$lib/components/FullscreenShader.svelte";

    import imgSrc from "./test.jpg";
    import noiseSrc from "./blue-noise-rgba.png";
    import FRAG from "./dither.frag.glsl?raw";

    // --- controls -----------------------------------------------------------
    let ditherScale = $state(8);
    let invert = $state(false);
    let uploadedImage = $state<string | undefined>(undefined);

    let shader = $state<ShaderApi>();

    const label = "Blue-noise dithered photograph";

    // Read the theme's ink/paper as [r,g,b] 0..1 via a 1px canvas (format-agnostic).
    function parseColor(css: string): [number, number, number] {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const cx = c.getContext("2d")!;
        cx.fillStyle = css;
        cx.fillRect(0, 0, 1, 1);
        const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
        return [r / 255, g / 255, b / 255];
    }
    function readThemeColors() {
        const s = getComputedStyle(document.documentElement);
        return {
            ink: parseColor(s.getPropertyValue("--color-text").trim() || "#1a1916"),
            paper: parseColor(s.getPropertyValue("--color-bg").trim() || "#f5f4f0"),
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

</script>

<div class="hero-backdrop">
    <FullscreenShader frag={FRAG} {uniforms} {textures} {label} bind:api={shader} />
</div>
<div class="hero-spacer" aria-hidden="true"></div>

<Drawer title="Dither">
    <Slider
        bind:value={ditherScale}
        min={0.1}
        max={20}
        step={0.01}
        label="Noise scale"
    />
    <Checkbox bind:value={invert} label="Invert" />
    <FileInput bind:value={uploadedImage} label="Image" />
    <Button
        label="Export PNG"
        onclick={() => shader?.download("dither.png", { from: "uImage" })}
    />
</Drawer>

<!-- positioning/background come from the global .hero-backdrop + .hero-spacer -->
