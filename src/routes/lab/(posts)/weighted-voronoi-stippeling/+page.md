---
status: public
title: Weighted Voronoi Stippling
short: Stippling
date: "2026-05-04"
cover: ./cover.svg
description: The traditional artistic technique of stippling places small dots of ink onto paper such that their density gives the impression of tone.
---

<script>
import DiagramVoronoi from "./Diagram-Voronoi.svelte";
import DiagramWeightedCentroid from "./Diagram-WeightedCentroid.svelte";
</script>

After watching Dan Shiffman's YouTube video [^1] on the paper[^2], I had to try it for myself.

## Lloyd's algorithm

The algorithm builds on Lloyd's algorithm (also called Lloyd relaxation), which uses properties of Voronoi diagrams in a clever way.
Its goal is to spread a point set so that all points even out their distance to their direct neighbours.
It goes something like this:

1. Generate N random points
2. Then, in each iteration:
   1. Calculate the Voronoi diagram of those points
   2. Find the centroid of each cell (d3's `polygonCentroid` works well here)
   3. Move each point to its cell's centroid

Maybe just me, but I find it highly satisfying when it converges.

<DiagramVoronoi/>

## Weighted relaxation

Just one change to the loop above: instead of moving each point to the geometric centroid of its cell, move it to the _weighted_ centroid — pulled toward the darker pixels so dots cluster where the image is darkest.

In each iteration, go over every pixel (or a subsample):

1. Find the cell it belongs to, which is the cell of its nearest point
2. Take its weight (its darkness)
3. Add its position times its weight, and the weight itself, to that cell's running totals

Then for each cell, its position total divided by its weight total is the weighted centroid. Move the cell's point there.

Think of it as every pixel pulling the point toward itself with a force proportional to its weight — the weighted centroid is just where those forces reach equilibrium.

<DiagramWeightedCentroid/>

My implementation is not without its flaws. The effect works best on images with high contrast, large areas of low light and on edges. Areas of uniform value often lack uniform distribution with clusters forming randomly. Tweaking those weights, for example with a brightness curve, would probably help; the controls don't have one yet.

Hero: Based on Photo by <a href="https://unsplash.com/@dawncasey?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Dawn Casey</a> on <a href="https://unsplash.com/photos/a-close-up-of-a-succulent-plant-on-a-black-background-N30PVeoXad8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

[^1]: [Coding Challenge 181: Weighted Voronoi Stippling](https://www.youtube.com/watch?v=Bxdt6T_1qgc)

[^2]: [Stippling by Weighted Centroidal Voronoi Tessellations — Secord 2002 (PDF)](https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf)
