# Security audit update — 2026-10-28

## Scope and confidence

This is a repository-level review of the API and web dependency tree, selected authentication/authorization paths, Docker Compose exposure, and CI configuration. It is **not** a penetration test, production-host inspection, or a complete browser/device test.

The code checked during this review is on branch `security/audit-refresh-2026-10-28`; changes are not effective on `main` until the PR is reviewed and merged.

## Verified changes

| Area | Change | Evidence |
|---|---|---|
| Reproducible dependency tree | Added lockfiles for `apps/api` and `apps/web`; security workflow now installs with `npm ci` | [Run #40702924652](https://github.com/paulafanasyev/svetlana_tutor/actions/runs/40702924652), both audit jobs passed |
| API runtime dependency | Updated Zod from `^3.23.8` to `^4.6.7` | API lockfile resolves Zod 4.6.7; [API tests run #40702644210](https://github.com/paulafanasyev/svetlana_tutor/actions/runs/40702644210) passed 47/47 tests |
| Web router dependency | Updated `react-router-dom` from `^6.26.2` to `^7.18.5` | Lockfile resolves both `react-router` and `react-router-dom` 7.18.5; final Web CI/production build must be checked on this PR before merge |
| Automated production dependency audit | Added `.github/workflows/security-audit.yml` to audit API and web locked production dependencies on changes and manual dispatch | Run #40702924652: API `npm audit --omit=dev` reported 0 total findings; Web reported 0 total findings |
| Stale security statements | Corrected the July audit's outdated claims about missing login lockout and nonexistent lockfiles; the older file now points to this dated addendum | `SECURITY_AUDIT.md` on this branch |

## Initial findings and remediation

The first run against the generated dependency tree detected:
- API: one high-severity Zod advisory, GHSA-mrhx-c7xc-m3w5, concerning memory exhaustion during validation of oversized unbounded collections. See the [GitHub Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- Web: two moderate React Router advisories, GHSA-wrjc-x8rr-h8h6 (open redirect via backslash in navigation) and GHSA-337j-9hxr-rhxg (SSR hydration error deserialization). See [open-redirect advisory](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) and [SSR advisory](https://github.com/advisories/GHSA-337j-9hxr-rhxg). The SSR advisory notes that Declarative Mode apps without manual SSR/hydration are not affected by that particular issue, but the router upgrade also addresses the separate navigation issue.

Updated the runtime dependencies to Zod 4.6.7 and React Router 7.18.5; generated and committed corresponding lockfiles on this branch. The latest lockfile-based production scan returned zero findings for both packages. This does not imply zero vulnerabilities in development dependencies or prove that every code path is safe.

## Authentication and API controls verified from source

- Login brute-force guard: 5 failures per email+IP; 50 failures across IPs per email within a 15-minute window; lock lasts 15 minutes. A successful login clears that email+IP counter.
- Guard state is in process memory. It is not shared among replicas and is lost on restart; use a shared backing store such as Redis for multi-replica production.
- Login failures use a generic response; passwords are bcrypt-hashed; access tokens are short-lived; refresh-token rotation and replay detection are implemented.
- JWT verification pins HS256. Production startup rejects missing/weak placeholder secrets.
- Helmet/CSP, explicit CORS origin allowlist, authentication and role checks, per-owner scoping, body-size cap and upload size/MIME validation are present in the reviewed files.
- Docker Compose binds API, Postgres and optional Adminer ports to loopback. HTTPS termination and correct `CORS_ORIGINS` remain deployment responsibilities.

## Residual risks / not proven

1. No MFA is implemented.
2. Login guard and rate-limit state are per process; protections weaken across multiple API replicas unless a shared store is used.
3. No centralized log aggregation/alerting is configured by default.
4. Production runtime behavior, real hosting environment variables, reverse-proxy settings, account recovery, and penetration-test scenarios were not executed in this review.
5. The lockfile audit covers production dependencies only (`npm audit --omit=dev`); dev dependencies and system-level packages require a separate scan.
6. The web router v7 upgrade is a major-version change. Do not merge until Web CI passes on the security branch and preview smoke tests verify navigation, login routing, course selection, and refresh/back navigation.

## Operational conclusion

**Dependency scan: VERIFIED on candidate branch.** **API test suite: VERIFIED, 47/47 tests passed on the commit used for that run.** **Web v7 compatibility: PENDING final CI/preview verification.** **Production deployment security: NOT PROVEN by this repository scan.**
