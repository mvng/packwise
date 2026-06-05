'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'


export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthorized')

  // Verify ownership of the DayPlan
  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: dayPlanId },
    include: { trip: true },
  })

  if (!dayPlan || dayPlan.trip.userId !== userId) {
    throw new Error('Unauthorized or DayPlan not found')
  }

  // Verify all ordered items belong to this day plan
  const existingItems = await prisma.dayPlanItem.findMany({
    where: {
      id: { in: orderedIds },
    },
    select: { id: true, dayPlanId: true },
  })

  if (existingItems.length !== orderedIds.length) {
    throw new Error('Some items do not exist')
  }

  const invalidItems = existingItems.filter(item => item.dayPlanId !== dayPlanId)
  if (invalidItems.length > 0) {
    throw new Error('Some items do not belong to this DayPlan')
  }

  // Perform the update
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
