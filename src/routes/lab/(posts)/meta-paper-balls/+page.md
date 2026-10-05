---
status: public
title: Meta Paper Balls
date: "2026-06-15"
cover: ./cover.svg
description: Organic blobs that merge when they meet — just like people with their ideas
---

Around summer 2015, working at [attribute.ch](https://www.attribute.ch/en), I was sitting in a design meeting for [re-fugium.com](https://www.re-fugium.com/). Among many other questions we were looking for a strong visual that would convey the goal of the project: networking young people across many disciplines and sharing knowledge.

Paging through [paperjs.org/examples](https://paperjs.org/examples/) as I used to do a lot back then, we discovered [the meta ball example](https://paperjs.org/examples/meta-balls/) and instantly knew there could be something there. The way the blobs connected so cleanly and the stark black and white aesthetic fit the bill, and designers as well as clients saw the vision.

Since I also wanted to convey a sense of growth, I came up with the idea of a central attractor, controlled by the user, following the pointer device.

The algorithm is pretty basic. Acceleration based attraction, only between the main blob and each of the others. Under a certain distance threshold the connecting geometry is calculated. If the distance is smaller than main radius minus the other one, it triggers the main one to grow a bit and the other one to teleport to a random position.

Mainly put it here for nostalgia.
