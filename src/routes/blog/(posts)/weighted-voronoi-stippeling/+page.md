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

After watching Dan Shiffmans Youtube video on the topic i had to try it out for myself!

## Lloyd's Relaxations

<DiagramVoronoi/>

Very much to my surprise the first try with ai was dropping frames, so i tried to it the way Dan Schiffman was.
Using d3-Dlauney made all the difference.


## Links

- [Coding Challenge 181: Weighted Voronoi Stippling](https://www.youtube.com/watch?v=Bxdt6T_1qgc)
- <https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf>
