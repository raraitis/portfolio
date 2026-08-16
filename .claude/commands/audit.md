---
description: Run the web-app audit suite end to end — find, then fix, then verify.
argument-hint: "[lenses] [report-only|fix]   e.g. 'security', 'full', 'performance report-only'"
---

Orchestrate the web-app audit suite (find → consolidate → fix → verify) against this
repo. The reusable lens prompts live in `/Users/raitiskraslovskis/projects/prompts/webapp`;
the pre-filled rkportfolio binding, run order, and ownership boundaries live in
`docs/audits/webapp-audit-runner.md`. Read that runner first.

## Scope from arguments
Parse `$ARGUMENTS`:
- **Lenses** — explicit names (`security`, `performance`, `state`, `ssot`,
  `ui-modularity`, `resilience`, `mobile-ux`, `comment-debloat`) or `full`. The
  `resilience` lens (`interaction-resilience-audit.md`) checks runtime robustness:
  error boundaries isolating crashes, async-race + un-clamped-input guards,
  animation/render-loop teardown. Default: full pass in the runner's documented
  order. This is a single-app frontend-only repo — there is no app filter and no
  backend lens. `mobile-ux` pairs with `live-journey-qa` to confirm runtime
  findings.
- **Mode** — `report-only` (stop after findings) or `fix` (default: audit then fix
  the safe set). If arguments are ambiguous, default to **report-only** and confirm
  before any edit.

## Phase 1 — AUDIT (parallel)
Dispatch the `webapp-auditor` subagent once per selected lens, **all in one message**
(multiple Agent calls) so they run concurrently. Give each its lens.
Each returns a report path under `docs/audits/<date>-<lens>.md` plus severity counts.

## Phase 2 — CONSOLIDATE (checkpoint)
Read the reports. Present ONE ranked plan to the user:
- All findings across lenses, **deduped at the ownership seams** (don't list the same
  code twice under two lenses).
- Sorted by severity; split into **Safe to auto-fix** vs **Needs your call** (with the
  reason each is risky).
If mode is `report-only`, stop here with that plan. Otherwise continue — the user can
interrupt.

## Phase 3 — FIX (safe set only)
Dispatch the `webapp-fixer` subagent (one per report, or per lens) to implement only
the `safe` + `auto-fixable` findings, under the full gate, small scoped commits on an
`audit/<date>` branch. Risky findings are surfaced, never auto-fixed. Fixers run
sequentially if they touch the same files (avoid commit races); otherwise they may
parallelise.

## Phase 4 — VERIFY + REPORT
- Run the full gate (type-check + lint + build; commands in the binding). Report
  exit codes honestly.
- Update `docs/audits/QA_AUDIT.md`: mark resolved items, add the new findings
  (including deferred ones).
- Final summary table: `lens | found | fixed | deferred | gate`.
- **Never** push or deploy. Deploying is a separate explicit step the user asks for.
