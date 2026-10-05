---
status: public
title: Blue Noise Dithering
date: "2026-07-14"
description: "TIL: a one-bit dither is one comparison per pixel. Inspired by Acerola."
cover: ./cover.png
---

<script>
import AlgoDiagram from './AlgoDiagram.svelte'
</script>

TIL from [«Acerola»](https://www.youtube.com/@Acerola_t)'s [«Making an Inktober Shader»](https://www.youtube.com/watch?v=E9-LRRDVmo8): a one-bit dither is a single comparison. If a pixel is brighter than the noise at the same spot, it's on. Otherwise it's off.

<AlgoDiagram/>

In my [Shadertoy](https://www.shadertoy.com/view/XlG3DW) that's one line (`lum` is luminance):

```glsl
fragColor = lum(image) > lum(noise) ? vec4(1.0) : vec4(0.0);
```

The noise makes neighbouring pixels flip at slightly different brightnesses, so the eye reads the density of "on" pixels as tone.

Which noise matters. White noise clumps into maze-like patterns. Blue noise ([CC0 tiles by Christoph Peters](http://momentsingraphics.de/BlueNoise.html)) keeps its energy in the high frequencies, so the dots spread out evenly.

The hero at the top runs the same shader with blue noise. Change the noise scale, invert ink and paper, drop in your own image, or export a PNG at the image's full resolution.

<!-- TODO: cover.svg, a proper opening image, swap the Unsplash placeholder photo for the real one. -->
