---
status: public
title: Elementary Cellular Automata
date: "2026-06-29"
cover: ./cover.svg
description: A 3 KB HTML file I wrote in 2016, rebuilt — Wolfram's 256 rules, live.
tags: graphics, math, time-capsule
---

<script>
  import Neighbourhood from "./Neighbourhood.svelte";
  import RuleByte from "./RuleByte.svelte";
</script>

Ten years ago after watching this [fun fun function video](https://www.youtube.com/watch?v=bc-fVdbjAwk) on youtube, i wanted to try it for myself. [Mattias Petter Johansson](https://about.me/mpj "the guy behind the channel back then and one of my idols when it comes to communicating programming concepts"), got together with [Irina Shestak](https://github.com/lrlna "from her gh bio: a Rust engineer working on a graphql compiler @apollographql") to explain an advanced programming concept with pair programming. 

Though a whole lot of my love for programming and messing around with code comes from the videos on this channel, when it came to the part where they implemented the rules i was left thinking that i could do that in a more universal way. Dont get me wrong, in no way do i think im smarter than these people. I just saw an opportunity to have some fun and had some time on my hand.

Combing through my old repos, looking for something to write about, i found a single file `cellular-automata.html`: one commit, dated 15 September 2016. To my surprise the thing still works. Gotta hand it backwards compatibility of the platform at this point.

Lets get into it.

## Three cells make a number

The rules are almost embarrassingly simple. You have one row of cells, each on or off. To decide what a cell becomes in the next row, you look at three cells in the row above: the one directly overhead and its two neighbours.

Three cells, each on or off, read left to right, are just a binary number:

<Neighbourhood />

So every possible local situation is a number from 0 to 7 — eight of them, no more. That's the entire input space. A cellular automaton just needs to answer, for each of those eight, one question: *is the cell below on or off?*

## A rule is just a byte

Eight patterns, eight yes/no answers. Eight bits. That's a byte — a single number from 0 to 255. Which is why there are exactly 256 of these automata, and why "Rule 90" is a complete, precise specification rather than a catalogue entry.

Here's the part I find genuinely elegant. *Which* answer belongs to *which* pattern? You don't need a lookup table on the side — the pattern tells you. Read the three cells as binary, and that number is the answer's position in the rule's byte:

<RuleByte />

Rule 90 is just `90` written in binary, `01011010`. Each digit is the output for the pattern that matches its place. The number isn't a name stuck on the rule; it *is* the rule, decoded for free by the place-value you already know. The patterns matched against the row above are nothing but the bit positions of the rule number — in binary, all the way down.

A few rules are worth knowing by name:

- **Rule 90** draws a Sierpiński triangle from nothing but XOR
- **Rule 30** is so disordered it shipped as a random-number generator in Mathematica.
- **Rule 110** is, improbably, *Turing complete* — a universal computer hiding in one byte.


## The 2016 engine

Here is the heart of the original file, untouched. You can feel that ES6 had just landed — arrow functions on everything, the cheerfully terse `Math.random()<.5`:

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

`makeRule` turns the number into a reversed 8-bit lookup table. `calcNewRow` reads each cell's `left/self/right`, glues them into a string like `"101"`, and runs `parseInt(..., 2)` to recover that index from 0 to 7 — exactly the encoding from the diagram above, done the long way round. The whole simulator is those fifteen lines; everything else in the file just makes `<div>`s, one per cell, styled in a hot pink `#f06`.

There's a bug I left in, and it's a good one. The left edge wraps around correctly (`arr[arr.length - 1]`), but the right-edge guard reads `index === arr.length`, which can never be true — the last valid index is `length - 1`. So the rightmost cell quietly reads `undefined`, coerced to `NaN`. The string becomes `"10NaN"`, and `parseInt("10NaN", 2)` stops at the first character it can't read and returns `2`. The off-by-one doesn't crash; it just degrades into slightly different edge behaviour. Past me got away with it.

## The rebuild

The logic survived intact. The only real change is honesty about that edge and dropping the string detour:

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

Bit shifts instead of `parseInt` on a string, a `Uint8Array` instead of an array of booleans, and a `<canvas>` instead of fourteen thousand DOM nodes — so it runs hundreds of cells wide at sixty frames a second. In the hero each new generation is drawn at the bottom and the whole thing scrolls up, because that downward axis *is* time: every row is computed entirely from the one above it.

That's the part I find quietly remarkable. Nothing up there knows about triangles, or chaos, or traffic. It's one rule, applied locally, over and over — and the structure falls out for free. It did in 2016, and it does now. Some toys age well.
