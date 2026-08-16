# 2026-08-16 — comment-debloat-sweep

- **Lens:** comment-debloat-sweep (`/Users/raitiskraslovskis/projects/prompts/webapp/comment-debloat-sweep.md`)
- **Scope:** `src/**` (all 20 files read in full; `out/` excluded per binding)
- **Baseline (recorded, verified by orchestrator, not re-run):** `npx tsc --noEmit` exit 0; `yarn lint` clean; `yarn build` succeeds.
- **Mode:** report-only. No edits made.

Severity mapping for this cosmetic lens: comments that **contradict current behavior** or preserve **dead code as comments** → medium; history-narration / tuning-diary / restatement one-liners → low. Nothing here is functional, so no high/critical.

---

### [MEDIUM] CD-01 — Dead disabled-effect blocks preserved as comments
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens anti-pattern "Don't preserve the deleted text as a comment for git history"; Hard Rule 3 (no history narration — "disabled for better performance" / "to prevent infinite re-render loops" are decision/bug post-mortems).
- **Where:** src/app/components/InteractiveTextSimple.tsx:59-62, src/app/components/InteractiveTextSimple.tsx:206-209 (+ orphaned import at src/app/components/InteractiveTextSimple.tsx:3)
- **Evidence:**
  ```tsx
  // Gravitational influence effect disabled for better performance in fixed position
  // useEffect(() => {
  //   // Gravitational effects disabled when name is in fixed top-left position
  // }, []);
  ```
  and
  ```tsx
  // Gravitational influence disabled for performance - scattered letters remain static
  // useEffect(() => {
  //   // Gravitational effects disabled to prevent infinite re-render loops
  // }, []);
  ```
  `useEffect` (imported line 3) is referenced **only** inside these commented blocks — it is a dead import today (`rg -n "useEffect" src/app/components/InteractiveTextSimple.tsx` → lines 3, 60, 207 only).
- **Proposed fix:** Delete lines 59-62 and 206-209 entirely (no replacement comment — the feature does not exist). In the same commit, drop `useEffect` from the import on line 3: `import React, { useRef, useState } from 'react';`. Gate: `npx tsc --noEmit` + `yarn lint`.

### [MEDIUM] CD-02 — Comments describe "gravitational influence" that does not exist
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 3 (describe the code as it is now). These comments narrate a removed feature as if active — actively misleading.
- **Where:** src/app/components/InteractiveTextSimple.tsx:219, 221, 227, 233-234
- **Evidence:** In `ScatteredLetter`, `currentX`/`currentY` are constants (`useState(x)` / `useState(y)`; setters never called — the gravity effect that moved them is the deleted block in CD-01), yet the spring sequence claims:
  ```tsx
  // Bounce sequence with gravitational influence
  ...
  x: currentX, // Use gravity-influenced position
  ...
  x: currentX, // Gravity keeps influencing
  ...
  x: currentX, // Final gravity-influenced position
  y: currentY, // Final position
  ```
- **Proposed fix:** Replace line 219 with `// Bounce sequence: up, quick drop, settle` (or delete). Delete the trailing comments on lines 221, 227, 233, 234. Keep the geometry trailing comments (`// Bounce up`, `// Quick drop`) or delete — they restate the math; recommended: delete.

### [MEDIUM] CD-03 — Stale floor-drop comment contradicts the code (50px vs 300px)
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 3 (current-state only). The numbers narrate an earlier tuning value and now lie about behavior.
- **Where:** src/app/components/InteractiveTextSimple.tsx:79-81
- **Evidence:**
  ```tsx
  // Floor collision - drop almost to bottom of page (only 50px from bottom)
  const screenHeight =
    typeof window !== 'undefined' ? window.innerHeight : 700;
  const floorY = screenHeight - 300; // Almost to the very bottom
  ```
  The code drops to 300px above the bottom; both "50px" and "almost to the very bottom" are false.
- **Proposed fix:** Delete the trailing comment on line 81; replace line 79 with a single accurate line: `// Drop floor: 300px above the viewport bottom, then scatter mid-fall`.

### [LOW] CD-04 — Tuning-diary comments (comparative "reduced/faster/shorter" narration)
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 3 — comparative phrasing ("reduced", "faster", "shorter", "even larger", "optimized", "Remove bounds") describes the journey relative to values that no longer exist in the file, not the current state.
- **Where:** src/app/components/InteractiveTextSimple.tsx:32, 37, 42, 47, 51, 72, 87, 91, 93, 100, 114, 131, 136, 139, 146, 239
- **Evidence (representative):**
  ```tsx
  ? { tension: 300, friction: 25 } // Reduced tension for better mobile performance
  ...
  wordScale.start({ to: 1.1, config: springConfig.scale }); // Use optimized config
  ...
  const randomDistance = 120 + Math.random() * 250; // Even larger scatter radius
  ...
  // Reduced delay - magnet reassembly starts faster
  ...
  }, 1500); // Shorter display time
  ...
  config: { tension: 250, friction: 20 }, // More responsive bounce
  ```
- **Proposed fix (mechanical deletions/rewrites):**
  - Delete trailing comments at 32, 37, 42, 47, 51, 72, 87, 139, 146, 239, 114.
  - Line 91 (`// Proportional to drop distance`) — keep only if line 90 is trimmed per CD-05; otherwise delete (the clamp expression says it).
  - Line 93 trailing `// Scatter from 60% down position` — delete (covered by the kept rationale on line 90, see CD-05).
  - Line 100 `// Remove bounds to allow free movement` → `// No bounds — free movement` or delete.
  - Lines 131 + 136 → collapse to one current-state line above the timeout: `// After 1.5s, reassemble: spring letters back and restore scale`.

### [LOW] CD-05 — Comments that restate the adjacent code
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 2 — default to no comment unless the WHY is non-obvious.
- **Where:**
  - src/app/components/InteractiveTextSimple.tsx:30, 35, 40, 45, 53, 56, 69, 74, 76, 84, 90, 107-109, 112-113, 116, 123, 150, 166, 269, 275, 283
  - src/app/page.tsx:10 (`// ME Section Component`), 98 (`// Main Component`)
  - src/app/components/SimpleNavigation.tsx:16 (`// Define navigation items`), 23, 28, 31 (visibility comments restate the exact `filter` predicates below them)
  - src/app/hooks/useDevice.ts:52 (`// Device type detection`), 55, 58, 90 (`// Initial detection`), 93 (`// Listen for resize events`), 96
- **Evidence (representative):** `{/* RAITIS - First name */}` above `<DraggableWord word='RAITIS' ...>`; `// Choose appropriate text styles based on device type` above `device.isMobile ? nameTextMobile : nameText`; `// Filter navigation items based on current section` above `getVisibleNavItems`.
- **Proposed fix:** Delete all listed lines, with two rewrites that carry a real WHY:
  - InteractiveTextSimple.tsx:90-91 → keep one line: `// Scatter at ~60% of the drop so both the fall and the burst are visible`.
  - InteractiveTextSimple.tsx:30/35/40/45 sub-labels are redundant with the key names (`scale`, `drop`, `return`, `resetScale`) — delete; keep the single header at line 28 (`// Mobile-optimized spring configurations`).
  - useDevice.ts:62 (`// Additional mobile detection (beyond just screen size)`) is a genuine WHY — keep (listed here only to mark it as deliberately retained).

### [LOW] CD-06 — Render-loop comment narrates the pre-GPU-migration implementation
- **Severity:** low
- **Fix risk:** needs-review (comment-only edit, but it sits inside the Three.js render loop — reviewer must confirm the diff touches no code characters)
- **Auto-fixable:** yes
- **Rule:** Hard Rule 3 — "replaces 352KB buffer uploads" describes what the code superseded (the CPU per-particle path removed in commit b8d1494), not what it does.
- **Where:** src/app/components/CosmicDustThree.tsx:717
- **Evidence:**
  ```ts
  // Update uniforms (replaces 352KB buffer uploads with ~20 floats)
  ```
- **Proposed fix:** Rewrite to current-state: `// Per-frame GPU work is ~20 floats of uniforms — no per-particle buffer writes`.

### [LOW] CD-07 — Event-bus header narrates the window-globals migration
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 3 ("replacing window globals" = migration history); "Scales cleanly for future features" is justification filler.
- **Where:** src/lib/events.ts:1-2
- **Evidence:**
  ```ts
  // Type-safe event bus — lightweight pub/sub replacing window globals.
  // Scales cleanly for future features (game section, etc.).
  ```
- **Proposed fix:** Collapse to one line: `// Type-safe event bus (pub/sub) for cross-component section/navigation events.`

### [LOW] CD-08 — Refactor-marker header and stale back-references in styles barrel
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Hard Rule 4 (refactor markers — "Simplified... only includes what's actually being used" narrates a past trim-down); Hard Rule 3 (comparative "(smaller than 36px)").
- **Where:** src/styles/index.ts:1, src/styles/index.ts:27, src/styles/index.ts:29-30, src/styles/index.ts:39
- **Evidence:**
  ```ts
  // Simplified styles - only includes what's actually being used
  ...
  // Typography styles - used in InteractiveTextSimple.tsx
  export const nameText = {
    fontFamily: fonts.alien, // Alien Encounters font
    fontSize: textStyles.display.md.fontSize, // Desktop: 36px
  ...
    fontSize: textStyles.display.sm.fontSize, // Mobile: 30px (smaller than 36px)
  ```
- **Proposed fix:** Delete line 1 (or rewrite: `// Shared inline-style objects and name text presets.`). Line 27 → `// Name text presets` (drop the consumer back-reference — it goes stale silently). Line 29 trailing `// Alien Encounters font` → delete (restates `fonts.alien`). Keep the px-resolution trailing comments at 30/39 (they resolve a two-hop token indirection) but trim line 39 to `// Mobile: 30px`.

---

## Deliberately kept (WHY genuinely needed)

- **src/app/components/CosmicDustThree.tsx:108, 110-113, 118-126, 128-129** — attribute/uniform packing legends (`// theta, phi, distance, speed` on packed vec4s) and the one-line GPU-architecture header. Packed-attribute semantics are unreadable without them.
- **src/app/components/CosmicDustThree.tsx** section banners (77, 107, 284, 362, 455, 587, 634) and one-line strategy comments (153, 196, 207, 227, 303, 307, 313, 325, 344, 356, 596, 598, 622, 727, 731, 744, 799) — current-state, ≤1 line, non-obvious math/ordering.
- **src/lib/gameLoop.ts:1-2 and src/lib/input.ts:1-2** — current-purpose headers that explain why these modules exist with zero consumers yet. (The zero-consumer/dead-module question itself is **ui-and-modularity** territory — cross-reference, not double-reported here.)
- **src/styles/globals.css:4, 19, 23, 44, 47** — iOS safe-area/notch constraints; non-obvious, load-bearing.
- **src/styles/index.ts:11** — `// margin is controlled by .saturn-frame CSS class (responsive...)` — cross-file constraint, exactly what comments are for.
- **src/app/components/SimpleNavigation.tsx:40, 42, 55, 69, 82** — one-line JSX structure labels for the ring stack; line 42 carries a real WHY ("smaller on mobile to prevent overflow").
- **src/app/hooks/useDevice.ts:29, 62** — SSR-defaults and UA-fallback rationale.
- Token-file group labels (colors.ts, sizing.ts, typography.ts) — conventional one-line section labels in token catalogs; not bloat.

## Cross-references (not this lens)

- Unused `wordIndex` prop, unused `dropDistance`-adjacent shadowed `ox`/`oy` destructuring, never-called `setCurrentX`/`setCurrentY`, and the zero-consumer `src/lib/gameLoop.ts` / `src/lib/input.ts` modules → **ui-and-modularity-audit** (dead code / structure), noted while sweeping InteractiveTextSimple.tsx and `src/lib/`.

## Suggested fix batching (per lens workflow)

- Commit A (medium): CD-01, CD-02, CD-03 — one file, misleading/dead-code comments.
- Commit B (low, same file): CD-04, CD-05 (InteractiveTextSimple portion).
- Commit C (low, cross-file): CD-05 remainder, CD-06 (comment-only, reviewer eyeballs the render-loop diff), CD-07, CD-08.
- Re-run gate after each commit: `npx tsc --noEmit` + `yarn lint` + `yarn build`.
