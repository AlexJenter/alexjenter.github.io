---
status: draft
title: Apollonian gasket
date: "2026-05-04"
cover: ./cover.svg
description: The construction of the Apollonian gasket starts with three circles
---

<script>
  import Diagram from './Diagram.svelte';
</script>

Start with three mutually tangent circles. In every gap between them, pack the largest circle that fits. Then repeat — forever. The result is an Apollonian gasket: a fractal built entirely from circles, where every circle is tangent to its neighbours and no space is wasted.

## Descartes' theorem

The key to constructing the gasket is a 400-year-old formula. Given four mutually tangent circles with curvatures $k_1, k_2, k_3, k_4$ (curvature being the reciprocal of radius), Descartes' Circle Theorem states:

$$
(k_1 + k_2 + k_3 + k_4)^2 = 2(k_1^2 + k_2^2 + k_3^2 + k_4^2)
$$

This means that if you know three tangent circles, you can solve for the curvature of the fourth exactly — no approximation needed. The gasket is exact all the way down.

## Construction

1. Place three mutually tangent circles.
2. Use Descartes' theorem to find the curvature of the circle fitting in the central gap.
3. For each new gap formed, find its tangent circle.
4. Recurse.

<Diagram />

## Integer gaskets

A surprising property: if the four initial circles all have integer curvatures, then every circle generated in the gasket also has an integer curvature. The simplest example starts with curvatures $-1, 2, 2, 3$ — the $-1$ representing the outer bounding circle (negative curvature by convention). From these four integers, an infinite family of integers unfolds.

## In the limit

The gasket is a fractal with Hausdorff dimension approximately $1.305$. The circles become arbitrarily small but never fill the plane — the leftover set (the gaps that never get filled) has area zero but is uncountably infinite.
