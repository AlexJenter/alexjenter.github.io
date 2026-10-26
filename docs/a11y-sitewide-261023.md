# A11y Review — sitewide axe scan (2026-10-23)

Tool: axe-core run directly (the `a11y` MCP is registered for this project but
its tools did not load in the session) via Playwright headless Chromium against
the dev server on `:5173`.
Rules: WCAG 2 A/AA, 2.1 AA, 2.2 AA + best-practice.
Matrix: 15 routes × light/dark × 1280px/390px.
Routes: `/`, `/resume`, `/drafts`, all 10 `/lab/*` posts, `/dev/ui`, a 404.

Automated only. Not covered: keyboard order, screen-reader wording, motion.

---

## Summary by priority

| #   | Where                                  | Issue                                           | Rule / WCAG SC                      | Hits |
| --- | -------------------------------------- | ----------------------------------------------- | ----------------------------------- | ---- |
| 1   | `ValueEdit.svelte`, `FileInput.svelte` | Accessible name lacks visible text              | label-content-name-mismatch / 2.5.3 | 24   |
| 2   | `tokens.css` syntax tokens             | Code comment + class-name contrast              | color-contrast / 1.4.3              | 8    |
| 3   | `global.css` `pre`                     | Scrollable code not keyboard-reachable (mobile) | scrollable-region-focusable / 2.1.1 | 7    |
| 4   | Footnote back-links, `/dev/ui` sliders | Targets under 24px                              | target-size / 2.5.8                 | 4    |

---

## 1. Accessible name does not contain visible text

- `src/lib/components/gui/ValueEdit.svelte:77` — `aria-label={`Edit ${name}`}`
  on a button showing `0.40`. Voice-control users say the visible text, which
  does not match. Affects every numeric control (voronoi, blue-noise,
  cellular-automata).
- `src/lib/components/gui/FileInput.svelte:44` — `aria-label="Image"` on a
  button showing "Drop / Click".

Fix: start the label with the visible text (`0.40 – edit Dot radius`,
`Drop / Click – Image`), or move the extra context to `aria-describedby`.

## 2. Contrast in code samples

- `--syntax-comment: #8a877f` (`src/lib/styles/tokens.css:16`) on `#eceae4`
  measures 2.98:1; 4.5:1 required. Seen on cellular-automata, raymarching,
  `/dev/ui`.
- `.class-name` `#a6702a` on `#eceae4` measures 3.51:1 (light only).
- Dark comment colour `#7c7a74` (`tokens.css:100`, `:123`) was not flagged on
  its own; re-check in dark after the change.

Fix: darken the light-mode tokens, derived from the theme tokens (not a pinned
palette).

## 3. Scrollable `pre` has no keyboard access

`pre { overflow-x: auto }` (`src/lib/styles/global.css:78`) scrolls on phones.
Without `tabindex="0"`, keyboard users cannot scroll it. Seen on
blue-noise-dithering, cellular-automata (×2), raymarching-a-scene,
its-just-for-loops (`.code` blocks, ×2).

Fix: `tabindex="0"` on `pre` (mdsvex code renderer + the `.code` block), plus a
`:focus-visible` style. Consider `role="region"` + `aria-label` if keeping it
focusable.

## 4. Touch targets below 24px

- `a.footnote-backref` (`↩`) on weighted-voronoi-stippeling: 16×20px, two
  instances. Add padding.
- `/dev/ui` range-slider `.pointer` handles: 1px wide. Dev-only, low priority;
  likely a missing enlarged hit area.

---

## Clean

No landmark, heading, alt text, link name, language or page-title violations on
any route. Home, resume, drafts and the 404 had no findings.

## Next

- Fix 1–3 (small, ~10 lines each).
- Restart the session so the `a11y` MCP tools load, then re-run to confirm.
- Older per-post review: `a11y-weighted-voronoi-stippeling.md`.
