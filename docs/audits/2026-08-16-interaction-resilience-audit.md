# Interaction Resilience & Fault-Isolation Audit — rkportfolio

- **Date:** 2026-08-16
- **Lens:** `interaction-resilience-audit` (`/Users/raitiskraslovskis/projects/prompts/webapp/interaction-resilience-audit.md`)
- **Scope:** `src/**` (branch `audit/2026-08-16`)
- **Baseline (verified by orchestrator, not re-run):** `npx tsc --noEmit` exit 0, `yarn lint` clean, `yarn build` succeeds.
- **Architecture note:** No backend, no server mutations, no forms with server writes. Re-entrant *server* mutations (IR1–IR4 money/stock class) are **N/A by architecture**. This lens therefore concentrates on: fault isolation (a Three.js/WebGL crash must not blank the site), WebGL context loss, setTimeout/rAF races vs unmount, animation/render-loop teardown, and gesture/rapid-input edge cases.

## Statistics

| App | Server mutations | Guarded | Unguarded (Crit) | Error boundaries | Race/timer risks |
|-----|------------------|---------|------------------|------------------|------------------|
| rkportfolio (single app) | 0 (N/A by architecture) | n/a | n/a | **0** (no `error.tsx`, no `global-error.tsx`, no class boundary) | 5 |

**Verified-good (target state, not findings):**
- The one heavy client-side "action" — the warp (`handlePlanetClick`, `src/app/components/CosmicDustThree.tsx:391-394`) — **is** re-entry-guarded via `flyingRef`; a double click/mash no-ops. All three triggers (planet click target, nav PORTFOLIO button `src/app/components/SimpleNavigation.tsx:87-93`, MeSection PORTFOLIO button `src/app/page.tsx:85-90`) funnel into this single guarded handler.
- Every event-bus subscription returns its unsubscribe from `useEffect` (`src/app/page.tsx:108`, `src/app/components/BackgroundElements.tsx:14`, `src/app/components/SimpleNavigation.tsx:9`, `src/app/components/CosmicDustThree.tsx:840`); `src/lib/events.ts:31-38` `on()` returns a working disposer.
- `useDevice` (`src/app/hooks/useDevice.ts:94-102`) removes both `resize` and `orientationchange` listeners on cleanup.
- The main render-loop teardown (`src/app/components/CosmicDustThree.tsx:820-837`) kills the warp timeline, cancels the tracked rAF, clears the resize timer, removes the listener, and disposes all GPU resources (with the exception in IR-R1 below).
- `src/lib/gameLoop.ts` / `src/lib/input.ts` have correct start/stop + bind/unbind discipline internally, but are **imported by nothing** — dead-code angle belongs to **ui-and-modularity**, cross-referenced, not double-reported here.

---

## Findings — Fault Isolation (IR5–IR7)

### [HIGH] IR-B1 — No error boundary anywhere: one render throw blanks the entire site
- **Severity:** high
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens IR5–IR6 ("error boundaries wrap independently-failing regions; the fallback is actionable"); CLAUDE.md "Use `ErrorBoundary` components around major UI sections — a crash in one panel should not take down the entire app".
- **Where:** `src/app/` (absent files: `src/app/error.tsx`, `src/app/global-error.tsx`); tree mounted at `src/app/layout.tsx:44-46`.
- **Evidence:** `find src/app -name "error.tsx" -o -name "global-error.tsx"` returns nothing, and no class component with `componentDidCatch` exists in `src/**`. The root layout mounts `BackgroundElements` (Three.js/WebGL), `SimpleNavigation`, and the page (framer-motion + react-spring + @use-gesture) with zero boundaries between them. Any throw in render or in an effect of any of these unmounts the whole React tree — the user gets a blank cream page with no recovery path. The riskiest subtree is the WebGL background (see IR-B2), which is purely decorative: the text sections work perfectly without it.
- **Proposed fix:** Add `src/app/error.tsx` (client component: minimal on-brand "something broke — reload" card with a `reset()` button) and `src/app/global-error.tsx` for layout-level throws. Both are additive new files, no `src` edits, no visual change on the happy path. Optionally (follow-up, needs-review because it edits the layout) wrap `<BackgroundElements />` in a tiny boundary whose fallback is `null` so a background crash silently removes the background instead of the site.

### [HIGH] IR-B2 — `new THREE.WebGLRenderer()` throws unguarded when WebGL is unavailable → blank site instead of degraded background
- **Severity:** high
- **Fix risk:** needs-review (inside the Three.js setup path)
- **Auto-fixable:** no
- **Rule:** Lens IR5 (fault isolation for risky third-party init); CLAUDE.md "Every `async`/risky path must surface errors, never crash the app".
- **Where:** `src/app/components/CosmicDustThree.tsx:448` (constructor), mounted unconditionally from the root layout via `src/app/components/BackgroundElements.tsx:16` / `src/app/layout.tsx:44`.
- **Evidence:** three 0.182 throws synchronously when context creation fails — `node_modules/three/build/three.module.js:15917/15921` (`throw new Error('Error creating WebGL context…')`). The call sits bare inside `useEffect` (`CosmicDustThree.tsx:432-452`) with no `try/catch`. An effect throw propagates to the nearest error boundary; per IR-B1 there is none, so on any browser/device with WebGL disabled or a blocklisted GPU the **entire portfolio renders blank**, even though every section is plain DOM and fully usable without the particle background.
- **Proposed fix:** Wrap the scene setup in `try/catch`; on failure, log (dev-guarded) and `return` from the effect leaving the background empty — the site keeps working. Pair with IR-B1's null-fallback boundary for defence in depth. Needs a manual visual check that the happy path is untouched (render-loop file).

---

## Findings — WebGL Context Loss (IR5/IR9 applied to the render loop)

### [LOW] IR-B3 — Context loss: three's built-in restore covers the main case; residual gap is a zombie-ticking loop and no fallback if restore never comes
- **Severity:** low
- **Fix risk:** needs-review (render loop)
- **Auto-fixable:** no
- **Rule:** Lens IR9 ("a render loop survives context loss"); orchestrator focus item.
- **Where:** `src/app/components/CosmicDustThree.tsx:448-452` (renderer creation, no app-level `webglcontextlost`/`webglcontextrestored` listeners), `:643-795` (rAF loop).
- **Evidence:** Traced into three 0.182: `WebGLRenderer` registers its own `webglcontextlost` handler that calls `event.preventDefault()` (which is what allows the browser to restore) and a `webglcontextrestored` handler that re-runs `initGLContext()` (`node_modules/three/build/three.module.js:15903-15904`, `16596-16626`). So after a mobile-Safari memory-pressure context drop, the background **does** come back automatically — this is *not* the unhandled-context-loss hole it first appears to be. The residual gaps: (1) the app's rAF loop keeps running full-rate during loss — `renderer.render` no-ops internally, but all the per-frame uniform/orbit math (`:669-791`) still burns CPU/battery; (2) the adaptive-quality logic (`:650-661`) sees artificially high FPS during loss and scales `drawRange` back up; (3) if the browser never restores, the background is silently gone with no reload affordance (acceptable for a decorative layer).
- **Proposed fix (optional):** Add app-level listeners on `renderer.domElement`: on `webglcontextlost` pause the loop (`cancelAnimationFrame(frameIdRef.current)`) and freeze the FPS accumulator; on `webglcontextrestored` reset `lastTimestamp = 0` and restart. Do not call `preventDefault` yourself (three already does). Manual test: `renderer.forceContextLoss()` from devtools.

---

## Findings — Async / Timer Races (IR8–IR10)

### [HIGH] IR-R2 — Warp timeline force-navigates to portfolio 3.8s later, clobbering a fresher user navigation; killing it is impossible, so mid-warp nav also spawns fighting GSAP tweens
- **Severity:** high
- **Fix risk:** needs-review (animation timing + GSAP timeline)
- **Auto-fixable:** no
- **Rule:** Lens IR9 ("an out-of-order async result can't clobber fresh state — last user action wins").
- **Where:** `src/app/components/CosmicDustThree.tsx:406-429` (timeline), `:416` (`.call(() => { emit('navigate', 'portfolio'); }, [], 3.8)`), `:842-847` (section-change effect), `src/app/components/SimpleNavigation.tsx:87-93` (nav stays live during warp).
- **Evidence — symptom 1 (forced navigation):** On the `me` section the nav shows HOME PLANET + PORTFOLIO. Click PORTFOLIO → warp starts (10.5s timeline). Within the first 3.8s the nav is still fully clickable; click HOME PLANET → `emit('navigate','home')` lands the user home — then at t=3.8s the still-running timeline fires `emit('navigate', 'portfolio')` and yanks the user to portfolio against their latest choice. Nothing kills `warpTimelineRef.current` except full unmount (`:821`), and the background component never unmounts (root layout).
- **Evidence — symptom 2 (tween fight):** Navigate away from portfolio between t≈5.5s and 10.5s (while the timeline's `.to(planetFormRef, { current: 1, duration: 5.0 }, 5.5)` at `:426-428` is active). The `[section]` effect at `:842-847` starts `gsap.to(planetFormRef, { current: 0, duration: 1.0 })`. GSAP's default is `overwrite: false`, so **both** tweens write `planetFormRef.current` every tick; when the 1s tween finishes, the timeline tween wins back the value and the planet visibly re-forms on the wrong section until t=10.5s. `flyingRef` also stays `true` until 10.5s, blocking planet clicks meanwhile.
- **Proposed fix:** Subscribe to `navigate` (or extend the `[section]` effect): if `flyingRef.current` and the target section is not `portfolio`, `warpTimelineRef.current?.kill()`, reset `flyingRef.current = false`, and tween `uWarpProgress`, the overlay, `portfolioBlendRef`, and `planetFormRef` back to rest with `overwrite: 'auto'` so only one tween per target survives. Alternative (simpler UX): suppress/disable nav while `flyingRef.current` is true — but that trades a race for a 10.5s lockout, so prefer the kill path. Requires manual visual review of the interrupted-warp look.

### [MEDIUM] IR-R1 — First rAF id never stored: unmount before frame 1 leaves an uncancellable zombie render loop
- **Severity:** medium
- **Fix risk:** needs-review (render loop — but a one-line change)
- **Auto-fixable:** no (per gate policy: render-loop edits get human eyes)
- **Rule:** Lens IR9 ("no work after unmount"); CLAUDE.md leak checklist.
- **Where:** `src/app/components/CosmicDustThree.tsx:797` vs `:794` and cleanup `:822`.
- **Evidence:** The loop re-arms itself with `frameIdRef.current = requestAnimationFrame(animate)` (`:794`), but the kickoff call is bare: `requestAnimationFrame(animate);` (`:797`). If cleanup runs before the first frame executes — exactly what React StrictMode's dev mount→cleanup→remount does (Next 15 defaults `reactStrictMode` on; `next.config.js` does not disable it) — `cancelAnimationFrame(frameIdRef.current)` cancels id `0` (a no-op) and the pending callback survives. `animate` then runs against the disposed, force-context-lost renderer and re-schedules itself **every frame forever**: a permanent orphan loop doing full per-frame math alongside the real one. In production the component currently never unmounts, so this is primarily a dev-correctness/StrictMode issue — but it becomes a real leak the moment the background is ever conditionally mounted.
- **Proposed fix:** `frameIdRef.current = requestAnimationFrame(animate);` at `:797`. Additionally, an `animate`-side guard (`if (!rendererRef.current) return;` set to null in cleanup) makes the loop self-terminating regardless of cancellation order.

---

## Findings — Gesture & Rapid Input (IR11–IR13)

### [MEDIUM] IR-G1 — DraggableWord: untracked setTimeout chain — re-drag mid-drop rips the word out of the user's hand; timers fire after unmount; overlapping chains fight
- **Severity:** medium
- **Fix risk:** needs-review (deliberate change to gesture/animation flow)
- **Auto-fixable:** no
- **Rule:** Lens IR9/IR12 ("no state writes after unmount; drag handlers survive chaotic input"); CLAUDE.md "every timer scheduled in a component needs cleanup".
- **Where:** `src/app/components/InteractiveTextSimple.tsx:92-94` (scatter timer, 100–400ms after release), `:132-146` (reassembly timer, 1500ms after scatter), `:64-102` (drag handler with no re-entry guard).
- **Evidence — data flow:** Every drag release unconditionally schedules `setTimeout(() => scatterWord(...), scatterDelay)` (`:92`). Neither timer id is stored; there is no `useEffect` cleanup and no generation/re-entry guard.
  1. **Re-drag mid-drop (rapid repeat trigger):** release → drop starts → user grabs the word again within the ≤400ms window → the pending scatter timer fires mid-drag → `setIsScattered(true)` (`:105`) swaps the render branch (`:149-164`), unmounting the `animated.div` that owns the active gesture while the pointer is still down. The word explodes out of the user's hand; `isDragging` is left `true` (stuck `grabbing` cursor / `zIndex: 100` at `:176-178`) because the gesture target died before the release event.
  2. **Overlapping chains:** two quick release cycles queue two scatter timers and two 1500ms reassembly timers; an old reassembly timer fires during a newer scatter, calling `setIsScattered(false)` + starting return springs (`:133-145`) at the wrong moment — the scatter is cut short and letters snap home mid-flight.
  3. **Unmount race:** navigating home → ME during a drop/scatter unmounts `InteractiveText` (AnimatePresence, `src/app/page.tsx:135-137`) with both timers still pending → `setIsScattered`/`setScatteredLetters` on an unmounted component (silent no-op in React 19, but orphan timers + closures survive up to ~1.9s).
- **Proposed fix:** Keep both timer ids in refs; `clearTimeout` both (a) at the start of every new `active` drag phase and (b) in a `useEffect(() => () => {...}, [])` cleanup. Guard `scatterWord` re-entry (`if (isScattered) return;` or a monotonically increasing drag-generation counter checked inside each timer callback). Reset `isDragging` when entering the scattered branch. Manual review needed: the cancel-on-new-drag rule intentionally changes the (currently glitchy) rapid-drag behaviour.

### [LOW] IR-G3 — Drop floor `screenHeight - 300` is unclamped: on short landscape viewports the "drop" goes upward off-layout
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens IR11 ("raw values are clamped before reaching layout math").
- **Where:** `src/app/components/InteractiveTextSimple.tsx:79-81`.
- **Evidence:** `const floorY = screenHeight - 300;` with `screenHeight = window.innerHeight`. On a landscape phone (e.g. iPhone SE landscape, `innerHeight ≈ 375`) `floorY ≈ 75` — above/at the word's resting position, so "gravity" animates the word *upward* into the nav area, and `dropDistance` goes ~0/negative (scatter fires at the clamped 100ms floor from `:91`, so no NaN — verified). Purely a geometry oddity, no crash.
- **Proposed fix:** Clamp: `const floorY = Math.max(initialY + 60, screenHeight - 300);` (or proportional: `screenHeight * 0.65`). Mechanical guard, only active on degenerate viewports. Cross-ref: general small-viewport layout belongs to **mobile-ux**; only the un-clamped math is claimed here.

### [LOW] IR-N1 — 10.5s warp has a correct re-entry guard but zero pending affordance for its first ~3s
- **Severity:** low
- **Fix risk:** needs-review (UX/visual judgement)
- **Auto-fixable:** no
- **Rule:** Lens principle 3 ("pending state is visible — the user sees the click registered and doesn't re-mash out of uncertainty").
- **Where:** `src/app/components/SimpleNavigation.tsx:86-97`, `src/app/page.tsx:85-90` (triggers); guard at `src/app/components/CosmicDustThree.tsx:391-392`.
- **Evidence:** Clicking PORTFOLIO starts a 4s ease-in on `uWarpProgress` (`:410-412`); for roughly the first 2–3s the warp is barely perceptible and the buttons show no pressed/disabled state, so users re-click (harmlessly no-oped by `flyingRef`, but with zero feedback) or click elsewhere — which is what arms IR-R2. Guard exists; only the visibility half of the principle is missing.
- **Proposed fix:** While `flyingRef` is active, reflect it in the triggers (e.g. emit a `warp-started` event; nav dims/disables PORTFOLIO, or a subtle immediate screen response in the first 300ms). Pure design call — bundle with the IR-R2 fix since they share the "nav during warp" seam.

---

## Fix Plan

### Phase A — Shared primitives (do first)
- Add `src/app/error.tsx` + `src/app/global-error.tsx` (IR-B1). This repo has no shared `ErrorBoundary` primitive; these two Next-idiomatic files *are* the primitive for a single-route app. Optional: a tiny `<SilentBoundary fallback={null}>` for the background layer.

### Phase B — Fault isolation on the WebGL layer
- IR-B2: try/catch around Three setup with graceful no-background bail. (needs-review)

### Phase C — Timer/animation races
- IR-R2: kill-warp-on-navigate + `overwrite: 'auto'` + `flyingRef` reset. (needs-review, highest behavioural value)
- IR-R1: store the kickoff rAF id; optional self-terminating loop guard. (needs-review, one-liner)
- IR-G1: tracked + cleaned scatter/reassembly timers, re-entry guard. (needs-review)

### Phase D — Input clamps and affordances
- IR-G3: clamp `floorY`. (safe)
- IR-N1: pending affordance during warp — bundle with IR-R2. (needs-review)

### Cross-references (not double-reported)
- Mirrored `currentSection` state in `SimpleNavigation` + `HomePage` synced via two events → **single-source-of-truth-audit**.
- Dead `setCurrentX`/`setCurrentY` in `ScatteredLetter` (`InteractiveTextSimple.tsx:203-204`) → **state-audit**.
- Unused `src/lib/gameLoop.ts` / `src/lib/input.ts` modules → **ui-and-modularity-audit**.
- Missing `prefers-reduced-motion` gating on the warp/particle/scatter animations (binding says treat as real) → **mobile-ux-audit** / accessibility seam.
- Resize handler not re-deriving DPR/particle budget → **performance-audit**.
