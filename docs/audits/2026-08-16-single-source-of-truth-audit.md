# 2026-08-16 — single-source-of-truth-audit (rkportfolio)

- **Lens:** single-source-of-truth-audit (`/Users/raitiskraslovskis/projects/prompts/webapp/single-source-of-truth-audit.md`)
- **Scope:** `src/**` (single frontend app per runner binding)
- **Branch:** `audit/2026-08-16`
- **Baseline (recorded, verified by orchestrator, not re-run):** `npx tsc --noEmit` exit 0, `yarn lint` clean, `yarn build` succeeds.
- **Binding notes:** No backend, no API, no commerce entities — the lens's S5
  (frontend re-deriving backend decisions) is N/A by architecture. The lens maps
  onto this repo as: values/decisions that must agree across components
  (section state, breakpoints, font stacks, theme colors, shader constants).

## Summary

| Severity | Count |
|---|---|
| critical | 0 |
| high | 1 |
| medium | 3 |
| low | 4 |

`safe` + `auto-fixable: yes`: 3 (SSOT-2, SSOT-4, SSOT-8). `needs-review`: 5.

Highest-risk item: **SSOT-1** — the font system has three competing definitions
and the one all 12 `font-alien` class usages point at (`tailwind.config.js`) is
never loaded under Tailwind v4, so the site's typography is correct only by
accident of an unlayered `body` rule.

---

### [HIGH] SSOT-1 — Font stack defined in three places; the canonical one is a phantom (Tailwind v4 never loads `tailwind.config.js`)
- **Severity:** high
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens S1/S4 — one definition for a display value shown everywhere; "the rule lives nowhere" failure. Binding: "Design tokens … no raw hex/px in components"; CLAUDE.md "Canvas font is defined once as a constant" analogue for CSS fonts.
- **Where:**
  - `tailwind.config.js:9-13` (fontFamily `sans`/`alien`/`alien-solid`/`nabla`) — dead config
  - `src/styles/globals.css:1` (`@import "tailwindcss"`), `src/styles/globals.css:20` (`font-family: 'Alien Encounters', 'Inter', system-ui, sans-serif;`)
  - `src/styles/typography.ts:2-33` (`fonts.sans`/`fonts.alien`/`fonts.alienSolid`/`fonts.nabla` — a third, drifted definition)
  - Consumers of the phantom utility: `src/app/page.tsx:30,73,80,87`, `src/app/components/SimpleNavigation.tsx:94`, `src/app/components/PortfolioSection.tsx:54,57`, `src/app/components/GameSection.tsx:18`, `src/app/not-found.tsx:7,10,13,18` (12 × `font-alien`), plus `font-sans` on `src/app/layout.tsx:39`
- **Evidence:**
  - `tailwindcss@4.1.13` (package.json + `node_modules/tailwindcss/package.json`). Tailwind v4 does not auto-detect legacy JS configs; they must be opted in with `@config "…/tailwind.config.js"` in the CSS. `grep -rn "@config" src --include="*.css"` → no matches. Therefore `font-alien`, `font-alien-solid`, `font-nabla` utilities are **never generated**; the 12 `font-alien` classes are no-ops.
  - Text still renders in Alien Encounters only because `globals.css:17-20` sets it on `body` as an **unlayered** rule (unlayered beats Tailwind's `@layer utilities`, which is also why the `font-sans` utility on `layout.tsx:39` doesn't clobber it with Tailwind's default sans stack — correctness by cascade accident, twice over).
  - The three definitions have already drifted: `typography.ts` `fonts.sans` is a 13-entry stack with `-apple-system`/`BlinkMacSystemFont`; `tailwind.config.js` and `globals.css` use `system-ui`. `fonts.alien` (`'Alien Encounters', 'Inter', sans-serif`) is only consumed by `src/styles/index.ts:29,38` (`nameText`/`nameTextMobile` → `InteractiveTextSimple`), so the hero words and the rest of the site take their font from **different sources**.
  - Staleness corroboration: `tailwind.config.js:5` content glob `./src/components/**` points at a directory that doesn't exist (components live in `src/app/components/`).
- **Proposed fix:** Pick one source of truth for font stacks. Recommended: define them once in Tailwind v4's CSS-first theme — `@theme { --font-sans: …; --font-alien: …; --font-alien-solid: …; --font-nabla: …; }` in `src/styles/globals.css` — delete `tailwind.config.js`, and make `src/styles/typography.ts` `fonts.*` mirror the same strings with a comment binding them to the `@theme` block (TS↔CSS can't share without a build step; the mirror must be deliberate and documented). Drop the redundant hardcoded stack on `body` in favor of `font-sans` resolving correctly. **needs-review because:** once `font-alien`/`@theme` become real, utilities start applying where they previously did nothing — requires a visual pass on every page (fonts are the site's identity), and the `body`-rule/cascade interaction must be re-verified. Migration check: with `@theme` in place, confirm rendered font-family in devtools on home, me, portfolio, 404.

### [MEDIUM] SSOT-2 — Current section stored in three separate `useState`s, synced by hand over two duplicate event channels
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens S3 (stored derived state kept in sync by hand, cross-component); CLAUDE.md "State must have a single source of truth. Never store the same value in two places."
- **Where:**
  - `src/app/page.tsx:100` — `useState<SectionName>('home')` (the writer/owner)
  - `src/app/components/SimpleNavigation.tsx:7` — second copy, `useState<SectionName>('home')`
  - `src/app/components/BackgroundElements.tsx:12` — third copy, `useState<SectionName>('home')`
  - `src/lib/events.ts:7,10` — two event names carrying the identical payload
- **Evidence:** `page.tsx:102-106` (`navigateToSection`) broadcasts the same value twice under two names:
  ```ts
  setCurrentSection(section);
  emit('background-section', section);
  emit('section-changed', section);
  ```
  `SimpleNavigation` subscribes to `section-changed` (line 9) **and** writes its own copy directly in `handleNavigate` (line 12: `setCurrentSection(section)`) before emitting `navigate` — so its copy has two write paths and receives a redundant echo on every navigation. `BackgroundElements` subscribes to the parallel `background-section` channel (line 14). Drift path: any future emitter (e.g. the game section — `events.ts:12-15` already reserves game events) that fires one channel but not the other, or sets one local copy directly, desynchronizes the nav filter (`SimpleNavigation.tsx:24-34`) from the WebGL background's `section` prop. Three independent `'home'` initial-value literals also mean a component mounted after a navigation starts on the wrong section.
- **Proposed fix:** One owner, one channel. Keep `HomePage` as the single writer; collapse `background-section` into `section-changed`: (1) `BackgroundElements.tsx:14` subscribes to `'section-changed'`; (2) delete the `'background-section'` emit at `page.tsx:104` and its entry in `events.ts:10`; (3) delete the local `setCurrentSection(section)` in `SimpleNavigation.tsx:12` — the synchronous `section-changed` echo from `navigateToSection` is the only write path. No render-loop code is touched (`CosmicDustThree` still receives `section` as a prop). Verify: nav-item filtering still updates on HOME PLANET / ME clicks and after the warp's `emit('navigate', 'portfolio')` (`CosmicDustThree.tsx:416`).

### [MEDIUM] SSOT-3 — Site background cream `#f5f1e8` (and the full Saturn ramp) defined in four places, three formats
- **Severity:** medium
- **Fix risk:** needs-review
- **Auto-fixable:** no
- **Rule:** Lens S4 (one definition, used everywhere — the color analogue of formatting drift); binding "Design tokens: `src/styles/colors.ts` … no raw hex/px in components".
- **Where:**
  - `src/styles/colors.ts:31-39` — `colors.saturn.lightest: '#f5f1e8'` … `darkest: '#d4c4a8'` (the nominal token source)
  - `src/styles/globals.css:5-11` — html gradient hardcodes all five Saturn hexes
  - `src/app/layout.tsx:19` — `themeColor: '#f5f1e8'` hardcoded (this is the mobile-fullscreen browser-chrome color from the recent `theme-color` fix — commit `6558c3d`)
  - `src/app/components/CosmicDustThree.tsx:881` — warp overlay `backgroundColor: 'rgba(245, 241, 232, 0.85)'` (245,241,232 ≡ `#f5f1e8` in a third notation)
- **Evidence:** The warp overlay must be indistinguishable from the page background for the hyperspace white-out to read as seamless, and `themeColor` must match the top of the gradient for the mobile fullscreen look — yet neither reads `colors.saturn.lightest`. A palette tweak in any one place silently desyncs browser chrome, page gradient, and warp overlay (a visible flash mid-warp).
- **Proposed fix:** Make `colors.saturn` authoritative for everything TS-reachable: `layout.tsx` `themeColor: colors.saturn.lightest` (layout already imports from `@/styles`); `CosmicDustThree.tsx:881` overlay derived from the same token (e.g. a `hexToRgba(colors.saturn.lightest, 0.85)` helper or an exported `OVERLAY_CREAM` constant next to the token). The CSS gradient in `globals.css` cannot import TS — either move the Saturn ramp into `@theme` CSS variables (and have `colors.ts` mirror them with a binding comment, ideally as part of the SSOT-1 fix) or annotate both sides as a deliberate mirror. **needs-review because:** the canonical-side decision (CSS variables vs TS tokens) interacts with SSOT-1, and the overlay sits in the Three.js component where a wrong alpha/notation change would regress the warp visual.

### [MEDIUM] SSOT-4 — "Is this mobile?" decided from raw `window.innerWidth < 768` in two independent places (token exists but is unused)
- **Severity:** medium
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens S1 (same decision computed from raw fields in two components); CLAUDE.md "Responsive breakpoints come from theme … Never hardcode `640px` or `900px`."
- **Where:**
  - `src/app/hooks/useDevice.ts:21` — `if (width < 768) return 'mobile';` (the canonical device source)
  - `src/app/components/CosmicDustThree.tsx:447` — `const isMobile = width < 768;` (independent re-derivation; feeds antialias, DPR cap, particle count, star count at lines 448-450, 456, 588)
  - `src/styles/sizing.ts:39` — `containers.md: '768px'` exists as a token but neither call site uses it
- **Evidence:** Two components answer "is mobile?" from the same raw field with a duplicated magic number. If one is retuned (e.g. tablets get the reduced particle budget), the other silently keeps the old rule and the device model contradicts the render budget. Compounding drift already visible: JS says mobile below **768** while the styling layer switches at Tailwind's `sm` = **640** (`src/styles/globals.css:54`; `sm:` variants throughout). Concretely, at 640–767px wide, `InteractiveTextSimple.tsx:57` picks `nameTextMobile` (30px font, via `useDevice`) while its container at `page.tsx`/`InteractiveTextSimple.tsx:273` applies desktop `sm:pt-12 sm:pl-12` padding — mobile type inside desktop layout.
- **Proposed fix:** Mechanical part (safe, in-scope for a fixer): export a single named constant — e.g. `export const MOBILE_BREAKPOINT = 768;` in `src/styles/sizing.ts` beside `containers` — and use it in `useDevice.ts:21` and `CosmicDustThree.tsx:447` (identical value; init-time code, not the render loop, so no visual change). The 640-vs-768 policy question (should JS "mobile" align with Tailwind `sm`?) is a design decision — flag for **mobile-ux** to confirm at runtime; do not auto-change the value.

### [LOW] SSOT-5 — Planet stripe count `14` defined twice: fragment shader and JS particle-formation math must agree
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** yes
- **Rule:** Lens S1/S2 — one rule ("how many stripes does the planet have") implemented independently in two renderers that must match.
- **Where:** `src/app/components/CosmicDustThree.tsx:94` (`float stripeCount = 14.0;` in `planetFragmentShader`) and `src/app/components/CosmicDustThree.tsx:473` (`const stripeCount = 14.0;` in particle attribute init, drives `targetPhi` band targeting at lines 508-515)
- **Evidence:** The sphere mesh draws 14 stripes; the particle formation targets bands computed from a separate literal 14. Change one and the assembled particle stripes no longer land on the planet's stripes — a silent visual mismatch only visible after the full 5s formation animation. The file already has the correct pattern for exactly this problem: `PLANET_TILT_COS`/`PLANET_TILT_SIN` (lines 74-75) and `BALLS[n].radius` (line 149) are single JS constants interpolated into the shader template literal.
- **Proposed fix:** Hoist `const STRIPE_COUNT = 14;` next to `PLANET_TILT_*`, interpolate into `planetFragmentShader` (`float stripeCount = ${STRIPE_COUNT.toFixed(1)};`) and use it at line 473. Output-identical substitution, but it edits shader source → **needs-review** per the hard rule; verify planet stripes + particle formation visually after.

### [LOW] SSOT-6 — Warp intensity easing curve duplicated across particle and star vertex shaders
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** yes
- **Rule:** Lens S2 — the same derived value (warp intensity as a function of progress) implemented in N renderers that must stay in lockstep.
- **Where:** `src/app/components/CosmicDustThree.tsx:241` and `src/app/components/CosmicDustThree.tsx:310` — both: `float intens = warp * 0.35 + warp * warp * 0.65;`
- **Evidence:** Particles and background stars must accelerate on the same curve for the warp to read as one coherent camera move (the code itself asserts this intent: line 743 comment "Star warp center matches particle warp center"). Retuning the easing in one shader but not the other desyncs the two layers mid-warp. (The streak multipliers — 8.0 at line 274 vs 12.0 at line 348 — and gaussian falloffs — 18.0 vs 22.0 — differ deliberately and are NOT flagged.)
- **Proposed fix:** Extract one shared GLSL snippet, e.g. `const WARP_INTENSITY_GLSL = 'float intens = warp * 0.35 + warp * warp * 0.65;';`, and interpolate it into both vertex shaders (same injection pattern as SSOT-5). Output-identical; **needs-review** because it edits shader source.

### [LOW] SSOT-7 — Warp/time uniforms hand-copied between two materials every frame instead of sharing one uniform object
- **Severity:** low
- **Fix risk:** needs-review
- **Auto-fixable:** yes
- **Rule:** Lens S3 — the same value stored in two places (`material.uniforms` and `starMaterial.uniforms`) and synced manually per frame.
- **Where:** `src/app/components/CosmicDustThree.tsx:728-729` (`starMaterial.uniforms.uTime.value = time; starMaterial.uniforms.uWarpProgress.value = u.uWarpProgress.value;`) and `:744` (`starMaterial.uniforms.uWarpCenter.value.copy(u.uWarpCenter.value);`), duplicating `:554-555,614-616`
- **Evidence:** `uWarpProgress` has one writer (the GSAP timeline at `CosmicDustThree.tsx:410,417` tweens the particle material's uniform) and the star material mirrors it by copy in the rAF loop. Works today, but it's the manual-sync shape: any new code path that writes the star uniform directly (or a reordered loop) lets the two layers disagree for a frame or forever.
- **Proposed fix:** Share the uniform *objects*: create `const uTime = { value: 0 }`, `uWarpProgress = { value: 0 }`, `uWarpCenter = { value: new THREE.Vector2() }` once and pass the same object references into both materials' `uniforms` maps. Three.js reads `.value` per material, so both shaders see one write; delete the three per-frame copy lines. **needs-review** — touches render-loop plumbing; verify warp visuals (particles + star streaks fire together) after.

### [LOW] SSOT-8 — Tagline copy tripled: metadata description + shimmer overlay + base text must match character-for-character
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** Lens S2 — same display content inlined in N surfaces; drift is user-visible.
- **Where:** `src/app/layout.tsx:24-25` (metadata `description`), `src/app/page.tsx:60-61` (animated shimmer `<m.span>`), `src/app/page.tsx:63-64` (base paragraph text)
- **Evidence:** The shimmer effect works by absolutely overlaying an identical string on the base text (`page.tsx:39-62`); a one-character edit to either copy visibly misaligns the gradient sweep. The third copy (SEO description) silently drifts from the on-page tagline. All three are the same sentence: "you think it. i make it. you break it. i solve it. universe approves. we happy. thats a deal."
- **Proposed fix:** Extract `export const TAGLINE = '…';` into a tiny shared constants module (e.g. `src/lib/content.ts` — pure string module, importable from both the server `layout.tsx` metadata and the client `page.tsx`); render it in all three places. Mechanical, no visual change.

---

## Cross-references (observed, owned by other lenses — not double-reported here)

- **Section-shell layout classes** (`min-h-dvh relative z-10 flex items-center …` + heading classes) duplicated verbatim across `MeSection` (`page.tsx:18,23`), `PortfolioSection.tsx:32,36`, `GameSection.tsx:12,15` → structural duplication / missing shared primitive → **ui-and-modularity-audit**.
- **Viewport-height convention drift** — `min-h-screen` in `not-found.tsx:5` vs `min-h-dvh` (sections) / `min-h-svh` (`layout.tsx:39`) / `100svh` (`globals.css:15,26`) → phone-visible break is **mobile-ux**; the convention/tokenization is **ui-and-modularity**.
- **Dead modules with zero consumers** — `src/lib/gameLoop.ts`, `src/lib/input.ts`, `useIsMobile`/`useIsTablet`/`useIsDesktop` (`useDevice.ts:109-122`), unused token groups in `colors.ts`/`sizing.ts`, unused game events in `events.ts:12-15` → **ui-and-modularity-audit** (dead code).
- **Hand-rolled rAF loop** in `CosmicDustThree.tsx:643-646` duplicating the dt-clamp pattern of the shared `src/lib/gameLoop.ts:13-17` (`Math.min(…, 0.05)`) → missed shared primitive → **ui-and-modularity-audit**; loop/cleanup cost → **performance-audit**.
- **`sectionRef` prop mirror** inside `CosmicDustThree.tsx:389,849` — single-component ref mirror for rAF access (legitimate render-loop pattern) → **state-audit** seam if it wants it.
- **Nav visibility filtering by display string** (`item.word === 'ME'`, `SimpleNavigation.tsx:26-33`) instead of the canonical `item.section` id — single-component fragility, no cross-component drift → left to **ui-and-modularity/state** discretion.
