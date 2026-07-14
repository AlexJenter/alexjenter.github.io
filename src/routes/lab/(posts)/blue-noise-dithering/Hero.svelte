<script lang="ts">
    import { onMount } from "svelte";
    import { theme } from "$lib/theme.svelte";
    import { Pane, Slider, FileInput, Checkbox } from "$lib/components/gui";

    import imgSrc from "./test.jpg";
    import noiseSrc from "./blue-noise-rgba.png";

    // --- controls -----------------------------------------------------------
    let ditherScale = $state(111); // the shader's original `scale` constant
    let invert = $state(false);
    let uploadedImage = $state<string | undefined>(undefined);

    let canvasEl: HTMLCanvasElement;
    const label =
        "Blue-noise dithered photograph; move the pointer left and right to change the dither scale";

    // Handle to the imperative WebGL layer, exposed so runes-land effects can
    // push control/theme changes into it. $state so effects re-run once it exists.
    let gpu = $state<GLController | null>(null);

    // Parse any CSS color string into linear-ish [r,g,b] 0..1 via a 1px canvas,
    // so we don't care whether tokens are hex / rgb / oklch.
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

    // Push reactive state into the GL layer whenever either side changes.
    $effect(() => gpu?.setDither(ditherScale));
    $effect(() => gpu?.setInvert(invert));
    $effect(() => {
        if (uploadedImage) gpu?.setImage(uploadedImage);
    });
    // Re-read colors when the *resolved* theme flips (covers the manual toggle,
    // not just the OS — see theme.svelte.ts).
    $effect(() => {
        theme.resolved; // track
        gpu?.setColors(readThemeColors());
    });

    onMount(() => {
        gpu = createGL(canvasEl);
        gpu.setColors(readThemeColors());
        gpu.load(imgSrc, noiseSrc);
        return () => gpu?.destroy();
    });

    // --- WebGL ---------------------------------------------------------------
    interface GLController {
        load(image: string, noise: string): void;
        setImage(src: string): void;
        setDither(v: number): void;
        setInvert(v: boolean): void;
        setColors(c: { ink: number[]; paper: number[] }): void;
        destroy(): void;
    }

    const VERT = `
        attribute vec2 aPos;
        void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
    `;

    const FRAG = `
        precision highp float;

        uniform vec2  uResolution;
        uniform vec2  uImageRes;
        uniform float uMouseX;      // pointer x, 0..1
        uniform float uDitherScale; // the original 'scale' constant
        uniform vec3  uInk;
        uniform vec3  uPaper;
        uniform sampler2D uImage;
        uniform sampler2D uNoise;

        float lum(vec4 c) { return 0.21 * c.r + 0.71 * c.g + 0.07 * c.b; }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution;

            // Aspect-correct 'cover' fit (the TODO): scale the image so it fills
            // the viewport with no distortion, cropping the overflowing axis.
            float rs = uResolution.x / uResolution.y;
            float ri = uImageRes.x / uImageRes.y;
            vec2 cover = rs < ri ? vec2(uImageRes.x * uResolution.y / uImageRes.y, uResolution.y)
                                 : vec2(uResolution.x, uImageRes.y * uResolution.x / uImageRes.x);
            vec2 imgUv = uv * uResolution / cover + (cover - uResolution) * 0.5 / cover;
            vec4 image = texture2D(uImage, imgUv);

            // Isotropic centered coords for the noise (square tiles regardless of
            // viewport aspect); pointer x zooms the dither, exactly as before.
            vec2 nuv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
            vec4 noise = texture2D(uNoise, nuv * uMouseX * uDitherScale);

            float on = step(lum(noise), lum(image)); // 1 where image beats threshold
            gl_FragColor = vec4(mix(uInk, uPaper, on), 1.0);
        }
    `;

    function createGL(canvas: HTMLCanvasElement): GLController {
        const gl = canvas.getContext("webgl", {
            antialias: false,
            premultipliedAlpha: false,
        })!;

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!;
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(sh) ?? "shader error");
            return sh;
        };

        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        // Full-screen triangle.
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const u = {
            resolution: gl.getUniformLocation(prog, "uResolution"),
            imageRes: gl.getUniformLocation(prog, "uImageRes"),
            mouseX: gl.getUniformLocation(prog, "uMouseX"),
            ditherScale: gl.getUniformLocation(prog, "uDitherScale"),
            ink: gl.getUniformLocation(prog, "uInk"),
            paper: gl.getUniformLocation(prog, "uPaper"),
            image: gl.getUniformLocation(prog, "uImage"),
            noise: gl.getUniformLocation(prog, "uNoise"),
        };
        gl.uniform1i(u.image, 0);
        gl.uniform1i(u.noise, 1);

        // Local state mirrored into uniforms on each draw.
        let imageRes: [number, number] = [1, 1];
        let mouseX = 0.5; // start with a visible dither, not the degenerate 0
        let dither = 1.2;
        let inverted = false;
        let ink: number[] = [0, 0, 0];
        let paper: number[] = [1, 1, 1];
        let ready = false;

        const makeTex = (unit: number) => {
            const t = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, t);
            return t;
        };
        const imageTex = makeTex(0);
        const noiseTex = makeTex(1);

        function uploadTexture(
            unit: number,
            img: HTMLImageElement,
            wrap: number,
        ) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, unit === 0 ? imageTex : noiseTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        function loadImage(src: string): Promise<HTMLImageElement> {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }

        // Coalesce redraws into one rAF.
        let raf = 0;
        function scheduleDraw() {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                draw();
            });
        }

        function draw() {
            if (!ready) return;
            gl.uniform2f(u.resolution, canvas.width, canvas.height);
            gl.uniform2f(u.imageRes, imageRes[0], imageRes[1]);
            gl.uniform1f(u.mouseX, mouseX);
            gl.uniform1f(u.ditherScale, dither);
            const [a, b] = inverted ? [paper, ink] : [ink, paper];
            gl.uniform3fv(u.ink, a);
            gl.uniform3fv(u.paper, b);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // Size the drawing buffer to the parent in device pixels.
        const ro = new ResizeObserver(([entry]) => {
            const dpr = window.devicePixelRatio || 1;
            const { width, height } = entry.contentRect;
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            scheduleDraw();
        });
        ro.observe(canvas.parentElement!);

        // const onPointer = (clientX: number) => {
        //     const r = canvas.getBoundingClientRect();
        //     mouseX = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        //     scheduleDraw();
        // };
        // const onMouseMove = (e: MouseEvent) => onPointer(e.clientX);
        // const onTouchMove = (e: TouchEvent) => {
        //     e.preventDefault();
        //     onPointer(e.touches[0].clientX);
        // };
        // canvas.addEventListener("mousemove", onMouseMove);
        // canvas.addEventListener("touchmove", onTouchMove, { passive: false });

        return {
            async load(image, noise) {
                const [img, noiseImg] = await Promise.all([
                    loadImage(image),
                    loadImage(noise),
                ]);
                imageRes = [img.naturalWidth, img.naturalHeight];
                uploadTexture(0, img, gl.CLAMP_TO_EDGE); // photo: no tiling
                uploadTexture(1, noiseImg, gl.REPEAT); // blue noise: tiles (POT)
                ready = true;
                scheduleDraw();
            },
            async setImage(src) {
                const img = await loadImage(src);
                imageRes = [img.naturalWidth, img.naturalHeight];
                uploadTexture(0, img, gl.CLAMP_TO_EDGE);
                scheduleDraw();
            },
            setDither(v) {
                dither = v;
                scheduleDraw();
            },
            setInvert(v) {
                inverted = v;
                scheduleDraw();
            },
            setColors(c) {
                ink = c.ink;
                paper = c.paper;
                scheduleDraw();
            },
            destroy() {
                cancelAnimationFrame(raf);
                ro.disconnect();
                // canvas.removeEventListener("mousemove", onMouseMove);
                // canvas.removeEventListener("touchmove", onTouchMove);
                const ext = gl.getExtension("WEBGL_lose_context");
                ext?.loseContext();
            },
        };
    }
</script>

<div class="hero">
    <canvas
        bind:this={canvasEl}
        class="canvas"
        role={label ? "img" : undefined}
        aria-label={label}
    ></canvas>
    <Pane title="Dither" fadeZone={200}>
        <Slider
            bind:value={ditherScale}
            min={0.1}
            max={221}
            step={0.01}
            label="Noise scale"
        />
        <Checkbox bind:value={invert} label="Invert" />
        <FileInput bind:value={uploadedImage} label="Image" />
    </Pane>
</div>

<style>
    .hero {
        width: 100vw;
        height: 100svh;
        margin-block-end: 7rem;
    }

    .canvas {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--color-bg);
        cursor: ew-resize;
    }
</style>
