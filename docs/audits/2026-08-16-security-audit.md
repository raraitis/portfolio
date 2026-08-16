# Security Audit — rkportfolio

- **Date:** 2026-08-16
- **Lens:** security (per `/Users/raitiskraslovskis/projects/prompts/webapp/security-audit.md`, grounded in the rkportfolio binding in `docs/audits/webapp-audit-runner.md`)
- **Scope:** headers/CSP in `next.config.js`, secrets-in-bundle, XSS surface, dependency health (`src/**` + config; `out/` and `public/` binaries excluded)
- **Branch:** `audit/2026-08-16`
- **Baseline (verified by orchestrator, not re-run):** `npx tsc --noEmit` exit 0, `yarn lint` clean, `yarn build` succeeds.

## Threat model (static-site scope)

Per the binding: no auth, no payments, no user data, no API routes, no server
mutations. The app is a Next.js 15 App Router site served by a Node server
(`output: 'standalone'`) on Railway. The realistic surface is:

- **The Node server itself** — framework CVEs (DoS, cache poisoning) against a
  public endpoint; the always-on `/_next/image` optimizer endpoint.
- **Response headers** — CSP/HSTS posture of what the server emits.
- **The client bundle** — accidental secrets, XSS escape hatches.
- **Supply chain** — dependencies pulled at build time on Railway.

Adversaries are opportunistic (bots, mass scanners, DoS). There is nothing of
value to exfiltrate; impact is availability and defacement-class XSS.

## N/A by architecture (checked, not padded)

- Auth/session, authorization/IDOR, payments/PCI, file upload, SQL/NoSQL
  injection, SSRF, email injection, admin panel, business logic, security-event
  logging: **N/A** — no backend logic exists (`src/` has zero `fetch`, zero API
  routes, zero form posts).
- **Secrets-in-bundle: clean.** `grep -rn "process.env\|NEXT_PUBLIC" src/`
  returns nothing; no `.env*` file is git-tracked (checked `git ls-files` and
  `git log --all -- "*.env*"`); no keys/tokens in source.
- **XSS surface: clean.** No `dangerouslySetInnerHTML`, `innerHTML`, `eval`,
  `document.write`, or URL-param rendering anywhere in `src/`. All rendered
  strings are static constants. The only external links
  (`src/app/components/PortfolioSection.tsx:46-47`) correctly use
  `target='_blank' rel='noopener noreferrer'`.
- **Source maps:** `productionBrowserSourceMaps` not enabled (default off) — clean.

## Findings

### [HIGH] SEC-01 — next@15.5.12 carries ~10 patched runtime advisories (DoS, cache poisoning) on a public Node server
- **Severity:** high
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** lens §9 Dependency & Supply Chain ("known security advisories for the installed framework version"); CLAUDE.md "Audit dependencies periodically"
- **Where:** package.json:26 (`"next": "^15.5.9"`), yarn.lock (`next@15.5.12`), package-lock.json (`next 15.5.12`)
- **OWASP:** A06:2021 Vulnerable and Outdated Components
- **Evidence:** `npm audit` flags `next` (direct, prod) as high. Installed 15.5.12; fixes land in 15.5.13–15.5.21. Advisories that apply to this deployment (App Router on a standalone Node server, publicly reachable): GHSA-q4gf-8mx6-v5v3 + GHSA-8h8q-6873-q5fj (DoS via Server Components, high), GHSA-mg66-mrh9-m8jx (connection-exhaustion DoS, high), GHSA-m99w-x7hq-7vfj (DoS via Server Actions, high), GHSA-h64f-5h5j-jqjh + GHSA-q8wf-6r8g-63ch (Image Optimization API DoS — endpoint is live, see SEC-04), GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q (cache confusion), GHSA-955p-x3mx-jcvp (Server Function endpoint disclosure). Middleware/rewrite/i18n advisories do not apply (none configured).
- **Attack scenario:** any unauthenticated scanner replays a public PoC for the Server-Components DoS against the Railway URL; the single Node process hangs or exhausts connections; site down.
- **Proposed fix:** bump `next` to the latest 15.5.x patch (>= 15.5.21) in `package.json`, regenerate the lockfile(s) (see SEC-05 for which), then run the full gate (`npx tsc --noEmit`, `yarn lint`, `yarn build`). Patch-range bump within 15.5.x — mechanical; the gate catches build breakage.

### [MEDIUM] SEC-02 — CSP allows `unsafe-eval` + `unsafe-inline` for scripts and omits `base-uri` / `form-action` / `object-src`
- **Severity:** medium
- **Fix risk:** needs-review (binding: any CSP change can silently break Next/Three at runtime)
- **Auto-fixable:** no
- **Rule:** lens §3 XSS ("Is `unsafe-eval` used anywhere? Flag it.") + §8 Security Headers; binding "Security binding" row on CSP
- **Where:** next.config.js:19-23
- **OWASP:** A05:2021 Security Misconfiguration
- **Evidence:**
  ```js
  value:
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
  ```
  `'unsafe-eval'` is only required by Next.js **dev** (HMR); the production
  bundle of Next 15 / Three 0.182 / GSAP / framer-motion does not call
  `eval`/`new Function`. `base-uri` and `form-action` do **not** fall back to
  `default-src`, so an injected `<base>` tag or form exfiltration target is
  currently unrestricted. `object-src` falls back to `'self'` instead of `'none'`.
- **Attack scenario:** any future XSS foothold (e.g. a vulnerable dependency injecting markup) is unconstrained: `unsafe-eval` lets it run arbitrary strings, and a missing `base-uri` lets injected `<base href="https://evil/">` hijack every relative script/asset URL.
- **Proposed fix (needs-review):** make the CSP env-conditional in `next.config.js` — production value drops `'unsafe-eval'` and appends `base-uri 'self'; form-action 'self'; object-src 'none'`; dev keeps `'unsafe-eval'`. Keep `'unsafe-inline'` for now (Next's inline bootstrap scripts need it without a nonce pipeline). Verification: load the deployed page with DevTools console open and confirm zero CSP violation reports while the Three.js scene animates and fonts render — the gate cannot catch this.

### [MEDIUM] SEC-03 — No `Strict-Transport-Security` header
- **Severity:** medium
- **Fix risk:** needs-review (domain-wide effects; `includeSubDomains`/`preload` can break other subdomains)
- **Auto-fixable:** no
- **Rule:** lens §8 Required Headers table (HSTS "Downgrade attacks")
- **Where:** next.config.js:12-52 (the `headers()` block — HSTS absent)
- **OWASP:** A05:2021 Security Misconfiguration / A02:2021 Cryptographic Failures
- **Evidence:** the headers array sets CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy — no `Strict-Transport-Security`. Railway terminates TLS but does not inject HSTS for custom domains; the app must emit it.
- **Attack scenario:** a user types `raitiskraslovskis.com` (defaults to `http://`); an on-path attacker on public Wi-Fi intercepts the first plaintext request and serves a spoofed page instead of the 301 to HTTPS.
- **Proposed fix (needs-review):** add `{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }` to the headers array — **after confirming** every subdomain of the apex is HTTPS-capable. Do not add `preload` until the owner opts in deliberately.

### [MEDIUM] SEC-04 — Unused `/_next/image` optimizer endpoint live, backed by vulnerable sharp/libvips
- **Severity:** medium
- **Fix risk:** safe (no `next/image` usage anywhere — removal is pure surface reduction; gate verifies build)
- **Auto-fixable:** yes
- **Rule:** lens §6 Production Configuration ("test/debug endpoints still active") + §9; CLAUDE.md "Remove unused packages"
- **Where:** next.config.js:6-9; consumer check: `grep -rn "next/image" src/` → no matches
- **OWASP:** A05:2021 Security Misconfiguration / A06:2021 Vulnerable Components
- **Evidence:**
  ```js
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  ```
  No component imports `next/image` and `public/` contains no images (fonts,
  robots.txt, workers only), yet the standalone server still exposes
  `/_next/image` with `sharp@0.34.3` behind it — flagged high by `npm audit`
  (GHSA-f88m-g3jw-g9cj, inherited libvips CVE-2026-33327/33328/35590/35591),
  plus optimizer DoS advisories GHSA-h64f-5h5j-jqjh / GHSA-3x4c-7xq6-9pq8 in
  the installed next version.
- **Attack scenario:** a bot hammers `/_next/image?url=...&w=...&q=...` permutations; even rejected requests burn CPU in a parser with known CVEs, and accepted ones grow the on-disk cache unbounded (GHSA-3x4c-7xq6-9pq8) on the Railway volume.
- **Proposed fix:** replace the `images` block with `images: { unoptimized: true }` (disables the endpoint and drops runtime sharp from the standalone output). Pre-condition for the fixer: re-run `grep -rn "next/image" src/` and confirm it is still empty. SEC-01's version bump also patches the optimizer advisories, but disabling an unused endpoint is correct regardless.

### [MEDIUM] SEC-05 — Dual lockfiles (`package-lock.json` + `yarn.lock`) committed — deploy ambiguity and drift risk
- **Severity:** medium
- **Fix risk:** needs-review (must confirm which package manager the Railway builder actually uses before deleting a lockfile)
- **Auto-fixable:** no
- **Rule:** lens §9 Lockfile Integrity; CLAUDE.md dependency management
- **Where:** package-lock.json:1, yarn.lock:1 (both in `git ls-files`); package.json:7-11 (scripts assume yarn); runner binding uses `yarn lint`/`yarn build` but `npm audit`
- **OWASP:** A08:2021 Software and Data Integrity Failures
- **Evidence:** both lockfiles are committed and currently agree (`next@15.5.12` in both), but the toolchains are split — yarn for build/lint, npm for audit/fixes. An `npm audit fix` updates only `package-lock.json`; if Railway's auto-detect picks yarn, the deployed tree silently keeps the vulnerable versions (and vice versa). No `railway.json`/`nixpacks.toml`/`Dockerfile` is committed to pin the builder.
- **Attack scenario:** SEC-01/SEC-06 get "fixed" via `npm audit fix`, the audit report goes green locally, but the Railway build installs from the untouched `yarn.lock` and ships the vulnerable versions.
- **Proposed fix (needs-review):** confirm the Railway build command, then keep exactly one lockfile — `yarn.lock` matches the scripts and binding — and delete `package-lock.json`. Document the choice (and a frozen-lockfile install for the builder) in the README or a committed Railway config. All dependency fixes in this report must be applied to the surviving lockfile.

### [MEDIUM] SEC-06 — Build-time supply chain: `tar@7.4.3` (critical advisory chain) via `@tailwindcss/oxide`, plus vulnerable eslint/postcss dev chain
- **Severity:** medium
- **Fix risk:** safe (transitive bumps of build/dev deps; gate verifies the build)
- **Auto-fixable:** yes
- **Rule:** lens §9 Dependency Audit ("report all vulnerabilities with severity >= moderate")
- **Where:** yarn.lock / package-lock.json transitive entries; paths: `@tailwindcss/postcss@4.1.13 → @tailwindcss/oxide@4.1.13 → tar@7.4.3`; `eslint@9.35.0 → ajv@6.12.6, minimatch@3.1.2 → brace-expansion@1.1.12`; `postcss@8.5.6` (direct dev) and next's bundled `postcss@8.4.31 → nanoid@3.3.11`
- **OWASP:** A06:2021 Vulnerable and Outdated Components
- **Evidence:** `npm audit`: 11 vulnerabilities (1 critical, 9 high, 1 moderate). Critical: `tar <= 7.5.20` (GHSA-23hp-3jrh-7fpw decompression DoS + 11 path-traversal/overwrite advisories) — runs in the Railway **build** environment via oxide's native-binary handling, not at runtime. High (all build/dev-time): postcss sourceMappingURL arbitrary-file-read chain (GHSA-6g55-p6wh-862q et al.), minimatch/brace-expansion/picomatch ReDoS, flatted prototype pollution, js-yaml merge-key DoS, ajv ReDoS, nanoid loop. None are reachable by a site visitor; all process only repo-controlled input at build time.
- **Attack scenario:** supply-chain only — a poisoned tarball or CSS with a hostile `sourceMappingURL` processed during a Railway build could read/write files in the build container. Low likelihood, contained blast radius (build env holds no secrets in this project).
- **Proposed fix:** after SEC-05 settles the lockfile, refresh transitive ranges (`yarn up -R tar postcss minimatch brace-expansion picomatch flatted js-yaml ajv nanoid` or `npm audit fix` on the surviving lockfile; use `resolutions`/`overrides` only for any that don't move). Re-run `npm audit` and the full gate.

### [LOW] SEC-07 — Deprecated `X-XSS-Protection: 1; mode=block` header
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** lens §8 Security Headers (header hygiene)
- **Where:** next.config.js:34-38
- **OWASP:** A05:2021 Security Misconfiguration
- **Evidence:**
  ```js
  // XSS Protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  ```
  The XSS Auditor is removed from all modern browsers; in legacy browsers the
  `1; mode=block` filter itself enabled XS-Leaks/selective-blocking attacks.
  Current guidance (OWASP, MDN) is to remove the header (or send `0`) and rely
  on CSP.
- **Proposed fix:** delete the header entry (lines 34-38). Not a CSP change — mechanical removal.

### [LOW] SEC-08 — Missing `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` hardening headers
- **Severity:** low
- **Fix risk:** needs-review (COOP/CORP can affect popup handshakes and cross-origin asset consumers; none known here, but runtime-only verification)
- **Auto-fixable:** no
- **Rule:** lens §8 Required Headers table (COOP/CORP rows)
- **Where:** next.config.js:12-52 (absent from the `headers()` block)
- **OWASP:** A05:2021 Security Misconfiguration
- **Evidence:** headers block sets neither `Cross-Origin-Opener-Policy: same-origin` nor `Cross-Origin-Resource-Policy: same-origin`. All assets (fonts, worker file, scripts) are same-origin, and the only `window.open`-class interactions are plain `target='_blank'` links with `noopener`, so both values should be compatible.
- **Proposed fix (needs-review):** add both headers with `same-origin`; verify in a deployed check that the `_blank` portfolio links and font loading still behave.

### [LOW] SEC-09 — `security.txt` advertises four dead endpoints
- **Severity:** low
- **Fix risk:** needs-review (which contact address is actually monitored is an owner decision)
- **Auto-fixable:** no
- **Rule:** lens §6 Production Configuration (published security contact must work); RFC 9116
- **Where:** public/.well-known/security.txt:1-7
- **OWASP:** A05:2021 Security Misconfiguration (information quality)
- **Evidence:** the file references `mailto:security@raitiskraslovskis.com`, `https://raitiskraslovskis.com/pgp-key.txt`, `/security-policy`, and `/security-acknowledgments`. None exist: `public/` contains only `fonts/`, `robots.txt`, `workers/`, `.well-known/`, and the app has only `/` and the 404 route (`src/app/page.tsx`, `src/app/not-found.tsx`). The site itself publishes `raraitis@gmail.com` (src/app/page.tsx:72). A researcher following the advertised channel hits 404s / a possibly unmonitored mailbox. `Expires: 2026-12-31` is still valid but rolls over in 4.5 months.
- **Proposed fix (needs-review):** reduce the file to fields that are real — a monitored `Contact:` mailto (owner to confirm which), `Expires`, `Canonical`, `Preferred-Languages` — and delete the `Encryption`/`Policy`/`Acknowledgments` lines until those URLs exist.

### [LOW] SEC-10 — Orphaned `public/workers/backgroundWorker.js` served publicly
- **Severity:** low
- **Fix risk:** safe
- **Auto-fixable:** yes
- **Rule:** lens §6 ("test/debug endpoints still active in production"); CLAUDE.md "Don't leave dead code"
- **Where:** public/workers/backgroundWorker.js:1-7070B; consumer check: `grep -rn "worker" src/` → no matches
- **OWASP:** A05:2021 Security Misconfiguration (unnecessary exposed surface)
- **Evidence:** the file self-describes as "Background Animation Web Worker (Public Build) — compiled version served from /public/workers/", but nothing in `src/` constructs a `Worker` or references the path; the Canvas-2D worker era was replaced by the Three.js pipeline (see `git log`: "eliminate Canvas 2D rAF loop"). It contains no `importScripts`/`fetch` (verified), so it is not exploitable — it is dead code exposed at a stable URL, expanding the audit surface for no benefit.
- **Proposed fix:** delete `public/workers/backgroundWorker.js` (and the now-empty `public/workers/` directory). Pre-condition for the fixer: re-run the grep to confirm zero references.

## Remediation order

1. **High, safe:** SEC-01 (bump next to >= 15.5.21) — but sequence *after* SEC-05's lockfile decision so the bump lands in the lockfile Railway actually uses.
2. **Medium, safe:** SEC-04 (disable unused image optimizer), SEC-06 (transitive dep refresh).
3. **Medium, needs-review:** SEC-05 (lockfile consolidation — unblocks 1 and 2 properly), SEC-02 (prod CSP without `unsafe-eval`), SEC-03 (HSTS).
4. **Low:** SEC-07, SEC-10 (safe deletes); SEC-08, SEC-09 (owner review).

## Counts

| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | — |
| High | 1 | SEC-01 |
| Medium | 5 | SEC-02, SEC-03, SEC-04, SEC-05, SEC-06 |
| Low | 4 | SEC-07, SEC-08, SEC-09, SEC-10 |

Safe + auto-fixable: **5** (SEC-01, SEC-04, SEC-06, SEC-07, SEC-10). Needs-review: **5** (SEC-02, SEC-03, SEC-05, SEC-08, SEC-09).
