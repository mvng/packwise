## 2026-06-18 - Missing sessionStorage Cleanup on Auth Redirect
**Learning:** In Next.js client-side auth flows, using `window.location.href` for an unconditional redirect will short-circuit any pending logic if an intended action was stored in `sessionStorage` (like a post-login fork). Intercepting the redirect to process and clean up local/session storage is required.
**Action:** Always verify if a login/signup component is designed to handle deferred actions from unauthenticated states before modifying its redirect logic.
