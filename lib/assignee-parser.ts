import { prisma } from '@/lib/prisma'

export function extractAssigneeName(text: string): { name: string; cleanText: string } | null {
  const match = text.match(/@(\w+)/)
  if (!match) return null
  const assigneeName = match[1]
  const cleanText = text.replace(match[0], '').trim()
  return { name: assigneeName, cleanText }
}

export async function findOrCreateTripMember(tripId: string, name: string) {
  const existingMember = await prisma.tripMember.findFirst({
    where: {
      tripId,
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  })

  if (existingMember) {
    return existingMember
  }

  return prisma.tripMember.create({
    data: {
      tripId,
      name,
    },
  })
}
