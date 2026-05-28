'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthorized')

  // Verify ownership of the trip associated with the day plan
  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: dayPlanId },
    include: { trip: true },
  })

  if (!dayPlan || dayPlan.trip.userId !== userId) {
    throw new Error('Unauthorized or Day Plan not found')
  }

  // IDOR check: Verify all items actually belong to this day plan
  const existingItems = await prisma.dayPlanItem.findMany({
    where: { id: { in: orderedIds }, dayPlanId },
  })

  if (existingItems.length !== orderedIds.length) {
    throw new Error('Invalid item IDs provided for this day plan')
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.dayPlanItem.update({
        where: { id },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/trip/${dayPlan.trip.id}`)
  return { success: true }
}
