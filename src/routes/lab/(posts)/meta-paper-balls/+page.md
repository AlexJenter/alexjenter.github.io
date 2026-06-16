---
status: public
title: Meta Paper Balls
date: "2026-06-15"
cover: ./cover.svg
description: Organic blobs that merge when they meet — Just like people with their Ideas
---

Around Summer 2015, working [attribute.ch](https://www.attribute.ch/en), i was sitting in a design meeting for [re-fugium.com](https://www.re-fugium.com/). Among many other questions we where looking for a strong visual that would convey the goal of project, being networking jung people across many disciplines, sharing knowledge.

Paging through [paperjs.org/examples](https://paperjs.org/examples/) as i used to do a lot back then we discoverd [the meta ball expample](https://paperjs.org/examples/meta-balls/) and instantly knew, there could be something there. The way the blobs connected so cleanly and the stark black and white aesthetic fitted the bill and designer as well clients saw the vision.

Since i also wanted to convey a sense of growth, i came up with the idea of a central attractor, controlled by the user, following the pointer device.

The Algorithm is pretty basic. Acceleration based attraction, only between the main blob and each of the others. Under a certain distance threshold the connecting geometry is calculated. If the distance is smaller than main radius minus the other one, it triggers the main one to grow a bit and the other one to teleport to a random position.

Mainly put it here for nostalgia.
