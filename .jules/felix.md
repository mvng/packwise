
## 2024-07-01 - Missing Server Actions for Secure Data Mutations
**Learning:** Found an IDOR vulnerability where drag-and-drop state was synced directly via an unauthenticated REST API endpoint (`/api/day-plan-items/reorder`) instead of utilizing secure Next.js Server Actions with proper ownership and authorization validation.
**Action:** When working on mutations in Next.js App Router, always ensure they are implemented as Server Actions with built-in authentication, resource ownership authorization, and explicit IDOR checks, rather than generic API routes without validation.
