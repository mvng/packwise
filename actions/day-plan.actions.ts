'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function reorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }
  try {
    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id: dayPlanId },
      include: { trip: true }
    })
    if (!dayPlan || dayPlan.trip.userId !== userId) {
      return { error: 'Unauthorized' }
    }
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.dayPlanItem.update({ where: { id, dayPlanId }, data: { order: index } })
      )
    )
    revalidatePath('/trip/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to reorder day plan items:', error)
    return { error: 'Failed to reorder day plan items' }
  }
}
