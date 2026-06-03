'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'


export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id: dayPlanId },
      include: { trip: true }
    })

    if (!dayPlan) return { error: 'Day plan not found' }
    if (dayPlan.trip.userId !== userId) return { error: 'Unauthorized' }

    // IDOR protection
    const existingItems = await prisma.dayPlanItem.findMany({
      where: { dayPlanId },
      select: { id: true }
    })

    const validIds = new Set(existingItems.map(i => i.id))
    for (const id of orderedIds) {
      if (!validIds.has(id)) {
        return { error: 'Invalid item ID detected' }
      }
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
    return { success: true }
  } catch (error: unknown) {
    console.error('Error reordering day plan items:', error)
    return { error: 'Failed to reorder items' }
  }
}
