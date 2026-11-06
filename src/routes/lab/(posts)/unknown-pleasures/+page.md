---
title: Unknown Pleasures
featured: true
date: "2026-10-30"
cover: ./cover.png
description: Redrawing the Unknown Pleasures cover by clamping each line to the skyline in front of it, plus the chain that carried a pulsar plot to a record sleeve.
status: public
abbr:
  LLM: Large Language Model
---

<script>
import Experience from './Experience.svelte'
import DataHistory from './DataHistory.svelte'
import DiagramSkyline from './DiagramSkyline.svelte'
</script>

<Experience/>

## Motivation

It's been a while since i've just coded some visual just for fun.
On a bus ride a while back i had the idea, that while iterating, the stroke i could `Math.max` it with the one beneath it.
This way there would be no need for painter trick or even boolean / intersection math.

So here's what i learned.

## Algorythm

First of all, i had to draw the strokes from front to back for this trick to even work.
Because only then can you carry the height in the correct direction.
If i was going in the back to front, i could not anticipate a peak more than one row in advance.
The original visual hat peaks spanning multiple rows.
The other thing was that because of the coordinate system having its origin top/left, i needed to use `Math.min` and not `Math.max` to find out if the stroke higher up then the last.
One downside of this approach, when drawing strokes over the same pixels again and again the anti aliasing starts adding up and the line looks fatter than the rest.

According to LLM feedback, this is called a skyline and is on leetcode [the-skyline-problem](https://leetcode.com/problems/the-skyline-problem/description/)

<DiagramSkyline/>

## Copy chain

For future reference

<DataHistory/>
