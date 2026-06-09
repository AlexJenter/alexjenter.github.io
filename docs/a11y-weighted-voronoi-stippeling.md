# A11y Review — weighted-voronoi-stippeling

Files reviewed: `src/routes/lab/(posts)/weighted-voronoi-stippeling/+page.md`,
`Diagram-Voronoi.svelte`, `Diagram-WeightedCentroid.svelte`, `Hero.svelte`,
`src/lib/components/Canvas.svelte`

---

## Summary by priority

| # | Where | Issue | WCAG SC |
|---|-------|--------|---------|
| 1 | page.md | Raw URL as link text | 2.4.4 Link Purpose |
| 2 | page.md | `target="_blank"` without warning | 3.2.2 On Input |
| 4 | Diagrams ×2 | `role="img"` hides interactive SVG | 4.1.2 Name, Role, Value |
| 6/11 | Diagrams ×2 | Dynamic text not in live region | 4.1.3 Status Messages |
| 7/12 | Diagrams ×2 | Decorative SVGs not aria-hidden | 1.1.1 Non-text Content |
| 8/13 | Diagrams ×2, Canvas | No `prefers-reduced-motion` | 2.3.3 Animation from Interactions |
| 3 | page.md | Ambiguous "Hero:" attribution label | 1.3.1 Info and Relationships |
| 5 | Diagram-Voronoi | Static label on dynamic SVG | 4.1.2 Name, Role, Value |
| 9 | Diagram-Voronoi | Missing `#arr` marker (visual bug) | — |

---

## +page.md

**1. Footnote [^2] link text is a raw URL**

```md
[^2]: [www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf](https://www.cs.ubc.ca/...)
```

A screen reader announces this as a string of URL characters. Replace with the actual paper title and author:

```md
[^2]: [Stippling by Weighted Centroidal Voronoi Tessellations — Secord 2002 (PDF)](https://www.cs.ubc.ca/labs/imager/tr/pdf/secord.2002b.pdf)
```

**2. External links open in new tab without warning**

Both `target="_blank"` links in the attribution lack any indication of tab-opening behaviour. WCAG 3.2.2 and common practice require users to be warned before context changes. Options:
- Add a visually-hidden `, opens in new tab` span inside the `<a>`
- Or add `aria-label="Alexander Krivitskiy on Unsplash (opens in new tab)"`

The YouTube and PDF footnote links are also `target="_blank"` after markdown rendering — same issue applies.

**3. "Hero:" attribution prefix is ambiguous**

```md
Hero: Based on Photo by ...
```

`Hero:` doesn't communicate what this is to someone using AT. At minimum rephrase to `Photo credit:`. Ideally the attribution belongs in a `<figcaption>` associated with the hero image/canvas via `aria-describedby` or inside a `<figure>`.

---

## Diagram-Voronoi.svelte

**4. `role="img"` on an interactive element**

```svelte
<svg role="img" aria-label="Interactive Voronoi diagram">
```

`role="img"` tells AT "this is a static image." The SVG responds to Play/Pause/Step controls and updates visually. Screen readers will treat it as non-interactive content and users may not know controls exist. Remove `role="img"` — the `<figure>` with `<figcaption>` provides sufficient context, and the buttons are the actual interactive surface.

**5. Static `aria-label` on a dynamically-updating diagram**

The SVG's `aria-label="Interactive Voronoi diagram"` never reflects the current state. There's already a derived `label` ("General Voronoi", "Centroidal Voronoi", `"Iteration ${iter}"`) — wire it up:

```svelte
<svg aria-labelledby="voronoi-status">
```
```svelte
<div id="voronoi-status" class="badge" ...>{label}</div>
```

This combines fixes 4 and 6 — `badge` becomes the label source and doesn't need a separate live region.

**6. `.badge` and `<figcaption>` state changes not announced**

Both update reactively but neither is a live region, so AT users operating the controls hear nothing. `<figcaption>` is the natural place to fix this:

```svelte
<figcaption aria-live="polite" aria-atomic="true">
```

**7. Decorative legend SVGs exposed to AT**

```svelte
<svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="..." /></svg>
generator
```

These small icon SVGs have no `aria-hidden="true"`. A screen reader will announce something like "SVG graphic" before "generator". Add `aria-hidden="true"` to all three legend `<svg>` elements.

**8. No `prefers-reduced-motion` handling**

The seed/centroid circles use CSS transitions (`cx 0.25s`, `cy 0.25s`) and the setTimeout animation loop runs unconditionally. Add:

```css
@media (prefers-reduced-motion: reduce) {
    .seed, .centroid { transition: none; }
}
```

And in the script, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before auto-playing or use a longer step interval.

**9. Missing arrowhead marker `#arr` (visual bug)**

```svelte
<line ... marker-end="url(#arr)" />
```

The `<defs>` block only defines `<clipPath id="clip">` — there's no `<marker id="arr">`. The direction arrows render as bare lines with no arrowhead tip. Sighted users lose the directional cue. Not an a11y issue per se, but undermines the diagram's ability to communicate its concept.

---

## Diagram-WeightedCentroid.svelte

**10. `role="img"` on interactive SVG** — same as issue 4: remove it.

**11. `.badge` and `<figcaption>` not live regions** — add `aria-live="polite" aria-atomic="true"` to `<figcaption>`.

**12. Decorative legend SVGs exposed to AT** — add `aria-hidden="true"` to all three legend `<svg>` elements.

**13. No `prefers-reduced-motion` handling** — the `.seed.animate` transition (`cx 0.5s`, `cy 0.5s`) should be suppressed, and the `setTimeout`-based auto-advance should respect the preference.

---

## Canvas.svelte (used by Hero)

**14. No `prefers-reduced-motion` handling**

The `requestAnimationFrame` loop runs unconditionally. For the stippling hero the animation continues indefinitely at full speed. At minimum, pause the loop when `prefers-reduced-motion` is set, or call `update` once and stop:

```ts
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// either skip the rAF loop entirely, or call update once and stop
```
