# Performance Audit Report — rkportfolio
Generated: 2026-08-16 (lens: `performance`, scope: `src/**`, branch: `audit/2026-08-16`)
Report-only run — no fixes applied. Findings ordered by severity.

## Baseline

- Gate (verified by orchestrator, not re-run): `npx tsc --noEmit` exit 0, `yarn lint` clean, `yarn build` succeeds.
- Build output: route `/` = **51.3 kB page / 154 kB First Load JS**. Single route (+ `not-found`), `output: 'standalone'` on Railway.
- Bundle boundaries already correct in one key place: `three` + `gsap` live behind `dynamic(() => import('./CosmicDustThree'), { ssr: false })` (`src/app/components/BackgroundElements.tsx:7-9`), so the ~150 kB gz Three chunk is async and does not block hydration. framer-motion already uses the `LazyMotion` + `m` reduced entry (`src/lib/motion.ts:3`, `src/app/page.tsx:133`).
- The particle system is GPU-resident: static attributes uploaded once, per-frame work is ~20 uniform floats + one draw (`src/app/components/CosmicDustThree.tsx:455-536, 717-744`). Adaptive draw-range quality scaling exists (`:626-661`). Mobile halves particle/star counts, caps DPR at 1.5, disables antialias (`:447-450, 456, 588`). This is a healthy render loop.
- No bundle analyzer configured (`@next/bundle-analyzer` absent from `package.json`).
- N/A by architecture: backend/database/API payloads/server caching (§5, §6, §10), third-party scripts (§11 — none loaded), images (§3 — the site renders no images; `images.formats` in `next.config.js` is inert).

## Executive Summary

The heavy WebGL path has already been optimized well; the remaining wins are around the *edges* of the render loop, not inside it. Top three: (1) no `prefers-reduced-motion` gate anywhere on an animation-only site — the binding treats this as a hard finding; (2) a dead `next/font` Inter that is preloaded with high priority on every visit but can never render a glyph; (3) font delivery — the primary display font has no preload/caching story, and ~1.7 MB of unused font binaries (incl. a 1.6 MB Nabla TTF) ship in the deploy artifact. Bundle-wise, the home route carries two overlapping animation stacks (react-spring/use-gesture next to framer-motion) for two draggable words.

## Findings

### [HIGH] PERF-01 — No `prefers-reduced-motion` gate on any animation (WebGL loop, GSAP, framer-motion, react-spring, CSS)
- **Severity:** high
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Binding, Frontend table: "`prefers-reduced-motion` MUST gate every animation — treat a missing gate as a real finding"; CLAUDE.md a11y "Respect `prefers-reduced-motion`".
- **Where:** `src/app/components/CosmicDustThree.tsx:643-797` (rAF loop, always on); `src/app/page.tsx:39-48` (shimmer, `repeat: 5`); `src/styles/globals.css:29-42` (`.animate-spin-slow`, infinite); `src/app/components/InteractiveTextSimple.tsx` (spring physics); `src/app/components/SimpleNavigation.tsx:43-80` (3 infinite ring spins).
- **Evidence:** `grep -rni "prefers-reduced-motion\|matchMedia" src/` → zero matches. The WebGL scene renders 22k particles + 1.5k stars at 60 fps unconditionally; every CSS/JS animation runs regardless of OS preference. Perf angle: continuous GPU + rAF main-thread work and battery drain for users who explicitly asked for reduced motion.
- **Proposed fix:** A single `matchMedia('(prefers-reduced-motion: reduce)')` check surfaced once (e.g. a tiny `usePrefersReducedMotion` hook or module const). In `CosmicDustThree`: render one static frame and skip re-queuing rAF (or drastically drop update rate); gate GSAP warp to a near-instant transition. Wrap `.animate-spin-slow` in `@media (prefers-reduced-motion: no-preference)`. Pass `reducedMotion="user"` to framer-motion via `MotionConfig`. needs-review: touches the Three render loop and animation timing — visual sign-off required.

### [MEDIUM] PERF-02 — Dead `next/font` Inter: preloaded on every visit, never consumed
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens §4 (font loading) / §1 (dead weight in critical path); CLAUDE.md "UI controls must be wired end-to-end" (same wiring principle: producer with no consumer).
- **Where:** `src/app/layout.tsx:1, 9-12, 37`
- **Evidence:**
  ```tsx
  const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
  ...
  <html lang='en' className={inter.variable}>
  ```
  `grep -rn "var(--font-inter)" src/` → zero matches. `next/font` registers the face under a hashed family name and injects a high-priority `<link rel="preload">` for the woff2. Every `'Inter'` in the stacks (`tailwind.config.js:10-13`, `src/styles/typography.ts:5, 28-32`, `src/styles/globals.css:20`) is the *plain* family name, which never matches the hashed `next/font` face — the preloaded ~30-45 kB woff2 competes with LCP-critical resources and renders nothing.
- **Proposed fix:** Delete the `Inter` import, the `inter` const, and `className={inter.variable}` from `src/app/layout.tsx` (fallback behaviour is unchanged — the plain `'Inter'` fallbacks only ever matched a locally installed Inter). Alternative (if Inter fallback is genuinely wanted): consume `var(--font-inter)` in the font stacks instead — but removal is the mechanical, zero-risk option.

### [MEDIUM] PERF-03 — Font delivery: primary display font not preloaded, TTF-only, 6 of 9 declared faces unused, 1.6 MB Nabla dead in artifact
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes (prune + preload + dead-asset deletion; woff2 conversion needs a one-off tool step)
- **Rule:** Lens §4 (self-hosted fonts, weights/subsets actually used); Perf binding hot spot "font loading (large custom TTFs)".
- **Where:** `src/styles/fonts.css:1-72`; `src/styles/globals.css:20` (body default = `'Alien Encounters'`); `src/app/layout.tsx` (no preload link); `public/fonts/` (9 files, ~1.81 MB total).
- **Evidence:** Every visible string on the site renders in Alien Encounters (body default + `font-alien` everywhere), yet there is no `<link rel="preload">` for `Alien-Encounters-Regular.ttf` — with `font-display: swap` this guarantees a FOUT/reflow on cold load for 100% of text. Meanwhile: `grep -rn "font-nabla\|font-alien-solid\|alienSolid\|fonts.nabla" src/app/` → zero usages. Unused faces declared in `fonts.css`: both italics (`:17-23, 33-39`), all four Solid variants (`:41-72`), and Nabla (`:1-7`). Unused binaries shipped in the standalone artifact: `Nabla-Regular-VariableFont_EDPT,EHLT.ttf` (**1,643,364 B**), 4 × Solid (~76 kB), 2 × Italic (~46 kB). Also dead: `public/workers/backgroundWorker.js` (7 kB) — `grep -rn "Worker\|workers/" src/ next.config.js` → zero references.
- **Proposed fix:** (a) Add `<link rel="preload" href="/fonts/Alien-Encounters-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous">` in `layout.tsx` (Regular is the only weight fetched on `/`; Bold only via `not-found`). (b) Remove the 7 unused `@font-face` blocks from `fonts.css` and the token entries `fonts.nabla` / `fonts.alienSolid` (`src/styles/typography.ts:28, 32`) + `nabla` / `alien-solid` families in `tailwind.config.js:12-13`. (c) Delete the unused binaries from `public/fonts/` and `public/workers/` (-1.73 MB artifact). (d) Follow-up: convert the two used TTFs to woff2 (`fonttools`/`woff2_compress`, ~55% smaller than gzipped TTF) and update `src`/`format` + the preload `type`.

### [MEDIUM] PERF-04 — Fonts served with default `max-age=0` — no immutable caching for `/fonts/*`
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens §7 (CDN/Edge: static assets with long-lived `Cache-Control`).
- **Where:** `next.config.js:12-56` (`headers()` defines only security headers)
- **Evidence:** Next serves `public/` assets with `Cache-Control: public, max-age=0` by default — every repeat visit revalidates the fonts. `_next/static/*` gets `immutable` automatically; `public/fonts/*` does not, and no `headers()` entry adds it.
- **Proposed fix:** Add to the returned array in `headers()`:
  ```js
  { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }
  ```
  Font files are content-stable (rename on change). This does not touch the CSP block, so it stays outside the needs-review carve-out.

### [MEDIUM] PERF-05 — Duplicate animation stacks: react-spring + use-gesture shipped alongside framer-motion for two draggable words
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens §1 "Duplicate dependencies — the same functionality provided by two different libraries".
- **Where:** `src/app/components/InteractiveTextSimple.tsx:4-5` (`@react-spring/web`, `@use-gesture/react`); `package.json:16, 18-19` (also `framer-motion` and `gsap` — four animation libraries total).
- **Evidence:** `InteractiveTextSimple` is the only consumer of react-spring and use-gesture (single grep hits in `src/`), used for drag + scatter-bounce of the words "RAITIS" / "KRASLOVSKIS". framer-motion — already in the First Load bundle via `LazyMotion(domAnimation)` — provides `drag`, spring transitions, and keyframe sequences natively. Estimated ~20-25 kB gz of overlapping library code on the only route.
- **Proposed fix:** Reimplement `DraggableWord`/`ScatteredLetter` with `m.div drag` + framer-motion springs/keyframes, then drop `@react-spring/web` and `@use-gesture/react` from `package.json`. needs-review: the drop/scatter/reassemble feel is hand-tuned spring physics (animation timing) — requires visual sign-off. (gsap stays: it drives the warp timeline inside the async Three chunk.)

### [MEDIUM] PERF-06 — Layout-invalidating DOM writes every animation frame (planet click-target tracking)
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens §8 "Layout thrashing"; CLAUDE.md Performance "Avoid layout thrashing".
- **Where:** `src/app/components/CosmicDustThree.tsx:782-791` (inside `animate`, runs at up to 60 fps)
- **Evidence:**
  ```ts
  clickTargetRef.current.style.left = `${screenX - hitSize / 2}px`;
  clickTargetRef.current.style.top = `${screenY - hitSize / 2}px`;
  clickTargetRef.current.style.width = `${hitSize}px`;
  clickTargetRef.current.style.height = `${hitSize}px`;
  ...
  clickTargetRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
  clickTargetRef.current.style.cursor = isVisible ? 'pointer' : 'default';
  ```
  Six style mutations per frame on a `position: fixed` element; `left/top/width/height` invalidate layout every frame on the main thread — measurable jank contribution on mid-range mobile, competing with the 60 fps budget the loop otherwise protects.
- **Proposed fix:** Give the element a fixed `width/height` once (hit size only depends on `screenSize`, which varies slowly) and move it with `style.transform = translate3d(x, y, 0) scale(s)` (compositor-only). Write `pointerEvents`/`cursor` only when `isVisible` actually flips (track previous value in a local). needs-review: it lives inside the Three render loop; verify the enlarged mobile hit target (recent fix, see `git log 6558c3d`) still lands.

### [MEDIUM] PERF-07 — Always-mounted full-screen `backdrop-filter: blur(20px)` warp overlay
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens §8 (expensive rendering on hot paths); CLAUDE.md Performance (GPU cost).
- **Where:** `src/app/components/CosmicDustThree.tsx:876-888`
- **Evidence:**
  ```tsx
  <div ref={overlayRef} style={{ position: 'fixed', inset: 0,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    opacity: 0, ... zIndex: 100 }} />
  ```
  A viewport-sized backdrop blur is one of the most expensive compositor effects on mobile GPUs. During the warp it animates opacity 0→1→0 (`:413-425`) *while* the particle warp shader is at peak load — the two stack on the exact frames most likely to drop. Some engines also pay backdrop-texture cost even at `opacity: 0` because the element remains painted.
- **Proposed fix:** Toggle `visibility: hidden`/`display: none` outside the warp window (GSAP `onStart`/`onComplete` on the overlay tweens), and consider a reduced blur radius (or plain translucent fill) on mobile. needs-review: changes warp visuals — sign-off required.

### [LOW] PERF-08 — `useDevice`: undebounced resize → per-event re-render of all consumers; redundant double detection on mount
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** CLAUDE.md Performance "Debounce expensive operations triggered by user input (resize...)"; lens §8.
- **Where:** `src/app/hooks/useDevice.ts:83-103`; consumers `src/app/components/InteractiveTextSimple.tsx:26` (one instance per `DraggableWord`)
- **Evidence:** `handleResize` calls `setDeviceInfo(detectDeviceInfo())` on every raw `resize` event; `detectDeviceInfo` returns a fresh object each time, so state identity always changes → every consumer re-renders per event (dozens/second during a drag-resize or iOS URL-bar collapse). Additionally the effect re-runs detection on mount (`:91`) even though the `useState` initializer (`:83`) already did — one guaranteed wasted render per consumer.
- **Proposed fix:** Debounce `handleResize` (~150 ms — same pattern as `CosmicDustThree.tsx:800-817`) with `clearTimeout` in cleanup, and delete the redundant `setDeviceInfo(detectDeviceInfo())` mount call. Cross-reference: per-consumer duplicated listeners/state (vs a shared context/module singleton) is **state-audit** territory — not double-reported here.

### [LOW] PERF-09 — `setTimeout`s in drag/scatter flow never cleared → setState after unmount, timers survive section switches
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens §12 (timers without cleanup); CLAUDE.md Error handling/cleanup discipline.
- **Where:** `src/app/components/InteractiveTextSimple.tsx:92-94, 132-146`
- **Evidence:** The drag-release handler schedules `scatterWord` via `setTimeout` (`:92`), and `scatterWord` schedules the 1500 ms reassembly `setTimeout` (`:132`) — neither id is stored or cleared. Navigating home → me mid-scatter unmounts `DraggableWord` (`AnimatePresence mode='wait'`, `src/app/page.tsx:135`); the pending timers still fire, calling `setIsScattered`/`setScatteredLetters`/spring `.start()` on an unmounted component.
- **Proposed fix:** Keep timeout ids in a `useRef<ReturnType<typeof setTimeout>[]>`, clear them in a `useEffect` cleanup on unmount (and clear the pending scatter timeout when a new drag starts to avoid overlapping sequences).

### [LOW] PERF-10 — Untracked GSAP tweens in section-change effect never killed
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens §12 (reactive side effects without disposal).
- **Where:** `src/app/components/CosmicDustThree.tsx:842-847`
- **Evidence:**
  ```ts
  gsap.to(planetFormRef, { current: 0, duration: 1.0, ease: 'power2.in' });
  gsap.to(portfolioBlendRef, { current: 0, duration: 1.5, ease: 'power2.inOut' });
  ```
  Unlike `warpTimelineRef` (killed at `:821`), these tweens are unreferenced — on unmount they keep mutating the refs until done. Low impact today (the component is layout-level and effectively never unmounts) but it is the one gap in an otherwise complete disposal path (`:820-837`).
- **Proposed fix:** Capture both tweens and `kill()` them in the effect's cleanup (or route them through a single tracked timeline). Mechanical cleanup only — does not alter in-flight animation timing.

### [LOW] PERF-11 — Derived nav list built with `.filter()` in the render body
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** CLAUDE.md "Memoize derived data in React — never put `.filter()` directly in a React render body"; lens §8.
- **Where:** `src/app/components/SimpleNavigation.tsx:17-36`
- **Evidence:** `navItems` (array literal) and `getVisibleNavItems()` (three `.filter()` branches) are recreated on every render. Runtime cost is negligible (3 items, renders only on section change) — flagged as a codified-rule violation, not a hot path.
- **Proposed fix:** Hoist `navItems` to module scope (`as const`) and wrap the visible-items derivation in `useMemo(..., [currentSection])`.

## Fix Plan (for the fixer)

### Quick wins (safe, mechanical — batch)
1. PERF-02 remove dead Inter `next/font` — frees a high-priority preload on every visit
2. PERF-03 prune unused `@font-face` + token/tailwind entries, add preload for Regular, delete dead binaries — -1.73 MB artifact, kills primary-font FOUT
3. PERF-04 `Cache-Control: immutable` for `/fonts/*` — repeat-visit wins
4. PERF-08 debounce `useDevice` + drop double mount detection
5. PERF-09 clear scatter timeouts on unmount
6. PERF-10 kill section-effect GSAP tweens in cleanup
7. PERF-11 memoize nav derivation

### Needs-review (visual sign-off; do individually)
1. PERF-01 reduced-motion gating (highest user impact; touches render loop + all animation layers)
2. PERF-06 transform-based click-target tracking (verify mobile hit target)
3. PERF-07 warp overlay visibility toggling / mobile blur reduction (verify warp look)
4. PERF-05 consolidate react-spring/use-gesture into framer-motion (verify drag/scatter feel), then drop the two deps

### Requires measurement
- PERF-06/PERF-07: profile a warp on a mid-range phone (Chrome DevTools performance trace) before/after — look for layout-invalidation entries per frame and GPU time during the overlay fade.
- Post-PERF-05: re-run `yarn build` and compare route `/` First Load JS against the 154 kB baseline.
