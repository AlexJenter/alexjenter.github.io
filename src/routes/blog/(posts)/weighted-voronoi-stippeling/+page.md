---
status: draft
title: Weighted Voronoi Stippling
date: "2026-05-04"
cover: ./cover.svg
description: The traditional artistic technique of stippling places small dots of ink onto paper such that their density gives the impression of tone.
---

<script>
import DiagramVoronoi from "./Diagram-Voronoi.svelte";
import DiagramWeightedCentroid from "./Diagram-WeightedCentroid.svelte";
</script>

After watching Dan Shiffman's YouTube video on the topic, I had to try it for myself.


## Lloyd's Relaxations

The algorithm builds on Lloyd's Relaxation, which uses properties of Voronoi diagrams in a clever way.
The goal of Lloyd's Relaxation is to spread a point set so that all points even out their distance to their direct neighbours.
Each iteration goes something like this:

1. Generate N random points
2. Calculate the Voronoi diagram of those points
3. Find the centroid of each cell (d3's `polygonCentroid` works well here)
4. Move each point to its cell's centroid

Maybe just me, but I find it highly satisfying when it converges.

<DiagramVoronoi/>

## Weighted Relaxations

Just one change to the loop above: instead of moving each point to the geometric centroid of its cell, move it to the *weighted* centroid — pulled toward the darker pixels so dots cluster where the image is darkest.

For each pixel (or subsample):

1. Find its containing cell
2. Add its brightness weight to that cell's running total
3. Move the point to the weighted centroid

Think of it as every pixel pulling the point toward itself with a force proportional to its weight — the weighted centroid is just where those forces reach equilibrium.

<DiagramWeightedCentroid/>



## Links

- [Coding Challenge 181: Weighted Voronoi Stippling](https://www.youtube.com/watch?v=Bxdt6T_1qgc)
- <https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf>
