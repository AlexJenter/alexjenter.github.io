---
status: public
title: Blue Noise Dithering
short: Blue Noise
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

Photo by <a href="https://unsplash.com/@daanverhoost?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Daan Verhoost</a> on <a href="https://unsplash.com/photos/a-single-pineapple-against-a-dark-background-Ut8-FW6_KIM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>  
Cover image cropped from <a href="https://unsplash.com/@lee_jay_dee?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Lesley Davidson</a> on <a href="https://unsplash.com/photos/closeup-photography-of-lime-FYMY-DJPLGo?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
