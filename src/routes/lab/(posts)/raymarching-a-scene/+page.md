---
status: draft
title: Raymarching a Scene
short: Raymarching
date: "2026-10-19"
description: "An outline for a sphere-traced scene, with no edge detection: only the near misses of each ray."
---

<script>
import OutlineDiagram from './OutlineDiagram.svelte'
</script>

The hero is a lattice of bars and cubes, drawn in one fragment shader and shaded like an Escher lithograph. The lines between near and far bars are not an edge filter. They come out of the march itself.

A sphere-traced ray asks the scene how far the nearest surface is, and steps that far. If the ray passes close to a surface and misses it, the distance dips and grows again. That dip is a near miss. A ray that ends on a surface also gets close at the end, but the distance never grows again, so it never counts.

<OutlineDiagram/>

Divide the distance by how far along the ray you are, and you have an angle. One pixel is the same angle at any depth, so a line of `uOutline` pixels has the same weight on a near bar and on a far one:

```glsl
if (d > ph && d <= 2.0 * ph) {
    float y = d * d / (2.0 * ph);   // iq's closest approach between two samples
    float z = sqrt(max(d * d - y * y, 0.0));
    float angle = z / max(t - y, 0.001);
    missAngle = min(missAngle, angle);
}
```

A pixel is outline when `missAngle` is under the line width in pixels, and the near miss sits clearly in front of where the ray ended. That second test keeps the line off faces that the ray only grazes. A `smoothstep` instead of an `if` gives about one pixel of anti-aliasing, and the line is drawn over the fog.
