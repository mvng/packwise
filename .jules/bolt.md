## 2024-06-25 - Prevent N+1 loops via transaction accumulation
**Learning:** In Next.js Server Actions or route handlers, executing `prisma.packingItem.create` or `prisma.packingItem.update` within a `for...of` loop causes an N+1 performance bottleneck and multiple DB roundtrips.
**Action:** When creating or updating items in bulk where `createMany` isn't fully applicable (e.g. updating some items and creating others), accumulate the Prisma Promise objects (like `prisma.packingItem.create({ ... })`) into an array and execute them concurrently using `await prisma.$transaction(dbOperations)` to eliminate the N+1 problem and improve performance.

## 2024-06-25 - Prevent N+1 loops via transaction accumulation
**Learning:** In Next.js Server Actions or route handlers, executing `prisma.packingItem.create` or `prisma.packingItem.update` within a `for...of` loop causes an N+1 performance bottleneck and multiple DB roundtrips.
**Action:** When creating or updating items in bulk where `createMany` isn't fully applicable (e.g. updating some items and creating others), accumulate the Prisma Promise objects (like `prisma.packingItem.create({ ... })`) into an array and execute them concurrently using `await prisma.$transaction(dbOperations)` to eliminate the N+1 problem and improve performance.
