
## 2024-05-24 - Handle post-login redirects stored in sessionStorage
**Learning:** When implementing custom post-login redirects in Next.js (e.g., redirecting a user to a newly forked trip), verify `sessionStorage` for stored redirect intents and process them completely before falling back to default routing (like `window.location.href = '/dashboard'`), ensuring the default route does not prematurely override the intended redirect flow.
**Action:** Always check `sessionStorage` or redirect URL parameters for intent before applying default auth routing.
