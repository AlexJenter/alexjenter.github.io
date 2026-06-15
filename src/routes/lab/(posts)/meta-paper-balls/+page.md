---
status: public
title: Metaballs
date: "2026-06-15"
cover: ./cover.svg
description: Organic blobs that merge when they meet — a classic computer graphics trick using bezier curves between circles.
---

Around Summer 2015, working [attribute.ch](https://www.attribute.ch/en), i was sitting in a design meeting for [re-fugium.com](https://www.re-fugium.com/). Among many other questions we where looking for a strong visual  

Metaballs are organic-looking blobs that fuse together as they approach each other. The visual is everywhere in motion design and creative coding, but the underlying technique is surprisingly simple: it's just circles connected by carefully placed bezier curves.

## The algorithm

Each blob is a circle with a position and radius. When two circles are close enough, we draw a filled bezier path between their edges to bridge the gap. The key insight is how to place the bezier handles so the bridge looks smooth and organic.

For two circles with radii $r_1$ and $r_2$ and center distance $d$, we find the four tangent points on their circumferences. The inner tangent points give us the four corners of the bridge path. Bezier handles are then placed perpendicular to the tangent at each corner, scaled by the distance between the circles.

As $d$ shrinks the bridge widens; as it grows the bridge thins until the circles fully separate.

## Implementation

This version runs in [Paper.js](http://paperjs.org/) — a vector graphics library that gives us `Path` and `Point` primitives to work with. Each frame:

1. Place the main blob at the cursor
2. Move the five satellite blobs toward the main blob via a spring force
3. Absorb any satellite that's fully inside the main blob (it teleports away and the main blob grows)
4. When the main blob fills the screen, flip the color scheme and reset its size

The absorb-and-grow loop means the animation cycles: the main blob slowly expands until it covers the viewport, then snaps back to its starting size and the colors invert.

The code is ported from the hero animation on [re/fugium](https://www.re-fugium.com/), a 2016 artists' residency site built by [ATTRIBUTE](https://attribute.ch/). A couple of bugs in the original — an incorrect diagonal calculation and an out-of-scope variable on reset — are fixed here.
