# Nervous System Coral Cup — Technique Analysis

The Coral Cup surface looks smoother and more locally parallel than typical reaction-diffusion results. The answer is that it *is* reaction-diffusion, but with anisotropic diffusion tensors — a single modification that completely changes the character of the output.

---

## Standard Reaction-Diffusion and Why It Looks Chaotic

In a standard Gray-Scott or Turing RD simulation, each chemical species diffuses with a scalar coefficient — spreading equally in all directions. The pattern that emerges is genuinely orientation-agnostic: stripes form at the right spatial frequency, but their direction at any given point is essentially random, set by whatever noise happened to be there at initialization. Globally, the pattern reads as chaotic texture.

This is the "reaction diffusion aesthetic" you'd expect — isotropic, swirling, undirected.

---

## The Modification: Anisotropic Diffusion Tensors

Replace the scalar diffusion coefficient `D` with a **symmetric positive-definite tensor** — a 2×2 (or 3×3) matrix — at each point in space. The tensor has two eigenaxes with different eigenvalues: a fast direction and a slow direction.

The orientation rule follows directly from the Turing instability analysis:

- Fast diffusion in a direction suppresses concentration gradients in that direction (the inhibitor outpaces the activator, quenching any growing mode).
- Slow diffusion in a direction allows instability to grow.
- Therefore: **stripes form perpendicular to the fast-diffusion axis.**

This gives you a direct, predictable handle on local stripe orientation.

---

## Making It Spatially Varying

If the tensor is uniform across the whole domain, you get globally parallel stripes — boring, over-controlled. The interesting regime is when the tensor field varies smoothly across space.

Design a vector field — essentially a "flow" or "comb" field — over the surface. At each point, construct the diffusion tensor so its fast axis is perpendicular to the locally desired stripe direction. Feed this field of tensors into the RD simulation. The system self-organizes to produce stripes that follow the designed orientation, while still being an emergent simulation rather than a directly drawn pattern.

This is the mechanism behind the "locally parallel but globally meandering" look: coherence at small scales (controlled by the tensor field), variety at large scales (allowed to meander as long as the field itself meanders).

---

## 3D Surface Geometry as a Free Orientation Guide

The Coral Cup runs the simulation on the 3D cup surface itself, not on a flat grid. This matters separately from the diffusion tensor: the surface Laplacian encodes curvature, and curvature passively biases stripe orientation.

On a curved surface, Turing instability grows fastest in the direction of **highest curvature** — because that's the direction with the largest available spatial frequency in the surface metric. A 2024 paper in Phys. Rev. E (*How the zebra got its stripes*) formalizes this: coupling diffusion rates to local principal curvature produces globally correct stripe orientation on complex 3D animal models without any manually designed field.

On a cup shape, the direction of highest curvature is circumferential (around the rim), which naturally pushes stripes into the parallel, gyrus-like ridges that read as brain coral.

---

## Both Mechanisms Together

The Coral Cup likely runs both:

1. **Curvature steering** — the 3D surface geometry passively pulls stripes into the circumferential direction for free.
2. **Anisotropic diffusion tensor field** — a designed orientation field actively steers the pattern in regions where curvature alone isn't decisive, and controls scale, density, and how aggressively stripes stay parallel.

Nervous System explicitly notes that their simulation can vary "reaction rates, scale, and the direction of diffusion through space" per point. That last phrase is the anisotropic tensor.

---

## Biological Precedent

This isn't an invention for design purposes — it's how the biology actually works. Fish with parallel stripes (rather than chaotic patterns) are thought to have scale microstructure that makes diffusion anisotropic along the body axis, which aligns the Turing pattern. Shoji et al. (2002) formalized this and showed the sharp transition between parallel-stripe and perpendicular-stripe regimes as anisotropy magnitude varies.

Nervous System is applying the same physics deliberately and with spatial control, turning a biological hypothesis into a design tool.

---

## Summary

| Property | Standard RD | Anisotropic RD on 3D Surface |
|---|---|---|
| Diffusion coefficient | scalar | tensor (per point) |
| Stripe orientation | random / chaotic | follows designed vector field |
| Local coherence | low | high |
| Global variety | high | tunable |
| 3D geometry effect | none (flat grid) | curvature passively steers stripes |
| Designer control | feed/kill params only | full orientation field + surface shape |

The smooth, locally parallel quality of the Coral Cup isn't an accident of parameter tuning — it's a fundamentally different mode of the simulation.

---

## References

- [Nervous System — Coral Cup blog post](https://n-e-r-v-o-u-s.com/blog/?p=8222)
- [How the zebra got its stripes: Curvature-dependent diffusion orients Turing patterns on 3D surfaces](https://arxiv.org/abs/2312.00637) — Phys. Rev. E, 2024
- [Directionality of Stripes Formed by Anisotropic Reaction–Diffusion Models](https://www.sciencedirect.com/science/article/abs/pii/S0022519301924804) — Shoji et al., J. Theor. Biol., 2002
- [Orientation of Turing-like Patterns by Morphogen Gradients and Tissue Anisotropies](https://pmc.ncbi.nlm.nih.gov/articles/PMC4707970/) — PMC, 2015
- [Modification of Turing patterns through the use of time-varying anisotropic diffusion](https://royalsocietypublishing.org/rspa/article/479/2278/20230487/87655/Modification-of-Turing-patterns-through-the-use-of) — Proc. Royal Society A, 2023
