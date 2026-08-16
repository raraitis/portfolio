# UI / Modularity / Reuse / Design-System Audit — rkportfolio

Generated: 2026-08-16
Lens: `ui-and-modularity-audit`
Scope: `src/**` (plus root `tailwind.config.js` only where it manifests as no-op classes inside `src/`). `out/` and `public/` excluded.
Branch: `audit/2026-08-16`

## Baseline (recorded, verified by orchestrator — not re-run)

- `npx tsc --noEmit` → exit 0
- `yarn lint` → clean
- `yarn build` → succeeds

## Tech stack snapshot

Next.js 15 App Router, React 19, TypeScript 5.9 strict. Tailwind CSS 4 via `@tailwindcss/postcss`. Three.js 0.182 + GSAP (`CosmicDustThree`), framer-motion (via `src/lib/motion.ts`), `@react-spring/web` + `@use-gesture/react` (`InteractiveTextSimple`). No state library — typed event bus (`src/lib/events.ts`). Design tokens in `src/styles/*.ts`. Total in-scope source: ~2,384 lines across 20 files.

## Executive summary

The app is small and mostly coherent, but three structural problems stand out: (1) `tailwind.config.js` is dead under Tailwind 4 — the custom `font-alien`/`font-alien-solid`/`nabla` utilities are never generated, so 5 files carry no-op classes that only *look* right because the body font falls back to the same family; (2) the `src/styles/` token layer is ~60% dead exports (≈200 lines) while live code hardcodes the very values the tokens define (Saturn palette duplicated across 4 files); (3) ~160 lines of game scaffolding (`gameLoop.ts`, `input.ts`, `GameSection`, game events, unreachable `'game'` branch) have zero importers or are unreachable. `CosmicDustThree.tsx` at 893 lines exceeds the critical threshold but has a clean mechanical split (shaders + config out). Estimated deletable/consolidatable: ~450–500 lines.

## Statistics

| Category | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Duplication | 0 | 0 | 0 | 4 | 4 |
| Dead code | 0 | 1 | 3 | 2 | 6 |
| Coupling | 0 | 0 | 2 | 1 | 3 |
| Oversized | 1 | 0 | 0 | 0 | 1 |
| Missed primitive | 0 | 0 | 1 | 0 | 1 |
| Hardcoded token | 0 | 0 | 0 | 2 | 2 |
| Styling practice | 0 | 1 | 0 | 2 | 3 |
| Accessibility (U9) | 0 | 0 | 1 | 0 | 1 |
| Backend module | — | — | — | — | N/A by architecture |
| **Total** | **1** | **2** | **7** | **11** | **21** |

N/A by architecture (binding): backend module structure (L4), API shape (L5), ORM/enum discipline (L8 backend), i18n (U8), state-library construction (U5 — no state library; the event bus is used consistently).

---

## Findings

### [CRITICAL] CD-01 — CosmicDustThree.tsx is 893 lines (over the 800-line critical threshold)
- **Severity:** critical
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** L9 oversized files; CLAUDE.md "Files over 400 lines are a code smell"
- **Where:** src/app/components/CosmicDustThree.tsx:1-893
- **Evidence:** Diagnosis per L9: lines 78-360 are four GLSL shader strings (~283 lines); lines 12-75 are `BallConfig`/`BALLS` config + derived orbit constants (~64 lines); lines 371-893 are the component (init, render loop, JSX). No state bloat (refs only), no repeated UI atoms — this is **shader/config-bloated**, so the right lever is styles-extract-analog: move strings and config out, not a hook or component split.
- **Proposed fix:** Mechanical extraction, verbatim string moves: (1) `src/app/components/cosmicDust.shaders.ts` exporting `planetVertexShader`, `planetFragmentShader`, `particleVertexShader`, `starVertexShader`, `starFragmentShader`, `particleFragmentShader`; note `particleVertexShader` interpolates `PLANET_TILT_COS/SIN` and `BALLS[0|1].radius` — export a builder or move those constants with it; (2) `src/app/components/cosmicDust.config.ts` for `BallConfig`, `BALLS`, `BALL_ORBIT`, `STAR_COUNT`, tilt constants. Leaves the component at ~550 lines. Needs-review because it touches shader code and the render loop file — verify visual parity in dev server after the move. One refactor per commit.

### [HIGH] TW-01 — tailwind.config.js is dead under Tailwind 4; `font-alien`/`font-alien-solid`/`nabla` utilities are silently no-ops in 5 files
- **Severity:** high
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** U4 styling-solution best practices; CLAUDE.md "UI controls must be wired end-to-end" (dead wiring analog)
- **Where:** tailwind.config.js:1-17; src/styles/globals.css:1; src/app/page.tsx:30,73,80,87; src/app/not-found.tsx:7,10,13,18; src/app/components/SimpleNavigation.tsx:94; src/app/components/PortfolioSection.tsx:54,57; src/app/components/GameSection.tsx:18
- **Evidence:** Tailwind 4 does not auto-load a JS config; `globals.css` has only `@import "tailwindcss"` — no `@config` directive and no `@theme` block defining `--font-alien`. Verified in the build output: `.next/static/css/335c1dafc041d5ae.css` contains **zero** `.font-alien` rules. Every `font-alien` class in the 5 files above emits no CSS. The site renders correctly only by accident: the unlayered `body` rule in `globals.css:20` (`font-family: 'Alien Encounters', ...`) wins over Tailwind's layered utilities, so everything is Alien Encounters anyway (including `font-sans` on `layout.tsx:39`, which is also effectively overridden). The config's `content` globs (`./src/components/**`) also point at a directory that doesn't exist. Any future utility added to the config will silently not exist.
- **Proposed fix:** Pick one wiring: (a) Tailwind 4 idiomatic — delete `tailwind.config.js`, add `@theme { --font-alien: 'Alien Encounters', 'Inter', sans-serif; --font-alien-solid: ...; --font-nabla: ...; }` to `globals.css`; or (b) add `@config "../../tailwind.config.js"` to `globals.css`. Then decide whether the `body` font-family rule should remain the default. Needs-review: turning `font-alien` from no-op into a real rule changes which cascade rule wins — visual smoke required (fallback chains differ: body rule includes `system-ui`).

### [HIGH] ST-01 — src/styles token layer is ~200 lines of zero-importer exports
- **Severity:** high
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L2 dead code (zero-importer exports); CLAUDE.md store-field discipline analog ("never add a field without a consumer")
- **Where:** src/styles/colors.ts:4-28,42-62,64; src/styles/sizing.ts:15-43,46-60 (partial),62-66; src/styles/typography.ts:19-33 (partial),106-159,163-167,169-173; src/styles/index.ts:3
- **Evidence:** Importer scan: `colors` is imported only by `styles/index.ts`, which reads `colors.saturn.*` and `colors.black` — `white`, the whole `gray` scale, `brand`, `text`, `background`, and status colors have zero readers. `sizing.ts`: `spacing` is imported at `index.ts:3` but never referenced in the file body; `borderRadius`, `shadows`, `containers` have zero importers; of `zIndex` only `.modal` is read (`index.ts:22`). `typography.ts`: `fonts.mono`, `fonts.nabla`, `fonts.alienSolid`, `fonts.sans` have no consumers outside the file; `textStyles.heading/body/caption` and `display['2xl'|xl|lg]` are unread (only `display.md`/`display.sm` feed `nameText`/`nameTextMobile`); `leftColumn` has zero importers; all exported types (`Colors`, `Spacing`, `BorderRadius`, `Shadows`, `Containers`, `ZIndex`, `Fonts`, `FontWeights`, `FontSizes`, `LetterSpacing`, `TextStyles`) have zero importers. Related: `src/styles/fonts.css:42-72` declares 4 `Alien Encounters Solid` @font-face variants whose family is never referenced by any live style (the `font-alien-solid` utility is never generated per TW-01), and the italic/bold faces of the regular family (fonts.css:17-39) are never requested (no bold/italic usage in `src/`).
- **Proposed fix:** Delete the zero-importer exports and the unused `spacing` import; keep `colors.black`, `colors.saturn`, `zIndex` (as the token home — see Z-01), `fonts.alien`, `fontSizes`/`fontWeights`/`letterSpacing` only as far as `textStyles.display.md/sm` need them. Deleting the Solid/italic @font-face blocks is also safe (fonts with `font-display: swap` are only downloaded when used, so no runtime change) but coordinate with TW-01's decision if `font-alien-solid` is meant to become real. Gate: tsc + build.

### [MEDIUM] GAME-01 — Dead game modules: gameLoop.ts and input.ts have zero importers; game events never fired
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L2 dead code (zero-importer files)
- **Where:** src/lib/gameLoop.ts:1-50; src/lib/input.ts:1-74; src/lib/events.ts:11-15
- **Evidence:** `grep -rn "gameLoop\|lib/input"` across `src/` returns no importers for either file (124 lines). The event map entries `'game-start' | 'game-pause' | 'game-resume' | 'game-score'` (events.ts:11-15) are never passed to `emit()` or `on()` anywhere. `gameLoop.ts` also duplicates the dt-clamp logic of the live render loop (`Math.min((timestamp - lastTimestamp) / 1000, 0.05)` — gameLoop.ts:16 vs CosmicDustThree.tsx:645), so deleting it also resolves an L1 duplication.
- **Proposed fix:** Delete `src/lib/gameLoop.ts`, `src/lib/input.ts`, and events.ts lines 11-15 (the `// Game events` block). Git history preserves them if the game ships later.

### [MEDIUM] GAME-02 — `'game'` section is unreachable: GameSection renders only for a section nothing can navigate to
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** L2 dead code (unreachable branch)
- **Where:** src/app/components/GameSection.tsx:1-26; src/app/page.tsx:7,116-117; src/lib/events.ts:4
- **Evidence:** `currentSection` is only set via `emit('navigate', ...)`. The only emit sites are `SimpleNavigation.tsx:13` (sections drawn from `navItems`, which contains only `home`/`me`/`portfolio` — lines 18-20) and `CosmicDustThree.tsx:416` (`'portfolio'`). No code path produces `'game'`, so `page.tsx:116-117` and all of `GameSection.tsx` are unreachable, and the `'game'` member of `SectionName` (events.ts:4) is a phantom state.
- **Proposed fix:** Product decision, not mechanical: either delete `GameSection.tsx`, the switch case, and the `'game'` union member (together with GAME-01 this removes all game scaffolding, ~160 lines), or wire a nav entry if the "COMING SOON" page is meant to be reachable. Marked needs-review because the placeholder is plainly intentional future work — the fixer must not decide this alone.

### [MEDIUM] SHELL-01 — Section-shell markup duplicated across MeSection, PortfolioSection, GameSection (missed primitive)
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** yes
- **Rule:** U1/U2 duplicate component bodies / missed primitive (3 files, same body)
- **Where:** src/app/page.tsx:13-26; src/app/components/PortfolioSection.tsx:27-39; src/app/components/GameSection.tsx:7-16
- **Evidence:** All three sections open with the same `m.div` fade shell — `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3–0.4, ease: 'easeOut' }}` — plus the same layout class `'min-h-dvh relative z-10 flex items-center justify-center sm:justify-end px-5 sm:px-12 lg:pr-20'` (GameSection differs only in centring), and the identical h1 class `'text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 ...'` (page.tsx:23, PortfolioSection.tsx:36, GameSection.tsx:15). Three copies; a fourth section would make a fourth.
- **Proposed fix:** Extract `src/app/components/SectionShell.tsx` — props `title`, `align?: 'end' | 'center'`, `duration?`, children — copying the transition values verbatim; rewrite the three call-sites. Needs-review only because the framer-motion transition values are animation timing (verbatim copy + visual smoke of the section cross-fade required); the edit itself is mechanical.

### [MEDIUM] SAT-01 — Saturn palette defined in colors.ts but hardcoded in 3 other places (shotgun surgery on a palette change)
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** L3 magic-value duplication; U3 partial token usage
- **Where:** src/styles/colors.ts:31-39; src/styles/globals.css:5-11; src/app/layout.tsx:19; src/app/components/CosmicDustThree.tsx:881
- **Evidence:** The five Saturn hexes (`#f5f1e8`, `#ede4d3`, `#e8dcc6`, `#ddd0bb`, `#d4c4a8`) exist as tokens (`colors.saturn.lightest…darkest`) and are re-hardcoded: the `html` background gradient (globals.css:5-11), the viewport `themeColor: '#f5f1e8'` (layout.tsx:19), and the warp overlay `backgroundColor: 'rgba(245, 241, 232, 0.85)'` (CosmicDustThree.tsx:881 — 245,241,232 is exactly `#f5f1e8`). Changing the palette today means editing 4 files that must stay in sync; `themeColor` and the CSS gradient drifting apart would visibly break the recent mobile-fullscreen work.
- **Proposed fix:** Make CSS custom properties the single source (`@theme`/`:root` in globals.css: `--color-saturn-lightest: #f5f1e8;` etc.), consume them in the gradient, and have `colors.ts` reference the same literals in one commented block adjacent (TS can't read CSS at build time — document the pairing constraint per CLAUDE.md "document the constraint near the code"). `themeColor` in `layout.tsx` must stay a literal string (Next metadata), so add a `// must match --color-saturn-lightest` constraint comment or import from `colors.ts`. Needs-review: touches `theme-color` (recent mobile fullscreen work — regressions here are high-severity per binding) and the warp overlay color.

### [MEDIUM] NAV-01 — Navigation visibility filters compare display labels, not section ids
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L3 magic-value coupling (renaming a label silently breaks logic)
- **Where:** src/app/components/SimpleNavigation.tsx:24-34
- **Evidence:**
  ```tsx
  if (currentSection === 'home') {
    return navItems.filter((item) => item.word === 'ME');
  } else if (currentSection === 'me') {
    return navItems.filter((item) => item.word === 'HOME PLANET' || item.word === 'PORTFOLIO');
  }
  ```
  Visibility logic keys off the user-facing copy (`item.word`) instead of the stable `item.section` id. Renaming "HOME PLANET" to anything else silently empties the nav with no type error.
- **Proposed fix:** Filter on `item.section` (`'me'`, `'home'`, `'portfolio'`) — the union type then protects every comparison. Also hoist `navItems` to module scope (it is recreated every render; array of constants).

### [MEDIUM] A11Y-01 — Planet click target is a bare div: no keyboard access, no role, no label
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** U9 accessibility quick-check; CLAUDE.md a11y ("Don't put onClick on <div>", icon-only controls need aria-label)
- **Where:** src/app/components/CosmicDustThree.tsx:865-875
- **Evidence:** `<div ref={clickTargetRef} onClick={handlePlanetClick} style={{ position: 'fixed', borderRadius: '50%', ... }} />` — the primary home-screen interaction (fly to portfolio) is a positioned div with no `role`, no `tabIndex`, no keyboard handler, no accessible name. A keyboard/SR user has an alternative path only via the ME page's PORTFOLIO button.
- **Proposed fix:** Add `role='button'`, `aria-label='Fly to portfolio'`, `tabIndex={0}`, and an `onKeyDown` for Enter/Space calling `handlePlanetClick`. Attributes only — does not touch the render loop that positions the element (the loop writes `style.*`, not attributes).

### [MEDIUM] FONT-01 — Inter next/font is loaded and preloaded but its CSS variable has zero consumers
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** L2 dead code (dead wiring); CLAUDE.md "UI controls must be wired end-to-end" analog
- **Where:** src/app/layout.tsx:1,9-12,37
- **Evidence:** `Inter({ subsets: ['latin'], variable: '--font-inter' })` and `className={inter.variable}` on `<html>` register the font under a hashed family name exposed only as `var(--font-inter)`. Repo-wide grep: nothing reads `--font-inter` (not globals.css, not tailwind.config.js, not any component). The literal `'Inter'` entries in font stacks (`typography.ts`, `globals.css:20`) do **not** match next/font's hashed family, so the downloaded webfont is never rendered — pure preload weight plus misleading wiring.
- **Proposed fix:** Either consume it (map `--font-inter` into the fallback stack via `@theme`/globals.css) or delete the `Inter` import, the constant, and the `className`. Needs-review: removing it changes the effective fallback only if a glyph misses in Alien Encounters — quick visual smoke on all four sections; byte-cost side of this belongs to the performance lens (cross-ref).

### [LOW] DEV-01 — useDevice convenience hooks have zero importers; 12 of 13 DeviceInfo fields unread
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L2 dead code
- **Where:** src/app/hooks/useDevice.ts:108-122 (+ fields at 5-18)
- **Evidence:** `useIsMobile`, `useIsTablet`, `useIsDesktop` — zero importers (grep). The single consumer of `useDevice` (`InteractiveTextSimple.tsx:26,31,37,42,46,57`) reads only `device.isMobile`; `type`, `isTablet`, `isLaptop`, `isDesktop`, `screenWidth`, `screenHeight`, `pixelRatio`, `isTouch`, `isIOS`, `isAndroid`, `hardwareConcurrency` are computed on every resize and never read.
- **Proposed fix:** Delete the three convenience hooks (mechanical). Optionally slim `DeviceInfo` to what is consumed (`isMobile`) — flag for the fixer as a follow-up judgement since it changes the hook's public shape.

### [LOW] EVT-01 — Two event channels carry the same fact: 'section-changed' and 'background-section'
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L1 pattern duplication / L3 coupling (one logical change → two emit sites + two map entries)
- **Where:** src/lib/events.ts:7,10; src/app/page.tsx:104-105; src/app/components/SimpleNavigation.tsx:9; src/app/components/BackgroundElements.tsx:14
- **Evidence:** `navigateToSection` fires both `emit('background-section', section)` and `emit('section-changed', section)` with the identical payload on every navigation; each has exactly one listener. Two names for one concept — a future emitter that fires only one desyncs nav from background.
- **Proposed fix:** Collapse to `'section-changed'`: point `BackgroundElements.tsx:14` at it, delete the `'background-section'` map entry and the extra emit. (The deeper issue — `SimpleNavigation` mirroring `HomePage.currentSection` as a second state copy — is the single-source-of-truth lens's seam; cross-referenced, not reported here.)

### [LOW] TXT-01 — InteractiveTextSimple: unused import, unused prop, unused destructures, never-read ref, commented-out code
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L2 dead code (unused parameters, commented-out code)
- **Where:** src/app/components/InteractiveTextSimple.tsx:3,13,16,59-62,65,206-209,265,272
- **Evidence:** `useEffect` imported (line 3) but only referenced inside commented-out blocks (59-62, 206-209 — "Gravitational effects disabled"); `wordIndex` declared in `WordProps` (13), destructured (16), passed at both call-sites (280, 288), never read; `offset: [ox, oy]` and `velocity: [vx, vy]` destructured in the drag callback (65) but shadowed/unused (fresh `ox`/`oy` consts at 75-76); `containerRef` (265) is attached at 272 but `.current` is never read.
- **Proposed fix:** Delete the commented blocks, the `useEffect` import, `wordIndex` (prop + interface field + both call-site props), the unused destructures, and `containerRef`. Purely mechanical; tsc gates it.

### [LOW] TAG-01 — Tagline copy hardcoded in three places
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** L3 magic-value duplication
- **Where:** src/app/page.tsx:60-61,63-64; src/app/layout.tsx:24-25
- **Evidence:** The string "you think it. i make it. you break it. i solve it. universe approves. we happy. thats a deal." appears twice in `MeSection` (the shimmer overlay span must mirror the base text exactly — an undocumented sync constraint) and once as the site `description` metadata. Editing the copy requires three synchronized edits; the shimmer visibly breaks if the two page copies drift.
- **Proposed fix:** `const TAGLINE = '...'` (module scope in page.tsx, imported by layout.tsx — or a small `src/lib/copy.ts`), referenced at all three sites.

### [LOW] LNK-01 — Contact link/button className triplicated inside MeSection
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** U1 duplicate component pattern (within-file, 3 copies)
- **Where:** src/app/page.tsx:73,80,87
- **Evidence:** The identical 130-char class string `'text-gray-500 hover:text-black active:text-black transition-colors font-alien text-sm sm:text-base tracking-wider py-3 px-3 min-h-[44px] inline-flex items-center'` is repeated on the EMAIL `<a>`, PHONE `<a>`, and PORTFOLIO `<button>` (button adds `bg-transparent border-none cursor-pointer`).
- **Proposed fix:** Hoist `const CONTACT_LINK_CLASS = '...'` at module scope (or a tiny `<ContactLink>` if the fixer prefers); three sites, one source.

### [LOW] RING-01 — SimpleNavigation Saturn rings: three near-identical divs, config-array candidate
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** yes
- **Rule:** L1 pattern duplication / L3 table-driven-config lever
- **Where:** src/app/components/SimpleNavigation.tsx:43-80
- **Evidence:** Three ring divs share the full class body (`'absolute inset-0 ... rounded-full border ... animate-spin-slow pointer-events-none'`) and an inline style block, differing only in margin (`-m-5/-m-3/-m-2`), size calc, `animationDuration` (60s/45s/30s), direction, opacity, and rotation. Same shape in three costumes.
- **Proposed fix:** `const RINGS = [{ margin, size, duration, direction?, border, rotate }, ...]` + one `.map()`. Values copied verbatim. Needs-review because the diffs are animation timing/visual values — eyeball the rings after.

### [LOW] ME-01 — MeSection defined inline in page.tsx while sibling sections have their own files
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** U7 page-structure consistency; CLAUDE.md "one component per file"
- **Where:** src/app/page.tsx:11-96
- **Evidence:** `PortfolioSection` and `GameSection` live in `src/app/components/`; the 86-line `MeSection` is defined inside `page.tsx`, making the page file the odd one out and burying the contact links.
- **Proposed fix:** Move verbatim to `src/app/components/MeSection.tsx` (pairs naturally with SHELL-01 — do the move first, the shell extraction second).

### [LOW] NAME-01 — File named InteractiveTextSimple.tsx exports InteractiveText
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** U4 placement/naming convention (legacy "Simple" suffix from a removed variant)
- **Where:** src/app/components/InteractiveTextSimple.tsx:264; src/app/page.tsx:5
- **Evidence:** `export default function InteractiveText()` in a file named `InteractiveTextSimple.tsx`; the importer already aliases it to `InteractiveText`. No non-"Simple" sibling exists — the suffix is a leftover.
- **Proposed fix:** `git mv` to `InteractiveText.tsx`, update the one import. Rename-only commit (per lens rules, separate from any dedup work in the same file).

### [LOW] GLSL-01 — Warp streak/burst math duplicated between particle and star shaders
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** L1 math/algorithm duplication
- **Where:** src/app/components/CosmicDustThree.tsx:241 vs 311-312 (intensity curve), 270-276 vs 344-350 (fragment UV rotate + stretch)
- **Evidence:** `float intens = warp * 0.35 + warp * warp * 0.65;` appears in both vertex shaders, and the fragment-shader streak block (rotate `gl_PointCoord` by `vRadialAngle`, stretch Y by `mix(1.0, 8.0|12.0, vWarp*vWarp)`, `exp(-d*d*K)` falloff) is copy-pasted with only the stretch/falloff constants differing. A tweak to the warp feel must be made twice, in sync.
- **Proposed fix:** Extract shared GLSL chunks as template constants (e.g. `WARP_INTENSITY_GLSL`, a parameterized streak function) composed into both shader strings — best folded into the CD-01 shader extraction. Needs-review: shader code, visual verification mandatory.

### [LOW] Z-01 — Hardcoded z-index literals while a zIndex token scale exists
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** U3 partial token usage; CLAUDE.md "Avoid z-index wars… use theme tokens"
- **Where:** src/app/components/CosmicDustThree.tsx:862,873,886; src/app/components/InteractiveTextSimple.tsx:176,251; src/app/components/SimpleNavigation.tsx:39; src/styles/sizing.ts:46-60
- **Evidence:** `sizing.ts` defines a full `zIndex` scale but only `zIndex.modal` (1400, the frame — index.ts:22) is consumed. Live stacking uses ad-hoc literals: canvas container `1`, click target `2`, warp overlay `100` (CosmicDust), dragging word `100`/scattered letter `60`/resting word `50` (InteractiveText), nav `z-50` (Tailwind = 50). Note the warp overlay (100) intentionally sits *below* the frame (1400) — any consolidation must preserve that ordering.
- **Proposed fix:** Define the app's actual layers as named tokens (`background: 1`, `clickTarget: 2`, `content: 10`, `nav: 50`, `warpOverlay: 100`, `frame: 1400`) in `sizing.ts` (trimming the unused generic scale per ST-01) and sweep the literals. Needs-review: stacking changes can regress visuals the gate can't catch.

### [LOW] HEX-01 — One-off hardcoded gradient hexes in MeSection shimmer
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** U3 hardcoded values instead of design tokens
- **Where:** src/app/page.tsx:33,51
- **Evidence:** Inline style gradients hardcode `#9ca3af`, `#6b7280`, `#374151`, `#1f2937` (Tailwind gray-400/500/700/800 values) — none exist in `colors.ts` (whose own `gray` scale is the unused Material palette, per ST-01: two gray systems, neither canonical).
- **Proposed fix:** After ST-01 settles which gray scale is canonical, express the shimmer stops from tokens (or document them as intentional one-offs next to the effect). Needs-review: the shimmer is a tuned visual effect.

---

## Cross-references (other lenses' seams — not double-reported here)

- **prefers-reduced-motion is absent repo-wide** (0 hits in `src/`): every animation (GSAP warp timeline, framer fades, spin-slow rings, react-spring scatter, Three loop) runs unconditionally. Binding says treat as a real finding — owned by **mobile-ux** (its binding names the reduced-motion convention).
- `SimpleNavigation` keeps a mirror copy of `currentSection` synced via events with `HomePage` (SimpleNavigation.tsx:7-9 vs page.tsx:100) — **single-source-of-truth** lens.
- `springConfig` object rebuilt every render in `DraggableWord` (InteractiveTextSimple.tsx:29-49) and un-cleaned `setTimeout`s (lines 92, 132) — **performance** / **interaction-resilience** lenses respectively.
- Missing render-loop/context-loss guards in `CosmicDustThree` — **interaction-resilience**.

## Fix plan

- **Phase A (safe deletions, 1:1):** GAME-01, ST-01, DEV-01, TXT-01 — pure zero-importer deletions, gate after each.
- **Phase B (small extractions):** TAG-01, LNK-01, NAV-01, EVT-01, A11Y-01, ME-01, NAME-01.
- **Phase C (needs-review structural):** SHELL-01, RING-01, FONT-01, SAT-01, TW-01 (TW-01 decides the token wiring that SAT-01/HEX-01/Z-01 build on — do it first within this phase).
- **Phase D (deferred, own PR each):** CD-01 shader/config extraction, GLSL-01 (fold into CD-01), Z-01, HEX-01, GAME-02 (product decision).
