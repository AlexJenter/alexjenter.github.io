---
status: draft
title: Weighted Voronoi Stippling
date: "2026-05-04"
cover: ./cover.svg
description: The traditional artistic technique of stippling places small dots of ink onto paper such that their density gives the impression of tone.
---

<script>
import DiagramVoronoi from "./Diagram-Voronoi.svelte";
</script>

After watching Dan Shiffman's YouTube video on the topic I had to try it out for myself.
Somehow the way he presents a topic really clicks with my thinking.


## Lloyd's Relaxations

The algorithm builds on Lloyd's Relaxation, which uses properties of Voronoi diagrams in a clever way.
The goal of Lloyd's Relaxation is to spread a point set so that all points even out their distance to their direct neighbours.
Each iteration goes something like this:

1. Generate N random points
2. Calculate the Voronoi Diagram of your points
3. Find the centroid of each cell
4. Move the corresponding point to that centroid

Maybe just me, but I find it highly satisfying when it converges.

<DiagramVoronoi/>


### Finding the Centroids

Dan Shiffman uses the centroid algorithm described [here](https://paulbourke.net/geometry/polygonmesh/#:~:text=Centroid,-The) by Paul Bourke, but I found that d3 also provides a polygonCentroid function.

## Weighted Relaxations

This is the main difference to Lloyd's Relaxation and basically the last step.

Instead of finding the centroids themselves now we are trying to find a centroid that is slightly leaning towards the lighter pixels.
Or darker, depending on the look you're going for.

For each pixel (or subsample):

1. Find containing cell
2. sum up all the pixels per cell according to their weights
3. move the point to that weighted centroid



## Links

- [Coding Challenge 181: Weighted Voronoi Stippling](https://www.youtube.com/watch?v=Bxdt6T_1qgc)
- <https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf>
