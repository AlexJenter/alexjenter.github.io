# Unknown Pleasures

## Data notes

- Source: Harold Craft Jr., Cornell PhD thesis (Sept 1970), Figure 5.37, p. 215. PSR B1919+21 (CP 1919), Arecibo, 318 MHz.
- `cp1919.json` was made with a Python script from the CSV in [pachadotdev/cp1919](https://github.com/pachadotdev/cp1919) (`cp1919.csv`, 24,000 rows = 80 x 300, columns x, y, z; z is the sample value). The first row of the JSON matches the first z values of the CSV (-0.81, -0.91, -1.09).
- The maker of that CSV is unknown. The [pachadotdev post](https://www.r-bloggers.com/2024/06/cp-1919-psr-b191921-dataset-2/) (21 Jun 2024) says the file was "found in one of my old external drives" and asks who made it. No source says if it was digitised from the printed figure or not. The two-decimal values suggest it was, but this is a guess.
- [phocks/CP-1919](https://github.com/phocks/CP-1919) is a different dataset. Its README says the data came from "an SVG file I randomly found on the Internet". The pachadotdev post does not mention it. Do not cite one as the source of the other.

## Copy chain

Checked against the pages named in each line. Pages marked "not checked" were not read.

1. 1967-68: Jocelyn Bell finds the first pulsar at Cambridge (CP = Cambridge Pulsar). The Nature paper (24 Feb 1968) has no stacked plot.
2. Sept 1970: Harold D. Craft Jr. makes the plot from Arecibo data for his Cornell thesis, _Radio Observations of the Pulse Profiles and Dispersion Measures of Twelve Pulsars_, Fig. 5.37. Computer-generated on a Calcomp plotter and traced in india ink by a draftsperson. His program hides lines behind higher peaks. ([Christiansen 2015](https://www.scientificamerican.com/blog/sa-visual/pop-culture-pulsar-origin-story-of-joy-division-s-unknown-pleasures-album-cover-video/), [Christiansen and Craft 2020](https://www.scientificamerican.com/article/the-pulsar-chart-that-became-a-pop-icon-turns-50-joy-division-rsquo-s-unknown-pleasures))
3. Jan 1971: _Scientific American_ ("The Nature of Pulsars", Jeremiah Ostriker, pp. 48-60, plot on p. 53). Caption: "computer-generated illustration produced at the Arecibo Radio Observatory". The credit box names Arecibo, not Craft. The 2020 article prints "Credit: Harold D. Craft, Jr.". Ostriker told Adam Cap he doubts he made the image. ([Christiansen 2015](https://www.scientificamerican.com/blog/sa-visual/pop-culture-pulsar-origin-story-of-joy-division-s-unknown-pleasures-album-cover-video/), [Adam Cap](http://adamcap.com/2011/05/19/history-of-joy-division-unknown-pleasures-album-art/))
4. 1974: _Graphis Diagrams_ (ed. Walter Herdeg), credited to Arecibo. No page number found.
5. 1977: _The Cambridge Encyclopaedia of Astronomy_ (ed. Simon Mitton). Caption: "Successive pulses from the first pulsar discovered, CP 1919, are here superimposed vertically." No plot credit.
6. 1979: _Unknown Pleasures_ (Joy Division). Per Wikipedia, quoted by Adam Cap, drummer Stephen Morris suggested the image. Cap writes that Morris saw it in the encyclopaedia. The cover is credited to Joy Division, Peter Saville and Chris Mathan. Saville's office: "We understand the image as copyright free." The cover is white on black, with no band name or title. Bernard Sumner is not named in any page read.
7. 2015: Jen Christiansen of _Scientific American_ finds and interviews Craft. Craft: "It was a complete surprise." A colleague, Jim Cordes, told him.
8. Unknown: who made the CSV, how, and when (see above).
9. Python script: CSV to `cp1919.json`.

Not checked: Saville's own account (video on the 2015 post, no transcript), the Cornell [Arecibo oral history](https://ecommons.cornell.edu/handle/1813/33201) (fetch returned an empty page), and the record label (no page read names it).

- Shape: `{"pulses": [[...300 samples] x 80]}`. Pulse 1 is the top line of the cover, pulse 80 the bottom line. Craft's caption says time increases toward the top, so pulse 1 is probably the latest pulse. This is an inference, not documented.
- Each line spans roughly 100-120 ms (the scan shows 20 ms as about 205 px of a 1065 px line). The pulse itself lasts about 0.04 s.
- Not documented anywhere: observation date, bandwidth, receiver, normalisation.

## TODO

### Fix first

- [ ] The drawing disappears on resize. Each resize clears the canvas, and `setup` runs only once. `Canvas.svelte` now calls `update(ctx, w, h, 0)` after every size change. Move the drawing from `setup` into `update`, and drop `setup`. Set `lineWidth` and `strokeStyle` inside `update`, because a resize resets them. Remove the `update={() => undefined}` stub.
- [ ] Lines are white on a transparent background, so they are invisible on the light theme. Choose a fixed black poster panel (paint the rectangle) or read the theme tokens.
- [ ] Pass a `label` to `Canvas` for an accessible name.

### Smaller

- [ ] Make `scale` and `marginTop` relative to the canvas size. `Canvas` passes device pixels, so the peak height changes between 1x and 3x screens. `marginTop` is also coupled to `scale`, and a tall peak can clip.
- [ ] Rename for clarity. `maxY` is really a min. `history` is a skyline. `toReversed()` (draw order, front line first) and `nPulses - pulseIndex` (screen position) are both needed. Optional: loop backwards over the original array and use `(i + 1) * yIncrement + marginTop`, so only one flip remains.
- [ ] `history[0] = pulseY` overwrites the skyline at sample 0 before the clamp reads it.
- [ ] `((i + 1) / n) * w` starts one sample late, while `moveTo(0, ...)` starts at zero. Use `i / (n - 1)`.
- [ ] The skyline clamp double-draws edges. This is fine for opaque white. It breaks with alpha. Shading or gradients need a fill pass.

### Article and polish

- [ ] Replace `description: the infamous` and the placeholder body text.
- [ ] Replace the dot-grid placeholder `cover.svg`.
- [ ] Optional: tilt the stack slightly, as Craft did.
- [ ] Optional: minify or round `cp1919.json` (about 169 KB, pretty-printed).
- [ ] Open question: fetch Patrick Weltevrede's 2019 Conversation article for modern astronomy detail on the data.
