<script module lang="ts">
    // A full-viewport fragment-shader surface. You provide a fragment shader,
    // a bag of uniforms, and named textures; the component owns the WebGL
    // context, a full-screen triangle, resize/DPR, and an on-demand render loop.
    //
    // The render core is decoupled from the display canvas, so the same program
    // can be rendered off-screen at an arbitrary size — that's what powers
    // `export`/`toBlob`: render the full image at its native resolution into a
    // framebuffer and read it back, independent of the viewport.
    //
    // Conventions the component fills in automatically (only if the shader
    // declares them):
    //   uniform vec2 uResolution;   // size of the current render target, px
    //   uniform vec2 <name>Res;     // native size of texture <name>, px
    //                               //   e.g. sampler `uImage` -> `uImageRes`

    export type TexSpec = {
        src: string;
        wrap?: "repeat" | "clamp";
        filter?: "linear" | "nearest";
    };

    export type UniformValue = number | boolean | number[];

    export interface ExportOpts {
        /** Output width in px. Defaults to the `from` texture's native width. */
        width?: number;
        /** Output height in px. Defaults to the `from` texture's native height. */
        height?: number;
        /** Which texture's native size to use as the default output size. */
        from?: string;
        /** MIME type, e.g. "image/png" (default) or "image/jpeg". */
        type?: string;
        /** Quality 0..1 for lossy types. */
        quality?: number;
    }

    export interface ShaderApi {
        /** Render off-screen at full resolution and resolve a PNG (or `type`) Blob. */
        toBlob(opts?: ExportOpts): Promise<Blob>;
        /** `toBlob` + trigger a browser download. */
        download(filename: string, opts?: ExportOpts): Promise<void>;
        /** Native [w, h] of a loaded texture, or null if unknown. */
        size(name: string): [number, number] | null;
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        frag: string;
        uniforms?: Record<string, UniformValue>;
        textures?: Record<string, string | TexSpec>;
        label?: string;
        /** Cap devicePixelRatio for the live canvas (perf). Default 2. */
        maxPixelRatio?: number;
        /** Imperative handle (export etc.). */
        api?: ShaderApi;
    }

    let {
        frag,
        uniforms = {},
        textures = {},
        label,
        maxPixelRatio = 2,
        api = $bindable(),
    }: Props = $props();

    let canvasEl: HTMLCanvasElement;
    let core = $state<ShaderCore | null>(null);

    // Push uniforms + reload textures whenever the parent's props change. Both
    // guard on `core`, and re-run once it exists (it's $state).
    $effect(() => {
        if (!core) return;
        core.setUniforms(uniforms);
        core.requestRender();
    });
    $effect(() => {
        core?.syncTextures(textures);
    });

    onMount(() => {
        const c = createCore(canvasEl, frag);
        api = {
            toBlob: (o) => c.toBlob(o ?? {}),
            download: (f, o) => c.download(f, o ?? {}),
            size: (n) => c.textureSize(n),
        };
        core = c;
        return () => c.destroy();
    });

    // --- WebGL core ----------------------------------------------------------
    const VERT = `
        attribute vec2 aPos;
        void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
    `;

    interface TexRecord {
        tex: WebGLTexture;
        unit: number;
        w: number;
        h: number;
        src: string | null;
    }

    interface ShaderCore {
        setUniforms(u: Record<string, UniformValue>): void;
        syncTextures(t: Record<string, string | TexSpec>): void;
        requestRender(): void;
        textureSize(name: string): [number, number] | null;
        toBlob(opts: ExportOpts): Promise<Blob>;
        download(filename: string, opts: ExportOpts): Promise<void>;
        destroy(): void;
    }

    function createCore(canvas: HTMLCanvasElement, frag: string): ShaderCore {
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
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
        gl.useProgram(prog);

        // Full-screen triangle.
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW,
        );
        const aPos = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        // Uniform location cache (null = not present / optimised out).
        const locs = new Map<string, WebGLUniformLocation | null>();
        const loc = (name: string) => {
            if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name));
            return locs.get(name)!;
        };
        const setUniform = (name: string, v: UniformValue) => {
            const l = loc(name);
            if (l === null) return;
            if (typeof v === "boolean") gl.uniform1f(l, v ? 1 : 0);
            else if (typeof v === "number") gl.uniform1f(l, v);
            else if (v.length === 2) gl.uniform2fv(l, v);
            else if (v.length === 3) gl.uniform3fv(l, v);
            else if (v.length === 4) gl.uniform4fv(l, v);
            else if (v.length === 1) gl.uniform1fv(l, v);
        };

        let currentUniforms: Record<string, UniformValue> = {};
        const recs = new Map<string, TexRecord>();
        let ready = false;

        const wrapEnum = (w?: string) =>
            w === "repeat" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        const filterEnum = (f?: string) =>
            f === "nearest" ? gl.NEAREST : gl.LINEAR;

        function loadImage(src: string): Promise<HTMLImageElement> {
            return new Promise((res, rej) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => res(img);
                img.onerror = rej;
                img.src = src;
            });
        }

        async function loadTexture(name: string, spec: TexSpec) {
            let rec = recs.get(name);
            if (!rec) {
                const unit = recs.size;
                rec = { tex: gl.createTexture()!, unit, w: 0, h: 0, src: null };
                recs.set(name, rec);
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, rec.tex);
                // Samplers are int uniforms — must use uniform1i, not the generic
                // float path — or the unit assignment is silently dropped.
                const sl = loc(name);
                if (sl !== null) gl.uniform1i(sl, unit);
            }
            const img = await loadImage(spec.src);
            gl.activeTexture(gl.TEXTURE0 + rec.unit);
            gl.bindTexture(gl.TEXTURE_2D, rec.tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapEnum(spec.wrap));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapEnum(spec.wrap));
            const f = filterEnum(spec.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
            rec.w = img.naturalWidth;
            rec.h = img.naturalHeight;
            rec.src = spec.src;
            setUniform(`${name}Res`, [rec.w, rec.h]); // companion size uniform
        }

        function syncTextures(t: Record<string, string | TexSpec>) {
            const specs = Object.entries(t).map(
                ([name, v]) =>
                    [name, typeof v === "string" ? { src: v } : v] as const,
            );
            const changed = specs.filter(([name, spec]) => {
                const rec = recs.get(name);
                return !rec || rec.src !== spec.src;
            });
            if (changed.length === 0) return;
            Promise.all(changed.map(([name, spec]) => loadTexture(name, spec)))
                .then(() => {
                    if (recs.size >= specs.length) ready = true;
                    requestRender();
                })
                .catch((e) => console.error("[FullscreenShader] texture load", e));
        }

        function render(
            target: WebGLFramebuffer | null,
            w: number,
            h: number,
        ) {
            gl.useProgram(prog);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target);
            gl.viewport(0, 0, w, h);
            setUniform("uResolution", [w, h]);
            for (const [k, v] of Object.entries(currentUniforms)) setUniform(k, v);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // Coalesced on-demand render to the visible canvas.
        let raf = 0;
        function requestRender() {
            if (raf || !ready) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                if (ready) render(null, canvas.width, canvas.height);
            });
        }

        const ro = new ResizeObserver(([entry]) => {
            const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
            const { width, height } = entry.contentRect;
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            requestRender();
        });
        ro.observe(canvas.parentElement!);

        function textureSize(name: string): [number, number] | null {
            const r = recs.get(name);
            return r && r.w ? [r.w, r.h] : null;
        }

        async function toBlob(opts: ExportOpts): Promise<Blob> {
            if (!ready) throw new Error("FullscreenShader: textures not loaded");
            const from = opts.from ?? recs.keys().next().value;
            const base = (from ? textureSize(from) : null) ?? [
                canvas.width,
                canvas.height,
            ];
            let w = Math.round(opts.width ?? base[0]);
            let h = Math.round(opts.height ?? base[1]);

            // Clamp to the GPU's max renderable size.
            const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
            const k = Math.min(1, max / Math.max(w, h));
            if (k < 1) {
                w = Math.floor(w * k);
                h = Math.floor(h * k);
                console.warn(
                    `[FullscreenShader] export clamped to ${w}x${h} (MAX_TEXTURE_SIZE ${max})`,
                );
            }

            // Off-screen colour target on a spare texture unit.
            const unit = recs.size;
            gl.activeTexture(gl.TEXTURE0 + unit);
            const ctex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, ctex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                ctex,
                0,
            );
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
                throw new Error("FullscreenShader: framebuffer incomplete");

            render(fbo, w, h);

            const buf = new Uint8Array(w * h * 4);
            gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(fbo);
            gl.deleteTexture(ctex);
            requestRender(); // restore the visible frame

            // Flip rows (GL is bottom-up) into a 2D canvas.
            const out = document.createElement("canvas");
            out.width = w;
            out.height = h;
            const ctx = out.getContext("2d")!;
            const imageData = ctx.createImageData(w, h);
            const row = w * 4;
            for (let y = 0; y < h; y++) {
                const s = (h - 1 - y) * row;
                imageData.data.set(buf.subarray(s, s + row), y * row);
            }
            ctx.putImageData(imageData, 0, 0);

            return new Promise((res, rej) =>
                out.toBlob(
                    (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
                    opts.type ?? "image/png",
                    opts.quality,
                ),
            );
        }

        async function download(filename: string, opts: ExportOpts) {
            const blob = await toBlob(opts);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        return {
            setUniforms(u) {
                currentUniforms = u;
            },
            syncTextures,
            requestRender,
            textureSize,
            toBlob,
            download,
            destroy() {
                cancelAnimationFrame(raf);
                ro.disconnect();
                for (const r of recs.values()) gl.deleteTexture(r.tex);
                gl.getExtension("WEBGL_lose_context")?.loseContext();
            },
        };
    }
</script>

<canvas
    bind:this={canvasEl}
    class="fs-canvas"
    role={label ? "img" : undefined}
    aria-label={label}
></canvas>

<style>
    .fs-canvas {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
