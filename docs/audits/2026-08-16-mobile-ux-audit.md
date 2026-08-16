# Mobile-UX Audit — rkportfolio — 2026-08-16

- **Lens:** mobile-ux-audit (static; runtime confirmation handed to live-journey-qa on port 3002)
- **Scope:** `src/**` (single frontend app)
- **Reference viewport:** 375×667 primary; 360 and 390–414 sanity
- **Baseline (recorded by orchestrator, not re-run):** `npx tsc --noEmit` exit 0; `yarn lint` clean; `yarn build` succeeds.
- **Branch:** `audit/2026-08-16`

## N/A by architecture (not padded)

- **M4 tables** — no `<table>` anywhere in `src/`.
- **M5 input/form ergonomics** — zero `<input>/<select>/<textarea>` in the app (contact is `mailto:`/`tel:` links). No input-zoom / `inputmode` / keyboard-overlap surface exists.
- **M7 modals/sheets** — no modal primitive; the only overlay (`CosmicDustThree.tsx:876-888`) is non-interactive (`pointerEvents: 'none'`).
- `src/lib/input.ts` / `src/lib/gameLoop.ts` — game infra, not imported by any component yet (GameSection is "COMING SOON"); its virtual-touch-button API exists but has no UI to audit.

## Positive checks (recent mobile work holds up in code)

- Planet click target: `const hitSize = Math.max(screenSize * 3, 80)` (`src/app/components/CosmicDustThree.tsx:784`) — ≥80px, above the 44px minimum; depth threshold 0.15 keeps it tappable through most of the orbit. No static regression found (runtime reliability item: MUX-07).
- `theme-color: '#f5f1e8'` + `viewportFit: 'cover'` + `black-translucent` present (`src/app/layout.tsx:14-28`) — fullscreen work intact.
- Nav and contact buttons carry `min-h-[44px]` (+ `min-w-[44px]` on nav) — `src/app/components/SimpleNavigation.tsx:94`, `src/app/page.tsx:73,80,87`.
- Sections use `min-h-dvh`, html/body use `min-h-100svh`, gradient on `html` extends into safe areas (`src/styles/globals.css:3-26`).
- All `@font-face` rules use `font-display: swap` (`src/styles/fonts.css`).
- All `hover:` color styles are paired with `active:` or are purely cosmetic — no hover-gated affordances (M3 clean).

---

## Findings

### [HIGH] MUX-01 — `maximumScale: 1` blocks pinch-zoom (WCAG 1.4.4 failure)
- **Severity:** high
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Mode:** proven-from-code
- **Checklist:** M11
- **Rule:** Lens M11 — "`maximum-scale=1`/`user-scalable=no` blocks pinch-zoom — accessibility failure"; CLAUDE.md a11y section.
- **Where:** `src/app/layout.tsx:17`
- **Evidence:**
  ```ts
  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,       // <-- blocks zoom
    viewportFit: 'cover',
  ```
  There are no form inputs in the app, so the usual "prevent input-focus zoom" rationale does not apply. `git log -S maximumScale` shows it predates the recent fullscreen/theme-color commit (6558c3d), so removing it does not touch that work.
- **Impact at 375px:** Android Chrome honours `maximum-scale=1` and fully blocks pinch-zoom. Low-vision users cannot magnify the 12–14px gray-on-beige copy (see MUX-11) — the site's smallest text becomes unreadable with no recourse. (iOS Safari ignores the attribute, so iPhone is unaffected — Android is the failure surface.)
- **Proposed fix:** Delete the `maximumScale: 1` line. `width: 'device-width'` + `initialScale: 1` + `viewportFit: 'cover'` stay. One-line, self-contained; the draggable-name gesture is single-pointer (`@use-gesture` drag with `touchAction: 'none'` on the words), so page pinch-zoom does not conflict with it.

### [HIGH] MUX-02 — no `prefers-reduced-motion` gate anywhere on an animation-heavy site
- **Severity:** high
- **Fix risk:** needs-review (touches the Three.js render loop, GSAP timeline, framer-motion/react-spring config)
- **Auto-fixable:** no
- **Mode:** proven-from-code
- **Checklist:** M10
- **Rule:** Runner binding, Frontend: "`prefers-reduced-motion` MUST gate every animation — treat a missing gate as a real finding"; CLAUDE.md a11y: "Respect `prefers-reduced-motion`".
- **Where:**
  - `grep -rn "prefers-reduced-motion|useReducedMotion|matchMedia" src/` → **no matches** (exit 1)
  - `src/app/components/CosmicDustThree.tsx:643-795` — unconditional rAF loop driving 22k particles, orbiting planet, star drift, warp
  - `src/styles/globals.css:39-42` — `.animate-spin-slow { animation: spin-slow linear infinite; }` with no reduced-motion media block (used 3× in `SimpleNavigation.tsx:44,57,71`)
  - `src/app/page.tsx:39-48` — shimmer `m.span` (`repeat: 5`, 2s each = 12s of motion on section entry)
  - `src/app/page.tsx:133` — `LazyMotion` tree with no `MotionConfig reducedMotion`
  - `src/app/components/InteractiveTextSimple.tsx:64-147, 211-240` — react-spring drop/scatter/bounce with no `skipAnimation` gate
- **Impact at 375px:** For a vestibular-disorder user the *entire* viewport is continuous motion (full-screen particle orbits behind every section, spinning rings around the nav, shimmer, spring physics) with no way to opt out even after enabling the OS-level "Reduce Motion" setting. Also a constant battery drain on phones whose OS setting signals "do less".
- **Proposed fix (per layer, one pass):**
  1. `globals.css`: add `@media (prefers-reduced-motion: reduce) { .animate-spin-slow { animation: none; } }`.
  2. framer-motion: wrap the tree in `<MotionConfig reducedMotion='user'>` (export it from `src/lib/motion.ts` alongside `m`).
  3. react-spring (`InteractiveTextSimple.tsx`): gate with `Globals.assign({ skipAnimation })` or `immediate` driven by a `matchMedia('(prefers-reduced-motion: reduce)')` check.
  4. `CosmicDustThree.tsx`: read the same media query at mount; when reduced, render a static (or heavily damped — e.g. freeze `uTime` advance, skip the warp scale-up) scene. This is render-loop surgery — visual review required; do not auto-fix.

### [MEDIUM] MUX-03 — fixed nav ignores safe-area insets (`viewport-fit=cover` is active)
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Mode:** proven-from-code (visual collision to be confirmed by live-journey-qa in landscape + standalone mode)
- **Checklist:** M6
- **Rule:** Lens M6 — fixed/sticky elements at the edges must respect `env(safe-area-inset-*)`.
- **Where:** `src/app/components/SimpleNavigation.tsx:39`
- **Evidence:**
  ```tsx
  <div className='fixed top-4 right-4 sm:top-16 sm:right-20 z-50'>
  ```
  The safe-area compensation lives on `body` padding (`src/styles/globals.css:24`), but `position: fixed` elements are positioned against the viewport and bypass body padding. The app opts into edge-to-edge rendering: `viewportFit: 'cover'` (`layout.tsx:18`) + `statusBarStyle: 'black-translucent'` (`layout.tsx:27`). The `.saturn-frame` got the `max(10px, env(safe-area-inset-*))` treatment (`globals.css:45-52`) — the nav, the only navigation on the site, did not.
- **Impact at 375px:** In portrait Safari it renders fine (browser chrome keeps insets ~0), but in landscape on a notched phone (`safe-area-inset-right` ≈ 47px) and in fullscreen/standalone portrait (`inset-top` ≈ 47-59px under black-translucent) the only nav buttons sit in the notch / under the status-bar clock — partially obscured or clipped by the rounded corner.
- **Proposed fix:** Mirror the saturn-frame pattern on the nav container: `className='fixed z-50 top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] sm:top-16 sm:right-20'` (Tailwind arbitrary values, no new tokens). Confirm in live-journey-qa: landscape 667×375 + iOS standalone.

### [MEDIUM] MUX-04 — portfolio project links are ~33px tall (sub-44px primary action)
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Mode:** proven-from-code
- **Checklist:** M2
- **Rule:** Runner binding: touch-target min 44×44px (Apple HIG / WCAG); lens calibration lists "sub-44px primary actions" as high-friction.
- **Where:** `src/app/components/PortfolioSection.tsx:43-62`
- **Evidence:**
  ```tsx
  <m.a ... className='block group'>
    <div className='flex items-baseline justify-between sm:justify-start gap-3 sm:gap-6'>
      <span className='text-lg sm:text-2xl ...'>{item.title}</span>
  ```
  At mobile size the anchor's height is one `text-lg` line (28px line-height) + `mt-1` (4px) + 1px divider ≈ **33px** — no vertical padding, no `min-h`. These links are the portfolio page's entire purpose (the conversion action of the site).
- **Impact at 375px:** The tap zone for opening a project is a 33px-tall strip. Full width and 24px `space-y-6` gaps mitigate mis-taps between items, but it is below the 44px minimum the rest of the codebase already honours (`min-h-[44px]` on nav/contact buttons).
- **Proposed fix:** Add `py-2` (or `min-h-[44px] flex flex-col justify-center`) to the `m.a` — mechanical, self-contained; only stretches the list's vertical rhythm slightly.

### [MEDIUM] MUX-05 — landscape phones get the desktop render budget (width-only mobile detection at mount)
- **Severity:** medium
- **Fix risk:** needs-review (renderer init — particle counts, DPR, antialias; visual/perf review required)
- **Auto-fixable:** no
- **Mode:** needs-runtime (branch is code-provable; the felt jank needs a device) — **tag for live-journey-qa**
- **Checklist:** M10 (mobile-felt jank; mechanics cross-ref to performance-audit)
- **Rule:** Lens M10 — phones are slower/battery-bound; CLAUDE.md "Mobile first".
- **Where:** `src/app/components/CosmicDustThree.tsx:435-436, 447-450, 456, 588`
- **Evidence:**
  ```ts
  const width = window.innerWidth;            // 435 — captured once at mount
  ...
  const isMobile = width < 768;               // 447
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
  renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
  ...
  const mobileFactor = isMobile ? 0.5 : 1;    // 456 — halves 22k particles
  ```
  An iPhone 12/13/14 in landscape reports `innerWidth` 844–932 → takes the desktop path: full 22,000 particles + 1,500 stars, antialias on, DPR 2. The decision is made once at mount and never revisited (the resize handler at :801-817 only resizes). Meanwhile `src/app/hooks/useDevice.ts:63-64` already does UA-based phone detection (`isMobileAgent && width < 1024`) — the hand-rolled `width < 768` in this component ignores it (duplication angle belongs to ui-and-modularity; this lens owns the phone symptom).
- **Impact at 375px→landscape:** Open the site in landscape (or rotate before the component mounts) and a mid-range phone GPU is asked to do the desktop workload — dropped frames, heat, battery. The adaptive draw-range fallback (:650-661) recovers some of it but never reduces DPR/antialias.
- **Proposed fix:** Base the branch on capability, not width — reuse the `useDevice` detection logic (UA + touch), e.g. pass `isMobile` in as a prop from `BackgroundElements` via `useDevice()`, keeping the renderer init untouched otherwise. Needs visual review + a live-journey-qa pass in landscape.

### [MEDIUM] MUX-06 — full-screen `backdrop-filter: blur(20px)` animates during the warp
- **Severity:** medium
- **Fix risk:** needs-review (visual effect during the signature transition)
- **Auto-fixable:** no
- **Mode:** needs-runtime — **tag for live-journey-qa** (profile the warp on a phone-sized run)
- **Checklist:** M10
- **Rule:** Lens M10 — heavy `backdrop-filter` is GPU-bound and janky on mid phones (deep numbers → performance-audit; this is the mobile-felt symptom).
- **Where:** `src/app/components/CosmicDustThree.tsx:876-888` (blur at :882-883), driven by the GSAP timeline at :413-425
- **Evidence:**
  ```ts
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  ```
  The overlay fades 0→1→0 exactly while the particle shader is at its most expensive (warp scale-up, `gl_PointSize` × up to 15, additive blending over the full screen). A viewport-sized 20px backdrop blur compositing over a live WebGL canvas is the worst-case GPU combination on a mid-range phone.
- **Impact at 375px:** The one "wow" transition of the site (planet tap → warp → portfolio) is the moment most likely to stutter on the phones it was recently tuned for.
- **Proposed fix:** On mobile (same `isMobile` signal as MUX-05) drop the backdrop blur and rely on the near-opaque `rgba(245, 241, 232, 0.85)` fill (raise to ~0.95), or reduce to `blur(6px)`. Keep desktop as-is. Verify visually — this is inside the warp sequence.

### [MEDIUM] MUX-07 — planet tap target moves under the finger every frame (tap-reliability check)
- **Severity:** medium
- **Fix risk:** needs-review (click-target tracking is part of the recent "easier planet click target" work)
- **Auto-fixable:** no
- **Mode:** needs-runtime — **tag for live-journey-qa** (primary check: does a deliberate tap on the moving planet register first-try at 375×667?)
- **Checklist:** M2 / M12
- **Rule:** Lens M2 — coarse pointer needs a stable ≥44px target; orchestrator note — regressions around the planet click target are high-severity.
- **Where:** `src/app/components/CosmicDustThree.tsx:676-677, 782-791, 865-875`
- **Evidence:**
  ```ts
  sx = cachedW * 0.5 + Math.cos(oa) * cachedW * 0.4;   // 676 — ball sweeps ±40% of screen width
  ...
  clickTargetRef.current.style.left = `${screenX - hitSize / 2}px`;  // 785 — repositioned every rAF
  ```
  The 80px hit div (good size) is re-positioned every animation frame and the handler is a plain `onClick` on a `<div>` (:867). On touch, `click` is synthesized on `touchend` — if the div has moved out from under the touch point between `touchstart` and `touchend` (slow tap, or planet at orbit speed near the screen edge), the tap can silently miss. Static analysis cannot resolve whether the orbit speed vs. 80px hit slop makes this frequent.
- **Impact at 375px:** A missed tap on the planet is a dead-feeling easter egg; users have the fallback PORTFOLIO buttons, so it is friction, not a blocker.
- **Proposed fix:** If live-journey-qa reproduces missed taps: switch to `onPointerDown` (fires at touch start, before the target moves) instead of `onClick`, or hit-test the tap coordinates against the planet position in a document-level pointerdown listener. Either change touches the interaction seam of the recent click-target work — review, don't auto-fix.

### [LOW] MUX-08 — `not-found.tsx` uses `min-h-screen` (100vh) against the codebase's `dvh/svh` convention
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Mode:** proven-from-code
- **Checklist:** M6
- **Rule:** Lens M6 — `100vh` overflows behind mobile browser chrome; every other surface uses `min-h-dvh` (`page.tsx:18`, `PortfolioSection.tsx:32`, `GameSection.tsx:12`) or `100svh` (`globals.css:14,25`).
- **Where:** `src/app/not-found.tsx:5`
- **Evidence:** `<div className='min-h-screen flex items-center justify-center px-6'>`
- **Impact at 375px:** On iOS Safari with the URL bar expanded, 100vh > visible viewport → the centred 404 content sits below the visual centre and the page gains a small dead scroll.
- **Proposed fix:** `min-h-screen` → `min-h-dvh` (matches the section convention). One token, zero blast radius.

### [LOW] MUX-09 — contact row is fixed-nowrap and near the width limit at 360px
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Mode:** needs-runtime — **tag for live-journey-qa** (measure the row at 360 and 375px; Alien Encounters + `tracking-wider` metrics aren't derivable statically)
- **Checklist:** M1
- **Rule:** Lens M1 — flex rows of nowrap text that can exceed the viewport push the page into horizontal scroll.
- **Where:** `src/app/page.tsx:70-91`
- **Evidence:**
  ```tsx
  <div className='flex items-center justify-center sm:justify-start gap-1 sm:gap-4'>
    <a ... className='... text-sm ... tracking-wider py-3 px-3 min-h-[44px] ...'>EMAIL</a>
    <span ...>|</span>
    <a ...>PHONE</a>
    <span ...>|</span>
    <button ...>PORTFOLIO</button>
  ```
  Three single-word targets (min-content can't wrap) + two pipes + 4×4px gaps + 6×12px padding inside a 335px (375-vw) / 320px (360-vw) content box, in a display font with `tracking-wider`. Rough estimate ≈300-310px — fits at 375px with little slack, marginal at 360px. No `flex-wrap`.
- **Impact at 360px:** If it exceeds the box, the row overflows the `px-5` container and the page scrolls sideways on small Androids.
- **Proposed fix:** Add `flex-wrap` (harmless if it never triggers), or verify at runtime first and only act if it overflows.

### [LOW] MUX-10 — name-scatter physics uses desktop-tuned magic numbers; letters fly off a 375px screen
- **Severity:** low
- **Fix risk:** needs-review (animation feel — the site's signature interaction)
- **Auto-fixable:** no
- **Mode:** needs-runtime — **tag for live-journey-qa** (drag/release the name at 375×667 and in landscape ~667×375)
- **Checklist:** M1 (clipped, so the symptom is vanishing content, not scroll) / M12
- **Rule:** CLAUDE.md "Mobile first" — no fixed pixel values for layout math; lens: judge the phone, not desktop-shrunk.
- **Where:** `src/app/components/InteractiveTextSimple.tsx:80-81, 114, 123-126, 270`
- **Evidence:**
  ```ts
  const floorY = screenHeight - 300;                      // 81 — "Almost to the very bottom" (not at 667px)
  const randomDistance = 120 + Math.random() * 250;       // 114 — up to 370px scatter radius
  // No bounds at all - let letters go anywhere            // 123
  ```
  Outer container is `fixed inset-0 overflow-hidden` (:270), so overflow is clipped rather than scrolling.
- **Impact at 375×667:** Scatter radius up to 370px from a drop point mid-screen throws a large share of letters outside the 375px viewport — they simply vanish for the 1.5s scatter, gutting the effect. In landscape (innerHeight ≈ 375), `floorY = 75` means the word "drops" *upward* if released below y=75 — inverted gravity.
- **Proposed fix:** Scale both constants from the viewport (e.g. `floorY = h - clamp(h*0.3, 120, 300)`, scatter radius `min(370, w*0.45)`) and clamp scatter targets to `[10, w-10] × [10, h-10]`. Animation-feel change — visual review required.

### [LOW] MUX-11 — 12px primary-nav labels and 12–14px body copy on mobile
- **Severity:** low
- **Fix risk:** needs-review (nav label size interacts with the Saturn-ring dimensions)
- **Auto-fixable:** no
- **Mode:** proven-from-code
- **Checklist:** M9
- **Rule:** Lens M9 — body/navigation copy below ~14-16px on mobile.
- **Where:**
  - `src/app/components/SimpleNavigation.tsx:94` — `text-xs sm:text-base` → the site's only nav labels render at **12px** on phones
  - `src/app/components/PortfolioSection.tsx:57` — project descriptions `text-xs` (12px) in gray-400
  - `src/app/page.tsx:30` — about copy `text-sm` (14px) in gray-500 gradient text
- **Evidence:** class strings above; all in the stylized Alien Encounters display font, low-contrast grays on the beige gradient.
- **Impact at 375px:** Small, low-contrast, display-font text is hard to read — and MUX-01 currently prevents Android users from zooming it. Tap targets themselves are fine (44px enforced), this is purely legibility.
- **Proposed fix:** Bump nav labels and descriptions to `text-sm` (14px) minimum on mobile. Check the nav visually — larger labels enlarge the ring container. If MUX-01 is fixed first, severity here stays low.

### [LOW] MUX-12 — the only navigation lives in the top-right corner (thumb-reach)
- **Severity:** low
- **Fix risk:** needs-review (moving the nav is a design decision)
- **Auto-fixable:** no
- **Mode:** proven-from-code
- **Checklist:** M8
- **Rule:** Lens M8 — primary actions in top corners are the hardest one-thumb reach.
- **Where:** `src/app/components/SimpleNavigation.tsx:39` (`fixed top-4 right-4`)
- **Evidence:** On `home`, the only visible navigation is the "ME" button top-right; the planet tap is an undiscoverable easter egg. `MeSection` mitigates with in-content EMAIL/PHONE/PORTFOLIO links in the centre (`page.tsx:69-92`), but `home → me` always requires a top-corner reach.
- **Impact at 375×667:** One-handed users stretch or re-grip for every section change. Workaroundable and clearly an aesthetic choice (the Saturn-ring nav is part of the design) — recorded, not pushed.
- **Proposed fix:** Only if the design allows: mirror the section links in the lower content area (as MeSection already does), rather than moving the ring nav.

---

## Handoff to live-journey-qa (port 3002)

Confirm at 375×667 (+ 360, landscape 667×375, iOS standalone):
1. **MUX-05** — landscape load: frame rate with the desktop particle budget.
2. **MUX-06** — warp transition smoothness with the 20px backdrop blur.
3. **MUX-07** — first-try tap success rate on the moving planet.
4. **MUX-03** — nav position in landscape-notch and standalone-portrait (insets non-zero).
5. **MUX-09** — contact-row width at 360px (horizontal scroll check).
6. **MUX-10** — name drag/scatter: letters off-screen; landscape "upward drop".

## Cross-references (not double-reported)

- `width < 768` duplication vs `useDevice()` (MUX-05) — structural consolidation belongs to **ui-and-modularity**.
- Warp/render-loop GPU cost mechanics (MUX-05/06) — numbers belong to **performance-audit**.
- Planet click `<div onClick>` lacking button semantics/keyboard access — non-mobile a11y; keyboard users have the PORTFOLIO buttons as an equivalent path (noted for code-review, not this lens).
- Nested `<main>` (`layout.tsx:46` wrapping `page.tsx:134`) — document structure, not mobile; left to code-review.

## Totals

| Severity | Count |
|---|---|
| critical | 0 |
| high | 2 |
| medium | 5 |
| low | 5 |

`safe` + `auto-fixable: yes`: 4 (MUX-01, MUX-03, MUX-04, MUX-08). `needs-review`: 8.
