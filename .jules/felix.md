## 2026-03-12 - Prisma module mocking in tests
**Learning:** In ES module/Next.js environments, applying mock properties directly to an imported instance (`Object.defineProperty(prisma, ...)`) can cause tests to fail because the module exports aren't reliably intercepted, or properties return falsish results.
**Action:** When fixing failing unit tests that mock the Prisma client, import the entire module (`import * as prismaModule from '../lib/prisma'`) and apply the mock directly to the exported module property (`Object.defineProperty(prismaModule, 'prisma', ...)`).
