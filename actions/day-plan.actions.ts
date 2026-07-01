'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  const userId = await getUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Find the day plan to check authorization and get the trip ID
  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: dayPlanId },
    include: { trip: { include: { members: true } } },
  })

  if (!dayPlan) {
    throw new Error('Day plan not found')
  }

  // Authorization check
  const isOwner = dayPlan.trip.userId === userId
  const isMember = dayPlan.trip.members.some((m) => m.userId === userId)
  if (!isOwner && !isMember) {
    throw new Error('Forbidden')
  }

  // IDOR check: ensure all orderedIds actually belong to this dayPlan
  const items = await prisma.dayPlanItem.findMany({
    where: {
      id: { in: orderedIds },
      dayPlanId: dayPlanId,
    },
    select: { id: true },
  })

  if (items.length !== orderedIds.length) {
    throw new Error('Invalid item IDs provided for this day plan')
  }

  // Execute reorder in a transaction
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.dayPlanItem.update({
        where: { id },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/trip/${dayPlan.tripId}`)
}
