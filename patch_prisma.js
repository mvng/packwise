const fs = require('fs')
let content = fs.readFileSync('lib/prisma.ts', 'utf8')

// If `globalForPrisma.prisma.tripTask` is undefined, we need a new instance.
const newContent = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force a new instance if we somehow have a stale one without tripTask
if (globalForPrisma.prisma && !('tripTask' in globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
`

fs.writeFileSync('lib/prisma.ts', newContent)
