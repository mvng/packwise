## 2025-03-01 - Missing Supabase Credentials for Tests
**Learning:** Playwright tests (or Next.js build/dev server) crash if the database interactions are required but `.env.local` contains dummy placeholders like `[PROJECT-REF]` instead of real credentials, or if `NEXT_PUBLIC_SUPABASE_URL` is completely missing. This causes the `next/cache` mock and other server-side components to fail during test initialization if they reach out to the database via Prisma or the Supabase client. Wait, for tests in unit mode (`playwright-unit.config.ts`), we already mocked Prisma. However, some integration tests try to hit `localhost:3000` which isn't running or crashes due to missing env vars.
**Action:** When running tests that require `localhost:3000` (E2E), ensure the dev server is successfully running and `.env.local` has valid syntax or test credentials. For unit tests, ensure the specific tests (like `luggage.test.ts`) are not trying to navigate to `localhost:3000` if they are supposed to be unit tests, or if they are E2E tests, ensure the environment is correctly set up.

## 2025-03-13 - Flattened Cartesian query for getSharedTripById
**Learning:** When doing deeply nested `include`s in Prisma with Postgres, the database creates a Cartesian product of all relationships (e.g. 5 categories with 20 items creates thousands of duplicated DB rows across network), massively slowing down queries and bloating Node memory.
**Action:** Flatten the relationships into parallel `Promise.all` `findMany` queries and stitch the JSON tree back together in application memory.

## 2025-03-18 - Type strictness with Prisma Transactions
**Learning:** When collecting different Prisma operations (like `.update` and `.create`) into an array to be executed by `prisma.$transaction()`, explicitly typing the array as `Promise<any>[]` will cause a TypeScript build failure. Prisma requires `PrismaPromise`, which has internal brand properties that native Promises lack.
**Action:** When building dynamic arrays of Prisma operations for transactions, type the array explicitly as `any[]` (or strictly as `PrismaPromise<any>[]` if all elements conform) to prevent build failures during `next build`.


## 2025-03-24 - GroupBy over include in Prisma
**Learning:** Using Prisma's `groupBy` combined with `_sum` to aggregate values directly in the database is drastically faster and uses less memory compared to querying the entire relationship tree with `include: { items: true }` and reducing the arrays in Node.js.
**Action:** Always favor database-level aggregations over fetching and looping over large object arrays for generating progress or aggregate statistics.
