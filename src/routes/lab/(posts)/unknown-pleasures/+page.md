---
title: Unknown Pleasures
date: "2026-10-30"
cover: ./cover.png
description: the infamous pervasive piece of culture by the late Peter Saville
status: draft
---

<script>
import Experience from './Experience.svelte'
import DataHistory from './DataHistory.svelte'
</script>

<Experience/>

## Why am i even doing this

It's been a while since i've just coded some visual just for fun, so i thought i would give this iconic visual a go.
Being a simple plot, processing the data is basically a nested for loop and not tricky at all.
What i wanted to try is can i improve on my usual approach of the painters trick.
Usually i would draw them stacked from back to front, with a stroke and a fill below in order to have them overlay each other.
On a bus ride a while back i had the idea that while drawing a stroke i could `Math.max` it with the stroke beneath it, so it would be just strokes.

One disclaimer: I did use my LLM as a feedback mechanism, after i had an initial working draft.
And since where drawing on a HTML canvas with origin top / left its actually `Math.min` not `Math.max`.
The general idea stays the same.

## Skyline

So since the drawing and the transformation for fitting the data into the canvas where so closely related, i opted for doing all in the same nested loop.
In order to know the y value of the last stroke relative to the canvas i put the currentY value into an array on the first stroke.
From then on i compared each value with the one at the same index below it, overwriting it with the Result.
This way i could use an the one array for each row, kind of like a buffer.

```js
let history = [];

pts.forEach((pulse, pulseIndex) => {
  const pulseY = (nPulses - pulseIndex) * yIncrement + marginTop;

  ctx.beginPath();
  ctx.moveTo(0, pulseY);

  pulse.forEach((y, i) => {
    const x = ((i + 1) / n) * w;
    const currentY = -1 * y * scale + pulseY;
    const minY = pulseIndex > 0 ? Math.min(currentY, history[i]) : currentY;

    ctx.lineTo(x, minY);
    history[i] = minY;
  });

  ctx.stroke();
});
```

After i was done and asked my LLM for feedback i was informed that this was called a skyline problem.

## Data

Every time i need the data for this graph i am astonished by the chain of events.
The fact that a dataset moves from academia to music, art and fashion is not something you see every day.
But it is exactly that chain of events that makes it kind of hard to research it every time i need it.
So im just gonna put this here, as a note to myself.

<DataHistory/>
