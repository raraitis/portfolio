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

### Open — needs owner review (deferred by design, never auto-fixed)

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
