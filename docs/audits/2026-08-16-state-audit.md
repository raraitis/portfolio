# State Architecture & Mutation Flow Audit — rkportfolio
Generated: 2026-08-16
Lens: `state-audit` | Scope: `src/**` | Branch: `audit/2026-08-16`

## Baseline (recorded, not re-run)
`npx tsc --noEmit` exit 0 · `yarn lint` clean · `yarn build` succeeds (verified by orchestrator).

## Architecture note (binding)
No state library by design. Architecture is React 19 hooks + a typed event bus
(`src/lib/events.ts`). The bus is the "store seam" for this audit; findings are judged
within that architecture — no store library is proposed.

## Executive Summary
The app is small (one route, 6 components) and mostly healthy: no server data, no
fetching, so the entire mutation-flow family (M1–M5) is **N/A by architecture**
(verified: zero `fetch`/`axios`/`localStorage`/`router.refresh` in `src/**`). The real
issues are classic hand-rolled-sync problems: the single most important piece of app
state (`currentSection`) is stored in **three** components and kept in sync via **two**
redundant event channels; the interactive-name animation leaks un-cleaned timers that
write state after unmount; and `useDevice` re-renders every consumer on every resize
pixel because it never bails out on equal values. Two mechanical prop-mirroring /
inline-derivation violations round it out.

## Statistics
| App | Route components | Critical | High | Medium | Low |
|-----|------------------|----------|------|--------|-----|
| rkportfolio (`src/app`) | 1 (`page.tsx`) + 5 components | 0 | 1 | 3 | 3 |

## Component State Inventory
| # | Component | local state | effects | refs | Lines | Notes |
|---|-----------|-------------|---------|------|-------|-------|
| 1 | `src/app/components/CosmicDustThree.tsx` | 0 | 4 | 16 | 893 | All state in refs/Three objects — see cross-cutting P5 note |
| 2 | `src/app/components/InteractiveTextSimple.tsx` | 5 (3 in DraggableWord, 2 dead in ScatteredLetter) | 0 | 1 + untracked timers | 294 | STATE-02, STATE-03, STATE-04 |
| 3 | `src/app/page.tsx` (HomePage) | 1 | 1 | 0 | 141 | Owner of `currentSection` — the correct owner |
| 4 | `src/app/hooks/useDevice.ts` | 1 (object) | 1 | 0 | 121 | STATE-03, STATE-05 (unused hooks) |
| 5 | `src/app/components/SimpleNavigation.tsx` | 1 (duplicate) | 1 | 0 | 105 | STATE-01, STATE-06 |
| 6 | `src/app/components/BackgroundElements.tsx` | 1 (duplicate) | 1 | 0 | 21 | STATE-01 |

## Event-bus map (traced)
| Event | Emitters | Listeners |
|-------|----------|-----------|
| `navigate` | `SimpleNavigation.tsx:13`, `CosmicDustThree.tsx:416` (warp timeline, t=3.8s) | `page.tsx:108` |
| `section-changed` | `page.tsx:105` | `SimpleNavigation.tsx:9` |
| `background-section` | `page.tsx:104` (always alongside `section-changed`, same payload) | `BackgroundElements.tsx:14` |
| `warp-trigger` | `page.tsx:86`, `SimpleNavigation.tsx:89` | `CosmicDustThree.tsx:840` |
| `game-start` / `game-pause` / `game-resume` / `game-score` | none | none |

## Findings

### [HIGH] STATE-01 — `currentSection` stored in 3 components, synced via 2 redundant event channels
- **Severity:** high
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens core principle 2 ("Derived state is computed, not synced") + CLAUDE.md "State must have a single source of truth. Never store the same value in two places." Duplicated-pattern threshold: 3 files = High.
- **Where:** `src/app/page.tsx:100,103-105` · `src/app/components/SimpleNavigation.tsx:7,9,12` · `src/app/components/BackgroundElements.tsx:12,14` · `src/lib/events.ts:7-10`
- **Evidence:** The same `SectionName` value lives in three separate `useState`s. `HomePage.navigateToSection` broadcasts it twice with identical payloads:
  ```tsx
  // page.tsx:103-105
  setCurrentSection(section);
  emit('background-section', section);
  emit('section-changed', section);
  ```
  `SimpleNavigation.handleNavigate` (lines 12-13) writes its local copy optimistically *and* then receives the `section-changed` echo of its own `navigate` emit — a double write over two paths. `background-section` and `section-changed` are never emitted independently; they are one state change wearing two names. Any future emitter that fires one but not the other silently desyncs nav from background.
- **Proposed fix:** Keep `HomePage` as the single owner. (1) Collapse to one event: delete `background-section` from `EventMap` and emit only `section-changed`; `BackgroundElements` subscribes to `section-changed`. (2) Make `SimpleNavigation` subscribe-only: delete the local `setCurrentSection(section)` at line 12 (the synchronous echo already updates it in the same batch). The two remaining copies (`SimpleNavigation`, `BackgroundElements`) become pure bus-derived mirrors with a single channel — the minimal shape this no-store architecture allows. Needs-review because event ordering feeds the warp choreography (`CosmicDustThree.tsx:416` → section prop → blend-reset effect at `CosmicDustThree.tsx:842-847`); verify the warp-in and warp-out transitions visually after the change.

### [MEDIUM] STATE-02 — DraggableWord schedules scatter/reassembly timers with no cleanup; overlapping drags race
- **Severity:** medium
- **Fix risk:** needs-review (animation timing)
- **Auto-fixable:** no
- **Rule:** Lens P6 ("timer state… cleanup often missing on unmount") / P7 (async without cancellation → state write after unmount); CLAUDE.md timer/listener cleanup discipline.
- **Where:** `src/app/components/InteractiveTextSimple.tsx:92-94` (scatter timeout) and `:132-146` (1500 ms reassembly timeout)
- **Evidence:**
  ```tsx
  // 92-94 — fires scatterWord after up to 400ms, id discarded
  setTimeout(() => {
    scatterWord(ox, oy + dropDistance * 0.6);
  }, scatterDelay);
  // 132 — reassembly, id also discarded
  setTimeout(() => { setIsScattered(false); setScatteredLetters([]); ... }, 1500);
  ```
  Neither timeout id is stored, and the component has no cleanup effect. Two consequences: (a) navigating away mid-drag (AnimatePresence unmounts `InteractiveText` when the user hits ME) lets both timers fire against an unmounted component — `setIsScattered`/`setScatteredLetters` become stale writes and `wordX.start(...)` drives springs of a dead element; (b) releasing a second drag before the first scatter timer fires stacks two scatter→reassemble sequences whose `setIsScattered(false)` calls interleave.
- **Proposed fix:** Hold both timeout ids in refs; clear them in a `useEffect` cleanup on unmount, and clear any pending pair at the start of each new drag release before scheduling. Marked needs-review because the timers *are* the animation choreography — the fix must not change the 60 %-drop / 1500 ms feel; verify the drag-scatter-reassemble cycle visually. Cross-reference: the *behavioural* race (a second interaction clobbering an in-flight sequence) is **interaction-resilience** territory; reported here only as missing timer-state hygiene.

### [MEDIUM] STATE-03 — `useDevice` publishes a fresh 12-field object per resize event with no equality bail-out; consumers read one field
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens M6-analog ("store reads too broad — any field change re-renders", applied to the hook seam); CLAUDE.md "Prefer coarse-grained store reads" / memoize derived data.
- **Where:** `src/app/hooks/useDevice.ts:83-106` (esp. 87 and 91) · consumer `src/app/components/InteractiveTextSimple.tsx:26,29-49,57`
- **Evidence:**
  ```ts
  const handleResize = () => { setDeviceInfo(detectDeviceInfo()); };  // :86-88
  // Initial detection
  setDeviceInfo(detectDeviceInfo());                                   // :91
  ```
  `detectDeviceInfo()` returns a new object every call, so React can never bail out: every `resize`/`orientationchange` event re-renders every consumer even when nothing changed, and the mount-time re-set at line 91 is redundant (the `useState(() => detectDeviceInfo())` lazy initializer at line 83 already ran with real `window` values) — it guarantees one wasted render per mount. `DraggableWord` consumes only `isMobile` (line 57 and the `springConfig` selection) yet subscribes to all 12 fields, and rebuilds the `springConfig` object (lines 29-49) on every one of those renders without `useMemo`.
- **Proposed fix:** (1) In `handleResize`, shallow-compare the freshly detected info against current state and skip `setDeviceInfo` when equal (or use the functional form: `setDeviceInfo(prev => shallowEqual(prev, next) ? prev : next)`). (2) Delete the redundant initial `setDeviceInfo` at line 91. (3) In `DraggableWord`, wrap `springConfig` in `useMemo` keyed on `device.isMobile`. All three changes are mechanical and identity-preserving. Cross-reference: debouncing the resize listener itself / render-cost profiling is **performance-audit** (§8) territory.

### [MEDIUM] STATE-04 — ScatteredLetter mirrors props into state that is never updated
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens P4 (derived/mirrored state instead of direct use); CLAUDE.md single-source-of-truth for values.
- **Where:** `src/app/components/InteractiveTextSimple.tsx:203-204` (used at 217-237)
- **Evidence:**
  ```tsx
  const [currentX, setCurrentX] = useState(x);
  const [currentY, setCurrentY] = useState(y);
  ```
  `setCurrentX`/`setCurrentY` are never called anywhere in the file — `currentX`/`currentY` are frozen copies of the `x`/`y` props feeding the `useSpring` bounce sequence. If a parent ever re-rendered a letter with new coordinates (today masked by scatter keys), the letter would silently animate around stale positions.
- **Proposed fix:** Delete both `useState` lines and use the `x`/`y` props directly in the `useSpring` config. Provably behavior-identical since the setters are never invoked (the spring already captures its `from`/`to` at mount).

### [LOW] STATE-05 — Dead state infrastructure staged "for later" with zero consumers
- **Severity:** low
- **Fix risk:** safe (build-wise)
- **Auto-fixable:** no (product judgement — staged game feature)
- **Rule:** CLAUDE.md store-field discipline: "Never add a field 'for later' without at least one consumer. Orphan fields accumulate and confuse future sessions."
- **Where:** `src/lib/gameLoop.ts:1-51` (whole module) · `src/lib/input.ts:1-75` (whole module) · `src/lib/events.ts:12-15` (`game-start`/`game-pause`/`game-resume`/`game-score`) · `src/app/hooks/useDevice.ts:109-122` (`useIsMobile`/`useIsTablet`/`useIsDesktop`)
- **Evidence:** Grep over `src/**` finds zero importers of `gameLoop.ts` or `input.ts`, zero emitters/listeners for the four `game-*` events, and zero consumers of the three convenience hooks. `GameSection.tsx` is a static "COMING SOON" placeholder. `gameLoop.ts` and `input.ts` both hold module-level mutable state machines (`running/paused/subscribers`, `pressed/justPressed` + global key listeners) that nothing drives.
- **Proposed fix:** Either delete `gameLoop.ts`, `input.ts`, the four `game-*` EventMap entries, and the three unused device hooks until the game ships, or keep exactly one wired consumer. Requires the owner's call on the staged feature, hence not auto-fixable. Cross-reference: dead-file removal lever also falls under **ui-and-modularity**; consolidate there if both lenses run.

### [LOW] STATE-06 — SimpleNavigation derives visible items via inline `.filter()` in the render body, keyed on display strings
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** CLAUDE.md "Never put `.filter()` directly in a React render body — wrap in `useMemo`"; derived state should be declaratively computed.
- **Where:** `src/app/components/SimpleNavigation.tsx:17-36`
- **Evidence:** `navItems` is rebuilt and `getVisibleNavItems()` runs three `.filter()` passes on every render, and visibility is matched on display copy (`item.word === 'HOME PLANET'`, `'ME'`, `'PORTFOLIO'`) rather than the typed `item.section` — renaming a label silently breaks nav visibility while still type-checking.
- **Proposed fix:** Hoist `navItems` to module scope with a `visibleOn: SectionName[]` field per item, and derive `visibleItems` with `useMemo(() => navItems.filter(i => i.visibleOn.includes(currentSection)), [currentSection])`. Mechanical; no visual change.

### [LOW] STATE-07 — `warp-trigger` subscription pins the first-render closure of a render-scoped handler
- **Severity:** low
- **Fix risk:** needs-review (warp seam)
- **Auto-fixable:** no
- **Rule:** Lens effect-hygiene (stale-closure trap in a bus subscription); contrast with the house pattern at `page.tsx:102-108` (stable `useCallback` + dep-tracked subscription).
- **Where:** `src/app/components/CosmicDustThree.tsx:391-430` (handler) and `:840` (`useEffect(() => on('warp-trigger', handlePlanetClick), [])`)
- **Evidence:** `handlePlanetClick` is recreated every render, but the empty-dep effect registers only the first render's closure. It is safe *today* solely because the handler reads nothing but refs (`flyingRef`, `animTimeRef`, `particlesRef`, …) — an invariant that is nowhere documented. The first prop/state read added to this handler will silently go stale for bus-triggered warps while staying fresh for the click-target path (line 867 re-binds per render), producing a divergence that only reproduces via the PORTFOLIO buttons.
- **Proposed fix:** Wrap `handlePlanetClick` in `useCallback` with `[]` deps (or define it inside the subscription effect) and add a one-line comment stating the refs-only constraint. Needs-review because it sits directly on the warp/GSAP seam.

## Cross-Cutting Notes (not double-reported)
- **P5 / god component:** `CosmicDustThree.tsx` is 893 lines (critical by the lens line-count table) but holds **zero** React state — its bulk is shader source and scene setup, and its 16 refs are the correct escape hatch for a rAF loop. There is no state-reduction lever here; the file-split lever (extract shaders/config) belongs to **ui-and-modularity (L9)**.
- **Warp vs. user navigation race:** clicking ME or HOME PLANET during the 10.5 s warp timeline gets clobbered at t=3.8 s when the timeline force-emits `navigate('portfolio')` (`CosmicDustThree.tsx:416`), and `flyingRef` stays latched until t=10.5 s. Out-of-order-async-clobbers-fresh-state is **interaction-resilience** territory per the ownership boundaries — flagged there, not scored here.
- **`useDevice` hydration divergence** (server defaults vs. client lazy init) is a rendering-correctness concern outside this lens; noting for **interaction-resilience/performance** triage.
- **M1–M6 (mutation flow):** N/A by architecture. No server data, no fetch layer, no persistence, no `router.refresh()` anywhere in `src/**` (verified by grep).

## Fix Plan
### Phase A — Shared infrastructure
1. STATE-01 — collapse to one `section-changed` channel, single owner in `HomePage`, subscribe-only mirrors (needs-review: verify warp transitions).
### Phase B — Correctness under interaction
2. STATE-02 — track + clean DraggableWord timers (needs-review: preserve animation feel).
3. STATE-03 — equality bail-out in `useDevice`, drop redundant mount set, memoize `springConfig` (safe).
### Phase C — Mechanical cleanup
4. STATE-04 — delete ScatteredLetter prop-mirror state (safe).
5. STATE-06 — memoized, section-keyed nav visibility (safe).
6. STATE-07 — stabilize + document `handlePlanetClick` (needs-review).
### Phase D — Owner decision
7. STATE-05 — remove or wire the staged game/device-hook infrastructure.
