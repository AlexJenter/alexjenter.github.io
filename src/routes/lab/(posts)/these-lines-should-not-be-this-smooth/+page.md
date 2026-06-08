---
status: draft
title: These lines should not be this smooth
date: "2026-06-08"
description: Nervous System's Coral Cup looks like reaction-diffusion, but something is different. The stripes are too parallel, too coherent. Here's what's actually going on.
tags: simulation, generative
---

<script>
import Diagram from './Diagram.svelte';
</script>

Nervous System's [Coral Cup](https://n-e-r-v-o-u-s.com/projects/albums/coralcup/) is described as reaction-diffusion. It probably is. But something looks off — in a good way. The ridges are too smooth, too locally parallel. They meander like brain coral but stay remarkably coherent. Standard reaction-diffusion doesn't do that.

## What standard RD actually produces

In a typical Gray-Scott simulation, each chemical species diffuses with a scalar coefficient — spreading equally in all directions. The Turing instability that creates stripes is orientation-agnostic: it picks a spatial frequency but has no preference for direction. Whatever noise was there at initialization sets the local angle, and globally the result is a chaotic, swirling texture.

That's the "reaction-diffusion aesthetic" — isotropic, undirected, legitimately random-looking. It matches animal skins well precisely because real biological patterns are also somewhat chaotic. But it doesn't produce the Coral Cup.

## The modification: diffusion tensors

Replace the scalar diffusion coefficient `D` with a **tensor** at each point — a 2×2 matrix with a fast axis and a slow axis. The instability analysis explains what happens:

- Fast diffusion in a direction suppresses concentration gradients there (the inhibitor outpaces the activator and quenches any growing mode).
- Slow diffusion allows instability to grow.
- Stripes form **perpendicular to the fast axis**.

One substitution — scalar to tensor — gives you a direct, predictable handle on local stripe orientation.

If the tensor is uniform across the whole domain you get globally parallel stripes, which is boring. The interesting case is a *spatially varying* tensor field: a smooth "comb" or flow field over the surface. At each point the tensor is oriented to steer stripes in the locally desired direction. The simulation self-organizes around that field — still emergent, still a simulation, but directed.

This is what produces the "locally parallel, globally meandering" quality: coherence at the scale of a few stripes, variety at the scale of the whole object.

<Diagram />

## The surface itself does some of the work

The Coral Cup also runs the simulation on the 3D surface rather than a flat grid. This matters independently of the diffusion tensor: the surface Laplacian encodes curvature, and curvature biases stripe orientation. On a curved surface, the Turing instability grows fastest along the direction of highest curvature — because that's where the surface metric offers the most spatial frequency.

A 2024 paper in Phys. Rev. E ([*How the zebra got its stripes*](https://arxiv.org/abs/2312.00637)) shows that coupling diffusion rates to local principal curvature is enough to produce correctly-oriented stripes on complex 3D animal models without any manually designed field. On a cup, the direction of highest curvature runs circumferentially — around the rim — which is exactly why the ridges read as brain coral gyri rather than random streaks.

## Two mechanisms, one result

The Coral Cup most likely uses both at once:

**Curvature steering** — the 3D surface geometry passively pulls stripes into the circumferential direction for free.

**Anisotropic diffusion tensor field** — a designed orientation field actively steers the pattern where curvature alone isn't decisive, and gives control over density, scale, and how tightly stripes stay parallel.

Nervous System's own description says the simulation can vary "reaction rates, scale, and *the direction of diffusion through space*" per point. That last phrase is the tensor.

## This is also how it works in nature

This isn't a technique invented for design — it's the leading explanation for why some animals have parallel stripes at all. Fish with coherent lateral stripes are thought to have scale microstructure that makes diffusion anisotropic along the body axis, biasing the Turing pattern. [Shoji et al. (2002)](https://www.sciencedirect.com/science/article/abs/pii/S0022519301924804) formalized this and showed a sharp transition between parallel and perpendicular stripe regimes as anisotropy varies.

Nervous System is running the same physics deliberately, with spatial control, as a design tool. The smooth lines aren't a tuning accident. They're a fundamentally different mode of the simulation.

---

*References: [Nervous System blog](https://n-e-r-v-o-u-s.com/blog/?p=8222) · [How the zebra got its stripes, Phys. Rev. E 2024](https://arxiv.org/abs/2312.00637) · [Shoji et al. 2002, J. Theor. Biol.](https://www.sciencedirect.com/science/article/abs/pii/S0022519301924804) · [Orientation of Turing-like Patterns, PMC 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4707970/)*
