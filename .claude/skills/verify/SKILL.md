---
name: verify
description: Build/launch/drive recipe for verifying UI changes in this SvelteKit site
---

# Verify: porto-folio

## Launch

- In a worktree, run `npm install` inside it first — without its own `node_modules`,
  Vite serves modules as blocked `/@fs/` URLs and hydration silently never runs
  (SSR still looks fine). Also confirm the branch is based on local `main`, not the
  stale `origin/master`.
- `npm run dev -- --port <port> --host localhost` — pick a port ≠ 5173 so it can't
  clash with a dev server the user has running.

## Drive

- No Playwright in the repo. `npm i playwright-core` in a temp dir, then launch the
  machine's cached browser (check `~/Library/Caches/ms-playwright/` for the build
  number):

  ```js
  chromium.launch({
      executablePath: `${process.env.HOME}/Library/Caches/ms-playwright/chromium-<build>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  });
  ```

- Prewarm `/`, `/lab`, `/resume` with `waitUntil: "networkidle"` before any
  timing-sensitive step — first-hit Vite compiles of lab routes (Threlte/WebGL)
  take well over 5 s and break short navigation timeouts.
- Wire up `pageerror`/`console` listeners; a hydration failure is invisible in
  screenshots but loud in the console.

## Flows worth driving

- Nav: below 48rem the links collapse behind a menu toggle (dropdown card,
  Escape/outside-click/navigation all close it); at ≥ 48rem it's the inline pill.
  Breakpoints are hardcoded literals matching `--bp-*` in `tokens.css` (48rem / 75rem).
- Theme: pass `colorScheme: "dark"` as a context option; the toggle button lives in
  the nav pill on every viewport.
- Lab posts: canvas/WebGL heroes — give them a beat after `networkidle` before
  screenshotting.
