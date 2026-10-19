---
status: draft
title: Raymarching a Scene
short: Raymarching
date: "2026-10-19"
description: "A whole 3D scene from one function: how far is the nearest surface?"
---

There's no geometry in the hero above. No triangles, no meshes. The fragment shader knows one thing about the scene: given a point in space, how far away is the nearest surface?

```glsl
float map(vec3 p) {
    float floorD = p.y;
    float box    = sdRoundBox(p - vec3(0.0, 0.6, 0.0), vec3(0.5), 0.08);
    float ball   = sdSphere(p - ballPosition, 0.45);
    return min(floorD, smin(box, ball, uBlend));
}
```

That's a signed distance field. `min` is a union, `smin` is a union with the seam rounded off. Drag the blend slider and watch the box and the ball melt together.

## Sphere tracing

Every pixel shoots a ray. To find where it lands, ask `map` how far the nearest surface is, and move that far along the ray. You can't overshoot, because nothing is closer than that. Repeat until the distance is almost zero (a hit) or the ray has gone too far (a miss).

```glsl
for (int i = 0; i < MAX_STEPS; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0008 * t) { hit = true; break; }
    t += d;
    if (t > MAX_DIST) break;
}
```

Rays that run parallel to a surface take many small steps. Turn on _Show steps_ in the drawer for a heat map of how many each pixel needed, then lower _Max steps_ to see what happens when the budget runs out: the silhouettes fray first.

## Light

The normal is the gradient of the field, found by sampling `map` a hair to each side of the hit point. Shadows are a second march toward the light. The closest the ray comes to a surface along the way becomes the penumbra, which is why they're soft for free. Ambient occlusion is five samples along the normal: if the field is smaller than the distance you travelled, something is in the way.

The shading is mapped onto the theme's ink and paper by luminance, so the scene reads in either theme.

Drag the hero to orbit. Export saves the current frame as a PNG.
