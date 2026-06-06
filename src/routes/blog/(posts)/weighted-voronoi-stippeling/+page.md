---
status: draft
title: Weighted Voronoi Stippeling
date: "2026-05-04"
cover: ./cover.svg
description: The traditional artistic technique of stippling places small dots of ink onto paper such that their density give the impression of tone.
---

<script>
import DiagramVoronoi from "./Diagram-Voronoi.svelte";
</script>

After watching Dan Shiffmans YouTube video on the topic i had to try it out for myself.
Somehow the way he presents a topic really clicks with my thinking.


## Lloyd's Relaxations

The algorithm builds on Lloyd's Relaxations, witch use properties voronoi diagrams in a clever way.
The goal of lloyd's relaxation is to relax a point set so that all points to average out there distance to there direct neighbours.
Each iteration goes something like this:

1. Generate N random points
2. Calculate the Voronoi Diagram of your points
3. Find the centroid of each cell
4. Move the corresponding point to that centroid

maybe just me, but i find it highly satisfying when it converges.

<DiagramVoronoi/>


### Finding the Centroids

Dan Shiffman uses the centroid algorithm described [here](https://paulbourke.net/geometry/polygonmesh/#:~:text=Centroid,-The) by Paul Bourke, but i found that d3 also provides a polygonCentroid function

## Weighted Relaxations

This step is already the main difference to Lloiy's relaxations and basically the last step.

Instead of finding the centroids themselves now we are trying to find a centroid that is slightly leaning towards the lighter pixels.
Or darker, depending on the look your going for.

For each pixel (or subsample):

1. Find containing cell
2. sum up all the pixels per cell according to their weights
3. move the point to that wheighted centroid



## Links

- [Coding Challenge 181: Weighted Voronoi Stippling](https://www.youtube.com/watch?v=Bxdt6T_1qgc)
- <https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf>
