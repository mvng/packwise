'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  const userId = await getUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify that the dayPlan belongs to a trip the user has access to
  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: dayPlanId },
    include: {
      trip: {
        include: {
          members: true
        }
      }
    }
  })

  if (!dayPlan) {
    throw new Error('Day plan not found')
  }

  const isOwner = dayPlan.trip.userId === userId
  const isMember = dayPlan.trip.members.some(member => member.userId === userId)

  if (!isOwner && !isMember) {
    throw new Error('Unauthorized')
  }

  // We must verify that all orderedIds actually belong to this dayPlanId
  // to prevent IDOR vulnerabilities (e.g. reordering items in another user's trip)
  const items = await prisma.dayPlanItem.findMany({
    where: { id: { in: orderedIds } },
    select: { dayPlanId: true }
  })

  const invalidItems = items.filter(item => item.dayPlanId !== dayPlanId)
  if (invalidItems.length > 0) {
    throw new Error('Unauthorized or invalid item IDs')
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.dayPlanItem.update({
        where: { id },
        data: { order: index }
      })
    )
  )

  revalidatePath(`/trip/${dayPlan.tripId}`)
}
