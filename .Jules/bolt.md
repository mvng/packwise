## 2024-07-08 - Optimize deeply nested Prisma include queries
**Learning:** Using deeply nested Prisma include directives (over 3 levels deep like trips -> lists -> categories -> items) with PostgreSQL causes massive Cartesian products, memory bloat, and network payload explosion.
**Action:** Replace deeply nested includes with parallel Promise.all findMany queries and stitch the relationships back together in application memory using O(n+m) dictionary lookups.
