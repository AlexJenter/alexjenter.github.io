<script lang="ts">
    import { theme } from "$lib/theme.svelte";
    import { Drawer, Slider, FileInput, Checkbox, Button } from "$lib/components/gui";
    import FullscreenShader, {
        type ShaderApi,
    } from "$lib/components/FullscreenShader.svelte";

    import imgSrc from "./test.jpg";
    import noiseSrc from "./blue-noise-rgba.png";

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

    // Threshold a photo against 4-channel blue noise -> one bit per pixel.
    // Aspect-correct 'cover' fit; tone mapped onto the theme's ink/paper by
    // luminance (so it reads naturally in either theme), Invert = negative.
    const FRAG = `
        precision highp float;

        uniform vec2  uResolution;
        uniform vec2  uImageRes;
        uniform float uDitherScale;
        uniform float uInvert;      // 0 or 1
        uniform vec3  uInk;
        uniform vec3  uPaper;
        uniform sampler2D uImage;
        uniform sampler2D uNoise;

        float lum(vec3 c) { return 0.21 * c.r + 0.71 * c.g + 0.07 * c.b; }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution;

            float rs = uResolution.x / uResolution.y;
            float ri = uImageRes.x / uImageRes.y;
            vec2 cover = rs < ri
                ? vec2(uImageRes.x * uResolution.y / uImageRes.y, uResolution.y)
                : vec2(uResolution.x, uImageRes.y * uResolution.x / uImageRes.x);
            vec2 imgUv = uv * uResolution / cover + (cover - uResolution) * 0.5 / cover;
            vec3 image = texture2D(uImage, imgUv).rgb;

            // Tile the noise in *image* space (not output space) so the grain
            // is locked to the photo — identical in the live preview and the
            // full-resolution export, whatever the viewport size/aspect. Scale
            // x by the image aspect so the tiles stay square, and offset by the
            // image centre so the grain scales about the middle, not a corner.
            vec2 nuv = vec2(imgUv.x * uImageRes.x / uImageRes.y, imgUv.y);
            vec2 nc  = vec2(0.5 * uImageRes.x / uImageRes.y, 0.5);
            vec3 noise = texture2D(uNoise, (nuv - nc) * uDitherScale).rgb;

            float on = step(lum(noise), lum(image)); // 1 where image beats threshold

            vec3 lighter = lum(uPaper) >= lum(uInk) ? uPaper : uInk;
            vec3 darker  = lum(uPaper) >= lum(uInk) ? uInk : uPaper;
            vec3 bright = mix(lighter, darker, uInvert);
            vec3 dark   = mix(darker, lighter, uInvert);
            gl_FragColor = vec4(mix(dark, bright, on), 1.0);
        }
    `;
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
