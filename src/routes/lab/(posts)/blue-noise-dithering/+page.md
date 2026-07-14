---
status: draft
title: Blue Noise Dithering
date: "2026-07-14"
description: A one-bit threshold dither, ported from shadertoy. inspired by Acerola
cover: ./cover.png
---

Some time ago I scribbled a tiny [Shadertoy](https://www.shadertoy.com/view/XlG3DW) that does exactly one thing: it thresholds a photograph against a noise texture and paints a single bit per pixel — ink or paper, nothing in between. Drag left–right and the noise zooms, so the dither slides from a hard, posterised threshold into a fine, grainy stipple.

The whole thing is four lines of logic:

```glsl
float lum(vec4 c) {
    return 0.21 * c.r + 0.71 * c.g + 0.07 * c.b;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec2 m = iMouse.xy / iResolution.xy;
    vec4 image = texture(iChannel1, /* ...aspect-mangled uv... */);
    vec4 noise = texture(iChannel0, uv * m.x * 1.2);

    fragColor = lum(image) > lum(noise) ? vec4(1.0) : vec4(0.0);
}
```

For each pixel: if the image is brighter than the noise sample, the pixel is on. Because the noise is spatially decorrelated, the switch-over happens at slightly different brightnesses for neighbouring pixels, and the eye reads the density of "on" pixels as a continuous tone. Classic ordered dithering, just with a texture doing the ordering.

## The hero

The version at the top of this page is the same shader, cleaned up and dropped into a reusable full-screen WebGL surface. The panel lets you set the noise scale, flip ink/paper, drop in your own image, and export the result as a PNG at the source image's **full resolution** — the export renders off-screen at native size rather than snapshotting the viewport.

Three things changed on the way over:

**The aspect ratio.** The original had a `// TODO: fix aspect ratio` sitting right above it, and a magic `offset = vec2(0.4)` fudge that only looked right at one window size. The port replaces all of that with a proper "cover" fit — the photo scales to fill the viewport with no distortion, cropping whichever axis overflows, the way `background-size: cover` behaves.

**Blue noise.** The threshold texture is now a 4-channel blue-noise tile ([CC0, from Christoph Peters' set](http://momentsingraphics.de/BlueNoise.html)). Blue noise has its energy pushed into the high frequencies, so the "on" pixels spread out evenly instead of clumping — you get that pleasant, even grain rather than the maze-like artefacts of white noise. It tiles seamlessly, which matters once the pointer zooms it around.

**Ink and paper.** Instead of hard black and white, the two output states map to the site's `--color-text` and `--color-bg`, so the hero follows the light/dark theme. Invert swaps them.

> The photo is a placeholder pulled from Unsplash for now — swap in the real one.

<!-- TODO: cover.svg, a proper opening image, tighten the writing. -->
