---
status: draft
title: Elementary Cellular Automata
date: "2026-06-29"
cover: ./cover.svg
description: A 3 KB HTML file I wrote in 2016, rebuilt — Wolfram's 256 rules, live.
tags: graphics, math, time-capsule
---

<script>
  import CellularAutomata from "./CellularAutomata.svelte";
</script>

Going through old repositories I found a single file called `cellular-automata.html`. One commit, dated **15 September 2016** — first push and last push two minutes apart. 3 KB of HTML with the whole program inlined in a `<script>` tag. Ten years on it still runs in a browser without a single change, which is more than I can say for most things I've written since.

It implements Wolfram's **elementary cellular automata**, and it turns out to be a near-perfect candidate for a rebuild: the idea is tiny, the original code is charming, and the output is the kind of thing you want to sit and poke at.

<CellularAutomata />

## One line, eight questions

The setup is about as minimal as a "system" gets. You have a single row of cells, each either on or off. To compute the next row, you look at every cell together with its two immediate neighbours — three cells in total. Three cells means $2^3 = 8$ possible local arrangements, and a *rule* is simply your answer to "for each of those eight arrangements, is the cell below on or off?"

Eight yes/no answers pack into a single byte, so every possible elementary automaton has a number from 0 to 255. That's the entire space — $2^8 = 256$ universes, and you can scrub through all of them with the slider above. The strip of little icons under the canvas *is* the rulebook: each shows one of the eight neighbourhoods on top and the cell it produces underneath. Drag the rule and watch the bottom squares flip.

A few are worth knowing by name:

- **Rule 90** draws a Sierpiński triangle out of nothing but XOR — it's on the cover.
- **Rule 30** is so disordered it shipped as a random-number generator in Mathematica.
- **Rule 110** is, improbably, *Turing complete* — you can build a universal computer out of this one rule.
- **Rule 184** models traffic jams: cars that only move when the road ahead is clear.

## The 2016 engine

Here is the heart of the original file, untouched. You can feel that ES6 had just landed — arrow functions on everything, the giddy `Math.random()<.5`:

```js
// make array of numbers for results
var makeRule = number => {
  var binary = (number >>> 0).toString(2)
  while (binary.length < 8) {
    binary = "0" + binary
  }
  binary = binary.split("").reverse()
  return binary
}

// meat
var calcNewRow = (oldRow, ruleNumber) => {
  var newRow = []
  var rule = makeRule(ruleNumber)
  oldRow.map((bool, index, arr) => {
    var left  = + arr[index - 1]
    var self  = + bool
    var right = + arr[index + 1]
    if (index === 0)
      var left = + arr[arr.length - 1]
    if (index === arr.length)
      var right = + arr[0]

    var res = parseInt(("" + left + self + right), 2)
    newRow.push( + rule[res])
  })
  return newRow
}
```

`makeRule` turns the number into a reversed 8-bit lookup table. `calcNewRow` then reads each cell's `left/self/right`, glues them into a string like `"101"`, and does `parseInt(..., 2)` to get an index from 0 to 7. That index into the table is the new cell. The whole simulator is those fifteen lines; everything else in the file just makes `<div>`s — one per cell, 120 × 120 of them, styled with a hot pink `#f06`.

There's even a bug I left in, and it's a good one. The left edge wraps around correctly (`arr[arr.length - 1]`), but the right-edge guard reads `index === arr.length`, which can never be true — the last valid index is `length - 1`. So the rightmost cell quietly reads `arr[index + 1]`, which is `undefined`, coerced to `NaN`. The string becomes something like `"10NaN"`, and `parseInt("10NaN", 2)` stops at the first character it can't parse and returns `2`. The off-by-one doesn't crash; it just degrades into a slightly different edge behaviour. Past me got away with it.

## The rebuild

The logic survived intact — the only real change is honesty about that edge and dropping the string detour:

```js
function nextRow(row, table) {
  const n = row.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const l = row[(i - 1 + n) % n];  // both edges wrap now
    const c = row[i];
    const r = row[(i + 1) % n];
    out[i] = table[(l << 2) | (c << 1) | r];
  }
  return out;
}
```

Bit shifts instead of `parseInt` on a string, `Uint8Array` instead of an array of booleans, and a `<canvas>` instead of 14,400 DOM nodes — so it'll happily run hundreds of cells per row at sixty frames a second. Each generation is drawn one row below the last, top to bottom, because that downward axis *is* time: every row is computed entirely from the one above it.

That's the part I find quietly remarkable. Nothing here knows about triangles, or chaos, or traffic. It's one rule, applied locally, over and over — and the structure falls out for free. It did in 2016, and it does now. Some toys age well.
