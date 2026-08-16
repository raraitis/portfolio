# QA Audit Ledger — rkportfolio

Running record of webapp-audit findings: what was fixed, what is open, and why.
Per-lens detail lives in the dated reports in this directory.

## 2026-08-16 — full pass (all 8 lenses), branch `audit/2026-08-16`

Baseline before fixes: tsc 0 / lint clean / build OK. Final gate after fixes:
tsc exit 0, lint exit 0, build exit 0. 85 raw findings → 38 fixed, rest deferred.
Nothing pushed or deployed.

### Resolved (finding → commit)

| Finding | Fix | Commit |
|---|---|---|
| TXT-01, CD-01..05, STATE-04, PERF-09, IR-G3 | InteractiveText dead code/comments, prop-mirror state, timer cleanup, floor clamp | `79b8532` |
| NAME-01 | file renamed to InteractiveText.tsx | `1870cdd` |
| DEV-01, PERF-08, STATE-03, SSOT-4 | useDevice slimmed to consumed shape, debounced, equality bail-out, shared `MOBILE_BREAKPOINT` | `eeab5e3` |
| NAV-01, STATE-06/PERF-11, MUX-03 | nav by section id, memoized derivation, safe-area insets | `461f771` |
| ST-01, CD-08 | ~240 dead style-token lines deleted | `0d1fa36` |
| CD-07 | event-bus header rewritten | `03ce949` |
| ME-01, SSOT-8/TAG-01, LNK-01, MUX-09, MUX-04, MUX-08 | MeSection extracted, tagline constant (`src/lib/content.ts`), contact-row wrap, 44px+ links, dvh | `ea7d62c` |
| A11Y-01 | planet target: role/tabIndex/aria-label/keydown | `dba871c` |
| IR-B1 | `error.tsx` + `global-error.tsx` boundaries | `ce0cad5` |
| MUX-01 | `maximumScale: 1` removed — pinch-zoom restored (WCAG 1.4.4) | `992a1b8` |
| PERF-03 | fonts.css pruned to 2 reachable faces, ~1.76 MB dead binaries deleted, primary face preloaded | `911ae13` |
| PERF-04 | immutable Cache-Control for `/fonts/*` | `ea21c7d` |
| SEC-07 | deprecated X-XSS-Protection removed | `b18f81e` |
| SEC-10 | orphaned `public/workers/backgroundWorker.js` deleted | `91aacf0` |
| SEC-01 | next 15.5.12 → 15.5.23, both lockfiles | `5688084` |
| SEC-06 | vulnerable build/dev transitives refreshed in range (`npm audit` 11 → 3) | `fa861c0` |
| SEC-04 | unused `/_next/image` optimizer disabled | `4fb9625` |

## 2026-08-16 — "fix all" round: deferred set implemented

Owner authorized fixing the needs-review set. 24 further commits on
`audit/2026-08-16`, gate green after every one, then a production-mode browser
smoke test (Chrome DevTools, desktop + 375×667): home/ME/Work render correctly,
full warp journey works, **mid-warp abort verified** (fresh nav wins, no forced
jump at t=3.8s, overlay returns to rest, planet clickable again), no horizontal
overflow at 375px, 44px+ touch targets, 15px mobile tagline, reduced-motion
gives instant navigation with the loop parked. Console clean except a
pre-existing `favicon.ico` 404 (site has no favicon — cosmetic follow-up).

Resolved in this round (finding → what happened):

| Finding(s) | Resolution |
|---|---|
| GAME-01/02, STATE-05 | game scaffolding deleted (~160 lines; git history preserves it) |
| SEC-02 | CSP: `unsafe-eval` now dev-only; `base-uri`/`form-action`/`object-src` added |
| SEC-03, SEC-08 | HSTS (1y, deliberately no includeSubDomains/preload), COOP/CORP same-origin |
| SEC-05 | package-lock.json deleted — yarn.lock is the single lockfile (Railway builders pick yarn) |
| SEC-09 | security.txt rewritten: monitored contact only, RFC 9116 fields |
| follow-up | fonts converted to woff2 (20 KB → 4.3 KB each), preload updated |
| TW-01 / SSOT-1 | `@theme` font tokens are the single source; `.font-alien` emits real CSS (verified in built css); tailwind.config.js deleted |
| SAT-01 / SSOT-3, HEX-01, Z-01 | Saturn ramp/shimmer/z-index single-sourced (CSS vars + colors.ts mirror, byte-identical) |
| PERF-02 / FONT-01 | resolved as KEEP: Inter is load-bearing (plain-name registration + punctuation glyphs); constraint documented in layout.tsx |
| IR-G1 / STATE-02 | drop/scatter chain generation-guarded and interruptible; mid-flight catch holds the word under the pointer |
| MUX-10 | scatter landing points clamped to viewport (letters stay visible at 375×667) |
| SHELL-01, RING-01 | SectionShell primitive extracted; Saturn rings table-driven (DOM identical) |
| MUX-11 | nav labels 13px / tagline 15px on mobile |
| IR-N1 | PORTFOLIO triggers disable + dim + aria-busy during the warp |
| PERF-01 / MUX-02 | full `prefers-reduced-motion` support: MotionConfig + CSS guard + react-spring immediate + WebGL loop parks (one frame per state change) + warp becomes instant arrival |
| ui CD-01, SSOT-5/6, GLSL-01 | CosmicDustThree 893 → 686 lines; shaders/config extracted; stripe count, warp curve, streak block single-sourced |
| SSOT-7 | particle/star materials share the same uniform objects; per-frame hand-copies deleted |
| IR-B2, IR-B3, IR-R1 | WebGL-unavailable bail (site survives), context-loss pauses the loop, kickoff rAF id stored + self-terminating loop |
| IR-R2, STATE-07, PERF-10 | fresh navigation kills the warp timeline (no forced jump), handler identity stabilized, section tweens tracked/killed |
| PERF-06, MUX-07 | click target moves via translate3d+scale (no layout invalidation); pointerdown beats the moving target |
| MUX-05 | mobile budget decided by the smaller viewport dimension (landscape phones included) |
| MUX-06 / PERF-07 | warp overlay: gsap autoAlpha (participates only while visible), no backdrop blur on phones, fill derived from the palette token |
| STATE-01 / SSOT-2 / EVT-01 | one `section-changed` channel, HomePage the single writer |
| CD-06 | render-loop comment rewritten to current state |

## 2026-08-16 — follow-up round: Next 16 + favicon

- **next 15.5.23 → 16.3.1** — `yarn audit` now reports **0 vulnerabilities**
  (next 16 ships sharp 0.35.3 and unpins postcss). `next lint` was removed in
  16, so lint runs the ESLint CLI against `eslint.config.mjs` (FlatCompat over
  `next/core-web-vitals`). tsconfig auto-migrated by next (react-jsx runtime).
- **eslint-config-next stays 15.x deliberately** — its 16.x chain requires
  node ^20.19 || ^22.13 || >=24 and this machine runs 23.9; `--ignore-engines`
  would commit a lockfile that fails plain `yarn install`. Bump it together
  with a local node LTS upgrade.
- **Favicon added** — `src/app/icon.svg`, a striped-planet mark from the
  Saturn palette; the tab icon 404 is gone.
- Re-verified in a production-mode browser session on next 16: home/ME/warp
  journey works, CSP has no `unsafe-eval`, HSTS present, icon served, console
  clean.

### Still open (deliberate, with reasons)

| Item | Reason |
|---|---|
| eslint-config-next 15.x → 16.x | blocked on a local node LTS upgrade (see above); lint-only dependency, ships nothing |
| PERF-05 react-spring+use-gesture → framer consolidation | framer drag requires the `domMax` bundle, which would give back the savings; two-library status quo documented |
| MUX-12 nav thumb-reach | relocating the Saturn-rings nav is a redesign decision, not a defect |
| Real-device tap test (MUX-07 residual) | pointerdown implemented and desktop-verified; a physical-phone pass remains worthwhile |

### Open — resolved by the fix-all round (historical list below)

| Finding(s) | Issue | Why deferred |
|---|---|---|
| ui CD-01 | CosmicDustThree.tsx 893 lines — shader/config split | render-loop surgery, visual risk |
| TW-01 / SSOT-1 | tailwind.config.js dead under Tailwind v4; `font-*` utilities are no-ops; font stack ×3 drift | changes what every font class does |
| IR-B2, IR-B3 | unguarded `new THREE.WebGLRenderer()` blanks site without WebGL; context-loss residual gap | Three.js setup path |
| IR-R2, PERF-10, STATE-07 | warp timeline force-nav clobber, unkilled competing GSAP tweens, pinned closure | signature animation choreography |
| PERF-01 / MUX-02 | no `prefers-reduced-motion` gating anywhere | spans WebGL/GSAP/framer/CSS, needs visual sign-off |
| STATE-01 / SSOT-2 / EVT-01 | section state ×3 components, 2 redundant event channels | channels feed warp choreography |
| PERF-02 / FONT-01 | Inter next/font removal — **audit premise disproven**: Next 15.5.9 registers the plain `Inter` family; Alien Encounters lacks 24 punctuation glyphs (the `\|` separators render in Inter today). Keep deliberately, or accept system-ui fallback | verified real consumer |
| SEC-02, SEC-03, SEC-08 | CSP hardening (`unsafe-eval`, `base-uri`), HSTS, COOP/CORP | can silently break Next/Three; domain-wide effects |
| SEC-05 | dual lockfiles — which does Railway use? | deploy-infra fact needed; then drop one |
| SEC-09 | security.txt advertises dead endpoints | monitored contact is an owner decision |
| npm audit residue | 3 high remain: next 15.x exact-pins postcss@8.4.31 + sharp <0.35.0; runtime reachability removed by SEC-04 | full clearance = next@16 major (owner call) |
| GAME-01/02, STATE-05 | dead game modules + unreachable `'game'` section | staged future feature — product call |
| SAT-01 / SSOT-3, HEX-01, Z-01 | Saturn palette ×4 places, hardcoded hexes/z-indexes | token consolidation touches theme-color |
| SSOT-5/6/7, GLSL-01 | shader constants/easing/uniforms duplicated | shader edits |
| SHELL-01, RING-01 | section-shell primitive, nav-rings config array | visual refactors |
| IR-G1 / STATE-02 | re-drag-mid-drop gesture redesign (mechanical timer cleanup done) | animation feel |
| MUX-05/06/07/10/11/12, IR-N1, IR-R1, PERF-05/06/07 | landscape budget, warp blur, moving tap target, scatter physics, label sizes, thumb reach, warp affordance, first-rAF id, animation-stack consolidation | visual/perf review or runtime confirmation |
| CD-06 | render-loop comment rewrite (comment-only) | inside render loop, reviewer confirms diff |

### Queued for live-journey-qa (needs-runtime)

Landscape particle budget, warp blur jank, moving-planet tap reliability, nav
safe-area in landscape/standalone, 360px contact-row width, scatter-off-screen.

### Follow-ups noted

TTF→woff2 conversion of the two kept faces (needs `fonttools`/`woff2_compress`).
