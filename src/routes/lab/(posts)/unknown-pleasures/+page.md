---
title: Unknown Pleasures
date: "2026-10-30"
cover: ./cover.png
description: the infamous pervasive piece of culture by the late Peter Saville
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

First of all i had to draw the strokes from front to back so the trick would even work.
Because only then can you carry the height in the correct direction.
On a downside, when drawing strokes over the same pixels again and again the anti aliasing starts adding up and the line looks fatter than the rest.

According to LLM feedback, this is called a skyline and is on leetcode [the-skyline-problem](https://leetcode.com/problems/the-skyline-problem/description/)

<DiagramSkyline/>

## Copy chain

For future reference

<DataHistory/>
