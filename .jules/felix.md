## 2026-06-23 - [Fix: redirect to forked trip after login]
**Learning:** Next.js auth logic needs to correctly check sessionStorage for intended redirects before generically routing to `/dashboard`.
**Action:** Always verify local/session storage intent handlers when modifying auth flows.