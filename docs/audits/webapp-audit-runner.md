# Web-App Audit Runner — rkportfolio

Point me at this file (e.g. *"run the webapp audit runner"*, optionally naming
prompts) and I will execute the reusable audit/sweep prompts in
[`/Users/raitiskraslovskis/projects/prompts/webapp`](/Users/raitiskraslovskis/projects/prompts/webapp)
against this repo.

Those prompts are **stack-neutral**: each ends with a *Project Binding*
appendix that is the only project-specific part. This file pre-fills that
binding for rkportfolio **once**, so I skip re-deriving the stack on every run
and go straight to auditing.

---

## How to invoke

> Run the webapp audit runner. `<scope>`

`<scope>` is optional:

- **No scope** → run the full audit pass in the order below (report-only first,
  then ask before fixes).
- **Prompt names** (e.g. `security`, `performance`, `state`, `ssot`,
  `ui-modularity`, `resilience`, `mobile-ux`, `comment-debloat`,
  `unit-test-plan`) → run only those.
- **`report-only`** → produce findings reports, make no edits.
- **`fix`** → after the report, execute fixes under the gate + branch policy.

If `<scope>` is ambiguous, I default to **report-only, full pass** and confirm
before editing.

---

## Execution contract (applies to every prompt)

1. **Read [`prompts/webapp/README.md`](/Users/raitiskraslovskis/projects/prompts/webapp/README.md)
   first**, then the specific prompt file. Use the binding below verbatim — do
   **not** re-discover the stack.
2. **Report before fixes.** Each audit writes a structured findings report to
   `docs/audits/<YYYY-MM-DD>-<prompt>.md` (today via the session date) *before*
   any edit. No skipping to code.
3. **Respect ownership boundaries** (next section) so two audits never
   double-report the same seam.
4. **Gate is hard.** There is no test suite (yet — `unit-test-plan` decides
   whether one is warranted). The gate is: `npx tsc --noEmit` exit 0 +
   `yarn lint` clean + `yarn build` succeeds. Because the gate can't catch
   visual regressions, anything touching the Three.js scene, shaders, animation
   timing, or canvas sizing/DPR is `needs-review`, never auto-fixed.
5. **Branch policy.** Fixes go on an `audit/<YYYY-MM-DD>` branch off current
   HEAD, small scoped commits (one concern each), never pushed. Deploying
   (Railway builds from `main`) is the user's explicit call.
6. **No throwaway scripts** committed; probes go in shell history. **No UI
   explainer banners.** **No emojis.**
7. **Close the loop.** After fixes, update `docs/audits/QA_AUDIT.md` (resolved
   items + new findings) and re-run the gate.

### Run order (full pass)

Single frontend app, no backend lens. Order: **single-source-of-truth → state →
ui-and-modularity → resilience → performance → mobile-ux → security**.
Cross-cutting: **comment-debloat** last (cosmetic, must not mask logic diffs);
**unit-test-plan** to decide whether/what to cover. Pair **mobile-ux** with
**live-journey-qa** (dev server on port 3002) to confirm `needs-runtime`
findings in a real phone-sized browser.

### Ownership boundaries (don't double-report)

- **Derived state** — synced-via-effect *inside one component* → **state-audit**;
  the *same value recomputed across components* → **single-source-of-truth**.
- **Oversized files / god components** — lever selection → **ui-and-modularity
  (L9)**; the state-reduction angle → **state-audit (P5)**.
- **Re-render cost & cleanup** — as *performance* (memo, rAF discipline, leak
  checklist) → **performance-audit (§8/§12)**; as *architecture* (over-broad
  reads, effect-chains) → **state-audit (M6/P7)**.
- **Interaction robustness** — the *behavioural* guarantee (a render crash is
  contained, an out-of-order async result can't clobber fresh state, a raw
  value reaches layout math un-clamped, a render loop survives context loss) →
  **interaction-resilience**; the *structural* "missed shared primitive /
  duplication" behind a hand-rolled guard → **ui-and-modularity**.
- **Layout/styling on a phone** — the *mobile-specific* break (overflow at
  375px, sub-44px tap target, hover-only control, missing safe-area,
  input-zoom) → **mobile-ux**; the *missed token / duplication* behind it →
  **ui-and-modularity**; raw perf (bundle, GPU cost, main-thread jank) →
  **performance-audit**. Mobile-ux *finds from code*; **live-journey-qa**
  *proves at runtime*.

---

## rkportfolio Project Binding (pre-filled for all prompts)

Single-app repo: a portfolio site with a heavy WebGL/animation front.
**No backend, no database, no API routes, no auth, no payments, no i18n.**
Lenses that probe those areas should note "N/A by architecture" and move on —
not pad the report.

### Frontend
| Field | Value |
|---|---|
| Framework / renderer | Next.js 15 App Router, React 19, TypeScript 5.9 (`strict`) |
| Dev server | `yarn dev` → port **3002** |
| Component-local state / effect / memo | `useState` / `useEffect` / `useMemo` — no state library; hooks under `src/app/hooks/` (e.g. `useDevice.ts`) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/postcss`) |
| Design tokens | `src/styles/colors.ts`, `src/styles/sizing.ts`, `src/styles/typography.ts`; fonts in `src/styles/fonts.css` (Alien Encounters, Nabla) — no raw hex/px in components |
| 3D / animation | Three.js 0.182 (WebGL particles, custom vertex shaders — `src/app/components/CosmicDustThree.tsx`), GSAP, framer-motion, `@react-spring/web`, `@use-gesture/react` |
| Canvas rules | CLAUDE.md canvas section applies hard: never set `canvas.width/height` per frame; DPR-aware sizing; render at display size × DPR |
| Reduced motion | `prefers-reduced-motion` MUST gate every animation — this is an animation-heavy site, treat a missing gate as a real finding |
| Page / component globs | `src/app/**/page.tsx`, components under `src/app/components/` |
| Out of scope | `out/` (build output), `public/` binaries |

### Security binding (static-site scope)
| Field | Value |
|---|---|
| Attack surface | No auth, no payments, no user data, no server mutations — the surface is headers, dependencies, and client-side code |
| Headers / CSP | Defined in `next.config.js` `headers()` (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy). CSP currently allows `unsafe-inline`/`unsafe-eval` — changes here are `needs-review` (can silently break Next/Three at runtime) |
| Secrets | None should exist client-side; anything not prefixed `NEXT_PUBLIC_` must not reach the bundle |
| XSS | React escapes by default — flag any `dangerouslySetInnerHTML` |
| Dependencies | `npm audit` / lockfile check is in scope |

### Performance binding
| Field | Value |
|---|---|
| Hosting / runtime | Railway, Node server (`output: 'standalone'` in `next.config.js`) |
| Budgets (targets) | LCP < 2.5s; three.js/GSAP lazy-loaded where possible (never in the shared layout bundle); 60fps render loop on mid-range mobile; zero long tasks from animation setup |
| Hot spots | the Three.js particle system (GPU vertex-shader path — recent perf work lives here, see `git log`), font loading (large custom TTFs), image formats (avif/webp configured) |
| Profiling tools | Chrome DevTools MCP (`web-perf` skill), Lighthouse, React DevTools profiler, `performance.mark()` |

### Mobile-UX binding
| Field | Value |
|---|---|
| Reference viewport(s) | 375×667 primary (CLAUDE.md "mobile first"); sanity 360 + 390–414 |
| Styling solution | Tailwind 4 utility classes + tokens from `src/styles/` |
| Touch-target min | 44×44px (Apple HIG / WCAG) |
| Touch input | `@use-gesture/react` for gestures; hover-only interactions are a finding |
| Fullscreen / viewport | mobile fullscreen + `theme-color` handling was recent work (see `git log`) — regressions here are high-severity |
| Reduced-motion convention | gate on `@media (prefers-reduced-motion: reduce)` — see Frontend binding |
| Audit-report path | `docs/audits/<TODAY>-mobile-ux.md` |
| Dynamic-lens handoff | `live-journey-qa` against `yarn dev` on port 3002 (safe — no prod mutations possible) |

### Commands
```bash
# Type-check (exit 0 required)
npx tsc --noEmit

# Lint
yarn lint

# Build (must succeed)
yarn build

# Dependency audit
npm audit
```

### Test infrastructure (for unit-test-plan)
None yet. No runner is configured. `unit-test-plan` should first judge whether
unit tests pay their way here at all — the risk profile is visual/perf, not
money/stock/auth — and if so, propose the smallest useful harness (likely
Vitest on the pure utility layer: `src/styles/*.ts` tokens, hooks, any math
extracted from the render loop). Do not propose testing Three.js output.

### Branch / deploy policy
`main` is the only long-lived branch and Railway builds from it. Audit fixes go
on `audit/<YYYY-MM-DD>` off current HEAD; never push, never merge — the user
reviews (visuals especially) and merges/deploys themself. Full gate green
before reporting done. Commit trailer:
`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
